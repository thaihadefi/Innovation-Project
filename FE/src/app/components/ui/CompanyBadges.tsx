"use client";
/**
 * Company Badges Display Component
 * Shows achievement badges on company cards
 */

import { memo, useState, useRef, useEffect } from "react";
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
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);
  const isPointerMouse = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveBadgeId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!badges || badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxDisplay);
  const remaining = badges.length - maxDisplay;

  return (
    <div className={`flex flex-wrap justify-center gap-1 ${className}`} ref={containerRef}>
      {displayBadges.map((badge) => {
        const IconComponent = iconMap[badge.id] || FaStar;
        const colorClass = colorMap[badge.id] || "text-amber-500";
        
        return (
          <span
            key={badge.id}
            className="relative inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-700 cursor-pointer transition-colors duration-200 hover:border-gray-300"
            onPointerEnter={(e) => {
              isPointerMouse.current = e.pointerType === 'mouse';
              if (isPointerMouse.current) setActiveBadgeId(badge.id);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === 'mouse') setActiveBadgeId(null);
            }}
            onClick={() => {
              if (!isPointerMouse.current) {
                setActiveBadgeId(prev => prev === badge.id ? null : badge.id);
              }
            }}
          >
            <IconComponent className={`w-3 h-3 ${colorClass}`} />
            <span className="hidden sm:inline">{badge.name}</span>
            <span className={`pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-full max-w-[220px] whitespace-normal rounded-md bg-gray-900 px-2 py-1 text-center text-[11px] leading-tight text-white shadow-md transition-all duration-150 ${activeBadgeId === badge.id ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
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
