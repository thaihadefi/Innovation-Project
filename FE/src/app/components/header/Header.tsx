"use client"
import Link from "next/link"
import { FaBars } from "react-icons/fa6"
import { HeaderMenu } from "./HeaderMenu"
import { useState } from "react"
import { HeaderAccount } from "./HeaderAccount"

export const Header = () => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <header className="bg-[#000071] py-[15px]">
        <div className="container">
          {/* Wrap */}
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="font-[800] sm:text-[28px] text-[20px] text-white lg:flex-none flex-1">
              UIT-UA.ITJobs
            </Link>
            {/* Menu */}
            <HeaderMenu showMenu={showMenu} />
            {/* Account */}
            <HeaderAccount />
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
      {showMenu && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-[#0000008a] cursor-pointer" 
          onClick={() => setShowMenu(false)}
        ></div>
      )}
    </>
  )
}