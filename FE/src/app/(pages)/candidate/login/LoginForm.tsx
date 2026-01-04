/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import JustValidate from 'just-validate';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { toast } from 'sonner';

export const LoginForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const validator = new JustValidate('#loginForm');

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
      .addField('#password', [
        {
          rule: 'required',
          errorMessage: "Please enter password!"
        },
        {
          rule: 'minLength',
          value: 8,
          errorMessage: "Password must be at least 8 characters!"
        },
        {
          rule: 'customRegexp',
          value: /[A-Z]/,
          errorMessage: "Password must contain at least one uppercase letter!"
        },
        {
          rule: 'customRegexp',
          value: /[a-z]/,
          errorMessage: "Password must contain at least one lowercase letter!"
        },
        {
          rule: 'customRegexp',
          value: /\d/,
          errorMessage: "Password must contain at least one digit!"
        },
        {
          rule: 'customRegexp',
          value: /[~!@#$%^&*]/,
          errorMessage: "Password must contain at least one special character! (~!@#$%^&*)"
        },
      ])
      .onSuccess((event: any) => {
        const email = event.target.email.value;
        const password = event.target.password.value;
        const rememberPassword = event.target.rememberPassword.checked;

        const dataFinal = {
          email: email,
          password: password,
          rememberPassword: rememberPassword,
        };

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(dataFinal),
          credentials: "include"
        })
          .then(res => res.json())
          .then(data => {
            if(data.code == "error") {
              toast.error(data.message);
            }

            if(data.code == "success") {
              toast.success(data.message);
              router.push("/");
            }
          })
      })

    return () => {
      validator.destroy();
    };
  }, [router]);

  return (
    <>
      <form 
        className="grid grid-cols-1 gap-y-[15px] gap-x-[20px]"
        id="loginForm"
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
            className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
          />
        </div>
        <div className="">
          <label
            htmlFor="password"
            className="font-[500] text-[14px] text-black mb-[5px]"
          >
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] pr-[50px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-[15px] top-1/2 -translate-y-1/2 text-[#666] hover:text-[#333] cursor-pointer transition-colors duration-200"
            >
              {showPassword ? <FaEyeSlash className="text-[18px]" /> : <FaEye className="text-[18px]" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <input
              type="checkbox"
              name="rememberPassword"
              id="rememberPassword"
              className="w-[16px] h-[16px] cursor-pointer"
            />
            <label
              htmlFor="rememberPassword"
              className="font-[500] text-[14px] text-black cursor-pointer"
            >
              Remember me
            </label>
          </div>
          <Link
            href="/candidate/forgot-password"
            className="font-[500] text-[14px] text-[#0088FF] hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="">
          <button className="w-full h-[48px] rounded-[8px] bg-[#0088FF] font-[700] text-[16px] text-white hover:bg-[#0070d6] cursor-pointer transition-colors duration-200">
            Login
          </button>
        </div>
      </form>
    </>
  )
}