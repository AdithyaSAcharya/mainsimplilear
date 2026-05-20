"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('token', res.token);
      localStorage.setItem('role', res.user.role);
      localStorage.setItem('userId', res.user.id.toString());
      localStorage.setItem('userName', res.user.full_name);
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <Card className="w-[400px]">
        <CardHeader><CardTitle>Login</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">Sign In</Button>
            <div className="text-center text-sm text-gray-500 mt-4">
              Don't have an account? <Link href="/register" className="text-black font-semibold hover:underline">Sign up</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
