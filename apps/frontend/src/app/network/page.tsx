"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/utils/api";

import { Button } from "@/components/ui/Button";
import UserCard from "@/components/UserCard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NetworkPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const fetchNetworkData = async () => {
    try {
      const requestsRes = await apiFetch("/friends/requests");
      setRequests(requestsRes.data || []);

      const friendsRes = await apiFetch("/friends/list");
      setFriends(friendsRes.data || []);
    } catch (e) {
      console.error("Failed to fetch network data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNetworkData();
    }
  }, [isAuthenticated]);

  const handleAccept = async (id: string) => {
    try {
      await apiFetch("/friends/accept", {
        method: "POST",
        body: JSON.stringify({ targetId: id }),
      });
      const acceptedUser = requests.find((r) => r.id === id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (acceptedUser) {
        setFriends((prev) => [...prev, acceptedUser]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiFetch("/friends/reject", {
        method: "POST",
        body: JSON.stringify({ targetId: id }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || !isAuthenticated || loading) return <div className="p-20 text-center text-zinc-500">Loading network lists...</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
      {/* Premium Header */}
      <div className="mb-4 ">
        <h1 className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight mb-2">My Connection</h1>
        <p className="text-sm text-zinc-400 font-semibold max-w-xl">Discover collaborators, study partners, and smart networks based on Faculty, Major, and Batch.</p>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.02)] rounded-3xl p-5 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Connections</span>
          <span className="text-2xl font-black text-[#1D1D1F]">{friends.length}</span>
        </div>
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.02)] rounded-3xl p-5 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Invitations</span>
          <span className="text-2xl font-black text-[#1D1D1F]">{requests.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Connections */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          {/* Connections Grid */}
          <section>
            <h2 className="text-lg font-extrabold text-[#1D1D1F] tracking-tight mb-5">My Friends</h2>

            {friends.length === 0 ? (
              <div className="p-8 bg-white/60 backdrop-blur-xl border border-zinc-150 text-zinc-400 text-xs font-semibold rounded-3xl shadow-sm text-center italic">You haven't added any friends yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {friends.map((friend) => (
                  <UserCard key={friend.id} user={friend} connectionStatus="friends" />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Incoming Invites */}
        <div className="lg:col-span-4 mt-12">
          <section className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-6 flex flex-col gap-5 sticky top-24 h-full">
            <div>
              <h2 className="text-sm font-extrabold text-[#1D1D1F] tracking-tight uppercase tracking-wider text-zinc-400">Incoming Invitations</h2>
            </div>

            {requests.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-bold bg-zinc-50/50 border border-zinc-150 rounded-2xl italic">No pending requests.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((req) => (
                  <div key={req.id} className="p-4 bg-white border border-zinc-150 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow transition duration-200">
                    <Link href={`/user/${req.id}`} className="flex items-center gap-3 hover:opacity-85 transition">
                      {req.profilePicture ? <img src={req.profilePicture} alt={req.name} className="w-9 h-9 rounded-full object-cover border border-black/5" /> : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0071E3] to-[#3692EC] text-white flex items-center justify-center font-black text-xs">{req.name?.charAt(0).toUpperCase()}</div>}
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-zinc-850 truncate">{req.name}</h4>
                        <p className="text-[9px] font-semibold text-zinc-400 truncate mt-0.5">{req.jurusan || "Student"}</p>
                      </div>
                    </Link>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(req.id)} className="flex-1 py-1.5 bg-[#0071E3] hover:bg-[#0071E3]/95 text-white font-bold text-[10px] rounded-xl shadow-sm transition">
                        Accept
                      </button>
                      <button onClick={() => handleReject(req.id)} className="flex-1 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-bold text-[10px] rounded-xl shadow-sm transition">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
