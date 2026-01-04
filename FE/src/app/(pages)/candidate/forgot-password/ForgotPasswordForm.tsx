/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import JustValidate from 'just-validate';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export const ForgotPasswordForm = () => {
  const router = useRouter();
  const validatorRef = useRef<InstanceType<typeof JustValidate> | null>(null);

  useEffect(() => {
    if (validatorRef.current) {
      validatorRef.current.destroy();
    }

    const validator = new JustValidate('#forgotPasswordForm');
    validatorRef.current = validator;

    validator
      .addField('#email', [
        {
          rule: 'required',
          errorMessage: "Please enter email!"
        },
        {
          rule: 'email',
          errorMessage: "Invalid email format!"
        },
      ])
      .onSuccess((event: any) => {
        const email = event.target.email.value;

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/forgot-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email }),
        })
          .then(res => res.json())
          .then(data => {
            if(data.code == "error") {
              toast.error(data.message);
            }

            if(data.code == "success") {
              toast.success(data.message);
              sessionStorage.setItem("forgotPasswordEmail", email);
              router.push("/candidate/otp-password");
            }
          })
      })

    return () => {
      if (validatorRef.current) {
        validatorRef.current.destroy();
        validatorRef.current = null;
      }
    };
  }, [router]);

  return (
    <>
      <form 
        className="grid grid-cols-1 gap-y-[15px]"
        id="forgotPasswordForm"
      >
        <div className="">
          <label
            htmlFor="email"
            className="font-[500] text-[14px] text-black mb-[5px]"
          >
            Email *
          </label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Enter your email"
            className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
          />
        </div>
        <div className="">
          <button 
            type="submit"
            className="w-full h-[48px] rounded-[8px] bg-[#0088FF] font-[700] text-[16px] text-white hover:bg-[#0070d6] cursor-pointer transition-colors duration-200"
          >
            Send OTP
          </button>
        </div>
        <div className="text-center">
          <Link
            href="/candidate/login"
            className="font-[500] text-[14px] text-[#0088FF] hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </>
  )
}
