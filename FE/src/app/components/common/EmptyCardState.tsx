import { ReactNode } from "react";

type EmptyCardStateProps = {
  icon?: ReactNode;
  title?: string;
  description: ReactNode;
  actions?: ReactNode;
};

export const EmptyCardState = ({ icon, title, description, actions }: EmptyCardStateProps) => (
  <div className="rounded-[12px] border border-[#E8ECF3] bg-white px-[20px] py-[56px] text-center shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
    {icon && (
      <div className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#F2F7FF] text-[#0088FF]">
        {icon}
      </div>
    )}
    {title && (
      <h3 className="mb-[8px] font-[700] text-[26px] leading-[1.2] text-[#0F172A]">{title}</h3>
    )}
    <p className="mx-auto max-w-[620px] text-[16px] leading-[1.6] text-[#64748B]">{description}</p>
    {actions && (
      <div className="mt-[22px] flex flex-wrap items-center justify-center gap-[10px]">{actions}</div>
    )}
  </div>
);
