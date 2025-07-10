// components/CoordinatePicker.tsx
"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface CoordinatePickerProps {
  value: [number, number];
  onChange: (coord: [number, number]) => void;
}

// Untuk mengatasi masalah ikon marker tidak muncul
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const LocationMarker = ({ onChange }: { onChange: (coord: [number, number]) => void }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onChange([lat, lng]);
    },
  });
  return null;
};

const CoordinatePicker = ({ value, onChange }: CoordinatePickerProps) => {
  const [position, setPosition] = useState<[number, number]>(value);

  useEffect(() => {
    setPosition(value);
  }, [value]);

  const detectLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      onChange(coords);
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={detectLocation}
        className="text-sm text-white bg-green-500 px-4 py-2 rounded hover:bg-green-600"
      >
        Gunakan Lokasi Saat Ini
      </button>

      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "300px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onChange={onChange} />
        <Marker position={position} />
      </MapContainer>

      <p className="text-sm text-gray-600">
        Koordinat terpilih: {position[0].toFixed(5)}, {position[1].toFixed(5)}
      </p>
    </div>
  );
};

export default CoordinatePicker;
