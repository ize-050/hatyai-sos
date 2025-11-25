'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SOSRequest = {
  id: string;
  name: string | null;
  phone: string;
  help_type: string;
  severity: string;
  description: string | null;
  latitude: number;
  longitude: number;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
};

const helpTypeLabels: Record<string, string> = {
  food: '🍚 อาหาร/น้ำดื่ม',
  medical: '💊 ยา/การแพทย์',
  evacuation: '🚨 อพยพด่วน',
  boat: '🚤 ต้องการเรือ',
};

const severityLabels: Record<string, string> = {
  high: '🔴 วิกฤต',
  medium: '🟡 ปานกลาง',
  low: '🟢 ไม่เร่งด่วน',
};

const statusLabels: Record<string, string> = {
  pending: 'รอดำเนินการ',
  in_progress: 'กำลังช่วยเหลือ',
  resolved: 'เสร็จสิ้น',
};

export default function AdminPage() {
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  async function fetchRequests() {
    const { data, error } = await supabase
      .from('sos_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchRequests();

    // Realtime subscription
    const channel = supabase
      .channel('admin_sos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id);
    
    const { error } = await supabase
      .from('sos_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
    
    setUpdating(null);
  }

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-white py-4 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">🛡️ Admin - จัดการคำขอ</h1>
            <p className="text-gray-300 text-xs">อัพเดทสถานะการช่วยเหลือ</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            ทั้งหมด ({counts.all})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
            className={filterStatus === 'pending' ? 'bg-orange-500' : ''}
          >
            รอดำเนินการ ({counts.pending})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('in_progress')}
            className={filterStatus === 'in_progress' ? 'bg-blue-500' : ''}
          >
            กำลังช่วยเหลือ ({counts.in_progress})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'resolved' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('resolved')}
            className={filterStatus === 'resolved' ? 'bg-green-500' : ''}
          >
            เสร็จสิ้น ({counts.resolved})
          </Button>
        </div>

        {/* Request List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                ไม่มีคำขอในหมวดนี้
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((req) => (
              <Card 
                key={req.id} 
                className={`border-l-4 ${
                  req.severity === 'high' ? 'border-l-red-500' :
                  req.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">
                        {req.name || 'ไม่ระบุชื่อ'}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                          {helpTypeLabels[req.help_type] || req.help_type}
                        </span>
                        <span className="text-xs">
                          {severityLabels[req.severity] || req.severity}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      req.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      req.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {statusLabels[req.status]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Contact */}
                  <a 
                    href={`tel:${req.phone}`} 
                    className="flex items-center gap-2 text-blue-600 font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    {req.phone}
                  </a>

                  {/* Description */}
                  {req.description && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {req.description}
                    </p>
                  )}

                  {/* Location */}
                  <a 
                    href={`https://www.google.com/maps?q=${req.latitude},${req.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
                  >
                    <MapPin className="w-4 h-4" />
                    ดูตำแหน่งบน Google Maps
                  </a>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(req.created_at).toLocaleString('th-TH')}
                  </div>

                  {/* Status Update */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-sm text-gray-600">เปลี่ยนสถานะ:</span>
                    <Select
                      value={req.status}
                      onValueChange={(value) => updateStatus(req.id, value)}
                      disabled={updating === req.id}
                    >
                      <SelectTrigger className="w-[180px]">
                        {updating === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            รอดำเนินการ
                          </span>
                        </SelectItem>
                        <SelectItem value="in_progress">
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-blue-500" />
                            กำลังช่วยเหลือ
                          </span>
                        </SelectItem>
                        <SelectItem value="resolved">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            เสร็จสิ้น
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
