"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ViewStream as ViewStreamIcon,
  GridView as GridViewIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  LightbulbOutlined as LightbulbOutlinedIcon,
  LockOutlined as LockOutlinedIcon,
  ArchiveOutlined as ArchiveOutlinedIcon,
  DeleteOutlined as DeleteOutlinedIcon,
  Logout as LogoutIcon,
  SecurityOutlined as SecurityOutlinedIcon,
  LabelOutlined as LabelOutlinedIcon,
  DeleteForever as DeleteForeverIcon,
  RestoreFromTrash as RestoreFromTrashIcon,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import NoteCreator, { CreateNotePayload } from "@/components/notes/NoteCreator";
import NoteCard, { NoteItem } from "@/components/notes/NoteCard";
import NoteModal from "@/components/notes/NoteModal";

type NavItem = "notes" | "private" | "archive" | "trash" | "settings";

// Starter notes for guest demonstration
const DEMO_STARTER_NOTES: NoteItem[] = [
  {
    _id: "demo-1",
    userId: "guest",
    title: "Welcome to Beginning 🚀",
    content: "Beginning is a Google Keep-inspired productivity suite designed with high security. It features a public notes workspace, dark slate aesthetics, and an isolated 4-digit PIN Private Space.",
    color: "#1E293B",
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    isPrivate: false,
    labels: ["welcome", "guide"],
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "demo-2",
    userId: "guest",
    title: "Color Themes & Labels 🎨",
    content: "Try changing note colors using the palette icon on hover! You can also organize your thoughts by appending custom label tags like #project, #work, or #ideas.",
    color: "#162E46", // Deep Ocean
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    isPrivate: false,
    labels: ["features", "design"],
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "demo-3",
    userId: "guest",
    title: "Secure Private Space 🔒",
    content: "Private notes are strictly isolated on the backend. When locked, they cannot be seen by anyone without the 4-digit PIN session token. Forgotten your PIN? Request a single-use reset token via Nodemailer!",
    color: "#381E24", // Coral Wine
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    isPrivate: false,
    labels: ["security", "phase4"],
    updatedAt: new Date().toISOString(),
  },
];

