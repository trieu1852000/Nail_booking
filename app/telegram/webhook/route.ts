import { NextResponse } from 'next/server';
import { supabase, AppointmentStatus } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Chỉ xử lý khi người dùng bấm vào nút Inline Keyboard (callback_query)
    const callbackQuery = body.callback_query;
    if (!callbackQuery) {
      return NextResponse.json({ ok: true });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const callbackId = callbackQuery.id;
    const data: string = callbackQuery.data || ''; // Định dạng: "CONFIRMED:<id>" hoặc "REJECTED:<id>"
    const chatId = callbackQuery.message?.chat?.id;
    const messageId = callbackQuery.message?.message_id;
    const originalText = callbackQuery.message?.text || '';
    const actorName = callbackQuery.from?.first_name || 'Quản lý/Thợ';

    const [action, appointmentId] = data.split(':') as [AppointmentStatus, string];

    if (!appointmentId || (action !== 'CONFIRMED' && action !== 'REJECTED')) {
      return NextResponse.json({ ok: true });
    }

    // 1. Kiểm tra lịch hẹn hiện tại trong Supabase (Chống xung đột khi cả Thợ & Chủ cùng bấm)
    const { data: existingAppt, error: fetchError } = await supabase
      .from('appointments')
      .select('status')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !existingAppt) {
      await answerCallback(botToken, callbackId, '❌ Không tìm thấy lịch hẹn này!');
      return NextResponse.json({ ok: true });
    }

    // Nếu lịch không còn ở trạng thái PENDING (đã có người bấm trước đó)
    if (existingAppt.status !== 'PENDING') {
      const statusText = existingAppt.status === 'CONFIRMED' ? 'CHẤP NHẬN' : 'TỪ CHỐI';
      await answerCallback(
        botToken,
        callbackId,
        `⚠️ Lịch này đã được xử lý (${statusText}) trước đó rồi!`
      );
      await editTelegramMessage(
        botToken,
        chatId,
        messageId,
        `${originalText}\n\n━━━━━━━━━━━━━━━\nℹ️ Trạng thái: Đã ${statusText}`
      );
      return NextResponse.json({ ok: true });
    }

    // 2. Cập nhật status mới vào bảng appointments
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: action })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Supabase Update Error:', updateError);
      await answerCallback(botToken, callbackId, '❌ Lỗi khi cập nhật cơ sở dữ liệu!');
      return NextResponse.json({ ok: true });
    }

    // 3. Phản hồi popup trên Telegram và cập nhật lại nội dung tin nhắn (ẩn 2 nút bấm đi)
    const statusLabel =
      action === 'CONFIRMED' ? '✅ ĐÃ CHẤP NHẬN (CONFIRMED)' : '❌ ĐÃ TỪ CHỐI (REJECTED)';

    await answerCallback(botToken, callbackId, `${statusLabel}`);
    await editTelegramMessage(
      botToken,
      chatId,
      messageId,
      `${originalText}\n\n━━━━━━━━━━━━━━━\n${statusLabel}\n👤 Xử lý bởi: ${actorName}`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ ok: true });
  }
}

// Hàm phụ: Tắt vòng xoay loading trên nút bấm Telegram và hiện thông báo nhỏ
async function answerCallback(botToken: string | undefined, callback_query_id: string, text: string) {
  if (!botToken) return;
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id,
      text,
      show_alert: false,
    }),
  });
}

// Hàm phụ: Sửa lại tin nhắn gốc và xóa cụm nút bấm Inline Keyboard
async function editTelegramMessage(
  botToken: string | undefined,
  chat_id: number | string,
  message_id: number,
  text: string
) {
  if (!botToken || !chat_id || !message_id) return;
  await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id,
      message_id,
      text,
      reply_markup: { inline_keyboard: [] }, // Xóa nút bấm sau khi đã xử lý
    }),
  });
}