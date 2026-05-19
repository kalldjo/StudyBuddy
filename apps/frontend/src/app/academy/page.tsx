'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Course {
  id: string;
  title: string;
  badgeTitle: string;
  icon: string;
  desc: string;
  color: string;
  questions: {
    q: string;
    options: string[];
    correct: number;
  }[];
}

export default function AcademyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  const [courses] = useState<Course[]>([
    {
      id: 'c1',
      title: 'Neo4j Graph Database Fundamentals',
      badgeTitle: 'Neo4j Practitioner 🎓',
      icon: '📊',
      desc: 'Pelajari dasar-dasar pemodelan data berorientasi graf menggunakan Node dan Relationship untuk kecepatan kueri optimal.',
      color: 'from-[#7C3AED] to-[#3B82F6]',
      questions: [
        {
          q: 'Apa fungsi utama dari relasi (relationship) dalam Graph Database?',
          options: [
            'Menghubungkan node secara terarah dan dapat memiliki tipe data/properti khusus.',
            'Menyimpan data baris mentah di dalam tabel relasional statis.',
            'Melakukan enkripsi satu arah terhadap data sensitif seperti password.'
          ],
          correct: 0
        },
        {
          q: 'Bahasa kueri deklaratif resmi yang digunakan untuk berinteraksi dengan Neo4j adalah...',
          options: ['SQL (Structured Query Language)', 'Cypher Query Language', 'SPARQL Graph Protocol'],
          correct: 1
        },
        {
          q: 'Manakah di bawah ini yang merupakan representasi Node Label yang valid di Neo4j?',
          options: [':User', '-[:FRIEND]->', 'CONSTRAINT unique_id'],
          correct: 0
        }
      ]
    },
    {
      id: 'c2',
      title: 'Advanced Cypher Query Optimization',
      badgeTitle: 'Graph Master 🏆',
      icon: '⚡',
      desc: 'Optimalkan kueri traversal Anda dengan indeks, constraints, dan sintaks pencocokan graf lanjutan.',
      color: 'from-[#EC4899] to-[#8B5CF6]',
      questions: [
        {
          q: 'Sintaks Cypher mana yang benar untuk membuat indeks pencarian pada properti nama di node User?',
          options: [
            'CREATE INDEX FOR (u:User) ON (u.nama)',
            'SELECT INDEX ON User.nama',
            'MATCH (u:User) CREATE INDEX u.nama'
          ],
          correct: 0
        },
        {
          q: 'Kata kunci (keyword) Cypher apa yang digunakan untuk membuat node baru jika belum ada, atau mengambilnya jika sudah ada?',
          options: ['CREATE', 'MERGE', 'MATCH'],
          correct: 1
        },
        {
          q: 'Keyword Cypher apa yang digunakan untuk menghapus relasi atau sisi berarah di Neo4j?',
          options: ['DELETE', 'REMOVE', 'DROP'],
          correct: 0
        }
      ]
    },
    {
      id: 'c3',
      title: 'Database Normalization & Relational Architecture',
      badgeTitle: 'SQL Expert 📜',
      icon: '🏛️',
      desc: 'Kuasai arsitektur database relasional dari 1NF, 2NF, hingga 3NF untuk menjaga integritas data tanpa redundansi.',
      color: 'from-[#10B981] to-[#3B82F6]',
      questions: [
        {
          q: 'Aturan Normalisasi Pertama (1NF) mengharuskan setiap atribut/kolom memiliki nilai yang...',
          options: [
            'Atomik (nilai tunggal yang tidak dapat dipecah lagi).',
            'Bernilai ganda atau berupa array terstruktur.',
            'Wajib bernilai NULL.'
          ],
          correct: 0
        },
        {
          q: 'Sebuah tabel berada dalam bentuk Normalisasi Kedua (2NF) jika sudah memenuhi 1NF dan...',
          options: [
            'Tidak memiliki ketergantungan sebagian (parsial) terhadap Primary Key.',
            'Tidak memiliki ketergantungan transitif terhadap kolom non-key.',
            'Semua kolom berupa angka desimal.'
          ],
          correct: 0
        },
        {
          q: 'Bentuk normalisasi yang dirancang khusus untuk mengatasi ketergantungan transitif adalah...',
          options: ['1NF', '2NF', '3NF'],
          correct: 2
        }
      ]
    },
    {
      id: 'c4',
      title: 'CRISP-DM Data Analytics Workflow',
      badgeTitle: 'Data Scientist 🚀',
      icon: '🧪',
      desc: 'Pahami metodologi standar industri analisis data dari eksplorasi awal hingga implementasi kode model.',
      color: 'from-[#F59E0B] to-[#EF4444]',
      questions: [
        {
          q: 'Manakah urutan dua fase awal yang benar pada standar metodologi CRISP-DM?',
          options: [
            'Business Understanding -> Data Understanding',
            'Data Preparation -> Evaluation',
            'Modeling -> Deployment'
          ],
          correct: 0
        },
        {
          q: 'Fase CRISP-DM mana yang berfokus pada pengerjaan coding Label Encoding dan penghapusan kolom yang tidak terpakai?',
          options: ['Data Understanding', 'Data Preparation', 'Business Understanding'],
          correct: 1
        },
        {
          q: 'Tujuan utama dari fase Evaluation sebelum model dideploy ke sistem produksi adalah...',
          options: [
            'Memastikan model yang dibangun memenuhi tujuan bisnis secara akurat dan valid.',
            'Menghapus seluruh baris data kosong di database.',
            'Menulis dokumen laporan akademis sebanyak 500 halaman.'
          ],
          correct: 0
        }
      ]
    }
  ]);

  const [earnedCertificates, setEarnedCertificates] = useState<any[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(true);

  // Exam States
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [examPassed, setExamPassed] = useState<boolean | null>(null);
  const [submittingExam, setSubmittingExam] = useState(false);
  const [newCertificate, setNewCertificate] = useState<any | null>(null);

  const fetchCredentials = async () => {
    setLoadingCertificates(true);
    try {
      const res = await apiFetch('/academy/my-credentials');
      setEarnedCertificates(res.data || []);
    } catch (e) {
      console.error('Failed to load certificates', e);
    } finally {
      setLoadingCertificates(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCredentials();
    }
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return <div className="p-20 text-center text-zinc-500 font-semibold">Loading Academy environment...</div>;
  }

  const handleStartExam = (course: Course) => {
    setActiveCourse(course);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setExamPassed(null);
    setNewCertificate(null);
  };

  const handleSelectOption = (optionIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleNextOrSubmit = async () => {
    if (!activeCourse) return;

    if (currentQuestionIndex < activeCourse.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Evaluate quiz
      setSubmittingExam(true);
      try {
        let allCorrect = true;
        for (let i = 0; i < activeCourse.questions.length; i++) {
          if (selectedAnswers[i] !== activeCourse.questions[i].correct) {
            allCorrect = false;
            break;
          }
        }

        setExamPassed(allCorrect);

        if (allCorrect) {
          // Send request to backend to save dynamic certificate
          const res = await apiFetch('/academy/earn', {
            method: 'POST',
            body: JSON.stringify({
              courseTitle: activeCourse.title,
              titleAwarded: activeCourse.badgeTitle,
              passed: true
            })
          });

          if (res.data) {
            setNewCertificate(res.data);
            await fetchCredentials();
          }
        }
      } catch (error) {
        console.error(error);
        alert('Gagal mengirim jawaban ujian.');
      } finally {
        setSubmittingExam(false);
      }
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* Dynamic Header banner */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#4f46e5_0%,transparent_40%)] opacity-30" />
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
            StudyBuddy Academy 🎓
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mt-4 leading-tight">
            Level Up Your Database Credentials!
          </h1>
          <p className="text-zinc-400 font-semibold text-xs md:text-sm mt-3 leading-relaxed">
            Selesaikan modul kuis basis data akademis, raih gelar kompetensi profesional, dan pajang sertifikasi emas permanen langsung pada profil akun Anda!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: Course list grid */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">Available Certifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map(course => {
              const isEarned = earnedCertificates.some(c => c.courseTitle === course.title);
              return (
                <div 
                  key={course.id} 
                  className="bg-white/70 backdrop-blur-xl border border-white/45 shadow-[0_8px_32px_rgba(0,0,0,0.03)] p-6 rounded-3xl flex flex-col justify-between hover:scale-[1.01] transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <span className="text-3xl">{course.icon}</span>
                      <h3 className="font-extrabold text-sm text-[#1D1D1F] leading-tight">{course.title}</h3>
                    </div>
                    <p className="text-zinc-500 text-xs font-semibold leading-relaxed mb-6">{course.desc}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 pt-4 mt-auto">
                    <span className="text-[10px] font-extrabold text-[#0071E3] bg-[#0071E3]/5 border border-[#0071E3]/10 px-2 py-0.5 rounded uppercase">
                      {course.badgeTitle.split(' ')[0]} Badge
                    </span>
                    
                    {isEarned ? (
                      <span className="px-3.5 py-1.5 bg-green-500 text-white font-extrabold text-[10px] rounded-xl flex items-center gap-1 shadow-sm">
                        ✕ Completed ✓
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleStartExam(course)}
                        className="px-4.5 py-1.5 bg-logo-gradient text-white font-extrabold text-[10px] rounded-xl hover:opacity-90 shadow-sm transition"
                      >
                        Start Exam
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: User's credentials status */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">My Badges</h2>
          
          <div className="bg-white/70 backdrop-blur-xl border border-white/45 shadow-sm p-6 rounded-3xl flex flex-col gap-5">
            <h3 className="text-xs font-extrabold text-[#1D1D1F] uppercase tracking-wider flex items-center gap-2">
              🏆 Verified Credentials
            </h3>
            
            {loadingCertificates ? (
              <div className="py-8 text-center text-zinc-400 font-medium text-xs">Loading certificates...</div>
            ) : earnedCertificates.length === 0 ? (
              <div className="py-12 border border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                <span className="text-3xl text-zinc-300">📜</span>
                <span className="text-zinc-400 font-semibold text-xs mt-3 leading-relaxed">
                  Belum ada sertifikat terdaftar. Selesaikan ujian di samping untuk mendapatkan sertifikat emas pertama Anda!
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {earnedCertificates.map(cert => (
                  <div 
                    key={cert.id} 
                    className="p-4 bg-gradient-to-br from-yellow-50/50 to-amber-50/50 border border-yellow-200 rounded-2xl flex flex-col gap-2 relative shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎖️</span>
                      <div>
                        <h4 className="text-xs font-black text-amber-950 leading-tight">{cert.titleAwarded}</h4>
                        <p className="text-[9px] font-bold text-amber-600/80 uppercase tracking-widest mt-0.5">{cert.certificateId}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-yellow-100 text-[9px] font-bold text-amber-700">
                      <span>Lulus pada {new Date(cert.earnedAt).toLocaleDateString()}</span>
                      <span className="bg-yellow-100 border border-yellow-200 px-1.5 py-0.5 rounded text-[8px]">Neo4j Secure</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXAM MODAL DIALOG */}
      {activeCourse && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 backdrop-blur-2xl border border-white/55 shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-w-xl w-full rounded-3xl p-6 md:p-8 animate-in zoom-in-95 duration-200 relative">
            
            {/* Header info */}
            <div className="flex justify-between items-start gap-4 pb-4 border-b border-zinc-100 mb-6">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-[#0071E3] bg-[#0071E3]/5 border border-[#0071E3]/15 px-2 py-0.5 rounded">
                  Academic Evaluation
                </span>
                <h3 className="text-lg font-extrabold text-zinc-800 mt-2">{activeCourse.title}</h3>
              </div>
              <button 
                onClick={() => setActiveCourse(null)}
                className="text-zinc-400 hover:text-zinc-600 font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Exam Step: Quiz Questions or Exam Result */}
            {examPassed === null ? (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center text-[10px] font-extrabold text-[#0071E3] uppercase tracking-wider mb-2">
                  <span>Question {currentQuestionIndex + 1} of {activeCourse.questions.length}</span>
                  <span>passing requirement: 100% score</span>
                </div>

                <p className="text-sm font-extrabold text-zinc-800 leading-relaxed mb-2">
                  {activeCourse.questions[currentQuestionIndex].q}
                </p>

                <div className="flex flex-col gap-2.5">
                  {activeCourse.questions[currentQuestionIndex].options.map((option, idx) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                    return (
                      <button 
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full p-4 rounded-2xl text-left text-xs font-semibold leading-relaxed border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' : 'bg-zinc-50/50 hover:bg-zinc-50 border-zinc-100 text-zinc-600 hover:text-zinc-800'}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100">
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      if (currentQuestionIndex > 0) {
                        setCurrentQuestionIndex(prev => prev - 1);
                      }
                    }}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleNextOrSubmit}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined || submittingExam}
                    className="px-6 py-2 text-xs"
                  >
                    {currentQuestionIndex === activeCourse.questions.length - 1 ? (submittingExam ? 'Mengirim...' : 'Selesai & Submit') : 'Selanjutnya'}
                  </Button>
                </div>
              </div>
            ) : examPassed ? (
              /* GOLDEN CERTIFICATE SUCCESS MODAL DISPLAY */
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center text-4xl animate-bounce mb-4">
                  🏆
                </div>
                
                <h4 className="text-xl font-extrabold text-[#1D1D1F] tracking-tight">Selamat! Anda Lulus Ujian!</h4>
                <p className="text-zinc-500 text-xs mt-2 leading-relaxed max-w-sm">
                  Anda menjawab seluruh pertanyaan kuis dengan benar dan berhasil meraih sertifikasi resmi:
                </p>

                {/* Glowing Premium gold certificate display card */}
                {newCertificate && (
                  <div className="w-full max-w-sm mt-6 p-6 rounded-3xl bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-50 border-4 border-yellow-300 shadow-[0_8px_32px_rgba(234,179,8,0.2)] relative overflow-hidden flex flex-col items-center">
                    <div className="absolute top-2 left-2 text-[7px] font-black uppercase text-amber-500 border border-amber-300 px-1 rounded">
                      StudyBuddy Certificate
                    </div>
                    
                    <span className="text-4xl mt-3">🎖️</span>
                    <h5 className="text-sm font-black text-amber-950 mt-4 leading-tight">CERTIFICATE OF COMPLETION</h5>
                    <p className="text-[8px] font-extrabold text-amber-600/70 tracking-widest uppercase mt-1">ISSUED SECURELY VIA BOLT</p>
                    
                    <div className="border-t border-b border-amber-200/60 w-full my-4 py-3 text-center">
                      <span className="text-[10px] font-bold text-zinc-500 block">DIBERIKAN KEPADA PENGGUNA TEROTENTIKASI</span>
                      <span className="text-sm font-black text-zinc-800 tracking-tight block mt-1.5">Verified Classmate</span>
                    </div>

                    <p className="text-[10px] font-extrabold text-amber-800 mt-1 italic">
                      "Atas pencapaian luar biasa menyelesaikan modul {newCertificate.courseTitle}"
                    </p>
                    
                    <span className="text-[10px] font-black text-amber-950 bg-yellow-200/50 border border-yellow-300 rounded px-3 py-1 mt-4">
                      Gelar: {newCertificate.titleAwarded}
                    </span>

                    <span className="text-[8px] font-black text-amber-600/60 font-mono mt-4">
                      ID Kredensial: {newCertificate.certificateId}
                    </span>
                  </div>
                )}

                <div className="mt-8 pt-4 border-t border-zinc-100 w-full flex justify-center">
                  <Button 
                    variant="primary" 
                    onClick={() => setActiveCourse(null)}
                    className="px-8 py-2 text-xs"
                  >
                    Luar Biasa, Tutup!
                  </Button>
                </div>
              </div>
            ) : (
              /* EXAM FAIL SCREEN */
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="bg-red-100 border border-red-200 w-16 h-16 rounded-full flex items-center justify-center text-4xl mb-4">
                  ❌
                </div>
                
                <h4 className="text-xl font-extrabold text-[#1D1D1F] tracking-tight">Ujian Belum Lulus!</h4>
                <p className="text-zinc-500 text-xs mt-2 leading-relaxed max-w-sm">
                  Ada jawaban kuis yang masih kurang tepat. Syarat kelulusan adalah skor sempurna **100%**. 
                  Jangan berkecil hati, review modul belajar Anda dan coba kembali kapan saja!
                </p>

                <div className="mt-6 pt-4 border-t border-zinc-100 w-full flex justify-center gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => setActiveCourse(null)}
                    className="px-6 py-2 text-xs"
                  >
                    Tutup
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => handleStartExam(activeCourse)}
                    className="px-6 py-2 text-xs"
                  >
                    Ulangi Ujian
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </main>
  );
}
