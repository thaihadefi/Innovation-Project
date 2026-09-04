export const NotificationErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="text-center py-[60px] bg-[#F9F9F9] rounded-[12px]">
    <p className="text-[14px] text-[#666] mb-[12px]">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="inline-block rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] px-[16px] py-[8px] text-[14px] font-[600] text-white hover:from-[#0077EE] hover:to-[#0055BB]"
    >
      Retry
    </button>
  </div>
);
