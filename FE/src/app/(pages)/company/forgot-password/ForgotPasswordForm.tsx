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

    const validator = new JustValidate('#forgotPasswordFormCompany');
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

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/forgot-password`, {
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
              sessionStorage.setItem("forgotPasswordEmailCompany", email);
              router.push("/company/otp-password");
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
        id="forgotPasswordFormCompany"
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
            className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black"
          />
        </div>
        <div className="">
          <button 
            type="submit"
            className="w-full h-[48px] rounded-[4px] bg-[#0088FF] font-[700] text-[16px] text-white hover:bg-[#0077DD]"
          >
            Send OTP
          </button>
        </div>
        <div className="text-center">
          <Link
            href="/company/login"
            className="font-[500] text-[14px] text-[#0088FF] hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </>
  )
}
