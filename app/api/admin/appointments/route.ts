import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  if (!start || !end) {
    return NextResponse.json({ error: 'Thiếu start/end' }, { status: 400 });
  }

  const [staffRes, apptRes] = await Promise.all([
    supabaseAdmin.from('staff').select('*').eq('is_active', true).order('name'),
    supabaseAdmin
      .from('appointments')
      .select('*, services:service_id ( name, price, duration_minutes ), staff:staff_id ( name )')
      .gte('appointment_time', start)
      .lt('appointment_time', end)
      .order('appointment_time'),
  ]);

  if (staffRes.error || apptRes.error) {
    console.error(staffRes.error || apptRes.error);
    return NextResponse.json({ error: 'Lỗi truy vấn dữ liệu.' }, { status: 500 });
  }

  return NextResponse.json({ staff: staffRes.data, appointments: apptRes.data });
}