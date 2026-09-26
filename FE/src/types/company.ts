export type CompanyBadge = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

/** Shape consumed by company cards / company lists across the public site. */
export type CompanyCard = {
  _id?: string;
  slug?: string;
  companyName?: string;
  logo?: string;
  badges?: CompanyBadge[];
  locationName?: string;
  avgRating?: number | string;
  reviewCount?: number;
  totalJob?: number;
  jobCount?: number;
};
