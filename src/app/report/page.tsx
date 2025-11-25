'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Loader2, Camera, AlertTriangle } from 'lucide-react';
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
import { addRequest } from '@/lib/store';
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
    
    if (!formData.phone || !formData.helpType || !formData.severity) {
      alert('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    addRequest({
      name: formData.name || 'ไม่ระบุชื่อ',
      phone: formData.phone,
      helpType: formData.helpType as HelpType,
      severity: formData.severity as Severity,
      description: formData.description,
      latitude: formData.latitude || 7.0086,
      longitude: formData.longitude || 100.4747,
    });

    router.push('/report/success');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#FF3B30] text-white py-4 px-4 sticky top-0 z-10">
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
              <Button
                type="button"
                onClick={getLocation}
                disabled={isGettingLocation}
                className="w-full bg-blue-600 hover:bg-blue-700"
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
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required
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

          {/* Photo Upload (Mock) */}
          <Card>
            <CardContent className="pt-4">
              <Label>แนบรูปภาพ (ถ้ามี)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="w-8 h-8 mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">แตะเพื่อถ่ายรูปหรือเลือกจากอัลบั้ม</p>
                <input type="file" accept="image/*" className="hidden" />
                <Button type="button" variant="outline" className="mt-2" disabled>
                  เลือกรูปภาพ
                </Button>
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
