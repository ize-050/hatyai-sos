'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair } from 'lucide-react';

// Custom marker icon for selected location
const createLocationIcon = () => {
  return L.divIcon({
    className: 'custom-location-marker',
    html: `
      <div style="position: relative;">
        <div style="
          background-color: #FF3B30;
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 4px solid white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        "></div>
        <div style="
          position: absolute;
          top: 8px;
          left: 8px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to recenter map
function RecenterMap({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 0.8 });
    }
  }, [position, map]);
  
  return null;
}

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  className = '',
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const defaultCenter: [number, number] = [7.0086, 100.4747]; // Hatyai

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับ GPS');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        onLocationChange(lat, lng);
        setIsLocating(false);
      },
      (error) => {
        console.error('Location error:', error);
        alert('ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map */}
      <div className="w-full h-[250px] rounded-lg overflow-hidden border-2 border-gray-300">
        <MapContainer
          center={position || defaultCenter}
          zoom={position ? 16 : 13}
          className="w-full h-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <RecenterMap position={position} />
          
          {position && (
            <Marker 
              position={position} 
              icon={createLocationIcon()}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  handleLocationSelect(pos.lat, pos.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Crosshair overlay hint */}
      {!position && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
            👆 แตะบนแผนที่เพื่อเลือกตำแหน่ง
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="bg-white p-2 rounded-lg shadow-lg border hover:bg-gray-50 disabled:opacity-50"
          title="ใช้ตำแหน่งปัจจุบัน"
        >
          {isLocating ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Crosshair className="w-5 h-5 text-blue-600" />
          )}
        </button>
      </div>

      {/* Manual Lat/Lng Input */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600 block mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={position ? position[0] : ''}
            onChange={(e) => {
              const lat = parseFloat(e.target.value);
              if (!isNaN(lat)) {
                const lng = position ? position[1] : 100.4747;
                handleLocationSelect(lat, lng);
              }
            }}
            placeholder="7.0086"
            className="w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={position ? position[1] : ''}
            onChange={(e) => {
              const lng = parseFloat(e.target.value);
              if (!isNaN(lng)) {
                const lat = position ? position[0] : 7.0086;
                handleLocationSelect(lat, lng);
              }
            }}
            placeholder="100.4747"
            className="w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Selected location info */}
      {position && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">ตำแหน่งที่เลือก</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            💡 คลิกบนแผนที่ หรือลากหมุดเพื่อปรับตำแหน่ง
          </p>
        </div>
      )}
    </div>
  );
}
