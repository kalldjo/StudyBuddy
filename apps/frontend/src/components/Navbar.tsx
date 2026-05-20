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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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

  useEffect(() => {
    const handleOpenDrawer = () => setShowAppsMenu(true);
    window.addEventListener('open-apps-drawer', handleOpenDrawer);
    return () => window.removeEventListener('open-apps-drawer', handleOpenDrawer);
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
    <>
      <nav className="sticky top-4 z-50 mx-auto max-w-7xl w-full px-4 md:px-6">
        <div className="flex items-center justify-between rounded-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] px-6 py-2 transition-all hover:bg-white/75">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <img 
              src="/logo.png" 
              alt="Study Buddy Logo" 
              className="h-10 w-auto object-contain transition-all duration-300" 
              style={{ mixBlendMode: 'multiply' }}
            />
          </Link>
          
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-8">
              <NavLink href="/" active={pathname === '/'}>Discover</NavLink>
              <NavLink href="/ai" active={pathname === '/ai'}>AI Studio ✨</NavLink>
              <NavLink href="/academy" active={pathname === '/academy'}>Academy 🎓</NavLink>
              <NavLink href="/search" active={pathname === '/search'}>Search</NavLink>
            </div>
          )}

          <div className="flex items-center gap-3 relative">
            {isAuthenticated ? (
               <div className="flex items-center gap-3 relative">
                  {/* Circular Profile Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center gap-2 focus:outline-none"
                    >
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-black/10 shadow-sm hover:opacity-90 transition" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center font-bold text-sm text-indigo-600 hover:bg-indigo-100 transition">
                          {user?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </button>

                    {showProfileMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowProfileMenu(false)}
                        />
                        <div className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-white border border-zinc-150 shadow-lg py-2 z-20 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="px-4 py-2 border-b border-zinc-100">
                            <p className="text-xs font-bold text-zinc-800 truncate">{user?.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{user?.jurusan || 'Mahasiswa'}</p>
                          </div>
                          <Link
                            href={`/user/${user?.id}`}
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-[#0071E3] transition"
                          >
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                            My Profile
                          </Link>
                          <Link
                            href="/network"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-[#0071E3] transition"
                          >
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.97 5.97 0 0 0-.75-2.906m-.182-3.26a3 3 0 1 1-5.349-2.78m0 0a3 3 0 0 1 4.87-2.78m-9.74 0a3 3 0 0 0 5.348 2.78m0 0a3 3 0 0 0-4.87-2.78m-1.47 3.326a3 3 0 0 0-4.682 2.72 8.902 8.902 0 0 0 3.74.477m.079-3.197a5.971 5.971 0 0 0-.75 2.906m6 0a3 3 0 0 1-6 0" /></svg>
                            My Network
                          </Link>
                          <div className="border-t border-zinc-100 my-1" />
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              handleLogout();
                            }}
                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                          >
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
                            Logout
                          </button>
                        </div>
                      </>
                    )}
                  </div>
               </div>
            ) : (
               <div className="flex items-center gap-2">
                 <Link href="/login"><Button variant="secondary" className="!py-1.5 !px-4 text-sm">Login</Button></Link>
                 <Link href="/register"><Button variant="primary" className="!py-1.5 !px-4 text-sm">Sign Up</Button></Link>
               </div>
            )}
          </div>
        </div>
      </nav>

      {/* QUICK UTILITIES SLIDING SIDE BAR DRAWER (LINKEDIN STYLE) */}
      {showAppsMenu && isAuthenticated && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setShowAppsMenu(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] animate-in fade-in duration-200" 
          />
          
          {/* Sliding Drawer panel */}
          <div className="fixed right-0 top-0 h-full w-[380px] bg-white border-l border-zinc-200 shadow-[-10px_0_40px_rgba(0,0,0,0.12)] z-[9999] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 shrink-0">
              <h3 className="text-base font-extrabold text-[#1D1D1F] tracking-tight">Aplikasi Saya</h3>
              <button 
                onClick={() => setShowAppsMenu(false)}
                className="p-1.5 hover:bg-zinc-100 rounded-full transition text-zinc-400 hover:text-zinc-600"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
              
              {/* CATEGORY: APLIKASI SAYA */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-1">Aplikasi Utama</span>
                <div className="grid grid-cols-1 gap-2">
                  <DrawerItem 
                    icon="compass"
                    title="Jual (Textbook & Gear)"
                    subtitle="Peer-to-peer student marketplace exchange"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/jual'); }}
                    color="bg-blue-500/10 text-blue-600 border-blue-500/20"
                  />
                  <DrawerItem 
                    icon="users"
                    title="Grup (Class Circles)"
                    subtitle="Collaborate on course study groups"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/grup'); }}
                    color="bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                  />
                  <DrawerItem 
                    icon="receipt"
                    title="Kelola Tagihan (Dorm Split)"
                    subtitle="Track room expenses & printing ledger"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/kelola-tagihan'); }}
                    color="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  />
                  <DrawerItem 
                    icon="layers"
                    title="Flashcards (Study Decks)"
                    subtitle="Active recall & spaced repetition review"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/flashcards'); }}
                    color="bg-amber-500/10 text-amber-600 border-amber-500/20"
                  />
                  <DrawerItem 
                    icon="trending-up"
                    title="GPA Calculator & Matrix"
                    subtitle="Track academic marks & honor projections"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/gpa-calculator'); }}
                    color="bg-red-500/10 text-red-600 border-red-500/20"
                  />
                </div>
              </div>

              {/* CATEGORY: KARYAWAN BERBAKAT */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-1">Talenta & Karir</span>
                <div className="grid grid-cols-1 gap-2">
                  <DrawerItem 
                    icon="pie-chart"
                    title="Talent Insights"
                    subtitle="Visual skills demand & UI alumni demographics"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/talent-insights'); }}
                    color="bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20"
                  />
                  <DrawerItem 
                    icon="briefcase"
                    title="Posting Pekerjaan"
                    subtitle="Apply for Lab Assistants & TA vacancies"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/posting-pekerjaan'); }}
                    color="bg-violet-500/10 text-violet-600 border-violet-500/20"
                  />
                </div>
              </div>

              {/* CATEGORY: PENJUALAN */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-1">Jasa & Freelance</span>
                <div className="grid grid-cols-1 gap-2">
                  <DrawerItem 
                    icon="globe"
                    title="Marketplace Layanan"
                    subtitle="Peer tutoring, code reviews, writing help"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/marketplace-layanan'); }}
                    color="bg-teal-500/10 text-teal-600 border-teal-500/20"
                  />
                  <DrawerItem 
                    icon="music"
                    title="Lofi Soundscape Lounge"
                    subtitle="Binaural beats, ambient soundtracks, study rain"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/lofi-lounge'); }}
                    color="bg-rose-500/10 text-rose-600 border-rose-500/20"
                  />
                </div>
              </div>

              {/* CATEGORY: PEMASARAN */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-1">Pemasaran & AI</span>
                <div className="grid grid-cols-1 gap-2">
                  <DrawerItem 
                    icon="target"
                    title="Pasang Iklan (Promo Event)"
                    subtitle="Advertise campus events, seminars & tickets"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/pasang-iklan'); }}
                    color="bg-sky-500/10 text-sky-600 border-sky-500/20"
                  />
                  <DrawerItem 
                    icon="cpu"
                    title="AI PDF Note Summarizer"
                    subtitle="Paste study lecture scripts to visual bullets"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/summarizer'); }}
                    color="bg-purple-500/10 text-purple-600 border-purple-500/20"
                  />
                </div>
              </div>

              {/* CATEGORY: LEARNING */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-1">Akademik Pro</span>
                <div className="grid grid-cols-1 gap-2">
                  <DrawerItem 
                    icon="play-circle"
                    title="Learning Studio"
                    subtitle="Interactive video player & lecture playback"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/learning'); }}
                    color="bg-[#54B589]/10 text-[#54B589] border-[#54B589]/20"
                  />
                  <DrawerItem 
                    icon="edit-3"
                    title="Interactive Whiteboard"
                    subtitle="Real-time HTML5 sketchpad for study notes"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/whiteboard'); }}
                    color="bg-orange-500/10 text-orange-600 border-orange-500/20"
                  />
                  <DrawerItem 
                    icon="heart"
                    title="Class Buddy Matchmaker"
                    subtitle="Algorithm search for peers with class overlap"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/matchmaker'); }}
                    color="bg-pink-500/10 text-pink-600 border-pink-500/20"
                  />
                  <DrawerItem 
                    icon="calendar"
                    title="Exam Gantt Calendar"
                    subtitle="Countdown ledger of academic milestones"
                    onClick={() => { setShowAppsMenu(false); router.push('/services/calendar'); }}
                    color="bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20"
                  />
                </div>
              </div>

              {/* QUICK UTILITY COMPONENT: Study Pomodoro widget */}
              <div className="mt-4 p-4 bg-zinc-50 border border-zinc-150 rounded-2xl relative flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">🕒 Pomodoro Active</span>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${timerMode === 'study' ? 'bg-logo-gradient text-white' : 'bg-green-150 text-green-700 border border-green-200'}`}>
                    {timerMode === 'study' ? 'STUDY' : 'BREAK'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-zinc-800 font-mono tracking-tight">{formatTimer()}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={handleStartPauseTimer}
                      className="px-3 py-1 bg-logo-gradient text-white text-[10px] font-bold rounded-lg hover:opacity-95 shadow-sm"
                    >
                      {timerActive ? 'Pause' : 'Start'}
                    </button>
                    <button 
                      onClick={handleResetTimer}
                      className="px-2 py-1 bg-zinc-200 text-zinc-600 text-[10px] font-bold rounded-lg hover:bg-zinc-300"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </>
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

function DrawerItem({ icon, title, subtitle, onClick, color }: { icon: string, title: string, subtitle: string, onClick: () => void, color: string }) {
  const renderSvg = () => {
    switch (icon) {
      case 'compass':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3"/></svg>;
      case 'users':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07"/></svg>;
      case 'receipt':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6"/></svg>;
      case 'layers':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-4.057a1.125 1.125 0 0 1 1.092 0L21.75 12"/></svg>;
      case 'trending-up':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a1.195 1.195 0 0 0 1.69 0L21.75 7.5"/></svg>;
      case 'pie-chart':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"/></svg>;
      case 'briefcase':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .966-.784 1.75-1.75 1.75H5.5"/></svg>;
      case 'globe':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747"/></svg>;
      case 'music':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3v9m-10.5 3a3 3 0 1 1-6 0"/></svg>;
      case 'target':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/></svg>;
      case 'cpu':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M12 3v1.5m3.75-1.5v1.5"/></svg>;
      case 'play-circle':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>;
      case 'edit-3':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82"/></svg>;
      case 'heart':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733"/></svg>;
      case 'calendar':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25"/></svg>;
      default:
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9"/></svg>;
    }
  };

  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-zinc-100 hover:border-indigo-150 hover:bg-indigo-50/10 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] text-left transition-all hover:scale-[1.01] w-full"
    >
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
        {renderSvg()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-extrabold text-[#1D1D1F] leading-tight truncate">{title}</h4>
        <p className="text-[10px] font-medium text-zinc-400 leading-normal truncate mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}
