"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import { MapSidebar } from "./sidebar";

interface Location {
  id: number;
  lan: number; 
  lat: number; 
  type: string;
  name: string;
  address: string;
  created_at: Timestamp;
  img_url: string;
}

interface CleanlinessReport {
  id: number;
  reporter: string; // UUID dari auth.users
  score: number;
  grade: string;
  ai_description: string;
  created_at: Timestamp;
  location: number; // foreign key ke locations
  reporter_profile?: {
    full_name: string;
    email: string;
  };
}

const Maps = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [cleanlinessReports, setCleanlinessReports] = useState<CleanlinessReport[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const getLocations = async () => {
      const supabase = createClient();
      
      // Ambil data locations
      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select("id,lan,lat,type,name,address,created_at,img_url");

      if (locationsError) {
        console.error("Error fetching locations:", locationsError);
        return;
      }

      // Ambil data cleanliness_reports
      const { data: reportsData, error: reportsError } = await supabase
        .from("cleanliness_reports")
        .select("id,reporter,score,grade,ai_description,created_at,location");

      if (reportsError) {
        console.error("Error fetching cleanliness reports:", reportsError);
        return;
      }

      setLocations(locationsData || []);
      setCleanlinessReports(reportsData || []);
    };

    getLocations();
  }, []);

  const customIcon = L.icon({
    iconUrl: "/dirty.png",
    iconSize: [32, 32], 
    iconAnchor: [16, 16], 
    popupAnchor: [0, -16], 
    shadowUrl: undefined, 
  });

  console.log(locations);
  console.log(cleanlinessReports);

  // Function untuk mendapatkan laporan kebersihan terbaru untuk lokasi tertentu
  const getLatestReport = (locationId: number) => {
    const locationReports = cleanlinessReports.filter(report => report.location === locationId);
    if (locationReports.length === 0) return null;
    
    // Ambil laporan terbaru berdasarkan created_at
    return locationReports.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };

  // Function untuk handle click marker
  const handleMarkerClick = (location: Location) => {
    setSelectedLocation(location);
    setIsSidebarOpen(true);
  };

  // Function untuk close sidebar
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedLocation(null);
  };

  return (
    <div className="relative">
      <MapContainer
        center={[-6.2, 106.8]} 
        zoom={12}
        className="h-screen w-screen z-10"
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.map((loc, index) => (
          <Marker
            key={index}
            position={[loc.lan, loc.lat]}
            icon={customIcon}
            eventHandlers={{
              click: () => handleMarkerClick(loc),
            }}
          />
        ))}
      </MapContainer>

      {/* Sidebar */}
      <MapSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        location={selectedLocation}
        latestReport={selectedLocation ? getLatestReport(selectedLocation.id) : null}
      />
    </div>
  );
};

export default Maps;