"use client";

import React, { useState, useRef, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import {
  LockOutlined as LockOutlinedIcon,
  Close as CloseIcon,
  BackspaceOutlined as BackspaceOutlinedIcon,
  LockResetOutlined as LockResetOutlinedIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

export type PinModalMode = "enter" | "setup" | "reset";

interface PinModalProps {
  open: boolean;
  mode?: PinModalMode;
  initialToken?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PinModal({
  open,
  mode = "enter",
  initialToken = "",
  onClose,
  onSuccess,
}: PinModalProps) {
  const [currentMode, setCurrentMode] = useState<PinModalMode>(mode);
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", ""]);
  const [confirmDigits, setConfirmDigits] = useState<string[]>(["", "", "", ""]);
  const [setupStep, setSetupStep] = useState<"enter" | "confirm">("enter");
  const [resetToken, setResetToken] = useState<string>(initialToken);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const digitInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Sync mode when prop changes
  useEffect(() => {
    setCurrentMode(mode);
    setPinDigits(["", "", "", ""]);
    setConfirmDigits(["", "", "", ""]);
    setSetupStep("enter");
    setError(null);
    setSuccessMsg(null);
    if (initialToken) setResetToken(initialToken);
  }, [mode, initialToken, open]);

  // Focus first input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        digitInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [open, currentMode, setupStep]);

  const activeDigits = setupStep === "confirm" ? confirmDigits : pinDigits;
  const setActiveDigits = setupStep === "confirm" ? setConfirmDigits : setPinDigits;

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned && val !== "") return;

    const newDigits = [...activeDigits];

    if (cleaned.length > 1) {
      // Pasted multi-digit
      const chars = cleaned.slice(0, 4).split("");
      chars.forEach((c, i) => {
        if (i < 4) newDigits[i] = c;
      });
      setActiveDigits(newDigits);
      const nextIdx = Math.min(chars.length, 3);
      digitInputsRef.current[nextIdx]?.focus();

      if (chars.length === 4) {
        handleCompletePin(newDigits.join(""));
      }
      return;
    }

    newDigits[index] = cleaned;
    setActiveDigits(newDigits);

    if (cleaned && index < 3) {
      digitInputsRef.current[index + 1]?.focus();
    }

    // Auto submit on 4th digit
    if (cleaned && index === 3) {
      const fullPin = newDigits.join("");
      if (fullPin.length === 4) {
        handleCompletePin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !activeDigits[index] && index > 0) {
      digitInputsRef.current[index - 1]?.focus();
    }
  };

  // On-screen numeric keypad input
  const handleKeypadPress = (num: string) => {
    const emptyIndex = activeDigits.findIndex((d) => d === "");
    if (emptyIndex !== -1) {
      handleDigitChange(emptyIndex, num);
    }
  };

  const handleKeypadBackspace = () => {
    const newDigits = [...activeDigits];
    for (let i = 3; i >= 0; i--) {
      if (newDigits[i] !== "") {
        newDigits[i] = "";
        setActiveDigits(newDigits);
        digitInputsRef.current[i]?.focus();
        break;
      }
    }
  };

  // Trigger PIN submission based on mode
  const handleCompletePin = async (fullPin: string) => {
    setError(null);

    // MODE: ENTER
    if (currentMode === "enter") {
      setLoading(true);
      try {
        const res = await fetch("/api/private-space/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: fullPin }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Incorrect PIN");
        }
        setSuccessMsg("Private Space unlocked!");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Verification failed";
        setError(msg);
        setPinDigits(["", "", "", ""]);
        setTimeout(() => digitInputsRef.current[0]?.focus(), 100);
      } finally {
        setLoading(false);
      }
      return;
    }

    // MODE: SETUP
    if (currentMode === "setup") {
      if (setupStep === "enter") {
        setSetupStep("confirm");
        setTimeout(() => digitInputsRef.current[0]?.focus(), 100);
        return;
      }

      // Step: confirm
      const originalPin = pinDigits.join("");
      if (fullPin !== originalPin) {
        setError("PIN confirmation does not match. Please try again.");
        setConfirmDigits(["", "", "", ""]);
        setPinDigits(["", "", "", ""]);
        setSetupStep("enter");
        setTimeout(() => digitInputsRef.current[0]?.focus(), 100);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/private-space/setup-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: originalPin, confirmPin: fullPin }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Setup failed");
        }
        setSuccessMsg("4-Digit PIN configured successfully!");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to set PIN";
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // MODE: RESET
    if (currentMode === "reset") {
      if (!resetToken.trim()) {
        setError("Please enter the reset token received via email");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/private-space/reset-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken.trim(), newPin: fullPin }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Reset failed");
        }
        setSuccessMsg("PIN reset successfully! Unlocking space...");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Reset failed";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  // Trigger Forgot PIN Request Email
  const handleRequestPinReset = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/private-space/request-pin-reset", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset instructions");
      }
      setSuccessMsg("PIN reset token dispatched to your registered email!");
      setCurrentMode("reset");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#1E293B",
            color: "#F8FAFC",
            borderRadius: "24px",
            border: "1px solid #334155",
            backgroundImage: "none",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          },
        },
      }}
    >
      <div className="relative p-6 sm:p-8">
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <IconButton
            onClick={onClose}
            size="small"
            className="text-[#94A3B8] hover:text-white hover:bg-[#334155]"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {/* Security Shield Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <LockOutlinedIcon className="text-slate-900" sx={{ fontSize: 30 }} />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-[#F8FAFC]">
            {currentMode === "enter" && "Unlock Private Space"}
            {currentMode === "setup" && (setupStep === "enter" ? "Set 4-Digit PIN" : "Confirm 4-Digit PIN")}
            {currentMode === "reset" && "Reset 4-Digit PIN"}
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            {currentMode === "enter" && "Enter your 4-digit security PIN to access isolated private notes."}
            {currentMode === "setup" && (setupStep === "enter" ? "Create a 4-digit numeric code to protect your private notes." : "Re-enter the 4-digit PIN to confirm.")}
            {currentMode === "reset" && "Enter the reset token sent to your email and your new 4-digit PIN."}
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

        {/* Token Input for Reset Mode */}
        {currentMode === "reset" && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Reset Token from Email</label>
            <input
              type="text"
              required
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              placeholder="Paste token or link code here"
              className="w-full bg-[#0F172A] border border-[#334155] focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 focus:outline-none"
            />
          </div>
        )}

        {/* 4-Digit Boxes */}
        <div className="flex justify-center items-center gap-3 sm:gap-4 my-6">
          {[0, 1, 2, 3].map((idx) => {
            const hasDigit = Boolean(activeDigits[idx]);
            return (
              <div key={idx} className="relative">
                <input
                  ref={(el) => {
                    digitInputsRef.current[idx] = el;
                  }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={activeDigits[idx]}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-13 h-14 text-center text-2xl font-bold rounded-2xl bg-[#0F172A] border transition-all focus:outline-none ${
                    hasDigit
                      ? "border-amber-400 text-amber-400 ring-2 ring-amber-500/20 scale-105"
                      : "border-[#334155] text-white focus:border-amber-400"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* On-Screen Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-4 select-none">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              disabled={loading}
              onClick={() => handleKeypadPress(num)}
              className="h-12 rounded-xl bg-[#0F172A] hover:bg-slate-700/60 border border-[#334155] text-base font-semibold text-[#F8FAFC] transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={() => setActiveDigits(["", "", "", ""])}
            className="h-12 rounded-xl bg-[#0F172A] hover:bg-slate-700/60 border border-[#334155] text-xs font-medium text-[#94A3B8] transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleKeypadPress("0")}
            className="h-12 rounded-xl bg-[#0F172A] hover:bg-slate-700/60 border border-[#334155] text-base font-semibold text-[#F8FAFC] transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleKeypadBackspace}
            className="h-12 rounded-xl bg-[#0F172A] hover:bg-slate-700/60 border border-[#334155] text-base font-medium text-[#94A3B8] hover:text-white transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <BackspaceOutlinedIcon fontSize="small" />
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center my-2">
            <CircularProgress size={22} sx={{ color: "#F59E0B" }} />
          </div>
        )}

        {/* Footer Actions / Links */}
        <div className="pt-2 text-center space-y-2 border-t border-slate-700/40 text-xs">
          {currentMode === "enter" && (
            <button
              type="button"
              disabled={loading}
              onClick={handleRequestPinReset}
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Forgot 4-digit PIN? Request Email Reset
            </button>
          )}

          {currentMode === "setup" && setupStep === "confirm" && (
            <button
              type="button"
              onClick={() => {
                setSetupStep("enter");
                setConfirmDigits(["", "", "", ""]);
              }}
              className="text-[#94A3B8] hover:text-white flex items-center gap-1 mx-auto"
            >
              <ArrowBackIcon fontSize="inherit" /> Change chosen PIN
            </button>
          )}

          {currentMode === "reset" && (
            <button
              type="button"
              onClick={() => setCurrentMode("enter")}
              className="text-[#94A3B8] hover:text-white"
            >
              Back to PIN entry
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
