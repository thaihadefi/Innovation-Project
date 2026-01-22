/**
 * Company Badges Display Component
 * Shows achievement badges on company cards
 * Uses React Icons instead of emoji (UI/UX Pro Max rule #167)
 */

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

// Map badge IDs to React Icons (using badge.id as source of truth)
const iconMap: Record<string, IconType> = {
  "top-rated": FaStar,
  "active-hirer": FaBriefcase,
  "trusted-employer": FaCircleCheck,
  "hot-jobs": FaFire,
};

const colorMap: Record<string, string> = {
  "top-rated": "text-amber-500",
  "active-hirer": "text-blue-500",
  "trusted-employer": "text-emerald-500",
  "hot-jobs": "text-orange-500",
};

export const CompanyBadges = ({ badges, maxDisplay = 2, className = "" }: CompanyBadgesProps) => {
  if (!badges || badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxDisplay);
  const remaining = badges.length - maxDisplay;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayBadges.map((badge) => {
        const IconComponent = iconMap[badge.id] || FaStar;
        const colorClass = colorMap[badge.id] || "text-amber-500";
        
        return (
          <span
            key={badge.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-700 cursor-default transition-colors duration-200 hover:border-gray-300"
            title={badge.description}
          >
            <IconComponent className={`w-3 h-3 ${colorClass}`} />
            <span className="hidden sm:inline">{badge.name}</span>
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
          +{remaining}
        </span>
      )}
    </div>
  );
};

