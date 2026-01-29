/**
 * Company Badges Display Component
 * Shows achievement badges on company cards
 */

import { memo } from "react";
import { FaStar, FaBriefcase, FaCircleCheck, FaFire } from "react-icons/fa6";
import { IconType } from "react-icons";

interface Badge {
  id: string;
  name: string;
  icon: string; // icon id for mapping
  description: string;
}

interface CompanyBadgesProps {
  badges: Badge[];
  maxDisplay?: number;
  className?: string;
}

// Map badge IDs to React Icons 
const iconMap: Record<string, IconType> = {
  "top-rated": FaStar,
  "active-recruiter": FaBriefcase,
  "trusted-employer": FaCircleCheck,
  "hot-jobs": FaFire,
};

const colorMap: Record<string, string> = {
  "top-rated": "text-amber-500",
  "active-recruiter": "text-blue-500",
  "trusted-employer": "text-emerald-500",
  "hot-jobs": "text-orange-500",
};

const CompanyBadgesComponent = ({ badges, maxDisplay = 2, className = "" }: CompanyBadgesProps) => {
  if (!badges || badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxDisplay);
  const remaining = badges.length - maxDisplay;

  return (
    <div className={`flex flex-wrap justify-center gap-1 ${className}`}>
      {displayBadges.map((badge) => {
        const IconComponent = iconMap[badge.id] || FaStar;
        const colorClass = colorMap[badge.id] || "text-amber-500";
        
        return (
          <span
            key={badge.id}
            className="relative group inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-700 cursor-default transition-colors duration-200 hover:border-gray-300"
          >
            <IconComponent className={`w-3 h-3 ${colorClass}`} />
            <span className="hidden sm:inline">{badge.name}</span>
            <span className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-full max-w-[220px] whitespace-normal rounded-md bg-gray-900 px-2 py-1 text-center text-[11px] leading-tight text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
              {badge.description}
            </span>
          </span>
        );
      })}
      {remaining > 0 && (
        <span 
          className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500 cursor-default transition-colors duration-200 hover:bg-gray-200"
          title={`${remaining} more badge${remaining > 1 ? 's' : ''}`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
};

// Memoized export to prevent unnecessary re-renders
export const CompanyBadges = memo(CompanyBadgesComponent);
