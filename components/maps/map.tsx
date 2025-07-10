"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Location {
  lan: number; 
  lat: number; 
  type: string;
}

const Maps = () => {
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    const getLocations = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("locations")
        .select("lan,lat,type");

      if (error) {
        console.error("Error fetching locations:", error);
        return;
      }

      setLocations(data || []);
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

  console.log(locations)
  return (
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
          icon={customIcon} // Ganti ke defaultIcon jika gambar tidak muncul
        >
          <Popup>
            <b>Type:</b> {loc.type}<br />
            <b>Lat:</b> {loc.lat}, <b>Lng:</b> {loc.lan}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Maps;