export default function HomePage() {
  const { user, loading: authLoading, openAuthModal, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavItem>("notes");
  const [isGridView, setIsGridView] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  // Notes state
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loadingNotes, setLoadingNotes] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  // Fetch public workspace notes from API (or load demo notes for guests)
  const fetchNotes = useCallback(async () => {
    if (!user) {
      // Load from localStorage or fallback to demo
      const savedLocal = localStorage.getItem("beginning_guest_notes");
      if (savedLocal) {
        try {
          setNotes(JSON.parse(savedLocal));
        } catch {
          setNotes(DEMO_STARTER_NOTES);
        }
      } else {
        setNotes(DEMO_STARTER_NOTES);
      }
      return;
    }

    setLoadingNotes(true);
    try {
      const res = await fetch("/api/notes?filter=all");
      if (res.ok) {
        const data = await res.json();
        if (data.notes) {
          setNotes(data.notes);
        }
      }
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Persist guest notes to localStorage
  const saveGuestNotes = (updated: NoteItem[]) => {
    setNotes(updated);
    if (!user) {
      localStorage.setItem("beginning_guest_notes", JSON.stringify(updated));
    }
  };

  // Create Note
  const handleCreateNote = async (payload: CreateNotePayload) => {
    if (!user) {
      const newNote: NoteItem = {
        _id: `guest-${Date.now()}`,
        userId: "guest",
        ...payload,
        isTrashed: false,
        isPrivate: false,
        updatedAt: new Date().toISOString(),
      };
      saveGuestNotes([newNote, ...notes]);
      return;
    }

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          setNotes((prev) => [data.note, ...prev]);
        }
      }
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  // Update Note
  const handleUpdateNote = async (updatedFields: Partial<NoteItem> & { _id: string }) => {
    if (!user) {
      const updated = notes.map((n) =>
        n._id === updatedFields._id
          ? { ...n, ...updatedFields, updatedAt: new Date().toISOString() }
          : n
      );
      saveGuestNotes(updated);
      return;
    }

    try {
      const res = await fetch(`/api/notes/${updatedFields._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          setNotes((prev) =>
            prev.map((n) => (n._id === data.note._id ? data.note : n))
          );
        }
      }
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  // Toggle Pin
  const handleTogglePin = (note: NoteItem) => {
    handleUpdateNote({ _id: note._id, isPinned: !note.isPinned });
  };

  // Change Color
  const handleChangeColor = (note: NoteItem, newColor: string) => {
    handleUpdateNote({ _id: note._id, color: newColor });
  };

  // Toggle Archive
  const handleToggleArchive = (note: NoteItem) => {
    handleUpdateNote({
      _id: note._id,
      isArchived: !note.isArchived,
      isPinned: false, // Unpin when archiving
    });
  };

  // Move to Trash
  const handleMoveToTrash = (note: NoteItem) => {
    handleUpdateNote({
      _id: note._id,
      isTrashed: true,
      isPinned: false,
    });
  };

  // Restore from Trash
  const handleRestoreFromTrash = (note: NoteItem) => {
    handleUpdateNote({
      _id: note._id,
      isTrashed: false,
    });
  };

  // Delete Permanently
  const handleDeletePermanently = async (note: NoteItem) => {
    if (!user) {
      const updated = notes.filter((n) => n._id !== note._id);
      saveGuestNotes(updated);
      return;
    }

    try {
      const res = await fetch(`/api/notes/${note._id}?permanent=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n._id !== note._id));
      }
    } catch (error) {
      console.error("Failed to delete note permanently:", error);
    }
  };

  // Empty all Trash
  const handleEmptyTrash = async () => {
    const trashedNotes = notes.filter((n) => n.isTrashed);
    for (const tn of trashedNotes) {
      await handleDeletePermanently(tn);
    }
  };

  // Handle Navigation Item Click
  const handleNavClick = (id: NavItem) => {
    setSelectedLabel(null);
    if (id === "private" && !user) {
      openAuthModal("login");
      return;
    }
    setActiveTab(id);
  };

  // Filter notes based on activeTab, search query, and label filter
  const filteredNotes = useMemo(() => {
    let result = notes;

    // View tab filtering
    if (activeTab === "trash") {
      result = result.filter((n) => n.isTrashed);
    } else if (activeTab === "archive") {
      result = result.filter((n) => n.isArchived && !n.isTrashed);
    } else {
      // "notes" tab or default
      result = result.filter((n) => !n.isArchived && !n.isTrashed);
    }

    // Label filtering
    if (selectedLabel) {
      result = result.filter((n) => n.labels?.includes(selectedLabel));
    }

    // Search query filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q) ||
          n.labels?.some((lbl) => lbl.toLowerCase().includes(q))
      );
    }

    return result;
  }, [notes, activeTab, selectedLabel, searchQuery]);

  // Split into Pinned & Others for Google Keep layout
  const pinnedNotes = useMemo(
    () => filteredNotes.filter((n) => n.isPinned),
    [filteredNotes]
  );
  const otherNotes = useMemo(
    () => filteredNotes.filter((n) => !n.isPinned),
    [filteredNotes]
  );

  // Extract all unique labels
  const allLabels = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      n.labels?.forEach((l) => set.add(l));
    });
    return Array.from(set);
  }, [notes]);

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
      icon: <LockOutlinedIcon fontSize="small" />,
      badge: user?.hasPin ? "Active" : "PIN Req",
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
    {
      id: "settings" as NavItem,
      label: "Settings",
      icon: <SettingsOutlinedIcon fontSize="small" />,
    },
  ];

  return (
    <Box className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col selection:bg-sky-500/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 h-16 border-b border-[#334155] bg-[#0F172A]/90 backdrop-blur-md px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
            size="medium"
            aria-label="Toggle navigation menu"
          >
            <MenuIcon />
          </IconButton>

          <div
            onClick={() => setActiveTab("notes")}
            className="flex items-center gap-2 select-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <LightbulbOutlinedIcon className="text-white" fontSize="small" />
            </div>
            <div>
              <Typography
                variant="h6"
                className="font-semibold tracking-tight text-white flex items-center gap-1.5 text-base sm:text-lg"
              >
                Beginning
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1E293B] text-sky-400 border border-[#334155] font-normal">
                  v1.0
                </span>
              </Typography>
            </div>
          </div>
        </div>

        {/* Google Keep Search Bar */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div className="flex items-center w-full bg-[#1E293B] border border-[#334155] hover:border-slate-500 focus-within:border-sky-500 rounded-xl px-3 py-1.5 transition-all shadow-inner">
            <SearchIcon className="text-[#94A3B8] mr-2" fontSize="small" />
            <InputBase
              placeholder="Search notes, content, or #labels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm text-[#F8FAFC] placeholder-[#94A3B8]"
              inputProps={{ "aria-label": "search notes" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-[#94A3B8] hover:text-white px-1.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Action Controls & Authentication Profile */}
        <div className="flex items-center gap-1 sm:gap-3">
          <Tooltip title="Refresh Notes">
            <IconButton
              onClick={fetchNotes}
              className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
              size="small"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isGridView ? "List view" : "Grid view"}>
            <IconButton
              onClick={() => setIsGridView(!isGridView)}
              className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
              size="small"
            >
              {isGridView ? <ViewStreamIcon fontSize="small" /> : <GridViewIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* User Authentication Trigger */}
          {authLoading ? (
            <div className="w-8 h-8 rounded-full bg-[#1E293B] animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#334155]">
              <Tooltip title={`Signed in as ${user.email}`}>
                <div className="flex items-center gap-2 cursor-pointer bg-[#1E293B] hover:bg-[#334155] border border-[#334155] px-2.5 py-1 rounded-full transition-all">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-[#F8FAFC] hidden sm:inline max-w-[120px] truncate">
                    {user.email.split("@")[0]}
                  </span>
                </div>
              </Tooltip>

              <Tooltip title="Sign Out">
                <IconButton
                  onClick={logout}
                  size="small"
                  className="text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10"
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2">
              <Button
                onClick={() => openAuthModal("login")}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "#334155",
                  color: "#F8FAFC",
                  "&:hover": { borderColor: "#64748B", backgroundColor: "#1E293B" },
                  fontSize: "12px",
                  padding: "4px 12px",
                }}
              >
                Sign In
              </Button>
              <Button
                onClick={() => openAuthModal("register")}
                size="small"
                variant="contained"
                sx={{
                  backgroundColor: "#38BDF8",
                  color: "#0F172A",
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "#0284C7" },
                  fontSize: "12px",
                  padding: "4px 12px",
                }}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`transition-all duration-300 border-r border-[#334155] bg-[#0F172A] flex flex-col justify-between py-4 ${
            sidebarOpen ? "w-64 px-3" : "w-16 px-2"
          }`}
        >
          <div className="space-y-6">
            {/* Primary Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id && !selectedLabel;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#1E293B] text-sky-400 border border-[#334155] shadow-sm"
                        : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50"
                    }`}
                  >
                    <span className={isActive ? "text-sky-400" : "text-[#94A3B8]"}>
                      {item.icon}
                    </span>
                    {sidebarOpen && (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                            {item.badge}
                          </span>
                        )}
                        {item.count !== undefined && item.count > 0 && (
                          <span className="text-xs text-[#64748B] font-mono font-medium">
                            {item.count}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Labels Navigation (if any exist) */}
            {sidebarOpen && allLabels.length > 0 && (
              <div className="pt-3 border-t border-[#334155]/60 space-y-1">
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Labels
                </div>
                {allLabels.map((lbl) => {
                  const isLabelActive = selectedLabel === lbl;
                  return (
                    <button
                      key={lbl}
                      onClick={() => {
                        setSelectedLabel(isLabelActive ? null : lbl);
                        setActiveTab("notes");
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isLabelActive
                          ? "bg-[#1E293B] text-sky-400 border border-[#334155]"
                          : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/40"
                      }`}
                    >
                      <LabelOutlinedIcon fontSize="small" />
                      <span className="truncate">#{lbl}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          {sidebarOpen && (
            <div className="p-3 rounded-xl bg-[#1E293B]/50 border border-[#334155] text-xs text-[#94A3B8] space-y-1">
              <div className="flex items-center gap-1.5 text-[#F8FAFC] font-medium">
                <SecurityOutlinedIcon fontSize="inherit" className="text-sky-400" />
                <span>Beginning Workspace</span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                {user ? (
                  <>Public notes synced with MongoDB.</>
                ) : (
                  <>Guest demo mode. Sign up to save notes online.</>
                )}
              </p>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Note Creator Bar (Only visible in Notes view) */}
            {activeTab === "notes" && !selectedLabel && (
              <NoteCreator onSave={handleCreateNote} />
            )}

            {/* Active Label Banner */}
            {selectedLabel && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B] border border-[#334155]">
                <div className="flex items-center gap-2 text-sm text-white">
                  <LabelOutlinedIcon className="text-sky-400" fontSize="small" />
                  <span>Filtered by tag:</span>
                  <span className="font-mono text-sky-400">#{selectedLabel}</span>
                </div>
                <Button
                  size="small"
                  onClick={() => setSelectedLabel(null)}
                  sx={{ color: "#94A3B8", fontSize: "11px", textTransform: "none" }}
                >
                  Clear filter
                </Button>
              </div>
            )}

            {/* Trash Controls Banner */}
            {activeTab === "trash" && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-red-950/20 border border-red-900/30 gap-3">
                <div className="text-xs text-red-300">
                  <span className="font-semibold text-red-200">Trash Bin:</span> Notes in trash can be restored or permanently removed.
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
            {loadingNotes && (
              <div className="flex items-center justify-center py-12">
                <CircularProgress size={32} sx={{ color: "#38BDF8" }} />
              </div>
            )}

            {/* NOTES VIEW: PINNED & OTHERS SECTIONS */}
            {activeTab === "notes" && (
              <div className="space-y-8">
                {/* Pinned Section */}
                {pinnedNotes.length > 0 && (
                  <div className="space-y-3">
                    <Typography
                      variant="body2"
                      className="font-semibold text-[#94A3B8] uppercase tracking-wider text-xs pl-1"
                    >
                      Pinned
                    </Typography>
                    <div
                      className={`grid gap-4 ${
                        isGridView
                          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                          : "grid-cols-1 max-w-2xl mx-auto"
                      }`}
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
                        className="font-semibold text-[#94A3B8] uppercase tracking-wider text-xs pl-1"
                      >
                        Others
                      </Typography>
                    )}
                    <div
                      className={`grid gap-4 ${
                        isGridView
                          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                          : "grid-cols-1 max-w-2xl mx-auto"
                      }`}
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

                {/* Empty Notes State */}
                {pinnedNotes.length === 0 && otherNotes.length === 0 && !loadingNotes && (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#94A3B8]">
                      <LightbulbOutlinedIcon sx={{ fontSize: 32 }} />
                    </div>
                    <Typography variant="h6" className="text-sm font-semibold text-white">
                      No notes yet
                    </Typography>
                    <Typography variant="body2" className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                      Notes you add in the creator box above will appear here in your public workspace.
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
                    className={`grid gap-4 ${
                      isGridView
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        : "grid-cols-1 max-w-2xl mx-auto"
                    }`}
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
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#94A3B8]">
                      <ArchiveOutlinedIcon sx={{ fontSize: 32 }} />
                    </div>
                    <Typography variant="h6" className="text-sm font-semibold text-white">
                      No archived notes
                    </Typography>
                    <Typography variant="body2" className="text-xs text-[#94A3B8]">
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
                    className={`grid gap-4 ${
                      isGridView
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        : "grid-cols-1 max-w-2xl mx-auto"
                    }`}
                  >
                    {filteredNotes.map((note) => (
                      <NoteCard
                        key={note._id}
                        note={note}
                        isTrashView={true}
                        viewMode={isGridView ? "grid" : "list"}
                        onEdit={() => {}} // Disabled edit in trash
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
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#94A3B8]">
                      <DeleteOutlinedIcon sx={{ fontSize: 32 }} />
                    </div>
                    <Typography variant="h6" className="text-sm font-semibold text-white">
                      Trash is empty
                    </Typography>
                    <Typography variant="body2" className="text-xs text-[#94A3B8]">
                      Deleted notes are placed here before permanent removal.
                    </Typography>
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS PREVIEW VIEW */}
            {activeTab === "settings" && (
              <div className="p-6 rounded-2xl bg-[#1E293B] border border-[#334155] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <SettingsOutlinedIcon />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Settings &amp; Account</h2>
                    <p className="text-xs text-[#94A3B8]">Manage account profile, password, and 4-digit PIN</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#334155] space-y-3 text-xs text-[#94A3B8]">
                  <p>
                    {user ? (
                      <>Account: <span className="font-mono text-white">{user.email}</span> (Verified)</>
                    ) : (
                      <>Guest Mode: Sign in to sync notes and enable private space.</>
                    )}
                  </p>
                  <p className="text-sky-400 font-medium">
                    Comprehensive Settings page with password change forms, PIN reset triggers, and PWA controls is scheduled for Phase 5.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Note Edit Modal */}
      <NoteModal
        note={editingNote}
        open={Boolean(editingNote)}
        onClose={() => setEditingNote(null)}
        onUpdate={handleUpdateNote}
        onMoveToTrash={handleMoveToTrash}
      />
    </Box>
  );
}
