interface SendNotificationParams {
  appointmentId: string;
  customer_name: string;
  customer_phone: string;
  appointment_time: string;
  serviceName: string;
  servicePrice: number;
  staffName: string;
  staffTelegramChatId?: string | null;
}

export async function sendBookingTelegramNotification(params: SendNotificationParams) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const ownerChatId = process.env.OWNER_TELEGRAM_CHAT_ID;

  if (!botToken) {
    console.error('Thiếu cấu hình TELEGRAM_BOT_TOKEN trong .env.local');
    return;
  }

  const formattedTime = new Date(params.appointment_time).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const messageText = `
🔔 *LỊCH ĐẶT MỚI (PENDING)*
━━━━━━━━━━━━━━━
👤 *Khách hàng:* ${params.customer_name}
📞 *SĐT:* \`${params.customer_phone}\`
💅 *Dịch vụ:* ${params.serviceName} ($${params.servicePrice})
🧑‍🎨 *Thợ phụ trách:* ${params.staffName}
⏰ *Thời gian:* ${formattedTime}
  `.trim();

  // Tạo nút bấm Inline Keyboard chứa action và ID lịch hẹn (chuẩn bị cho Giai đoạn 4)
  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '✅ Chấp nhận (Accept)',
          callback_data: `CONFIRMED:${params.appointmentId}`,
        },
        {
          text: '❌ Từ chối (Reject)',
          callback_data: `REJECTED:${params.appointmentId}`,
        },
      ],
    ],
  };

  // Gộp danh sách Chat ID của Chủ và Thợ (Set giúp lọc trùng nếu Chủ và Thợ là cùng 1 người)
  const targetChatIds = Array.from(
    new Set([ownerChatId, params.staffTelegramChatId].filter(Boolean))
  ) as string[];

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  await Promise.allSettled(
    targetChatIds.map((chatId) =>
      fetch(telegramApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard,
        }),
      })
    )
  );
}