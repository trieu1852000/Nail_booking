import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { AppointmentStatus } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Only handle Inline Keyboard button clicks
    const callbackQuery = body.callback_query;
    if (!callbackQuery) {
      return NextResponse.json({ ok: true });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const callbackId = callbackQuery.id;
    const data: string = callbackQuery.data || ''; // "CONFIRMED:<id>" or "REJECTED:<id>"
    const chatId = callbackQuery.message?.chat?.id;
    const messageId = callbackQuery.message?.message_id;
    const originalText = callbackQuery.message?.text || '';
    const actorName = callbackQuery.from?.first_name || 'Quản lý/Thợ';

    const [action, appointmentId] = data.split(':') as [AppointmentStatus, string];

    if (!appointmentId || (action !== 'CONFIRMED' && action !== 'REJECTED')) {
      return NextResponse.json({ ok: true });
    }

    // 1. Check the current appointment status
    const { data: existingAppt, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('status')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !existingAppt) {
      console.error('Supabase Fetch Error:', fetchError);
      await answerCallback(botToken, callbackId, '❌ Không tìm thấy lịch hẹn này!');
      return NextResponse.json({ ok: true });
    }

    // Already handled by someone else
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

    // 2. Update the status
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ status: action })
      .eq('id', appointmentId)
      .select();

    if (updateError || !updated || updated.length === 0) {
      console.error('Supabase Update Error:', updateError);
      await answerCallback(botToken, callbackId, '❌ Lỗi khi cập nhật cơ sở dữ liệu!');
      return NextResponse.json({ ok: true });
    }

    // 3. Reply on Telegram and remove the buttons
    const statusLabel =
      action === 'CONFIRMED' ? '✅ ĐÃ CHẤP NHẬN (CONFIRMED)' : '❌ ĐÃ TỪ CHỐI (REJECTED)';

    await answerCallback(botToken, callbackId, statusLabel);
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
      reply_markup: { inline_keyboard: [] },
    }),
  });
}