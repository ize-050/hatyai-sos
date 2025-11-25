'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { AlertTriangle, MapPin, Phone, Clock, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Update = {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  created_at: string;
};

export default function Home() {
  const [stats, setStats] = useState({ pending: 0, inProgress: 0 });
  const [updates, setUpdates] = useState<Update[]>([]);

  useEffect(() => {
    // Fetch initial data
    async function fetchData() {
      const { data: requests } = await supabase
        .from('sos_requests')
        .select('status');
      
      const pending = requests?.filter(r => r.status === 'pending').length || 0;
      const inProgress = requests?.filter(r => r.status === 'in_progress').length || 0;
      setStats({ pending, inProgress });

      const { data: updatesData } = await supabase
        .from('updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setUpdates(updatesData || []);
    }

    fetchData();

    // Subscribe to realtime updates for sos_requests
    const sosChannel = supabase
      .channel('sos_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_requests' }, async () => {
        const { data: requests } = await supabase
          .from('sos_requests')
          .select('status');
        
        const pending = requests?.filter(r => r.status === 'pending').length || 0;
        const inProgress = requests?.filter(r => r.status === 'in_progress').length || 0;
        setStats({ pending, inProgress });
      })
      .subscribe();

    // Subscribe to realtime updates for news/updates
    const updatesChannel = supabase
      .channel('updates_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'updates' }, async () => {
        const { data: updatesData } = await supabase
          .from('updates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        setUpdates(updatesData || []);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sosChannel);
      supabase.removeChannel(updatesChannel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-red-600 text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold">ศูนย์ช่วยเหลือน้ำท่วมหาดใหญ่</h1>
            <p className="text-red-100 text-sm">Hatyai Flood Crisis Response</p>
          </div>
        </div>
      </header>

      {/* Status Banner */}
      <div className="bg-red-700 text-white py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
          <span className="inline-block w-3 h-3 bg-red-400 rounded-full animate-pulse"></span>
          <span className="font-bold text-lg">สถานะ: วิกฤต (CRITICAL)</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-orange-500 text-white border-0">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.pending}</p>
              <p className="text-sm">รอความช่วยเหลือ</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-500 text-white border-0">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.inProgress}</p>
              <p className="text-sm">กำลังดำเนินการ</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-4">
          <Link href="/report" className="block">
            <Button 
              className="w-full h-20 text-xl font-bold bg-[#FF3B30] hover:bg-red-700 text-white shadow-lg"
              size="lg"
            >
              <Phone className="w-8 h-8 mr-3" />
              🔴 ขอความช่วยเหลือ (SOS)
            </Button>
          </Link>
          
          <Link href="/map" className="block">
            <Button 
              className="w-full h-20 text-xl font-bold bg-[#007AFF] hover:bg-blue-700 text-white shadow-lg"
              size="lg"
            >
              <MapPin className="w-8 h-8 mr-3" />
              🔵 ดูแผนที่สด (LIVE MAP)
            </Button>
          </Link>

        </div>

        {/* Emergency Contacts */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
              <Phone className="w-5 h-5" />
              สายด่วนฉุกเฉิน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="tel:1669" className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50">
              <span className="font-medium">กู้ชีพ/กู้ภัย</span>
              <span className="text-red-600 font-bold">1669</span>
            </a>
            <a href="tel:1784" className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50">
              <span className="font-medium">ป้องกันภัย</span>
              <span className="text-red-600 font-bold">1784</span>
            </a>
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              ข่าวสารล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {updates.map((update) => (
              <div 
                key={update.id} 
                className={`p-3 rounded-lg border-l-4 ${
                  update.type === 'warning' 
                    ? 'bg-yellow-50 border-yellow-500' 
                    : update.type === 'success'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-2">
                  {update.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />}
                  {update.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />}
                  {update.type === 'info' && <Info className="w-4 h-4 text-blue-600 mt-0.5" />}
                  <div>
                    <p className="text-sm">{update.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(update.created_at).toLocaleString('th-TH')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-center py-4 mt-8">
        <p className="text-sm">ศูนย์ประสานงานช่วยเหลือผู้ประสบภัยน้ำท่วม</p>
        <p className="text-xs mt-1">จังหวัดสงขลา</p>
      </footer>
    </div>
  );
}
