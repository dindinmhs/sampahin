import { ArrowLeft } from "lucide-react";
import { Logo } from "./logo";
import { AuthButton } from "../auth-button";
import Link from "next/link";
import MenuDropdown from "../maps/menu";

export const Navbar = ({ title }: { title: string }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-gray-50">
      <nav className="w-full max-w-7xl mx-auto flex justify-between items-center p-2 px-5">
        <div className="flex items-center gap-3 font-semibold">
          <Link href="/map" className="hover:opacity-80">
            <ArrowLeft />
          </Link>
          <span>{title}</span>
        </div>
        <Logo />
        <AuthButton />
      </nav>
    </header>
  );
};

export const NavbarMap = () => {
  return (
    <nav className="top-0 right-0 left-0 flex justify-center h-16 fixed z-20">
      <div className="w-full max-w-7xl flex justify-end items-center p-3 px-5 text-sm">
        <div className="flex items-center gap-3">
          <MenuDropdown />
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};
