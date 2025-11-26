import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * @swagger
 * /api/shelters:
 *   get:
 *     tags:
 *       - Shelters
 *     summary: ดึงรายการศูนย์อพยพทั้งหมด
 *     description: ดึงรายการศูนย์อพยพและจุดช่วยเหลือ สามารถกรองตามสถานะได้
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, full, closed]
 *         description: กรองตามสถานะ (open=เปิดรับ, full=เต็ม, closed=ปิด)
 *       - in: query
 *         name: has_medical
 *         schema:
 *           type: boolean
 *         description: กรองเฉพาะที่มียา/พยาบาล
 *       - in: query
 *         name: accepts_pets
 *         schema:
 *           type: boolean
 *         description: กรองเฉพาะที่รับสัตว์เลี้ยง
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
 *                     $ref: '#/components/schemas/EvacuationCenter'
 *                 count:
 *                   type: integer
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const hasMedical = searchParams.get('has_medical');
    const acceptsPets = searchParams.get('accepts_pets');

    let query = supabase
      .from('evacuation_centers')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (hasMedical === 'true') {
      query = query.eq('has_medical', true);
    }
    if (acceptsPets === 'true') {
      query = query.eq('accepts_pets', true);
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
 * /api/shelters:
 *   post:
 *     tags:
 *       - Shelters
 *     summary: ลงทะเบียนศูนย์อพยพใหม่
 *     description: เพิ่มศูนย์อพยพหรือจุดช่วยเหลือใหม่เข้าสู่ระบบ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 description: ชื่อศูนย์/สถานที่
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               capacity:
 *                 type: integer
 *               contact_phone:
 *                 type: string
 *               contact_name:
 *                 type: string
 *               has_food:
 *                 type: boolean
 *               has_water:
 *                 type: boolean
 *               has_medical:
 *                 type: boolean
 *               has_electricity:
 *                 type: boolean
 *               has_toilet:
 *                 type: boolean
 *               has_shower:
 *                 type: boolean
 *               has_bedding:
 *                 type: boolean
 *               has_wifi:
 *                 type: boolean
 *               accepts_pets:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [open, full, closed]
 *               notes:
 *                 type: string
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

    const { name, latitude, longitude } = body;

    if (!name || !latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, latitude, longitude' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('evacuation_centers')
      .insert({
        name,
        address: body.address || null,
        latitude,
        longitude,
        capacity: body.capacity || 0,
        contact_phone: body.contact_phone || null,
        contact_name: body.contact_name || null,
        has_food: body.has_food || false,
        has_water: body.has_water || false,
        has_medical: body.has_medical || false,
        has_electricity: body.has_electricity || false,
        has_toilet: body.has_toilet || false,
        has_shower: body.has_shower || false,
        has_bedding: body.has_bedding || false,
        has_wifi: body.has_wifi || false,
        accepts_pets: body.accepts_pets || false,
        status: body.status || 'open',
        notes: body.notes || null,
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
