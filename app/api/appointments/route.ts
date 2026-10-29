import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendBookingTelegramNotification } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      service_id,
      staff_id,
      appointment_time,
    } = body;

    // 1. Kiểm tra dữ liệu đầu vào theo đúng các cột trong bảng appointments
    if (!customer_name || !customer_phone || !service_id || !staff_id || !appointment_time) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin đặt lịch.' },
        { status: 400 }
      );
    }

    // 2. Lưu lịch hẹn vào Supabase với status mặc định là 'PENDING' và join lấy thông tin Service, Staff
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert([
        {
          customer_name,
          customer_phone,
          service_id,
          staff_id,
          appointment_time,
          status: 'PENDING',
        },
      ])
      .select(`
        *,
        services:service_id ( name, price, duration_minutes ),
        staff:staff_id ( name, telegram_chat_id )
      `)
      .single();

    if (insertError || !appointment) {
      console.error('Supabase Insert Error:', insertError);
      return NextResponse.json(
        { error: insertError?.message || 'Lỗi khi lưu lịch hẹn vào cơ sở dữ liệu.' },
        { status: 500 }
      );
    }

    // 3. Bắn thông báo về Telegram cho Chủ & Thợ
    await sendBookingTelegramNotification({
      appointmentId: appointment.id,
      customer_name: appointment.customer_name,
      customer_phone: appointment.customer_phone,
      appointment_time: appointment.appointment_time,
      serviceName: appointment.services?.name || 'N/A',
      servicePrice: appointment.services?.price || 0,
      staffName: appointment.staff?.name || 'N/A',
      staffTelegramChatId: appointment.staff?.telegram_chat_id,
    });

    return NextResponse.json({ data: appointment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/appointments Error:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống nội bộ.' },
      { status: 500 }
    );
  }
}