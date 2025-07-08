"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Avatar from "@/components/common/avatar";
import ProfileForm from "./profile-form";

interface ProfileWrapperProps {
  initialFullName: string;
  email: string;
}

export default function ProfileWrapper({
  initialFullName,
  email,
}: ProfileWrapperProps) {
  const [currentFullName, setCurrentFullName] = useState(initialFullName);

  const handleNameUpdate = (newName: string) => {
    setCurrentFullName(newName);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <Avatar
              displayName={currentFullName || "User"}
              size="lg"
              className="mb-4"
            />
            <h2 className="text-xl font-semibold">{currentFullName}</h2>
            <p className="text-sm text-gray-500">{email}</p>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profil</CardTitle>
            <CardDescription>
              Perbarui informasi profil Anda di sini
            </CardDescription>
          </CardHeader>
          <ProfileForm
            initialFullName={currentFullName}
            email={email}
            onNameUpdate={handleNameUpdate}
          />
        </Card>
      </div>
    </div>
  );
}
