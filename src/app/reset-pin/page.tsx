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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-white selection:text-black">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#0e0e10] border border-[#262626] shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/10">
          <LockResetOutlinedIcon sx={{ fontSize: 32 }} />
        </div>
        <h1 className="text-xl font-bold text-white">Reset Private Space PIN</h1>
        <p className="text-xs text-neutral-400">
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
        <div className="min-h-screen bg-black flex items-center justify-center">
          <CircularProgress size={32} sx={{ color: "#ffffff" }} />
        </div>
      }
    >
      <ResetPinContent />
    </Suspense>
  );
}
