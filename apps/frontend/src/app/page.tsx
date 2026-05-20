"use client";

import React, { useState, useEffect, Suspense } from "react";
import UserCard from "@/components/UserCard";
import FilterSidebar from "@/components/FilterSidebar";
import { apiFetch } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSearchParams } from "next/navigation";

const unwrapNeo4jInt = (val: any): any => {
  if (val === null || val === undefined) return "";
  if (typeof val === "object" && val !== null) {
    if ("low" in val && typeof val.low === "number") {
      return val.low;
    }
  }
  return val;
};

function DashboardContent() {
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Tab configurations
  const [activeCenterTab, setActiveCenterTab] = useState<"feed" | "discover" | "projects" | "opportunities">("feed");
  const searchParams = useSearchParams();
  const [activeDiscoverTab, setActiveDiscoverTab] = useState<"filters" | "interests" | "skills">("filters");

  // Community data states
  const [posts, setPosts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [recommendedBuddies, setRecommendedBuddies] = useState<any[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);

  // Dynamic opportunities state
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState({
    company: "",
    role: "",
    info: "",
    link: "",
    logoBg: "bg-[#0071E3]",
  });
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [appliedRole, setAppliedRole] = useState("");

  // Interactive comments state
  const [expandedPostComments, setExpandedPostComments] = useState<{ [postId: string]: boolean }>({});
  const [postCommentsList, setPostCommentsList] = useState<{ [postId: string]: any[] }>({});
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});
  const [isScholarUser, setIsScholarUser] = useState(false);

  // Composer inputs
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState("");

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    imageUrl: "",
    demoUrl: "",
    skills: "",
  });

  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [posting, setPosting] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectMatches, setProjectMatches] = useState<any[]>([]);
  const [loadingProjectMatches, setLoadingProjectMatches] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const [activeTag, setActiveTag] = useState("#Semua");
  const feedTags = ["#Semua", "#StudyGroup", "#SharingMateri", "#JalanJalan", "#CariPartner"];

  // Hook to check for Scholar verification
  useEffect(() => {
    const isScholar = localStorage.getItem("is_study_buddy_scholar") === "true";
    setIsScholarUser(isScholar);
  }, []);

  const handleToggleComments = async (postId: string) => {
    const isNowExpanded = !expandedPostComments[postId];
    setExpandedPostComments((prev) => ({ ...prev, [postId]: isNowExpanded }));

    // ambil komentar riil dari backend jika diekspansi
    if (isNowExpanded) {
      try {
        const response = await apiFetch(`/posts/${postId}/comments`);
        setPostCommentsList((prev) => ({
          ...prev,
          [postId]: response.data || [],
        }));
      } catch (err) {
        console.error("Gagal memuat komentar:", err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = newCommentText[postId] || "";
    if (!text.trim()) return;

    try {
      const response = await apiFetch(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });

      const newComment = response.data;
      if (newComment) {
        setPostCommentsList((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment],
        }));

        // update count komentar lokal
        setPosts((prev) =>
          prev.map((item) => {
            if (item.post?.id === postId) {
              return {
                ...item,
                post: {
                  ...item.post,
                  commentsCount: (unwrapNeo4jInt(item.post.commentsCount) || 0) + 1,
                },
              };
            }
            return item;
          }),
        );

        setNewCommentText((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (err) {
      console.error("Gagal menambah komentar:", err);
      alert("Gagal mengirimkan komentar");
    }
  };

  const handleLikeComment = (postId: string, commentId: string) => {
    setPostCommentsList((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).map((c) => {
        if (c.id === commentId) {
          const liked = !c.hasLiked;
          return {
            ...c,
            hasLiked: liked,
            likes: c.likes + (liked ? 1 : -1),
          };
        }
        return c;
      }),
    }));
  };

  // Discover Filters state
  const [filters, setFilters] = useState({
    fakultas: "",
    jurusan: "",
    angkatan: "",
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch all initial dashboard data
  const fetchFeedPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await apiFetch("/posts");
      setPosts(response.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchCommunityProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await apiFetch("/projects");
      setProjects(response.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchSocialRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const response = await apiFetch("/recommend/social");
      setRecommendedBuddies(response.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecs(false);
    }
  };

  const fetchOpportunities = async () => {
    setLoadingOpportunities(true);
    try {
      const response = await apiFetch("/opportunities");
      setOpportunities(response.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOpportunities(false);
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpportunity.company.trim() || !newOpportunity.role.trim() || !newOpportunity.info.trim()) return;

    try {
      await apiFetch("/opportunities", {
        method: "POST",
        body: JSON.stringify(newOpportunity),
      });
      setNewOpportunity({
        company: "",
        role: "",
        info: "",
        link: "",
        logoBg: "bg-[#0071E3]",
      });
      setShowOpportunityModal(false);
      await fetchOpportunities();
      alert("Oportunitas baru berhasil ditambahkan!");
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan oportunitas.");
    }
  };

  const fetchProjectMatches = async () => {
    setLoadingProjectMatches(true);
    try {
      const response = await apiFetch("/recommend/projects");
      setProjectMatches(response.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjectMatches(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeedPosts();
      fetchCommunityProjects();
      fetchSocialRecommendations();
      fetchOpportunities();
      fetchProjectMatches();
      apiFetch("/friends/requests")
        .then((res) => {
          setPendingRequestsCount((res.data || []).length);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab === "discover") {
      setActiveCenterTab("discover");
    }
  }, [searchParams]);

  // Discover Tab Querying
  useEffect(() => {
    if (!isAuthenticated) return;

    const queryDiscoverUsers = async () => {
      setLoadingDiscover(true);
      try {
        let endpoint = "";
        if (activeDiscoverTab === "filters") {
          const params = new URLSearchParams();
          if (filters.fakultas) params.append("fakultas", filters.fakultas);
          if (filters.jurusan) params.append("jurusan", filters.jurusan);
          if (filters.angkatan) params.append("angkatan", filters.angkatan);
          endpoint = `/recommend/search?${params.toString()}`;
        } else if (activeDiscoverTab === "interests") {
          endpoint = "/recommend/interests";
        } else if (activeDiscoverTab === "skills") {
          endpoint = "/recommend/skills";
        }

        const response = await apiFetch(endpoint);
        console.log(response);
        setDiscoverUsers(response.data || []);
      } catch (error) {
        console.error(error);
        setDiscoverUsers([]);
      } finally {
        setLoadingDiscover(false);
      }
    };

    queryDiscoverUsers();
  }, [activeDiscoverTab, filters, isAuthenticated]);

  // Post Submission
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setPosting(true);
    try {
      await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify({
          content: newPostContent,
          imageUrl: newPostImage,
        }),
      });
      setNewPostContent("");
      setNewPostImage("");
      await fetchFeedPosts();
    } catch (err) {
      console.error(err);
      alert("Failed to publish post");
    } finally {
      setPosting(false);
    }
  };

  // Like Toggle
  const handleToggleLike = async (postId: string) => {
    try {
      const response = await apiFetch(`/posts/${postId}/like`, { method: "POST" });
      const liked = response.data?.liked;

      // Update state instantly
      setPosts((prev) =>
        prev.map((item) => {
          if (item.post?.id === postId) {
            const countDiff = liked ? 1 : -1;
            return {
              ...item,
              post: {
                ...item.post,
                hasLiked: liked,
                likesCount: Math.max(0, (item.post.likesCount || 0) + countDiff),
              },
            };
          }
          return item;
        }),
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await apiFetch(`/posts/${postId}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((item) => item.post?.id !== postId));
    } catch (e) {
      console.error(e);
    }
  };

  // Project Creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim() || !newProject.description.trim()) return;

    setCreatingProject(true);
    try {
      await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify(newProject),
      });
      setNewProject({
        title: "",
        description: "",
        imageUrl: "",
        demoUrl: "",
        skills: "",
      });
      await fetchCommunityProjects();
      await fetchProjectMatches();
      alert("Project uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to publish project");
    } finally {
      setCreatingProject(false);
    }
  };

  // Connect Quick Action
  const handleConnect = async (targetId: string) => {
    try {
      await apiFetch("/friends/add", {
        method: "POST",
        body: JSON.stringify({ targetId }),
      });
      alert("Friend request sent!");

      // Refresh list to remove the matching person or reflect pending state
      setRecommendedBuddies((prev) => prev.filter((item) => item.user?.id !== targetId));
      setDiscoverUsers((prev) =>
        prev.map((item) => {
          const u = item.user || item;
          if (u.id === targetId) {
            return { ...item, connectionStatus: "pending" };
          }
          return item;
        }),
      );
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading || !isAuthenticated) return <div className="p-20 text-center text-zinc-500">Loading your profile environment...</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {/* 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Profile summary card */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] ring-1 ring-black/5 rounded-3xl overflow-hidden flex flex-col items-center p-6 text-center">
            {/* Avatar block */}
            <Link href={`/user/${currentUser?.id}`}>{currentUser?.profilePicture ? <img src={currentUser.profilePicture} alt={currentUser.name} className="w-20 h-20 rounded-full object-cover border border-black/10 shadow-sm hover:opacity-85 transition" /> : <div className="w-20 h-20 rounded-full bg-zinc-100 border border-black/10 flex items-center justify-center text-3xl font-semibold text-zinc-500 hover:bg-zinc-200 transition">{currentUser?.name?.charAt(0) || "?"}</div>}</Link>

            <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight mt-4 hover:underline flex items-center justify-center gap-1.5 flex-wrap">
              <Link href={`/user/${currentUser?.id}`}>{currentUser?.name}</Link>
              {isScholarUser && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-logo-gradient text-white shadow-sm animate-pulse" title="Verified Study Buddy Scholar!">
                  SCHOLAR ✨
                </span>
              )}
            </h2>
            {/* button see my profile */}
            <Link href={`/user/${currentUser?.id}/`} className="mt-2 text-zinc-400 text-xs rounded-full hover:bg-[#0056b3] transition">
              See My Profile
            </Link>
            {/* <p className="text-xs text-[#0071E3] font-medium mt-1">
              {currentUser?.jurusan || ''}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {currentUser?.fakultas || ''}
            </p> */}

            {/* {currentUser?.bio && (
              <p className="text-xs text-zinc-500 mt-4 px-2 line-clamp-3 italic leading-relaxed">
                "{currentUser.bio}"
              </p>
            )} */}

            <div className="w-full border-t border-black/5 mt-6 pt-4 flex flex-col gap-2.5 text-left text-xs font-semibold text-zinc-600">
              <Link href={`/user/${currentUser?.id}/network`} className="flex justify-between items-center hover:text-[#0071E3]">
                <span className="flex items-center gap-1.5">
                  My Connection
                  {pendingRequestsCount > 0 && <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black leading-none">{pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}</span>}
                </span>
                <span className="text-[#0071E3]">Manage</span>
              </Link>
              <Link href="/profile" className="flex justify-between hover:text-[#0071E3]">
                <span>Profile Settings</span>
                <span className="text-[#0071E3]">Change</span>
              </Link>
            </div>
          </div>

          <button onClick={() => window.dispatchEvent(new Event("open-apps-drawer"))} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-95 text-white font-extrabold text-[10px] tracking-tight shadow-md hover:shadow-lg transition duration-200 text-left mt-2 group">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 animate-pulse text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="4" height="4" rx="1" />
                <rect x="10" y="3" width="4" height="4" rx="1" />
                <rect x="17" y="3" width="4" height="4" rx="1" />
                <rect x="3" y="10" width="4" height="4" rx="1" />
                <rect x="10" y="10" width="4" height="4" rx="1" />
                <rect x="17" y="10" width="4" height="4" rx="1" />
                <rect x="3" y="17" width="4" height="4" rx="1" />
                <rect x="10" y="17" width="4" height="4" rx="1" />
                <rect x="17" y="17" width="4" height="4" rx="1" />
              </svg>
              Explore Premium Tools
            </span>
            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider group-hover:translate-x-0.5 transition-transform duration-200">&rarr;</span>
          </button>
        </div>

        {/* CENTER COLUMN: Feed composer + Tabs */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Main Navigation tabs */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm p-1 rounded-2xl flex justify-around">
            <button onClick={() => setActiveCenterTab("feed")} className={`flex-1 py-2.5 text-center text-sm font-semibold rounded-xl transition ${activeCenterTab === "feed" ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[#0071E3]" : "text-zinc-500 hover:text-[#1D1D1F]"}`}>
              Feed
            </button>
            <button onClick={() => setActiveCenterTab("discover")} className={`flex-1 py-2.5 text-center text-sm font-semibold rounded-xl transition ${activeCenterTab === "discover" ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[#0071E3]" : "text-zinc-500 hover:text-[#1D1D1F]"}`}>
              Find Partners
            </button>
            <button onClick={() => setActiveCenterTab("projects")} className={`flex-1 py-2.5 text-center text-sm font-semibold rounded-xl transition ${activeCenterTab === "projects" ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[#0071E3]" : "text-zinc-500 hover:text-[#1D1D1F]"}`}>
              Projects
            </button>
            <button onClick={() => setActiveCenterTab("opportunities")} className={`flex-1 py-2.5 text-center text-sm font-semibold rounded-xl transition ${activeCenterTab === "opportunities" ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[#0071E3]" : "text-zinc-500 hover:text-[#1D1D1F]"}`}>
              Opportunities
            </button>
          </div>

          {/* TAB 1: consolidated social feed */}
          {activeCenterTab === "feed" && (
            <div className="flex flex-col gap-6">
              {/* Post Composer */}
              <form onSubmit={handleCreatePost} className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] ring-1 ring-black/5 rounded-3xl p-6">
                <div className="flex gap-3">
                  {currentUser?.profilePicture ? <img src={currentUser.profilePicture} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover border border-black/5" /> : <div className="w-10 h-10 rounded-full bg-zinc-200 border border-black/5 flex items-center justify-center font-bold text-zinc-500">{currentUser?.name?.charAt(0)}</div>}
                  <textarea placeholder="Share what you are studying or what project help you need..." value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} rows={3} className="flex-1 resize-none bg-transparent outline-none text-sm text-[#1D1D1F] placeholder-zinc-400" />
                </div>
                <div className="border-t border-black/5 mt-4 pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <input type="text" placeholder="Optional image url..." value={newPostImage} onChange={(e) => setNewPostImage(e.target.value)} className="w-full sm:w-auto flex-1 bg-zinc-50 border border-black/5 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#0071E3]/40" />
                  <Button type="submit" disabled={posting || !newPostContent.trim()} className="px-5 !py-2 text-xs self-end">
                    {posting ? "Posting..." : "Share Post"}
                  </Button>
                </div>
              </form>

              {/* Category tags selector */}
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar shrink-0">
                {feedTags.map((tag) => {
                  const isActive = activeTag === tag;
                  return (
                    <button key={tag} type="button" onClick={() => setActiveTag(tag)} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${isActive ? "bg-logo-gradient text-white shadow-sm scale-[1.02]" : "bg-white/60 hover:bg-white text-zinc-550 hover:text-zinc-800 border border-zinc-200/50 shadow-inner"}`}>
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Feed posts list */}
              {loadingPosts ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-44 rounded-3xl bg-white/40 animate-pulse border border-white/40" />
                  ))}
                </div>
              ) : posts.filter((item) => activeTag === "#Semua" || item.post?.content?.includes(activeTag)).length === 0 ? (
                <div className="text-center py-20 bg-white/40 border border-white/40 rounded-3xl text-zinc-400 text-xs font-semibold">No post written yet with {activeTag}. Be the first to share something!</div>
              ) : (
                <div className="flex flex-col gap-6">
                  {posts
                    .filter((item) => activeTag === "#Semua" || item.post?.content?.includes(activeTag))
                    .map((item, idx) => (
                      <div key={item.post?.id || idx} className="p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] ring-1 ring-black/5 rounded-3xl flex flex-col">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <Link href={`/user/${item.author?.id}`}>{item.author?.profilePicture ? <img src={item.author.profilePicture} alt={item.author.name} className="w-10 h-10 rounded-full object-cover border border-black/10 hover:opacity-90" /> : <div className="w-10 h-10 rounded-full bg-zinc-200 border border-black/10 flex items-center justify-center font-semibold text-zinc-500 hover:bg-zinc-300">{item.author?.name?.charAt(0)}</div>}</Link>
                            <div>
                              <h4 className="font-bold text-sm text-[#1D1D1F] hover:underline">
                                <Link href={`/user/${item.author?.id}`}>{item.author?.name}</Link>
                              </h4>
                              <p className="text-[10px] text-zinc-400">
                                {item.author?.jurusan || "Student"} • {new Date(unwrapNeo4jInt(item.post?.createdAt) || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {item.author?.id === currentUser?.id && (
                            <button onClick={() => handleDeletePost(item.post?.id)} className="text-zinc-300 hover:text-red-500 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-zinc-700 leading-relaxed mb-4 whitespace-pre-wrap">{item.post?.content}</p>

                        {item.post?.imageUrl && <img src={item.post.imageUrl} alt="Post image" className="w-full max-h-[350px] object-cover rounded-2xl border border-black/5 mb-4" />}

                        {/* Interaction panel */}
                        <div className="flex items-center gap-4 pt-3 border-t border-black/5 mt-auto">
                          <button onClick={() => handleToggleLike(item.post?.id)} className={`flex items-center gap-1.5 text-xs font-semibold transition ${item.post?.hasLiked ? "text-red-500" : "text-zinc-400 hover:text-zinc-600"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={item.post?.hasLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                            </svg>
                            <span>{unwrapNeo4jInt(item.post?.likesCount) || 0} Likes</span>
                          </button>

                          <button onClick={() => handleToggleComments(item.post?.id)} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-3.658A8.967 8.967 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                            </svg>
                            <span>{postCommentsList[item.post?.id]?.length ?? (unwrapNeo4jInt(item.post?.commentsCount) || 0)} Comments</span>
                          </button>
                        </div>

                        {/* Expandable Comments Drawer */}
                        {expandedPostComments[item.post?.id] && (
                          <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            {/* Add Comment Input */}
                            <div className="flex gap-2.5 items-start">
                              {currentUser?.profilePicture ? <img src={currentUser.profilePicture} alt="My avatar" className="w-8 h-8 rounded-full object-cover border border-black/5" /> : <div className="w-8 h-8 rounded-full bg-zinc-200 border border-black/5 flex items-center justify-center font-bold text-xs text-zinc-500">{currentUser?.name?.charAt(0)}</div>}
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Tambah komentar..."
                                  value={newCommentText[item.post?.id] || ""}
                                  onChange={(e) => setNewCommentText((prev) => ({ ...prev, [item.post?.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddComment(item.post?.id);
                                  }}
                                  className="flex-1 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-100 rounded-full px-4 py-2 text-xs focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 transition-all placeholder-zinc-400 text-zinc-800 font-medium"
                                />
                                <button onClick={() => handleAddComment(item.post?.id)} className="px-4 py-2 bg-logo-gradient text-white font-bold rounded-full text-[10px] hover:opacity-90 transition shadow-sm">
                                  Post
                                </button>
                              </div>
                            </div>

                            {/* Comments List */}
                            <div className="flex flex-col gap-3">
                              {(postCommentsList[item.post?.id] || []).map((comment, cIdx) => (
                                <div key={comment.id || cIdx} className="flex gap-2.5 items-start">
                                  {/* Commenter avatar */}
                                  {comment.author?.profilePicture ? <img src={comment.author.profilePicture} alt={comment.author.name} className="w-8 h-8 rounded-full object-cover border border-black/5" /> : <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-extrabold text-xs text-indigo-600">{comment.author?.name?.charAt(0)}</div>}

                                  {/* Comment balloon */}
                                  <div className="flex-1 bg-zinc-50 border border-zinc-100/50 rounded-2xl p-3 text-xs flex flex-col shadow-[0_1px_4px_rgba(0,0,0,0.01)]">
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-extrabold text-zinc-800 hover:underline cursor-pointer">{comment.author?.name}</span>
                                        <span className="text-[9px] font-semibold text-zinc-400">• {comment.author?.jurusan || "Student"}</span>
                                        {comment.author?.isScholar && <span className="px-1 rounded text-[7px] font-extrabold bg-logo-gradient text-white shadow-sm">SCHOLAR ✨</span>}
                                      </div>
                                      <span className="text-[9px] text-zinc-400">Now</span>
                                    </div>

                                    <p className="text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap">{comment.content}</p>

                                    <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-zinc-100/50">
                                      <button onClick={() => handleLikeComment(item.post?.id, comment.id)} className={`text-[10px] font-extrabold flex items-center gap-1 transition ${comment.hasLiked ? "text-red-500" : "text-zinc-400 hover:text-zinc-600"}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={comment.hasLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                        </svg>
                                        <span>{unwrapNeo4jInt(comment.likes) || 0} Suka</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: partner discovery grid */}
          {activeCenterTab === "discover" && (
            <div className="flex flex-col gap-6">
              {/* Discovery secondary navigation */}
              <div className="flex justify-start border-b border-black/5 gap-4 pb-2">
                {["filters", "interests", "skills"].map((tab) => (
                  <button key={tab} onClick={() => setActiveDiscoverTab(tab as any)} className={`pb-1.5 text-xs font-bold border-b-2 transition ${activeDiscoverTab === tab ? "border-[#0071E3] text-[#0071E3]" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search column */}
                <div className="md:col-span-1">{activeDiscoverTab === "filters" ? <FilterSidebar filters={filters} setFilters={setFilters} /> : <div className="p-5 bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl text-xs text-[#86868B] leading-relaxed">💡 These partners are scored automatically based on overlays between your functional tags (skills or interest lists) and ours.</div>}</div>

                {/* Listing column */}
                <div className="md:col-span-2">
                  {loadingDiscover ? (
                    <div className="grid grid-cols-1 gap-4 animate-pulse">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-48 bg-white/40 border border-white/40 rounded-2xl" />
                      ))}
                    </div>
                  ) : discoverUsers.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {discoverUsers.map((item, idx) => {
                        const targetUser = item.user || item;
                        return <UserCard key={targetUser.id || idx} user={targetUser} connectionStatus={item.connectionStatus} matchReason={item.matchReason || (item.mutualInterests ? `${item.mutualInterests} mutual interests` : item.mutualSkillsCount ? `${item.mutualSkillsCount} mutual skills` : undefined)} onConnect={() => handleConnect(targetUser.id)} />;
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-[#86868B] bg-white/40 rounded-2xl border border-white/40 text-xs">No matching partners found. Try expanding your filters.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Projects showcase */}
          {activeCenterTab === "projects" && (
            <div className="flex flex-col gap-3">
              {/* Add Project Bar */}
              <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] ring-1 ring-black/5 p-5 rounded-3xl">
                <div>
                  <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Project Showcase</h3>
                  <p className="text-xs text-zinc-800 mt-0.5"> Discover inspiration and connect with project creators.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowProjectModal(true)} className="w-fit text-xs font-bold text-white bg-[#0071E3] hover:opacity-90 rounded-xl py-2 px-4 transition shadow-sm">
                    + Add Project
                  </button>
                </div>
              </div>

              <button onClick={() => setShowOnlyRecommended(!showOnlyRecommended)} className={`flex items-center gap-2 p-4 rounded-xl text-xs font-bold transition-all border ${showOnlyRecommended ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm" : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}>
                <div className={`w-3 h-3 rounded-full ${showOnlyRecommended ? "bg-indigo-500 " : "bg-zinc-200"}`} />
                Show Recommended Only
              </button>

              {/* ALL PROJECTS SECTION */}
              <div className="flex flex-col gap-4 ">
                {loadingProjects ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-64 bg-white/40 animate-pulse border border-white/40 rounded-2xl" />
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-20 bg-white/45 border border-zinc-150 rounded-3xl text-zinc-400 font-bold text-xs italic">No projects created yet. Be the first to showcase your work!</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {projects
                      .filter((item) => {
                        if (!showOnlyRecommended) return true;
                        return projectMatches.some((m: any) => m.project?.id === item.project?.id);
                      })
                      .map((item, idx) => {
                        const match = projectMatches.find((m: any) => m.project?.id === item.project?.id);
                        return (
                          <div key={item.project?.id || idx} className="p-5 bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] ring-1 ring-black/5 rounded-3xl flex flex-col hover:-translate-y-0.5 transition-all">
                            {match && (
                              <div className="mb-3 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                                <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border border-indigo-100 shadow-sm flex items-center gap-1.5">
                                  <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09l2.846.813-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                                    />
                                  </svg>
                                  Recommended ({match.matchingSkills} skills matched)
                                </span>
                              </div>
                            )}
                            {item.project?.imageUrl && <img src={item.project.imageUrl} alt={item.project.imageUrl} className="w-full h-36 object-cover rounded-2xl border border-black/5 mb-4" />}

                            <h4 className="font-bold text-base text-[#1D1D1F] tracking-tight">{item.project?.title}</h4>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              by{" "}
                              <Link href={`/user/${item.author?.id}`} className="font-medium text-zinc-500 hover:underline">
                                {item.author?.name}
                              </Link>
                            </p>
                            <span className="text-xs mt-2 text-zinc-400">{new Date(unwrapNeo4jInt(item.project?.createdAt) || Date.now()).toLocaleDateString()}</span>

                            <p className="text-zinc-650 text-xs mt-2.5 leading-relaxed line-clamp-3 mb-4">{item.project?.description}</p>

                            {item.project?.skills && item.project.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4 mt-auto">
                                {item.project.skills.map((skill: string) => {
                                  const isMatched = currentUser?.skills?.some((userSkill: string) => userSkill.toLowerCase() === skill.toLowerCase());
                                  return (
                                    <span key={skill} className={`px-2 py-0.5 text-[9px] font-semibold rounded border ${isMatched ? "bg-indigo-50 text-gray-700 border-indigo-200 shadow-sm" : "bg-zinc-100 text-zinc-500 border-black/5"}`}>
                                      {skill}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <div className="pt-3 flex justify-between items-center text-[10px] text-zinc-400 mt-auto">
                              <div className="flex gap-2">
                                {item.project?.demoUrl && (
                                  <a href={item.project.demoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-full transition-colors">
                                    Project Link
                                  </a>
                                )}
                                <Link href={`/user/${item.author?.id}`} className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shadow-sm">
                                  View Owner <span aria-hidden="true">&rarr;</span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Opportunities showcase */}
          {activeCenterTab === "opportunities" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] ring-1 ring-black/5 p-5 rounded-3xl">
                <div>
                  <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Opportunities</h3>
                  <p className="text-xs text-zinc-800 mt-0.5">Find your next opportunity with StudyBuddy.</p>
                </div>
                <button onClick={() => setShowOpportunityModal(true)} className="w-fit text-xs font-bold text-white bg-[#0071E3] hover:opacity-90 rounded-xl py-2 px-4 transition shadow-sm">
                  + Add Opportunity
                </button>
              </div>

              {loadingOpportunities ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-36 bg-white/40 border border-white/40 rounded-3xl" />
                  ))}
                </div>
              ) : opportunities.length === 0 ? (
                <div className="text-center py-20 bg-white/40 border border-white/40 rounded-3xl text-zinc-400">Belum ada oportunitas magang/kerja. Jadilah yang pertama membagikannya!</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {opportunities.map((op) => (
                    <div key={op.id} className="p-5 bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] ring-1 ring-black/5 rounded-3xl flex flex-col justify-between transition duration-200 hover:-translate-y-0.5">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${op.logoBg || "bg-[#0E49B5]"} flex items-center justify-center text-xs font-extrabold text-white shrink-0`}>{op.company.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-extrabold text-[#1D1D1F] leading-tight">{op.role}</h4>
                            <p className="text-xs font-medium text-zinc-500 mt-0.5">{op.company}</p>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-600 mt-4 leading-relaxed">{op.info}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-100 pt-4 mt-4">
                        {op.link ? (
                          <a href={op.link.startsWith("http") ? op.link : `https://${op.link}`} target="_blank" rel="noopener noreferrer" className="text-xs font-extrabold bg-[#0071E3] hover:opacity-90 text-white px-4 py-2 rounded-xl transition shadow-sm">
                            Apply Externally &rarr;
                          </a>
                        ) : (
                          <button
                            onClick={() => {
                              setAppliedRole(`${op.role} at ${op.company}`);
                              setShowApplyModal(true);
                            }}
                            className="text-xs font-extrabold bg-indigo-50 border border-indigo-105 hover:bg-indigo-100/80 text-indigo-700 px-4 py-2 rounded-xl transition"
                          >
                            Quick Apply
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Recommended Buddies */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2">Recommended Buddies</h3>
              <Link href="/?tab=discover" className="text-[10px] font-bold text-[#0071E3] hover:underline">
                See All
              </Link>
            </div>

            {loadingRecs ? (
              <div className="px-5 pb-5 space-y-12">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-zinc-100 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recommendedBuddies.length === 0 ? (
              <p className="text-[11px] text-zinc-400 text-center px-5 pb-6 leading-relaxed">Add skills & interests to your profile to get smart buddy suggestions!</p>
            ) : (
              <ul>
                {recommendedBuddies.map((item, idx) => (
                  <li key={item.user?.id || idx}>
                    {idx > 0 && <div className="h-px bg-black/5 mx-5" />}
                    <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-black/[0.02] transition-colors">
                      <Link href={`/user/${item.user?.id}`} className="shrink-0 mt-0.5">
                        {item.user?.profilePicture ? <img src={item.user.profilePicture} alt={item.user.name} className="w-9 h-9 rounded-full object-cover border border-black/5" /> : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center font-bold text-xs text-zinc-500">{item.user?.name?.charAt(0)}</div>}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/user/${item.user?.id}`}>
                          <p className="text-xs font-bold text-[#1D1D1F] hover:underline leading-snug">{item.user?.name}</p>
                        </Link>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">{item.matchReason || item.user?.jurusan || "Student"}</p>
                        <button onClick={() => handleConnect(item.user?.id)} className="mt-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold bg-[#0071E3]/10 text-[#0071E3] hover:bg-[#0071E3]/20 transition-colors w-full">
                          Connect
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* SUCCESS APPLICATION MODAL OVERLAY */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-w-sm w-full mx-4 rounded-3xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 text-green-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 animate-bounce">✓</div>
            <h3 className="text-base font-extrabold text-zinc-800 tracking-tight">Application Submitted! 🎉</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              You have successfully applied for the <span className="font-bold text-zinc-700">{appliedRole}</span> role.
            </p>
            <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">We have compiled and shared your Study Buddy student profile, skills list, angkatan, and majors details directly with the recruiter.</p>

            <button
              onClick={() => {
                setShowApplyModal(false);
                setAppliedRole("");
              }}
              className="mt-6 w-full py-2.5 bg-logo-gradient text-white font-extrabold rounded-xl text-xs hover:opacity-90 transition shadow-md"
            >
              Great, thank you!
            </button>
          </div>
        </div>
      )}

      {/* ADD OPPORTUNITY MODAL OVERLAY */}
      {showOpportunityModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-md flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <form onSubmit={handleCreateOpportunity} className="bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-w-md w-full mx-4 rounded-3xl p-6 md:p-8 animate-in zoom-in-95 duration-200 text-left flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-indigo-600 bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded">Opportunities Board</span>
                <h3 className="text-base font-extrabold text-zinc-800 mt-2">Bagikan Oportunitas Baru</h3>
              </div>
              <button type="button" onClick={() => setShowOpportunityModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold text-xs">
                ✕ Close
              </button>
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[10px] font-extrabold uppercase text-zinc-400 font-bold">Nama Perusahaan / Organisasi</label>
              <input type="text" required value={newOpportunity.company} onChange={(e) => setNewOpportunity((prev) => ({ ...prev, company: e.target.value }))} placeholder="Contoh: Google Indonesia, GoTo, Fasilkom UI" className="bg-zinc-50 border border-zinc-150 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 transition text-zinc-700 font-semibold" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase text-zinc-400 font-bold">Nama Peran / Jabatan</label>
              <input type="text" required value={newOpportunity.role} onChange={(e) => setNewOpportunity((prev) => ({ ...prev, role: e.target.value }))} placeholder="Contoh: Frontend Engineer Intern, Asisten Dosen SBD" className="bg-zinc-50 border border-zinc-150 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 transition text-zinc-700 font-semibold" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase text-zinc-400 font-bold">Deskripsi Singkat / Info Alumni</label>
              <input type="text" required value={newOpportunity.info} onChange={(e) => setNewOpportunity((prev) => ({ ...prev, info: e.target.value }))} placeholder="Contoh: 12 UI alumni bekerja di sini • Full-time" className="bg-zinc-50 border border-zinc-150 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 transition text-zinc-700 font-semibold" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase text-zinc-400 font-bold">Tautan Pendaftaran (Link Apply)</label>
              <input type="text" value={newOpportunity.link} onChange={(e) => setNewOpportunity((prev) => ({ ...prev, link: e.target.value }))} placeholder="Contoh: https://careers.google.com atau kosongan" className="bg-zinc-50 border border-zinc-150 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 transition text-zinc-700 font-semibold" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase text-zinc-400 font-bold">Warna Aksen Logo</label>
              <div className="flex gap-2">
                {[
                  { name: "Red", bg: "bg-[#EF4444]" },
                  { name: "Blue", bg: "bg-[#0071E3]" },
                  { name: "Green", bg: "bg-[#10B981]" },
                  { name: "Purple", bg: "bg-[#8B5CF6]" },
                  { name: "Orange", bg: "bg-[#F59E0B]" },
                ].map((col) => {
                  const isSelected = newOpportunity.logoBg === col.bg;
                  return <button key={col.bg} type="button" onClick={() => setNewOpportunity((prev) => ({ ...prev, logoBg: col.bg }))} className={`w-6 h-6 rounded-full ${col.bg} transition ${isSelected ? "ring-2 ring-indigo-500 ring-offset-2 scale-110" : "hover:scale-105"}`} title={col.name} />;
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-100">
              <button type="button" onClick={() => setShowOpportunityModal(false)} className="px-4 py-2 text-zinc-500 hover:text-zinc-700 text-xs font-bold transition">
                Batal
              </button>
              <button type="submit" className="px-6 py-2 bg-logo-gradient text-white font-bold rounded-xl text-xs hover:opacity-90 shadow-md transition">
                Bagikan Oportunitas
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD PROJECT MODAL OVERLAY */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-md flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleCreateProject(e);
              setShowProjectModal(false);
            }}
            className="bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-w-md w-full mx-4 rounded-3xl p-6 md:p-8 animate-in zoom-in-95 duration-200 text-left flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-indigo-600 bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded">Academic Portfolio</span>
                <h3 className="text-base font-extrabold text-zinc-800 mt-2">Upload Project Baru</h3>
              </div>
              <button type="button" onClick={() => setShowProjectModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold text-xs">
                ✕ Close
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <Input label="Project Title" placeholder="e.g. StudyBuddy App" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
              <Input label="Short Description" placeholder="What does it solve? Who is it for?" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Image URL (Optional)" placeholder="https://..." value={newProject.imageUrl} onChange={(e) => setNewProject({ ...newProject, imageUrl: e.target.value })} />
                <Input label="Demo Link (Optional)" placeholder="https://github.com/..." value={newProject.demoUrl} onChange={(e) => setNewProject({ ...newProject, demoUrl: e.target.value })} />
              </div>
              <Input label="Skills Used (Comma separated)" placeholder="React, Neo4j, Tailwind" value={newProject.skills} onChange={(e) => setNewProject({ ...newProject, skills: e.target.value })} />
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-100">
              <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 text-zinc-500 hover:text-zinc-700 text-xs font-bold transition">
                Batal
              </button>
              <button type="submit" disabled={creatingProject || !newProject.title || !newProject.description} className="px-6 py-2 bg-logo-gradient text-white font-bold rounded-xl text-xs hover:opacity-90 shadow-md transition disabled:opacity-50">
                {creatingProject ? "Publishing..." : "Publish Project"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-32 text-center text-zinc-500 font-medium">
          <svg className="animate-spin h-8 w-8 text-[#0071E3] mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading Study Buddy environment...</span>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
