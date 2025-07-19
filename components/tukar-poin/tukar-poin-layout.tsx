"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PulsaOption {
  id: number;
  provider: string;
  nominal: number;
  pointCost: number;
  logo: string;
}

interface TukarPoinClientProps {
  initialUserPoints: number;
  expiryDate: string;
  pulsaOptions: PulsaOption[];
}

export function TukarPoinClient({
  initialUserPoints,
  expiryDate,
  pulsaOptions,
}: TukarPoinClientProps) {
  const [userPoints, setUserPoints] = useState(initialUserPoints);

  const handlePulsaRedeem = (pointCost: number) => {
    if (userPoints >= pointCost) {
      setUserPoints((prev) => prev - pointCost);
      alert(`Berhasil menukar pulsa! Poin tersisa: ${userPoints - pointCost}`);
    } else {
      alert("Poin tidak cukup!");
    }
  };

  return (
    <>
      {/* Poin Section */}
      <div className="p-6 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
            <span className="text-xs text-white font-bold">P</span>
          </div>
          <h2 className="text-2xl font-bold">{userPoints}</h2>
        </div>

        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Clock className="h-4 w-4" />
          <span>Berakhir pada {expiryDate}</span>
        </div>

        <Button variant="outline" className="mt-4 text-gray-600">
          Lihat Histori
        </Button>
      </div>

      {/* Pulsa Section */}
      <div className="px-6 pb-6">
        <h3 className="text-lg font-semibold mb-4">Pulsa</h3>
        <div className="grid grid-cols-2 gap-4">
          {pulsaOptions.map((pulsa) => (
            <Card
              key={pulsa.id}
              className="overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handlePulsaRedeem(pulsa.pointCost)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative">
                    {/* Fallback jika logo tidak tersedia */}
                    <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-xs font-bold">
                        {pulsa.provider}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">
                      {pulsa.provider} {pulsa.nominal}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-600 border-yellow-200"
                >
                  {pulsa.pointCost}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
