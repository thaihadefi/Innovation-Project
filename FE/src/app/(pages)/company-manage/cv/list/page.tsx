import { CVList } from "./CVList";

export default function Page() {
  return (
    <>
      {/* Manage Applications */}
      <div className="py-[60px]">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-[20px] mb-[20px]">
            <h1 className="font-[700] sm:text-[28px] text-[24px] text-[#121212]">
              Manage Applications
            </h1>
          </div>
          <CVList />
        </div>
      </div>
      {/* End Manage Applications */}
    </>
  )
}