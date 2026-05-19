'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bypassing, setBypassing] = useState(false);

  const [showOauthMissing, setShowOauthMissing] = useState(false);
  const [oauthMissingProvider, setOauthMissingProvider] = useState('');
  
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      const provider = params.get('provider');
      if (err === 'oauth_config_missing' && provider) {
        setOauthMissingProvider(provider);
        setShowOauthMissing(true);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      login(response.data.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = async () => {
    setBypassing(true);
    try {
      const response = await apiFetch('/auth/social-bypass', {
        method: 'POST',
        body: JSON.stringify({
          provider: oauthMissingProvider,
          name: oauthMissingProvider === 'Google' ? 'Google Scholar' : 'GitHub Developer',
          email: oauthMissingProvider === 'Google' ? 'google.scholar@studybuddy.edu' : 'github.dev@studybuddy.edu'
        })
      });
      
      login(response.data.user);
      router.push('/');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBypassing(false);
      setShowOauthMissing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-4 font-sans relative overflow-hidden">
      
      {/* Running Illumination Background Elements */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-1 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes float-2 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, 60px) scale(1.15); }
          66% { transform: translate(30px, -40px) scale(0.85); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .anim-float-1 { animation: float-1 9s infinite alternate ease-in-out; }
        .anim-float-2 { animation: float-2 11s infinite alternate ease-in-out; }
      `}} />
      
      {/* Animated glowing orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/20 blur-[100px] anim-float-1 pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/15 blur-[120px] anim-float-2 pointer-events-none" style={{ animationDelay: '-2s' }}></div>
      <div className="absolute top-[20%] right-[0%] w-[35vw] h-[35vw] rounded-full bg-purple-500/15 blur-[90px] anim-float-1 pointer-events-none" style={{ animationDelay: '-4s' }}></div>
      <div className="absolute bottom-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-cyan-400/20 blur-[100px] anim-float-2 pointer-events-none" style={{ animationDelay: '-6s' }}></div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_24px_80px_0_rgba(0,0,0,0.12)] rounded-3xl p-8 transition-all relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Study Buddy Logo" 
              className="h-20 w-auto object-contain transition-all duration-300" 
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] mb-2">Welcome back</h1>
          <p className="text-[#86868B]">Enter your details to access your account.</p>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium text-center">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
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
          />
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Horizontal Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200"></div>
          </div>
          <span className="relative bg-white/80 px-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            or continue with
          </span>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="http://localhost:3001/api/auth/google"
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Google
          </a>
          <a
            href="http://localhost:3001/api/auth/github"
            className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 hover:shadow"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-[#86868B]">
          Don't have an account? <Link href="/register" className="font-medium text-[#0071E3] hover:underline">Sign up</Link>
        </p>
      </div>

      {/* Social Config Missing Overlay Onboarding */}
      {showOauthMissing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_24px_64px_rgba(0,0,0,0.15)] rounded-3xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-zinc-800 mb-2 flex items-center gap-2">
              <span className="text-2xl">🛠️</span> Config Required: {oauthMissingProvider} OAuth
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
              To direct users to your official provider portal, insert the `{oauthMissingProvider.toUpperCase()}_CLIENT_ID` and `{oauthMissingProvider.toUpperCase()}_CLIENT_SECRET` in your `apps/backend/.env` file.
            </p>
            
            <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl mb-5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Callback URL for registration:</span>
              <code className="text-[10px] font-mono select-all bg-zinc-200/50 px-2 py-0.5 rounded text-zinc-600 block break-all">
                http://localhost:3001/api/auth/{oauthMissingProvider.toLowerCase()}/callback
              </code>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDemoBypass}
                disabled={bypassing}
                className="w-full py-2.5 bg-logo-gradient hover:opacity-95 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-500/10 transition active:scale-[0.98] disabled:opacity-50"
              >
                {bypassing ? 'Initializing Demo Connect...' : `🚀 Demo Bypass (Create ${oauthMissingProvider} Node)`}
              </button>
              <button
                onClick={() => setShowOauthMissing(false)}
                className="w-full py-2 text-zinc-500 hover:text-zinc-700 font-bold rounded-xl text-xs hover:bg-zinc-100 transition"
              >
                Configure Manually & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
