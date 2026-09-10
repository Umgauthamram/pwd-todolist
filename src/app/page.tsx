"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Search as SearchIcon,
  ViewStream as ViewStreamIcon,
  GridView as GridViewIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  LightbulbOutlined as LightbulbOutlinedIcon,
  LockOutlined as LockOutlinedIcon,
  LockOpenOutlined as LockOpenOutlinedIcon,
  ArchiveOutlined as ArchiveOutlinedIcon,
  DeleteOutlined as DeleteOutlinedIcon,
  SecurityOutlined as SecurityOutlinedIcon,
  LabelOutlined as LabelOutlinedIcon,
  DeleteForever as DeleteForeverIcon,
  RestoreFromTrash as RestoreFromTrashIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import AuthScreen from "@/components/auth/AuthScreen";
import NoteCreator, { CreateNotePayload } from "@/components/notes/NoteCreator";
import NoteCard, { NoteItem } from "@/components/notes/NoteCard";
import NoteModal from "@/components/notes/NoteModal";
import PinModal, { PinModalMode } from "@/components/private-space/PinModal";
import SettingsView from "@/components/settings/SettingsView";
import SearchScreen from "@/components/search/SearchScreen";
import { cacheNotesLocally, getCachedNotes } from "@/lib/dexie";

type NavItem = "notes" | "private" | "archive" | "trash" | "settings";

