"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import { MapSidebar } from "./sidebar";
import RoutingMachine from "./routing-machine";
import SearchLocation from "./search-location";
import { LocationType } from "@/types/location";

interface CleanlinessReport {
  id: number;
  reporter: string;
  score: number;
  grade: string;
  ai_description: string;
  created_at: Timestamp;
  location: string;
  reporter_name: string;
  email: string;
}

const LocationFinder = ({
  setUserLocation,
}: {
  setUserLocation: (position: [number, number]) => void;
}) => {
  const map = useMapEvents({
    locationfound(e) {
      const userPos: [number, number] = [e.latlng.lat, e.latlng.lng];
      setUserLocation(userPos);

      map.setView(userPos, 15);
    },
    locationerror(e) {
      console.error("Location error:", e.message);
    },
  });

  useEffect(() => {
    map.locate({
      setView: true,
      maxZoom: 15,
      timeout: 10000,
      enableHighAccuracy: true,
    });
  }, [map]);

  return null;
};

const Maps = () => {
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [cleanlinessReports, setCleanlinessReports] = useState<
    CleanlinessReport[]
  >([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(
    null
  );
  const [navigationTarget, setNavigationTarget] = useState<LocationType | null>(
    null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const [, setMapCenter] = useState<[number, number]>([-6.2, 106.8]); // Default Jakarta
  const [, setMapZoom] = useState(12);
  const [isLocationLoaded, setIsLocationLoaded] = useState(false);

  const [mapRef, setMapRef] = useState<L.Map | null>(null);

  useEffect(() => {
    const getLocations = async () => {
      const supabase = createClient();

      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select("id,lan,lat,type,name,address,created_at,img_url");

      if (locationsError) {
        console.error("Error fetching locations:", locationsError);
        return;
      }

      const { data: reportsData, error: reportsError } = await supabase
        .from("cleanliness_reports_with_user")
        .select(
          "id,reporter,score,grade,ai_description,created_at,location,reporter_name,email"
        );

      if (reportsError) {
        console.error("Error fetching cleanliness reports:", reportsError);
        return;
      }

      setLocations(locationsData || []);
      setCleanlinessReports(reportsData || []);
    };

    getLocations();
  }, []);

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
          setIsLocationLoaded(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    }
  }, [isLocationLoaded]);

  const dirtyIcon = L.icon({
    iconUrl: "/dirty.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    shadowUrl: undefined,
  });

  const cleanIcon = L.icon({
    iconUrl: "/clean.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    shadowUrl: undefined,
  });

  const navigationTargetIcon = L.icon({
    iconUrl: "/dirty.png", // Gunakan ikon sesuai dengan tipe lokasi
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    shadowUrl: undefined,
    className: "navigation-target-marker",
  });

  const getLatestReport = (locationId: string) => {
    const locationReports = cleanlinessReports.filter(
      (report) => report.location === locationId
    );
    if (locationReports.length === 0) return null;

    return locationReports.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };

  // Fungsi untuk menentukan apakah lokasi bersih berdasarkan grade
  const isCleanLocation = (locationId: string) => {
    const report = getLatestReport(locationId);
    return report && (report.grade === "A" || report.grade === "B");
  };
  const handleMarkerClick = (location: LocationType) => {
    setSelectedLocation(location);
    setIsSidebarOpen(true);

    if (isNavigating) {
      setNavigationTarget(location);
    }
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    if (!isNavigating) {
      setSelectedLocation(null);
    }
  };

  const handleNavigate = () => {
    if (selectedLocation && userLocation) {
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
      setNavigationTarget(selectedLocation);
    } else {
      alert("Tidak dapat memulai navigasi. Pastikan lokasi Anda terdeteksi.");
    }
  };

  const handleCancelNavigation = () => {
    setIsNavigating(false);
    setNavigationTarget(null);
  };

  const handleSearchSelect = (loc: LocationType) => {
    setSelectedLocation(loc);
    setIsSidebarOpen(true);

    if (isNavigating) {
      setNavigationTarget(loc);
    }

    if (mapRef) {
      mapRef.setView([loc.lan, loc.lat], 16, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* CSS untuk styling marker navigasi */}
      <style jsx>{`
        .navigation-target-marker {
          filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.7));
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>

      {/* Search input di pojok kiri atas */}
      <div className="absolute top-4 left-4 z-[1000]">
        <SearchLocation onSelect={handleSearchSelect} />
      </div>

      {/* Tombol Batalkan Navigasi di bawah tengah */}
      {isNavigating && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000]">
          <button
            onClick={handleCancelNavigation}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>Batalkan Navigasi</span>
          </button>
        </div>
      )}

      <MapContainer
        zoomControl={false}
        center={[-6.2, 106.8]}
        zoom={12}
        className="h-screen w-screen z-10"
        ref={(mapInstance) => {
          if (mapInstance && mapInstance instanceof L.Map) {
            setMapRef(mapInstance);
          }
        }}
      >
        <ZoomControl position="bottomright" />
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

        {locations.map((loc, index) => {
          // Tentukan apakah lokasi bersih berdasarkan grade
          const isClean = isCleanLocation(loc.id);

          // Pilih ikon berdasarkan hasil pengecekan grade
          const locationIcon = isClean ? cleanIcon : dirtyIcon;

          // Ikon untuk target navigasi
          const navIcon = L.icon({
            iconUrl: isClean ? "/clean.png" : "/dirty.png",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20],
            shadowUrl: undefined,
            className: "navigation-target-marker",
          });

          return (
            <Marker
              key={index}
              position={[loc.lan, loc.lat]}
              icon={
                isNavigating && navigationTarget?.id === loc.id
                  ? navIcon
                  : locationIcon
              }
              eventHandlers={{
                click: () => handleMarkerClick(loc),
              }}
            />
          );
        })}

        {/* Gunakan navigationTarget untuk routing - DIPERBAIKI */}
        {isNavigating && userLocation && navigationTarget && (
          <RoutingMachine
            startPosition={userLocation}
            endPosition={[navigationTarget.lan, navigationTarget.lat]}
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
        isNavigating={isNavigating}
      />
    </div>
  );
};

export default Maps;
