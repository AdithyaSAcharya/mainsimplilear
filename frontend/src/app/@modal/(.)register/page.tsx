"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from 'next/link';

export default function RegisterModal() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [open, setOpen] = useState(true);
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      router.back();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password })
      });
      toast.success('Registered successfully! Please log in.');
      router.replace('/login');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign Up</DialogTitle>
          <DialogDescription>
            Create a new account to get started.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRegister} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">Sign Up</Button>
          
          <div className="text-center text-sm text-gray-500 mt-4">
            Already have an account? <Link href="/login" onClick={() => handleOpenChange(false)} className="text-black font-semibold hover:underline">Log in</Link>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
