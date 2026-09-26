"use client";
import { useState, type ReactNode } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import type { FieldValues, UseFormRegisterReturn } from "react-hook-form";

/** Accepts any react-hook-form error shape (flat or nested). */
type FieldErrorLike = { message?: unknown } | undefined;

const INPUT_CLASS =
  "w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200";

const LABEL_CLASS = "font-[500] text-[14px] text-black mb-[5px] block";
const ERROR_CLASS = "text-red-500 text-[12px] mt-[4px]";

interface BaseFieldProps {
  id: string;
  label: string;
  error?: FieldErrorLike;
  autoComplete?: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
}

export const AuthTextField = ({ id, label, error, autoComplete, placeholder, registration, type = "text" }: BaseFieldProps & { type?: string }) => (
  <div>
    <label htmlFor={id} className={LABEL_CLASS}>{label} *</label>
    <input type={type} id={id} autoComplete={autoComplete} placeholder={placeholder} className={INPUT_CLASS} {...registration} />
    {error?.message ? <p className={ERROR_CLASS}>{String(error.message)}</p> : null}
  </div>
);

export const AuthPasswordField = ({ id, label, error, autoComplete, placeholder, registration }: BaseFieldProps) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>{label} *</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          id={id}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`${INPUT_CLASS} pr-[50px]`}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-[15px] top-1/2 -translate-y-1/2 text-[#666] hover:text-[#333] cursor-pointer transition-colors duration-200"
        >
          {show ? <FaEyeSlash className="text-[18px]" /> : <FaEye className="text-[18px]" />}
        </button>
      </div>
      {error?.message ? <p className={ERROR_CLASS}>{String(error.message)}</p> : null}
    </div>
  );
};

export const AuthSubmitButton = ({ children, disabled }: { children: ReactNode; disabled?: boolean }) => (
  <button
    type="submit"
    disabled={disabled}
    className="w-full h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);

/** Surfaces the first RHF validation error as a toast (shared onInvalid handler). */
export const toastFirstError = (toastError: (msg: string) => void) => (errors: FieldValues) => {
  const first = Object.values(errors)[0] as FieldErrorLike;
  if (first?.message) toastError(String(first.message));
};
