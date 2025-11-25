'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, AlertTriangle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { SOSRequest, Severity, HelpType } from '@/lib/types';

// Dynamic import for Map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">กำลังโหลดแผนที่...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [showLegend, setShowLegend] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from('sos_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const transformed = data.map(r => ({
          id: r.id,
          name: r.name || 'ไม่ระบุชื่อ',
          phone: r.phone,
          helpType: r.help_type as HelpType,
          severity: r.severity as Severity,
          description: r.description || '',
          latitude: r.latitude,
          longitude: r.longitude,
          status: r.status,
          createdAt: new Date(r.created_at),
          hasChildren: r.has_children || false,
          hasElderly: r.has_elderly || false,
          hasDisabled: r.has_disabled || false,
          hasPregnant: r.has_pregnant || false,
          peopleCount: r.people_count || 1,
        }));
        setRequests(transformed);
      }
      setLoading(false);
    }

    fetchRequests();

    // Auto refresh every 60 seconds
    const interval = setInterval(() => {
      fetchRequests();
    }, 60000);

    // Subscribe to realtime updates
    const channel = supabase
      .channel('sos_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.severity === filter);

  const counts = {
    high: requests.filter(r => r.severity === 'high').length,
    medium: requests.filter(r => r.severity === 'medium').length,
    low: requests.filter(r => r.severity === 'low').length,
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#007AFF] text-white py-3 px-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">แผนที่สด</h1>
              <p className="text-blue-100 text-xs">{filteredRequests.length} จุดขอความช่วยเหลือ</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-blue-700"
            onClick={() => setShowLegend(!showLegend)}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Legend & Filter */}
      {showLegend && (
        <div className="bg-white border-b px-4 py-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 mr-2">กรอง:</span>
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="h-7 text-xs"
            >
              ทั้งหมด ({requests.length})
            </Button>
            <Button
              size="sm"
              variant={filter === 'high' ? 'default' : 'outline'}
              onClick={() => setFilter('high')}
              className={`h-7 text-xs ${filter === 'high' ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
              วิกฤต ({counts.high})
            </Button>
            <Button
              size="sm"
              variant={filter === 'medium' ? 'default' : 'outline'}
              onClick={() => setFilter('medium')}
              className={`h-7 text-xs ${filter === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
            >
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
              ปานกลาง ({counts.medium})
            </Button>
            <Button
              size="sm"
              variant={filter === 'low' ? 'default' : 'outline'}
              onClick={() => setFilter('low')}
              className={`h-7 text-xs ${filter === 'low' ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              ไม่เร่งด่วน ({counts.low})
            </Button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapComponent requests={filteredRequests} />
        
        {/* SOS Button Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-1000">
          <Link href="/report">
            <Button className="w-full h-12 bg-[#FF3B30] hover:bg-red-700 text-white font-bold shadow-lg">
              <AlertTriangle className="w-5 h-5 mr-2" />
              ขอความช่วยเหลือ (SOS)
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
