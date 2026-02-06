"use client";
import JustValidate from 'just-validate';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const OtpRegisterForm = () => {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const submitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("registerEmail");
    if (!storedEmail) {
      router.push("/candidate/register");
      return;
    }
    setIsReady(true);
  }, [router]);

  useEffect(() => {
    if (!isReady) return;

    const validator = new JustValidate('#otpRegisterForm');

    validator
      .addField('#otp', [
        {
          rule: 'required',
          errorMessage: "Please enter OTP!"
        },
        {
          rule: 'minLength',
          value: 6,
          errorMessage: "OTP must be 6 digits!"
        },
        {
          rule: 'maxLength',
          value: 6,
          errorMessage: "OTP must be 6 digits!"
        },
      ])
      .onSuccess((event: any) => {
        const otp = event.target.otp.value;
        const storedEmail = sessionStorage.getItem("registerEmail");

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/verify-register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email: storedEmail, otp }),
          credentials: "include"
        })
          .then(res => res.json())
          .then(data => {
            if(data.code == "error") {
              toast.error(data.message);
            }

            if(data.code == "success") {
              toast.success(data.message);
              sessionStorage.removeItem("registerEmail");
              router.push("/candidate/login");
            }
          })
      })

    return () => {
      validator.destroy();
    };
  }, [isReady, router]);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        window.clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  const handleAutoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isReady) return;
    const form = e.currentTarget;
    const input = form.querySelector<HTMLInputElement>("#otp");
    if (!input) return;
    if (input.value.length === 6) {
      if (submitTimerRef.current) {
        window.clearTimeout(submitTimerRef.current);
      }
      submitTimerRef.current = window.setTimeout(() => {
        form.requestSubmit();
      }, 300);
    }
  };

  if (!isReady) {
    return (
      <div className="text-center py-[20px]">
        <p className="text-[#666]">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[420px] mx-auto bg-white border border-[#E8E8E8] rounded-[12px] p-[24px] shadow-sm">
        <div className="text-center mb-[16px]">
          <div className="text-[18px] font-[700] text-[#121212]">Verify Account</div>
          <p className="text-[13px] text-[#666] mt-[6px]">
            We sent a 6-digit code to your email.
          </p>
        </div>
        <form 
          className="grid grid-cols-1 gap-y-[14px]"
          id="otpRegisterForm"
          onInput={handleAutoSubmit}
        >
          <div className="">
            <label
              htmlFor="otp"
              className="font-[500] text-[13px] text-black mb-[6px] block"
            >
              OTP Code *
            </label>
            <input
              type="text"
              name="otp"
              id="otp"
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              onInput={(e) => {
                const target = e.currentTarget;
                target.value = target.value.replace(/\D/g, "");
              }}
              className="w-full h-[50px] rounded-[10px] border border-[#DEDEDE] px-[16px] font-[600] text-[18px] text-black text-center tracking-[6px] focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200 font-mono"
            />
            <p className="text-[12px] text-[#777] mt-[6px] text-center">
              Code is 6 digits. Check your spam folder if you can’t find it.
            </p>
          </div>
          <div className="">
            <button className="w-full h-[48px] rounded-[10px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
              Verify Account
            </button>
          </div>
          <div className="text-center text-[13px]">
            <Link
              href="/candidate/register"
              className="font-[600] text-[#0088FF] hover:underline"
            >
              Back to Register
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
