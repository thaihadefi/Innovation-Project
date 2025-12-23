import Link from "next/link";
import { FormEdit } from "./FormEdit";

export default async function Page(props: PageProps<'/company-manage/job/edit/[id]'>) {
  const { id } = await props.params;

  return (
    <>
      {/* Edit Job */}
      <div className="py-[60px]">
        <div className="container">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <div className="flex flex-wrap gap-[20px] items-center justify-between mb-[20px]">
              <h1 className="sm:w-auto w-[100%] font-[700] text-[20px] text-black">
                Edit Job
              </h1>
              <Link
                href="/company-manage/job/list"
                className="font-[400] text-[14px] text-[#0088FF] underline"
              >
                Back to List
              </Link>
            </div>
            <FormEdit id={id} />
          </div>
        </div>
      </div>
      {/* End Edit Job */}
    </>
  )
}