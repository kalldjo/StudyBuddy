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

  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMinLength = password.length >= 8;
  const isPasswordValid = hasUpperCase && hasNumber && hasSpecialChar && hasMinLength;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

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
          <div>
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Password Policy UI */}
            {password.length > 0 && (
              <div className="mt-2 text-[10px] flex flex-col gap-1 font-semibold p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                <p className="text-zinc-500 mb-0.5">Password requirements:</p>
                <span className={hasMinLength ? 'text-green-600' : 'text-zinc-400'}>
                  {hasMinLength ? '✓' : '○'} At least 8 characters
                </span>
                <span className={hasUpperCase ? 'text-green-600' : 'text-zinc-400'}>
                  {hasUpperCase ? '✓' : '○'} At least 1 uppercase letter
                </span>
                <span className={hasNumber ? 'text-green-600' : 'text-zinc-400'}>
                  {hasNumber ? '✓' : '○'} At least 1 number
                </span>
                <span className={hasSpecialChar ? 'text-green-600' : 'text-zinc-400'}>
                  {hasSpecialChar ? '✓' : '○'} At least 1 special character (!@#$%^&*)
                </span>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading || (password.length > 0 && !isPasswordValid)}>
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
