"use client";

import React from "react";
import Dropdown from "../common/dropdown";
import Avatar from "../common/avatar";
import { User, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface UserProfileProps {
  displayName: string;
  imageUrl?: string;
  email?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ displayName, imageUrl }) => {
  const router = useRouter();
  const dropdownItems = [
    {
      id: "profile",
      label: displayName,
      icon: <User size={20} />,
      onClick: () => router.push("/profile"),
    },
    {
      id: "separator",
      label: "",
      separator: true,
    },
    {
      id: "logout",
      label: "Logout",
      icon: <LogOut size={20} />,
      onClick: () => logout(),
    },
  ];

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <Dropdown
      trigger={<Avatar displayName={displayName} imageUrl={imageUrl} />}
      items={dropdownItems}
      position="bottom-right"
    />
  );
};

export default UserProfile;
