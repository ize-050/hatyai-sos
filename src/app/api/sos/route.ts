import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * @swagger
 * /api/sos:
 *   get:
 *     tags:
 *       - SOS
 *     summary: ดึงรายการ SOS ทั้งหมด
 *     description: ดึงรายการขอความช่วยเหลือทั้งหมด สามารถกรองตามสถานะและความเร่งด่วนได้
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved]
 *         description: กรองตามสถานะ
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: กรองตามความเร่งด่วน
 *       - in: query
 *         name: help_type
 *         schema:
 *           type: string
 *           enum: [food, medical, evacuation, boat]
 *         description: กรองตามประเภทความช่วยเหลือ
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: จำนวนรายการสูงสุด
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SOSRequest'
 *                 count:
 *                   type: integer
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const helpType = searchParams.get('help_type');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('sos_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (helpType) {
      query = query.eq('help_type', helpType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/sos:
 *   post:
 *     tags:
 *       - SOS
 *     summary: สร้างคำขอ SOS ใหม่
 *     description: ส่งคำขอความช่วยเหลือใหม่เข้าสู่ระบบ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - help_type
 *               - severity
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 description: ชื่อผู้ขอความช่วยเหลือ
 *               phone:
 *                 type: string
 *                 description: เบอร์โทรศัพท์
 *               help_type:
 *                 type: string
 *                 enum: [food, medical, evacuation, boat]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *               description:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               has_children:
 *                 type: boolean
 *               has_elderly:
 *                 type: boolean
 *               has_disabled:
 *                 type: boolean
 *               has_pregnant:
 *                 type: boolean
 *               people_count:
 *                 type: integer
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { phone, help_type, severity, latitude, longitude } = body;

    if (!phone || !help_type || !severity || !latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sos_requests')
      .insert({
        name: body.name || 'ไม่ระบุชื่อ',
        phone,
        help_type,
        severity,
        description: body.description || null,
        latitude,
        longitude,
        has_children: body.has_children || false,
        has_elderly: body.has_elderly || false,
        has_disabled: body.has_disabled || false,
        has_pregnant: body.has_pregnant || false,
        people_count: body.people_count || 1,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
