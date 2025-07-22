import { TukarPoinClient } from "@/components/tukar-poin/tukar-poin-layout";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import { Logo } from "@/components/common/logo";
import MenuDropdown from "@/components/maps/menu";

const pulsaOptions = [
  {
    id: 1,
    provider: "XL",
    nominal: 5000,
    pointCost: 1000,
    logo: "/xl-logo.png",
  },
  {
    id: 2,
    provider: "XL",
    nominal: 20000,
    pointCost: 5000,
    logo: "/xl-logo.png",
  },
  {
    id: 3,
    provider: "Telkomsel",
    nominal: 5000,
    pointCost: 1000,
    logo: "/telkomsel-logo.png",
  },
  {
    id: 4,
    provider: "Telkomsel",
    nominal: 20000,
    pointCost: 5000,
    logo: "/telkomsel-logo.png",
  },
  {
    id: 5,
    provider: "im3",
    nominal: 5000,
    pointCost: 1000,
    logo: "/im3-logo.png",
  },
  {
    id: 6,
    provider: "im3",
    nominal: 20000,
    pointCost: 5000,
    logo: "/im3-logo.png",
  },
];

async function getUserData() {
  return {
    expiryDate: "8 Feb 2026",
  };
}

export default async function TukarPoinPage() {
  const userData = await getUserData();

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

        <TukarPoinClient
          expiryDate={userData.expiryDate}
          pulsaOptions={pulsaOptions}
        />
      </div>
    </main>
  );
}
