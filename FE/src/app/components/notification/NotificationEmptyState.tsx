import { FaBell } from "react-icons/fa6";

export const NotificationEmptyState = () => (
  <div className="text-center py-[60px] bg-[#F9F9F9] rounded-[12px]">
    <div className="w-[80px] h-[80px] bg-[#E5E5E5] rounded-full flex items-center justify-center mx-auto mb-[16px]">
      <FaBell className="text-[32px] text-[#999]" />
    </div>
    <h3 className="font-[600] text-[18px] text-[#333] mb-[8px]">No notifications yet</h3>
    <p className="text-[14px] text-[#666]">When you receive notifications, they&apos;ll appear here</p>
  </div>
);
