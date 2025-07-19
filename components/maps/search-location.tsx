"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { LocationType } from "@/types/location";

interface SearchLocationProps {
  onSelect: (location: LocationType) => void;
}

export default function SearchLocation({ onSelect }: SearchLocationProps) {
  const [query, setQuery] = useState("");
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [filtered, setFiltered] = useState<LocationType[]>([]);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("locations")
        .select("id,lan,lat,type,name,address,created_at,updated_at,img_url");
      setLocations(data || []);
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      setFiltered(
        locations.filter(
          (loc) =>
            loc.name.toLowerCase().includes(query.toLowerCase()) ||
            loc.address.toLowerCase().includes(query.toLowerCase())
        )
      );
      setShowList(true);
    } else {
      setShowList(false);
    }
  }, [query, locations]);

  return (
    <div className="relative w-30 sm:w-72">
      <Input
        type="text"
        placeholder="Cari lokasi..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 bg-white text-black ring-0 outline-none"
      />
      <span className="absolute left-3 top-2.5 text-gray-400">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeWidth="2"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
      </span>
      {showList && (
        <ul className="absolute z-50 mt-2 w-full bg-white border rounded shadow-lg max-h-64 overflow-auto">
          {filtered.length === 0 && (
            <li className="p-3 text-gray-500">Lokasi tidak ditemukan</li>
          )}
          {filtered.map((loc) => (
            <li
              key={loc.id}
              className="p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                onSelect(loc);
                setQuery("");
                setShowList(false);
              }}
            >
              <div className="font-semibold">{loc.name}</div>
              <div className="text-xs text-gray-500">{loc.address}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
