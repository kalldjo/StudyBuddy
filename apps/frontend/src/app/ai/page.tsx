'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';
import Link from 'next/link';

export default function AIStudio() {
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [prompt, setPrompt] = useState('');
  const [activeAction, setActiveAction] = useState<'schema' | 'brainstorm' | 'code' | 'milestones'>('schema');
  const [result, setResult] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGenerate = async (actionOverride?: 'schema' | 'brainstorm' | 'code' | 'milestones') => {
    const targetAction = actionOverride || activeAction;
    const finalPrompt = prompt.trim() || "Multiplayer Study Group Social Platform with Real-time Gamified Quiz Node relationships";
    
    setGenerating(true);
    setResult('');
    
    try {
      const response = await apiFetch('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: finalPrompt,
          action: targetAction
        })
      });
      
      // Dynamic typewriter stream simulation for highly professional AI vibe
      const text = response.data.result;
      let currentLength = 0;
      const interval = setInterval(() => {
        if (currentLength < text.length) {
          currentLength += Math.min(15, text.length - currentLength);
          setResult(text.slice(0, currentLength));
        } else {
          clearInterval(interval);
          setGenerating(false);
        }
      }, 15);
    } catch (err: any) {
      setResult(`⚠️ AI Generation Error: ${err.message}`);
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex font-sans overflow-x-hidden">
      
      {/* 1. Sleek Canva AI Sidebar (Left) */}
      <aside className="w-64 bg-white border-r border-zinc-200/80 flex flex-col justify-between p-5 shrink-0 hidden lg:flex">
        <div className="flex flex-col gap-6">
          {/* Brand header */}
          <Link href="/" className="flex items-center gap-3 px-2 py-1">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
          </Link>
          
          <div className="h-px bg-zinc-200" />
          
          {/* Sidebar Menu Options */}
          <nav className="flex flex-col gap-1.5">
            <Link 
              href="/" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all group"
            >
              <svg className="w-5 h-5 stroke-zinc-400 group-hover:stroke-zinc-800 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Home
            </Link>
            
            <Link 
              href="/" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all group"
            >
              <svg className="w-5 h-5 stroke-zinc-400 group-hover:stroke-zinc-800 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
              </svg>
              Projects
            </Link>

            <Link 
              href="/ai" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-logo-gradient text-white shadow-md shadow-indigo-500/10 transition-all"
            >
              <svg className="w-5 h-5 stroke-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l8.982-8.983m-10.18 3.077L7.48 11.5M16.5 13.5 18 15M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              AI Studio
            </Link>

            <Link 
              href="/network" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all group"
            >
              <svg className="w-5 h-5 stroke-zinc-400 group-hover:stroke-zinc-800 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 8.625 21c-2.34 0-4.512-.7-6.31-1.895m3.784-5.75c.322-.093.654-.158 1-.192a4.847 4.847 0 0 1 6 0c.346.034.678.1 1 .192M9 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm11.5 1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Classmates
            </Link>
          </nav>
        </div>

        {/* User Card Bottom */}
        <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center font-bold text-zinc-600 text-sm overflow-hidden shrink-0">
            {currentUser?.profilePicture ? (
              <img src={currentUser.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              currentUser?.name?.charAt(0)
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-zinc-800 truncate">{currentUser?.name}</span>
            <span className="text-[9px] font-semibold text-zinc-400 truncate">{currentUser?.jurusan || 'Student'}</span>
          </div>
        </div>
      </aside>

      {/* 2. Main Canva AI Studio Workspace */}
      <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 overflow-y-auto max-w-6xl mx-auto w-full relative">
        
        {/* Sneak peek badge & link back */}
        <div className="flex justify-between items-center mb-10">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-600 transition">
            &larr; Back to Dashboard
          </Link>

          <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold bg-[#54B589]/10 text-[#54B589] border border-[#54B589]/20 uppercase tracking-wider animate-pulse shadow-sm">
            ✨ SNEAK PEEK AI
          </span>
        </div>

        {/* Canva Gradient Canvas Header */}
        <div className="text-center mb-10 relative">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent pb-3 select-none">
            What will we build today?
          </h2>
          <p className="text-zinc-400 text-sm md:text-base font-semibold max-w-xl mx-auto mt-2">
            Enter your study buddy concept and watch our Neo4j-powered AI generate blueprints, Cypher schemas, task sheets, and starter scripts!
          </p>
        </div>

        {/* Rounded Glassmorphic Composer Box */}
        <div className="w-full max-w-3xl mx-auto bg-white border border-zinc-200/80 shadow-[0_16px_48px_rgba(0,0,0,0.06)] rounded-3xl p-5 mb-8 transition-all hover:shadow-[0_24px_64px_rgba(0,0,0,0.08)]">
          <div className="flex items-start gap-4">
            
            {/* Left + Button */}
            <button 
              onClick={() => setPrompt("Design a real-time classroom analytics node graph sync system for high-performance class rosters")}
              className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl hover:bg-zinc-100 hover:border-zinc-300 transition-all shrink-0 mt-0.5"
              title="Insert sample prompt"
            >
              <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>

            {/* Prompt Text Input */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your student team idea, and I'll bring it to life..."
              rows={2}
              className="flex-1 outline-none border-none text-zinc-800 text-sm font-medium placeholder-zinc-400/80 resize-none bg-transparent pt-2.5 leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />

            {/* Right Mic Icon */}
            <button 
              onClick={() => alert("🎙️ Voice search integration is active! Speak your study concept clearly.")}
              className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl hover:bg-zinc-100 hover:border-zinc-300 transition-all shrink-0 mt-0.5"
              title="Voice Input"
            >
              <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </button>
          </div>

          {/* Quick Actions Buttons Row */}
          <div className="flex flex-wrap gap-2.5 mt-5 pt-5 border-t border-zinc-100 justify-center sm:justify-start">
            <button
              onClick={() => {
                setActiveAction('schema');
                handleGenerate('schema');
              }}
              disabled={generating}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                activeAction === 'schema'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-sm'
                  : 'bg-zinc-50 border-zinc-200/80 text-zinc-500 hover:bg-zinc-100/60 hover:text-zinc-700'
              }`}
            >
              📊 Schema Builder
            </button>

            <button
              onClick={() => {
                setActiveAction('brainstorm');
                handleGenerate('brainstorm');
              }}
              disabled={generating}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                activeAction === 'brainstorm'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-sm'
                  : 'bg-zinc-50 border-zinc-200/80 text-zinc-500 hover:bg-zinc-100/60 hover:text-zinc-700'
              }`}
            >
              💡 Brainstorm Ideas
            </button>

            <button
              onClick={() => {
                setActiveAction('code');
                handleGenerate('code');
              }}
              disabled={generating}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                activeAction === 'code'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-sm'
                  : 'bg-zinc-50 border-zinc-200/80 text-zinc-500 hover:bg-zinc-100/60 hover:text-zinc-700'
              }`}
            >
              💻 Draft Code
            </button>

            <button
              onClick={() => {
                setActiveAction('milestones');
                handleGenerate('milestones');
              }}
              disabled={generating}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                activeAction === 'milestones'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-sm'
                  : 'bg-zinc-50 border-zinc-200/80 text-zinc-500 hover:bg-zinc-100/60 hover:text-zinc-700'
              }`}
            >
              ✅ Sprint Roadmaps
            </button>
          </div>
        </div>

        {/* 3. Output Markdown Results Panel */}
        <div className="w-full max-w-3xl mx-auto">
          {generating && !result && (
            <div className="w-full bg-white border border-zinc-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 shadow-md animate-pulse">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">StudyBuddy AI is thinking...</span>
            </div>
          )}

          {result && (
            <div className="bg-white border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden transition-all duration-300">
              
              {/* Header result bar */}
              <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center">
                <span className="text-xs font-extrabold text-[#0071E3] bg-[#0071E3]/5 border border-[#0071E3]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  Model Output: GPT-Neo4j Active
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    {copySuccess ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0A2.25 2.25 0 0 1 13.5 5.25h-3a2.25 2.25 0 0 1-2.166-1.612m7.332 0c.055.194.084.4.084.612v1.5c0 .621-.504 1.125-1.125 1.125h-9C4.374 6.875 4 6.374 4 5.75v-1.5c0-.212.03-.418.084-.612m7.332 0c.346-.035.697-.052 1.05-.052c.353 0 .704.017 1.05.052M2.25 12.25h19.5M2.25 12.25l1.5-1.5M2.25 12.25l1.5 1.5M21.75 12.25l-1.5-1.5M21.75 12.25l-1.5 1.5M2.25 12.25v6.75A2.25 2.25 0 0 0 4.5 21.25h15a2.25 2.25 0 0 0 2.25-2.25v-6.75" />
                        </svg>
                        Copy Block
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Markdown Display */}
              <div className="p-6 md:p-8 overflow-x-auto">
                <div className="prose prose-sm prose-zinc max-w-none text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap">
                  {result}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
