"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import MenuDropdown from "../maps/menu";
import { useUserStore } from "@/lib/store/user-store";

interface HeaderProps {
  authComponent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ authComponent }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUserStore();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    // Close mobile menu after clicking
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { href: "#beranda", label: "Beranda" },
    { href: "#features", label: "Fitur" },
    { href: "#how-it-works", label: "Cara Kerja" },
    { href: "#mobile-app", label: "Aplikasi" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-emerald-200/50 shadow-lg shadow-emerald-500/5">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-18 py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Sampahin Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Sampahin
              </h1>
              <p className="text-xs text-emerald-500 font-medium">AI-Powered</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(item.href.substring(1));
                }}
                className="relative text-slate-700 hover:text-emerald-600 transition-colors group cursor-pointer font-medium"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </nav>

          {/* Auth Button & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Auth Button - Hidden on small screens, shown on medium+ */}
            <div className="hidden sm:flex items-center gap-3">
              {user && <MenuDropdown />}
              <div className="flex items-center space-x-3">{authComponent}</div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-emerald-200/50">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.href.substring(1));
                  }}
                  className="text-slate-700 hover:text-emerald-600 transition-colors cursor-pointer px-2 py-1 font-medium"
                >
                  {item.label}
                </a>
              ))}

              {/* Auth Button for Mobile */}
              <div className="flex items-center justify-end pt-4 border-t border-emerald-200/50 gap-3">
                {user && <MenuDropdown />}
                {authComponent}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
