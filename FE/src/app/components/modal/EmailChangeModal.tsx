"use client"
import { useState } from "react";
import { FaEnvelope, FaXmark } from "react-icons/fa6";
import { toast } from "sonner";

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  accountType: "candidate" | "company";
}

export const EmailChangeModal = ({ isOpen, onClose, currentEmail, accountType }: EmailChangeModalProps) => {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail) {
      toast.error("Please enter new email!");
      return;
    }

    if (newEmail === currentEmail) {
      toast.error("New email is same as current email!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${accountType}/request-email-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
        credentials: "include"
      });
      const data = await res.json();

      if (data.code === "success") {
        toast.success(data.message);
        setStep("otp");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to send OTP!");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      toast.error("Please enter OTP!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${accountType}/verify-email-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
        credentials: "include"
      });
      const data = await res.json();

      if (data.code === "success") {
        toast.success(data.message);
        // Reset and close
        setStep("email");
        setNewEmail("");
        setOtp("");
        onClose();
        // Recommend re-login
        setTimeout(() => {
          window.location.href = `/${accountType}/login`;
        }, 2000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to verify OTP!");
    }
    setLoading(false);
  };

  const handleClose = () => {
    setStep("email");
    setNewEmail("");
    setOtp("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-[20px]"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-[12px] w-full max-w-[450px] p-[30px] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          className="absolute top-[15px] right-[15px] text-[20px] text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={handleClose}
        >
          <FaXmark />
        </button>

        {/* Header */}
        <div className="text-center mb-[25px]">
          <div className="w-[60px] h-[60px] rounded-full bg-[#0088FF]/10 flex items-center justify-center mx-auto mb-[15px]">
            <FaEnvelope className="text-[24px] text-[#0088FF]" />
          </div>
          <h3 className="font-[700] text-[20px] text-[#121212]">
            {step === "email" ? "Change Email" : "Enter OTP"}
          </h3>
          <p className="text-[14px] text-gray-500 mt-[5px]">
            {step === "email" 
              ? "Enter your new email address" 
              : `We sent a code to ${newEmail}`}
          </p>
        </div>

        {/* Step 1: Email Input */}
        {step === "email" && (
          <form onSubmit={handleRequestOTP}>
            <div className="mb-[15px]">
              <label className="block font-[500] text-[14px] text-black mb-[5px]">
                Current Email
              </label>
              <input
                type="email"
                value={currentEmail}
                disabled
                className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px] font-[500] text-[14px] text-gray-400 bg-gray-50"
              />
            </div>
            <div className="mb-[20px]">
              <label className="block font-[500] text-[14px] text-black mb-[5px]">
                New Email *
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email"
                className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px] font-[500] text-[14px] text-black"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-[#0088FF] rounded-[8px] font-[700] text-[16px] text-white hover:bg-[#0070d6] disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP}>
            <div className="mb-[20px]">
              <label className="block font-[500] text-[14px] text-black mb-[5px]">
                OTP Code *
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full h-[46px] border border-[#DEDEDE] rounded-[8px] px-[20px] font-[500] text-[18px] text-center"
                required
              />
              <p className="text-[12px] text-gray-400 mt-[5px] text-center">
                Code expires in 10 minutes
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-[#0088FF] rounded-[8px] font-[700] text-[16px] text-white hover:bg-[#0070d6] disabled:opacity-50 mb-[10px]"
            >
              {loading ? "Verifying..." : "Verify & Change Email"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full h-[48px] border border-[#DEDEDE] rounded-[8px] font-[600] text-[14px] text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
