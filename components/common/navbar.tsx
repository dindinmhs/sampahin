import { ArrowLeft } from "lucide-react"
import { Logo } from "./logo"
import { AuthButton } from "../auth-button"
import Link from "next/link"

export const Navbar = ({
    title
}:{title : string}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-white">
        <nav className="flex justify-between max-w-4xl items-center mx-auto">
            <div className="flex items-center gap-3">
                <Link href={'/map'}>
                    <ArrowLeft/>
                </Link>
                <h2>{title}</h2>
            </div>
            <Logo/>
            <AuthButton/>
        </nav>
    </header>
  )
}
