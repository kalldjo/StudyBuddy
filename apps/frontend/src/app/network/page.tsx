'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/utils/api';

import { Button } from '@/components/ui/Button';
import UserCard from '@/components/UserCard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NetworkPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [projectMatches, setProjectMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const fetchNetworkData = async () => {
    try {
      const requestsRes = await apiFetch('/friends/requests');
      setRequests(requestsRes.data || []);
      
      const friendsRes = await apiFetch('/friends/list');
      setFriends(friendsRes.data || []);

      const matchesRes = await apiFetch('/recommend/projects');
      setProjectMatches(matchesRes.data || []);
    } catch (e) {
      console.error('Failed to fetch network data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNetworkData();
    }
  }, [isAuthenticated]);

  const handleAccept = async (id: string) => {
    try {
      await apiFetch('/friends/accept', {
        method: 'POST',
        body: JSON.stringify({ targetId: id })
      });
      const acceptedUser = requests.find(r => r.id === id);
      setRequests(prev => prev.filter(r => r.id !== id));
      if (acceptedUser) {
        setFriends(prev => [...prev, acceptedUser]);
      }
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiFetch('/friends/reject', {
        method: 'POST',
        body: JSON.stringify({ targetId: id })
      });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) { 
      console.error(e); 
    }
  };

  if (isLoading || !isAuthenticated || loading) return <div className="p-20 text-center text-zinc-500">Loading network lists...</div>;

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] mb-8">My Network</h1>
      
      <section className="mb-12">
        <h2 className="text-xl font-medium text-[#1D1D1F] mb-4">Incoming Requests</h2>
        {requests.length === 0 ? (
          <div className="p-8 bg-white/50 backdrop-blur-md rounded-2xl border border-white/40 text-[#86868B] text-sm shadow-sm">
            No pending friend requests.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
               <div key={req.id} className="p-5 bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] rounded-2xl flex flex-col hover:-translate-y-0.5 transition-all">
                  <Link href={`/user/${req.id}`} className="flex items-center gap-3 mb-4 hover:opacity-85 transition-opacity">
                     {req.profilePicture ? (
                       <img src={req.profilePicture} alt={req.name} className="w-10 h-10 rounded-full object-cover border border-black/5" />
                     ) : (
                       <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-medium text-zinc-500">
                         {req.name?.charAt(0)}
                       </div>
                     )}
                     <div>
                       <h3 className="font-semibold text-sm text-[#1D1D1F] tracking-tight">{req.name}</h3>
                       <p className="text-[10px] text-zinc-500">{req.jurusan || 'Student'}</p>
                     </div>
                  </Link>
                  <div className="flex gap-2 mt-auto">
                    <Button className="flex-1 !py-1.5 text-xs" onClick={() => handleAccept(req.id)}>Accept</Button>
                    <Button variant="secondary" className="flex-1 !py-1.5 text-xs" onClick={() => handleReject(req.id)}>Decline</Button>
                  </div>
               </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-500 align-middle" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09l2.846.813-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>
          AI Project Matches
        </h2>
        {projectMatches.length === 0 ? (
          <div className="p-8 bg-white/50 backdrop-blur-md rounded-2xl border border-white/40 text-[#86868B] text-sm shadow-sm">
            We couldn't find any ongoing projects matching your skills. Add more skills to your profile!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {projectMatches.map((match: any) => (
              <div key={match.project.id} className="p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] rounded-2xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-800">{match.project.title}</h3>
                    <p className="text-xs font-bold text-zinc-600 mt-1.5">Creator: {match.project.authorName}</p>
                  </div>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase px-2.5 py-1 rounded border border-indigo-200 shadow-sm">
                    {match.matchingSkills} matching skills
                  </span>
                </div>
                <p className="text-sm text-zinc-600 line-clamp-2 mt-2">{match.project.description}</p>
                <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-end">
                  <Link href={`/user/${match.project.authorId}`}>
                    <Button variant="secondary" className="text-xs text-indigo-600 border border-zinc-200 hover:bg-zinc-100">View Creator's Profile</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#1D1D1F] mb-4">My Friends</h2>
        {friends.length === 0 ? (
          <div className="p-8 bg-white/50 backdrop-blur-md rounded-2xl border border-white/40 text-[#86868B] text-sm shadow-sm">
            You haven't added any friends yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map((friend) => (
              <UserCard key={friend.id} user={friend} connectionStatus="friends" />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
