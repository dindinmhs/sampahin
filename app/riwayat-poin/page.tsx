import { AuthButton } from "@/components/auth-button";
import { Logo } from "@/components/common/logo";
import { EnvVarWarning } from "@/components/env-var-warning";
import MenuDropdown from "@/components/maps/menu";
import { PointHistory } from "@/components/tukar-poin/point-history";
import { hasEnvVars } from "@/lib/utils";

const Page = () => {
    return (
        <main className="min-h-screen">
            <div className="flex-1 w-full flex flex-col items-center">
                <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                    <div className="flex gap-5 items-center font-semibold">
                    <Logo />
                    </div>
                    <div className="flex items-center gap-3">
                    <MenuDropdown />
                    {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
                    </div>
                </div>
                </nav>
                <PointHistory/>
            </div>
        </main>
    )
}

export default Page;