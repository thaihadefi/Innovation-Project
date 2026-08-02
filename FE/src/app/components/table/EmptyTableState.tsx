import { ReactNode } from "react";

type EmptyTableStateProps = {
  colSpan: number;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
};

export const EmptyTableState = ({ colSpan, title, subtitle, icon }: EmptyTableStateProps) => (
  <tr>
    <td colSpan={colSpan} className="text-center py-[64px]">
      <div className="flex flex-col items-center gap-[10px] text-[#9CA3AF]">
        {icon && (
          <div className="w-[48px] h-[48px] rounded-full bg-[#F3F4F6] flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <p className="text-[14px] font-[500] text-[#374151]">{title}</p>
          {subtitle && <p className="text-[12px] mt-[2px]">{subtitle}</p>}
        </div>
      </div>
    </td>
  </tr>
);
