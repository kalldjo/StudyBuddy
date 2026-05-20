"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/utils/api";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";
import cytoscape from "cytoscape";

const unwrapNeo4jInt = (val: any): any => {
  if (val === null || val === undefined) return "";
  if (typeof val === "object" && val !== null) {
    if ("low" in val && typeof val.low === "number") {
      return val.low;
    }
  }
  return val;
};

const getSocialUsername = (urlOrHandle: string): string => {
  if (!urlOrHandle) return "";
  let clean = urlOrHandle.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const url = new URL(clean);
      const path = url.pathname.replace(/^\/+/g, "").replace(/\/+$/g, "");
      if (path) return path.split("/")[0];
    } catch (e) {
      // return fallback
    }
  }
  return clean.startsWith("@") ? clean : clean;
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
  const [connectionStatus, setConnectionStatus] = useState<string>("none");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Active view states
  const [activeView, setActiveView] = useState<"profile" | "graph_explorer" | "direct_sync" | "collab_requests">("profile");
  const [activeTab, setActiveTab] = useState<"posts" | "projects">("posts");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleViewChange = (newView: "profile" | "graph_explorer" | "direct_sync" | "collab_requests") => {
    setActiveView(newView);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/user/${userId}?view=${newView}`);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const view = searchParams.get("view");
    if (view === "direct_sync" || view === "graph_explorer" || view === "profile") {
      setActiveView(view as any);
    }
  }, [userId]);

  // Unified Composers State
  const [composerTab, setComposerTab] = useState<"post" | "project">("post");

  // Post composer inputs
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Project composer inputs
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projImage, setProjImage] = useState("");
  const [projDemo, setProjDemo] = useState("");
  const [projSkills, setProjSkills] = useState("");
  const [projSubmitting, setProjSubmitting] = useState(false);

  // Peer project collaboration requests modal state
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [selectedCollabProject, setSelectedCollabProject] = useState<any>(null);
  const [collabRole, setCollabRole] = useState("Frontend Developer");
  const [collabMessage, setCollabMessage] = useState("");
  const [collabSubmitting, setCollabSubmitting] = useState(false);

  // Edit/Delete project states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", imageUrl: "", demoUrl: "", skills: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);

  // Fetch incoming project requests
  useEffect(() => {
    if (activeView === "collab_requests" && connectionStatus === "self") {
      const fetchRequests = async () => {
        try {
          const res = await apiFetch("/projects/requests");
          if (res.data) setIncomingRequests(res.data);
        } catch (err) {
          console.error("Failed to fetch requests", err);
        }
      };
      fetchRequests();
    }
  }, [activeView, connectionStatus]);

  // Notifications State — load riil dari backend
  const [notifications, setNotifications] = useState<any[]>([]);

  // Real-Time Direct Sync Chat States
  const [buddies, setBuddies] = useState<any[]>([]);
  const [loadingBuddies, setLoadingBuddies] = useState(false);
  const [activeChatBuddyId, setActiveChatBuddyId] = useState<string>("");
  const [activeChatBuddyName, setActiveChatBuddyName] = useState<string>("");
  const [buddyMessagesList, setBuddyMessagesList] = useState<any[]>([]);
  const [chatInputs, setChatInputs] = useState("");
  const [socket, setSocket] = useState<any>(null);

  // Fetch dynamic chat buddies (friends)
  useEffect(() => {
    const loadChatBuddies = async () => {
      if (activeView !== "direct_sync") return;
      setLoadingBuddies(true);
      try {
        const res = await apiFetch("/friends/list");
        const list = res.data || [];
        setBuddies(list);
        if (list.length > 0 && !activeChatBuddyId) {
          setActiveChatBuddyId(list[0].id);
          setActiveChatBuddyName(list[0].name);
        }
      } catch (error) {
        console.error("Failed to load friends list", error);
      } finally {
        setLoadingBuddies(false);
      }
    };
    loadChatBuddies();
  }, [activeView]);

  // Inisialisasi socket.io-client connection
  useEffect(() => {
    if (!currentUser?.id) return;

    // connect ke backend
    const s = io("http://localhost:3001", {
      query: { userId: currentUser.id },
    });
    setSocket(s);

    return () => {
      s.close();
    };
  }, [currentUser]);

  // Fetch message history pas pindah chat buddy
  useEffect(() => {
    if (activeView !== "direct_sync" || !activeChatBuddyId) return;

    const fetchMessages = async () => {
      try {
        const res = await apiFetch(`/chat/${activeChatBuddyId}`);
        if (res.success && res.data) {
          setBuddyMessagesList(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch message history", error);
      }
    };

    fetchMessages();
  }, [activeView, activeChatBuddyId]);

  // Real-time socket message handler
  useEffect(() => {
    if (!socket || !activeChatBuddyId) return;

    const handleReceiveMessage = (msg: any) => {
      if ((msg.senderId === activeChatBuddyId && msg.receiverId === currentUser?.id) || (msg.senderId === currentUser?.id && msg.receiverId === activeChatBuddyId)) {
        setBuddyMessagesList((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const filtered = prev.filter((m) => !m.id.startsWith("local_"));
          return [...filtered, msg];
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    // terima notif real-time jika ada yang masuk
    const handleNewNotification = (notif: any) => {
      setNotifications((prev) => [notif, ...prev]);
    };
    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, activeChatBuddyId, currentUser]);

  // Fetch notifikasi riil dari backend saat pertama load
  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchNotifs = async () => {
      try {
        const res = await apiFetch("/notifications");
        setNotifications(res.data || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    fetchNotifs();
  }, [currentUser]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [buddyMessagesList, activeView]);

  // Graph Explorer Node Selector States
  const [selectedGraphNode, setSelectedGraphNode] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const [dynamicGraphData, setDynamicGraphData] = useState<any>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);

  useEffect(() => {
    if (activeView !== "graph_explorer" || !userId) return;

    const fetchGraphData = async () => {
      setLoadingGraph(true);
      try {
        const res = await apiFetch(`/users/graph/${userId}`);
        if (res.success && res.data) {
          setDynamicGraphData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic graph data", err);
      } finally {
        setLoadingGraph(false);
      }
    };

    fetchGraphData();
  }, [activeView, userId]);

  // Initialize Cytoscape when dynamicGraphData is fetched and the container is ready
  useEffect(() => {
    if (activeView !== "graph_explorer" || !dynamicGraphData || !containerRef.current) return;

    const elements: any[] = [];

    // 1. Center User Node
    elements.push({
      data: {
        id: "center",
        label: dynamicGraphData.user?.name || "Kamu",
        type: "user",
      },
    });

    // 2. Fakultas Node
    if (dynamicGraphData.fakultas?.name) {
      elements.push({
        data: {
          id: "fakultas",
          label: dynamicGraphData.fakultas.name,
          type: "faculty",
        },
      });
      elements.push({
        data: {
          id: "e_c_fakultas",
          source: "center",
          target: "fakultas",
          label: "Fakultas",
        },
      });
    }

    // 3. Jurusan Node
    if (dynamicGraphData.jurusan?.name) {
      elements.push({
        data: {
          id: "jurusan",
          label: dynamicGraphData.jurusan.name,
          type: "major",
        },
      });
      elements.push({
        data: {
          id: "e_c_jurusan",
          source: "center",
          target: "jurusan",
          label: "Jurusan",
        },
      });
    }

    // 4. Skills Nodes
    if (dynamicGraphData.skills) {
      dynamicGraphData.skills.forEach((s: any) => {
        const sId = `skill_${s.name}`;
        elements.push({
          data: {
            id: sId,
            label: s.name,
            type: "skill",
          },
        });
        elements.push({
          data: {
            id: `e_c_${sId}`,
            source: "center",
            target: sId,
            label: "Uses Skill",
          },
        });
      });
    }

    // 5. Friends Nodes
    if (dynamicGraphData.friends) {
      dynamicGraphData.friends.forEach((f: any) => {
        if (!f || !f.id) return;
        elements.push({
          data: {
            id: f.id,
            label: f.name,
            type: "friend",
          },
        });
        elements.push({
          data: {
            id: `e_c_${f.id}`,
            source: "center",
            target: f.id,
            label: "Friends With",
          },
        });

        // If friend shares user's major
        if (f.jurusan && dynamicGraphData.jurusan?.name && f.jurusan === dynamicGraphData.jurusan.name) {
          elements.push({
            data: {
              id: `e_f_jurusan_${f.id}`,
              source: f.id,
              target: "jurusan",
              label: "Majors In",
            },
          });
        }
      });
    }

    // Initialize Cytoscape.js
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      boxSelectionEnabled: false,
      autounselectify: true,
      style: [
        {
          selector: "node",
          style: {
            content: "data(label)",
            "text-valign": "bottom",
            "text-margin-y": 8,
            color: "#E2E8F0",
            "font-family": "Inter, system-ui, sans-serif",
            "font-size": "10px",
            "font-weight": "bold",
            "text-background-opacity": 0.8,
            "text-background-color": "#0F172A",
            "text-background-padding": "3px",
            "text-background-shape": "roundrectangle",
            width: "36px",
            height: "36px",
            "background-color": "#475569",
            "transition-property": "background-color, line-color, target-arrow-color",
            "transition-duration": 0.3,
          } as any,
        },
        {
          selector: 'node[type="user"]',
          style: {
            width: "50px",
            height: "50px",
            "background-color": "#3B82F6",
            "border-width": "3px",
            "border-color": "#60A5FA",
            color: "#FFFFFF",
            "font-size": "11px",
            "font-weight": "black",
          },
        },
        {
          selector: 'node[type="friend"]',
          style: {
            "background-color": "#8B5CF6",
            "border-width": "2px",
            "border-color": "#A78BFA",
          },
        },
        {
          selector: 'node[type="skill"]',
          style: {
            "background-color": "#10B981",
            "border-width": "2px",
            "border-color": "#34D399",
            shape: "hexagon",
          },
        },
        {
          selector: 'node[type="faculty"]',
          style: {
            "background-color": "#F59E0B",
            "border-width": "2px",
            "border-color": "#FBBF24",
            shape: "triangle",
          },
        },
        {
          selector: 'node[type="major"]',
          style: {
            "background-color": "#EC4899",
            "border-width": "2px",
            "border-color": "#F472B6",
            shape: "diamond",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#334155",
            "target-arrow-color": "#334155",
            "target-arrow-shape": "none",
            "curve-style": "bezier",
            "transition-property": "line-color, width",
            "transition-duration": 0.3,
          } as any,
        },
        {
          selector: "edge:selected",
          style: {
            "line-color": "#60A5FA",
            width: 3,
          } as any,
        },
      ],
      layout: {
        name: "cose",
        animate: true,
        animationDuration: 800,
        nodeRepulsion: () => 6000,
        idealEdgeLength: () => 100,
        gravity: 0.2,
      } as any,
    });

    cyRef.current = cy;

    // Tap/Click node listener
    cy.on("tap", "node", (evt: any) => {
      const node = evt.target;
      setSelectedGraphNode({
        id: node.id(),
        label: node.data("label"),
        type: node.data("type"),
      });
    });

    // Hover listeners
    cy.on("mouseover", "node", (evt: any) => {
      const node = evt.target;

      // Highlight direct edges and connected nodes
      cy.edges().style({ "line-color": "#1E293B", width: 1 });
      node.connectedEdges().style({ "line-color": "#60A5FA", width: 2.5 });
    });

    cy.on("mouseout", "node", () => {
      // Reset edge styling
      cy.edges().style({ "line-color": "#334155", width: 1.5 });
    });

    return () => {
      cy.destroy();
    };
  }, [activeView, dynamicGraphData]);

  // Fetch initial profile stats
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const profileRes = await apiFetch(`/users/${userId}`);
        setProfile(profileRes.data?.user || null);
        setConnectionStatus(profileRes.data?.connectionStatus || "none");

        const projectsRes = await apiFetch(`/projects/user/${userId}`);
        setProjects(projectsRes.data || []);

        const postsRes = await apiFetch(`/posts/user/${userId}`);
        setPosts(postsRes.data || []);

        try {
          const certRes = await apiFetch(`/academy/my-credentials?userId=${userId}`);
          setEarnedCertificates(certRes.data || []);
        } catch (e) {
          console.error("Failed to load certificates", e);
        }
      } catch (error) {
        console.error("Failed to load profile data", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      await apiFetch("/friends/add", {
        method: "POST",
        body: JSON.stringify({ targetId: userId }),
      });
      setConnectionStatus("pending_sent");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await apiFetch("/friends/accept", {
        method: "POST",
        body: JSON.stringify({ targetId: userId }),
      });
      setConnectionStatus("friends");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await apiFetch("/friends/reject", {
        method: "POST",
        body: JSON.stringify({ targetId: userId }),
      });
      setConnectionStatus("none");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove this connection?")) return;
    setActionLoading(true);
    try {
      await apiFetch("/friends/remove", {
        method: "POST",
        body: JSON.stringify({ targetId: userId }),
      });
      setConnectionStatus("none");
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
      const res = await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify({ content: postContent, imageUrl: postImage }),
      });

      // Add immediately to feed
      const newPostEntry = {
        post: res.data || { id: `p_${Date.now()}`, content: postContent, imageUrl: postImage, createdAt: new Date() },
        author: {
          id: currentUser?.id,
          name: currentUser?.name || "Me",
          profilePicture: currentUser?.profilePicture || "",
          jurusan: currentUser?.jurusan || "Student",
        },
      };

      setPosts((prev) => [newPostEntry, ...prev]);
      setPostContent("");
      setPostImage("");
      setActiveTab("posts");
      alert("Post published successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to publish post");
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
      const res = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
          title: projTitle,
          description: projDesc,
          imageUrl: projImage,
          demoUrl: projDemo,
          skills: projSkills,
        }),
      });

      const newProjEntry = res.data || {
        id: `proj_${Date.now()}`,
        title: projTitle,
        description: projDesc,
        imageUrl: projImage,
        demoUrl: projDemo,
        skills: projSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        createdAt: new Date(),
        collaborators: [],
      };

      setProjects((prev) => [newProjEntry, ...prev]);
      setProjTitle("");
      setProjDesc("");
      setProjImage("");
      setProjDemo("");
      setProjSkills("");
      setActiveTab("projects");
      alert("Project created successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to create project");
    } finally {
      setProjSubmitting(false);
    }
  };

  // Submit Collaboration Request
  const handleSubmitCollabRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabMessage.trim() || !selectedCollabProject) return;
    setCollabSubmitting(true);

    try {
      await apiFetch(`/projects/${selectedCollabProject.id}/join`, {
        method: "POST",
        body: JSON.stringify({ role: collabRole, message: collabMessage }),
      });
      alert(`Collaboration request submitted successfully for project: "${selectedCollabProject?.title}"!`);
      setShowCollabModal(false);
      setCollabMessage("");
    } catch (err) {
      console.error(err);
      alert("Failed to send join request");
    } finally {
      setCollabSubmitting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title || !editForm.description || !editingProject) return;
    setEditSubmitting(true);

    try {
      const response = await apiFetch(`/projects/${editingProject.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });

      if (response && response.data) {
        setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? { ...p, ...response.data } : p)));
        setShowEditModal(false);
        setEditingProject(null);
      }
    } catch (err) {
      console.error("Failed to update project", err);
      alert("Failed to update project");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await apiFetch(`/projects/${projectId}`, {
        method: "DELETE",
      });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error("Failed to delete project", err);
      alert("Failed to delete project");
    }
  };

  // Accept incoming request handler
  const handleApproveCollab = async (projectId: string, requesterId: string, projectTitle: string, requesterName: string) => {
    try {
      await apiFetch(`/projects/${projectId}/accept`, {
        method: "POST",
        body: JSON.stringify({ requesterId }),
      });
      alert(`Approved collaboration request from ${requesterName} to join your project: "${projectTitle}"!`);

      // Remove request from list
      setIncomingRequests((prev) => prev.filter((r) => !(r.projectId === projectId && r.requesterId === requesterId)));

      // Simulate adding collaborator name on target project card
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              collaborators: [...(p.collaborators || []), requesterName],
            };
          }
          return p;
        }),
      );
    } catch (err) {
      console.error(err);
      alert("Failed to accept request");
    }
  };

  const handleDeclineCollab = async (projectId: string, requesterId: string) => {
    try {
      await apiFetch(`/projects/${projectId}/reject`, {
        method: "POST",
        body: JSON.stringify({ requesterId }),
      });
      setIncomingRequests((prev) => prev.filter((r) => !(r.projectId === projectId && r.requesterId === requesterId)));
    } catch (err) {
      console.error(err);
    }
  };

  // Direct DM message send handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputs.trim() || !activeChatBuddyId) return;

    const content = chatInputs.trim();
    setChatInputs("");

    // Pre-insert local message for ultra-snappy instant feedback!
    const localMsg = {
      id: `local_${Date.now()}`,
      senderId: currentUser?.id,
      receiverId: activeChatBuddyId,
      content,
      createdAt: new Date().toISOString(),
    };
    setBuddyMessagesList((prev) => [...prev, localMsg]);

    try {
      await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          receiverId: activeChatBuddyId,
          content,
        }),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to deliver message");
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
        <Button onClick={() => router.push("/")}>Go to Home</Button>
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
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3.5 px-3">Account</p>
              <div className="flex flex-col gap-1">
                {/* 1. My Profile */}
                <button onClick={() => handleViewChange("profile")} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${activeView === "profile" ? "bg-[#0071E3]/5 text-[#0071E3] border border-[#0071E3]/10" : "text-[#5C6E80] hover:text-[#1D1D1F] hover:bg-zinc-50/50"}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <span>{connectionStatus === "self" ? "My Profile" : "Profile"}</span>
                </button>

                {/* 2. Graph Explore */}
                <button onClick={() => handleViewChange("graph_explorer")} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${activeView === "graph_explorer" ? "bg-[#0071E3]/5 text-[#0071E3] border border-[#0071E3]/10" : "text-[#5C6E80] hover:text-[#1D1D1F] hover:bg-zinc-50/50"}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                  </svg>
                  <span>Graph Explore</span>
                </button>

                {/* 3. Chat */}
                <button onClick={() => handleViewChange("direct_sync")} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${activeView === "direct_sync" ? "bg-[#0071E3]/5 text-[#0071E3] border border-[#0071E3]/10" : "text-[#5C6E80] hover:text-[#1D1D1F] hover:bg-zinc-50/50"}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379L3.5 20.5h17l-1.92-2.134c1.153-.086 2.294-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.01Z" />
                  </svg>
                  <span>Chat</span>
                </button>

                {/* 4. Connection */}
                <Link href="/network" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#5C6E80] hover:text-[#1D1D1F] hover:bg-zinc-50/50 transition">
                  <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.018 12.018 0 0 1 12 20.25a12.018 12.018 0 0 1-3-.109v-.109m0-1.002A9.235 9.235 0 0 0 6 18.75m0-18.75a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM6 18.75A4.125 4.125 0 0 0 2.25 22.5h7.5A4.125 4.125 0 0 0 6 18.75Zm9.75-9.75a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
                  </svg>
                  <span>Connection</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: Tab Views & Features Manager */}
        {/* ========================================== */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* ========================================== */}
          {/* TAB 1: Classic Profile Viewer & Feed Composer */}
          {/* ========================================== */}
          {activeView === "profile" && (
            <>
              {/* Header profile details card */}
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] rounded-3xl p-8 relative">
                {connectionStatus === "self" && (
                  <button onClick={() => router.push("/profile")} className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200/80 hover:border-zinc-300 bg-white hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-800 shadow-sm transition-all" title="Edit Profile">
                    <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                    <span>Edit Profile</span>
                  </button>
                )}

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                  {profile.profilePicture ? <img src={profile.profilePicture} alt={profile.name} className="w-24 h-24 rounded-full object-cover border border-black/10 shadow-sm" /> : <div className="w-24 h-24 rounded-full bg-zinc-200 border border-black/10 flex items-center justify-center text-4xl font-semibold text-zinc-500">{profile.name?.charAt(0) || "?"}</div>}

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">{profile.name}</h1>
                        <p className="text-sm font-semibold text-[#0071E3] mt-1">{profile.jurusan ? `${profile.jurusan} (${unwrapNeo4jInt(profile.angkatan) || "N/A"})` : "Student"}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{profile.fakultas || "No Faculty info"}</p>
                      </div>

                      <div className="flex gap-2 justify-center">
                        {connectionStatus === "none" && (
                          <Button variant="primary" onClick={handleConnect} disabled={actionLoading}>
                            Connect
                          </Button>
                        )}
                        {connectionStatus === "pending_sent" && (
                          <Button variant="secondary" disabled>
                            Requested
                          </Button>
                        )}
                        {connectionStatus === "pending_received" && (
                          <div className="flex gap-2">
                            <Button variant="primary" onClick={handleAccept} disabled={actionLoading}>
                              Accept
                            </Button>
                            <Button variant="secondary" onClick={handleReject} disabled={actionLoading}>
                              Decline
                            </Button>
                          </div>
                        )}
                        {connectionStatus === "friends" && (
                          <div className="flex gap-2">
                            <Button variant="secondary" className="border-green-300 text-green-600 bg-green-50/50 hover:bg-green-50 cursor-default">
                              Connected
                            </Button>
                            <Button variant="secondary" onClick={handleRemove} disabled={actionLoading} className="text-red-500 hover:bg-red-50 hover:border-red-200">
                              Unfriend
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {profile.bio && <p className="text-zinc-600 mt-6 text-sm leading-relaxed max-w-2xl italic">"{profile.bio}"</p>}

                    <div className="flex flex-wrap gap-3 mt-4">
                      {profile.linkedin && (
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-zinc-700 hover:text-black flex items-center gap-1.5 bg-zinc-50 border border-zinc-150 rounded-xl px-3 py-1.5 transition hover:bg-zinc-100 shadow-sm">
                          <svg className="w-4 h-4 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                          <span>{getSocialUsername(profile.linkedin)}</span>
                        </a>
                      )}
                      {profile.github && (
                        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-zinc-700 hover:text-black flex items-center gap-1.5 bg-zinc-50 border border-zinc-150 rounded-xl px-3 py-1.5 transition hover:bg-zinc-100 shadow-sm">
                          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                          <span>{getSocialUsername(profile.github)}</span>
                        </a>
                      )}
                      {profile.instagram && (
                        <a href={profile.instagram.startsWith("http") ? profile.instagram : `https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1.5 bg-zinc-50 border border-zinc-150 rounded-xl px-3 py-1.5 transition hover:bg-zinc-100 shadow-sm">
                          <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                          <span>{profile.instagram.startsWith("@") ? profile.instagram : `@${profile.instagram}`}</span>
                        </a>
                      )}
                    </div>

                    {earnedCertificates && earnedCertificates.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {earnedCertificates.map((cert) => (
                          <span key={cert.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm border border-yellow-400 hover:scale-105 transition-transform cursor-help" title={`Sertifikat ID: ${cert.certificateId}\nLulus pada: ${new Date(cert.earnedAt).toLocaleDateString()}`}>
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

                      <div className="flex-1 min-w-[200px]">
                        <h3 className="text-xs font-extrabold text-[#1D1D1F] uppercase tracking-wider mb-2">Course</h3>
                        {profile.mataKuliah && profile.mataKuliah.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.mataKuliah.map((mk: string) => (
                              <span key={mk} className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
                                {mk}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400">No course added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feed Tabs navigation */}
              <div className="flex border-b border-black/5 mb-4">
                <button onClick={() => setActiveTab("posts")} className={`pb-4 px-6 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${activeTab === "posts" ? "border-[#0071E3] text-[#0071E3]" : "border-transparent text-zinc-400 hover:text-[#1D1D1F]"}`}>
                  Feeds ({posts.length})
                </button>
                <button onClick={() => setActiveTab("projects")} className={`pb-4 px-6 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${activeTab === "projects" ? "border-[#0071E3] text-[#0071E3]" : "border-transparent text-zinc-400 hover:text-[#1D1D1F]"}`}>
                  Projects ({projects.length})
                </button>
              </div>

              {activeTab === "posts" && (
                <div className="flex flex-col gap-6">
                  {posts.length === 0 ? (
                    <div className="text-center py-16 text-zinc-400 bg-white/40 border border-white/40 rounded-3xl italic">No posts published yet.</div>
                  ) : (
                    posts.map((item, idx) => (
                      <div key={item.post?.id || idx} className="p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl transition hover:bg-white/80">
                        <div className="flex items-center gap-3 mb-4">
                          {profile.profilePicture ? <img src={profile.profilePicture} alt={profile.name} className="w-10 h-10 rounded-full object-cover border border-black/10" /> : <div className="w-10 h-10 rounded-full bg-zinc-200 border border-black/10 flex items-center justify-center font-bold text-zinc-500">{profile.name?.charAt(0)}</div>}
                          <div>
                            <h3 className="font-extrabold text-sm text-[#1D1D1F]">{profile.name}</h3>
                            <p className="text-[9px] font-semibold text-zinc-400">{new Date(unwrapNeo4jInt(item.post?.createdAt) || Date.now()).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-700 leading-relaxed font-semibold mb-4 whitespace-pre-wrap">{item.post?.content}</p>
                        {item.post?.imageUrl && <img src={item.post.imageUrl} alt="Post image" className="w-full max-h-[350px] object-cover rounded-2xl border border-black/5" />}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "projects" && (
                <div>
                  {projects.length === 0 ? (
                    <div className="text-center py-16 text-zinc-400 bg-white/40 border border-white/40 rounded-3xl italic">No projects created yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {projects.map((project, idx) => (
                        <div key={project.id || idx} className="p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200">
                          <div>
                            {project.imageUrl && <img src={project.imageUrl} alt={project.title} className="w-full h-40 object-cover rounded-2xl border border-black/5 mb-4 shadow-sm" />}
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
                                  Project Link
                                </a>
                              )}
                              {/* Request collaboration trigger for external users */}
                              {connectionStatus !== "self" && (
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

                              {/* Edit & Delete for profile owner */}
                              {connectionStatus === "self" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingProject(project);
                                      setEditForm({
                                        title: project.title,
                                        description: project.description,
                                        imageUrl: project.imageUrl || "",
                                        demoUrl: project.demoUrl || "",
                                        skills: project.skills ? project.skills.join(", ") : "",
                                      });
                                      setShowEditModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-extrabold text-[9px] rounded transition"
                                  >
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteProject(project.id)} className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-extrabold text-[9px] rounded transition">
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Incoming requests segment visible ONLY to profile owner */}
                  {connectionStatus === "self" && incomingRequests.length > 0 && (
                    <div className="mt-12 bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-6">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                        <h4 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                            />
                          </svg>
                          <span>Classmate Collaboration Requests</span>
                        </h4>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">{incomingRequests.length} pending</span>
                      </div>

                      <div className="flex flex-col gap-4">
                        {incomingRequests.map((req) => (
                          <div key={req.id} className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.01)] flex flex-col gap-3">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h5 className="text-xs font-extrabold text-zinc-800">{req.requester.name}</h5>
                                <p className="text-[10px] font-bold text-zinc-400">
                                  {req.requester.jurusan} ({unwrapNeo4jInt(req.requester.angkatan)})
                                </p>
                              </div>
                              <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5 uppercase">Role: {req.role}</span>
                            </div>

                            <p className="text-xs text-zinc-600 font-medium leading-relaxed bg-zinc-50 border border-zinc-100/50 rounded-xl p-3">"{req.message}"</p>

                            <div className="flex justify-between items-center border-t border-zinc-50 pt-2.5 mt-1">
                              <span className="text-[9px] font-semibold text-zinc-400">
                                Target Project: <span className="font-bold text-zinc-600">{req.projectTitle}</span>
                              </span>
                              <div className="flex gap-2">
                                <button onClick={() => handleApproveCollab(req.projectId, req.requesterId, req.projectTitle, req.requesterName)} className="px-3 py-1 bg-green-500 text-white font-extrabold text-[9px] rounded-lg shadow-sm hover:bg-green-600 transition">
                                  Approve
                                </button>
                                <button onClick={() => handleDeclineCollab(req.projectId, req.requesterId)} className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-extrabold text-[9px] rounded-lg transition">
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
          {activeView === "graph_explorer" && (
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-6 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight">Proximity Connection Graph</h2>
                  <p className="text-xs text-zinc-400 font-semibold mt-0.5">Neo4j Database interactive graph simulation. Hover connections, select nodes to explore proximity.</p>
                </div>
                <button
                  onClick={() => {
                    setActiveView("profile");
                  }}
                  className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-bold text-xs rounded-xl self-start md:self-auto"
                >
                  Back to Profile
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cytoscape Canvas */}
                <div className="lg:col-span-8 bg-zinc-950 border border-zinc-900 rounded-2xl relative overflow-hidden flex items-center justify-center min-h-[400px]">
                  <div className="absolute top-3 left-3 text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1 z-10 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>Interactive Neo4j Graph Canvas</span>
                  </div>

                  {loadingGraph ? (
                    <div className="text-zinc-500 text-xs font-semibold flex flex-col gap-2 items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Fetching Neo4j graph proximity topology...</span>
                    </div>
                  ) : (
                    <div ref={containerRef} className="w-full h-[400px] cursor-grab active:cursor-grabbing" />
                  )}
                </div>

                {/* Node details analytics panel */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 flex flex-col gap-4">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Node Proximity Analyzer</h3>

                    {selectedGraphNode ? (
                      <div className="flex flex-col gap-3.5 animate-in fade-in duration-200">
                        <div>
                          <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 inline-block">{selectedGraphNode.type} Node</span>
                          <h4 className="text-sm font-extrabold text-zinc-800 mt-2">{selectedGraphNode.label}</h4>
                        </div>

                        <div className="text-[11px] font-medium text-zinc-500 leading-relaxed flex flex-col gap-2">
                          <p>
                            🎯 Connection Tier: <span className="font-extrabold text-zinc-700">{selectedGraphNode.id === "center" ? "Direct Self" : selectedGraphNode.type === "friend" ? "1st Degree Peer" : "Shared Hub"}</span>
                          </p>
                          <p>
                            💡 Mutually Linked: <span className="font-extrabold text-zinc-700">{selectedGraphNode.type === "friend" ? "2 Shared Projects" : "17 Faculty Alumni"}</span>
                          </p>
                        </div>

                        {selectedGraphNode.type === "friend" && (
                          <div className="pt-3 border-t border-zinc-100/80 flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setActiveChatBuddyId(selectedGraphNode.id);
                                setActiveChatBuddyName(selectedGraphNode.label);
                                setActiveView("direct_sync");
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
                    <p className="text-[10px] font-semibold text-indigo-500 leading-relaxed">{"Neo4j graph representation maps MATCH (u)-[:STUDIES_IN]->(j) relationships dynamically to reveal proximate study partners sharing majors and databases focus."}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: Direct Sync Live Chat Simulator */}
          {/* ========================================== */}
          {activeView === "direct_sync" && (
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden flex flex-col h-[650px] animate-in fade-in duration-300">
              {/* Workspace Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 bg-white/50">
                <div>
                  <h2 className="text-base font-extrabold text-[#1D1D1F] tracking-tight">My Chat</h2>
                </div>
                <button onClick={() => handleViewChange("profile")} className="px-3.5 py-1.5 border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-800 font-bold text-xs bg-white rounded-xl shadow-sm transition">
                  Back to Profile
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Buddies list (Sidebar) */}
                <div className="w-full md:w-80 border-r border-zinc-100/80 bg-zinc-50/20 flex flex-col h-full shrink-0">
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                    {loadingBuddies ? (
                      <div className="text-xs text-zinc-400 py-6 text-center font-bold">Loading buddies...</div>
                    ) : buddies.length === 0 ? (
                      <div className="text-xs text-zinc-400 py-10 text-center italic font-bold leading-relaxed px-4">No connections found. Explore the network to find buddies!</div>
                    ) : (
                      buddies.map((buddy) => {
                        const isActive = activeChatBuddyId === buddy.id;
                        const initial = buddy.name ? buddy.name.charAt(0).toUpperCase() : "?";
                        return (
                          <button
                            key={buddy.id}
                            onClick={() => {
                              setActiveChatBuddyId(buddy.id);
                              setActiveChatBuddyName(buddy.name);
                            }}
                            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${isActive ? "bg-[#0071E3]/5 border-[#0071E3]/15 shadow-[0_2px_8px_rgba(0,113,227,0.02)]" : "border-transparent hover:bg-zinc-100/50 text-zinc-705"}`}
                          >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-transform ${isActive ? "bg-gradient-to-br from-[#0071E3] to-[#3692EC] text-white shadow-sm scale-105" : "bg-zinc-100 border border-zinc-200/50 text-zinc-600"}`}>{initial}</div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${isActive ? "text-[#0071E3]" : "text-zinc-800"}`}>{buddy.name}</p>
                              <p className="text-[9px] font-semibold text-zinc-400 truncate mt-0.5">
                                {buddy.jurusan || "Student"} • {unwrapNeo4jInt(buddy.angkatan) || "N/A"}
                              </p>
                            </div>
                            {/* <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-sm animate-pulse" /> */}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Main Chat space */}
                <div className="flex-1 flex flex-col justify-between bg-white relative h-full">
                  {activeChatBuddyId ? (
                    <>
                      {/* Active Chat Header */}
                      <div className="bg-white/90 backdrop-blur-md px-6 py-3 border-b border-zinc-100 flex items-center justify-between z-10 shadow-[0_1px_3px_rgba(0,0,0,0.01)] shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0071E3] to-[#3692EC] text-white flex items-center justify-center font-black text-xs shadow-sm">{activeChatBuddyName ? activeChatBuddyName.charAt(0).toUpperCase() : "?"}</div>
                          <div>
                            <h4 className="font-bold text-zinc-800 text-xs tracking-tight">{activeChatBuddyName}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {/* <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[9px] font-semibold text-emerald-500">Connected</span> */}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Messages Feed */}
                      <div
                        className="flex flex-col gap-4 overflow-y-auto p-6 flex-1 bg-[#F8F9FA]/40 min-h-0"
                        style={{
                          backgroundImage: "radial-gradient(circle, rgba(228, 231, 235, 0.4) 1px, transparent 1px)",
                          backgroundSize: "16px 16px",
                        }}
                      >
                        {buddyMessagesList.length === 0 ? (
                          <div className="text-center py-10 my-auto text-zinc-400 italic text-[11px] font-semibold bg-white/60 backdrop-blur-sm rounded-2xl w-fit mx-auto px-6 border border-zinc-200/50 shadow-sm animate-in fade-in duration-300">No messages yet. Send a greeting to initiate sync!</div>
                        ) : (
                          buddyMessagesList.map((msg, idx) => {
                            const isMe = msg.senderId === currentUser?.id;
                            return (
                              <div key={msg.id || idx} className={`flex flex-col max-w-[70%] ${isMe ? "self-end items-end animate-in slide-in-from-bottom-2 duration-150" : "self-start items-start animate-in slide-in-from-bottom-2 duration-150"}`}>
                                <div className={`px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${isMe ? "bg-gradient-to-br from-[#0071E3] to-[#1C82EB] text-white rounded-tr-sm" : "bg-white text-zinc-800 border border-zinc-150 rounded-tl-sm"}`}>{msg.content}</div>
                                <div className="flex items-center gap-1.5 mt-1 px-1">
                                  <span className="text-[8px] text-zinc-400 font-bold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                  {isMe && <span className="text-[9px] text-[#0071E3] font-black">✓</span>}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Message Input Form */}
                      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-100 flex items-center gap-3 shrink-0">
                        <input type="text" value={chatInputs} onChange={(e) => setChatInputs(e.target.value)} placeholder={`Message ${activeChatBuddyName}...`} disabled={!activeChatBuddyId} className="flex-1 bg-zinc-50 border border-zinc-200/50 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:border-[#0071E3]/50 focus:ring-4 focus:ring-[#0071E3]/5 transition-all font-semibold text-zinc-800 placeholder-zinc-400" />
                        <button type="submit" disabled={!activeChatBuddyId || !chatInputs.trim()} className="w-10 h-10 rounded-2xl bg-logo-gradient text-white flex items-center justify-center shadow-[0_4px_16px_rgba(0,113,227,0.15)] hover:scale-[1.03] active:scale-[0.97] transition disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none shrink-0">
                          <svg className="w-4 h-4 transform rotate-45 -translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                      <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/5 border border-[#0071E3]/10 flex items-center justify-center text-2xl shadow-sm mb-4">💬</div>
                      <h4 className="text-sm font-extrabold text-zinc-800 tracking-tight">Sync Messenger</h4>
                      <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed font-semibold">Select a buddy from your connections list on the left to start typing real-time peer messages.</p>
                    </div>
                  )}
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
          <form onSubmit={handleSubmitCollabRequest} className="bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-w-md w-full mx-4 rounded-3xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left">
            <div>
              <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 inline-block">Academic Operations</span>
              <h3 className="text-base font-extrabold text-zinc-800 mt-2">Request to Collaborate</h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                Project Target: <span className="text-zinc-600">{selectedCollabProject.title}</span>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase text-zinc-400">Your Intended Contribution Role</label>
              <select value={collabRole} onChange={(e) => setCollabRole(e.target.value)} className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs focus:outline-none text-zinc-800 font-semibold cursor-pointer">
                <option value="Frontend Developer">Frontend Designer</option>
                <option value="Backend Architect">Backend Architect</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Database Evaluator">Database Cypher Evaluator</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase text-zinc-400">Your Message Proposal</label>
              <textarea value={collabMessage} onChange={(e) => setCollabMessage(e.target.value)} placeholder="Detail why you want to connect to this project, your related skills, and how you can collaborate successfully..." rows={4} className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs focus:outline-none focus:bg-white text-zinc-800 placeholder-zinc-400 font-semibold" required />
            </div>

            <div className="flex gap-2.5 mt-3 pt-3 border-t border-zinc-100/60 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCollabModal(false);
                  setCollabMessage("");
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button type="submit" disabled={collabSubmitting || !collabMessage.trim()} className="px-6 py-2 bg-logo-gradient text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 transition">
                {collabSubmitting ? "Submitting..." : "Send Proposal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* EDIT PROJECT OVERLAY MODAL                 */}
      {/* ========================================== */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <form onSubmit={handleUpdateProject} className="bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-w-md w-full mx-4 rounded-3xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left">
            <div>
              <span className="text-[8px] font-black uppercase text-[#0071E3] bg-[#0071E3]/5 border border-[#0071E3]/20 rounded px-1.5 py-0.5 inline-block">Manage Portfolio</span>
              <h3 className="text-base font-extrabold text-zinc-800 mt-2">Edit Project</h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                Update details for <span className="text-zinc-600">{editingProject.title}</span>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase text-zinc-400">Project Title</label>
              <input type="text" value={editForm.title} onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))} className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs focus:outline-none text-zinc-800 font-semibold" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase text-zinc-400">Description</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs focus:outline-none focus:bg-white text-zinc-800 font-semibold" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase text-zinc-400">Image URL</label>
              <input type="url" value={editForm.imageUrl} onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))} className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs focus:outline-none text-zinc-800 font-semibold" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase text-zinc-400">Demo URL</label>
              <input type="url" value={editForm.demoUrl} onChange={(e) => setEditForm((prev) => ({ ...prev, demoUrl: e.target.value }))} className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs focus:outline-none text-zinc-800 font-semibold" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold uppercase text-zinc-400">Skills (Comma separated)</label>
              <input type="text" value={editForm.skills} onChange={(e) => setEditForm((prev) => ({ ...prev, skills: e.target.value }))} placeholder="React, Node.js, Neo4j" className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs focus:outline-none text-zinc-800 font-semibold" />
            </div>

            <div className="flex gap-2.5 mt-3 pt-3 border-t border-zinc-100/60 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProject(null);
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button type="submit" disabled={editSubmitting || !editForm.title.trim() || !editForm.description.trim()} className="px-6 py-2 bg-zinc-800 text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-black transition">
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
