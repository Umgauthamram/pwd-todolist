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
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { getLocalNotesCount, clearLocalNotes } from "@/lib/dexie";
import PinModal from "@/components/private-space/PinModal";

type SettingsSection = "profile" | "pin" | "password" | "pwa";

export default function SettingsView() {
  const { user, openAuthModal, logout, checkPrivateStatus } = useAuth();

  // Active expanded section - clicking title reveals that content
  const [activeSection, setActiveSection] = useState<SettingsSection | null>("profile");

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

  const toggleSection = (section: SettingsSection) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

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

  const sections: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Account Profile", icon: <PersonIcon sx={{ fontSize: 16 }} /> },
    { id: "pin", label: "Private Space PIN", icon: <LockOutlinedIcon sx={{ fontSize: 16 }} /> },
    { id: "password", label: "Password & Security", icon: <VpnKeyIcon sx={{ fontSize: 16 }} /> },
    { id: "pwa", label: "PWA & Storage", icon: <CloudSyncOutlinedIcon sx={{ fontSize: 16 }} /> },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[#262626]">
        <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-[#262626] flex items-center justify-center text-white">
          <SettingsOutlinedIcon />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Settings &amp; Preferences</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Select any of the 4 sections below to view and manage its settings.
          </p>
        </div>
      </div>

      {/* 4 Section Navigation Tabs / Quick Jump */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {sections.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => toggleSection(sec.id)}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                isActive
                  ? "bg-white text-black border-white shadow"
                  : "bg-[#0e0e10] text-neutral-400 hover:text-white border-[#262626] hover:border-neutral-500"
              }`}
            >
              {sec.icon}
              <span className="truncate">{sec.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {/* ======================================================== */}
        {/* 1. Account Profile Section */}
        {/* ======================================================== */}
        <div className="rounded-2xl bg-[#0e0e10] border border-[#262626] overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("profile")}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-neutral-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black border border-[#262626] flex items-center justify-center text-white">
                <PersonIcon sx={{ fontSize: 18 }} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">1. Account Profile</h2>
                <p className="text-xs text-neutral-400">
                  {user ? user.email : "Guest Session"} &bull; Account status &amp; Sign Out
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-[#262626] hidden sm:inline">
                {user ? "Signed In" : "Guest"}
              </span>
              <ExpandMoreIcon
                className={`text-neutral-400 transition-transform duration-300 ${
                  activeSection === "profile" ? "rotate-180 text-white" : ""
                }`}
              />
            </div>
          </button>

          {/* Collapsible Content */}
          {activeSection === "profile" && (
            <div className="px-5 pb-6 sm:px-6 border-t border-[#1f1f22] pt-4 space-y-4">
              {user ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-black border border-[#262626]">
                      <span className="text-neutral-400 text-[11px]">Email Address</span>
                      <p className="font-mono text-white text-sm font-medium mt-1">{user.email}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black border border-[#262626]">
                      <span className="text-neutral-400 text-[11px]">User ID</span>
                      <p className="font-mono text-neutral-300 text-xs truncate mt-1">{user.id}</p>
                    </div>
                  </div>

                  {/* REQUIREMENT: Logout button inside settings page */}
                  <div className="p-4 rounded-xl bg-black border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white text-xs">Sign Out of Account</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Safely terminate your session and return to sign in screen.
                      </p>
                    </div>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={logout}
                      startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        fontWeight: 600,
                        fontSize: "12px",
                        textTransform: "none",
                        borderRadius: "8px",
                        px: 2,
                        py: 0.8,
                        "&:hover": { backgroundColor: "#e5e5e5" },
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-black border border-[#262626] text-xs text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span>You are currently browsing as a guest. Create an account to sync notes across devices.</span>
                  <div className="flex items-center gap-2">
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
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. Private Space 4-Digit PIN Section */}
        {/* ======================================================== */}
        <div className="rounded-2xl bg-[#0e0e10] border border-[#262626] overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("pin")}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-neutral-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black border border-[#262626] flex items-center justify-center text-white">
                <LockOutlinedIcon sx={{ fontSize: 18 }} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">2. Private Space 4-Digit PIN</h2>
                <p className="text-xs text-neutral-400">
                  Bcrypt-encrypted isolation for sensitive notes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono ${
                  user?.hasPin
                    ? "bg-white/10 text-white border border-white/30"
                    : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                }`}
              >
                {user?.hasPin ? "Configured" : "Not Set"}
              </span>
              <ExpandMoreIcon
                className={`text-neutral-400 transition-transform duration-300 ${
                  activeSection === "pin" ? "rotate-180 text-white" : ""
                }`}
              />
            </div>
          </button>

          {/* Collapsible Content */}
          {activeSection === "pin" && (
            <div className="px-5 pb-6 sm:px-6 border-t border-[#1f1f22] pt-4 space-y-4">
              <p className="text-xs text-neutral-400 leading-relaxed">
                Your 4-digit PIN isolates your private notes. It is encrypted on our servers using Bcrypt and can only be unlocked with the correct numeric code.
              </p>

              {pinResetMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    pinResetMsg.type === "success"
                      ? "bg-white/10 border border-white/30 text-white"
                      : "bg-red-500/10 border border-red-500/30 text-red-400"
                  }`}
                >
                  <span>{pinResetMsg.type === "success" ? "✓" : "⚠️"}</span>
                  <span>{pinResetMsg.text}</span>
                </div>
              )}

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setPinModalMode("setup");
                    setPinModalOpen(true);
                  }}
                  sx={{
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontWeight: 600,
                    fontSize: "12px",
                    textTransform: "none",
                    borderRadius: "8px",
                    "&:hover": { backgroundColor: "#e5e5e5" },
                  }}
                >
                  {user?.hasPin ? "Change 4-Digit PIN" : "Configure 4-Digit PIN"}
                </Button>

                {user?.hasPin && (
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={pinResetLoading}
                    onClick={handleRequestPinResetEmail}
                    sx={{
                      borderColor: "#262626",
                      color: "#ffffff",
                      fontSize: "12px",
                      textTransform: "none",
                      borderRadius: "8px",
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
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. Password & Security Section */}
        {/* ======================================================== */}
        <div className="rounded-2xl bg-[#0e0e10] border border-[#262626] overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("password")}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-neutral-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black border border-[#262626] flex items-center justify-center text-white">
                <VpnKeyIcon sx={{ fontSize: 18 }} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">3. Password &amp; Security</h2>
                <p className="text-xs text-neutral-400">
                  Update your primary account login credentials
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ExpandMoreIcon
                className={`text-neutral-400 transition-transform duration-300 ${
                  activeSection === "password" ? "rotate-180 text-white" : ""
                }`}
              />
            </div>
          </button>

          {/* Collapsible Content */}
          {activeSection === "password" && (
            <div className="px-5 pb-6 sm:px-6 border-t border-[#1f1f22] pt-4 space-y-4">
              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    passwordMsg.type === "success"
                      ? "bg-white/10 border border-white/30 text-white"
                      : "bg-red-500/10 border border-red-500/30 text-red-400"
                  }`}
                >
                  <span>{passwordMsg.type === "success" ? "✓" : "⚠️"}</span>
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Current Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-black border border-[#262626] focus:border-white rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-black border border-[#262626] focus:border-white rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-neutral-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Confirm New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-black border border-[#262626] focus:border-white rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-neutral-600 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <VisibilityOffIcon fontSize="inherit" /> : <VisibilityIcon fontSize="inherit" />}
                    <span>{showPassword ? "Hide passwords" : "Show passwords"}</span>
                  </button>

                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    size="small"
                    variant="contained"
                    sx={{
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontWeight: 600,
                      fontSize: "12px",
                      textTransform: "none",
                      borderRadius: "8px",
                      "&:hover": { backgroundColor: "#e5e5e5" },
                    }}
                  >
                    {passwordLoading ? <CircularProgress size={16} color="inherit" /> : "Update Password"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 4. PWA & Offline Storage Section */}
        {/* ======================================================== */}
        <div className="rounded-2xl bg-[#0e0e10] border border-[#262626] overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("pwa")}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-neutral-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black border border-[#262626] flex items-center justify-center text-white">
                <CloudSyncOutlinedIcon sx={{ fontSize: 18 }} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">4. PWA &amp; Offline Storage</h2>
                <p className="text-xs text-neutral-400">
                  Service worker status, IndexedDB caching &amp; install
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium ${
                  isOnline
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                }`}
              >
                {isOnline ? (
                  <>
                    <CloudDoneOutlinedIcon sx={{ fontSize: 14 }} /> Online
                  </>
                ) : (
                  <>
                    <CloudOffOutlinedIcon sx={{ fontSize: 14 }} /> Offline
                  </>
                )}
              </span>
              <ExpandMoreIcon
                className={`text-neutral-400 transition-transform duration-300 ${
                  activeSection === "pwa" ? "rotate-180 text-white" : ""
                }`}
              />
            </div>
          </button>

          {/* Collapsible Content */}
          {activeSection === "pwa" && (
            <div className="px-5 pb-6 sm:px-6 border-t border-[#1f1f22] pt-4 space-y-4">
              <p className="text-xs text-neutral-400 leading-relaxed">
                Beginning leverages Service Workers and Dexie IndexedDB client caching. You can write, browse, and organize notes without an active internet connection.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-black border border-[#262626]">
                  <span className="text-neutral-400 text-[11px]">IndexedDB Cached Notes</span>
                  <p className="font-mono text-white text-sm font-medium mt-1">{cachedNotesCount} records</p>
                </div>
                <div className="p-3.5 rounded-xl bg-black border border-[#262626]">
                  <span className="text-neutral-400 text-[11px]">Service Worker State</span>
                  <p className="font-mono text-neutral-300 text-xs mt-1">Active (sw.js v2)</p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {pwaInstallable && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleInstallPwa}
                    sx={{
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontWeight: 600,
                      fontSize: "12px",
                      textTransform: "none",
                      borderRadius: "8px",
                      "&:hover": { backgroundColor: "#e5e5e5" },
                    }}
                  >
                    Install App on Device
                  </Button>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearCache}
                  sx={{
                    borderColor: "#262626",
                    color: "#a1a1aa",
                    fontSize: "12px",
                    textTransform: "none",
                    borderRadius: "8px",
                    "&:hover": { borderColor: "#525252", color: "#ffffff" },
                  }}
                >
                  Clear Local Cache
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

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
