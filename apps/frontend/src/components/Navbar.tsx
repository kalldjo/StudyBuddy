'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [isScholar, setIsScholar] = useState(false);
  
  // Pomodoro timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');

  // Scholar quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizSuccess, setQuizSuccess] = useState(false);

  const quizQuestions = [
    {
      q: "What query language is used to retrieve data in Neo4j?",
      a: ["SQL", "Cypher", "GraphQL"],
      correct: 1
    },
    {
      q: "Which phase of CRISP-DM focuses on cleaning and consolidating columns?",
      a: ["Business Understanding", "Data Understanding", "Data Preparation"],
      correct: 2
    },
    {
      q: "What is the default port for Next.js in development mode?",
      a: ["3000", "3001", "8080"],
      correct: 0
    }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('is_study_buddy_scholar');
    if (saved === 'true') {
      setIsScholar(true);
    }
  }, []);

  // Pomodoro tick effect
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
      if (timerMode === 'study') {
        alert('🎯 Great job! Time for a 5-minute study break!');
        setTimerMode('break');
        setTimerSeconds(5 * 60);
      } else {
        alert('📚 Break is over! Let\'s focus for another 25 minutes!');
        setTimerMode('study');
        setTimerSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds, timerMode]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleStartPauseTimer = () => setTimerActive(!timerActive);
  const handleResetTimer = () => {
    setTimerActive(false);
    setTimerMode('study');
    setTimerSeconds(25 * 60);
  };

  const handleQuizAnswer = (optionIdx: number) => {
    if (optionIdx === quizQuestions[currentQ].correct) {
      if (currentQ < quizQuestions.length - 1) {
        setCurrentQ(c => c + 1);
      } else {
        // Complete & Success
        setIsScholar(true);
        localStorage.setItem('is_study_buddy_scholar', 'true');
        setQuizSuccess(true);
        setQuizComplete(true);
      }
    } else {
      // Failed
      setQuizSuccess(false);
      setQuizComplete(true);
    }
  };

  const handleResetQuiz = () => {
    setQuizStarted(false);
    setCurrentQ(0);
    setQuizComplete(false);
    setQuizSuccess(false);
  };

  const formatTimer = () => {
    const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const s = (timerSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Hide navbar on auth pages
  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <nav className="sticky top-4 z-50 mx-auto max-w-6xl w-[95%]">
      <div className="flex items-center justify-between rounded-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] px-6 py-3 transition-all hover:bg-white/70">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img 
            src="/logo.png" 
            alt="Study Buddy Logo" 
            className="h-14 w-auto object-contain transition-all duration-300" 
            style={{ mixBlendMode: 'multiply' }}
          />
        </Link>
        
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/" active={pathname === '/'}>Discover</NavLink>
            <NavLink href="/ai" active={pathname === '/ai'}>AI Studio ✨</NavLink>
            <NavLink href="/network" active={pathname === '/network'}>My Network</NavLink>
            <NavLink href="/profile" active={pathname === '/profile'}>My Profile</NavLink>
          </div>
        )}

        <div className="flex items-center gap-3 relative">
          {isAuthenticated ? (
             <div className="flex items-center gap-3">
                {/* 9-Dots Launcher */}
                <button 
                  onClick={() => setShowAppsMenu(!showAppsMenu)} 
                  className={`p-2 rounded-full transition-all relative ${showAppsMenu ? 'bg-logo-gradient text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-[#1D1D1F]'}`}
                  title="Study Buddy Utilities"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="4" height="4" rx="1" />
                    <rect x="10" y="3" width="4" height="4" rx="1" />
                    <rect x="17" y="3" width="4" height="4" rx="1" />
                    <rect x="3" y="10" width="4" height="4" rx="1" />
                    <rect x="10" y="10" width="4" height="4" rx="1" />
                    <rect x="17" y="10" width="4" height="4" rx="1" />
                    <rect x="3" y="17" width="4" height="4" rx="1" />
                    <rect x="10" y="17" width="4" height="4" rx="1" />
                    <rect x="17" y="17" width="4" height="4" rx="1" />
                  </svg>
                  {timerActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  )}
                </button>

                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-zinc-800 hidden sm:inline flex items-center gap-1.5">
                    {user?.name}
                    {isScholar && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-logo-gradient text-white shadow-sm" title="Verified Study Buddy Scholar!">
                        SCHOLAR ✨
                      </span>
                    )}
                  </span>
                </div>
                <Button variant="secondary" onClick={handleLogout} className="!py-1.5 !px-4 text-xs font-semibold">Logout</Button>
             </div>
          ) : (
             <div className="flex items-center gap-2">
               <Link href="/login"><Button variant="secondary" className="!py-1.5 !px-4 text-sm">Login</Button></Link>
               <Link href="/register"><Button variant="primary" className="!py-1.5 !px-4 text-sm">Sign Up</Button></Link>
             </div>
          )}

          {/* QUICK UTILITIES FLYOUT CARD */}
          {showAppsMenu && isAuthenticated && (
            <div className="absolute right-0 top-12 w-80 bg-white/95 backdrop-blur-2xl border border-white/50 shadow-[0_16px_48px_rgba(0,0,0,0.12)] rounded-3xl p-5 flex flex-col gap-5 z-[999] animate-in fade-in slide-in-from-top-2 duration-200">
              
              {/* Pomodoro Study Timer */}
              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">🕒 Pomodoro Timer</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${timerMode === 'study' ? 'bg-logo-gradient text-white' : 'bg-green-100 text-green-700'}`}>
                    {timerMode === 'study' ? 'STUDY MODE' : 'BREAK TIME'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="text-3xl font-extrabold text-zinc-800 font-mono">
                    {formatTimer()}
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={handleStartPauseTimer} 
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition ${timerActive ? 'bg-zinc-500 hover:bg-zinc-600' : 'bg-logo-gradient hover:opacity-90'}`}
                    >
                      {timerActive ? 'Pause' : 'Start'}
                    </button>
                    <button 
                      onClick={handleResetTimer} 
                      className="px-2.5 py-1.5 bg-zinc-200 hover:bg-zinc-300 rounded-xl text-xs font-bold text-zinc-600 transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full h-1 bg-zinc-200 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="h-full bg-logo-gradient transition-all duration-1000" 
                    style={{ width: `${(timerSeconds / (timerMode === 'study' ? 25 * 60 : 5 * 60)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Scholar Quiz */}
              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">🏆 Scholar Badge Challenge</h4>
                
                {!quizStarted ? (
                  <div className="text-center py-2">
                    <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                      Answer {quizQuestions.length} study questions correctly to unlock your **Verified Scholar** profile badge!
                    </p>
                    {isScholar ? (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-extrabold text-indigo-600">🎉 You are already a verified Scholar!</span>
                        <button 
                          onClick={() => setQuizStarted(true)} 
                          className="w-full py-2 bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs hover:bg-zinc-300 transition"
                        >
                          Retake Quiz
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setQuizStarted(true)} 
                        className="w-full py-2 bg-logo-gradient text-white font-bold rounded-xl text-xs hover:opacity-90 transition"
                      >
                        Start Challenge
                      </button>
                    )}
                  </div>
                ) : quizComplete ? (
                  <div className="text-center py-2">
                    {quizSuccess ? (
                      <div>
                        <span className="text-3xl">🎓</span>
                        <h5 className="font-extrabold text-sm text-zinc-800 mt-2">Challenge Passed!</h5>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                          You earned the **Verified Scholar** title! A golden badge has been attached next to your name.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl">❌</span>
                        <h5 className="font-extrabold text-sm text-zinc-800 mt-2">Incorrect Answer!</h5>
                        <p className="text-xs text-zinc-500 mt-1">Don't worry! Review your lecture files and try again.</p>
                      </div>
                    )}
                    <button 
                      onClick={handleResetQuiz} 
                      className="mt-4 w-full py-2 bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs hover:bg-zinc-300 transition"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-extrabold text-[#0071E3]">QUESTION {currentQ + 1} OF {quizQuestions.length}</span>
                    </div>
                    <p className="text-xs font-bold text-zinc-700 leading-relaxed mb-3">
                      {quizQuestions[currentQ].q}
                    </p>
                    <div className="flex flex-col gap-2">
                      {quizQuestions[currentQ].a.map((option, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleQuizAnswer(idx)}
                          className="w-full p-2.5 bg-white border border-zinc-100 hover:border-indigo-200 rounded-xl text-left text-xs font-medium text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50/20 transition-all"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string, active: boolean, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`text-sm font-medium transition-colors ${active ? 'text-[#0071E3]' : 'text-zinc-500 hover:text-[#1D1D1F]'}`}
    >
      {children}
    </Link>
  );
}
