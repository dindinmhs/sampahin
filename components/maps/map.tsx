"use client";
// map.tsx
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  ZoomControl,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import { MapSidebar } from "./sidebar";
import RoutingMachine from "./routing-machine";
import SearchLocation from "./search-location";
import { LocationCleanerType, LocationType } from "@/types/location";
import CategoryFilter from "./category-filter";
import ChatSidebar from "@/components/chat-forum/chat-sidebar";
import { Info, Satellite, Map, MapPin, MessageCircle } from "lucide-react"; // Tambahkan import ini
import LegendPopup from "./legend-popup";
import ChatBotFloating from "./chatbot";

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
    // Inisialisasi lokasi pertama kali
    map.locate({
      setView: true,
      maxZoom: 15,
      timeout: 10000,
      enableHighAccuracy: true,
    });

    // Tambahkan watch position untuk memperbarui lokasi secara real-time
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const userPos: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(userPos);
      },
      (error) => {
        console.error("Geolocation watch error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Selalu dapatkan posisi terbaru
      }
    );

    // Bersihkan watch position saat komponen unmount
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [map, setUserLocation]);

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
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "clean" | "dirty" | "cleaning"
  >("all");
  const [locationCleaners, setLocationCleaners] = useState<
    LocationCleanerType[]
  >([]);

  // Tambahkan state untuk chat forum
  const [isChatOpen, setIsChatOpen] = useState(false);

  // State untuk Google Maps
  const [showGoogleMapsOption, setShowGoogleMapsOption] = useState(false);

  // Tambahkan state untuk legend popup
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // State untuk mode peta (satelit/normal)
  const [mapMode, setMapMode] = useState<"normal" | "satellite">("normal");

  const [isChatBotOpen, setIsChatBotOpen] = useState(false);

  const [highlightedLocations, setHighlightedLocations] = useState<string[]>([]);
  const [isHighlightMode, setIsHighlightMode] = useState(false);

  const handleOpenChatBot = () => {
    setIsChatBotOpen(true);
  };

  const handleCloseChatBot = () => {
    setIsChatBotOpen(false);
  };

  // Handler untuk legend
  const handleOpenLegend = () => {
    setIsLegendOpen(true);
  };

  const handleCloseLegend = () => {
    setIsLegendOpen(false);
  };

  // Fungsi untuk mengambil data lokasi dan laporan kebersihan
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

  // Mengambil data lokasi saat komponen dimuat
  useEffect(() => {
    getLocations();

    // Setup real-time subscription untuk memperbarui data lokasi
    const supabase = createClient();

    // Subscribe ke perubahan pada tabel locations
    const locationsSubscription = supabase
      .channel("locations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locations" },
        () => {
          // Refresh data saat ada perubahan
          getLocations();
        }
      )
      .subscribe();

    // Subscribe ke perubahan pada tabel cleanliness_reports
    const reportsSubscription = supabase
      .channel("reports-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleanliness_reports" },
        () => {
          // Refresh data saat ada perubahan
          getLocations();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(locationsSubscription);
      supabase.removeChannel(reportsSubscription);
    };
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

  useEffect(() => {
    const getLocationCleaners = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("location_cleaners_with_name")
        .select("id,location_id,user_id,cleaner_name");
      if (!error) setLocationCleaners(data || []);
    };
    getLocationCleaners();
  }, [selectedLocation, isSidebarOpen]);

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

  const cleaningIcon = L.icon({
    iconUrl: "/cleaning.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    shadowUrl: undefined,
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

    // Zoom dan fokus ke lokasi yang diklik
    if (mapRef) {
      mapRef.setView([location.lan, location.lat], 16, { animate: true });
    }

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
    setShowGoogleMapsOption(false);
  };

  // Fungsi untuk membuka Google Maps
  const handleOpenGoogleMaps = useCallback(
    (start: [number, number], end: [number, number]) => {
      const googleMapsUrl = `https://www.google.com/maps/dir/${start[0]},${start[1]}/${end[0]},${end[1]}`;
      window.open(googleMapsUrl, "_blank");
    },
    []
  );

  // Handler untuk menampilkan opsi Google Maps
  const handleShowGoogleMapsOption = useCallback(() => {
    setShowGoogleMapsOption(true);
  }, []);

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

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const handleLocationDetails = (locationId: string, focusMap: boolean) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      setIsSidebarOpen(true);
      
      if (focusMap && mapRef) {
        mapRef.setView([location.lan, location.lat], 16, { animate: true });
      }
    }
  };

  const handleNavigateToLocation = (locationId: string, transportMode: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location && userLocation) {
      console.log('🧭 Starting navigation to:', location.name, 'Mode:', transportMode);
      
      setSelectedLocation(location);
      setNavigationTarget(location);
      setIsNavigating(true);
      setIsSidebarOpen(true); // Open sidebar to show location details
      
      // Focus map to show both user location and destination
      if (mapRef) {
        const bounds = L.latLngBounds([userLocation, [location.lan, location.lat]]);
        mapRef.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      console.error('❌ Cannot navigate: location not found or user location unavailable');
    }
  };

  const handleHighlightLocations = (locationIds: string[], highlightType: string) => {
    console.log('🔦 Highlighting locations:', locationIds, 'Type:', highlightType);
    
    setHighlightedLocations(locationIds);
    setIsHighlightMode(true);
    
    // Focus map to show highlighted locations
    if (mapRef && locationIds.length > 0) {
      const highlightedLocs = locations.filter(loc => locationIds.includes(loc.id));
      
      if (highlightedLocs.length === 1) {
        // Single location - zoom to it
        mapRef.setView([highlightedLocs[0].lan, highlightedLocs[0].lat], 16, { animate: true });
      } else if (highlightedLocs.length > 1) {
        // Multiple locations - fit bounds
        const bounds = L.latLngBounds(highlightedLocs.map(loc => [loc.lan, loc.lat]));
        mapRef.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    
    // Auto remove highlight after 10 seconds
    setTimeout(() => {
      setHighlightedLocations([]);
      setIsHighlightMode(false);
      console.log('🔦 Highlight mode ended');
    }, 10000);
  };

  const handleSetMapFilter = (filter: string) => {
    setCategoryFilter(filter as "all" | "clean" | "dirty" | "cleaning");
  };

  const handleFindNearby = (coordinates?: [number, number], radiusKm?: number, filterType?: string) => {
    const searchCenter = coordinates || userLocation;
    if (!searchCenter) return;

    // Filter locations by distance and type
    const nearbyLocations = locations.filter(loc => {
      const distance = getDistanceMeters(
        searchCenter[0], searchCenter[1],
        loc.lan, loc.lat
      ) / 1000; // Convert to km

      const withinRadius = distance <= (radiusKm || 5);
      const matchesType = !filterType || 
        (filterType === 'clean' && isCleanLocation(loc.id)) ||
        (filterType === 'dirty' && !isCleanLocation(loc.id) && loc.type !== 'cleaning') ||
        (filterType === 'cleaning' && loc.type === 'cleaning');

      return withinRadius && matchesType;
    });

    // Highlight nearby locations
    setHighlightedLocations(nearbyLocations.map(loc => loc.id));
    
    // Focus map to show area
    if (mapRef && nearbyLocations.length > 0) {
      const bounds = L.latLngBounds(nearbyLocations.map(loc => [loc.lan, loc.lat]));
      mapRef.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon1-lon2) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  return (
    <div className="relative w-full h-full">
      {/* CSS untuk styling marker navigasi */}
      <style jsx>{`
        .highlighted-marker {
          filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)) brightness(1.3);
          animation: highlightPulse 6s infinite;
          z-index: 1000 !important;
        }

        .non-highlighted-marker {
          opacity: 0.3;
          filter: grayscale(50%);
        }

        .navigation-target-marker {
          filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.7));
          animation: pulse 2s infinite;
        }

        @keyframes highlightPulse {
          0% {
            transform: scale(1);
            filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)) brightness(1.3);
          }
          50% {
            transform: scale(1.2);
            filter: drop-shadow(0 0 25px rgba(255, 215, 0, 1)) brightness(1.5);
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)) brightness(1.3);
          }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* searchbar */}
      <div className="absolute top-4 left-4 right-4 z-[40] w-1/2 sm:w-64 md:w-80 lg:w-96">
        <SearchLocation onSelect={handleSearchSelect} />
      </div>

      {/* Legend Button - posisi kanan bawah */}
      <div className="absolute bottom-24 right-2 z-[50]">
        <button
          onClick={handleOpenLegend}
          className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 p-2 rounded-lg shadow-md transition-colors flex items-center justify-center"
          title="Legenda"
        >
          <Info size={20} />
        </button>
      </div>

      <div className="absolute bottom-60 right-2 z-[50]">
        <button
          onClick={handleOpenChatBot}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors flex items-center justify-center"
          title="Tanya AI Assistant"
        >
          <MessageCircle size={24} />
        </button>
      </div>
      {isChatBotOpen && (
        <ChatBotFloating 
          isOpen={isChatBotOpen} 
          onToggle={handleCloseChatBot}
          onLocationDetails={handleLocationDetails}
          onNavigate={handleNavigateToLocation}
          onHighlightLocations={handleHighlightLocations}
          onSetMapFilter={handleSetMapFilter}
          onFindNearby={handleFindNearby}
          userLocation={userLocation ?? undefined}
        />
      )}

      {/* Map Mode Toggle Button - posisi kanan bawah di atas legend */}
      <div className="absolute bottom-36 right-2 z-[50]">
        <button
          onClick={() =>
            setMapMode(mapMode === "normal" ? "satellite" : "normal")
          }
          className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 p-2 rounded-lg shadow-md transition-colors flex items-center justify-center"
          title={
            mapMode === "normal"
              ? "Beralih ke Mode Satelit"
              : "Beralih ke Mode Normal"
          }
        >
          {mapMode === "normal" ? <Satellite size={20} /> : <Map size={20} />}
        </button>
      </div>

      {/* Locate Me Button - posisi kanan bawah di atas map mode toggle */}
      <div className="absolute bottom-48 right-2 z-[50]">
        <button
          onClick={() => {
            if (userLocation && mapRef) {
              mapRef.setView(userLocation, 16, { animate: true });
            }
          }}
          className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 p-2 rounded-lg shadow-md transition-colors flex items-center justify-center"
          title="Temukan Lokasi Saya"
        >
          <MapPin size={20} />
        </button>
      </div>

      <div className="absolute top-16 sm:top-20 md:top-4 md:left-1/2 md:transform md:-translate-x-1/2 left-4 md:right-auto z-20 md:z-[60]">
        <CategoryFilter
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
        />
      </div>

      {/* Tombol Batalkan Navigasi di bawah tengah */}
      {isNavigating && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] flex flex-col items-center space-y-3">
          {/* Tombol Google Maps - tampil setelah route ditemukan */}
          {showGoogleMapsOption && userLocation && navigationTarget && (
            <button
              onClick={() =>
                handleOpenGoogleMaps(userLocation, [
                  navigationTarget.lan,
                  navigationTarget.lat,
                ])
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>Buka di Google Maps</span>
            </button>
          )}

          {/* Tombol Batalkan Navigasi */}
          <button
            onClick={handleCancelNavigation}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>Batalkan Navigasi</span>
          </button>
        </div>
      )}

      {isHighlightMode && highlightedLocations.length > 0 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] bg-yellow-500 text-white px-4 py-2 rounded-full shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold text-sm">
              Menyorot {highlightedLocations.length} lokasi
            </span>
          </div>
        </div>
      )}

      <MapContainer
        zoomControl={false}
        center={[-6.2, 106.8]}
        minZoom={4}
        zoom={12}
        className="h-screen w-screen z-10"
        ref={(mapInstance) => {
          if (mapInstance && mapInstance instanceof L.Map) {
            setMapRef(mapInstance);
          }
        }}
      >
        <ZoomControl position="bottomright" />
        {mapMode === "normal" ? (
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* Komponen untuk mendapatkan lokasi pengguna */}
        <LocationFinder setUserLocation={setUserLocation} />

        {/* Tampilkan marker untuk lokasi pengguna jika tersedia */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: "user-location-marker",
              html: `
                <div style="position: relative;">
                  <div class="user-location-pulse"></div>
                  <div style="
                    background-color: #4285F4;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 0 10px rgba(66, 133, 244, 0.5);
                    position: relative;
                    z-index: 2;
                  "></div>
                </div>
              `,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            })}
          />
        )}

        {locations.map((loc, index) => {
          // Tentukan apakah lokasi bersih berdasarkan grade
          const isClean = isCleanLocation(loc.id);

          // Filter berdasarkan kategori yang dipilih (kecuali dalam highlight mode)
          if (!isHighlightMode) {
            if (categoryFilter === "clean" && (!isClean || loc.type === "cleaning")) return null;
            if (categoryFilter === "dirty" && (isClean || loc.type === "cleaning")) return null;
            if (categoryFilter === "cleaning" && loc.type !== "cleaning") return null;
          }

          // Dalam highlight mode, hanya tampilkan lokasi yang di-highlight
          if (isHighlightMode && !highlightedLocations.includes(loc.id)) {
            return null;
          }

          // Pilih ikon berdasarkan tipe lokasi
          let locationIcon;
          if (loc.type === "cleaning") {
            locationIcon = cleaningIcon;
          } else {
            locationIcon = isClean ? cleanIcon : dirtyIcon;
          }

          // Ikon untuk target navigasi
          const navIcon = L.icon({
            iconUrl: loc.type === "cleaning" ? "/cleaning.png" : isClean ? "/clean.png" : "/dirty.png",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20],
            shadowUrl: undefined,
            className: "navigation-target-marker",
          });

          // Ikon untuk highlight
          const highlightIcon = L.icon({
            iconUrl: loc.type === "cleaning" ? "/cleaning.png" : isClean ? "/clean.png" : "/dirty.png",
            iconSize: [45, 45],
            iconAnchor: [22.5, 22.5],
            popupAnchor: [0, -22.5],
            shadowUrl: undefined,
            className: "highlighted-marker",
          });

          // Determine which icon to use
          let finalIcon = locationIcon;
          if (isNavigating && navigationTarget?.id === loc.id) {
            finalIcon = navIcon;
          } else if (isHighlightMode && highlightedLocations.includes(loc.id)) {
            finalIcon = highlightIcon;
          }

          return (
            <div key={`location-${loc.id}-${index}`}>
              {/* Tampilkan Circle hanya jika lokasi ini dipilih */}
              {selectedLocation && selectedLocation.id === loc.id && (
                <Circle
                  center={[loc.lan, loc.lat]}
                  radius={100}
                  pathOptions={{
                    color: loc.type === "cleaning" ? "#FFA500" : isClean ? "#22c55e" : "#ef4444",
                    fillColor: loc.type === "cleaning" ? "#FFA50033" : isClean ? "#22c55e33" : "#ef444433",
                    fillOpacity: 0.9,
                    weight: 0,
                  }}
                />
              )}
              
              {/* Highlight Circle for highlighted locations */}
              {isHighlightMode && highlightedLocations.includes(loc.id) && (
                <Circle
                  center={[loc.lan, loc.lat]}
                  radius={200}
                  pathOptions={{
                    color: "#FFD700",
                    fillColor: "#FFD70033",
                    fillOpacity: 0.6,
                    weight: 3,
                    dashArray: "10, 10",
                  }}
                />
              )}
              <Marker
                position={[loc.lan, loc.lat]}
                icon={finalIcon}
                eventHandlers={{
                  click: () => handleMarkerClick(loc),
                }}
              />
            </div>
          );
        })}

        {/* Gunakan navigationTarget untuk routing - DIPERBAIKI */}
        {isNavigating && userLocation && navigationTarget && (
          <RoutingMachine
            startPosition={userLocation}
            endPosition={[navigationTarget.lan, navigationTarget.lat]}
            isNavigating={isNavigating}
            onOpenGoogleMaps={handleShowGoogleMapsOption}
            triggeredByAI={true} // Indicate this was triggered by AI
          />
        )}
      </MapContainer>

      {/* Sidebar */}
      <MapSidebar
        userLocation={userLocation}
        locationCleaners={locationCleaners}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        location={selectedLocation}
        latestReport={
          selectedLocation ? getLatestReport(selectedLocation.id) : null
        }
        onNavigate={handleNavigate}
        isNavigating={isNavigating}
        // onOpenChat={handleOpenChat} // Tambahkan prop
      />

      {/* Chat Sidebar */}
      <ChatSidebar
        reportId={selectedLocation?.id || ""}
        locationName={selectedLocation?.name || ""}
        isOpen={isChatOpen && selectedLocation !== null}
        onClose={handleCloseChat}
      />

      {/* Legend Popup */}
      <LegendPopup isOpen={isLegendOpen} onClose={handleCloseLegend} />
    </div>
  );
};

export default Maps;