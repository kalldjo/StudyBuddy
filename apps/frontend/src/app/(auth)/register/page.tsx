'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/utils/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F5F5F7] via-[#FFFFFF] to-[#E8ECEF] p-4 font-sans">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_12px_40px_0_rgba(0,0,0,0.08)] rounded-3xl p-8 transition-all">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Study Buddy Logo" 
              className="h-20 w-auto object-contain transition-all duration-300" 
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] mb-2">Create an account</h1>
          <p className="text-[#86868B]">Join Study Buddy to find your perfect learning partners.</p>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium text-center">{error}</div>}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <Input 
            label="Full Name" 
            type="text" 
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input 
            label="Email" 
            type="email" 
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#86868B]">
          Already have an account? <Link href="/login" className="font-medium text-[#0071E3] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
