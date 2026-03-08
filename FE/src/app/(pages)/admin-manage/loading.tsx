export default function AdminLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-[#F5F7FA]">
      <div className="flex flex-col items-center gap-[12px]">
        <div className="w-[40px] h-[40px] rounded-full border-[3px] border-[#E5E7EB] border-t-[#0088FF] animate-spin" />
        <p className="text-[13px] text-[#9CA3AF] font-[500]">Loading...</p>
      </div>
    </div>
  );
}
