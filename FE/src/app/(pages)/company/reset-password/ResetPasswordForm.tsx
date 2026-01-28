"use client";
import JustValidate from 'just-validate';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { toast } from 'sonner';

export const ResetPasswordForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const validator = new JustValidate('#resetPasswordForm');

    validator
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
      .addField('#confirmPassword', [
        {
          rule: 'required',
          errorMessage: "Please confirm password!"
        },
        {
          validator: (value: string) => {
            const password = (document.getElementById('password') as HTMLInputElement)?.value;
            return value === password;
          },
          errorMessage: "Passwords do not match!"
        },
      ])
      .onSuccess((event: any) => {
        const password = event.target.password.value;

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ password }),
          credentials: "include"
        })
          .then(res => res.json())
          .then(data => {
            if(data.code == "error") {
              toast.error(data.message);
            }

            if(data.code == "success") {
              toast.success(data.message);
              setTimeout(() => {
                router.push("/company/login");
              }, 500);
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
        className="grid grid-cols-1 gap-y-[15px]"
        id="resetPasswordForm"
      >
        <div className="">
          <label
            htmlFor="password"
            className="font-[500] text-[14px] text-black mb-[5px]"
          >
            New Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              placeholder="Enter new password"
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
        <div className="">
          <label
            htmlFor="confirmPassword"
            className="font-[500] text-[14px] text-black mb-[5px]"
          >
            Confirm Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              id="confirmPassword"
              placeholder="Confirm new password"
              className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] pr-[50px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-[15px] top-1/2 -translate-y-1/2 text-[#666] hover:text-[#333] cursor-pointer transition-colors duration-200"
            >
              {showConfirmPassword ? <FaEyeSlash className="text-[18px]" /> : <FaEye className="text-[18px]" />}
            </button>
          </div>
        </div>
        <div className="">
          <button className="w-full h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
            Reset Password
          </button>
        </div>
      </form>
    </>
  )
}
