'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { GOOGLE_MAPS_OPTIONS } from '@/lib/google-maps-config';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { SOSRequest } from '@/lib/types';
import { EvacuationCenter } from '@/lib/evacuation-types';
import { Phone, Clock, Users, Navigation, MapPin, ChevronUp, ChevronDown } from 'lucide-react';

const severityColors: Record<string, string> = {
  high: '#FF3B30',
  medium: '#FFCC00',
  low: '#34C759',
};

const helpTypeLabels: Record<string, string> = {
  food: '🍚 อาหาร/น้ำดื่ม',
  medical: '💊 ยา/การแพทย์',
  evacuation: '🚨 อพยพด่วน',
  boat: '🚤 ต้องการเรือ',
};

const severityLabels: Record<string, string> = {
  high: 'หนาแน่น',
  medium: 'ปานกลาง',
  low: 'เบาบาง',
};

interface ExtendedSOSRequest extends SOSRequest {
  hasChildren?: boolean;
  hasElderly?: boolean;
  hasDisabled?: boolean;
  hasPregnant?: boolean;
  peopleCount?: number;
}

interface MapComponentProps {
  requests: ExtendedSOSRequest[];
  shelters?: EvacuationCenter[];
  center?: [number, number];
  zoom?: number;
  showShelters?: boolean;
  showDensityZones?: boolean;
  zoneFilter?: 'all' | 'high' | 'medium' | 'low';
}

// Density zone configuration
interface DensityZone {
  center: { lat: number; lng: number };
  radius: number;
  density: 'high' | 'medium' | 'low';
  count: number;
}

const DENSITY_COLORS = {
  high: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#EF4444' },    // แดง
  medium: { fill: 'rgba(245, 158, 11, 0.3)', stroke: '#F59E0B' }, // เหลือง
  low: { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22C55E' },     // เขียว
};

// Calculate density zones based on pin clustering
const calculateDensityZones = (requests: ExtendedSOSRequest[], gridSize: number = 0.01): DensityZone[] => {
  if (requests.length === 0) return [];

  // Group requests into grid cells
  const grid: { [key: string]: ExtendedSOSRequest[] } = {};
  
  requests.forEach(req => {
    const gridX = Math.floor(req.latitude / gridSize);
    const gridY = Math.floor(req.longitude / gridSize);
    const key = `${gridX},${gridY}`;
    
    if (!grid[key]) grid[key] = [];
    grid[key].push(req);
  });

  // Convert grid cells to density zones
  const zones: DensityZone[] = [];
  
  Object.entries(grid).forEach(([, cellRequests]) => {
    if (cellRequests.length === 0) return;

    // Calculate center of the zone
    const centerLat = cellRequests.reduce((sum, r) => sum + r.latitude, 0) / cellRequests.length;
    const centerLng = cellRequests.reduce((sum, r) => sum + r.longitude, 0) / cellRequests.length;
    
    // Determine density level
    let density: 'high' | 'medium' | 'low';
    if (cellRequests.length >= 5) {
      density = 'high';
    } else if (cellRequests.length >= 3) {
      density = 'medium';
    } else {
      density = 'low';
    }

    // Calculate radius based on spread of points (min 200m, max 800m)
    const distances = cellRequests.map(r => 
      Math.sqrt(Math.pow(r.latitude - centerLat, 2) + Math.pow(r.longitude - centerLng, 2))
    );
    const maxDistance = Math.max(...distances);
    const radius = Math.max(200, Math.min(800, maxDistance * 111000 * 1.5)); // Convert to meters

    zones.push({
      center: { lat: centerLat, lng: centerLng },
      radius,
      density,
      count: cellRequests.length,
    });
  });

  // Sort by density (high first) so high density zones render on top
  return zones.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.density] - order[b.density];
  });
};

// Helper function to open Google Maps navigation
const openNavigation = (lat: number, lng: number) => {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
};

// Create custom marker icon as SVG data URL
const createSOSMarkerIcon = (color: string): google.maps.Icon => ({
  url: `data:image/svg+xml,${encodeURIComponent(`
    <svg width="24" height="32" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>
  `)}`,
  scaledSize: new google.maps.Size(24, 32),
  anchor: new google.maps.Point(12, 32),
});

