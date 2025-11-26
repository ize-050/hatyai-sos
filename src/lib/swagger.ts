import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Hatyai SOS API',
        version: '1.0.0',
        description: `
## ศูนย์ช่วยเหลือน้ำท่วมหาดใหญ่ - API Documentation

API สำหรับระบบแจ้งขอความช่วยเหลือและศูนย์อพยพในพื้นที่หาดใหญ่

### ข้อมูลที่ให้บริการ:
- **SOS Requests** - รายการขอความช่วยเหลือจากประชาชน
- **Evacuation Centers** - ศูนย์อพยพและจุดช่วยเหลือ
- **Updates** - ข่าวสารและประกาศ

### การใช้งาน:
- ทุก endpoint เป็น public access ไม่ต้องใช้ API key
- ข้อมูลอัพเดท realtime
- รองรับ JSON format

### ติดต่อ:
- Website: https://hatyai-sos.vercel.app
- Alternative: https://hatyai.help-is-on-the-way.com
        `,
        contact: {
          name: 'ศูนย์ประสานงานช่วยเหลือผู้ประสบภัยน้ำท่วม',
          email: 'support@hatyai-sos.com',
        },
      },
      servers: [
        {
          url: 'https://hatyai-sos.vercel.app',
          description: 'Production Server',
        },
        {
          url: 'https://hatyai.help-is-on-the-way.com',
          description: 'Alternative Server',
        },
        {
          url: 'http://localhost:3000',
          description: 'Development Server',
        },
      ],
      tags: [
        {
          name: 'SOS',
          description: 'รายการขอความช่วยเหลือ',
        },
        {
          name: 'Shelters',
          description: 'ศูนย์อพยพและจุดช่วยเหลือ',
        },
        {
          name: 'Updates',
          description: 'ข่าวสารและประกาศ',
        },
      ],
      components: {
        schemas: {
          SOSRequest: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', description: 'รหัสคำขอ' },
              name: { type: 'string', description: 'ชื่อผู้ขอความช่วยเหลือ' },
              phone: { type: 'string', description: 'เบอร์โทรศัพท์' },
              help_type: { 
                type: 'string', 
                enum: ['food', 'medical', 'evacuation', 'boat'],
                description: 'ประเภทความช่วยเหลือ: food=อาหาร/น้ำ, medical=ยา/การแพทย์, evacuation=อพยพด่วน, boat=ต้องการเรือ'
              },
              severity: { 
                type: 'string', 
                enum: ['low', 'medium', 'high'],
                description: 'ระดับความเร่งด่วน: low=ไม่เร่งด่วน, medium=ปานกลาง, high=วิกฤต'
              },
              description: { type: 'string', description: 'รายละเอียดเพิ่มเติม' },
              latitude: { type: 'number', format: 'double', description: 'พิกัดละติจูด' },
              longitude: { type: 'number', format: 'double', description: 'พิกัดลองจิจูด' },
              status: { 
                type: 'string', 
                enum: ['pending', 'in_progress', 'resolved'],
                description: 'สถานะ: pending=รอดำเนินการ, in_progress=กำลังช่วยเหลือ, resolved=เสร็จสิ้น'
              },
              has_children: { type: 'boolean', description: 'มีเด็กเล็ก' },
              has_elderly: { type: 'boolean', description: 'มีผู้สูงอายุ' },
              has_disabled: { type: 'boolean', description: 'มีผู้พิการ' },
              has_pregnant: { type: 'boolean', description: 'มีหญิงตั้งครรภ์' },
              people_count: { type: 'integer', description: 'จำนวนคน' },
              created_at: { type: 'string', format: 'date-time', description: 'วันเวลาที่แจ้ง' },
            },
          },
          EvacuationCenter: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', description: 'รหัสศูนย์อพยพ' },
              name: { type: 'string', description: 'ชื่อศูนย์/สถานที่' },
              address: { type: 'string', description: 'ที่อยู่' },
              latitude: { type: 'number', format: 'double', description: 'พิกัดละติจูด' },
              longitude: { type: 'number', format: 'double', description: 'พิกัดลองจิจูด' },
              capacity: { type: 'integer', description: 'ความจุ (คน)' },
              current_occupancy: { type: 'integer', description: 'จำนวนคนปัจจุบัน' },
              contact_phone: { type: 'string', description: 'เบอร์โทรติดต่อ' },
              contact_name: { type: 'string', description: 'ชื่อผู้ประสานงาน' },
              has_food: { type: 'boolean', description: 'มีอาหาร' },
              has_water: { type: 'boolean', description: 'มีน้ำดื่ม' },
              has_medical: { type: 'boolean', description: 'มียา/พยาบาล' },
              has_electricity: { type: 'boolean', description: 'มีไฟฟ้า' },
              has_toilet: { type: 'boolean', description: 'มีห้องน้ำ' },
              has_shower: { type: 'boolean', description: 'มีห้องอาบน้ำ' },
              has_bedding: { type: 'boolean', description: 'มีที่นอน' },
              has_wifi: { type: 'boolean', description: 'มี WiFi' },
              accepts_pets: { type: 'boolean', description: 'รับสัตว์เลี้ยง' },
              status: { 
                type: 'string', 
                enum: ['open', 'full', 'closed'],
                description: 'สถานะ: open=เปิดรับ, full=เต็ม, closed=ปิด'
              },
              notes: { type: 'string', description: 'หมายเหตุ' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          Update: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              message: { type: 'string', description: 'ข้อความประกาศ' },
              type: { 
                type: 'string', 
                enum: ['info', 'warning', 'success'],
                description: 'ประเภท: info=ข้อมูล, warning=แจ้งเตือน, success=สำเร็จ'
              },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          Stats: {
            type: 'object',
            properties: {
              total_sos: { type: 'integer', description: 'จำนวน SOS ทั้งหมด' },
              pending: { type: 'integer', description: 'รอดำเนินการ' },
              in_progress: { type: 'integer', description: 'กำลังช่วยเหลือ' },
              resolved: { type: 'integer', description: 'เสร็จสิ้น' },
              total_shelters: { type: 'integer', description: 'จำนวนศูนย์อพยพ' },
              shelters_open: { type: 'integer', description: 'ศูนย์ที่เปิดรับ' },
              total_capacity: { type: 'integer', description: 'ความจุรวม' },
              total_occupancy: { type: 'integer', description: 'จำนวนคนในศูนย์รวม' },
            },
          },
        },
      },
    },
  });
  return spec;
};
