import { CardCompanyItem } from "@/app/components/card/CardCompanyItem";

interface Section2Props {
  companies?: any[];
}

// Server Component - receives data from parent
export const Section2 = ({ companies = [] }: Section2Props) => {
  return (
    <>
      <div className="py-[60px]">
        <div className="container">
          <h2 className="text-center font-[700] sm:text-[28px] text-[24px] text-[#121212] mb-[30px]">
            Top Employers
          </h2>
          {companies.length === 0 ? (
            <p className="text-center text-gray-500">No companies found</p>
          ) : (
            <div className="grid lg:grid-cols-3 grid-cols-2 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px]">
              {companies.map((item: any, index: number) => (
                <CardCompanyItem
                  key={item._id || `company-${index}`}
                  item={item}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};