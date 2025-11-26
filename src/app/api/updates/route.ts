import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * @swagger
 * /api/updates:
 *   get:
 *     tags:
 *       - Updates
 *     summary: ดึงข่าวสารและประกาศ
 *     description: ดึงรายการข่าวสารและประกาศล่าสุด
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, warning, success]
 *         description: กรองตามประเภท
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
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
 *                     $ref: '#/components/schemas/Update'
 *                 count:
 *                   type: integer
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('updates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
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
 * /api/updates:
 *   post:
 *     tags:
 *       - Updates
 *     summary: สร้างประกาศใหม่
 *     description: เพิ่มข่าวสารหรือประกาศใหม่
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - type
 *             properties:
 *               message:
 *                 type: string
 *                 description: ข้อความประกาศ
 *               type:
 *                 type: string
 *                 enum: [info, warning, success]
 *                 description: ประเภทประกาศ
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

    const { message, type } = body;

    if (!message || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: message, type' },
        { status: 400 }
      );
    }

    if (!['info', 'warning', 'success'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be: info, warning, or success' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('updates')
      .insert({ message, type })
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
