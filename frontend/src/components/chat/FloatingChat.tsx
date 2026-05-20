"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, ChevronDown, Send, Reply, Smile, GraduationCap, ChevronLeft, UserCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";

// --- Interfaces ---
interface CourseContext {
  courseId: number;
  courseTitle: string;
}

interface Reaction {
  emoji: string;
  userId: number;
}

interface Message {
  _id: string;
  threadId: string;
  senderId: number;
  text: string;
  courseContext?: CourseContext | null;
  replyTo?: { _id: string; text: string; senderId: number } | null;
  reactions: Reaction[];
  isRead: boolean;
  createdAt: string;
}

interface ChatThread {
  _id: string;
  studentId: number;
  instructorId: number;
  lastMessageAt: string;
  otherUser: { name: string; role: string };
  unreadCount?: number;
}

// Always reads the currently-logged-in user's ID fresh from localStorage.
// This bypasses stale React state and is safe because login does a full page reload.
function getActiveUserId(): number | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("userId");
  if (stored) return Number(stored);
  // Fallback: parse JWT token
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const id = payload.id ?? payload.userId;
      if (id) {
        console.log("ID from token:", id);

        localStorage.setItem("userId", String(id));
        return Number(id);
      }
    } catch { }
  }
  return null;
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // User & Socket State
  // NOTE: currentUserId is used ONLY for socket init & visibility guard.
  // For isMe checks in the message list, always use getActiveUserId() directly.
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // View State (List of Threads vs Active Thread)
  const [view, setView] = useState<"LIST" | "CHAT">("LIST");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // UI States
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojis, setShowEmojis] = useState<string | null>(null);
  const [showCourseMention, setShowCourseMention] = useState(false);
  const [sharedCourses, setSharedCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseContext | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentThreadRef = useRef<ChatThread | null>(null);

  useEffect(() => {
    currentThreadRef.current = currentThread;
  }, [currentThread]);

  // 1. Initialize user on mount and always re-read from localStorage on open
  useEffect(() => {
    const freshId = getActiveUserId();
    if (freshId) {
      setCurrentUserId(freshId);
    }
  }, []);

  useEffect(() => {
    const freshId = getActiveUserId();

    console.log("first", freshId)
    if (currentUserId !== freshId) {
      setCurrentUserId(freshId);
      // A different user logged in — tear down everything
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setThreads([]);
      setMessages([]);
      setCurrentThread(null);
      setView("LIST");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 2. Initialize Socket and fetch threads immediately if logged in
  useEffect(() => {
    if (!socket && currentUserId) {
      const token = localStorage.getItem("token") || "";
      const newSocket = io("http://localhost:3000", { auth: { token } });
      setSocket(newSocket);

      newSocket.on("connect_error", (err) => {
        console.error("Socket Connection Error:", err.message);
      });

      // Fetch threads list immediately to show correct unread counts on load
      fetchApi("/chat/threads")
        .then(res => setThreads(res.threads || []))
        .catch(err => console.error("Error fetching threads:", err));

      return () => { newSocket.close(); };
    }
  }, [currentUserId]);

  // Listen for global 'openChat' event
  useEffect(() => {
    const handleOpenChat = async (e: any) => {
      const { otherUserId } = e.detail;
      setIsOpen(true);
      setIsMinimized(false);

      try {
        const res = await fetchApi(`/chat/thread/${otherUserId}`);
        if (res.success && res.thread) {
          openThread(res.thread);
        }
      } catch (err: any) {
        console.error("Failed to open chat", err);
      }
    };

    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, [currentUserId, socket]);

  // 3. Listen for incoming socket events
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: Message) => {
      const isCurrent = currentThreadRef.current?._id === message.threadId;
      if (isCurrent) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }

      setThreads(prev => prev.map(t => {
        if (t._id === message.threadId) {
          return {
            ...t,
            lastMessageAt: message.createdAt,
            unreadCount: isCurrent ? 0 : (t.unreadCount || 0) + 1
          };
        }
        return t;
      }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
    };

    const handleNotification = (data: { threadId: string, text: string, senderId: number }) => {
      const isCurrent = currentThreadRef.current?._id === data.threadId;
      if (isCurrent) return;

      setThreads(prev => prev.map(t => {
        if (t._id === data.threadId) {
          return {
            ...t,
            unreadCount: (t.unreadCount || 0) + 1
          };
        }
        return t;
      }));
    };

    const handleMessageReacted = (data: { messageId: string, reactions: Reaction[] }) => {
      setMessages((prev) => prev.map(m =>
        m._id === data.messageId ? { ...m, reactions: data.reactions } : m
      ));
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("new_message_notification", handleNotification);
    socket.on("message_reacted", handleMessageReacted);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("new_message_notification", handleNotification);
      socket.off("message_reacted", handleMessageReacted);
    };
  }, [socket]);

  // Open specific thread
  const openThread = async (thread: ChatThread) => {
    setCurrentThread(thread);
    setView("CHAT");
    
    // Clear unread count locally in list
    setThreads(prev => prev.map(t => t._id === thread._id ? { ...t, unreadCount: 0 } : t));

    if (socket) socket.emit("join_thread", thread._id);

    try {
      // Fetch messages history
      const res = await fetchApi(`/chat/messages/${thread._id}`);
      setMessages(res.messages || []);
      scrollToBottom();

      // Fetch shared courses for `@` mention feature
      // Use getActiveUserId() here to avoid stale state at call time
      const meId = getActiveUserId();
      const otherId = meId === thread.studentId ? thread.instructorId : thread.studentId;
      const courseRes = await fetchApi(`/chat/shared-courses/${otherId}`);
      setSharedCourses(courseRes.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedCourse) return;

    if (socket && currentThread) {
      const payload = {
        threadId: currentThread._id,
        text: newMessage,
        courseContext: selectedCourse,
        replyTo: replyingTo ? replyingTo._id : null
      };

      socket.emit("send_message", payload, (res: any) => {
        if (res.success) {
          setNewMessage("");
          setReplyingTo(null);
          setSelectedCourse(null);
          setShowCourseMention(false);
        }
      });
    }
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (socket && currentThread) {
      socket.emit("add_reaction", { messageId, threadId: currentThread._id, emoji });
      setShowEmojis(null);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    const lastWord = val.split(" ").pop();
    if (lastWord && lastWord.startsWith("@")) {
      setShowCourseMention(true);
    } else {
      setShowCourseMention(false);
    }
  };

  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  // If user is not logged in, don't show the chat bubble at all
  if (!currentUserId) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-all duration-300 z-50 flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-md border border-white animate-pulse">
            {totalUnread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed right-6 bottom-0 w-80 bg-white border border-gray-200 rounded-t-xl shadow-2xl transition-all duration-300 z-50 flex flex-col overflow-hidden",
        isMinimized ? "h-14" : "h-[500px]"
      )}
    >
      {/* Header */}
      <div
        className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          {view === "CHAT" && (
            <button onClick={(e) => { e.stopPropagation(); setView("LIST"); }} className="hover:bg-blue-700 rounded p-1 -ml-2">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <h3 className="font-semibold text-sm truncate max-w-[150px] flex items-center gap-1.5">
            {view === "LIST" ? "Messages" : currentThread?.otherUser.name}
            {view === "LIST" && totalUnread > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white/20">
                {totalUnread}
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="hover:bg-blue-700 p-1 rounded transition">
            <ChevronDown className={cn("w-4 h-4 transition-transform", isMinimized && "rotate-180")} />
          </button>
          <button
            className="hover:bg-blue-700 p-1 rounded transition"
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body: Thread List View */}
      {!isMinimized && view === "LIST" && (
        <div className="flex-1 overflow-y-auto bg-white flex flex-col">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm mt-10">
              No active conversations yet.
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread._id}
                onClick={() => openThread(thread)}
                className="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer flex gap-3 items-center transition"
              >
                <div className="bg-gray-200 text-gray-600 rounded-full p-2 relative">
                  <UserCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{thread.otherUser.name}</h4>
                    {thread.unreadCount && thread.unreadCount > 0 ? (
                      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                        {thread.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {thread.lastMessageAt ? format(new Date(thread.lastMessageAt), "MMM d, h:mm a") : "New conversation"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Body: Active Chat View */}
      {!isMinimized && view === "CHAT" && (
        <>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm mt-10">
                Send a message to start the conversation
              </div>
            ) : (
              messages.map((msg) => {
                // ALWAYS use getActiveUserId() — never trust stale React state here.
                // login does a full page reload so localStorage is always authoritative.
                const myId = getActiveUserId();
                const isMe = myId !== null && String(msg.senderId) === String(myId);
                return (
                  <div key={msg._id} className={cn("group flex flex-col w-full", isMe ? "items-end" : "items-start")}>

                    {/* Reply Context */}
                    {msg.replyTo && (
                      <div className="text-xs text-gray-500 mb-1 px-2 border-l-2 border-gray-300 bg-gray-100 rounded-r py-1 truncate max-w-[85%]">
                        Replying to: {msg.replyTo.text}
                      </div>
                    )}

                    <div className="relative max-w-[85%]">
                      <div className={cn(
                        "px-4 py-2 rounded-2xl text-sm",
                        isMe ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                      )}>
                        <p>{msg.text}</p>

                        {/* Course Context Badge */}
                        {msg.courseContext && (
                          <div className="mt-2 text-xs bg-blue-50/20 text-blue-100 border border-blue-400/30 px-2 py-1 rounded inline-flex items-center gap-1 cursor-pointer hover:bg-blue-50/40">
                            <GraduationCap className="w-3 h-3" />
                            {msg.courseContext.courseTitle}
                          </div>
                        )}

                        {/* Reactions Display */}
                        {msg.reactions?.length > 0 && (
                          <div className="absolute -bottom-3 right-2 flex bg-white border border-gray-200 rounded-full px-1 shadow-sm text-xs z-10">
                            {msg.reactions.map((r, i) => <span key={i}>{r.emoji}</span>)}
                          </div>
                        )}
                      </div>

                      {/* Hover Actions */}
                      <div className={cn(
                        "absolute top-1 hidden group-hover:flex bg-white shadow border rounded-md p-1 gap-1 text-gray-600 z-10",
                        isMe ? "-left-16" : "-right-16"
                      )}>
                        <button onClick={() => setShowEmojis(showEmojis === msg._id ? null : msg._id)} className="hover:bg-gray-100 p-1 rounded">
                          <Smile className="w-3 h-3" />
                        </button>
                        <button onClick={() => setReplyingTo(msg)} className="hover:bg-gray-100 p-1 rounded">
                          <Reply className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Emoji Picker Popover */}
                      {showEmojis === msg._id && (
                        <div className={cn("absolute top-8 bg-white border shadow-lg rounded p-1 flex gap-1 z-20", isMe ? "right-0" : "left-0")}>
                          {["👍", "❤️", "😂", "🚀"].map(emoji => (
                            <button key={emoji} onClick={() => handleAddReaction(msg._id, emoji)} className="hover:bg-gray-100 p-1 rounded text-lg">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 mx-1">
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Indicator */}
          {replyingTo && (
            <div className="bg-gray-100 px-4 py-2 border-t flex items-center justify-between text-sm">
              <div className="truncate text-gray-600">
                <span className="font-semibold mr-1">Replying to:</span>
                {replyingTo.text}
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Selected Course Indicator */}
          {selectedCourse && (
            <div className="bg-blue-50 px-4 py-2 border-t border-blue-100 flex items-center justify-between text-xs text-blue-700">
              <div className="flex items-center gap-1 font-medium">
                <GraduationCap className="w-3 h-3" /> Attached: {selectedCourse.courseTitle}
              </div>
              <button onClick={() => setSelectedCourse(null)} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t relative">
            {showCourseMention && (
              <div className="absolute bottom-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded-t-lg max-h-40 overflow-y-auto z-20">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">Select a Course to Mention</div>
                {sharedCourses.map(course => (
                  <button
                    key={course.id}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 transition"
                    onClick={() => {
                      setSelectedCourse({ courseId: course.id, courseTitle: course.title });
                      setNewMessage(prev => prev.replace(/@$/, ''));
                      setShowCourseMention(false);
                    }}
                  >
                    {course.title}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message or @ to mention course..."
                className="flex-1 text-sm bg-gray-100 border-none rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newMessage}
                onChange={handleTextChange}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() && !selectedCourse}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
