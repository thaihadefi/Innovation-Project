"use client";
import JustValidate from 'just-validate';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { toast } from 'sonner';

export const RegisterForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const validator = new JustValidate('#registerForm');

    validator
      .addField('#fullName', [
        {
          rule: 'required',
          errorMessage: "Please enter full name!"
        },
        {
          rule: 'minLength',
          value: 5,
          errorMessage: "Full name must be at least 5 characters!"
        },
        {
          rule: 'maxLength',
          value: 50,
          errorMessage: "Full name must not exceed 50 characters!"
        },
      ])
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
        const fullName = event.target.fullName.value;
        const email = event.target.email.value;
        const password = event.target.password.value;

        const dataFinal = {
          fullName: fullName,
          email: email,
          password: password,
        };

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(dataFinal)
        })
          .then(res => res.json())
          .then(data => {
            if(data.code == "error") {
              toast.error(data.message);
            }

            if(data.code == "success") {
              toast.success(data.message);
              router.push("/candidate/login");
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
        id="registerForm"
      >
        <div className="">
          <label
            htmlFor="fullName"
            className="font-[500] text-[14px] text-black mb-[5px]"
          >
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            id="fullName"
            autoComplete="name"
            className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
          />
        </div>
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
            autoComplete="email"
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
              autoComplete="new-password"
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
          <button className="w-full h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
            Register
          </button>
        </div>
      </form>
    </>
  )
}
