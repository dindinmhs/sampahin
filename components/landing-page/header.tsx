"use client";

import React, { useState } from "react";
import { MapPin, Menu, X } from "lucide-react";
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
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              Sampahin
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(item.href.substring(1));
                }}
                className="text-gray-700 hover:text-green-600 transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Auth Button & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Auth Button - Hidden on small screens, shown on medium+ */}
            <div className="hidden sm:flex items-center gap-3">
              {user && <MenuDropdown />}
              {authComponent}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-100 transition-colors"
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
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.href.substring(1));
                  }}
                  className="text-gray-700 hover:text-green-600 transition-colors cursor-pointer px-2 py-1"
                >
                  {item.label}
                </a>
              ))}

              {/* Auth Button for Mobile */}
              <div className="flex items-center justify-end pt-4 border-t border-gray-200 gap-3">
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
