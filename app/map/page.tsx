import { NavbarMap } from "@/components/common/navbar";
import { MapsLayout } from "@/components/maps/map-layout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MapPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <>
      <NavbarMap/>
      <MapsLayout/>
    </>
  );
}