const createShelterMarkerIcon = (status: 'open' | 'full' | 'closed'): google.maps.Icon => {
  const colors = {
    open: '#34C759',
    full: '#FFCC00',
    closed: '#8E8E93',
  };
  const color = colors[status];
  
  return {
    url: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="28" height="34" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="8" width="32" height="32" rx="6" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M18 14l10 8v12H8V22l10-8z" fill="white"/>
        <rect x="14" y="26" width="8" height="8" fill="${color}"/>
      </svg>
    `)}`,
    scaledSize: new google.maps.Size(28, 34),
    anchor: new google.maps.Point(14, 34),
  };
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

export default function MapComponent({
  requests,
  shelters = [],
  center = [7.0086, 100.4747],
  zoom = 13,
  showShelters = true,
  showDensityZones = true,
  zoneFilter = 'all',
}: MapComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ExtendedSOSRequest | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<EvacuationCenter | null>(null);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{ [key: string]: google.maps.Marker }>({});
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_OPTIONS);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Calculate density zones (memoized)
  const densityZones = useMemo(() => {
    if (showDensityZones && requests.length > 0) {
      return calculateDensityZones(requests);
    }
    return [];
  }, [requests, showDensityZones]);

  // Filter zones based on selected density level
  const filteredZones = useMemo(() => {
    if (zoneFilter === 'all') return densityZones;
    return densityZones.filter(zone => zone.density === zoneFilter);
  }, [densityZones, zoneFilter]);

  // Manage density zone circles
  useEffect(() => {
    // Clear existing circles
    circlesRef.current.forEach(circle => circle.setMap(null));
    circlesRef.current = [];

    // Only create circles if showDensityZones is true and map is ready
    if (!mapRef.current || !showDensityZones) return;

    // Create new circles
    filteredZones.forEach(zone => {
      const circle = new google.maps.Circle({
        map: mapRef.current,
        center: zone.center,
        radius: zone.radius,
        fillColor: DENSITY_COLORS[zone.density].fill,
        fillOpacity: 0.4,
        strokeColor: DENSITY_COLORS[zone.density].stroke,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: false,
        zIndex: zone.density === 'high' ? 1 : zone.density === 'medium' ? 2 : 3,
      });
      circlesRef.current.push(circle);
    });

    return () => {
      circlesRef.current.forEach(circle => circle.setMap(null));
      circlesRef.current = [];
    };
  }, [filteredZones, showDensityZones, isLoaded]);

  // Setup markers and clusterer when map is loaded
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.setMap(null));
    markersRef.current = {};
    
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    // Create SOS markers
    const sosMarkers: google.maps.Marker[] = [];
    requests.forEach((request) => {
      const marker = new google.maps.Marker({
        position: { lat: request.latitude, lng: request.longitude },
        icon: createSOSMarkerIcon(severityColors[request.severity]),
        title: request.name,
      });

      marker.addListener('click', () => {
        setSelectedRequest(request);
        setSelectedShelter(null);
        setSelectedId(request.id);
      });

      markersRef.current[request.id] = marker;
      sosMarkers.push(marker);
    });

    // Create clusterer
    clustererRef.current = new MarkerClusterer({
      map: mapRef.current,
      markers: sosMarkers,
      renderer: {
        render: ({ count, position }) => {
          let color = '#3B82F6';
          let size = 30;
          if (count >= 10) {
            color = '#EF4444';
            size = 50;
          } else if (count >= 5) {
            color = '#F59E0B';
            size = 40;
          }

          return new google.maps.Marker({
            position,
            icon: {
              url: `data:image/svg+xml,${encodeURIComponent(`
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="white" stroke-width="3"/>
                  <text x="${size/2}" y="${size/2 + 5}" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${count}</text>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(size, size),
              anchor: new google.maps.Point(size/2, size/2),
            },
            zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
          });
        },
      },
    });

    // Create shelter markers (not clustered)
    if (showShelters) {
      shelters.forEach((shelter) => {
        const marker = new google.maps.Marker({
          position: { lat: shelter.latitude, lng: shelter.longitude },
          map: mapRef.current,
          icon: createShelterMarkerIcon(shelter.status),
          title: shelter.name,
        });

        marker.addListener('click', () => {
          setSelectedShelter(shelter);
          setSelectedRequest(null);
          setSelectedId(shelter.id);
        });

        markersRef.current[`shelter-${shelter.id}`] = marker;
      });
    }

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.setMap(null));
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
    };
  }, [requests, shelters, showShelters, isLoaded]);

  const handleCaseClick = (request: ExtendedSOSRequest) => {
    setSelectedRequest(request);
    setSelectedShelter(null);
    setSelectedId(request.id);
    setIsExpanded(false);

    if (mapRef.current) {
      mapRef.current.panTo({ lat: request.latitude, lng: request.longitude });
      mapRef.current.setZoom(16);
    }
  };

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-red-500">ไม่สามารถโหลดแผนที่ได้</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">กำลังโหลดแผนที่...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Floating Card */}
      <div 
        className={`
          absolute z-[1000] transition-all duration-300 ease-in-out
          left-2 right-2 md:left-auto md:right-4 md:w-80
          ${isExpanded 
            ? 'top-2 bottom-20 md:bottom-4' 
            : 'top-2'
          }
        `}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Card Header */}
        <div 
          className={`bg-white shadow-lg border cursor-pointer ${isExpanded ? 'rounded-t-xl' : 'rounded-xl'}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="font-bold text-gray-800">SOS</span>
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Card Body */}
        {isExpanded && (
          <div className="bg-white shadow-lg border-x border-b max-h-[calc(100%-52px)] overflow-y-auto">
            {requests.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                ไม่มีรายการ
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => handleCaseClick(request)}
                  className={`p-3 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedId === request.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: severityColors[request.severity] }}
                    />
                    <span className={`text-xs font-medium ${
                      request.severity === 'high' ? 'text-red-600' :
                      request.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {severityLabels[request.severity]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {helpTypeLabels[request.helpType]}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-gray-800 text-sm">{request.name}</h3>
                  
                  {(request.hasChildren || request.hasElderly || request.hasDisabled || request.hasPregnant) && (
                    <div className="flex items-center gap-1 mt-1">
                      {request.hasChildren && <span className="text-xs">👶</span>}
                      {request.hasElderly && <span className="text-xs">👴</span>}
                      {request.hasDisabled && <span className="text-xs">♿</span>}
                      {request.hasPregnant && <span className="text-xs">🤰</span>}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-blue-600">{request.phone}</span>
                    <span className="text-xs text-gray-400">
                      {request.createdAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                    request.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {request.status === 'pending' ? 'รอดำเนินการ' :
                     request.status === 'in_progress' ? 'กำลังช่วยเหลือ' : 'เสร็จสิ้น'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: center[0], lng: center[1] }}
        zoom={zoom}
        options={mapOptions}
        onLoad={onMapLoad}
        onClick={() => { if (isExpanded) setIsExpanded(false); }}
      >
        {/* Density Zones are managed via useEffect */}
        {/* SOS Request InfoWindow */}
        {selectedRequest && (
          <InfoWindow
            position={{ lat: selectedRequest.latitude, lng: selectedRequest.longitude }}
            onCloseClick={() => {
              setSelectedRequest(null);
              setSelectedId(null);
            }}
          >
            <div className="min-w-[200px] max-w-[280px]">
              <div className={`text-white text-xs font-bold px-2 py-1 rounded mb-2 ${
                selectedRequest.severity === 'high' ? 'bg-red-500' :
                selectedRequest.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                {severityLabels[selectedRequest.severity]} - {helpTypeLabels[selectedRequest.helpType]}
              </div>
              
              <h3 className="font-bold text-gray-800">{selectedRequest.name}</h3>
              
              {(selectedRequest.hasChildren || selectedRequest.hasElderly || selectedRequest.hasDisabled || selectedRequest.hasPregnant) && (
                <div className="flex items-center gap-1 mt-1 p-1 bg-orange-100 rounded">
                  {selectedRequest.hasChildren && <span title="มีเด็กเล็ก">👶</span>}
                  {selectedRequest.hasElderly && <span title="มีผู้สูงอายุ">👴</span>}
                  {selectedRequest.hasDisabled && <span title="มีผู้พิการ">♿</span>}
                  {selectedRequest.hasPregnant && <span title="มีหญิงตั้งครรภ์">🤰</span>}
                  {selectedRequest.peopleCount && selectedRequest.peopleCount > 1 && (
                    <span className="text-xs text-orange-700 ml-1">({selectedRequest.peopleCount} คน)</span>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <Phone className="w-3 h-3" />
                <a href={`tel:${selectedRequest.phone}`} className="text-blue-600 hover:underline">
                  {selectedRequest.phone}
                </a>
              </div>
              
              {selectedRequest.description && (
                <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                  {selectedRequest.description}
                </p>
              )}
              
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                <Clock className="w-3 h-3" />
                {selectedRequest.createdAt.toLocaleString('th-TH')}
              </div>
              
              <div className="mt-2 pt-2 border-t">
                <span className={`text-xs px-2 py-1 rounded ${
                  selectedRequest.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                  selectedRequest.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {selectedRequest.status === 'pending' ? 'รอดำเนินการ' :
                   selectedRequest.status === 'in_progress' ? 'กำลังช่วยเหลือ' : 'เสร็จสิ้น'}
                </span>
              </div>
              
              <button
                onClick={() => openNavigation(selectedRequest.latitude, selectedRequest.longitude)}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
              >
                <Navigation className="w-4 h-4" />
                นำทาง Google Maps
              </button>
            </div>
          </InfoWindow>
        )}

        {/* Shelter InfoWindow */}
        {selectedShelter && (
          <InfoWindow
            position={{ lat: selectedShelter.latitude, lng: selectedShelter.longitude }}
            onCloseClick={() => {
              setSelectedShelter(null);
              setSelectedId(null);
            }}
          >
            <div className="min-w-[220px] max-w-[280px]">
              <div className={`text-white text-xs font-bold px-2 py-1 rounded mb-2 ${
                selectedShelter.status === 'open' ? 'bg-green-500' :
                selectedShelter.status === 'full' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}>
                🏠 ศูนย์อพยพ - {selectedShelter.status === 'open' ? 'เปิดรับ' : selectedShelter.status === 'full' ? 'เต็ม' : 'ปิด'}
              </div>
              
              <h3 className="font-bold text-gray-800">{selectedShelter.name}</h3>
              
              {selectedShelter.address && (
                <p className="text-xs text-gray-500 mt-1">{selectedShelter.address}</p>
              )}
              
              <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded">
                <Users className="w-4 h-4 text-blue-600" />
                <div className="text-sm flex-1">
                  <span className="font-medium">{selectedShelter.current_occupancy}</span>
                  <span className="text-gray-500">/{selectedShelter.capacity} คน</span>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full ${
                        selectedShelter.current_occupancy / selectedShelter.capacity > 0.9 ? 'bg-red-500' :
                        selectedShelter.current_occupancy / selectedShelter.capacity > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((selectedShelter.current_occupancy / selectedShelter.capacity) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedShelter.has_food && <span className="text-xs bg-gray-100 px-1 rounded" title="อาหาร">🍚</span>}
                {selectedShelter.has_water && <span className="text-xs bg-gray-100 px-1 rounded" title="น้ำดื่ม">💧</span>}
                {selectedShelter.has_medical && <span className="text-xs bg-gray-100 px-1 rounded" title="ยา/พยาบาล">💊</span>}
                {selectedShelter.has_electricity && <span className="text-xs bg-gray-100 px-1 rounded" title="ไฟฟ้า">⚡</span>}
                {selectedShelter.has_toilet && <span className="text-xs bg-gray-100 px-1 rounded" title="ห้องน้ำ">🚽</span>}
                {selectedShelter.has_shower && <span className="text-xs bg-gray-100 px-1 rounded" title="ห้องอาบน้ำ">🚿</span>}
                {selectedShelter.has_bedding && <span className="text-xs bg-gray-100 px-1 rounded" title="ที่นอน">🛏️</span>}
                {selectedShelter.has_wifi && <span className="text-xs bg-gray-100 px-1 rounded" title="WiFi">📶</span>}
                {selectedShelter.accepts_pets && <span className="text-xs bg-gray-100 px-1 rounded" title="รับสัตว์เลี้ยง">🐕</span>}
              </div>
              
              {selectedShelter.contact_phone && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                  <Phone className="w-3 h-3" />
                  <a href={`tel:${selectedShelter.contact_phone}`} className="text-blue-600 hover:underline">
                    {selectedShelter.contact_phone}
                  </a>
                  {selectedShelter.contact_name && <span className="text-gray-400">({selectedShelter.contact_name})</span>}
                </div>
              )}
              
              {selectedShelter.notes && (
                <p className="text-xs text-gray-500 mt-2 p-2 bg-yellow-50 rounded">
                  📝 {selectedShelter.notes}
                </p>
              )}
              
              <button
                onClick={() => openNavigation(selectedShelter.latitude, selectedShelter.longitude)}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
              >
                <Navigation className="w-4 h-4" />
                นำทางไปศูนย์นี้
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
