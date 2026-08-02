export const ErrorRetryState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="text-center py-[40px] text-[#666]">
    <p className="mb-[12px]">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="inline-block rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] px-[18px] py-[10px] text-[14px] font-[600] text-white hover:from-[#0077EE] hover:to-[#0055BB]"
    >
      Retry
    </button>
  </div>
);
