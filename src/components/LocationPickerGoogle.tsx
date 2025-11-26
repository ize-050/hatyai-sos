'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { MapPin, Crosshair, Search, Maximize2, X, Check } from 'lucide-react';
import { GOOGLE_MAPS_OPTIONS } from '@/lib/google-maps-config';

interface LocationPickerGoogleProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

// Create custom marker icon
const createMarkerIcon = (): google.maps.Icon => ({
  url: `data:image/svg+xml,${encodeURIComponent(`
    <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C8.954 0 0 8.954 0 20c0 11.046 20 30 20 30s20-18.954 20-30C40 8.954 31.046 0 20 0z" fill="#FF3B30" stroke="white" stroke-width="3"/>
      <circle cx="20" cy="20" r="8" fill="white"/>
    </svg>
  `)}`,
  scaledSize: new google.maps.Size(40, 50),
  anchor: new google.maps.Point(20, 50),
});

export default function LocationPickerGoogle({
  latitude,
  longitude,
  onLocationChange,
  className = '',
}: LocationPickerGoogleProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  
  // Sync position when props change (e.g., from external GPS button)
  // Only update if props are different from current position
  const propsLat = latitude;
  const propsLng = longitude;
  const currentLat = position?.lat;
  const currentLng = position?.lng;
  
  if (propsLat && propsLng && (propsLat !== currentLat || propsLng !== currentLng)) {
    setPosition({ lat: propsLat, lng: propsLng });
  }
  
  // Pan map when position changes from props
  useEffect(() => {
    if (latitude && longitude && mapRef.current) {
      mapRef.current.panTo({ lat: latitude, lng: longitude });
      mapRef.current.setZoom(16);
    }
  }, [latitude, longitude]);
  
  const defaultCenter = { lat: 7.0086, lng: 100.4747 }; // Hatyai

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const fullscreenAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_OPTIONS);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onFullscreenAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    fullscreenAutocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setPosition({ lat, lng });
        onLocationChange(lat, lng);
        // Autocomplete handles the input value automatically
        
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(17);
        }
      }
    }
  }, [onLocationChange]);

  const onFullscreenPlaceChanged = useCallback(() => {
    if (fullscreenAutocompleteRef.current) {
      const place = fullscreenAutocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setPosition({ lat, lng });
        onLocationChange(lat, lng);
        // Autocomplete handles the input value automatically
        
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(17);
        }
      }
    }
  }, [onLocationChange]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setPosition({ lat, lng });
      onLocationChange(lat, lng);
    }
  }, [onLocationChange]);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setPosition({ lat, lng });
      onLocationChange(lat, lng);
    }
  }, [onLocationChange]);

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
        setPosition({ lat, lng });
        onLocationChange(lat, lng);
        
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(16);
        }
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

  // Update map center when props change (without setting state to avoid cascading renders)
  useEffect(() => {
    if (latitude && longitude && mapRef.current) {
      mapRef.current.panTo({ lat: latitude, lng: longitude });
      mapRef.current.setZoom(16);
    }
  }, [latitude, longitude]);

  if (loadError) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-[250px] rounded-lg overflow-hidden border-2 border-gray-300 flex items-center justify-center bg-gray-100">
          <p className="text-red-500 text-sm">ไม่สามารถโหลดแผนที่ได้</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-[250px] rounded-lg overflow-hidden border-2 border-gray-300 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 text-sm">กำลังโหลดแผนที่...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
          {/* Fullscreen Header */}
          <div className="bg-blue-600 text-white p-3 flex items-center justify-between">
            <h3 className="font-bold">📍 เลือกตำแหน่งของคุณ</h3>
            <div className="flex gap-2">
              {position && (
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  ยืนยัน
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 hover:bg-blue-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Search */}
          <div className="p-3 bg-gray-100">
            <Autocomplete
              onLoad={onFullscreenAutocompleteLoad}
              onPlaceChanged={onFullscreenPlaceChanged}
              options={{
                componentRestrictions: { country: 'th' },
                fields: ['geometry', 'formatted_address', 'name'],
              }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  placeholder="ค้นหาสถานที่ เช่น ชื่อหมู่บ้าน, ถนน, ร้านค้า..."
                  className="w-full pl-10 pr-3 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </Autocomplete>
          </div>

          {/* Fullscreen Map */}
          <div className="flex-1 relative">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={position || defaultCenter}
              zoom={position ? 16 : 13}
              options={mapOptions}
              onLoad={onMapLoad}
              onClick={handleMapClick}
            >
              {position && (
                <Marker
                  position={position}
                  icon={createMarkerIcon()}
                  draggable={true}
                  onDragEnd={handleMarkerDragEnd}
                />
              )}
            </GoogleMap>

            {/* Fullscreen hint */}
            {!position && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/60 text-white px-4 py-3 rounded-xl text-base font-medium">
                  👆 แตะบนแผนที่เพื่อเลือกตำแหน่ง
                </div>
              </div>
            )}

            {/* Fullscreen GPS button */}
            <div className="absolute bottom-6 right-4">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isLocating}
                className="bg-white p-3 rounded-full shadow-lg border-2 hover:bg-gray-50 disabled:opacity-50"
                title="ใช้ตำแหน่งปัจจุบัน"
              >
                {isLocating ? (
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Crosshair className="w-6 h-6 text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Fullscreen Footer - Selected location */}
          {position && (
            <div className="p-3 bg-green-50 border-t-2 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">ตำแหน่งที่เลือก</span>
                </div>
                <span className="text-sm text-gray-500">
                  {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Normal View */}
      <div className={`relative ${className}`}>
        {/* Search Box */}
        <div className="mb-2">
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            componentRestrictions: { country: 'th' },
            fields: ['geometry', 'formatted_address', 'name'],
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="ค้นหาสถานที่ เช่น ชื่อหมู่บ้าน, ถนน, ร้านค้า..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </Autocomplete>
      </div>

      {/* Map */}
      <div className="w-full h-[250px] rounded-lg overflow-hidden border-2 border-gray-300">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={position || defaultCenter}
          zoom={position ? 16 : 13}
          options={mapOptions}
          onLoad={onMapLoad}
          onClick={handleMapClick}
        >
          {position && (
            <Marker
              position={position}
              icon={createMarkerIcon()}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
            />
          )}
        </GoogleMap>
      </div>

      {/* Crosshair overlay hint */}
      {!position && (
        <div className="absolute flex items-center justify-center pointer-events-none" style={{ top: '45px', left: 0, right: 0, height: '250px' }}>
          <div className="bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
            👆 แตะบนแผนที่เพื่อเลือกตำแหน่ง
          </div>
        </div>
      )}

      {/* Controls - GPS button */}
      <div className="absolute right-3" style={{ top: 'calc(45px + 200px)' }}>
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
            value={position ? position.lat : ''}
            onChange={(e) => {
              const lat = parseFloat(e.target.value);
              if (!isNaN(lat)) {
                const lng = position ? position.lng : 100.4747;
                setPosition({ lat, lng });
                onLocationChange(lat, lng);
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
            value={position ? position.lng : ''}
            onChange={(e) => {
              const lng = parseFloat(e.target.value);
              if (!isNaN(lng)) {
                const lat = position ? position.lat : 7.0086;
                setPosition({ lat, lng });
                onLocationChange(lat, lng);
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

      {/* Expand button hint */}
      {!position && (
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="mt-2 w-full py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
        >
          <Maximize2 className="w-4 h-4" />
          ขยายแผนที่เต็มจอเพื่อเลือกตำแหน่งง่ายขึ้น
        </button>
      )}
      </div>
    </>
  );
}
