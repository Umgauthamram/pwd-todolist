"use client";

import React, { useState, useRef, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import {
  Close as CloseIcon,
  EmailOutlined as EmailOutlinedIcon,
  LockOutlined as LockOutlinedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    pendingEmail,
    setPendingEmail,
    setUser,
  } = useAuth();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP states (6 individual boxes)
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Sync pendingEmail if set
  useEffect(() => {
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, [pendingEmail]);

  // Clear errors when changing tabs
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
  }, [authMode]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first OTP input when opening verify mode
  useEffect(() => {
    if (authMode === "verify" && isAuthModalOpen) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [authMode, isAuthModalOpen]);

  const handleOtpChange = (index: number, val: string) => {
    // Only accept numeric inputs
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned && val !== "") return;

    const newOtp = [...otp];

    if (cleaned.length > 1) {
      // Pasted multi-digit code
      const digits = cleaned.slice(0, 6).split("");
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto advance focus
    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification) {
          setPendingEmail(email);
          setAuthMode("verify");
          setResendCooldown(60);
          setError(data.message);
          return;
        }
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      closeAuthModal();
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setPendingEmail(email);
      setAuthMode("verify");
      setResendCooldown(60);
      setSuccessMsg("Verification code dispatched to " + email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits of the verification code");
      return;
    }

    setLoading(true);

    try {
      const targetEmail = pendingEmail || email;
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, otp: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setUser(data.user);
      setSuccessMsg("Account verified successfully! Welcome to Beginning.");
      setTimeout(() => {
        closeAuthModal();
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setLoading(true);

    try {
      const targetEmail = pendingEmail || email;
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      setResendCooldown(60);
      setSuccessMsg("A new 6-digit code has been sent to " + targetEmail);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Flow
  const [forgotStep, setForgotStep] = useState<"email" | "reset">("email");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setForgotStep("reset");
      setSuccessMsg("If an account exists, a reset code was sent to " + email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: resetOtp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      setSuccessMsg("Password reset successfully! You can now log in.");
      setTimeout(() => {
        setAuthMode("login");
        setForgotStep("email");
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isAuthModalOpen}
      onClose={closeAuthModal}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#1E293B",
            color: "#F8FAFC",
            borderRadius: "20px",
            border: "1px solid #334155",
            backgroundImage: "none",
            overflow: "hidden",
          },
        },
      }}
    >
      <div className="relative p-6 sm:p-8">
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <IconButton
            onClick={closeAuthModal}
            size="small"
            className="text-[#94A3B8] hover:text-white hover:bg-[#334155]"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <LockOutlinedIcon className="text-white" fontSize="medium" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
            {authMode === "login" && "Welcome back to Beginning"}
            {authMode === "register" && "Create your Account"}
            {authMode === "verify" && "Verify your Email"}
            {authMode === "forgot" && "Recover your Account"}
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            {authMode === "login" && "Sign in to access your notes and secure Private Space"}
            {authMode === "register" && "Enter your email to receive a 6-digit OTP verification code"}
            {authMode === "verify" && `Enter the 6-digit code sent to ${pendingEmail || email}`}
            {authMode === "forgot" && "Reset your password via single-use email verification code"}
          </p>
        </div>

        {/* Alert Banners */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircleIcon fontSize="small" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE: LOGIN */}
        {authMode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Email Address</label>
              <div className="relative flex items-center">
                <EmailOutlinedIcon className="absolute left-3 text-[#94A3B8]" fontSize="small" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#0F172A] border border-[#334155] focus:border-sky-400 rounded-xl pl-10 pr-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#94A3B8]">Password</label>
                <button
                  type="button"
                  onClick={() => setAuthMode("forgot")}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <LockOutlinedIcon className="absolute left-3 text-[#94A3B8]" fontSize="small" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0F172A] border border-[#334155] focus:border-sky-400 rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#94A3B8] hover:text-white"
                >
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : "Sign In"}
            </button>

            <div className="text-center text-xs text-[#94A3B8] pt-2">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className="text-sky-400 hover:text-sky-300 font-medium"
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* MODE: REGISTER */}
        {authMode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Email Address</label>
              <div className="relative flex items-center">
                <EmailOutlinedIcon className="absolute left-3 text-[#94A3B8]" fontSize="small" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#0F172A] border border-[#334155] focus:border-sky-400 rounded-xl pl-10 pr-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Password</label>
              <div className="relative flex items-center">
                <LockOutlinedIcon className="absolute left-3 text-[#94A3B8]" fontSize="small" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#0F172A] border border-[#334155] focus:border-sky-400 rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#94A3B8] hover:text-white"
                >
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Confirm Password</label>
              <div className="relative flex items-center">
                <LockOutlinedIcon className="absolute left-3 text-[#94A3B8]" fontSize="small" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-[#0F172A] border border-[#334155] focus:border-sky-400 rounded-xl pl-10 pr-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : "Send 6-Digit OTP"}
            </button>

            <div className="text-center text-xs text-[#94A3B8] pt-2">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="text-sky-400 hover:text-sky-300 font-medium"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* MODE: VERIFY OTP */}
        {authMode === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="flex justify-between items-center gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-13 text-center text-xl font-bold bg-[#0F172A] border border-[#334155] focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 rounded-xl text-sky-400 focus:outline-none transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : "Verify & Log In"}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className="text-[#94A3B8] hover:text-white flex items-center gap-1"
              >
                <ArrowBackIcon fontSize="inherit" /> Change Email
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResendOtp}
                className="text-sky-400 hover:text-sky-300 disabled:text-[#64748B] flex items-center gap-1 font-medium"
              >
                <RefreshIcon fontSize="inherit" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* MODE: FORGOT PASSWORD */}
        {authMode === "forgot" && (
          <div>
            {forgotStep === "email" ? (
              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Email Address</label>
                  <div className="relative flex items-center">
                    <EmailOutlinedIcon className="absolute left-3 text-[#94A3B8]" fontSize="small" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#0F172A] border border-[#334155] focus:border-sky-400 rounded-xl pl-10 pr-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <CircularProgress size={18} color="inherit" /> : "Send Reset Code"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="text-xs text-sky-400 hover:text-sky-300"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">6-Digit Reset Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full bg-[#0F172A] border border-[#334155] focus:border-sky-400 rounded-xl px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors text-center tracking-widest font-mono text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-[#0F172A] border border-[#334155] focus:border-sky-400 rounded-xl px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <CircularProgress size={18} color="inherit" /> : "Update Password"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep("email")}
                    className="text-xs text-[#94A3B8] hover:text-white"
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
