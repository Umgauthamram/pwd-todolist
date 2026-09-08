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
  LockOpenOutlined as LockOpenOutlinedIcon,
  ArchiveOutlined as ArchiveOutlinedIcon,
  DeleteOutlined as DeleteOutlinedIcon,
  Logout as LogoutIcon,
  SecurityOutlined as SecurityOutlinedIcon,
  LabelOutlined as LabelOutlinedIcon,
  DeleteForever as DeleteForeverIcon,
  RestoreFromTrash as RestoreFromTrashIcon,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import AuthScreen from "@/components/auth/AuthScreen";
import NoteCreator, { CreateNotePayload } from "@/components/notes/NoteCreator";
import NoteCard, { NoteItem } from "@/components/notes/NoteCard";
import NoteModal from "@/components/notes/NoteModal";
import PinModal, { PinModalMode } from "@/components/private-space/PinModal";
import SettingsView from "@/components/settings/SettingsView";

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
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

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

  // Fetch public workspace notes
  const fetchPublicNotes = useCallback(async () => {
    if (!user) return;

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
      console.error("Failed to load public notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  }, [user]);

  // Fetch private workspace notes (gated by PIN session)
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
        }
      } else if (res.status === 403) {
        setIsPrivateUnlocked(false);
      }
    } catch (error) {
      console.error("Failed to load private notes:", error);
    } finally {
      setLoadingPrivateNotes(false);
    }
  }, [user, isPrivateUnlocked, setIsPrivateUnlocked]);

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

  // Nav Item Click with Private Space Gating
  const handleNavClick = (id: NavItem) => {
    setSelectedLabel(null);

    if (id === "private") {
      if (!user?.hasPin) {
        setPinModalMode("setup");
        setPinModalOpen(true);
        return;
      }

      if (!isPrivateUnlocked) {
        setPinModalMode("enter");
        setPinModalOpen(true);
        return;
      }

      setActiveTab("private");
      return;
    }

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
  }, [currentDataset, activeTab, selectedLabel, searchQuery]);

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
    {
      id: "settings" as NavItem,
      label: "Settings",
      icon: <SettingsOutlinedIcon fontSize="small" />,
    },
  ];

  return (
    <Box className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 h-16 border-b border-[#262626] bg-black/95 backdrop-blur-md px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-neutral-400 hover:text-white hover:bg-neutral-900"
            size="medium"
            aria-label="Toggle navigation menu"
          >
            <MenuIcon />
          </IconButton>

          {/* REQUIREMENT 2: REMOVE THE LOGO, V1.0 */}
          <div
            onClick={() => setActiveTab("notes")}
            className="select-none cursor-pointer"
          >
            <span className="text-xl font-bold tracking-tight text-white">
              Beginning
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div className="flex items-center w-full bg-[#0e0e10] border border-[#262626] hover:border-neutral-500 focus-within:border-white rounded-xl px-3 py-1.5 transition-all">
            <SearchIcon className="text-neutral-400 mr-2" fontSize="small" />
            <InputBase
              placeholder={
                activeTab === "private"
                  ? "Search private notes..."
                  : "Search notes, content, or #labels..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm text-white placeholder-neutral-500"
              inputProps={{ "aria-label": "search notes" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-neutral-400 hover:text-white px-1.5"
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
              onClick={() => {
                if (activeTab === "private") fetchPrivateNotes();
                else fetchPublicNotes();
              }}
              className="text-neutral-400 hover:text-white hover:bg-neutral-900"
              size="small"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isGridView ? "List view" : "Grid view"}>
            <IconButton
              onClick={() => setIsGridView(!isGridView)}
              className="text-neutral-400 hover:text-white hover:bg-neutral-900"
              size="small"
            >
              {isGridView ? <ViewStreamIcon fontSize="small" /> : <GridViewIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#262626]">
            <Tooltip title={`Signed in as ${user.email}`}>
              <div
                onClick={() => setActiveTab("settings")}
                className="flex items-center gap-2 cursor-pointer bg-[#0e0e10] hover:bg-neutral-900 border border-[#262626] px-2.5 py-1 rounded-full transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-white hidden sm:inline max-w-[120px] truncate">
                  {user.email.split("@")[0]}
                </span>
              </div>
            </Tooltip>

            <Tooltip title="Sign Out">
              <IconButton
                onClick={logout}
                size="small"
                className="text-neutral-400 hover:text-white hover:bg-neutral-900"
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`transition-all duration-300 border-r border-[#262626] bg-black flex flex-col justify-between py-4 ${
            sidebarOpen ? "w-64 px-3" : "w-16 px-2"
          }`}
        >
          <div className="space-y-6">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id && !selectedLabel;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                    }`}
                  >
                    <span className={isActive ? "text-black" : "text-neutral-400"}>
                      {item.icon}
                    </span>
                    {sidebarOpen && (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="truncate">{item.label}</span>
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
                              isActive ? "text-neutral-700" : "text-neutral-500"
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Labels Navigation */}
            {sidebarOpen && allLabels.length > 0 && (
              <div className="pt-3 border-t border-[#262626] space-y-1">
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Labels
                </div>
                {allLabels.map((lbl) => {
                  const isLabelActive = selectedLabel === lbl;
                  return (
                    <button
                      key={lbl}
                      onClick={() => setSelectedLabel(isLabelActive ? null : lbl)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isLabelActive
                          ? "bg-white text-black font-semibold"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-900"
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
            <div className="p-3 rounded-xl bg-[#0e0e10] border border-[#262626] text-xs text-neutral-400 space-y-1">
              <div className="flex items-center gap-1.5 text-white font-medium">
                <SecurityOutlinedIcon fontSize="inherit" />
                <span>Beginning Space</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                {user?.hasPin
                  ? isPrivateUnlocked
                    ? "Private space is currently unlocked."
                    : "Private notes are locked behind PIN."
                  : "Private space PIN is ready for configuration."}
              </p>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* PRIVATE SPACE ACTIVE BANNER */}
            {activeTab === "private" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0e10] border border-[#262626] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white shadow-md">
                    <LockOpenOutlinedIcon />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      Private Space
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-700 font-normal">
                        PIN Verified
                      </span>
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

            {/* Note Creator Bar (Visible in Notes or Private views) */}
            {(activeTab === "notes" || activeTab === "private") && !selectedLabel && (
              <NoteCreator onSave={handleCreateNote} />
            )}

            {/* Active Label Banner */}
            {selectedLabel && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e0e10] border border-[#262626]">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#0e0e10] border border-[#262626] gap-3">
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

            {/* MAIN CANVAS: PINNED & OTHERS SECTIONS (Shared between Notes & Private Space) */}
            {(activeTab === "notes" || activeTab === "private") && (
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
                        className="font-semibold text-neutral-400 uppercase tracking-wider text-xs pl-1"
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

                {/* Empty State */}
                {pinnedNotes.length === 0 && otherNotes.length === 0 && !loadingNotes && !loadingPrivateNotes && (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-[#0e0e10] border border-[#262626] flex items-center justify-center text-neutral-400">
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
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-[#0e0e10] border border-[#262626] flex items-center justify-center text-neutral-400">
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
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-[#0e0e10] border border-[#262626] flex items-center justify-center text-neutral-400">
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
            {activeTab === "settings" && <SettingsView />}
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
    </Box>
  );
}
