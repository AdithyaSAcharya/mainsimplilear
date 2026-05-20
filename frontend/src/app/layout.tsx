import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/sonner";
import { LayoutWrapper } from "@/components/layout-wrapper";
import FloatingChat from "@/components/chat/FloatingChat";
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "LearnStack",
  description: "Learn anywhere",
};

export default function RootLayout({
  children,
  modal
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-white text-gray-900 min-h-screen`}>
        <LayoutWrapper modal={modal}>
          {children}
        </LayoutWrapper>
        <FloatingChat />
        <Toaster />
      </body>
    </html>
  );
}
