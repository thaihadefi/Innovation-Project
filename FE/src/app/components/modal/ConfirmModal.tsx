"use client";
import { ReactNode, useEffect } from "react";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  icon?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-white rounded-[12px] w-full max-w-[420px] mx-[16px] p-[32px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {icon && (
          <div className="w-[60px] h-[60px] mx-auto mb-[16px] rounded-full bg-[#FEE2E2] flex items-center justify-center">
            {icon}
          </div>
        )}
        <h3 className={`font-[700] text-[18px] text-[#121212] mb-[8px] ${icon ? "text-center" : ""}`}>{title}</h3>
        <p className={`text-[14px] text-[#666] mb-[24px] ${icon ? "text-center" : ""}`}>{message}</p>
        <div className="flex gap-[12px]">
          <button
            onClick={onCancel}
            disabled={confirmDisabled}
            className="flex-1 h-[40px] rounded-[8px] border border-[#DEDEDE] text-[14px] text-[#666] hover:bg-[#F5F7FA] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`flex-1 h-[40px] rounded-[8px] text-[14px] font-[500] text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
