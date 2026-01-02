"use client";
import Link from "next/link";
import { FaHome, FaSearch, FaBriefcase, FaRocket } from "react-icons/fa";

// Pre-defined star positions to avoid hydration mismatch
const STARS = [
  { top: 5, left: 10, delay: 0.1, opacity: 0.5 },
  { top: 15, left: 85, delay: 0.3, opacity: 0.7 },
  { top: 25, left: 40, delay: 0.5, opacity: 0.4 },
  { top: 35, left: 70, delay: 0.7, opacity: 0.6 },
  { top: 45, left: 20, delay: 0.9, opacity: 0.8 },
  { top: 55, left: 90, delay: 1.1, opacity: 0.5 },
  { top: 65, left: 15, delay: 1.3, opacity: 0.7 },
  { top: 75, left: 55, delay: 1.5, opacity: 0.4 },
  { top: 85, left: 30, delay: 1.7, opacity: 0.6 },
  { top: 95, left: 75, delay: 1.9, opacity: 0.8 },
  { top: 10, left: 50, delay: 0.2, opacity: 0.5 },
  { top: 30, left: 5, delay: 0.4, opacity: 0.7 },
  { top: 50, left: 95, delay: 0.6, opacity: 0.4 },
  { top: 70, left: 45, delay: 0.8, opacity: 0.6 },
  { top: 90, left: 60, delay: 1.0, opacity: 0.8 },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000065] via-[#0044aa] to-[#0088FF] flex items-center justify-center px-4">
      <div className="text-center">
        {/* Floating Animation */}
        <div className="relative mb-8">
          {/* 404 Number with Glow Effect */}
          <h1 className="text-[180px] md:text-[240px] font-[900] text-white/10 leading-none select-none">
            404
          </h1>
          
          {/* Astronaut/Lost Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-bounce">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                <FaRocket className="text-6xl md:text-7xl text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl md:text-4xl font-[700] text-white mb-4">
          Oops! Page Not Found
        </h2>
        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for seems to have drifted into space. 
          Let&apos;s get you back on track!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="flex items-center gap-2 px-8 py-4 bg-white text-[#000065] font-[600] rounded-full hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
          >
            <FaHome className="text-lg" />
            Go Home
          </Link>
          
          <Link
            href="/search"
            className="flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-[600] rounded-full border-2 border-white/30 hover:bg-white/30 transition-all hover:scale-105"
          >
            <FaSearch className="text-lg" />
            Search Jobs
          </Link>
          
          <Link
            href="/company/list"
            className="flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-[600] rounded-full border-2 border-white/30 hover:bg-white/30 transition-all hover:scale-105"
          >
            <FaBriefcase className="text-lg" />
            View Companies
          </Link>
        </div>

        {/* Decorative Elements */}
        <div className="mt-16 flex justify-center gap-2">
          <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Stars Background Effect - Fixed positions */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          {STARS.map((star, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                animationDelay: `${star.delay}s`,
                opacity: star.opacity
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
