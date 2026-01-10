/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import JustValidate from 'just-validate';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const OtpRegisterForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("registerEmail");
    if (!storedEmail) {
      router.push("/candidate/register");
      return;
    }
    setEmail(storedEmail);
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

  if (!isReady) {
    return (
      <div className="text-center py-[20px]">
        <p className="text-[#666]">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <form 
        className="grid grid-cols-1 gap-y-[15px]"
        id="otpRegisterForm"
      >
        <div className="">
          <p className="font-[500] text-[14px] text-[#666] mb-[10px]">
            OTP sent to: <span className="text-[#0088FF]">{email}</span>
          </p>
        </div>
        <div className="">
          <label
            htmlFor="otp"
            className="font-[500] text-[14px] text-black mb-[5px]"
          >
            OTP *
          </label>
          <input
            type="text"
            name="otp"
            id="otp"
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black text-center focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
          />
        </div>
        <div className="">
          <button className="w-full h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
            Verify Account
          </button>
        </div>
        <div className="text-center">
          <Link
            href="/candidate/register"
            className="font-[500] text-[14px] text-[#0088FF] hover:underline"
          >
            Back to Register
          </Link>
        </div>
      </form>
    </>
  )
}
