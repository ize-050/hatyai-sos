'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SOSRequest } from '@/lib/types';
import { EvacuationCenter } from '@/lib/evacuation-types';
import { Phone, Clock, Users, Navigation } from 'lucide-react';

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
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* SOS Request Markers */}
      {requests.map((request) => (
        <Marker
          key={request.id}
          position={[request.latitude, request.longitude]}
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
              
              <div className="mt-2 pt-2 border-t">
                <span className={`text-xs px-2 py-1 rounded ${
                  request.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                  request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {request.status === 'pending' ? 'รอดำเนินการ' :
                   request.status === 'in_progress' ? 'กำลังช่วยเหลือ' : 'เสร็จสิ้น'}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

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
  );
}
