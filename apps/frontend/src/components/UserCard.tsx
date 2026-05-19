import React from 'react';
import { Button } from '@/components/ui/Button';

interface UserProps {
  id: string;
  name: string;
  bio?: string;
  profilePicture?: string;
  jurusan?: string;
  fakultas?: string;
  angkatan?: string;
  skills?: string[];
  interests?: string[];
}

import Link from 'next/link';

const unwrapNeo4jInt = (val: any): any => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object' && val !== null) {
    if ('low' in val && typeof val.low === 'number') {
      return val.low;
    }
  }
  return val;
};

export default function UserCard({ user, matchReason, connectionStatus, onConnect }: { user: UserProps, matchReason?: string, connectionStatus?: 'none' | 'pending' | 'friends', onConnect?: () => void }) {
  return (
    <div className="flex flex-col p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] rounded-3xl transition-all duration-300 ease-out hover:bg-white hover:scale-[1.01] hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.08)]">
      <Link href={`/user/${user.id}`} className="flex items-center gap-4 mb-3 hover:opacity-80 transition-opacity">
        {user?.profilePicture ? (
          <img src={user.profilePicture} alt={user.name} className="w-14 h-14 rounded-full object-cover border border-black/10" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-zinc-200 border border-black/10 flex items-center justify-center text-xl font-medium text-zinc-500">
            {user?.name?.charAt(0) || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight truncate">{user?.name || 'Unknown'}</h3>
          <p className="text-xs text-gray-500 truncate">
            {user.jurusan || 'No Jurusan'}
          </p>
          <p className="text-xs text-gray-500 truncate">
             {unwrapNeo4jInt(user.angkatan) || 'No Angkatan'}
          </p>
        </div>
      </Link>
      
      {user?.bio && (
        <p className="text-sm text-zinc-600 mb-4 line-clamp-2">{user.bio}</p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4 mt-auto">
        {user?.skills?.map((skill: string) => (
          <span key={skill} className="px-2.5 py-1 text-xs font-medium bg-zinc-100 text-zinc-600 rounded-lg border border-black/5">
            {skill}
          </span>
        ))}
        {user?.interests?.map((interest: string) => (
          <span key={interest} className="px-2.5 py-1 text-xs font-medium bg-[#0071E3]/10 text-[#0071E3] rounded-lg border border-[#0071E3]/20">
            {interest}
          </span>
        ))}
      </div>

      {matchReason && (
        <div className="mb-4 text-xs font-medium text-[#0071E3] bg-[#0071E3]/5 rounded-xl px-3 py-2 border border-[#0071E3]/10">
          ✨ {matchReason}
        </div>
      )}

      {connectionStatus === 'friends' ? (
        <Button variant="secondary" className="w-full mt-2" disabled>Friends</Button>
      ) : connectionStatus === 'pending' ? (
        <Button variant="secondary" className="w-full mt-2" disabled>Requested</Button>
      ) : (
        <Button variant="primary" className="w-full mt-2" onClick={onConnect}>Connect</Button>
      )}
    </div>
  );
}
