"use client";
import Link from "next/link";
import { FaHome, FaRedo, FaExclamationTriangle } from "react-icons/fa";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000065] via-[#0044aa] to-[#0088FF] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="relative mb-8">
          <h1 className="text-[180px] md:text-[240px] font-[900] text-white/10 leading-none select-none">
            500
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
              <FaExclamationTriangle className="text-5xl text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-[700] text-white mb-4">
          Something went wrong
        </h2>
        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-md mx-auto">
          An unexpected error occurred. You can try again or go back home.
          {error.digest && (
            <span className="block mt-2 text-sm text-white/50">
              Error ID: {error.digest}
            </span>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-8 py-4 bg-white text-[#000065] font-[600] rounded-full hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
          >
            <FaRedo className="text-lg" />
            Try Again
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-[600] rounded-full border-2 border-white/30 hover:bg-white/30 transition-all hover:scale-105"
          >
            <FaHome className="text-lg" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
