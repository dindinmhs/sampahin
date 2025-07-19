"use client";

import React from "react";
import Dropdown from "../common/dropdown";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

const MenuDropdown: React.FC = ({}) => {
  const router = useRouter();
  const dropdownItems = [
    {
      id: "grading",
      label: "Grade Kebersihan",
      onClick: () => router.push("/grading"),
    },
    {
      id: "scan",
      label: "Scan Sampah",
      onClick: () => router.push("/scan-sampah"),
    },
    {
      id: "tukar-poin",
      label: "Tukar Poin",
      onClick: () => router.push("tukar-poin"),
    },
  ];

  return (
    <Dropdown
      trigger={<Button type="button">Menu</Button>}
      items={dropdownItems}
      position="bottom-right"
    />
  );
};

export default MenuDropdown;
