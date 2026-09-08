"use client";

import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import {
  SettingsOutlined as SettingsOutlinedIcon,
  Person as PersonIcon,
  LockOutlined as LockOutlinedIcon,
  VpnKey as VpnKeyIcon,
  SecurityOutlined as SecurityOutlinedIcon,
  CloudDoneOutlined as CloudDoneOutlinedIcon,
  CloudOffOutlined as CloudOffOutlinedIcon,
  CloudSyncOutlined as CloudSyncOutlinedIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { getLocalNotesCount, clearLocalNotes } from "@/lib/dexie";
import PinModal from "@/components/private-space/PinModal";

export default function SettingsView() {
  const { user, openAuthModal, logout, checkPrivateStatus } = useAuth();

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

      // Fetch Dexie cached notes count
      getLocalNotesCount().then(setCachedNotesCount);

      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
        window.removeEventListener("pwa-installable", onInstallable);
      };
    }
  }, []);

  // Handle password update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordMsg({ type: "success", text: "Password updated successfully" });
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

  // Direct trigger: Request PIN Reset via Email
  const handleRequestPinResetEmail = async () => {
    setPinResetMsg(null);
    setPinResetLoading(true);

    try {
      const res = await fetch("/api/private-space/request-pin-reset", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch reset email");
      }

      setPinResetMsg({
        type: "success",
        text: "Single-use PIN reset link and token dispatched to your email address!",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to request reset";
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
    }
  };

  // Clear local cache
  const handleClearCache = async () => {
    await clearLocalNotes();
    setCachedNotesCount(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-[#262626]">
        <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-[#262626] flex items-center justify-center text-white">
          <SettingsOutlinedIcon />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Settings &amp; Preferences</h1>
          <p className="text-xs text-neutral-400">
            Manage your account security, 4-digit PIN configuration, and PWA offline storage.
          </p>
        </div>
      </div>

      {/* 1. Account Profile Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0e0e10] border border-[#262626] shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PersonIcon className="text-white" />
            <h2 className="text-base font-semibold text-white">Account Profile</h2>
          </div>
          {user ? (
            <Chip
              label="Verified User"
              size="small"
              icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                fontSize: "11px",
              }}
            />
          ) : (
            <Chip
              label="Guest Mode"
              size="small"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#a1a1aa",
                border: "1px solid #262626",
                fontSize: "11px",
              }}
            />
          )}
        </div>

        {user ? (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-black border border-[#262626]">
                <span className="text-neutral-400">Email Address:</span>
                <p className="font-mono text-white text-sm font-medium mt-0.5">{user.email}</p>
              </div>
              <div className="p-3 rounded-xl bg-black border border-[#262626]">
                <span className="text-neutral-400">User ID:</span>
                <p className="font-mono text-neutral-400 text-xs truncate mt-0.5">{user.id}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-neutral-400">Ready to exit your session?</span>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={logout}
                sx={{ textTransform: "none", fontSize: "12px", borderRadius: "8px" }}
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

      {/* 2. Private Space 4-Digit PIN Security Card */}
      {user && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e0e10] border border-[#262626] shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <LockOutlinedIcon className="text-white" />
              <h2 className="text-base font-semibold text-white">Private Space 4-Digit PIN</h2>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${
                user.hasPin
                  ? "bg-white/10 text-white border border-white/30"
                  : "bg-neutral-800 text-neutral-400 border border-neutral-700"
              }`}
            >
              {user.hasPin ? "PIN Configured" : "Not Configured"}
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            Your 4-digit PIN isolates your private notes. It is encrypted on our servers using Bcrypt and can only be unlocked with the correct numeric code.
          </p>

          {pinResetMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                pinResetMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
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
              {user.hasPin ? "Change 4-Digit PIN" : "Configure 4-Digit PIN"}
            </Button>

            {user.hasPin && (
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

      {/* 3. Password Management Card */}
      {user && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e0e10] border border-[#262626] shadow-lg space-y-4">
          <div className="flex items-center gap-2.5">
            <VpnKeyIcon className="text-white" />
            <h2 className="text-base font-semibold text-white">Change Account Password</h2>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
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
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
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

      {/* 4. PWA & Offline Storage Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0e0e10] border border-[#262626] shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CloudSyncOutlinedIcon className="text-white" />
            <h2 className="text-base font-semibold text-white">PWA &amp; Offline Storage</h2>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium ${
              isOnline
                ? "bg-white/10 text-white border border-white/20"
                : "bg-neutral-800 text-neutral-400 border border-neutral-700"
            }`}
          >
            {isOnline ? (
              <>
                <CloudDoneOutlinedIcon sx={{ fontSize: 14 }} /> Connected Online
              </>
            ) : (
              <>
                <CloudOffOutlinedIcon sx={{ fontSize: 14 }} /> Offline Mode
              </>
            )}
          </span>
        </div>

        <p className="text-xs text-neutral-400">
          Beginning leverages Service Workers and Dexie IndexedDB client caching. You can write, browse, and organize notes without an active internet connection.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-black border border-[#262626]">
            <span className="text-neutral-400">IndexedDB Cached Notes:</span>
            <p className="font-mono text-white text-sm font-medium mt-0.5">{cachedNotesCount} records</p>
          </div>
          <div className="p-3 rounded-xl bg-black border border-[#262626]">
            <span className="text-neutral-400">Service Worker State:</span>
            <p className="font-mono text-neutral-300 text-xs mt-0.5">Active (sw.js v1)</p>
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