export default function HomePage() {
  const {
    user,
    loading: authLoading,
    logout,
    isPrivateUnlocked,
    setIsPrivateUnlocked,
    checkPrivateStatus,
    lockPrivateSpace,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<NavItem>("notes");
  const [isGridView, setIsGridView] = useState<boolean>(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("beginning_sidebar_expanded");
        if (saved !== null) return saved === "true";
      } catch {}
    }
    return true;
  });
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  // Initialize view mode state from localStorage on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem("beginning_view_mode");
      if (saved !== null) {
        setIsGridView(saved === "grid");
      }
    } catch {
      // localStorage may fail in restricted/private contexts
    }
  }, []);

  const toggleViewMode = useCallback((mode?: "grid" | "list") => {
    setIsGridView((prev) => {
      const next = mode !== undefined ? mode === "grid" : !prev;
      try {
        localStorage.setItem("beginning_view_mode", next ? "grid" : "list");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  // Initialize sidebar expanded state from localStorage on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem("beginning_sidebar_expanded");
      if (saved !== null) {
        setIsSidebarExpanded(saved === "true");
      }
    } catch {
      // localStorage may fail in restricted/private contexts
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("beginning_sidebar_expanded", String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  // Pull down to reload state
  const [pullY, setPullY] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const touchStartY = useRef<number>(0);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  // Public notes state
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loadingNotes, setLoadingNotes] = useState<boolean>(false);

  // Private space notes state (strictly isolated)
  const [privateNotes, setPrivateNotes] = useState<NoteItem[]>([]);
  const [loadingPrivateNotes, setLoadingPrivateNotes] = useState<boolean>(false);

  // Note editing modal state
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  // PIN Keypad Modal state
  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [pinModalMode, setPinModalMode] = useState<PinModalMode>("enter");

  // Fetch public workspace notes (with IndexedDB offline fallback)
  const fetchPublicNotes = useCallback(async () => {
    if (!user) return;

    setLoadingNotes(true);
    try {
      const res = await fetch("/api/notes?filter=all");
      if (res.ok) {
        const data = await res.json();
        if (data.notes) {
          setNotes(data.notes);
          cacheNotesLocally(data.notes);
          return;
        }
      }
      // Offline fallback: load from local Dexie IndexedDB
      const cached = await getCachedNotes(user.id, false);
      if (cached && cached.length > 0) {
        setNotes(cached as unknown as NoteItem[]);
      }
    } catch (error) {
      console.warn("Network error loading notes; falling back to offline IndexedDB:", error);
      const cached = await getCachedNotes(user.id, false);
      if (cached && cached.length > 0) {
        setNotes(cached as unknown as NoteItem[]);
      }
    } finally {
      setLoadingNotes(false);
    }
  }, [user]);

  // Fetch private workspace notes (gated by PIN session, with IndexedDB offline fallback)
  const fetchPrivateNotes = useCallback(async () => {
    if (!user || !isPrivateUnlocked) {
      setPrivateNotes([]);
      return;
    }

    setLoadingPrivateNotes(true);
    try {
      const res = await fetch("/api/private-space/notes?filter=all");
      if (res.ok) {
        const data = await res.json();
        if (data.notes) {
          setPrivateNotes(data.notes);
          cacheNotesLocally(data.notes);
          return;
        }
      } else if (res.status === 403) {
        setIsPrivateUnlocked(false);
        return;
      }
      const cached = await getCachedNotes(user.id, true);
      if (cached && cached.length > 0) {
        setPrivateNotes(cached as unknown as NoteItem[]);
      }
    } catch (error) {
      console.warn("Network error loading private notes; falling back to offline IndexedDB:", error);
      const cached = await getCachedNotes(user.id, true);
      if (cached && cached.length > 0) {
        setPrivateNotes(cached as unknown as NoteItem[]);
      }
    } finally {
      setLoadingPrivateNotes(false);
    }
  }, [user, isPrivateUnlocked, setIsPrivateUnlocked]);

  // Scroll down to reload (Pull-to-refresh) handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === "private" && isPrivateUnlocked) {
        await fetchPrivateNotes();
      } else {
        await fetchPublicNotes();
      }
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setPullY(0);
      }, 500);
    }
  }, [activeTab, isPrivateUnlocked, fetchPrivateNotes, fetchPublicNotes]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mainScrollRef.current && mainScrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current > 0 && mainScrollRef.current && mainScrollRef.current.scrollTop === 0) {
      const diff = e.touches[0].clientY - touchStartY.current;
      if (diff > 0) {
        setPullY(Math.min(diff * 0.45, 80));
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullY > 45 && !isRefreshing) {
      handleRefresh();
    } else {
      setPullY(0);
    }
    touchStartY.current = 0;
  };

  useEffect(() => {
    if (user) {
      fetchPublicNotes();
    }
  }, [user, fetchPublicNotes]);

  useEffect(() => {
    if (activeTab === "private" && user) {
      fetchPrivateNotes();
    }
  }, [activeTab, user, fetchPrivateNotes]);

  // CREATE Note
  const handleCreateNote = async (payload: CreateNotePayload) => {
    const isPrivateTarget = activeTab === "private";
    const endpoint = isPrivateTarget ? "/api/private-space/notes" : "/api/notes";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, isPrivate: isPrivateTarget }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          if (isPrivateTarget) {
            setPrivateNotes((prev) => [data.note, ...prev]);
          } else {
            setNotes((prev) => [data.note, ...prev]);
          }
        }
      } else if (res.status === 403) {
        setIsPrivateUnlocked(false);
        setPinModalMode("enter");
        setPinModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  // UPDATE Note
  const handleUpdateNote = async (updatedFields: Partial<NoteItem> & { _id: string }) => {
    const isPrivateTarget = activeTab === "private";
    const endpoint = isPrivateTarget
      ? `/api/private-space/notes/${updatedFields._id}`
      : `/api/notes/${updatedFields._id}`;

    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          if (isPrivateTarget) {
            setPrivateNotes((prev) =>
              prev.map((n) => (n._id === data.note._id ? data.note : n))
            );
          } else {
            setNotes((prev) =>
              prev.map((n) => (n._id === data.note._id ? data.note : n))
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const handleTogglePin = (note: NoteItem) => {
    handleUpdateNote({ _id: note._id, isPinned: !note.isPinned });
  };

  const handleChangeColor = (note: NoteItem, newColor: string) => {
    handleUpdateNote({ _id: note._id, color: newColor });
  };

  const handleToggleArchive = (note: NoteItem) => {
    handleUpdateNote({
      _id: note._id,
      isArchived: !note.isArchived,
      isPinned: false,
    });
  };

  const handleMoveToTrash = (note: NoteItem) => {
    handleUpdateNote({
      _id: note._id,
      isTrashed: true,
      isPinned: false,
    });
  };

  const handleRestoreFromTrash = (note: NoteItem) => {
    handleUpdateNote({
      _id: note._id,
      isTrashed: false,
    });
  };

  const handleDeletePermanently = async (note: NoteItem) => {
    const isPrivateTarget = activeTab === "private";
    const endpoint = isPrivateTarget
      ? `/api/private-space/notes/${note._id}?permanent=true`
      : `/api/notes/${note._id}?permanent=true`;

    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        if (isPrivateTarget) {
          setPrivateNotes((prev) => prev.filter((n) => n._id !== note._id));
        } else {
          setNotes((prev) => prev.filter((n) => n._id !== note._id));
        }
      }
    } catch (error) {
      console.error("Failed to delete note permanently:", error);
    }
  };

  const handleEmptyTrash = async () => {
    const targetNotes = activeTab === "private" ? privateNotes : notes;
    const trashed = targetNotes.filter((n) => n.isTrashed);
    for (const tn of trashed) {
      await handleDeletePermanently(tn);
    }
  };

  // Nav Item Click (Private space keypad is optional, opens only after clicking the unlock button)
  const handleNavClick = (id: NavItem) => {
    setSelectedLabel(null);
    setActiveTab(id);
  };

  const handleLockPrivateSpace = async () => {
    await lockPrivateSpace();
    setActiveTab("notes");
  };

  const currentDataset = activeTab === "private" ? privateNotes : notes;

  const filteredNotes = useMemo(() => {
    let result = currentDataset;

    if (activeTab === "trash") {
      result = result.filter((n) => n.isTrashed);
    } else if (activeTab === "archive") {
      result = result.filter((n) => n.isArchived && !n.isTrashed);
    } else {
      result = result.filter((n) => !n.isArchived && !n.isTrashed);
    }

    if (selectedLabel) {
      result = result.filter((n) => n.labels?.includes(selectedLabel));
    }

    return result;
  }, [currentDataset, activeTab, selectedLabel]);

  const pinnedNotes = useMemo(
    () => filteredNotes.filter((n) => n.isPinned),
    [filteredNotes]
  );
  const otherNotes = useMemo(
    () => filteredNotes.filter((n) => !n.isPinned),
    [filteredNotes]
  );

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    currentDataset.forEach((n) => {
      n.labels?.forEach((l) => set.add(l));
    });
    return Array.from(set);
  }, [currentDataset]);

  // REQUIREMENT 1: Starting itself it should start with the login and signup
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <CircularProgress size={32} sx={{ color: "#ffffff" }} />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const navItems = [
    {
      id: "notes" as NavItem,
      label: "Notes",
      icon: <LightbulbOutlinedIcon fontSize="small" />,
      count: notes.filter((n) => !n.isArchived && !n.isTrashed).length,
    },
    {
      id: "private" as NavItem,
      label: "Private Space",
      icon: isPrivateUnlocked ? (
        <LockOpenOutlinedIcon fontSize="small" className="text-white" />
      ) : (
        <LockOutlinedIcon fontSize="small" />
      ),
      badge: !user?.hasPin ? "Set PIN" : isPrivateUnlocked ? "Unlocked" : "Locked",
      count: isPrivateUnlocked
        ? privateNotes.filter((n) => !n.isArchived && !n.isTrashed).length
        : undefined,
    },
    {
      id: "archive" as NavItem,
      label: "Archive",
      icon: <ArchiveOutlinedIcon fontSize="small" />,
      count: notes.filter((n) => n.isArchived && !n.isTrashed).length,
    },
    {
      id: "trash" as NavItem,
      label: "Trash",
      icon: <DeleteOutlinedIcon fontSize="small" />,
      count: notes.filter((n) => n.isTrashed).length,
    },
  ];

  return (
    <Box className="h-screen max-h-screen overflow-hidden bg-black text-white flex flex-col selection:bg-white selection:text-black">
      {/* Top Header Bar: Section Indicator, Search Icon Button, View Mode Toggle, Profile/Settings Button */}
      <header className="shrink-0 z-40 h-16 border-b border-[#262626] bg-black/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Active Section Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm sm:text-base font-bold text-white tracking-tight">
            {activeTab === "notes"
              ? "Notes"
              : activeTab === "private"
              ? "Private Space"
              : activeTab === "archive"
              ? "Archive"
              : activeTab === "trash"
              ? "Trash"
              : "Settings"}
          </span>
          {selectedLabel && (
            <span className="text-xs font-mono text-neutral-400 bg-neutral-900 border border-[#262626] px-2 py-0.5 rounded-full truncate">
              #{selectedLabel}
            </span>
          )}
        </div>

        {/* Right: Search Icon, Grid/List Toggle, and Profile/Settings Button */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Search Icon Button: Opens Dedicated Search Screen */}
          <Tooltip title="Search notes">
            <IconButton
              onClick={() => setIsSearchOpen(true)}
              className="text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-[#262626]"
              size="small"
              aria-label="Search notes"
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Grid / List View Segmented Control */}
          <div className="flex items-center bg-[#202124] rounded-xl p-0.5">
            <Tooltip title="Grid view">
              <button
                type="button"
                onClick={() => toggleViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isGridView
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
                aria-label="Grid view"
              >
                <GridViewIcon fontSize="small" sx={{ fontSize: 17 }} />
              </button>
            </Tooltip>
            <Tooltip title="List view">
              <button
                type="button"
                onClick={() => toggleViewMode("list")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  !isGridView
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
                aria-label="List view"
              >
                <ViewStreamIcon fontSize="small" sx={{ fontSize: 17 }} />
              </button>
            </Tooltip>
          </div>

          {/* User Profile Button: Navigates to Settings Page */}
          <div className="flex items-center pl-1.5 sm:pl-2 border-l border-[#262626]">
            <Tooltip
              title={
                activeTab === "settings"
                  ? "Settings (Active)"
                  : `Signed in as ${user.email} (Open Settings)`
              }
            >
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2 cursor-pointer px-2.5 py-1 rounded-full transition-all border ${
                  activeTab === "settings"
                    ? "bg-white text-black border-white font-semibold shadow-sm"
                    : "bg-[#0e0e10] hover:bg-neutral-900 text-white border-[#262626] hover:border-neutral-500"
                }`}
                aria-label="Settings and Profile"
              >
                <div
                  className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                    activeTab === "settings" ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium hidden sm:inline max-w-[120px] truncate">
                  {user.email.split("@")[0]}
                </span>
                <SettingsOutlinedIcon
                  sx={{ fontSize: 15 }}
                  className={activeTab === "settings" ? "text-black" : "text-neutral-400"}
                />
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar Navigation (Hidden on desktop md:) */}
      <nav aria-label="Mobile Navigation" className="md:hidden shrink-0 z-30 bg-black/95 backdrop-blur-md border-b border-[#262626] px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-around gap-1 w-full overflow-x-auto no-scrollbar py-0.5 min-w-0">
          {navItems.map((item) => {
            const isActive = activeTab === item.id && !selectedLabel;
            return (
              <Tooltip key={item.id} title={item.label} enterDelay={500}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  aria-label={item.label}
                  className={`flex items-center justify-center p-2 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-[#262626]"
                  }`}
                >
                  <span className={isActive ? "text-black" : "text-neutral-400"}>
                    {item.icon}
                  </span>
                </button>
              </Tooltip>
            );
          })}

          {/* Labels horizontal chips on mobile */}
          {allLabels.length > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#262626]">
              {allLabels.map((lbl) => {
                const isLabelActive = selectedLabel === lbl;
                return (
                  <button
                    key={lbl}
                    onClick={() => setSelectedLabel(isLabelActive ? null : lbl)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                      isLabelActive
                        ? "bg-white text-black font-semibold"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-[#262626]"
                    }`}
                  >
                    <LabelOutlinedIcon sx={{ fontSize: 13 }} />
                    <span>#{lbl}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Main Workspace: Desktop Sidebar (Windows / Mac) + Main Body */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
        {/* Desktop Sidebar (Windows / Mac) with Bottom Shrink/Expand Button */}
        <aside
          aria-label="Desktop Sidebar"
          className={`hidden md:flex flex-col justify-between shrink-0 border-r border-[#262626] bg-black h-full transition-all duration-200 ease-in-out ${
            isSidebarExpanded ? "w-60" : "w-16"
          }`}
        >
          {/* Scrollable upper section: Nav items and Labels */}
          <div className={`flex-1 overflow-y-auto no-scrollbar py-3 space-y-4 ${isSidebarExpanded ? "px-3" : "px-1.5"}`}>
            {/* Main Navigation items */}
            <div className="space-y-1.5 w-full">
              {navItems.map((item) => {
                const isActive = activeTab === item.id && !selectedLabel;
                return (
                  <Tooltip
                    key={item.id}
                    title={!isSidebarExpanded ? `${item.label}${item.count ? ` (${item.count})` : ""}` : ""}
                    placement="right"
                    enterDelay={300}
                  >
                    <button
                      onClick={() => handleNavClick(item.id)}
                      aria-label={item.label}
                      className={`relative w-full flex items-center transition-all cursor-pointer ${
                        isSidebarExpanded
                          ? "justify-between px-3 py-2.5 rounded-xl text-xs font-medium"
                          : "justify-center w-11 h-11 mx-auto rounded-xl"
                      } ${
                        isActive
                          ? "bg-white text-black font-semibold shadow-sm"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-900/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={isActive ? "text-black" : "text-neutral-400"}>
                          {item.icon}
                        </span>
                        {isSidebarExpanded && <span className="truncate">{item.label}</span>}
                      </div>

                      {/* In expanded mode: badge and count */}
                      {isSidebarExpanded && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                isActive
                                  ? "bg-black text-white"
                                  : "bg-neutral-900 text-neutral-300 border border-[#262626]"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {item.count !== undefined && item.count > 0 && (
                            <span
                              className={`text-xs font-mono font-medium ${
                                isActive ? "text-neutral-800 font-bold" : "text-neutral-500"
                              }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </div>
                      )}

                      {/* In shrinked mode: badge indicator dot if count > 0 */}
                      {!isSidebarExpanded && item.count !== undefined && item.count > 0 && (
                        <span
                          className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                            isActive ? "bg-black" : "bg-white"
                          }`}
                        />
                      )}
                    </button>
                  </Tooltip>
                );
              })}
            </div>

            {/* Labels section in desktop sidebar */}
            {allLabels.length > 0 && (
              <div className={`pt-2 border-t border-[#1f1f22] w-full ${isSidebarExpanded ? "space-y-2" : "space-y-1.5"}`}>
                {isSidebarExpanded && (
                  <div className="px-2 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                    <span>Labels</span>
                    {selectedLabel && (
                      <button
                        onClick={() => setSelectedLabel(null)}
                        className="text-[10px] text-neutral-400 hover:text-white normal-case font-sans underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-1 w-full">
                  {allLabels.map((lbl) => {
                    const isLabelActive = selectedLabel === lbl;
                    return (
                      <Tooltip
                        key={lbl}
                        title={!isSidebarExpanded ? `#${lbl}` : ""}
                        placement="right"
                        enterDelay={300}
                      >
                        <button
                          onClick={() => setSelectedLabel(isLabelActive ? null : lbl)}
                          aria-label={`Tag #${lbl}`}
                          className={`w-full flex items-center transition-all cursor-pointer ${
                            isSidebarExpanded
                              ? "gap-2.5 px-3 py-2 rounded-xl text-xs font-medium truncate"
                              : "justify-center w-11 h-11 mx-auto rounded-xl"
                          } ${
                            isLabelActive
                              ? "bg-white text-black font-semibold shadow-sm"
                              : "text-neutral-400 hover:text-white hover:bg-neutral-900/80"
                          }`}
                        >
                          <LabelOutlinedIcon
                            sx={{ fontSize: 16 }}
                            className={isLabelActive ? "text-black" : "text-neutral-500"}
                          />
                          {isSidebarExpanded && <span className="truncate">#{lbl}</span>}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* DOWN BUTTON: User can shrink and expand the sidebar here */}
          <div className={`border-t border-[#262626] p-2.5 shrink-0 bg-black ${isSidebarExpanded ? "px-3" : "px-2"}`}>
            {isSidebarExpanded ? (
              <button
                type="button"
                onClick={toggleSidebar}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#212121] hover:bg-[#282828] transition-all cursor-pointer group shadow-sm"
                aria-label="Collapse sidebar"
              >
                <div className="flex items-center gap-2">
                  <ChevronLeftIcon fontSize="small" className="group-hover:-translate-x-1 transition-transform text-neutral-300 group-hover:text-white" />
                  <span>Collapse</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase">Shrink</span>
              </button>
            ) : (
              <Tooltip title="Expand sidebar" placement="right" enterDelay={300}>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label="Expand sidebar"
                  className="w-12 h-12 mx-auto flex items-center justify-center rounded-xl text-white bg-[#212121] hover:bg-[#282828] transition-all cursor-pointer group shadow-sm"
                >
                  <ChevronRightIcon fontSize="small" className="group-hover:translate-x-1 transition-transform text-neutral-300 group-hover:text-white" />
                </button>
              </Tooltip>
            )}
          </div>
        </aside>

        {/* Main Workspace Body */}
        <div
          ref={mainScrollRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 h-full overflow-y-auto min-w-0"
        >
        <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Scroll down to reload pull indicator (Material UI CircularProgress) */}
          <div
            style={{
              height: isRefreshing ? "56px" : `${pullY}px`,
              opacity: isRefreshing || pullY > 15 ? 1 : 0,
              transition: isRefreshing ? "height 0.2s ease" : "none",
            }}
            className="flex items-center justify-center overflow-hidden transition-opacity mb-4"
          >
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#212121] shadow-xl">
              <CircularProgress
                size={18}
                variant={isRefreshing ? "indeterminate" : "determinate"}
                value={isRefreshing ? undefined : Math.min((pullY / 45) * 100, 100)}
                sx={{ color: "#ffffff" }}
              />
              <span className="text-xs font-medium text-neutral-300">
                {isRefreshing
                  ? "Reloading notes..."
                  : pullY > 45
                  ? "Release to reload"
                  : "Pull down to reload"}
              </span>
            </div>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {/* REQUIREMENT 1: PRIVATE SPACE LOCKED STATE (Keypad is optional, opens ONLY after clicking button) */}
            {activeTab === "private" && !isPrivateUnlocked && (
              <div className="text-center py-16 px-4 max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-[#212121] flex items-center justify-center text-white shadow-2xl">
                  <LockOutlinedIcon sx={{ fontSize: 40 }} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">Private Space</h2>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {user?.hasPin
                      ? "Your private notes are encrypted and locked behind a 4-digit PIN. Tap below to enter your PIN."
                      : "Configure your 4-digit PIN to activate your encrypted Private Space."}
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="contained"
                    size="medium"
                    onClick={() => {
                      if (!user?.hasPin) {
                        setPinModalMode("setup");
                      } else {
                        setPinModalMode("enter");
                      }
                      setPinModalOpen(true);
                    }}
                    startIcon={user?.hasPin ? <LockOpenOutlinedIcon /> : <LockOutlinedIcon />}
                    sx={{
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontWeight: 600,
                      fontSize: "13px",
                      textTransform: "none",
                      borderRadius: "12px",
                      px: 3.5,
                      py: 1.2,
                      "&:hover": { backgroundColor: "#e5e5e5" },
                      boxShadow: "0 4px 14px rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    {user?.hasPin ? "Unlock " : "Enter PIN"}
                  </Button>
                </div>
              </div>
            )}

            {/* PRIVATE SPACE: UNLOCKED ACTIVE BANNER */}
            {activeTab === "private" && isPrivateUnlocked && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#202124] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white shadow-md">
                    <LockOpenOutlinedIcon />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      Private Space
                    </h2>
                    <p className="text-xs text-neutral-400">
                      These notes are completely isolated from your public workspace and encrypted with your 4-digit PIN.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setPinModalMode("setup");
                      setPinModalOpen(true);
                    }}
                    sx={{
                      borderColor: "#333333",
                      color: "#ffffff",
                      "&:hover": { borderColor: "#666666", backgroundColor: "#18181b" },
                      fontSize: "12px",
                      textTransform: "none",
                    }}
                  >
                    Change PIN
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleLockPrivateSpace}
                    startIcon={<LockOutlinedIcon fontSize="small" />}
                    sx={{
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontWeight: 600,
                      "&:hover": { backgroundColor: "#d4d4d8" },
                      fontSize: "12px",
                      textTransform: "none",
                    }}
                  >
                    Lock Space
                  </Button>
                </div>
              </div>
            )}

            {/* Note Creator Bar (Visible in Notes, or in Private Space only when unlocked) */}
            {(activeTab === "notes" || (activeTab === "private" && isPrivateUnlocked)) && !selectedLabel && (
              <NoteCreator onSave={handleCreateNote} />
            )}

            {/* Active Label Banner */}
            {selectedLabel && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#202124] shadow-md">
                <div className="flex items-center gap-2 text-sm text-white">
                  <LabelOutlinedIcon fontSize="small" />
                  <span>Filtered by tag:</span>
                  <span className="font-mono text-white font-medium">#{selectedLabel}</span>
                </div>
                <Button
                  size="small"
                  onClick={() => setSelectedLabel(null)}
                  sx={{ color: "#a1a1aa", fontSize: "11px", textTransform: "none" }}
                >
                  Clear filter
                </Button>
              </div>
            )}

            {/* Trash Controls Banner */}
            {activeTab === "trash" && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#202124] shadow-md gap-3">
                <div className="text-xs text-neutral-300">
                  <span className="font-semibold text-white">Trash Bin:</span> Notes in trash can be restored or permanently removed.
                </div>
                {notes.filter((n) => n.isTrashed).length > 0 && (
                  <Button
                    onClick={handleEmptyTrash}
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteForeverIcon fontSize="small" />}
                    sx={{ textTransform: "none", fontSize: "12px", borderRadius: "8px" }}
                  >
                    Empty Trash
                  </Button>
                )}
              </div>
            )}

            {/* Loading Indicator */}
            {(loadingNotes || loadingPrivateNotes) && (
              <div className="flex items-center justify-center py-12">
                <CircularProgress size={32} sx={{ color: "#ffffff" }} />
              </div>
            )}

            {/* MAIN CANVAS: PINNED & OTHERS SECTIONS */}
            {(activeTab === "notes" || (activeTab === "private" && isPrivateUnlocked)) && (
              <div className="space-y-8">
                {/* Pinned Section */}
                {pinnedNotes.length > 0 && (
                  <div className="space-y-3">
                    <Typography
                      variant="body2"
                      className="font-semibold text-neutral-400 uppercase tracking-wider text-xs pl-1"
                    >
                      Pinned
                    </Typography>
                    <div
                      className={
                        isGridView
                          ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 items-start"
                          : "flex flex-col gap-3 max-w-2xl mx-auto w-full"
                      }
                    >
                      {pinnedNotes.map((note) => (
                        <NoteCard
                          key={note._id}
                          note={note}
                          viewMode={isGridView ? "grid" : "list"}
                          onEdit={setEditingNote}
                          onTogglePin={handleTogglePin}
                          onChangeColor={handleChangeColor}
                          onToggleArchive={handleToggleArchive}
                          onMoveToTrash={handleMoveToTrash}
                          onRestoreFromTrash={handleRestoreFromTrash}
                          onDeletePermanently={handleDeletePermanently}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Others Section */}
                {otherNotes.length > 0 && (
                  <div className="space-y-3">
                    {pinnedNotes.length > 0 && (
                      <Typography
                        variant="body2"
                        className="font-semibold text-neutral-400 uppercase tracking-wider text-xs pl-1"
                      >
                        Others
                      </Typography>
                    )}
                    <div
                      className={
                        isGridView
                          ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 items-start"
                          : "flex flex-col gap-3 max-w-2xl mx-auto w-full"
                      }
                    >
                      {otherNotes.map((note) => (
                        <NoteCard
                          key={note._id}
                          note={note}
                          viewMode={isGridView ? "grid" : "list"}
                          onEdit={setEditingNote}
                          onTogglePin={handleTogglePin}
                          onChangeColor={handleChangeColor}
                          onToggleArchive={handleToggleArchive}
                          onMoveToTrash={handleMoveToTrash}
                          onRestoreFromTrash={handleRestoreFromTrash}
                          onDeletePermanently={handleDeletePermanently}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {pinnedNotes.length === 0 && otherNotes.length === 0 && !loadingNotes && !loadingPrivateNotes && (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-[#212121] flex items-center justify-center text-neutral-400">
                      {activeTab === "private" ? (
                        <LockOutlinedIcon sx={{ fontSize: 32 }} className="text-white" />
                      ) : (
                        <LightbulbOutlinedIcon sx={{ fontSize: 32 }} />
                      )}
                    </div>
                    <Typography variant="h6" className="text-sm font-semibold text-white">
                      {activeTab === "private" ? "No private notes yet" : "No notes yet"}
                    </Typography>
                    <Typography variant="body2" className="text-xs text-neutral-400 max-w-sm mx-auto">
                      {activeTab === "private"
                        ? "Notes added here are secured behind your 4-digit PIN and completely isolated."
                        : "Notes you add in the creator box above will appear here in your public workspace."}
                    </Typography>
                  </div>
                )}
              </div>
            )}

            {/* ARCHIVE VIEW */}
            {activeTab === "archive" && (
              <div className="space-y-4">
                <Typography variant="subtitle1" className="font-semibold text-white pl-1">
                  Archived Notes
                </Typography>

                {filteredNotes.length > 0 ? (
                  <div
                    className={
                      isGridView
                        ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 items-start"
                        : "flex flex-col gap-3 max-w-2xl mx-auto w-full"
                    }
                  >
                    {filteredNotes.map((note) => (
                      <NoteCard
                        key={note._id}
                        note={note}
                        viewMode={isGridView ? "grid" : "list"}
                        onEdit={setEditingNote}
                        onTogglePin={handleTogglePin}
                        onChangeColor={handleChangeColor}
                        onToggleArchive={handleToggleArchive}
                        onMoveToTrash={handleMoveToTrash}
                        onRestoreFromTrash={handleRestoreFromTrash}
                        onDeletePermanently={handleDeletePermanently}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-[#212121] flex items-center justify-center text-neutral-400">
                      <ArchiveOutlinedIcon sx={{ fontSize: 32 }} />
                    </div>
                    <Typography variant="h6" className="text-sm font-semibold text-white">
                      No archived notes
                    </Typography>
                    <Typography variant="body2" className="text-xs text-neutral-400">
                      Notes you archive will appear here safely out of view.
                    </Typography>
                  </div>
                )}
              </div>
            )}

            {/* TRASH VIEW */}
            {activeTab === "trash" && (
              <div className="space-y-4">
                <Typography variant="subtitle1" className="font-semibold text-white pl-1">
                  Trash
                </Typography>

                {filteredNotes.length > 0 ? (
                  <div
                    className={
                      isGridView
                        ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 items-start"
                        : "flex flex-col gap-3 max-w-2xl mx-auto w-full"
                    }
                  >
                    {filteredNotes.map((note) => (
                      <NoteCard
                        key={note._id}
                        note={note}
                        isTrashView={true}
                        viewMode={isGridView ? "grid" : "list"}
                        onEdit={() => {}}
                        onTogglePin={handleTogglePin}
                        onChangeColor={handleChangeColor}
                        onToggleArchive={handleToggleArchive}
                        onMoveToTrash={handleMoveToTrash}
                        onRestoreFromTrash={handleRestoreFromTrash}
                        onDeletePermanently={handleDeletePermanently}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-[#212121] flex items-center justify-center text-neutral-400">
                      <DeleteOutlinedIcon sx={{ fontSize: 32 }} />
                    </div>
                    <Typography variant="h6" className="text-sm font-semibold text-white">
                      Trash is empty
                    </Typography>
                    <Typography variant="body2" className="text-xs text-neutral-400">
                      Deleted notes are placed here before permanent removal.
                    </Typography>
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS VIEW */}
            {activeTab === "settings" && (
              <SettingsView onBack={() => setActiveTab("notes")} />
            )}
          </div>
        </main>
      </div>
    </div>

      {/* Note Edit Modal */}
      <NoteModal
        note={editingNote}
        open={Boolean(editingNote)}
        onClose={() => setEditingNote(null)}
        onUpdate={handleUpdateNote}
        onMoveToTrash={handleMoveToTrash}
      />

      {/* PIN Keypad Modal */}
      <PinModal
        open={pinModalOpen}
        mode={pinModalMode}
        onClose={() => setPinModalOpen(false)}
        onSuccess={async () => {
          await checkPrivateStatus();
          setActiveTab("private");
          fetchPrivateNotes();
        }}
      />

      {/* Dedicated Search Screen (Opens on Search Icon Click, Real-time Results) */}
      <SearchScreen
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        notes={notes}
        privateNotes={privateNotes}
        isPrivateUnlocked={isPrivateUnlocked}
        isGridView={isGridView}
        setIsGridView={setIsGridView}
        onEdit={setEditingNote}
        onTogglePin={handleTogglePin}
        onChangeColor={handleChangeColor}
        onToggleArchive={handleToggleArchive}
        onMoveToTrash={handleMoveToTrash}
        onRestoreFromTrash={handleRestoreFromTrash}
        onDeletePermanently={handleDeletePermanently}
        allLabels={allLabels}
      />
    </Box>
  );
}

