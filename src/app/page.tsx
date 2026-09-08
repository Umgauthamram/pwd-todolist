"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
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
  CheckBoxOutlined as CheckBoxOutlinedIcon,
  BrushOutlined as BrushOutlinedIcon,
  ImageOutlined as ImageOutlinedIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  CheckCircle as CheckCircleIcon,
  Storage as StorageIcon,
  EmailOutlined as EmailOutlinedIcon,
  SecurityOutlined as SecurityOutlinedIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";

type NavItem = "notes" | "private" | "archive" | "trash" | "settings";

export default function HomePage() {
  const { user, loading, openAuthModal, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavItem>("notes");
  const [isGridView, setIsGridView] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleNavClick = (id: NavItem) => {
    if (id === "private" && !user) {
      openAuthModal("login");
      return;
    }
    setActiveTab(id);
  };

  const navItems = [
    { id: "notes" as NavItem, label: "Notes", icon: <LightbulbOutlinedIcon fontSize="small" /> },
    {
      id: "private" as NavItem,
      label: "Private Space",
      icon: <LockOutlinedIcon fontSize="small" />,
      badge: user?.hasPin ? "PIN Active" : "PIN Required",
    },
    { id: "archive" as NavItem, label: "Archive", icon: <ArchiveOutlinedIcon fontSize="small" /> },
    { id: "trash" as NavItem, label: "Trash", icon: <DeleteOutlinedIcon fontSize="small" /> },
    { id: "settings" as NavItem, label: "Settings", icon: <SettingsOutlinedIcon fontSize="small" /> },
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

          <div className="flex items-center gap-2 select-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <LightbulbOutlinedIcon className="text-white" fontSize="small" />
            </div>
            <div>
              <Typography variant="h6" className="font-semibold tracking-tight text-white flex items-center gap-1.5 text-base sm:text-lg">
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
          <div className="flex items-center w-full bg-[#1E293B] border border-[#334155] hover:border-slate-500 focus-within:border-sky-500 focus-within:bg-[#1E293B] rounded-xl px-3 py-1.5 transition-all shadow-inner">
            <SearchIcon className="text-[#94A3B8] mr-2" fontSize="small" />
            <InputBase
              placeholder="Search notes, labels, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm text-[#F8FAFC] placeholder-[#94A3B8]"
              inputProps={{ "aria-label": "search notes" }}
            />
          </div>
        </div>

        {/* Action Controls & Authentication Profile */}
        <div className="flex items-center gap-1 sm:gap-3">
          <Tooltip title="Refresh">
            <IconButton
              onClick={() => window.location.reload()}
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

          <Tooltip title="Settings">
            <IconButton
              onClick={() => setActiveTab("settings")}
              className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
              size="small"
            >
              <SettingsOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* User Authentication Trigger */}
          {loading ? (
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
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
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
                  <span className={`${isActive ? "text-sky-400" : "text-[#94A3B8]"}`}>
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
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <div className="p-3 rounded-xl bg-[#1E293B]/50 border border-[#334155] text-xs text-[#94A3B8] space-y-1">
              <div className="flex items-center gap-1.5 text-[#F8FAFC] font-medium">
                <SecurityOutlinedIcon fontSize="inherit" className="text-sky-400" />
                <span>Beginning Security</span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                {user ? (
                  <>Authenticated as <span className="text-sky-400 font-mono">{user.email}</span></>
                ) : (
                  <>Guest session. Sign in to enable Private Space isolation.</>
                )}
              </p>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Note Creator Bar (Google Keep Style) */}
            <div className="w-full max-w-2xl mx-auto">
              <div className="bg-[#1E293B] border border-[#334155] hover:border-slate-500 focus-within:border-sky-500 rounded-2xl p-3 shadow-xl transition-all flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Take a note..."
                  className="w-full bg-transparent text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none px-2 font-medium"
                />
                <div className="flex items-center gap-1 text-[#94A3B8]">
                  <Tooltip title="New list">
                    <IconButton size="small" className="text-[#94A3B8] hover:text-white">
                      <CheckBoxOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="New note with drawing">
                    <IconButton size="small" className="text-[#94A3B8] hover:text-white">
                      <BrushOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="New note with image">
                    <IconButton size="small" className="text-[#94A3B8] hover:text-white">
                      <ImageOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* PHASE 2: Live Authentication & Nodemailer Showcase Card */}
            <div className="p-5 rounded-2xl bg-[#1E293B] border border-[#334155] shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#334155] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <EmailOutlinedIcon fontSize="small" />
                  </div>
                  <div>
                    <Typography variant="subtitle1" className="font-semibold text-white">
                      Phase 2: Authentication &amp; Nodemailer Pipeline
                    </Typography>
                    <Typography variant="body2" className="text-xs text-[#94A3B8]">
                      Mongoose User Model • 6-Digit OTP Emailing • Bcrypt Hash • JWT HttpOnly Cookies
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Chip
                    label={user ? "Session Active" : "Unauthenticated"}
                    size="small"
                    className={
                      user
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-700/50 text-[#94A3B8] border border-[#334155]"
                    }
                  />
                  <Chip
                    label="Phase 2 Ready"
                    size="small"
                    className="bg-sky-500/10 text-sky-400 border border-sky-500/30"
                  />
                </div>
              </div>

              {/* Live Session Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                  <span className="text-[#94A3B8]">Current User:</span>
                  <p className="text-[#F8FAFC] font-mono font-medium truncate">
                    {user ? user.email : "Not logged in"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                  <span className="text-[#94A3B8]">Verification Status:</span>
                  <p className="text-emerald-400 font-medium flex items-center gap-1">
                    {user ? (
                      <>
                        <CheckCircleIcon fontSize="inherit" /> Verified User
                      </>
                    ) : (
                      <span className="text-[#94A3B8]">Awaiting Auth</span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                  <span className="text-[#94A3B8]">Private Space PIN:</span>
                  <p className="text-amber-400 font-medium">
                    {user?.hasPin ? "Configured" : "Not Set (Phase 4)"}
                  </p>
                </div>
              </div>

              {/* Interactive Auth Action Triggers */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {!user ? (
                  <>
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
                      }}
                    >
                      Test Register + OTP Flow
                    </Button>
                    <Button
                      onClick={() => openAuthModal("login")}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: "#334155",
                        color: "#F8FAFC",
                        "&:hover": { borderColor: "#64748B", backgroundColor: "#0F172A" },
                        fontSize: "12px",
                      }}
                    >
                      Test Login Flow
                    </Button>
                    <Button
                      onClick={() => openAuthModal("forgot")}
                      size="small"
                      variant="text"
                      sx={{
                        color: "#94A3B8",
                        "&:hover": { color: "#F8FAFC" },
                        fontSize: "12px",
                      }}
                    >
                      Test Forgot Password
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={logout}
                      size="small"
                      variant="outlined"
                      color="error"
                      sx={{ fontSize: "12px" }}
                    >
                      Sign Out
                    </Button>
                    <span className="text-xs text-[#94A3B8] ml-2">
                      Ready for Phase 3: Public Notes Workspace!
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Pinned Notes Preview */}
            <div className="space-y-3">
              <Typography variant="body2" className="font-medium text-[#94A3B8] uppercase tracking-wider text-xs">
                Pinned Notes Preview
              </Typography>

              <div className={`grid gap-4 ${isGridView ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                <div className="group relative p-4 rounded-2xl bg-[#1E293B] border border-[#334155] hover:border-slate-500 transition-all shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <Typography variant="subtitle2" className="font-semibold text-white">
                        Welcome to Beginning 🚀
                      </Typography>
                      <Tooltip title="Pinned note">
                        <PushPinOutlinedIcon fontSize="small" className="text-sky-400" />
                      </Tooltip>
                    </div>
                    <Typography variant="body2" className="text-xs text-[#94A3B8] leading-relaxed">
                      A Google Keep-inspired productivity suite with public workspace, dark aesthetic, and a high-security Private Space locked behind a 4-digit PIN.
                    </Typography>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-[#334155]/60 text-[11px] text-[#94A3B8]">
                    <span className="px-2 py-0.5 rounded-full bg-[#0F172A] border border-[#334155] text-sky-400">
                      #system
                    </span>
                    <span>Phase 1</span>
                  </div>
                </div>

                <div className="group relative p-4 rounded-2xl bg-[#1E293B] border border-[#334155] hover:border-slate-500 transition-all shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <Typography variant="subtitle2" className="font-semibold text-white">
                        Authentication &amp; Nodemailer ✉️
                      </Typography>
                      <Tooltip title="Pinned note">
                        <PushPinOutlinedIcon fontSize="small" className="text-sky-400" />
                      </Tooltip>
                    </div>
                    <Typography variant="body2" className="text-xs text-[#94A3B8] leading-relaxed">
                      6-digit OTP email validation, Bcrypt password hashing, and HttpOnly JWT cookie sessions for verified users.
                    </Typography>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-[#334155]/60 text-[11px] text-[#94A3B8]">
                    <span className="px-2 py-0.5 rounded-full bg-[#0F172A] border border-[#334155] text-emerald-400">
                      #auth
                    </span>
                    <span>Phase 2</span>
                  </div>
                </div>

                <div className="group relative p-4 rounded-2xl bg-[#1E293B] border border-[#334155] hover:border-slate-500 transition-all shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <Typography variant="subtitle2" className="font-semibold text-white">
                        Private Space Gatekeeper 🔒
                      </Typography>
                      <Tooltip title="Pinned note">
                        <PushPinOutlinedIcon fontSize="small" className="text-amber-400" />
                      </Tooltip>
                    </div>
                    <Typography variant="body2" className="text-xs text-[#94A3B8] leading-relaxed">
                      Private notes are completely isolated. Requires a 4-digit bcrypt-hashed PIN with self-serve token email reset through Nodemailer.
                    </Typography>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-[#334155]/60 text-[11px] text-[#94A3B8]">
                    <span className="px-2 py-0.5 rounded-full bg-[#0F172A] border border-[#334155] text-amber-400">
                      #security
                    </span>
                    <span>Phase 4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Box>
  );
}
