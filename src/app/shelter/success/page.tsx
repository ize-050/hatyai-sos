import Link from 'next/link';
import { CheckCircle, Home, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ShelterSuccessPage() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-green-800">ลงทะเบียนสำเร็จ!</h1>
            <p className="text-gray-600 mt-2">
              ศูนย์อพยพของคุณถูกเพิ่มในระบบแล้ว
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800">
              <strong>ขั้นตอนต่อไป:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• ศูนย์จะแสดงบนแผนที่ทันที</li>
              <li>• ผู้ประสบภัยสามารถนำทางมาได้</li>
              <li>• อัพเดทสถานะเมื่อเต็มหรือปิด</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/map" className="block">
              <Button className="w-full bg-[#007AFF] hover:bg-blue-700">
                <MapPin className="w-4 h-4 mr-2" />
                ดูแผนที่สด
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                กลับหน้าหลัก
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
