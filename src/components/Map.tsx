'use client';

import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SOSRequest } from '@/lib/types';
import { EvacuationCenter } from '@/lib/evacuation-types';
import { Phone, Clock, Users, Navigation, MapPin, ChevronUp, ChevronDown } from 'lucide-react';

// SOS Marker Icon (teardrop shape)
const createSOSIcon = (color: string, icons: string[] = []) => {
  const iconsHtml = icons.length > 0 
    ? `<div style="
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 2px 4px;
        border-radius: 8px;
        font-size: 12px;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        z-index: 1000;
      ">${icons.join('')}</div>`
    : '';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        ${iconsHtml}
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// Evacuation Center Icon (house/building shape)
const createShelterIcon = (status: 'open' | 'full' | 'closed') => {
  const colors = {
    open: '#34C759',
    full: '#FFCC00',
    closed: '#8E8E93',
  };
  const color = colors[status];

  return L.divIcon({
    className: 'shelter-marker',
    html: `
      <div style="position: relative;">
        <div style="
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          background: white;
          padding: 1px 4px;
          border-radius: 4px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        ">🏠</div>
        <div style="
          background-color: ${color};
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22" fill="none"></polyline>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
};

const severityColors = {
  high: '#FF3B30',
  medium: '#FFCC00',
  low: '#34C759',
};

const helpTypeLabels = {
  food: '🍚 อาหาร/น้ำดื่ม',
  medical: '💊 ยา/การแพทย์',
  evacuation: '🚨 อพยพด่วน',
  boat: '🚤 ต้องการเรือ',
};

const severityLabels = {
  high: 'วิกฤต',
  medium: 'ปานกลาง',
  low: 'ไม่เร่งด่วน',
};

// Custom cluster icon
const createClusterCustomIcon = (cluster: { getChildCount: () => number }) => {
  const count = cluster.getChildCount();
  let size = 30;
  let color = '#3B82F6'; // blue

  if (count >= 10) {
    size = 50;
    color = '#EF4444'; // red
  } else if (count >= 5) {
    size = 40;
    color = '#F59E0B'; // yellow
  }

  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size, true),
  });
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
}

// Component to handle map fly to location and open popup
function FlyToLocation({ 
  position, 
  trigger,
  markerRefs,
  selectedId,
  clusterGroupRef
}: { 
  position: [number, number] | null; 
  trigger: number;
  markerRefs: React.MutableRefObject<{ [key: string]: L.Marker | null }>;
  selectedId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clusterGroupRef: React.MutableRefObject<any>;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (position && trigger > 0 && selectedId) {
      const marker = markerRefs.current[selectedId];
      const clusterGroup = clusterGroupRef.current;
      
      if (marker && clusterGroup) {
        // Zoom to marker and spiderfy if in cluster
        clusterGroup.zoomToShowLayer(marker, () => {
          // Open popup after zoom/spiderfy animation completes
          setTimeout(() => {
            marker.openPopup();
          }, 300);
        });
      } else {
        // Fallback: just fly to position
        map.flyTo(position, 16, { duration: 0.8 });
      }
    }
  }, [position, trigger, selectedId, map, markerRefs, clusterGroupRef]);
  
  return null;
}

// Helper function to open Google Maps navigation
const openNavigation = (lat: number, lng: number) => {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
};

export default function MapComponent({ 
  requests, 
  shelters = [],
  center = [7.0086, 100.4747], // Hatyai center
  zoom = 13,
  showShelters = true,
}: MapComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [flyToPosition, setFlyToPosition] = useState<[number, number] | null>(null);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterGroupRef = useRef<any>(null);

  const handleCaseClick = (request: ExtendedSOSRequest) => {
    setFlyToPosition([request.latitude, request.longitude]);
    setFlyTrigger(prev => prev + 1);
    setSelectedId(request.id);
    setIsExpanded(false); // ปิด card หลังคลิก
  };

  return (
    <div className="relative w-full h-full">
      {/* Floating Card */}
      <div className={`
        absolute z-[1000] transition-all duration-300 ease-in-out
        left-2 right-2 md:left-auto md:right-4 md:w-80
        ${isExpanded 
          ? 'top-2 bottom-20 md:bottom-4' 
          : 'top-2'
        }
      `}>
        {/* Card Header - Always visible */}
        <div 
          className="bg-white rounded-t-xl shadow-lg border cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="font-bold text-gray-800">รายการ SOS</span>
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Card Body - Expandable */}
        {isExpanded && (
          <div className="bg-white rounded-b-xl shadow-lg border-x border-b max-h-[calc(100%-52px)] overflow-y-auto">
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
                  {/* Severity Badge */}
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
                  
                  {/* Name */}
                  <h3 className="font-medium text-gray-800 text-sm">{request.name}</h3>
                  
                  {/* Vulnerable Icons */}
                  {(request.hasChildren || request.hasElderly || request.hasDisabled || request.hasPregnant) && (
                    <div className="flex items-center gap-1 mt-1">
                      {request.hasChildren && <span className="text-xs">👶</span>}
                      {request.hasElderly && <span className="text-xs">👴</span>}
                      {request.hasDisabled && <span className="text-xs">♿</span>}
                      {request.hasPregnant && <span className="text-xs">🤰</span>}
                    </div>
                  )}
                  
                  {/* Phone & Time */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-blue-600">{request.phone}</span>
                    <span className="text-xs text-gray-400">
                      {request.createdAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {/* Status */}
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

      {/* Map */}
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      >
        <FlyToLocation 
          position={flyToPosition} 
          trigger={flyTrigger} 
          markerRefs={markerRefs}
          selectedId={selectedId}
          clusterGroupRef={clusterGroupRef}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      
      {/* SOS Request Markers - with clustering */}
      <MarkerClusterGroup
        ref={clusterGroupRef}
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
      >
        {requests.map((request) => (
          <Marker
            key={request.id}
            position={[request.latitude, request.longitude]}
            ref={(ref) => { markerRefs.current[request.id] = ref; }}
            icon={createSOSIcon(
              severityColors[request.severity],
              [
                request.hasChildren ? '👶' : '',
                request.hasElderly ? '👴' : '',
                request.hasDisabled ? '♿' : '',
                request.hasPregnant ? '🤰' : '',
              ].filter(Boolean)
            )}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className={`text-white text-xs font-bold px-2 py-1 rounded mb-2 ${
                  request.severity === 'high' ? 'bg-red-500' :
                  request.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  {severityLabels[request.severity]} - {helpTypeLabels[request.helpType]}
                </div>
                
                <h3 className="font-bold text-gray-800">{request.name}</h3>
                
                {/* Vulnerable People Icons */}
                {(request.hasChildren || request.hasElderly || request.hasDisabled || request.hasPregnant) && (
                  <div className="flex items-center gap-1 mt-1 p-1 bg-orange-100 rounded">
                    {request.hasChildren && <span title="มีเด็กเล็ก">👶</span>}
                    {request.hasElderly && <span title="มีผู้สูงอายุ">👴</span>}
                    {request.hasDisabled && <span title="มีผู้พิการ">♿</span>}
                    {request.hasPregnant && <span title="มีหญิงตั้งครรภ์">🤰</span>}
                    {request.peopleCount && request.peopleCount > 1 && (
                      <span className="text-xs text-orange-700 ml-1">({request.peopleCount} คน)</span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <Phone className="w-3 h-3" />
                  <a href={`tel:${request.phone}`} className="text-blue-600 hover:underline">
                    {request.phone}
                  </a>
                </div>
                
                {request.description && (
                  <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                    {request.description}
                  </p>
                )}
                
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                  <Clock className="w-3 h-3" />
                  {request.createdAt.toLocaleString('th-TH')}
                </div>
                
                <div className="mt-2 pt-2 border-t flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${
                    request.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {request.status === 'pending' ? 'รอดำเนินการ' :
                     request.status === 'in_progress' ? 'กำลังช่วยเหลือ' : 'เสร็จสิ้น'}
                  </span>
                </div>
                
                {/* Navigation Button */}
                <button
                  onClick={() => openNavigation(request.latitude, request.longitude)}
                  className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  นำทาง Google Maps
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      {/* Evacuation Center Markers */}
      {showShelters && shelters.map((shelter) => (
        <Marker
          key={shelter.id}
          position={[shelter.latitude, shelter.longitude]}
          icon={createShelterIcon(shelter.status)}
        >
          <Popup>
            <div className="min-w-[220px]">
              {/* Status Badge */}
              <div className={`text-white text-xs font-bold px-2 py-1 rounded mb-2 ${
                shelter.status === 'open' ? 'bg-green-500' :
                shelter.status === 'full' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}>
                🏠 ศูนย์อพยพ - {shelter.status === 'open' ? 'เปิดรับ' : shelter.status === 'full' ? 'เต็ม' : 'ปิด'}
              </div>
              
              <h3 className="font-bold text-gray-800">{shelter.name}</h3>
              
              {shelter.address && (
                <p className="text-xs text-gray-500 mt-1">{shelter.address}</p>
              )}
              
              {/* Capacity */}
              <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded">
                <Users className="w-4 h-4 text-blue-600" />
                <div className="text-sm">
                  <span className="font-medium">{shelter.current_occupancy}</span>
                  <span className="text-gray-500">/{shelter.capacity} คน</span>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full ${
                        shelter.current_occupancy / shelter.capacity > 0.9 ? 'bg-red-500' :
                        shelter.current_occupancy / shelter.capacity > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((shelter.current_occupancy / shelter.capacity) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Facilities */}
              <div className="flex flex-wrap gap-1 mt-2">
                {shelter.has_food && <span className="text-xs bg-gray-100 px-1 rounded" title="อาหาร">🍚</span>}
                {shelter.has_water && <span className="text-xs bg-gray-100 px-1 rounded" title="น้ำดื่ม">💧</span>}
                {shelter.has_medical && <span className="text-xs bg-gray-100 px-1 rounded" title="ยา/พยาบาล">💊</span>}
                {shelter.has_electricity && <span className="text-xs bg-gray-100 px-1 rounded" title="ไฟฟ้า">⚡</span>}
                {shelter.has_toilet && <span className="text-xs bg-gray-100 px-1 rounded" title="ห้องน้ำ">🚽</span>}
                {shelter.has_shower && <span className="text-xs bg-gray-100 px-1 rounded" title="ห้องอาบน้ำ">🚿</span>}
                {shelter.has_bedding && <span className="text-xs bg-gray-100 px-1 rounded" title="ที่นอน">🛏️</span>}
                {shelter.has_wifi && <span className="text-xs bg-gray-100 px-1 rounded" title="WiFi">📶</span>}
                {shelter.accepts_pets && <span className="text-xs bg-gray-100 px-1 rounded" title="รับสัตว์เลี้ยง">🐕</span>}
              </div>
              
              {/* Contact */}
              {shelter.contact_phone && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                  <Phone className="w-3 h-3" />
                  <a href={`tel:${shelter.contact_phone}`} className="text-blue-600 hover:underline">
                    {shelter.contact_phone}
                  </a>
                  {shelter.contact_name && <span className="text-gray-400">({shelter.contact_name})</span>}
                </div>
              )}
              
              {shelter.notes && (
                <p className="text-xs text-gray-500 mt-2 p-2 bg-yellow-50 rounded">
                  📝 {shelter.notes}
                </p>
              )}
              
              {/* Navigation Button */}
              <button
                onClick={() => openNavigation(shelter.latitude, shelter.longitude)}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
              >
                <Navigation className="w-4 h-4" />
                นำทางไปศูนย์นี้
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
      </MapContainer>
    </div>
  );
}
