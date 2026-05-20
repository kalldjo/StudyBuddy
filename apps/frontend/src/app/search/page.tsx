"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";
import UserCard from "@/components/UserCard";
import FilterSidebar from "@/components/FilterSidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [filters, setFilters] = useState({
    name: "",
    fakultas: "",
    jurusan: "",
    angkatan: "",
  });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.name) params.append("name", filters.name);
      if (filters.fakultas) params.append("fakultas", filters.fakultas);
      if (filters.jurusan) params.append("jurusan", filters.jurusan);
      if (filters.angkatan) params.append("angkatan", filters.angkatan);

      const response = await apiFetch(`/recommend/search?${params.toString()}`);
      setResults(response.data || []);
    } catch (err) {
      console.error("Error fetching search results:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [filters, isAuthenticated]);

  const handleConnect = async (targetId: string) => {
    try {
      await apiFetch("/friends/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });

      // Update local connection status instantly to provide immediate visual feedback
      setResults((prev) =>
        prev.map((item) => {
          const u = item.user || item;
          if (u.id === targetId) {
            return { ...item, connectionStatus: "pending" };
          }
          return item;
        }),
      );
    } catch (e) {
      console.error("Error connecting with user:", e);
      alert("Failed to send friend request. Please try again.");
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-[60vh] text-zinc-500 font-semibold animate-pulse text-sm">Loading search environment...</div>;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
      {/* Search Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">My Connection</h1>
        <p className="text-sm text-zinc-400 font-semibold max-w-xl">Discover collaborators, study partners, and smart networks based on Faculty, Major, and Batch.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Filter Sidebar */}
        <div className="lg:col-span-3">
          <FilterSidebar filters={filters} setFilters={setFilters} />
        </div>

        {/* Right Side: Results Grid */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {[1, 2, 4].map((i) => (
                <div key={i} className="h-44 bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] rounded-3xl" />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((item, idx) => {
                const targetUser = item.user || item;
                return <UserCard key={targetUser.id || idx} user={targetUser} connectionStatus={item.connectionStatus} onConnect={() => handleConnect(targetUser.id)} />;
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.02)]">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#1D1D1F]">No Study Partners Found</h3>
              <p className="text-xs text-zinc-400 font-semibold mt-1 max-w-sm">Try adjusting your filters on the left to find peers from other programs or years.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
