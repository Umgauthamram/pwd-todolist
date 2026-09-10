"use client";

import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import {
  SettingsOutlined as SettingsOutlinedIcon,
  Person as PersonIcon,
  LockOutlined as LockOutlinedIcon,
  VpnKey as VpnKeyIcon,
  CloudDoneOutlined as CloudDoneOutlinedIcon,
  CloudOffOutlined as CloudOffOutlinedIcon,
  CloudSyncOutlined as CloudSyncOutlinedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { getLocalNotesCount, clearLocalNotes } from "@/lib/dexie";
import PinModal from "@/components/private-space/PinModal";

export type SettingsSection = "profile" | "pin" | "password" | "pwa";

interface SettingsViewProps {
  onBack?: () => void;
}

export default function SettingsView({ onBack }: SettingsViewProps) {
  const { user, openAuthModal, logout, checkPrivateStatus } = useAuth();

  // Active separate screen: null = Main Settings List (sub titles only), or specific section screen
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // PIN reset trigger state
  const [pinResetLoading, setPinResetLoading] = useState(false);
  const [pinResetMsg, setPinResetMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"setup" | "reset">("setup");

  // PWA / Offline state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [cachedNotesCount, setCachedNotesCount] = useState<number>(0);
  const [pwaInstallable, setPwaInstallable] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const onOnline = () => setIsOnline(true);
      const onOffline = () => setIsOnline(false);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);

      if (window.deferredPrompt) {
        setPwaInstallable(true);
      }
      const onInstallable = () => setPwaInstallable(true);
      window.addEventListener("pwa-installable", onInstallable);

      // Load cached count
      getLocalNotesCount().then((count) => setCachedNotesCount(count));

      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
        window.removeEventListener("pwa-installable", onInstallable);
      };
    }
  }, []);

  // Change password submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating password";
      setPasswordMsg({ type: "error", text: msg });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Request PIN Reset via Email
  const handleRequestPinResetEmail = async () => {
    setPinResetMsg(null);
    setPinResetLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to request PIN reset");
      }

      setPinResetMsg({
        type: "success",
        text: "PIN reset instructions sent to your email. Check your inbox.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error requesting PIN reset";
      setPinResetMsg({ type: "error", text: msg });
    } finally {
      setPinResetLoading(false);
    }
  };

  // Install PWA
  const handleInstallPwa = async () => {
    if (window.deferredPrompt) {
      await window.deferredPrompt.prompt();
      const choice = await window.deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setPwaInstallable(false);
      }
      window.deferredPrompt = null;
    } else {
      window.dispatchEvent(new Event("trigger-pwa-install"));
    }
  };

  // Clear local cache
  const handleClearCache = async () => {
    await clearLocalNotes();
    setCachedNotesCount(0);
  };

  // Section list definitions for main screen
  const menuSections: {
    id: SettingsSection;
    title: string;
    subtitle: string;
    badge: string;

  }[] = [
    {
      id: "profile",
      title: "Account Profile",
      subtitle: user ? `${user.email}` : "",
      badge: user ? "" : "Guest",
    },
    {
      id: "pin",
      title: "Private Space 4-Digit PIN",
      subtitle: "",
      badge: user?.hasPin ? "Configured" : "Not Set",
  
    },
    {
      id: "password",
      title: "Password & Security",
      subtitle: "",
      badge: "",
    },
   
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {activeSection === null && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
            <div className="flex items-center gap-3">
          
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
              </div>
            </div>

            {onBack && (
              <Button
                variant="outlined"
                size="small"
                onClick={onBack}
                startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
                sx={{
                  borderColor: "#262626",
                  color: "#neutral-300",
                  textTransform: "none",
                  fontSize: "12px",
                  borderRadius: "8px",
                  "&:hover": { borderColor: "#525252", backgroundColor: "rgba(255,255,255,0.05)" },
                }}
              >
                Back 
              </Button>
            )}
          </div>

          {/* List of Sub Titles / Section Cards */}
          <div className="space-y-3">
            {menuSections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className="w-full p-4 sm:p-5 rounded-2xl bg-[#212121] hover:bg-[#282828] transition-all flex items-center justify-between gap-4 text-left cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight group-hover:text-white transition-colors truncate">
                      {sec.title}
                    </h2>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {sec.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-[#262626] hidden sm:inline">
                    {sec.badge}
                  </span>
                  <ChevronRightIcon
                    sx={{ fontSize: 20 }}
                    className="text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEPARATE SCREEN 1: Account Profile */}
      {/* ========================================================================= */}
      {activeSection === "profile" && (
        <div className="space-y-6">
          {/* Back to Settings Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white py-1 px-2.5 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-[#262626] transition-all cursor-pointer group"
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Settings</span>
            </button>
            <span className="text-xs font-mono text-neutral-400">Section 1 of 4</span>
          </div>

          {/* Section Screen Container */}
          <div className="rounded-2xl bg-[#212121] p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#1f1f22]">
              <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center text-white">
                <PersonIcon />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Account Profile</h2>
                <p className="text-xs text-neutral-400">
                  Manage your account credentials, session details, and access control.
                </p>
              </div>
            </div>

            {user ? (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-black border border-[#262626]">
                    <span className="text-neutral-400 text-[11px] font-medium block">Email Address</span>
                    <p className="font-mono text-white text-sm font-semibold mt-1 truncate">{user.email}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-black border border-[#262626]">
                    <span className="text-neutral-400 text-[11px] font-medium block">Account Status</span>
                    <p className="font-mono text-white text-sm font-semibold mt-1">Active / Verified</p>
                  </div>
                </div>

                {/* Logout Button inside Settings Page */}
                <div className="p-4 sm:p-5 rounded-xl bg-black border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white text-sm">Sign Out of Account</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Safely terminate your session on this device and return to sign in.
                    </p>
                  </div>
                  <Button
                    variant="contained"
                    size="medium"
                    onClick={logout}
                    startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontWeight: 600,
                      fontSize: "13px",
                      textTransform: "none",
                      borderRadius: "10px",
                      px: 3,
                      py: 1,
                      "&:hover": { backgroundColor: "#e5e5e5" },
                      shrink: 0,
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-black border border-[#262626] text-xs text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span>You are currently browsing as a guest. Create an account to sync notes across devices.</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => openAuthModal("login")}
                    sx={{ borderColor: "#262626", color: "#ffffff", textTransform: "none", fontSize: "12px" }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => openAuthModal("register")}
                    sx={{ backgroundColor: "#ffffff", color: "#000000", fontWeight: 600, textTransform: "none", fontSize: "12px", "&:hover": { backgroundColor: "#e5e5e5" } }}
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEPARATE SCREEN 2: Private Space 4-Digit PIN */}
      {/* ========================================================================= */}
      {activeSection === "pin" && (
        <div className="space-y-6">
          {/* Back to Settings Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white py-1 px-2.5 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-[#262626] transition-all cursor-pointer group"
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Settings</span>
            </button>
            <span className="text-xs font-mono text-neutral-400">Section 2 of 4</span>
          </div>

          {/* Section Screen Container */}
          <div className="rounded-2xl bg-[#212121] p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#1f1f22]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center text-white">
                  <LockOutlinedIcon />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Private Space 4-Digit PIN</h2>
                  <p className="text-xs text-neutral-400">
                    Bcrypt-encrypted isolation for sensitive notes
                  </p>
                </div>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full font-mono ${
                  user?.hasPin
                    ? "bg-white/10 text-white border border-white/30"
                    : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                }`}
              >
                {user?.hasPin ? "Configured" : "Not Set"}
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Your 4-digit PIN isolates your private notes. It is encrypted on our servers using Bcrypt and can only be unlocked with the correct numeric code.
            </p>

            {pinResetMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                  pinResetMsg.type === "success"
                    ? "bg-white/10 border border-white/30 text-white"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}
              >
                <span>{pinResetMsg.type === "success" ? "✓" : "⚠️"}</span>
                <span>{pinResetMsg.text}</span>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                variant="contained"
                size="medium"
                onClick={() => {
                  setPinModalMode("setup");
                  setPinModalOpen(true);
                }}
                sx={{
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  fontWeight: 600,
                  fontSize: "13px",
                  textTransform: "none",
                  borderRadius: "10px",
                  px: 3,
                  py: 1,
                  "&:hover": { backgroundColor: "#e5e5e5" },
                }}
              >
                {user?.hasPin ? "Change 4-Digit PIN" : "Configure 4-Digit PIN"}
              </Button>

              {user?.hasPin && (
                <Button
                  variant="outlined"
                  size="medium"
                  disabled={pinResetLoading}
                  onClick={handleRequestPinResetEmail}
                  sx={{
                    borderColor: "#262626",
                    color: "#ffffff",
                    fontSize: "13px",
                    textTransform: "none",
                    borderRadius: "10px",
                    px: 3,
                    py: 1,
                    "&:hover": { borderColor: "#525252", backgroundColor: "rgba(255, 255, 255, 0.05)" },
                  }}
                >
                  {pinResetLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    "Request PIN Reset via Email"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEPARATE SCREEN 3: Password & Security */}
      {/* ========================================================================= */}
      {activeSection === "password" && (
        <div className="space-y-6">
          {/* Back to Settings Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white py-1 px-2.5 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-[#262626] transition-all cursor-pointer group"
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Settings</span>
            </button>
            <span className="text-xs font-mono text-neutral-400">Section 3 of 4</span>
          </div>

          {/* Section Screen Container */}
          <div className="rounded-2xl bg-[#212121] p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#1f1f22]">
              <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center text-white">
                <VpnKeyIcon />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Password &amp; Security</h2>
                <p className="text-xs text-neutral-400">
                  Update your primary account login credentials.
                </p>
              </div>
            </div>

            {passwordMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                  passwordMsg.type === "success"
                    ? "bg-white/10 border border-white/30 text-white"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}
              >
                <span>{passwordMsg.type === "success" ? "✓" : "⚠️"}</span>
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Current Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-black border border-[#262626] focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-black border border-[#262626] focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none placeholder-neutral-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-black border border-[#262626] focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none placeholder-neutral-600 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  {showPassword ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                  <span>{showPassword ? "Hide passwords" : "Show passwords"}</span>
                </button>

                <Button
                  type="submit"
                  disabled={passwordLoading}
                  size="medium"
                  variant="contained"
                  sx={{
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontWeight: 600,
                    fontSize: "13px",
                    textTransform: "none",
                    borderRadius: "10px",
                    px: 3,
                    py: 1,
                    "&:hover": { backgroundColor: "#e5e5e5" },
                  }}
                >
                  {passwordLoading ? <CircularProgress size={16} color="inherit" /> : "Update Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEPARATE SCREEN 4: PWA & Offline Storage */}
      {/* ========================================================================= */}
      {activeSection === "pwa" && (
        <div className="space-y-6">
          {/* Back to Settings Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white py-1 px-2.5 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-[#262626] transition-all cursor-pointer group"
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Settings</span>
            </button>
            <span className="text-xs font-mono text-neutral-400">Section 4 of 4</span>
          </div>

          {/* Section Screen Container */}
          <div className="rounded-2xl bg-[#212121] p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#1f1f22]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-black border border-[#262626] flex items-center justify-center text-white">
                  <CloudSyncOutlinedIcon />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">PWA &amp; Offline Storage</h2>
                  <p className="text-xs text-neutral-400">
                    Service worker status, IndexedDB caching &amp; install
                  </p>
                </div>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-medium ${
                  isOnline
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                }`}
              >
                {isOnline ? (
                  <>
                    <CloudDoneOutlinedIcon sx={{ fontSize: 15 }} /> Online
                  </>
                ) : (
                  <>
                    <CloudOffOutlinedIcon sx={{ fontSize: 15 }} /> Offline
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Beginning leverages Service Workers and Dexie IndexedDB client caching. You can write, browse, and organize notes without an active internet connection.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 rounded-xl bg-black border border-[#262626]">
                <span className="text-neutral-400 text-[11px] font-medium block">IndexedDB Cached Notes</span>
                <p className="font-mono text-white text-sm font-semibold mt-1">{cachedNotesCount} records</p>
              </div>
              <div className="p-4 rounded-xl bg-black border border-[#262626]">
                <span className="text-neutral-400 text-[11px] font-medium block">Service Worker State</span>
                <p className="font-mono text-neutral-300 text-sm mt-1">Active (sw.js v2)</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {pwaInstallable && (
                <Button
                  variant="contained"
                  size="medium"
                  onClick={handleInstallPwa}
                  sx={{
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontWeight: 600,
                    fontSize: "13px",
                    textTransform: "none",
                    borderRadius: "10px",
                    px: 3,
                    py: 1,
                    "&:hover": { backgroundColor: "#e5e5e5" },
                  }}
                >
                  Install App on Device
                </Button>
              )}

              <Button
                variant="outlined"
                size="medium"
                onClick={handleClearCache}
                sx={{
                  borderColor: "#262626",
                  color: "#a1a1aa",
                  fontSize: "13px",
                  textTransform: "none",
                  borderRadius: "10px",
                  px: 3,
                  py: 1,
                  "&:hover": { borderColor: "#525252", color: "#ffffff", backgroundColor: "rgba(255,255,255,0.05)" },
                }}
              >
                Clear Local Cache
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal for setup / reset triggers */}
      <PinModal
        open={pinModalOpen}
        mode={pinModalMode}
        onClose={() => setPinModalOpen(false)}
        onSuccess={async () => {
          await checkPrivateStatus();
          setPinResetMsg({ type: "success", text: "PIN updated successfully!" });
        }}
      />
    </div>
  );
}
