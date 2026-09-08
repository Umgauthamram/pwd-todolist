"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import { LockResetOutlined as LockResetOutlinedIcon, CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import PinModal from "@/components/private-space/PinModal";

function ResetPinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#1E293B] border border-[#334155] shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
          <LockResetOutlinedIcon sx={{ fontSize: 32 }} />
        </div>
        <h1 className="text-xl font-bold text-white">Reset Private Space PIN</h1>
        <p className="text-xs text-[#94A3B8]">
          {token ? "Single-use reset token verified. Please enter your new 4-digit PIN." : "Enter your reset token to choose a new 4-digit PIN."}
        </p>

        <PinModal
          open={modalOpen}
          mode="reset"
          initialToken={token}
          onClose={() => router.push("/")}
          onSuccess={() => {
            router.push("/?private=true");
          }}
        />
      </div>
    </div>
  );
}

export default function ResetPinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
          <CircularProgress sx={{ color: "#F59E0B" }} />
        </div>
      }
    >
      <ResetPinContent />
    </Suspense>
  );
}
