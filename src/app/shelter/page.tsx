'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

export default function ShelterRegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    capacity: 0,
    contactPhone: '',
    contactName: '',
    status: 'open' as 'open' | 'full' | 'closed',
    notes: '',
    // Facilities
    hasFood: false,
    hasWater: false,
    hasMedical: false,
    hasElectricity: false,
    hasToilet: false,
    hasShower: false,
    hasBedding: false,
    hasWifi: false,
    acceptsPets: false,
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
    
    if (!formData.name || !formData.latitude || !formData.longitude) {
      alert('กรุณากรอกชื่อศูนย์และระบุตำแหน่ง');
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('evacuation_centers')
      .insert({
        name: formData.name,
        address: formData.address || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        capacity: formData.capacity || 0,
        contact_phone: formData.contactPhone || null,
        contact_name: formData.contactName || null,
        status: formData.status,
        notes: formData.notes || null,
        has_food: formData.hasFood,
        has_water: formData.hasWater,
        has_medical: formData.hasMedical,
        has_electricity: formData.hasElectricity,
        has_toilet: formData.hasToilet,
        has_shower: formData.hasShower,
        has_bedding: formData.hasBedding,
        has_wifi: formData.hasWifi,
        accepts_pets: formData.acceptsPets,
      });

    if (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setIsSubmitting(false);
      return;
    }

    router.push('/shelter/success');
  };

  const facilities = [
    { key: 'hasFood', icon: '🍚', label: 'อาหาร' },
    { key: 'hasWater', icon: '💧', label: 'น้ำดื่ม' },
    { key: 'hasMedical', icon: '💊', label: 'ยา/พยาบาล' },
    { key: 'hasElectricity', icon: '⚡', label: 'ไฟฟ้า' },
    { key: 'hasToilet', icon: '🚽', label: 'ห้องน้ำ' },
    { key: 'hasShower', icon: '🚿', label: 'ห้องอาบน้ำ' },
    { key: 'hasBedding', icon: '🛏️', label: 'ที่นอน' },
    { key: 'hasWifi', icon: '📶', label: 'WiFi' },
    { key: 'acceptsPets', icon: '🐕', label: 'รับสัตว์เลี้ยง' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#34C759] text-white py-4 px-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-green-700">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">ลงทะเบียนศูนย์อพยพ</h1>
            <p className="text-green-100 text-xs">เพิ่มจุดช่วยเหลือใหม่</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Card */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-800">
                <MapPin className="w-5 h-5" />
                ตำแหน่งศูนย์อพยพ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                onClick={getLocation}
                disabled={isGettingLocation}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังค้นหาตำแหน่ง...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    📍 ระบุตำแหน่งอัตโนมัติ
                  </>
                )}
              </Button>
              
              {locationError && (
                <p className="text-red-600 text-sm">{locationError}</p>
              )}
              
              {formData.latitude !== 0 && (
                <div className="text-sm text-green-700 bg-green-100 p-2 rounded">
                  ✅ พิกัด: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    placeholder="7.0086"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    placeholder="100.4747"
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                ข้อมูลศูนย์อพยพ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-1">
                  ชื่อศูนย์/สถานที่ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="เช่น โรงเรียนหาดใหญ่วิทยาลัย"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="address">ที่อยู่</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="ถนน/ซอย/ตำบล"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">ความจุ (คน)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                    placeholder="100"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>สถานะ</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'open' | 'full' | 'closed' }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          เปิดรับ
                        </span>
                      </SelectItem>
                      <SelectItem value="full">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          เต็ม
                        </span>
                      </SelectItem>
                      <SelectItem value="closed">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          ปิด
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">ชื่อผู้ประสานงาน</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="ชื่อ-นามสกุล"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">เบอร์โทร</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="08X-XXX-XXXX"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ข้อมูลเพิ่มเติม เช่น เวลาเปิด-ปิด"
                  className="mt-1"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Facilities */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-800">
                🏠 สิ่งอำนวยความสะดวก
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {facilities.map((facility) => (
                  <label
                    key={facility.key}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData[facility.key as keyof typeof formData]
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData[facility.key as keyof typeof formData] as boolean}
                      onChange={(e) => setFormData(prev => ({ ...prev, [facility.key]: e.target.checked }))}
                      className="sr-only"
                    />
                    <span className="text-2xl">{facility.icon}</span>
                    <span className="text-xs font-medium text-center">{facility.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 text-lg font-bold bg-[#34C759] hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Building2 className="w-5 h-5 mr-2" />
                ลงทะเบียนศูนย์อพยพ
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
