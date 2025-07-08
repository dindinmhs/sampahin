// page.tsx (Server Component)
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { Logo } from "@/components/common/logo";
import MenuDropdown from "@/components/maps/menu";
import ProfileWrapper from "@/components/profile/profile-wrapper";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

  const user = data.user;
  const fullName = user.user_metadata.full_name || "";
  const email = user.email || "";

  return (
    <main className="min-h-screen flex flex-col items-center">
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

        <div className="flex-1 flex flex-col gap-8 max-w-5xl p-5 w-full">
          <div className="flex items-center gap-3">
            <Link href={"/map"}>
              <ArrowLeft />
            </Link>
            <h1 className="text-2xl font-bold">Profil Pengguna</h1>
          </div>
          <ProfileWrapper initialFullName={fullName} email={email} />
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
