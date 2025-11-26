'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamic import for LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500 text-sm">กำลังโหลดแผนที่...</p>
      </div>
    </div>
  ),
});
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { HelpType, Severity } from '@/lib/types';

export default function ReportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    helpType: '' as HelpType | '',
    severity: '' as Severity | '',
    description: '',
    latitude: 0,
    longitude: 0,
    hasChildren: false,
    hasElderly: false,
    hasDisabled: false,
    hasPregnant: false,
    peopleCount: 1,
  });

  const getLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('เบราว์เซอร์ไม่รองรับ GPS');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        let message = 'ไม่สามารถระบุตำแหน่งได้';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'กรุณาอนุญาตการเข้าถึงตำแหน่ง';
        }
        setLocationError(message);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ( !formData.helpType || !formData.severity) {
      alert('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('sos_requests')
      .insert({
        name: formData.name || 'ไม่ระบุชื่อ',
        phone: formData.phone,
        help_type: formData.helpType,
        severity: formData.severity,
        description: formData.description,
        latitude: formData.latitude || 7.0086,
        longitude: formData.longitude || 100.4747,
        has_children: formData.hasChildren,
        has_elderly: formData.hasElderly,
        has_disabled: formData.hasDisabled,
        has_pregnant: formData.hasPregnant,
        people_count: formData.peopleCount,
      });

    if (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setIsSubmitting(false);
      return;
    }

    router.push('/report/success');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#FF3B30] text-white py-4 px-4 sticky top-0 z-[1001]">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-red-700">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">ขอความช่วยเหลือ (SOS)</h1>
            <p className="text-red-100 text-xs">กรอกข้อมูลให้ครบถ้วน</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Card */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                <MapPin className="w-5 h-5" />
                ตำแหน่งของคุณ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Map Location Picker */}
              <LocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={(lat, lng) => {
                  setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                  setLocationError(null);
                }}
              />
              
              {/* GPS Button */}
              <Button
                type="button"
                onClick={getLocation}
                disabled={isGettingLocation}
                variant="outline"
                className="w-full"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังค้นหาตำแหน่ง...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    📍 ใช้ตำแหน่ง GPS ปัจจุบัน
                  </>
                )}
              </Button>
              
              {locationError && (
                <p className="text-red-600 text-sm">{locationError}</p>
              )}
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ระบุชื่อ (ไม่บังคับ)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-1">
                  เบอร์โทรศัพท์ (ถ้ามี)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="08X-XXX-XXXX"
                  className="mt-1 text-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Help Details */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="flex items-center gap-1">
                  ประเภทความช่วยเหลือ <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.helpType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, helpType: value as HelpType }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">🍚 อาหาร/น้ำดื่ม</SelectItem>
                    <SelectItem value="medical">💊 ยา/การแพทย์</SelectItem>
                    <SelectItem value="evacuation">🚨 อพยพด่วน</SelectItem>
                    <SelectItem value="boat">🚤 ต้องการเรือ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  ระดับความเร่งด่วน <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as Severity }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="เลือกระดับ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        วิกฤต/ด่วนมาก
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                        ปานกลาง
                      </span>
                    </SelectItem>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        ไม่เร่งด่วน
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">รายละเอียดเพิ่มเติม</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="อธิบายสถานการณ์ เช่น จำนวนคน, มีผู้ป่วย/เด็ก/ผู้สูงอายุ"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vulnerable People */}
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-orange-800">
                👥 ข้อมูลผู้ประสบภัย
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>จำนวนคน</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.peopleCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, peopleCount: parseInt(e.target.value) || 1 }))}
                  className="mt-1 w-24"
                />
              </div>
              
              <div>
                <Label className="mb-2 block">มีกลุ่มเปราะบาง (เลือกได้หลายข้อ)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.hasChildren ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={formData.hasChildren}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasChildren: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <span className="text-2xl">👶</span>
                    <span className="text-sm font-medium">เด็กเล็ก</span>
                  </label>
                  
                  <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.hasElderly ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={formData.hasElderly}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasElderly: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <span className="text-2xl">👴</span>
                    <span className="text-sm font-medium">ผู้สูงอายุ</span>
                  </label>
                  
                  <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.hasDisabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={formData.hasDisabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasDisabled: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <span className="text-2xl">♿</span>
                    <span className="text-sm font-medium">ผู้พิการ</span>
                  </label>
                  
                  <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.hasPregnant ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={formData.hasPregnant}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasPregnant: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <span className="text-2xl">🤰</span>
                    <span className="text-sm font-medium">หญิงตั้งครรภ์</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 text-lg font-bold bg-[#FF3B30] hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 mr-2" />
                ส่งคำขอความช่วยเหลือ
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
