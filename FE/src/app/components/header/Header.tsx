"use client"
import Link from "next/link"
import { FaBars } from "react-icons/fa6"
import { HeaderMenu } from "./HeaderMenu"
import { useState } from "react"
import { HeaderAccount } from "./HeaderAccount"

interface ServerAuth {
  infoCandidate: any;
  infoCompany: any;
}

interface HeaderProps {
  serverAuth: ServerAuth | null;
}

export const Header = ({ serverAuth }: HeaderProps) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <header className="bg-[#000071] py-[15px]">
        <div className="container">
          {/* Wrap */}
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="font-[800] sm:text-[28px] text-[20px] text-white lg:flex-none flex-1">
              UITJobs
            </Link>
            {/* Menu */}
            <HeaderMenu showMenu={showMenu} onClose={() => setShowMenu(false)} serverAuth={serverAuth} />
            {/* Account */}
            <HeaderAccount serverAuth={serverAuth} />
            {/* Button Menu Mobile */}
            <button 
              className="lg:hidden inline-block text-[20px] text-white ml-[12px] cursor-pointer" 
              onClick={() => setShowMenu(true)}
            >
              <FaBars />
            </button>
          </div>
        </div>
      </header>
      {/* Mobile menu overlay */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${showMenu ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
        onClick={() => setShowMenu(false)}
      />
    </>
  )
}