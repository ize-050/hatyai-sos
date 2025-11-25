'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SOSRequest } from '@/lib/types';
import { Phone, Clock } from 'lucide-react';

// Fix for default marker icons in Leaflet with webpack
const createIcon = (color: string, icons: string[] = []) => {
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
  center?: [number, number];
  zoom?: number;
}

export default function MapComponent({ 
  requests, 
  center = [7.0086, 100.4747], // Hatyai center
  zoom = 13 
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
      
      {requests.map((request) => (
        <Marker
          key={request.id}
          position={[request.latitude, request.longitude]}
          icon={createIcon(
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
    </MapContainer>
  );
}
