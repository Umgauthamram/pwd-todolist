"use client";

import React, { useState, useRef, useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import {
  EmailOutlined as EmailOutlinedIcon,
  LockOutlined as LockOutlinedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import { useAuth, AuthMode } from "@/context/AuthContext";
import { isValidEmailDomain, EMAIL_ERROR_MESSAGE, ALLOWED_EMAIL_DOMAINS } from "@/lib/validators";

export default function AuthScreen() {
  const { setUser } = useAuth();
  const [tab, setTab] = useState<"login" | "register" | "verify" | "forgot">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyDomain = (domain: string) => {
    const atIndex = email.indexOf("@");
    const username = atIndex >= 0 ? email.slice(0, atIndex) : email;
    if (!username) {
      setEmail(domain.replace("@", ""));
    } else {
      setEmail(username + domain);
    }
  };
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP states (6 individual boxes)
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Forgot password
  const [forgotStep, setForgotStep] = useState<"email" | "reset">("email");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Clear alerts on tab change
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
  }, [tab]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto focus first OTP box
  useEffect(() => {
    if (tab === "verify") {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [tab]);

  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned && val !== "") return;

    const newOtp = [...otp];

    if (cleaned.length > 1) {
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

    if (!isValidEmailDomain(email.trim())) {
      setError(EMAIL_ERROR_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification) {
          setTab("verify");
          setResendCooldown(60);
          setError(data.message);
          return;
        }
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
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

    if (!isValidEmailDomain(email.trim())) {
      setError(EMAIL_ERROR_MESSAGE);
      return;
    }

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

      setTab("verify");
      setResendCooldown(60);
      setSuccessMsg("Verification code sent to " + email);
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
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setUser(data.user);
      setSuccessMsg("Account verified successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 500);
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

    if (!isValidEmailDomain(email.trim())) {
      setError(EMAIL_ERROR_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      setResendCooldown(60);
      setSuccessMsg("A new 6-digit code has been sent to " + email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password flows
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmailDomain(email.trim())) {
      setError(EMAIL_ERROR_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
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

      setSuccessMsg("Password reset successfully! You can now sign in.");
      setTimeout(() => {
        setTab("login");
        setForgotStep("email");
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-white selection:text-black">
      <div className="w-full max-w-md">
        {/* Top bar with Download App action */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("trigger-pwa-install"))}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#121214] border border-[#262626] hover:border-white text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-sm cursor-pointer"
          >
            <InstallMobileIcon sx={{ fontSize: 16 }} />
            <span>Install App</span>
          </button>
        </div>

        {/* App Title (No logo, No v1.0) */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white select-none">
            Beginning
          </h1>
          <p className="text-xs text-neutral-400 mt-2 tracking-wide uppercase font-medium">
            Notes &amp; Secure Private Space
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-[#0e0e10] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Top Switcher Tabs (Login / Register) */}
          {(tab === "login" || tab === "register") && (
            <div className="grid grid-cols-2 p-1 bg-black border border-[#262626] rounded-xl text-xs font-semibold select-none">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`py-2 rounded-lg transition-all ${
                  tab === "login"
                    ? "bg-white text-black shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setTab("register")}
                className={`py-2 rounded-lg transition-all ${
                  tab === "register"
                    ? "bg-white text-black shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Verification header */}
          {tab === "verify" && (
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Enter 6-Digit Code</h2>
              <p className="text-xs text-neutral-400">
                Verification code dispatched to <span className="text-white font-medium">{email}</span>
              </p>
            </div>
          )}

          {/* Forgot header */}
          {tab === "forgot" && (
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Account Recovery</h2>
              <p className="text-xs text-neutral-400">
                Reset your password via single-use email code
              </p>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-red-400 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircleIcon fontSize="small" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email Address</label>
                <div className="relative flex items-center">
                  <EmailOutlinedIcon className="absolute left-3 text-neutral-500" fontSize="small" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@mail.com"
                    className="w-full bg-black border border-[#262626] focus:border-white rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-neutral-500">Quick domains:</span>
                  {["@mail.com", "@outlook.com", "@yahoo.com", "@gmail.com", "@hotmail.com"].map((dom) => (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => applyDomain(dom)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-[#262626] hover:border-neutral-500 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {dom}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-neutral-400">Password</label>
                  <button
                    type="button"
                    onClick={() => setTab("forgot")}
                    className="text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <LockOutlinedIcon className="absolute left-3 text-neutral-500" fontSize="small" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black border border-[#262626] focus:border-white rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-neutral-500 hover:text-white"
                  >
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? <CircularProgress size={18} sx={{ color: "#000000" }} /> : "Sign In"}
              </button>
            </form>
          )}

          {/* MODE: REGISTER */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email Address</label>
                <div className="relative flex items-center">
                  <EmailOutlinedIcon className="absolute left-3 text-neutral-500" fontSize="small" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@mail.com"
                    className="w-full bg-black border border-[#262626] focus:border-white rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-neutral-500">Quick domains:</span>
                  {["@mail.com", "@outlook.com", "@yahoo.com", "@gmail.com", "@hotmail.com"].map((dom) => (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => applyDomain(dom)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-[#262626] hover:border-neutral-500 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {dom}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Password</label>
                <div className="relative flex items-center">
                  <LockOutlinedIcon className="absolute left-3 text-neutral-500" fontSize="small" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-black border border-[#262626] focus:border-white rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-neutral-500 hover:text-white"
                  >
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Confirm Password</label>
                <div className="relative flex items-center">
                  <LockOutlinedIcon className="absolute left-3 text-neutral-500" fontSize="small" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full bg-black border border-[#262626] focus:border-white rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? <CircularProgress size={18} sx={{ color: "#000000" }} /> : "Send 6-Digit OTP"}
              </button>
            </form>
          )}

          {/* MODE: VERIFY OTP */}
          {tab === "verify" && (
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
                    className="w-11 h-13 text-center text-xl font-bold bg-black border border-[#262626] focus:border-white rounded-xl text-white focus:outline-none transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <CircularProgress size={18} sx={{ color: "#000000" }} /> : "Verify & Sign In"}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="text-neutral-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowBackIcon fontSize="inherit" /> Back
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResendOtp}
                  className="text-white hover:text-neutral-300 disabled:text-neutral-600 flex items-center gap-1 font-medium"
                >
                  <RefreshIcon fontSize="inherit" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {tab === "forgot" && (
            <div>
              {forgotStep === "email" ? (
                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email Address</label>
                    <div className="relative flex items-center">
                      <EmailOutlinedIcon className="absolute left-3 text-neutral-500" fontSize="small" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@mail.com"
                        className="w-full bg-black border border-[#262626] focus:border-white rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-neutral-500">Quick domains:</span>
                      {["@mail.com", "@outlook.com", "@yahoo.com", "@gmail.com", "@hotmail.com"].map((dom) => (
                        <button
                          key={dom}
                          type="button"
                          onClick={() => applyDomain(dom)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-[#262626] hover:border-neutral-500 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        >
                          {dom}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <CircularProgress size={18} sx={{ color: "#000000" }} /> : "Send Reset Code"}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setTab("login")}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">6-Digit Reset Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full bg-black border border-[#262626] focus:border-white rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors text-center tracking-widest font-mono text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-black border border-[#262626] focus:border-white rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <CircularProgress size={18} sx={{ color: "#000000" }} /> : "Update Password"}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep("email")}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      Change Email
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
