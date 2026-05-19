'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || ''
  });
  
  const [academic, setAcademic] = useState({ 
    fakultas: '', 
    jurusan: '', 
    angkatan: '' 
  });
  
  const [interestsInput, setInterestsInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchUserProfile = async () => {
      try {
        const response = await apiFetch(`/users/${user.id}`);
        const u = response.data?.user;
        if (u) {
          setProfile({
            name: u.name || '',
            bio: u.bio || '',
            profilePicture: u.profilePicture || ''
          });
          setAcademic({
            fakultas: u.fakultas || '',
            jurusan: u.jurusan || '',
            angkatan: u.angkatan ? String(u.angkatan) : ''
          });
          setSkillsInput(u.skills ? u.skills.join(', ') : '');
          setInterestsInput(u.interests ? u.interests.join(', ') : '');
        }
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    
    fetchUserProfile();
  }, [user?.id]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const resData = await response.json();
      setProfile(prev => ({ ...prev, profilePicture: resData.url }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...profile, ...academic })
      });
      
      const interests = interestsInput.split(',').map(s => s.trim()).filter(Boolean);
      const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
      
      await apiFetch('/users/interests', { method: 'PUT', body: JSON.stringify({ interests }) });
      await apiFetch('/users/skills', { method: 'PUT', body: JSON.stringify({ skills }) });
      
      const response = await apiFetch('/auth/me');
      login(response.data.user);
      
      alert('Profile updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return <div className="p-20 text-center text-zinc-500">Loading your profile configuration...</div>;
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] mb-8">Profile Settings</h1>
      
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] rounded-3xl p-8 mb-8 flex flex-col items-center">
        <h2 className="text-xl font-medium text-[#1D1D1F] mb-6 tracking-tight self-start">Profile Picture</h2>
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          {profile.profilePicture ? (
            <img src={profile.profilePicture} alt="Avatar" className="w-28 h-28 rounded-full object-cover border border-black/10 shadow-md transition group-hover:opacity-75" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-zinc-100 border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center text-zinc-400 group-hover:bg-zinc-200 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              <span className="text-[10px] font-medium">Upload</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-all">
            {uploading ? 'Uploading...' : 'Change Photo'}
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        <p className="text-xs text-zinc-400 mt-4">Click avatar to upload your picture directly to Cloudinary.</p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] rounded-3xl p-8 mb-8">
        <h2 className="text-xl font-medium text-[#1D1D1F] mb-6 tracking-tight">Personal Details</h2>
        <div className="flex flex-col gap-5">
          <Input label="Full Name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
          <Input label="Bio" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] rounded-3xl p-8 mb-8">
        <h2 className="text-xl font-medium text-[#1D1D1F] mb-6 tracking-tight">Academic Background</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Input label="Fakultas" placeholder="Fasilkom" value={academic.fakultas} onChange={e => setAcademic({...academic, fakultas: e.target.value})} />
          <Input label="Jurusan" placeholder="Ilmu Komputer" value={academic.jurusan} onChange={e => setAcademic({...academic, jurusan: e.target.value})} />
          <Input label="Angkatan" placeholder="2024" value={academic.angkatan} onChange={e => setAcademic({...academic, angkatan: e.target.value})} />
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] rounded-3xl p-8 mb-8">
        <h2 className="text-xl font-medium text-[#1D1D1F] mb-6 tracking-tight">Skills & Interests</h2>
        <div className="flex flex-col gap-5">
          <Input label="Skills (comma separated)" placeholder="React, Node.js, Python" value={skillsInput} onChange={e => setSkillsInput(e.target.value)} />
          <Input label="Interests (comma separated)" placeholder="AI, Web Development" value={interestsInput} onChange={e => setInterestsInput(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end mb-10">
        <Button onClick={handleSave} className="px-8" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </main>
  );
}
