"use client";

import { FormEvent } from "react";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";

type ListSearchBarProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  className?: string;
  disabled?: boolean;
};

export const ListSearchBar = ({
  value,
  placeholder,
  onChange,
  onSubmit,
  onClear,
  className = "",
  disabled = false,
}: ListSearchBarProps) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled) return;
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full flex-wrap items-center gap-[10px] ${className}`}
      role="search"
    >
      <div className="relative min-w-[240px] flex-1">
        <FaMagnifyingGlass className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-[44px] w-full rounded-[10px] border border-[#D7E3F7] bg-white pl-[42px] pr-[42px] text-[14px] font-[500] text-[#0F172A] outline-none transition-all duration-200 placeholder:text-[#94A3B8] focus:border-[#0B60D1] focus:ring-2 focus:ring-[#0B60D1]/20"
          disabled={disabled}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors hover:text-[#475569]"
            aria-label="Clear search"
            disabled={disabled}
          >
            <FaXmark />
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="h-[44px] rounded-[10px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] px-[18px] text-[14px] font-[700] text-white transition-all duration-200 hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Search
      </button>
    </form>
  );
};
