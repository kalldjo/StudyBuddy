'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';


// INTERFACES & TYPES

interface Circle {
  id: string;
  name: string;
  course: string;
  members: number;
  joined: boolean;
}

interface GroupMessage {
  sender: string;
  text: string;
  time: string;
}


interface Job {
  id: string;
  title: string;
  lab: string;
  salary: string;
  slots: number;
  applied: boolean;
}

interface ServiceOffer {
  id: string;
  title: string;
  provider: string;
  rate: string;
  rating: number;
}


interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface CourseGrade {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const params = useParams();
  const activeApp = (params?.app as string) || 'gpa-calculator';

  // State configurations for remaining apps

  // 2. Study Circles State
  const [circles, setCircles] = useState<Circle[]>([
    { id: '1', name: 'SBD UI - Kelas A', course: 'SBD', members: 42, joined: true },
    { id: '2', name: 'Alpro Graph Theory', course: 'Alpro', members: 28, joined: false },
    { id: '3', name: 'CRISP-DM Warriors', course: 'SBD', members: 19, joined: false }
  ]);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleCourse, setNewCircleCourse] = useState('SBD');
  const [activeCircleId, setActiveCircleId] = useState('1');
  const [groupMessages, setGroupMessages] = useState<Record<string, GroupMessage[]>>({
    '1': [
      { sender: 'Diva', text: 'Halo guys! Ada yang paham cara optimasi kueri MATCH di Cypher?', time: '14:20' },
      { sender: 'Coki', text: 'Gunakan INDEX pada node property biar traversing lebih cepat!', time: '14:22' }
    ],
    '2': [
      { sender: 'Jo', text: 'Grup algoritma graf sudah aktif. Silakan share flowchart-nya.', time: '10:05' }
    ]
  });
  const [typedMessage, setTypedMessage] = useState('');


  // 4. Career Talent Insights Dashboard data (static but responsive)
  const skillsDemand = [
    { name: 'Neo4j / Cypher Graph Traversal', percentage: 94, color: 'from-blue-500 to-indigo-500' },
    { name: 'SQL Query optimization & DDL/DML', percentage: 88, color: 'from-emerald-500 to-teal-500' },
    { name: 'Data Pipeline & CRISP-DM Modelling', percentage: 76, color: 'from-purple-500 to-violet-500' },
    { name: 'NextJS / TypeScript Fullstack', percentage: 82, color: 'from-pink-500 to-rose-500' }
  ];

  // 5. Job assistantship board State
  const [jobs, setJobs] = useState<Job[]>([
    { id: '1', title: 'Asisten Laboratorium SBD', lab: 'Lab Basis Data Gedung B', salary: 'Rp 1.500.000 / Bln', slots: 3, applied: false },
    { id: '2', title: 'Student Assistant - Neo4j Graph Integrator', lab: 'Pusat Riset Data Terpadu', salary: 'Rp 2.000.000 / Bln', slots: 1, applied: false }
  ]);
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);
  const [applyText, setApplyText] = useState({ studentId: '', coverLetter: '' });

  // 6. Tutoring Services Marketplace State
  const [tutoringOffers, setTutoringOffers] = useState<ServiceOffer[]>([
    { id: '1', title: 'Review Desain ERD & Normalisasi 3NF', provider: 'Diva (IPK 3.92)', rate: 'Rp 50.000 / Sesi', rating: 5 },
    { id: '2', title: 'Coding Bootcamp ExpressJS & Cypher', provider: 'Coki (Lab Asst)', rate: 'Rp 75.000 / Sesi', rating: 4.8 }
  ]);


  // 8. Video Lecture Studio State
  const [activeChapter, setActiveChapter] = useState(0);
  const chapters = [
    { title: '1. Database Foundations & ERD', videoId: 'U9_X0aF2WRs', duration: '20:15', notes: 'Pelajari dasar-dasar perancangan basis data, entitas, atribut, dan cara pemetaan ERD.' },
    { title: '2. Advanced Database Normalization', videoId: '5ikiX0gv5w4', duration: '18:30', notes: 'Kuasai arsitektur database relasional dari 1NF, 2NF, hingga 3NF untuk meminimalisasi redundansi.' }
  ];
  const [lectureNotes, setLectureNotes] = useState('');
  const [notesLog, setNotesLog] = useState<string[]>([]);

  // 9. Whiteboard Drawing Canvas State & Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#4F46E5');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  // 10. AI PDF Note Summarizer State
  const [summaryInput, setSummaryInput] = useState('');
  const [summaryOutput, setSummaryOutput] = useState<{ concept: string; bullets: string[] } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // 11. Spaced-Repetition Flashcards State — load dari backend
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { id: 'default-1', question: 'Apa perbedaan utama antara RDBMS dengan Graph Database?', answer: 'RDBMS menggunakan foreign keys dan JOIN tables yang lambat pada relasi kompleks, sedangkan Graph Database menyimpan relasi secara direct pointer (traversal cepat).' },
    { id: 'default-2', question: 'Sebutkan 6 fase penting di CRISP-DM!', answer: '1. Business Understanding, 2. Data Understanding, 3. Data Preparation, 4. Modeling, 5. Evaluation, 6. Deployment.' },
  ]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [reviewedCardsCount, setReviewedCardsCount] = useState(0);
  const [newCardQuestion, setNewCardQuestion] = useState('');
  const [newCardAnswer, setNewCardAnswer] = useState('');
  const [showAddCardForm, setShowAddCardForm] = useState(false);

  // 12. GPA Tracker State — load dari backend
  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState('3');
  const [newCourseGrade, setNewCourseGrade] = useState('A');
  const [targetGPA, setTargetGPA] = useState(3.8);


  // 14. Graph Classmate Matchmaker State
  const classmates = [
    { name: 'Diva Anggrea', overlapScore: 92, classes: ['SBD', 'Metopen', 'Jarkom'], freeHours: '13:00 - 16:00', phone: '628123456789' },
    { name: 'Coki Ramadhan', overlapScore: 84, classes: ['SBD', 'Alpro', 'Basdat Lanjut'], freeHours: '10:00 - 12:00', phone: '628987654321' },
    { name: 'Jo Kalldjo', overlapScore: 78, classes: ['SBD', 'Sistem Operasi'], freeHours: '16:00 - 18:00', phone: '628221122334' }
  ];

  // 15. Custom Reminders System State
  interface Reminder {
    id: string;
    title: string;
    date: string;
    priority: 'HIGH' | 'MID' | 'LOW';
  }

  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', title: 'Final Project SBD UI (Normalisasi & Cypher Setup)', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], priority: 'HIGH' },
    { id: '2', title: 'Evaluasi CRISP-DM & Data Preparation', date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], priority: 'MID' }
  ]);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderPriority, setNewReminderPriority] = useState<'HIGH' | 'MID' | 'LOW'>('HIGH');
  const [timeLeft, setTimeLeft] = useState('');

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim() || !newReminderDate) return;
    const item: Reminder = {
      id: Date.now().toString(),
      title: newReminderTitle.trim(),
      date: newReminderDate,
      priority: newReminderPriority
    };
    setReminders([...reminders, item]);
    setNewReminderTitle('');
    setNewReminderDate('');
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (reminders.length === 0) {
        setTimeLeft('No schedules added');
        return;
      }
      
      const now = new Date().getTime();
      const sortedFutureReminders = reminders
        .map(r => ({ ...r, time: new Date(r.date + 'T23:59:59').getTime() }))
        .filter(r => r.time > now)
        .sort((a, b) => a.time - b.time);

      if (sortedFutureReminders.length === 0) {
        setTimeLeft('All schedules passed! 🔥');
        return;
      }

      const closest = sortedFutureReminders[0];
      const difference = closest.time - now;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft(`Countdown to "${closest.title}": ${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [reminders]);

  // Sinkronisasi status lamaran karir riil dengan Neo4j
  useEffect(() => {
    if (activeApp === 'posting-pekerjaan') {
      const syncJobApplications = async () => {
        try {
          const response = await apiFetch('/opportunities');
          const opps = response.data || [];
          setJobs(prevJobs => prevJobs.map(j => {
            const matchedOpp = opps.find((o: any) => o.id === j.id);
            if (matchedOpp) {
              return {
                ...j,
                applied: matchedOpp.hasApplied
              };
            }
            return j;
          }));
        } catch (err) {
          console.error('Failed to sync job applications:', err);
        }
      };
      syncJobApplications();
    }
  }, [activeApp]);

  // Fetch GPA grades dari backend saat buka app
  useEffect(() => {
    if (activeApp === 'gpa-calculator') {
      const fetchGrades = async () => {
        try {
          const res = await apiFetch('/playground/grades');
          if (res.data && res.data.length > 0) {
            setGrades(res.data.map((g: any) => ({
              id: g.id,
              name: g.courseName,
              credits: typeof g.credits === 'object' ? g.credits.low : g.credits,
              grade: g.grade
            })));
          }
        } catch (err) {
          console.error('Failed to fetch GPA grades:', err);
        }
      };
      fetchGrades();
    }
  }, [activeApp]);

  // Fetch flashcards dari backend saat buka app
  useEffect(() => {
    if (activeApp === 'flashcards') {
      const fetchCards = async () => {
        try {
          const res = await apiFetch('/playground/flashcards');
          if (res.data && res.data.length > 0) {
            setFlashcards(res.data.map((f: any) => ({
              id: f.id,
              question: f.question,
              answer: f.answer,
              difficulty: f.difficulty || 'medium'
            })));
          }
        } catch (err) {
          console.error('Failed to fetch flashcards:', err);
        }
      };
      fetchCards();
    }
  }, [activeApp]);


  // WHITEBOARD LOGIC (HTML5 CANVAS DRAWING)
  useEffect(() => {
    if (activeApp === 'whiteboard') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = brushSize;
        }
      }
    }
  }, [activeApp, drawColor, brushSize]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = isEraser ? '#FFFFFF' : drawColor;
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };



  // APP 2: Circles Chat & Join
  const handleJoinCircle = (id: string) => {
    setCircles(circles.map(c => c.id === id ? { ...c, joined: !c.joined, members: c.joined ? c.members - 1 : c.members + 1 } : c));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    const currentMsgs = groupMessages[activeCircleId] || [];
    const newMsg: GroupMessage = {
      sender: 'Anda',
      text: typedMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...currentMsgs, newMsg];
    setGroupMessages({ ...groupMessages, [activeCircleId]: updated });
    setTypedMessage('');

    // Trigger dummy bot reply in SBD channel
    setTimeout(() => {
      const reply: GroupMessage = {
        sender: 'Diva',
        text: 'Wah, makasih jawabannya! Sangat membantu!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setGroupMessages(prev => ({
        ...prev,
        [activeCircleId]: [...(prev[activeCircleId] || []), reply]
      }));
    }, 1500);
  };



  // APP 5: Assistant Job apply
  const handleApplyJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalJob) return;
    try {
      await apiFetch(`/opportunities/${applyModalJob.id}/apply`, {
        method: 'POST',
        body: JSON.stringify({
          studentId: applyText.studentId,
          coverLetter: applyText.coverLetter
        })
      });
      setJobs(jobs.map(j => j.id === applyModalJob.id ? { ...j, applied: true, slots: Math.max(0, j.slots - 1) } : j));
      setApplyModalJob(null);
      setApplyText({ studentId: '', coverLetter: '' });
      alert('🎉 Lamaran sukses dikirim ke database Riset Laboratorium!');
    } catch (err) {
      console.error('Gagal mengirimkan lamaran:', err);
      alert('Gagal mengirimkan lamaran pekerjaan');
    }
  };




  // APP 8: Video Player notes taking
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lectureNotes.trim()) return;
    setNotesLog([...notesLog, lectureNotes]);
    setLectureNotes('');
  };

  // APP 10: AI Note Summarizer
  const handleTriggerSummary = () => {
    if (!summaryInput.trim()) return;
    setIsSummarizing(true);
    setTimeout(() => {
      setIsSummarizing(false);
      setSummaryOutput({
        concept: 'Optimasi Traversal Database Graf (Neo4j & Cypher)',
        bullets: [
          'Neo4j menyimpan pointer relationship secara fisik (Index-free Adjacency) sehingga navigasi join sangat cepat.',
          'Penggunaan kueri MATCH (a:User)-[:FRIEND]->(b:User) tidak memerlukan tabel perantara seperti RDBMS.',
          'Gunakan perintah CREATE INDEX FOR (n:User) ON (n.name) untuk mempercepat pencarian node awal.',
          'Hindari traversals tanpa arah jika skema bersifat direksional untuk menghemat memori pencarian.'
        ]
      });
    }, 1500);
  };

  // APP 12: GPA simpan ke database Neo4j
  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName) return;
    try {
      const res = await apiFetch('/playground/grades', {
        method: 'POST',
        body: JSON.stringify({ name: newCourseName, credits: parseInt(newCourseCredits) || 3, grade: newCourseGrade })
      });
      const saved = res.data;
      if (saved) {
        const item: CourseGrade = {
          id: saved.id,
          name: saved.courseName,
          credits: typeof saved.credits === 'object' ? saved.credits.low : saved.credits,
          grade: saved.grade
        };
        setGrades(prev => [item, ...prev]);
      }
      setNewCourseName('');
    } catch (err) {
      console.error('Failed to save grade:', err);
      alert('Gagal menyimpan nilai matkul ke database');
    }
  };

  const handleDeleteGrade = async (id: string) => {
    try {
      await apiFetch(`/playground/grades/${id}`, { method: 'DELETE' });
      setGrades(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Failed to delete grade:', err);
    }
  };

  // APP 11: Flashcard simpan ke database Neo4j
  const handleSaveFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardQuestion.trim() || !newCardAnswer.trim()) return;
    try {
      const res = await apiFetch('/playground/flashcards', {
        method: 'POST',
        body: JSON.stringify({ question: newCardQuestion, answer: newCardAnswer, difficulty: 'medium' })
      });
      const saved = res.data;
      if (saved) {
        setFlashcards(prev => [{ id: saved.id, question: saved.question, answer: saved.answer }, ...prev]);
      }
      setNewCardQuestion('');
      setNewCardAnswer('');
      setShowAddCardForm(false);
    } catch (err) {
      console.error('Failed to save flashcard:', err);
      alert('Gagal menyimpan flashcard ke database');
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    try {
      await apiFetch(`/playground/flashcards/${id}`, { method: 'DELETE' });
      setFlashcards(prev => {
        const next = prev.filter(f => f.id !== id);
        // reset index kalau sekarang lagi di kartu yang dihapus
        if (currentCardIdx >= next.length) setCurrentCardIdx(Math.max(0, next.length - 1));
        return next;
      });
    } catch (err) {
      console.error('Failed to delete flashcard:', err);
    }
  };

  const getGpaValue = (grade: string) => {
    switch (grade) {
      case 'A': return 4.0;
      case 'A-': return 3.7;
      case 'B+': return 3.3;
      case 'B': return 3.0;
      case 'B-': return 2.7;
      case 'C+': return 2.3;
      case 'C': return 2.0;
      default: return 0.0;
    }
  };

  const calculateGpa = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    grades.forEach(g => {
      totalPoints += getGpaValue(g.grade) * g.credits;
      totalCredits += g.credits;
    });
    return totalCredits === 0 ? 0.0 : parseFloat((totalPoints / totalCredits).toFixed(2));
  };

  // Sidebar Links config
  const navItems = [
    { id: 'gpa-calculator', label: 'GPA Calculator & Matrix', icon: '📈' },
    { id: 'calendar', label: 'Reminders', icon: '📅' },
    { id: 'matchmaker', label: 'Matchmaker', icon: '❤️' },
    { id: 'posting-pekerjaan', label: 'Jobs Info', icon: '💼' }
  ];

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-12 pt-6">
      <div className="max-w-6xl w-[95%] mx-auto flex flex-col gap-6">
        
        {/* PREMIUM GLASS HEADER */}
        <div className="p-6 rounded-3xl bg-white border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h1 className="text-xl font-black text-[#1D1D1F] tracking-tight">StudyBuddy Premium Tools</h1>
              <p className="text-xs font-semibold text-zinc-400 mt-0.5">Explore 4 state-of-the-art interactive micro-applications for UI students</p>
            </div>
          </div>
          <Link href="/">
            <button className="px-5 py-2 text-xs font-black bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 rounded-full transition">
              Back to Feed
            </button>
          </Link>
        </div>

        {/* CONTAINER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-4 p-5 rounded-3xl bg-white border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-5">
            <h3 className="text-xs font-black text-[#1D1D1F] uppercase tracking-wider px-1">Pilih Aplikasi</h3>
            <div className="flex flex-col gap-1.5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => router.push(`/services/${item.id}`)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-left transition-all ${activeApp === item.id ? 'bg-logo-gradient text-white shadow-md scale-[1.01]' : 'hover:bg-zinc-50 text-zinc-600 hover:text-[#1D1D1F]'}`}
                >
                  <span>{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* MAIN WORKING AREA PANEL */}
          <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-[500px]">
            
            {/* APP 2: GRUP (CIRCLES) */}
            {activeApp === 'grup' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-base font-black text-zinc-800">👥 Lingkar Studi Kuliah (Class Circles)</h2>
                  <p className="text-xs text-zinc-400 mt-1">Bergabung dan berdiskusi langsung dalam channel kelas basis data dan algoritma.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Channels Sidebar List */}
                  <div className="flex flex-col gap-2 border-r border-zinc-100 pr-2">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Channels</span>
                    {circles.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setActiveCircleId(c.id)}
                        className={`p-3 rounded-2xl text-left text-xs font-bold transition ${activeCircleId === c.id ? 'bg-indigo-50 border border-indigo-150 text-indigo-700' : 'hover:bg-zinc-50 text-zinc-600'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate">#{c.name}</span>
                          {c.joined && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-normal">{c.members} Anggota</p>
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Group Chat View */}
                  <div className="md:col-span-2 flex flex-col justify-between h-[360px] bg-zinc-50 border border-zinc-150 rounded-2xl p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2 mb-2">
                      <span className="text-xs font-black text-zinc-700">
                        #{circles.find(c => c.id === activeCircleId)?.name}
                      </span>
                      <button 
                        onClick={() => handleJoinCircle(activeCircleId)}
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${circles.find(c => c.id === activeCircleId)?.joined ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-indigo-600 text-white'}`}
                      >
                        {circles.find(c => c.id === activeCircleId)?.joined ? 'Leave Circle' : 'Join Circle'}
                      </button>
                    </div>

                    {/* Message Logs */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2 pr-1 custom-scrollbar">
                      {(groupMessages[activeCircleId] || []).map((msg, i) => (
                        <div key={i} className={`flex flex-col max-w-[80%] ${msg.sender === 'Anda' ? 'self-end items-end' : 'self-start items-start'}`}>
                          <span className="text-[9px] font-black text-zinc-400">{msg.sender}</span>
                          <div className={`p-2.5 rounded-2xl text-xs mt-0.5 font-semibold ${msg.sender === 'Anda' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-zinc-200 text-zinc-700 rounded-tl-none'}`}>
                            {msg.text}
                          </div>
                          <span className="text-[8px] text-zinc-400 mt-0.5">{msg.time}</span>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={handleSendMessage} className="flex gap-1.5 mt-2">
                      <input 
                        type="text" 
                        placeholder={circles.find(c => c.id === activeCircleId)?.joined ? "Tulis pesan diskusi..." : "Gabung ke channel untuk berdiskusi"} 
                        disabled={!circles.find(c => c.id === activeCircleId)?.joined}
                        value={typedMessage}
                        onChange={e => setTypedMessage(e.target.value)}
                        className="flex-1 p-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold disabled:bg-zinc-100 disabled:cursor-not-allowed"
                      />
                      <button 
                        type="submit" 
                        disabled={!circles.find(c => c.id === activeCircleId)?.joined}
                        className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* APP 4: TALENT INSIGHTS */}
            {activeApp === 'talent-insights' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-base font-black text-zinc-800">📊 Talent Insights & Alumni Demographics</h2>
                  <p className="text-xs text-zinc-400 mt-1">Data riset industri nyata dan keahlian basis data yang paling dicari alumni Universitas Indonesia.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Skill Charts */}
                  <div className="p-5 bg-zinc-50 border border-zinc-150 rounded-2xl flex flex-col gap-4">
                    <span className="text-xs font-black text-zinc-500">Skill Paling Dibutuhkan SBD (2026)</span>
                    <div className="flex flex-col gap-3">
                      {skillsDemand.map((s, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-600">
                            <span className="truncate pr-2">{s.name}</span>
                            <span>{s.percentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${s.color}`} style={{ width: `${s.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Career statistics cards */}
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-white border border-zinc-150 rounded-2xl flex items-center gap-3">
                      <span className="text-2xl">👩‍💻</span>
                      <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase">RATA-RATA SALARY LULUSAN</span>
                        <h4 className="text-base font-black text-[#1D1D1F] mt-0.5">Rp 12.500.000 / Bln</h4>
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-zinc-150 rounded-2xl flex items-center gap-3">
                      <span className="text-2xl">🏢</span>
                      <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase">PERUSAHAAN PENYALUR UTAMA</span>
                        <h4 className="text-xs font-black text-[#1D1D1F] mt-0.5">Gojek, Tokopedia, Shopee, Traveloka, Neo4j Labs</h4>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-2xl flex items-center gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase">GRAPH CERTIFICATION FACT</span>
                        <p className="text-[10px] font-semibold text-indigo-700 leading-normal mt-0.5">
                          Sertifikat Neo4j Certified Professional menaikkan nilai tawar HRD hingga 35%!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APP 5: POSTING PEKERJAAN */}
            {activeApp === 'posting-pekerjaan' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-base font-black text-zinc-800">💼 Lowongan Asisten Riset & Laboratorium</h2>
                  <p className="text-xs text-zinc-400 mt-1">Lamar posisi Teaching Assistant (TA), Research Assistant, atau Asisten Lab di Fasilkom.</p>
                </div>

                <div className="flex flex-col gap-4">
                  {jobs.map(j => (
                    <div key={j.id} className="p-5 bg-white border border-zinc-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm hover:border-zinc-250 transition-colors">
                      <div>
                        <span className="px-2 py-0.5 text-[9px] font-extrabold bg-violet-50 text-violet-600 border border-violet-150 rounded-md">
                          {j.lab}
                        </span>
                        <h3 className="text-sm font-black text-zinc-800 mt-2">{j.title}</h3>
                        <p className="text-xs font-semibold text-amber-600 mt-1">{j.salary}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-bold text-zinc-400">
                          {j.slots > 0 ? `${j.slots} Slot Tersisa` : 'Slot Penuh'}
                        </span>
                        <button
                          onClick={() => j.applied ? null : setApplyModalJob(j)}
                          disabled={j.applied || j.slots === 0}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition ${j.applied ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm'}`}
                        >
                          {j.applied ? 'Sudah Melamar' : 'Lamar Cepat'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Apply Job Form Drawer/Modal mockup inside main area */}
                {applyModalJob && (
                  <div className="p-5 bg-zinc-50 border border-violet-150 rounded-2xl flex flex-col gap-3 relative">
                    <button 
                      onClick={() => setApplyModalJob(null)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 font-bold"
                    >
                      ✕
                    </button>
                    <h3 className="text-xs font-black text-violet-700 uppercase">Mengajukan Lamaran: {applyModalJob.title}</h3>
                    
                    <form onSubmit={handleApplyJob} className="flex flex-col gap-2.5">
                      <input 
                        type="text" 
                        placeholder="NPM Mahasiswa (misal: 2206012345)" 
                        value={applyText.studentId}
                        onChange={e => setApplyText({ ...applyText, studentId: e.target.value })}
                        className="p-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-500 font-bold"
                        required
                      />
                      <textarea 
                        placeholder="Tuliskan pengalaman basis data Anda (misal: Pernah membuat rancangan normalisasi 3NF dan query Cypher di mini project)..." 
                        value={applyText.coverLetter}
                        onChange={e => setApplyText({ ...applyText, coverLetter: e.target.value })}
                        className="p-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-500 font-semibold h-20 resize-none"
                        required
                      />
                      <button type="submit" className="py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black shadow-sm">
                        Kirim Lamaran Sekarang
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* APP 6: TUTORING SERVICES MARKETPLACE */}
            {activeApp === 'marketplace-layanan' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-base font-black text-zinc-800">🌐 Peer-to-Peer Tutors & Help Exchange</h2>
                  <p className="text-xs text-zinc-400 mt-1">Pesan jasa pendampingan kuis, konsultasi CRISP-DM, atau optimasi kueri dari teman sekelas.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tutoringOffers.map(o => (
                    <div key={o.id} className="p-4 bg-white border border-zinc-150 rounded-2xl flex flex-col justify-between gap-3 shadow-sm hover:scale-[1.005] transition-transform">
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400">
                          <span>{o.provider}</span>
                          <span className="text-amber-500">⭐ {o.rating}</span>
                        </div>
                        <h4 className="text-xs font-black text-zinc-800 mt-2 leading-relaxed">{o.title}</h4>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-1">
                        <span className="text-xs font-black text-teal-600">{o.rate}</span>
                        <button 
                          onClick={() => alert(`🎉 Permintaan tutor untuk ${o.title} telah dikirim ke WhatsApp ${o.provider}! Terapkan jadwal segera.`)}
                          className="px-3.5 py-1.5 text-[10px] font-black bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
                        >
                          Booking Tutor
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* APP 8: VIDEO LECTURE STUDIO */}
            {activeApp === 'learning' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-base font-black text-zinc-800">📺 Learning Studio & Video Player</h2>
                  <p className="text-xs text-zinc-400 mt-1">Nonton ulang video tutorial pembelajaran graf, buat catatan pintar, dan simpan log materi.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Actual YouTube Video Player Box */}
                  <div className="md:col-span-2 flex flex-col gap-3">
                    <div className="bg-zinc-900 aspect-video rounded-2xl flex items-center justify-center text-white relative overflow-hidden shadow">
                      <iframe
                        src={`https://www.youtube.com/embed/${chapters[activeChapter].videoId}?rel=0&modestbranding=1`}
                        title={chapters[activeChapter].title}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>

                    <span className="text-xs font-black text-zinc-400 px-1 mt-1">Penjelasan Slide Ringkas</span>
                    <p className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl text-xs font-semibold text-zinc-600 leading-relaxed">
                      {chapters[activeChapter].notes}
                    </p>
                  </div>

                  {/* Chapters sidebar & study notepad */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Daftar Bab Video</span>
                      {chapters.map((ch, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveChapter(idx)}
                          className={`p-2.5 rounded-xl text-left text-xs font-bold transition ${activeChapter === idx ? 'bg-indigo-50 border border-indigo-150 text-indigo-700' : 'hover:bg-zinc-50 text-zinc-600'}`}
                        >
                          <h4 className="truncate">{ch.title}</h4>
                          <span className="text-[9px] text-zinc-400 font-mono mt-0.5 block">{ch.duration}</span>
                        </button>
                      ))}
                    </div>

                    {/* Quick Notepad widget */}
                    <form onSubmit={handleAddNote} className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl flex flex-col gap-2">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Coretan Catatan Kuliah</span>
                      <textarea
                        placeholder="Tulis ringkasan pelajaran..."
                        value={lectureNotes}
                        onChange={e => setLectureNotes(e.target.value)}
                        className="p-2 text-[10px] bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold h-16 resize-none"
                      />
                      <button type="submit" className="py-1 bg-indigo-600 text-white font-bold rounded-lg text-[10px]">
                        Simpan Catatan
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* APP 9: CANVAS WHITEBOARD */}
            {activeApp === 'whiteboard' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-base font-black text-zinc-800">✏️ Interactive Drawing Canvas Board</h2>
                  <p className="text-xs text-zinc-400 mt-1">Gambarkan alur desain ERD database Anda, relasi entitas basis data, atau mapping Cypher graf langsung.</p>
                </div>

                {/* Toolbar */}
                <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">Pencil Color:</span>
                    <div className="flex gap-1.5">
                      {['#4F46E5', '#10B981', '#EF4444', '#1F2937'].map(c => (
                        <button
                          key={c}
                          onClick={() => { setDrawColor(c); setIsEraser(false); }}
                          className={`w-6 h-6 rounded-full border border-black/10 transition ${drawColor === c && !isEraser ? 'scale-115 ring-2 ring-indigo-300' : 'hover:scale-105'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">Brush Size:</span>
                    <input 
                      type="range" 
                      min="2" 
                      max="12" 
                      value={brushSize} 
                      onChange={e => setBrushSize(parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-xs text-zinc-600 font-bold font-mono">{brushSize}px</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEraser(!isEraser)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${isEraser ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white hover:bg-zinc-50 text-zinc-500 border-zinc-200'}`}
                    >
                      🧹 Eraser Mode
                    </button>
                    <button
                      onClick={clearCanvas}
                      className="px-3 py-1.5 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg transition"
                    >
                      Clear Board
                    </button>
                  </div>
                </div>

                {/* HTML5 Canvas */}
                <div className="border border-zinc-150 rounded-3xl overflow-hidden bg-white shadow-inner flex items-center justify-center p-2">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={300}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="bg-white cursor-crosshair border border-dashed border-zinc-100 rounded-2xl max-w-full"
                  />
                </div>
              </div>
            )}

            {/* APP 10: AI NOTE SUMMARIZER */}
            {activeApp === 'summarizer' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-base font-black text-zinc-800">🧠 AI Note Summarizer & PDF Condenser</h2>
                  <p className="text-xs text-zinc-400 mt-1">Tempelkan naskah catatan transkrip kuliah Anda, dan peroleh ringkasan visual berpoin.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-black text-zinc-500 px-1">Tempel Catatan Kasar Kuliah</span>
                    <textarea
                      placeholder="Ketikkan atau paste transkrip kuliah di sini (misal: RDBMS butuh join table yang lambat kalau datanya jutaan. Model graf Neo4j menggunakan model traversal direct pointer)..."
                      value={summaryInput}
                      onChange={e => setSummaryInput(e.target.value)}
                      className="p-3 text-xs bg-zinc-50 border border-zinc-150 rounded-2xl focus:outline-none focus:border-indigo-500 font-semibold h-44 resize-none w-full"
                    />
                    <button
                      onClick={handleTriggerSummary}
                      disabled={isSummarizing || !summaryInput.trim()}
                      className="w-full py-2.5 bg-logo-gradient text-white text-xs font-black rounded-xl hover:opacity-95 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSummarizing ? 'Sedang Meringkas...' : 'Generate AI Summary Card ✨'}
                    </button>
                  </div>

                  {/* Summary Card Output Preview */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-black text-zinc-400 px-1">Hasil Ringkasan AI</span>
                    {summaryOutput ? (
                      <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-3xl flex flex-col gap-3 shadow-inner">
                        <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-indigo-100 text-indigo-700 rounded-md self-start">
                          AI CONCEPT MATRIX
                        </span>
                        <h4 className="text-xs font-black text-zinc-800 mt-1">{summaryOutput.concept}</h4>
                        <ul className="flex flex-col gap-2 mt-1">
                          {summaryOutput.bullets.map((b, i) => (
                            <li key={i} className="text-[10px] font-semibold text-zinc-600 leading-relaxed flex items-start gap-1.5">
                              <span className="text-indigo-500 shrink-0">✔</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex-1 border border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center p-6 text-center text-zinc-400 min-h-[180px]">
                        <span className="text-2xl">✨</span>
                        <p className="text-[10px] font-bold mt-2">Belum ada output ringkasan.<br/>Isi catatan kasar kuliah di kiri lalu klik ringkas.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* APP 11: FLASHCARDS */}
            {activeApp === 'flashcards' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-zinc-800">📇 Flashcard Active Recall Deck (Anki-like)</h2>
                    <p className="text-xs text-zinc-400 mt-1">Uji ingatan Anda dengan pengulangan kartu belajar (Spaced Repetition) guna melibas ujian basis data.</p>
                  </div>
                  <button
                    onClick={() => setShowAddCardForm(!showAddCardForm)}
                    className="shrink-0 px-3 py-1.5 text-[10px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
                  >
                    {showAddCardForm ? '✕ Batal' : '+ Kartu Baru'}
                  </button>
                </div>

                {/* Add new card form */}
                {showAddCardForm && (
                  <form onSubmit={handleSaveFlashcard} className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col gap-2.5 animate-in fade-in duration-200">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Tambah Kartu Baru ke Database</span>
                    <textarea
                      placeholder="Pertanyaan / Soal (misal: Apa itu Index-Free Adjacency?)"
                      value={newCardQuestion}
                      onChange={e => setNewCardQuestion(e.target.value)}
                      className="p-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold h-16 resize-none"
                      required
                    />
                    <textarea
                      placeholder="Jawaban (misal: Teknik Neo4j menyimpan pointer relasi langsung di node...)"
                      value={newCardAnswer}
                      onChange={e => setNewCardAnswer(e.target.value)}
                      className="p-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold h-16 resize-none"
                      required
                    />
                    <button type="submit" className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl">
                      💾 Simpan ke Neo4j
                    </button>
                  </form>
                )}

                <div className="flex flex-col items-center gap-5">
                  {flashcards.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-8">Belum ada flashcard. Klik "+ Kartu Baru" untuk menambahkan.</p>
                  ) : (
                    <>
                    {/* Card Flip Body */}
                    <div 
                      onClick={() => setIsCardFlipped(!isCardFlipped)}
                      className="w-full max-w-md h-52 bg-white border border-zinc-200 rounded-3xl p-6 shadow-md flex flex-col justify-between cursor-pointer hover:border-indigo-400 transition-all select-none hover:shadow-lg"
                    >
                      <div className="flex justify-between items-center text-[9px] font-black text-zinc-400">
                        <span>KARTU {currentCardIdx + 1} DARI {flashcards.length}</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 uppercase">
                          {isCardFlipped ? 'JAWABAN (CLICK FLIP)' : 'PERTANYAAN (CLICK FLIP)'}
                        </span>
                      </div>

                      <div className="flex-1 flex items-center justify-center text-center p-2">
                        <p className={`text-xs leading-relaxed font-black ${isCardFlipped ? 'text-indigo-600' : 'text-zinc-800'}`}>
                          {isCardFlipped ? flashcards[currentCardIdx].answer : flashcards[currentCardIdx].question}
                        </p>
                      </div>

                      <div className="text-center text-[9px] font-bold text-zinc-400">
                        💡 Klik di mana saja pada kartu untuk membalik posisi.
                      </div>
                    </div>

                    {/* Hapus kartu ini + navigation */}
                    <div className="flex items-center gap-2 w-full max-w-md">
                      <button
                        onClick={() => {
                          setIsCardFlipped(false);
                          setCurrentCardIdx((currentCardIdx - 1 + flashcards.length) % flashcards.length);
                        }}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-[10px] font-bold"
                      >← Prev</button>
                      <button
                        onClick={() => handleDeleteFlashcard(flashcards[currentCardIdx].id)}
                        className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-xl text-[10px] font-black transition"
                      >🗑 Hapus Kartu Ini dari DB</button>
                      <button
                        onClick={() => {
                          setIsCardFlipped(false);
                          setCurrentCardIdx((currentCardIdx + 1) % flashcards.length);
                        }}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-[10px] font-bold"
                      >Next →</button>
                    </div>

                    {/* Feedback selection spaced repetition */}
                    {isCardFlipped && (
                      <div className="flex gap-2 w-full max-w-md animate-in fade-in duration-200">
                        <button
                          onClick={() => {
                            setReviewedCardsCount(reviewedCardsCount + 1);
                            setIsCardFlipped(false);
                            setCurrentCardIdx((currentCardIdx + 1) % flashcards.length);
                          }}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-black text-[10px] rounded-xl transition"
                        >
                          🔴 Hard (Review Segera)
                        </button>
                        <button
                          onClick={() => {
                            setReviewedCardsCount(reviewedCardsCount + 1);
                            setIsCardFlipped(false);
                            setCurrentCardIdx((currentCardIdx + 1) % flashcards.length);
                          }}
                          className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] rounded-xl transition"
                        >
                          🟡 Medium (Review Nanti)
                        </button>
                        <button
                          onClick={() => {
                            setReviewedCardsCount(reviewedCardsCount + 1);
                            setIsCardFlipped(false);
                            setCurrentCardIdx((currentCardIdx + 1) % flashcards.length);
                          }}
                          className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white font-black text-[10px] rounded-xl transition"
                        >
                          🟢 Easy (Sudah Hafal)
                        </button>
                      </div>
                    )}

                    <span className="text-[10px] font-bold text-zinc-400">
                      Kartu Berhasil Ditinjau Sesi Ini: <strong className="text-zinc-600">{reviewedCardsCount}</strong>
                    </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* APP 12: GPA CALCULATOR */}
            {activeApp === 'gpa-calculator' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-base font-black text-zinc-800">📈 GPA Tracker & Grade Target Projection</h2>
                  <p className="text-xs text-zinc-400 mt-1">Masukkan data nilai mata kuliah Anda untuk memproyeksikan target lulus Cumlaude.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Inputs */}
                  <form onSubmit={handleAddGrade} className="p-4.5 bg-zinc-50 border border-zinc-150 rounded-2xl flex flex-col gap-3">
                    <span className="text-xs font-black text-zinc-500">Tambah Nilai Mata Kuliah</span>
                    <input 
                      type="text" 
                      placeholder="Nama Matkul (misal: SBD UI)" 
                      value={newCourseName}
                      onChange={e => setNewCourseName(e.target.value)}
                      className="p-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
                      required
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-zinc-400">Bobot SKS:</span>
                        <select 
                          value={newCourseCredits} 
                          onChange={e => setNewCourseCredits(e.target.value)}
                          className="p-2 text-xs bg-white border border-zinc-200 rounded-xl text-zinc-600 font-bold"
                        >
                          <option>2</option>
                          <option>3</option>
                          <option>4</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-zinc-400">Nilai Didapat:</span>
                        <select 
                          value={newCourseGrade} 
                          onChange={e => setNewCourseGrade(e.target.value)}
                          className="p-2 text-xs bg-white border border-zinc-200 rounded-xl text-zinc-600 font-bold"
                        >
                          <option>A</option>
                          <option>A-</option>
                          <option>B+</option>
                          <option>B</option>
                          <option>B-</option>
                          <option>C+</option>
                          <option>C</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full mt-2 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl">
                      Simpan Nilai
                    </button>
                  </form>

                  {/* Calculations displays */}
                  <div className="flex flex-col gap-4">
                    <div className="p-5 bg-zinc-50 border border-zinc-150 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase">PROYEKSI IP SEMESTER</span>
                        <h3 className="text-2xl font-black text-zinc-800 mt-1">{calculateGpa()}</h3>
                      </div>
                      <span className="text-3xl">🎯</span>
                    </div>

                    <div className="p-4 bg-white border border-zinc-150 rounded-2xl">
                      <span className="text-[9px] font-black text-zinc-400 uppercase">ANALSIS CUM LAUDE</span>
                      <p className="text-[10px] font-semibold text-zinc-500 leading-relaxed mt-1">
                        {calculateGpa() >= 3.5 ? 
                          '🎉 Pertahankan! IP Anda saat ini telah memenuhi syarat kualifikasi kelulusan predikat Cum Laude UI.' : 
                          '💡 Target belum tercapai. Tingkatkan nilai A Anda pada sisa 4 mata kuliah berikutnya.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black text-zinc-400 px-1">Mata Kuliah Disimpan</span>
                      <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                        {grades.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic py-4 text-center">Belum ada data nilai. Tambahkan matkul di atas.</p>
                        ) : grades.map(g => (
                          <div key={g.id} className="p-2 bg-white border border-zinc-150 rounded-xl flex justify-between items-center text-[10px] font-bold">
                            <span className="text-zinc-600 truncate">{g.name} ({g.credits} SKS)</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md font-black">{g.grade}</span>
                              <button
                                onClick={() => handleDeleteGrade(g.id)}
                                className="w-5 h-5 flex items-center justify-center text-zinc-300 hover:text-red-500 transition rounded"
                                title="Hapus"
                              >✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APP 14: GRAPH BUDDY MATCHMAKER */}
            {activeApp === 'matchmaker' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-base font-black text-zinc-800">❤️ Graph Classmate Proximity Matchmaker</h2>
                  <p className="text-xs text-zinc-400 mt-1">Cari teman sekelompok berdasarkan kecocokan mata kuliah yang diambil dan kesamaan jam kosong riset.</p>
                </div>

                <div className="flex flex-col gap-3.5">
                  {classmates.map((c, i) => (
                    <div key={i} className="p-4 bg-white border border-zinc-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white font-extrabold text-sm shadow-inner">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-zinc-800">{c.name}</h4>
                            <span className="px-1.5 py-0.5 text-[8px] font-black bg-pink-50 text-pink-600 border border-pink-100 rounded">
                              {c.overlapScore}% MATCH
                            </span>
                          </div>
                          <p className="text-[9px] text-zinc-400 font-semibold mt-1">
                            Shared Courses: {c.classes.join(', ')} • Jam Kosong: {c.freeHours}
                          </p>
                        </div>
                      </div>

                      <a
                        href={`https://wa.me/${c.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 text-[10px] font-black bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-sm text-center shrink-0"
                      >
                        Ajak Belajar Bareng
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* APP 15: REMINDERS (INTERACTIVE SCHEDULES) */}
            {activeApp === 'calendar' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-base font-black text-zinc-800">📅 Schedule Reminders & Timeline Matrix</h2>
                  <p className="text-xs text-zinc-400 mt-1">Pantau sisa waktu menuju agenda akademik Anda secara real-time.</p>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Countdown Jumbotron */}
                  <div className="p-6 bg-gradient-to-br from-indigo-900 to-zinc-950 text-white rounded-3xl text-center shadow-lg relative overflow-hidden">
                    <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">HITUNG MUNDUR JADWAL TERDEKAT</span>
                    <h3 className="text-xl sm:text-2xl font-black mt-2 font-mono tracking-tight text-amber-400">
                      {timeLeft || 'Memuat hitung mundur...'}
                    </h3>
                  </div>

                  {/* Form to add reminder */}
                  <form onSubmit={handleAddReminder} className="p-4.5 bg-zinc-50 border border-zinc-150 rounded-2xl flex flex-col gap-3">
                    <span className="text-xs font-black text-zinc-500">Tambah Agenda / Schedule Baru</span>
                    <input 
                      type="text" 
                      placeholder="Nama Agenda (misal: Kuis Praktikum SBD)" 
                      value={newReminderTitle}
                      onChange={e => setNewReminderTitle(e.target.value)}
                      className="p-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="date" 
                        value={newReminderDate}
                        onChange={e => setNewReminderDate(e.target.value)}
                        className="p-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold text-zinc-700"
                        required
                      />
                      <select 
                        value={newReminderPriority} 
                        onChange={e => setNewReminderPriority(e.target.value as any)}
                        className="p-2.5 text-xs bg-white border border-zinc-200 rounded-xl text-zinc-650 font-bold text-zinc-700"
                      >
                        <option value="HIGH">HIGH PRIO</option>
                        <option value="MID">MID PRIO</option>
                        <option value="LOW">LOW PRIO</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full mt-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition shadow-sm">
                      Tambah Schedule
                    </button>
                  </form>

                  {/* Milestones List */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-black text-zinc-400 px-1">Daftar Agenda Pengingat</span>
                    
                    {reminders.length === 0 ? (
                      <p className="text-xs text-zinc-400 text-center py-4 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">Belum ada agenda belajar yang ditambahkan.</p>
                    ) : (
                      reminders.map(r => (
                        <div key={r.id} className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex items-center gap-3 text-xs font-semibold justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.priority === 'HIGH' ? 'bg-rose-500' : r.priority === 'MID' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                            <div className="flex-1">
                              <h4 className="text-zinc-700 font-extrabold">{r.title}</h4>
                              <p className="text-[10px] text-zinc-400 mt-0.5">Tanggal: {r.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${r.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : r.priority === 'MID' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                              {r.priority} PRIO
                            </span>
                            <button 
                              type="button"
                              onClick={() => handleDeleteReminder(r.id)}
                              className="text-red-500 hover:text-red-700 font-bold px-1"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
