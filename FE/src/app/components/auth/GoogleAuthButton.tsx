"use client";

export const GoogleAuthButton = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const googleLoginUrl = `${apiUrl}/auth/google`;

  return (
    <div className="w-full mt-[16px]">
      <div className="relative flex items-center justify-center my-[18px]">
        <div className="border-t border-[#E5E7EB] w-full absolute" />
        <span className="bg-white px-[12px] text-[13px] font-[500] text-[#6B7280] relative z-10">
          or
        </span>
      </div>

      <a
        href={googleLoginUrl}
        className="w-full min-h-[48px] py-[10px] px-[16px] rounded-[8px] border border-[#D1D5DB] bg-white hover:bg-gray-50 flex flex-col sm:flex-row items-center justify-center gap-[10px] text-center transition-all duration-200 hover:shadow-sm group cursor-pointer"
      >
        <svg className="w-[20px] h-[20px] shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <div className="flex flex-col sm:items-start items-center">
          <span className="font-[600] text-[15px] text-[#374151] group-hover:text-black leading-tight">
            Continue with Google
          </span>
          <span className="text-[11px] font-[500] text-[#0088FF] leading-tight mt-[2px] inline-flex items-center gap-[4px]">
            <svg className="w-[12px] h-[12px] shrink-0 text-[#0088FF]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Instant verification for UIT Students
          </span>
        </div>
      </a>
    </div>
  );
};
