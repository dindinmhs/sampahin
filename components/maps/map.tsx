"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import { MapSidebar } from "./sidebar";
import RoutingMachine from "./routing-machine";

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

// Komponen untuk mendapatkan lokasi pengguna
const LocationFinder = ({
  setUserLocation,
}: {
  setUserLocation: (position: [number, number]) => void;
}) => {
  const map = useMapEvents({
    locationfound(e) {
      const userPos: [number, number] = [e.latlng.lat, e.latlng.lng];
      setUserLocation(userPos);
      // Fokus map ke posisi pengguna dengan zoom yang sesuai
      map.setView(userPos, 15);
    },
    locationerror(e) {
      console.error("Location error:", e.message);
      // Jika gagal mendapatkan lokasi, tetap gunakan default Jakarta
      // Anda bisa menambahkan notifikasi ke user di sini
    },
  });

  useEffect(() => {
    map.locate({
      setView: true,
      maxZoom: 15,
      timeout: 10000, // 10 detik timeout
      enableHighAccuracy: true,
    });
  }, [map]);

  return null;
};

const Maps = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [cleanlinessReports, setCleanlinessReports] = useState<
    CleanlinessReport[]
  >([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2, 106.8]); // Default Jakarta
  const [mapZoom, setMapZoom] = useState(12);
  const [isLocationLoaded, setIsLocationLoaded] = useState(false);

  // Ref untuk menyimpan referensi map
  const mapRef = useRef<L.Map | null>(null);

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

  // Effect untuk mendapatkan lokasi GPS saat komponen dimuat
  useEffect(() => {
    if (!isLocationLoaded && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(userPos);
          setMapCenter(userPos);
          setMapZoom(15);
          setIsLocationLoaded(true);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLocationLoaded(true); // Tetap set true meskipun gagal
          // Gunakan lokasi default Jakarta jika gagal
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    }
  }, [isLocationLoaded]);

  const customIcon = L.icon({
    iconUrl: "/dirty.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    shadowUrl: undefined,
  });

  // Function untuk mendapatkan laporan kebersihan terbaru untuk lokasi tertentu
  const getLatestReport = (locationId: number) => {
    const locationReports = cleanlinessReports.filter(
      (report) => report.location === locationId
    );
    if (locationReports.length === 0) return null;

    // Ambil laporan terbaru berdasarkan created_at
    return locationReports.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };

  // Function untuk handle click marker
  const handleMarkerClick = (location: Location) => {
    setSelectedLocation(location);
    setIsSidebarOpen(true);
    // Reset navigasi saat memilih lokasi baru
    setIsNavigating(false);
  };

  // Function untuk close sidebar
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedLocation(null);
    setIsNavigating(false);
  };

  // Function untuk memulai navigasi
  const handleNavigate = () => {
    if (selectedLocation && userLocation) {
      // Validasi koordinat
      const isValidCoordinate = (coord: [number, number]) => {
        return (
          coord[0] >= -90 &&
          coord[0] <= 90 &&
          coord[1] >= -180 &&
          coord[1] <= 180
        );
      };

      if (
        !isValidCoordinate(userLocation) ||
        !isValidCoordinate([selectedLocation.lan, selectedLocation.lat])
      ) {
        alert("Koordinat tidak valid. Silakan coba lagi.");
        return;
      }

      setIsNavigating(true);
    } else {
      alert("Tidak dapat memulai navigasi. Pastikan lokasi Anda terdeteksi.");
    }
  };

  return (
    <div className="relative">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-screen w-screen z-10"
        ref={(mapInstance) => {
          if (mapInstance) {
            mapRef.current = mapInstance;
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Komponen untuk mendapatkan lokasi pengguna */}
        <LocationFinder setUserLocation={setUserLocation} />

        {/* Tampilkan marker untuk lokasi pengguna jika tersedia */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: "user-location-marker",
              html: `<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(66, 133, 244, 0.5);"></div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            })}
          />
        )}

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

        {/* Tambahkan komponen routing jika sedang dalam mode navigasi */}
        {isNavigating && userLocation && selectedLocation && (
          <RoutingMachine
            startPosition={userLocation}
            endPosition={[selectedLocation.lan, selectedLocation.lat]}
            isNavigating={isNavigating}
          />
        )}
      </MapContainer>

      {/* Sidebar */}
      <MapSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        location={selectedLocation}
        latestReport={
          selectedLocation ? getLatestReport(selectedLocation.id) : null
        }
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default Maps;
