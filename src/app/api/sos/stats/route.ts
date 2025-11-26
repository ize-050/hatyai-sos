import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * @swagger
 * /api/sos/stats:
 *   get:
 *     tags:
 *       - SOS
 *     summary: ดึงสถิติ SOS และศูนย์อพยพ
 *     description: ดึงข้อมูลสรุปจำนวน SOS แยกตามสถานะ และข้อมูลศูนย์อพยพ
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
 *                   $ref: '#/components/schemas/Stats'
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
export async function GET() {
  try {
    // Get SOS stats
    const { data: sosData } = await supabase
      .from('sos_requests')
      .select('status');

    const pending = sosData?.filter(r => r.status === 'pending').length || 0;
    const inProgress = sosData?.filter(r => r.status === 'in_progress').length || 0;
    const resolved = sosData?.filter(r => r.status === 'resolved').length || 0;

    // Get shelter stats
    const { data: shelterData } = await supabase
      .from('evacuation_centers')
      .select('status, capacity, current_occupancy');

    const sheltersOpen = shelterData?.filter(s => s.status === 'open').length || 0;
    const totalCapacity = shelterData?.reduce((sum, s) => sum + (s.capacity || 0), 0) || 0;
    const totalOccupancy = shelterData?.reduce((sum, s) => sum + (s.current_occupancy || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        total_sos: sosData?.length || 0,
        pending,
        in_progress: inProgress,
        resolved,
        total_shelters: shelterData?.length || 0,
        shelters_open: sheltersOpen,
        total_capacity: totalCapacity,
        total_occupancy: totalOccupancy,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
