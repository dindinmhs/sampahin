"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import UserProfile from "./auth/user-profile";
import { useUserStore } from "@/lib/store/user-store";

export function AuthButton() {
  const { user, setUser } = useUserStore();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    // Listen perubahan auth
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [setUser]);

  return user ? (
    <div className="flex items-center gap-4">
      <UserProfile
        displayName={user.user_metadata.full_name}
        email={user.email}
      />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="default" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="default" variant={"login"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
