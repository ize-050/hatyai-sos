import { SOSRequest, Update } from './types';

// Mock SOS Requests - Hatyai area coordinates
export const mockSOSRequests: SOSRequest[] = [
  {
    id: '1',
    name: 'สมชาย วงศ์ไทย',
    phone: '081-234-5678',
    helpType: 'evacuation',
    severity: 'high',
    description: 'น้ำท่วมสูง 2 เมตร ต้องการเรือช่วยเหลือด่วน มีผู้สูงอายุ 2 คน',
    latitude: 7.0086,
    longitude: 100.4747,
    createdAt: new Date('2024-01-15T08:30:00'),
    status: 'pending',
  },
  {
    id: '2',
    name: 'มาลี สุขใจ',
    phone: '089-876-5432',
    helpType: 'medical',
    severity: 'high',
    description: 'ต้องการยาเบาหวานและยาความดัน หมดแล้ว',
    latitude: 7.0120,
    longitude: 100.4680,
    createdAt: new Date('2024-01-15T09:15:00'),
    status: 'pending',
  },
  {
    id: '3',
    name: 'วิชัย ดีมาก',
    phone: '086-111-2222',
    helpType: 'food',
    severity: 'medium',
    description: 'ครอบครัว 5 คน ต้องการอาหารและน้ำดื่ม',
    latitude: 7.0050,
    longitude: 100.4800,
    createdAt: new Date('2024-01-15T10:00:00'),
    status: 'in_progress',
  },
  {
    id: '4',
    name: 'สุดา รักดี',
    phone: '087-333-4444',
    helpType: 'boat',
    severity: 'medium',
    description: 'ต้องการเรือเพื่อเดินทางไปซื้อของ',
    latitude: 7.0200,
    longitude: 100.4650,
    createdAt: new Date('2024-01-15T11:30:00'),
    status: 'pending',
  },
  {
    id: '5',
    name: 'ประยุทธ์ ใจดี',
    phone: '088-555-6666',
    helpType: 'food',
    severity: 'low',
    description: 'ต้องการอาหารเสริมสำหรับเด็กทารก',
    latitude: 6.9980,
    longitude: 100.4720,
    createdAt: new Date('2024-01-15T12:00:00'),
    status: 'resolved',
  },
];

// Mock Updates
export const mockUpdates: Update[] = [
  {
    id: '1',
    message: 'ศูนย์อพยพโรงเรียนหาดใหญ่วิทยาลัย เปิดรับผู้ประสบภัยแล้ว',
    timestamp: new Date('2024-01-15T14:00:00'),
    type: 'info',
  },
  {
    id: '2',
    message: 'แจ้งเตือน: ระดับน้ำคลองอู่ตะเภาเพิ่มสูงขึ้น 50 ซม.',
    timestamp: new Date('2024-01-15T13:30:00'),
    type: 'warning',
  },
  {
    id: '3',
    message: 'ทีมกู้ภัยช่วยเหลือผู้ประสบภัยแล้ว 45 ครัวเรือน',
    timestamp: new Date('2024-01-15T12:00:00'),
    type: 'success',
  },
  {
    id: '4',
    message: 'เปิดรับบริจาคสิ่งของที่ศาลากลางจังหวัดสงขลา',
    timestamp: new Date('2024-01-15T11:00:00'),
    type: 'info',
  },
];

// Simple in-memory store for new requests
let requests = [...mockSOSRequests];

export const addSOSRequest = (request: Omit<SOSRequest, 'id' | 'createdAt' | 'status'>) => {
  const newRequest: SOSRequest = {
    ...request,
    id: Date.now().toString(),
    createdAt: new Date(),
    status: 'pending',
  };
  requests = [newRequest, ...requests];
  return newRequest;
};

export const getSOSRequests = () => requests;
export const getUpdates = () => mockUpdates;
