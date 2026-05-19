'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

const unwrapNeo4jInt = (val: any): any => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object' && val !== null) {
    if ('low' in val && typeof val.low === 'number') {
      return val.low;
    }
  }
  return val;
};

export default function UserProfileViewer() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const userId = params.id as string;
  
  // Base profile data states
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [earnedCertificates, setEarnedCertificates] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Active view states
  const [activeView, setActiveView] = useState<'profile' | 'graph_explorer' | 'direct_sync' | 'collab_requests'>('profile');
  const [activeTab, setActiveTab] = useState<'posts' | 'projects'>('posts');
  const [showNotifications, setShowNotifications] = useState(false);

  // Unified Composers State
  const [composerTab, setComposerTab] = useState<'post' | 'project'>('post');
  
  // Post composer inputs
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Project composer inputs
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projImage, setProjImage] = useState('');
  const [projDemo, setProjDemo] = useState('');
  const [projSkills, setProjSkills] = useState('');
  const [projSubmitting, setProjSubmitting] = useState(false);

  // Peer project collaboration requests modal state
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [selectedCollabProject, setSelectedCollabProject] = useState<any>(null);
  const [collabRole, setCollabRole] = useState('Frontend Developer');
  const [collabMessage, setCollabMessage] = useState('');
  const [collabSubmitting, setCollabSubmitting] = useState(false);

  // Incoming collaboration requests list state (for own profile)
  const [incomingRequests, setIncomingRequests] = useState<any[]>([
    {
      id: 'req_1',
      projectTitle: 'Study Buddy Monorepo',
      projectId: 'p_mock_1',
      requester: {
        id: 'user_sarah',
        name: 'Sarah Amanda',
        jurusan: 'Informatika',
        angkatan: '2024',
        profilePicture: ''
      },
      role: 'Database Architect',
      message: 'Hi admin! I saw you are looking for Cypher queries optimizer. I am highly interested and got a Scholar rank in databases!'
    },
    {
      id: 'req_2',
      projectTitle: 'CRISP-DM Analytics Pipeline',
      projectId: 'p_mock_2',
      requester: {
        id: 'user_rian',
        name: 'Rian Kurnia',
        jurusan: 'Sistem Informasi',
        angkatan: '2023',
        profilePicture: ''
      },
      role: 'Data Scientist',
      message: 'I have finished data preparation step 3 code models and would love to help you build the visual exploration charts.'
    }
  ]);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([
    { id: 'n1', text: 'Sarah Amanda sent you a friend request.', read: false, time: '2m ago' },
    { id: 'n2', text: 'PT Astra International recruiter viewed your resume card.', read: false, time: '1h ago' },
    { id: 'n3', text: 'Rian Kurnia requested to collaborate on your CRISP-DM project.', read: false, time: '3h ago' }
  ]);

  // Real-Time Direct Sync Chat States
  const [buddies, setBuddies] = useState<any[]>([]);
  const [loadingBuddies, setLoadingBuddies] = useState(false);
  const [activeChatBuddyId, setActiveChatBuddyId] = useState<string>('');
  const [activeChatBuddyName, setActiveChatBuddyName] = useState<string>('');
  const [buddyMessagesList, setBuddyMessagesList] = useState<any[]>([]);
  const [chatInputs, setChatInputs] = useState('');

  // Fetch dynamic chat buddies (friends)
  useEffect(() => {
    const loadChatBuddies = async () => {
      if (activeView !== 'direct_sync') return;
      setLoadingBuddies(true);
      try {
        const res = await apiFetch('/friends/list');
        const list = res.data || [];
        setBuddies(list);
        if (list.length > 0 && !activeChatBuddyId) {
          setActiveChatBuddyId(list[0].id);
          setActiveChatBuddyName(list[0].name);
        }
      } catch (error) {
        console.error('Failed to load friends list', error);
      } finally {
        setLoadingBuddies(false);
      }
    };
    loadChatBuddies();
  }, [activeView]);

  // Fetch & Poll messages for the active Chat Buddy
  useEffect(() => {
    if (activeView !== 'direct_sync' || !activeChatBuddyId) return;

    const fetchMessages = async () => {
      try {
        const res = await apiFetch(`/chat/${activeChatBuddyId}`);
        if (res.success && res.data) {
          setBuddyMessagesList(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch message history', error);
      }
    };

    fetchMessages(); // initial load
    
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [activeView, activeChatBuddyId]);

  // Graph Explorer Node Selector States
  const [selectedGraphNode, setSelectedGraphNode] = useState<any>(null);
  const [hoveredGraphNode, setHoveredGraphNode] = useState<string | null>(null);

  // Fetch initial profile stats
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const profileRes = await apiFetch(`/users/${userId}`);
        setProfile(profileRes.data?.user || null);
        setConnectionStatus(profileRes.data?.connectionStatus || 'none');
        
        const projectsRes = await apiFetch(`/projects/user/${userId}`);
        setProjects(projectsRes.data || []);
        
        const postsRes = await apiFetch(`/posts/user/${userId}`);
        setPosts(postsRes.data || []);

        try {
          const certRes = await apiFetch(`/academy/my-credentials?userId=${userId}`);
          setEarnedCertificates(certRes.data || []);
        } catch (e) {
          console.error('Failed to load certificates', e);
        }
      } catch (error) {
        console.error('Failed to load profile data', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  // Graph nodes computation
  const graphData = useMemo(() => {
    if (!profile) return { nodes: [], links: [] };
    
    const centerNode = {
      id: 'center',
      label: profile.name || 'Student',
      type: 'user',
      color: 'bg-logo-gradient text-white shadow-lg',
      x: 300,
      y: 200,
      radius: 42
    };

    const nodes = [
      centerNode,
      { id: 'fasilkom', label: profile.fakultas || 'Fasilkom', type: 'faculty', color: 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold', x: 180, y: 100, radius: 34 },
      { id: 'jurusan', label: profile.jurusan || 'Informatika', type: 'major', color: 'bg-blue-50 border border-blue-200 text-blue-700 font-semibold', x: 420, y: 100, radius: 34 },
      { id: 'sbd', label: 'SBD Database', type: 'interest', color: 'bg-violet-50 border border-violet-200 text-violet-700 font-semibold', x: 140, y: 260, radius: 32 },
      { id: 'web', label: 'Web Stack', type: 'interest', color: 'bg-teal-50 border border-teal-200 text-teal-700 font-semibold', x: 460, y: 260, radius: 32 },
      { id: 'sarah', label: 'Sarah Amanda', type: 'friend', color: 'bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium', x: 230, y: 320, radius: 30 },
      { id: 'rian', label: 'Rian Kurnia', type: 'friend', color: 'bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium', x: 370, y: 320, radius: 30 }
    ];

    const links = [
      { source: 'center', target: 'fasilkom' },
      { source: 'center', target: 'jurusan' },
      { source: 'center', target: 'sbd' },
      { source: 'center', target: 'web' },
      { source: 'center', target: 'sarah' },
      { source: 'center', target: 'rian' },
      { source: 'sarah', target: 'sbd' },
      { source: 'rian', target: 'web' }
    ];

    return { nodes, links };
  }, [profile]);

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      await apiFetch('/friends/add', {
        method: 'POST',
        body: JSON.stringify({ targetId: userId })
      });
      setConnectionStatus('pending_sent');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await apiFetch('/friends/accept', {
        method: 'POST',
        body: JSON.stringify({ targetId: userId })
      });
      setConnectionStatus('friends');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await apiFetch('/friends/reject', {
        method: 'POST',
        body: JSON.stringify({ targetId: userId })
      });
      setConnectionStatus('none');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Post handler
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    setPostSubmitting(true);
    try {
      const res = await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({ content: postContent, imageUrl: postImage })
      });
      
      // Add immediately to feed
      const newPostEntry = {
        post: res.data || { id: `p_${Date.now()}`, content: postContent, imageUrl: postImage, createdAt: new Date() },
        author: {
          id: currentUser?.id,
          name: currentUser?.name || 'Me',
          profilePicture: currentUser?.profilePicture || '',
          jurusan: currentUser?.jurusan || 'Student'
        }
      };
      
      setPosts(prev => [newPostEntry, ...prev]);
      setPostContent('');
      setPostImage('');
      setActiveTab('posts');
      alert('Post published successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to publish post');
    } finally {
      setPostSubmitting(false);
    }
  };

  // Submit Project handler
  const handlePublishProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim() || !projDesc.trim()) return;
    setProjSubmitting(true);
    try {
      const res = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: projTitle,
          description: projDesc,
          imageUrl: projImage,
          demoUrl: projDemo,
          skills: projSkills
        })
      });

      const newProjEntry = res.data || {
        id: `proj_${Date.now()}`,
        title: projTitle,
        description: projDesc,
        imageUrl: projImage,
        demoUrl: projDemo,
        skills: projSkills.split(',').map(s => s.trim()).filter(Boolean),
        createdAt: new Date(),
        collaborators: []
      };

      setProjects(prev => [newProjEntry, ...prev]);
      setProjTitle('');
      setProjDesc('');
      setProjImage('');
      setProjDemo('');
      setProjSkills('');
      setActiveTab('projects');
      alert('Project created successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to create project');
    } finally {
      setProjSubmitting(false);
    }
  };

  // Submit Collaboration Request
  const handleSubmitCollabRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabMessage.trim()) return;
    setCollabSubmitting(true);
    
    // Simulate request submit
    setTimeout(() => {
      alert(`Collaboration request submitted successfully for project: "${selectedCollabProject?.title}"!`);
      setShowCollabModal(false);
      setCollabMessage('');
      setCollabSubmitting(false);
    }, 800);
  };

  // Accept incoming request handler
  const handleApproveCollab = (requestId: string, projectTitle: string, requesterName: string) => {
    alert(`Approved collaboration request from ${requesterName} to join your project: "${projectTitle}"!`);
    
    // Remove request from list
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));

    // Simulate adding collaborator name on target project card
    setProjects(prev => prev.map(p => {
      if (p.title === projectTitle) {
        return {
          ...p,
          collaborators: [...(p.collaborators || []), requesterName]
        };
      }
      return p;
    }));
  };

  const handleDeclineCollab = (requestId: string) => {
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  // Direct DM message send handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputs.trim() || !activeChatBuddyId) return;

    const content = chatInputs.trim();
    setChatInputs('');

    // Pre-insert local message for ultra-snappy instant feedback!
    const localMsg = {
      id: `local_${Date.now()}`,
      senderId: currentUser?.id,
      receiverId: activeChatBuddyId,
      content,
      createdAt: new Date().toISOString()
    };
    setBuddyMessagesList(prev => [...prev, localMsg]);

    try {
      await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: activeChatBuddyId,
          content
        })
      });
    } catch (err) {
      console.error(err);
      alert('Failed to deliver message');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-32 text-center text-zinc-500 font-medium">
        <svg className="animate-spin h-8 w-8 text-[#0071E3] mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading your profile environment...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">User Profile Not Found</h2>
        <Button onClick={() => router.push('/')}>Go to Home</Button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: Mockup Vertical Sidebar Navigation */}
        {/* ========================================== */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] rounded-3xl p-5 flex flex-col gap-6">
            
            {/* MAIN MODULES */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3.5 px-3">Main Modules</p>
              <div className="flex flex-col gap-1">
                <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#5C6E80] hover:text-[#1D1D1F] hover:bg-zinc-50/50 transition">
                  <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                  </svg>
                  <span>Pulse Dashboard</span>
                </Link>

                <Link href="/network" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#5C6E80] hover:text-[#1D1D1F] hover:bg-zinc-50/50 transition">
                  <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.018 12.018 0 0 1 12 20.25a12.018 12.018 0 0 1-3-.109v-.109m0-1.002A9.235 9.235 0 0 0 6 18.75m0-18.75a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM6 18.75A4.125 4.125 0 0 0 2.25 22.5h7.5A4.125 4.125 0 0 0 6 18.75Zm9.75-9.75a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
                  </svg>
                  <span>My Network</span>
                </Link>

                <button 
                  onClick={() => { router.push('/'); }} 
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-[#5C6E80] hover:text-[#1D1D1F] hover:bg-zinc-50/50 transition text-left"
                >
                  <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <span>Partner Discovery</span>
                </button>

                <button 
                  onClick={() => { setActiveView('graph_explorer'); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${activeView === 'graph_explorer' ? 'bg-[#0071E3]/5 text-[#0071E3] border border-[#0071E3]/10' : 'text-[#5C6E80] hover:text-[#1D1D1F] hover:bg-zinc-50/50'}`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                  </svg>
                  <span>Graph Explorer</span>
                </button>
              </div>
            </div>

            {/* GROWTH */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3.5 px-3">Growth</p>
              <div className="flex flex-col gap-1.5">
                <button 
                  onClick={() => { 
                    setActiveView('profile'); 
                    setActiveTab('projects'); 
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-[#5C6E80] hover:text-[#1D1D1F] hover:bg-zinc-50/50 transition text-left"
                >
                  <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .966-.784 1.75-1.75 1.75H5.5a1.75 1.75 0 0 1-1.75-1.75V14.15m16.5 0a1.75 1.75 0 0 0-1.75-1.75H5.5a1.75 1.75 0 0 0-1.75 1.75m16.5 0V7.65c0-.966-.784-1.75-1.75-1.75H5.5a1.75 1.75 0 0 0-1.75 1.75v6.5m14 0c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5 1.5-.672 1.5-1.5Zm-11 0c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5 1.5-.672 1.5-1.5ZM12 3v3m0 0v3m0-3h3m-3 0H9" />
                  </svg>
                  <span>Projects & Ops</span>
                </button>

                {/* Notifications green pill widget, matching mockup */}
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-[#54B589] hover:bg-[#48A37A] text-white rounded-2xl font-extrabold text-xs shadow-md transition-all border border-[#48A37A] hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                    <span>Notifications</span>
                  </div>
                  <span className="bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full border border-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                </button>

                <button 
                  onClick={() => { setActiveView('direct_sync'); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${activeView === 'direct_sync' ? 'bg-[#0071E3]/5 text-[#0071E3] border border-[#0071E3]/10' : 'text-[#5C6E80] hover:text-[#1D1D1F] hover:bg-zinc-50/50'}`}
                >
                  <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379L3.5 20.5h17l-1.92-2.134c1.153-.086 2.294-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.01Z" />
                  </svg>
                  <span>Direct Sync</span>
                </button>
              </div>
            </div>

            {/* IDENTIFY */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3.5 px-3">Identify</p>
              <div className="flex flex-col gap-1">
                <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#5C6E80] hover:text-[#1D1D1F] hover:bg-zinc-50/50 transition">
                  <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751A11.956 11.956 0 0112 2.714z" />
                  </svg>
                  <span>Account Profile</span>
                </Link>
              </div>
            </div>

          </div>

          {/* Connected Peers Fastlist Widget */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-5 flex flex-col gap-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Class Proximity</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700">Sarah Amanda</span>
                <span className="text-[9px] font-extrabold bg-green-50 border border-green-200 text-green-700 px-1.5 py-0.5 rounded">Major Core</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700">Rian Kurnia</span>
                <span className="text-[9px] font-extrabold bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded">SBD Proximity</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: Tab Views & Features Manager */}
        {/* ========================================== */}
        <div className="lg:col-span-9 flex flex-col gap-6">

          {/* Notification dropdown block if toggled */}
          {showNotifications && (
            <div className="bg-white/90 backdrop-blur-xl border border-zinc-200/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-3xl p-5 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
                <h4 className="text-xs font-extrabold text-[#1D1D1F] uppercase tracking-wider">Alert Center</h4>
                <button 
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  }}
                  className="text-[10px] font-bold text-[#0071E3] hover:underline"
                >
                  Mark all as read
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded-2xl border text-xs flex justify-between items-center transition ${n.read ? 'bg-zinc-50/50 border-zinc-100 text-zinc-400' : 'bg-white border-zinc-100 text-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.01)]'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${n.read ? 'bg-transparent' : 'bg-[#54B589]'}`} />
                      <span className="font-semibold">{n.text}</span>
                    </div>
                    <span className="text-[9px] text-zinc-400">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 1: Classic Profile Viewer & Feed Composer */}
          {/* ========================================== */}
          {activeView === 'profile' && (
            <>
              {/* Header profile details card */}
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] rounded-3xl p-8 relative">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                  {profile.profilePicture ? (
                    <img src={profile.profilePicture} alt={profile.name} className="w-24 h-24 rounded-full object-cover border border-black/10 shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-zinc-200 border border-black/10 flex items-center justify-center text-4xl font-semibold text-zinc-500">
                      {profile.name?.charAt(0) || '?'}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">{profile.name}</h1>
                        <p className="text-sm font-semibold text-[#0071E3] mt-1">
                          {profile.jurusan ? `${profile.jurusan} (${unwrapNeo4jInt(profile.angkatan) || 'N/A'})` : 'Student'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {profile.fakultas || 'No Faculty info'}
                        </p>
                      </div>

                      <div className="flex gap-2 justify-center">
                        {connectionStatus === 'self' && (
                          <Button variant="secondary" onClick={() => router.push('/profile')}>Edit My Profile</Button>
                        )}
                        {connectionStatus === 'none' && (
                          <Button variant="primary" onClick={handleConnect} disabled={actionLoading}>Connect</Button>
                        )}
                        {connectionStatus === 'pending_sent' && (
                          <Button variant="secondary" disabled>Requested</Button>
                        )}
                        {connectionStatus === 'pending_received' && (
                          <div className="flex gap-2">
                            <Button variant="primary" onClick={handleAccept} disabled={actionLoading}>Accept</Button>
                            <Button variant="secondary" onClick={handleReject} disabled={actionLoading}>Decline</Button>
                          </div>
                        )}
                        {connectionStatus === 'friends' && (
                          <Button variant="secondary" className="border-green-300 text-green-600 bg-green-50/50 hover:bg-green-50" disabled>Connected</Button>
                        )}
                      </div>
                    </div>

                    {profile.bio && (
                      <p className="text-zinc-600 mt-6 text-sm leading-relaxed max-w-2xl italic">"{profile.bio}"</p>
                    )}

                    {earnedCertificates && earnedCertificates.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {earnedCertificates.map(cert => (
                          <span 
                            key={cert.id} 
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm border border-yellow-400 hover:scale-105 transition-transform cursor-help"
                            title={`Sertifikat ID: ${cert.certificateId}\nLulus pada: ${new Date(cert.earnedAt).toLocaleDateString()}`}
                          >
                            🎖️ {cert.titleAwarded}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-black/5">
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="text-xs font-extrabold text-[#1D1D1F] uppercase tracking-wider mb-2">Skills</h3>
                        {profile.skills && profile.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.skills.map((skill: string) => (
                              <span key={skill} className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 text-zinc-600 rounded-lg border border-black/5">
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400">No skills added yet.</p>
                        )}
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <h3 className="text-xs font-extrabold text-[#1D1D1F] uppercase tracking-wider mb-2">Interests</h3>
                        {profile.interests && profile.interests.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.interests.map((interest: string) => (
                              <span key={interest} className="px-2.5 py-1 text-xs font-semibold bg-[#0071E3]/10 text-[#0071E3] rounded-lg border border-[#0071E3]/20">
                                {interest}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400">No interests added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Own-Profile Live Composer block */}
              {connectionStatus === 'self' && (
                <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-6">
                  <div className="flex border-b border-zinc-100 pb-3 mb-4 gap-4">
                    <button 
                      onClick={() => setComposerTab('post')}
                      className={`text-xs font-bold pb-2 border-b-2 transition-all ${composerTab === 'post' ? 'border-[#0071E3] text-[#0071E3]' : 'border-transparent text-zinc-400 hover:text-zinc-700'}`}
                    >
                      Share a Post
                    </button>
                    <button 
                      onClick={() => setComposerTab('project')}
                      className={`text-xs font-bold pb-2 border-b-2 transition-all ${composerTab === 'project' ? 'border-[#0071E3] text-[#0071E3]' : 'border-transparent text-zinc-400 hover:text-zinc-700'}`}
                    >
                      Create academic Project
                    </button>
                  </div>

                  {composerTab === 'post' ? (
                    <form onSubmit={handlePublishPost} className="flex flex-col gap-3">
                      <textarea
                        value={postContent}
                        onChange={e => setPostContent(e.target.value)}
                        placeholder="What academic topic are you researching today?"
                        rows={3}
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-300 transition-all text-zinc-800 placeholder-zinc-400 font-semibold"
                      />
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <input
                          type="text"
                          value={postImage}
                          onChange={e => setPostImage(e.target.value)}
                          placeholder="Optional illustration image URL..."
                          className="w-full sm:w-auto flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder-zinc-400 text-zinc-700 font-medium"
                        />
                        <Button type="submit" disabled={postSubmitting || !postContent.trim()} className="px-6 py-2 text-xs bg-logo-gradient text-white font-bold rounded-xl shrink-0">
                          {postSubmitting ? 'Publishing...' : 'Share to Feed'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handlePublishProject} className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Project Title</label>
                          <input
                            type="text"
                            value={projTitle}
                            onChange={e => setProjTitle(e.target.value)}
                            placeholder="e.g. Neo4j Cypher Visualizer"
                            className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white font-semibold text-zinc-800"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Target Skills</label>
                          <input
                            type="text"
                            value={projSkills}
                            onChange={e => setProjSkills(e.target.value)}
                            placeholder="React, Graph DB, SQL"
                            className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white font-semibold text-zinc-800"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase text-zinc-400">Project Description</label>
                        <textarea
                          value={projDesc}
                          onChange={e => setProjDesc(e.target.value)}
                          placeholder="Outline the goals, database systems, and technologies utilized in this study buddy collaboration project..."
                          rows={3}
                          className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs focus:outline-none focus:bg-white font-semibold text-zinc-800"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Cover Illustration URL</label>
                          <input
                            type="text"
                            value={projImage}
                            onChange={e => setProjImage(e.target.value)}
                            placeholder="Image URL..."
                            className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white text-zinc-700"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-zinc-400">Demo / Repository Link</label>
                          <input
                            type="text"
                            value={projDemo}
                            onChange={e => setProjDemo(e.target.value)}
                            placeholder="https://github.com/..."
                            className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white text-zinc-700"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-2">
                        <Button type="submit" disabled={projSubmitting || !projTitle.trim() || !projDesc.trim()} className="px-8 py-2.5 bg-logo-gradient text-white font-bold rounded-xl shadow-sm">
                          {projSubmitting ? 'Creating Project...' : 'Publish Project'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Feed Tabs navigation */}
              <div className="flex border-b border-black/5 mb-4">
                <button 
                  onClick={() => setActiveTab('posts')}
                  className={`pb-4 px-6 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'posts' ? 'border-[#0071E3] text-[#0071E3]' : 'border-transparent text-zinc-400 hover:text-[#1D1D1F]'}`}
                >
                  Published Feed ({posts.length})
                </button>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className={`pb-4 px-6 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'projects' ? 'border-[#0071E3] text-[#0071E3]' : 'border-transparent text-zinc-400 hover:text-[#1D1D1F]'}`}
                >
                  Academic Projects ({projects.length})
                </button>
              </div>

              {activeTab === 'posts' && (
                <div className="flex flex-col gap-6">
                  {posts.length === 0 ? (
                    <div className="text-center py-16 text-zinc-400 bg-white/40 border border-white/40 rounded-3xl italic">
                      No posts published yet.
                    </div>
                  ) : (
                    posts.map((item, idx) => (
                      <div key={item.post?.id || idx} className="p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl transition hover:bg-white/80">
                        <div className="flex items-center gap-3 mb-4">
                          {profile.profilePicture ? (
                            <img src={profile.profilePicture} alt={profile.name} className="w-10 h-10 rounded-full object-cover border border-black/10" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-200 border border-black/10 flex items-center justify-center font-bold text-zinc-500">
                              {profile.name?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h3 className="font-extrabold text-sm text-[#1D1D1F]">{profile.name}</h3>
                            <p className="text-[9px] font-semibold text-zinc-400">{new Date(unwrapNeo4jInt(item.post?.createdAt) || Date.now()).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-700 leading-relaxed font-semibold mb-4 whitespace-pre-wrap">{item.post?.content}</p>
                        {item.post?.imageUrl && (
                          <img src={item.post.imageUrl} alt="Post image" className="w-full max-h-[350px] object-cover rounded-2xl border border-black/5" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'projects' && (
                <div>
                  {projects.length === 0 ? (
                    <div className="text-center py-16 text-zinc-400 bg-white/40 border border-white/40 rounded-3xl italic">
                      No projects created yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {projects.map((project, idx) => (
                        <div key={project.id || idx} className="p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200">
                          <div>
                            {project.imageUrl && (
                              <img src={project.imageUrl} alt={project.title} className="w-full h-40 object-cover rounded-2xl border border-black/5 mb-4 shadow-sm" />
                            )}
                            <h3 className="font-extrabold text-base text-[#1D1D1F] tracking-tight">{project.title}</h3>
                            
                            <p className="text-zinc-600 text-xs font-semibold leading-relaxed mt-2 line-clamp-3 mb-4">{project.description}</p>
                            
                            {project.skills && project.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {project.skills.map((skill: string) => (
                                  <span key={skill} className="px-2 py-0.5 text-[9px] font-bold bg-zinc-100 text-zinc-500 rounded border border-black/5">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Collaborator Badge List (if any approved) */}
                            {project.collaborators && project.collaborators.length > 0 && (
                              <div className="mb-4 pt-2.5 border-t border-zinc-100">
                                <span className="text-[9px] font-extrabold uppercase text-indigo-500 block mb-1">Active Collaborators</span>
                                <div className="flex flex-wrap gap-1">
                                  {project.collaborators.map((name: string) => (
                                    <span key={name} className="px-2 py-0.5 text-[8px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-600 rounded">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-auto flex justify-between items-center pt-4 border-t border-black/5">
                            <span className="text-[9px] font-semibold text-zinc-400">{new Date(project.createdAt).toLocaleDateString()}</span>
                            
                            <div className="flex gap-2">
                              {project.demoUrl && (
                                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 text-[10px] font-bold text-[#0071E3] hover:underline bg-[#0071E3]/5 rounded">
                                  Demo Link
                                </a>
                              )}
                              {/* Request collaboration trigger for external users */}
                              {connectionStatus !== 'self' && (
                                <button 
                                  onClick={() => {
                                    setSelectedCollabProject(project);
                                    setShowCollabModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-logo-gradient text-white font-extrabold text-[9px] rounded shadow-sm hover:opacity-90 transition"
                                >
                                  Join Team
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Incoming requests segment visible ONLY to profile owner */}
                  {connectionStatus === 'self' && incomingRequests.length > 0 && (
                    <div className="mt-12 bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-6">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                        <h4 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                          </svg>
                          <span>Classmate Collaboration Requests</span>
                        </h4>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">{incomingRequests.length} pending</span>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        {incomingRequests.map(req => (
                          <div key={req.id} className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.01)] flex flex-col gap-3">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h5 className="text-xs font-extrabold text-zinc-800">{req.requester.name}</h5>
                                <p className="text-[10px] font-bold text-zinc-400">{req.requester.jurusan} ({unwrapNeo4jInt(req.requester.angkatan)})</p>
                              </div>
                              <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5 uppercase">
                                Role: {req.role}
                              </span>
                            </div>
                            
                            <p className="text-xs text-zinc-600 font-medium leading-relaxed bg-zinc-50 border border-zinc-100/50 rounded-xl p-3">
                              "{req.message}"
                            </p>

                            <div className="flex justify-between items-center border-t border-zinc-50 pt-2.5 mt-1">
                              <span className="text-[9px] font-semibold text-zinc-400">Target Project: <span className="font-bold text-zinc-600">{req.projectTitle}</span></span>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleApproveCollab(req.id, req.projectTitle, req.requester.name)}
                                  className="px-3 py-1 bg-green-500 text-white font-extrabold text-[9px] rounded-lg shadow-sm hover:bg-green-600 transition"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleDeclineCollab(req.id)}
                                  className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-extrabold text-[9px] rounded-lg transition"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </>
          )}

          {/* ========================================== */}
          {/* TAB 2: Interactive SVG relationship Graph Explorer */}
          {/* ========================================== */}
          {activeView === 'graph_explorer' && (
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-6 flex flex-col gap-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight">Proximity Connection Graph</h2>
                  <p className="text-xs text-zinc-400 font-semibold mt-0.5">Neo4j Database interactive graph simulation. Hover connections, select nodes to explore proximity.</p>
                </div>
                <button 
                  onClick={() => { setActiveView('profile'); }}
                  className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-bold text-xs rounded-xl self-start md:self-auto"
                >
                  Back to Profile
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* SVG Visualizer Canvas */}
                <div className="lg:col-span-8 bg-zinc-950 border border-zinc-900 rounded-2xl relative overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute top-3 left-3 text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>Active Relationship Canvas</span>
                  </div>
                  
                  <svg className="w-full aspect-[4/3] max-w-full" viewBox="0 0 600 400">
                    <defs>
                      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>

                    {/* Connection Lines */}
                    {graphData.links.map((link, idx) => {
                      const sourceNode = graphData.nodes.find(n => n.id === link.source);
                      const targetNode = graphData.nodes.find(n => n.id === link.target);
                      if (!sourceNode || !targetNode) return null;
                      
                      const isHovered = hoveredGraphNode === link.source || hoveredGraphNode === link.target;
                      
                      return (
                        <line
                          key={idx}
                          x1={sourceNode.x}
                          y1={sourceNode.y}
                          x2={targetNode.x}
                          y2={targetNode.y}
                          stroke={isHovered ? 'url(#logoGrad)' : '#334155'}
                          strokeWidth={isHovered ? 2.5 : 1}
                          className="transition-all duration-300"
                        />
                      );
                    })}

                    {/* Nodes Circle */}
                    {graphData.nodes.map(node => (
                      <g 
                        key={node.id} 
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => setSelectedGraphNode(node)}
                        onMouseEnter={() => setHoveredGraphNode(node.id)}
                        onMouseLeave={() => setHoveredGraphNode(null)}
                        className="cursor-pointer group"
                      >
                        <circle
                          r={node.radius}
                          fill={node.id === 'center' ? 'url(#logoGrad)' : '#1E293B'}
                          stroke={selectedGraphNode?.id === node.id ? '#3B82F6' : hoveredGraphNode === node.id ? '#7C3AED' : '#475569'}
                          strokeWidth={selectedGraphNode?.id === node.id ? 2.5 : hoveredGraphNode === node.id ? 2 : 1}
                          className="transition-all duration-300"
                        />
                        <text
                          textAnchor="middle"
                          dy=".3em"
                          fill={node.id === 'center' ? '#FFFFFF' : '#E2E8F0'}
                          fontSize={node.radius > 32 ? '10px' : '9px'}
                          fontWeight="bold"
                          className="select-none pointer-events-none transition group-hover:fill-white"
                        >
                          {node.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>

                {/* Node details analytics panel */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 flex flex-col gap-4">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Node Proximity Analyzer</h3>
                    
                    {selectedGraphNode ? (
                      <div className="flex flex-col gap-3.5 animate-in fade-in duration-200">
                        <div>
                          <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 inline-block">
                            {selectedGraphNode.type} Node
                          </span>
                          <h4 className="text-sm font-extrabold text-zinc-800 mt-2">{selectedGraphNode.label}</h4>
                        </div>
                        
                        <div className="text-[11px] font-medium text-zinc-500 leading-relaxed flex flex-col gap-2">
                          <p>🎯 Connection Tier: <span className="font-extrabold text-zinc-700">{selectedGraphNode.id === 'center' ? 'Direct Self' : selectedGraphNode.type === 'friend' ? '1st Degree Peer' : 'Shared Hub'}</span></p>
                          <p>💡 Mutually Linked: <span className="font-extrabold text-zinc-700">{selectedGraphNode.type === 'friend' ? '2 Shared Projects' : '17 Faculty Alumni'}</span></p>
                        </div>
                        
                        {selectedGraphNode.type === 'friend' && (
                          <div className="pt-3 border-t border-zinc-100/80 flex flex-col gap-2">
                            <button 
                              onClick={() => {
                                setActiveChatBuddyId(selectedGraphNode.id);
                                setActiveChatBuddyName(selectedGraphNode.label);
                                setActiveView('direct_sync');
                              }}
                              className="w-full py-2 bg-logo-gradient text-white font-bold text-[10px] rounded-xl hover:opacity-90 shadow-sm transition"
                            >
                              Sync DM Messenger
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic text-center py-10">Click any graph circle node in the relationship canvas to compute study buddy metrics.</p>
                    )}
                  </div>

                  <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex flex-col gap-2">
                    <h5 className="text-[10px] font-black uppercase text-indigo-600">Database Context</h5>
                    <p className="text-[10px] font-semibold text-indigo-500 leading-relaxed">
                      {"Neo4j graph representation maps MATCH (u)-[:STUDIES_IN]->(j) relationships dynamically to reveal proximate study partners sharing majors and databases focus."}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: Direct Sync Live Chat Simulator */}
          {/* ========================================== */}
          {activeView === 'direct_sync' && (
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-6 flex flex-col gap-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight">Direct Sync Chat</h2>
                  <p className="text-xs text-zinc-400 font-semibold mt-0.5">Collaborative messaging center. Coordinate tasks, share resources, review pipelines in real-time.</p>
                </div>
                <button 
                  onClick={() => { setActiveView('profile'); }}
                  className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-bold text-xs rounded-xl"
                >
                  Back to Profile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[450px]">
                
                {/* Buddy list */}
                <div className="md:col-span-4 bg-zinc-50 border border-zinc-100/80 rounded-2xl p-4 flex flex-col gap-2.5">
                  <span className="text-[10px] font-extrabold uppercase text-zinc-400 px-1 mb-1">Active Peers</span>
                  
                  {loadingBuddies ? (
                    <div className="text-xs text-zinc-400 py-4 text-center font-medium">Loading buddies...</div>
                  ) : buddies.length === 0 ? (
                    <div className="text-xs text-zinc-400 py-6 text-center italic font-semibold leading-relaxed">
                      Belum ada peer koneksi. Temukan teman belajar Anda di Beranda!
                    </div>
                  ) : (
                    buddies.map(buddy => (
                      <button 
                        key={buddy.id}
                        onClick={() => {
                          setActiveChatBuddyId(buddy.id);
                          setActiveChatBuddyName(buddy.name);
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${activeChatBuddyId === buddy.id ? 'bg-white border-zinc-200 shadow-sm font-black' : 'border-transparent hover:bg-zinc-100/50 font-medium'}`}
                      >
                        <span className="text-xs font-extrabold text-zinc-800">{buddy.name}</span>
                        <span className="text-[9px] font-semibold text-zinc-400">{buddy.jurusan || 'Student'} • {unwrapNeo4jInt(buddy.angkatan) || '2024'}</span>
                      </button>
                    ))
                  )}
                </div>

                {/* Main Chat space */}
                <div className="md:col-span-8 border border-zinc-200 rounded-2xl flex flex-col justify-between bg-[#EFEAE2] overflow-hidden relative shadow-inner">
                  {/* WhatsApp-style doodle background overlay */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

                  {/* Chat Header */}
                  <div className="bg-white px-5 py-3 border-b border-zinc-200 flex items-center gap-3 z-10 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-lg">
                      {activeChatBuddyName ? activeChatBuddyName.charAt(0) : '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-800 text-sm">{activeChatBuddyName || 'Select a Buddy'}</h4>
                      <p className="text-[10px] font-semibold text-emerald-500">Online</p>
                    </div>
                  </div>
                  
                  {/* Messages Feed */}
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] p-4 flex-1 z-10">
                    {!activeChatBuddyId ? (
                      <div className="text-center py-20 text-zinc-500/80 italic text-xs font-semibold bg-white/50 backdrop-blur-sm rounded-2xl w-fit mx-auto px-6 border border-zinc-200/50">
                        Pilih teman belajar untuk memulai obrolan real-time.
                      </div>
                    ) : buddyMessagesList.length === 0 ? (
                      <div className="text-center py-20 text-zinc-500/80 italic text-xs font-semibold bg-white/50 backdrop-blur-sm rounded-2xl w-fit mx-auto px-6 border border-zinc-200/50">
                        Kirim pesan pertama Anda untuk memulai koordinasi tugas!
                      </div>
                    ) : (
                      buddyMessagesList.map((msg, idx) => {
                        const isMe = msg.senderId === currentUser?.id;
                        return (
                          <div key={msg.id || idx} className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                            <div 
                              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm relative ${isMe ? 'bg-[#D9FDD3] text-zinc-800 rounded-tr-sm' : 'bg-white text-zinc-800 rounded-tl-sm'}`}
                            >
                              {msg.content}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[9px] text-zinc-500 font-medium">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && <span className="text-[10px] text-blue-500">✓✓</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message Input Form */}
                  <form onSubmit={handleSendMessage} className="flex gap-3 p-3 bg-[#F0F2F5] border-t border-zinc-200 z-10 items-center">
                    <button type="button" className="p-2 text-zinc-500 hover:text-zinc-700 transition">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    <button type="button" className="p-2 text-zinc-500 hover:text-zinc-700 transition">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <input 
                      type="text" 
                      value={chatInputs}
                      onChange={e => setChatInputs(e.target.value)}
                      placeholder="Ketik pesan..."
                      disabled={!activeChatBuddyId}
                      className="flex-1 bg-white border border-transparent rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-300 transition-all font-semibold text-zinc-800 placeholder-zinc-400 shadow-sm"
                    />
                    <button 
                      type="submit" 
                      disabled={!activeChatBuddyId || !chatInputs.trim()}
                      className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-sm hover:bg-emerald-600 transition disabled:opacity-50 disabled:hover:bg-emerald-500"
                    >
                      <svg className="w-4 h-4 translate-x-0.5 -translate-y-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                  </form>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* ========================================== */}
      {/* PEER COLLABORATION REQUESTS OVERLAY MODAL  */}
      {/* ========================================== */}
      {showCollabModal && selectedCollabProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <form 
            onSubmit={handleSubmitCollabRequest}
            className="bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-w-md w-full mx-4 rounded-3xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left"
          >
            <div>
              <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 inline-block">
                Academic Operations
              </span>
              <h3 className="text-base font-extrabold text-zinc-800 mt-2">Request to Collaborate</h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Project Target: <span className="text-zinc-600">{selectedCollabProject.title}</span></p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase text-zinc-400">Your Intended Contribution Role</label>
              <select 
                value={collabRole}
                onChange={e => setCollabRole(e.target.value)}
                className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs focus:outline-none text-zinc-800 font-semibold cursor-pointer"
              >
                <option value="Frontend Developer">Frontend Designer</option>
                <option value="Backend Architect">Backend Architect</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Database Evaluator">Database Cypher Evaluator</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase text-zinc-400">Your Message Proposal</label>
              <textarea 
                value={collabMessage}
                onChange={e => setCollabMessage(e.target.value)}
                placeholder="Detail why you want to connect to this project, your related skills, and how you can collaborate successfully..." 
                rows={4}
                className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs focus:outline-none focus:bg-white text-zinc-800 placeholder-zinc-400 font-semibold"
                required
              />
            </div>

            <div className="flex gap-2.5 mt-3 pt-3 border-t border-zinc-100/60 justify-end">
              <button 
                type="button" 
                onClick={() => {
                  setShowCollabModal(false);
                  setCollabMessage('');
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={collabSubmitting || !collabMessage.trim()}
                className="px-6 py-2 bg-logo-gradient text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 transition"
              >
                {collabSubmitting ? 'Submitting...' : 'Send Proposal'}
              </button>
            </div>
          </form>
        </div>
      )}

    </main>
  );
}
