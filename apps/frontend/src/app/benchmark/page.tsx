'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';

interface BenchmarkResult {
  neo4jTimeMs: number;
  sqliteTimeMs: number;
  conclusion: string;
  runs?: Array<{
    run: number;
    neo4jTimeMs: number;
    neo4jDbOnlyTimeMs: number;
    sqliteTimeMs: number;
  }>;
  stats?: {
    neo4j: { avg: number; avgDbOnly: number; min: number; max: number };
    sqlite: { avg: number; min: number; max: number };
  };
}

export default function BenchmarkPage() {
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [history, setHistory] = useState<BenchmarkResult[]>([]);

  const runBenchmark = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/debug/benchmark');
      const data = res.data as BenchmarkResult;
      setResult(data);
      setRunCount(prev => prev + 1);
      setHistory(prev => [data, ...prev].slice(0, 5)); // keep last 5 runs
    } catch (err: any) {
      setError(err.message || 'Benchmark gagal dijalankan');
    } finally {
      setLoading(false);
    }
  };

  // auto run on mount
  useEffect(() => {
    runBenchmark();
  }, []);

  const maxTime = result ? Math.max(result.neo4jTimeMs, result.sqliteTimeMs, 1) : 1;
  const neo4jPct = result ? (result.neo4jTimeMs / maxTime) * 100 : 0;
  const sqlitePct = result ? (result.sqliteTimeMs / maxTime) * 100 : 0;
  const neo4jWins = result ? result.neo4jTimeMs < result.sqliteTimeMs : false;
  const speedRatio = result
    ? neo4jWins
      ? (result.sqliteTimeMs / result.neo4jTimeMs).toFixed(1)
      : (result.neo4jTimeMs / result.sqliteTimeMs).toFixed(1)
    : '—';

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-10 flex flex-col gap-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition">← Back to Feed</Link>
          </div>
          <h1 className="text-2xl font-black text-[#1D1D1F] tracking-tight">
            🔬 DB Performance Benchmark
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time comparison: <strong>Neo4j Graph DB</strong> vs <strong>SQLite Relational DB</strong> on <em>Friends-of-Friends traversal</em>
          </p>
        </div>
        <button
          onClick={runBenchmark}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-logo-gradient text-white text-xs font-extrabold rounded-2xl shadow hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Running...
            </>
          ) : '▶ Run Benchmark'}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-600">
          ⚠️ {error}. Pastikan backend berjalan dan Neo4j terhubung.
        </div>
      )}

      {/* Main result card */}
      {result && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* WINNER BADGE */}
          <div className={`lg:col-span-3 p-5 rounded-3xl border flex items-center gap-5 ${neo4jWins ? 'bg-indigo-50 border-indigo-150' : 'bg-amber-50 border-amber-150'}`}>
            <span className="text-4xl">{neo4jWins ? '🏆' : '⚡'}</span>
            <div>
              <p className={`text-[10px] font-extrabold uppercase tracking-widest ${neo4jWins ? 'text-indigo-500' : 'text-amber-600'}`}>
                {runCount > 1 ? `Run #${runCount} — ` : ''}Hasil Benchmark
              </p>
              <h2 className={`text-base font-black mt-0.5 ${neo4jWins ? 'text-indigo-700' : 'text-amber-700'}`}>
                {neo4jWins ? 'Neo4j Graph DB' : 'SQLite Relational DB'} lebih cepat {speedRatio}× pada query ini!
              </h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{result.conclusion}</p>
            </div>
          </div>

          {/* NEO4J BAR */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Neo4j Graph DB</p>
                <p className="text-xs font-semibold text-zinc-600 mt-0.5">Index-Free Adjacency</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[9px] font-black text-zinc-400 uppercase">Response Time</span>
                <span className="text-xl font-black text-indigo-600">{result.neo4jTimeMs}<span className="text-xs font-bold ml-1">ms</span></span>
              </div>
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
                  style={{ width: `${neo4jPct}%` }}
                />
              </div>
            </div>

            {neo4jWins && (
              <span className="self-start px-3 py-1 bg-indigo-600 text-white text-[9px] font-extrabold rounded-full">🏆 WINNER</span>
            )}
          </div>

          {/* SQLITE BAR */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">SQLite In-Memory</p>
                <p className="text-xs font-semibold text-zinc-600 mt-0.5">Relational JOIN-based</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[9px] font-black text-zinc-400 uppercase">Response Time</span>
                <span className="text-xl font-black text-amber-600">{result.sqliteTimeMs}<span className="text-xs font-bold ml-1">ms</span></span>
              </div>
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${sqlitePct}%` }}
                />
              </div>
            </div>

            {!neo4jWins && (
              <span className="self-start px-3 py-1 bg-amber-500 text-white text-[9px] font-extrabold rounded-full">🏆 WINNER</span>
            )}
          </div>

          {/* INFO CARD */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl p-6 flex flex-col gap-4">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Metodologi Benchmark</p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <span className="text-lg shrink-0">🔗</span>
                <p className="text-[10px] font-semibold text-zinc-600 leading-relaxed">
                  <strong>Query:</strong> Friends-of-Friends (FoF) Traversal — cari semua teman dari teman setiap user, kecuali yang sudah berteman langsung.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-lg shrink-0">🗂️</span>
                <p className="text-[10px] font-semibold text-zinc-600 leading-relaxed">
                  <strong>Dataset:</strong> 1.000 users, 5.000 random bidirectional friendships. SQLite pakai <em>indexed JOIN</em>, Neo4j pakai <em>pointer traversal</em>.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-lg shrink-0">⚡</span>
                <p className="text-[10px] font-semibold text-zinc-600 leading-relaxed">
                  <strong>Kenapa Neo4j cepat?</strong> Neo4j menyimpan relasi sebagai pointer fisik langsung (Index-Free Adjacency), bukan melalui JOIN table.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10-Run Statistical Breakdown */}
      {result && result.runs && !loading && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl p-6 flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Statistical Analysis</p>
              <h3 className="text-lg font-black text-[#1D1D1F] tracking-tight mt-0.5">Automated 10x Iterations Breakdown</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Rata-rata dihitung dari 10 kali eksekusi beruntun untuk meminimalkan anomali cold-start atau delay sementara.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-xl border border-indigo-100">
                10 runs completed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">Neo4j Average (incl. Network)</span>
              <span className="text-lg font-black text-indigo-600 block mt-1">{result.stats?.neo4j.avg} ms</span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">Min: {result.stats?.neo4j.min}ms | Max: {result.stats?.neo4j.max}ms</span>
            </div>
            <div className="p-4 bg-violet-50/50 border border-violet-100/50 rounded-2xl">
              <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider block">Neo4j Engine-Only (No Network Overhead)</span>
              <span className="text-lg font-black text-violet-600 block mt-1">{result.stats?.neo4j.avgDbOnly} ms</span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">Murni eksekusi query di server Neo4j AuraDB</span>
            </div>
            <div className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider block">SQLite Average (In-Memory)</span>
              <span className="text-lg font-black text-amber-600 block mt-1">{result.stats?.sqlite.avg} ms</span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">Min: {result.stats?.sqlite.min}ms | Max: {result.stats?.sqlite.max}ms</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-zinc-150 rounded-2xl">
            <table className="w-full text-[11px] font-semibold text-zinc-600 border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] text-zinc-400 uppercase tracking-wider font-black">
                  <th className="text-left py-3 px-4">Run #</th>
                  <th className="text-right py-3 px-4 text-indigo-600">Neo4j Total (ms)</th>
                  <th className="text-right py-3 px-4 text-violet-600">Neo4j DB-Only (ms)</th>
                  <th className="text-right py-3 px-4 text-amber-600">SQLite Time (ms)</th>
                  <th className="text-right py-3 px-4">Winner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {result.runs?.map((r, idx) => {
                  const runNeo4jWins = r.neo4jTimeMs < r.sqliteTimeMs;
                  return (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition">
                      <td className="py-2.5 px-4 font-bold text-zinc-400">Run #{r.run}</td>
                      <td className={`py-2.5 px-4 text-right font-black ${runNeo4jWins ? 'text-indigo-600' : 'text-zinc-500'}`}>{r.neo4jTimeMs}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-violet-600">{r.neo4jDbOnlyTimeMs}</td>
                      <td className={`py-2.5 px-4 text-right font-black ${!runNeo4jWins ? 'text-amber-600' : 'text-zinc-500'}`}>{r.sqliteTimeMs}</td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        {runNeo4jWins ? '🏆 Neo4j' : '⚡ SQLite'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`${i === 0 ? 'lg:col-span-3' : ''} h-36 bg-zinc-100 rounded-3xl animate-pulse`} />
          ))}
        </div>
      )}

      {/* Run History */}
      {history.length > 1 && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl p-6 flex flex-col gap-4">
          <p className="text-xs font-extrabold text-[#1D1D1F] uppercase tracking-wider">Riwayat Benchmark (Last {history.length} Runs)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-semibold text-zinc-600">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-2 text-zinc-400 font-black">RUN</th>
                  <th className="text-right py-2 text-indigo-500 font-black">Neo4j (ms)</th>
                  <th className="text-right py-2 text-amber-500 font-black">SQLite (ms)</th>
                  <th className="text-right py-2 text-zinc-400 font-black">WINNER</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-zinc-50">
                    <td className="py-2 text-zinc-400">#{history.length - i}</td>
                    <td className={`py-2 text-right font-black ${h.neo4jTimeMs < h.sqliteTimeMs ? 'text-indigo-600' : 'text-zinc-500'}`}>{h.neo4jTimeMs}</td>
                    <td className={`py-2 text-right font-black ${h.sqliteTimeMs < h.neo4jTimeMs ? 'text-amber-600' : 'text-zinc-500'}`}>{h.sqliteTimeMs}</td>
                    <td className="py-2 text-right">{h.neo4jTimeMs < h.sqliteTimeMs ? '🏆 Neo4j' : '⚡ SQLite'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Theory Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider mb-2">Keunggulan Graph DB (Neo4j)</p>
          <ul className="flex flex-col gap-1.5 text-[10px] font-semibold text-indigo-700">
            <li>✅ <strong>Index-Free Adjacency:</strong> traversal langsung melalui pointer, tanpa JOIN</li>
            <li>✅ Performa tetap konstan saat graph makin besar (<em>O(log n)</em> vs <em>O(n²)</em> pada RDBMS)</li>
            <li>✅ Query multi-hop (FoF, FoFoF) sangat efisien dengan Cypher</li>
            <li>✅ Relasi sebagai first-class citizen: mudah menambah tipe relasi baru</li>
          </ul>
        </div>
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider mb-2">Keterbatasan Relational DB (SQLite/SQL)</p>
          <ul className="flex flex-col gap-1.5 text-[10px] font-semibold text-amber-700">
            <li>⚠️ FoF query butuh <strong>nested JOIN</strong> yang makin lambat seiring data bertumbuh</li>
            <li>⚠️ Indeks hanya membantu di kolom tertentu, tidak di semua pola traversal</li>
            <li>⚠️ Menambah jenis relasi memerlukan perubahan schema (ALTER TABLE)</li>
            <li>⚠️ Tidak dirancang untuk data dengan banyak interkoneksi</li>
          </ul>
        </div>
      </div>

    </main>
  );
}
