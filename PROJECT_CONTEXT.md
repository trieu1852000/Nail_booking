# 1. TỔNG QUAN & TECH STACK
- Dự án: Website đặt lịch tiệm Nail (Khách book từ Google -> Lưu lịch PENDING -> Báo Telegram cho Thợ & Chủ -> 1 trong 2 Accept/Reject).
- Tech Stack: Next.js (App Router, TypeScript), Tailwind CSS, Supabase (PostgreSQL + Realtime), Telegram Bot API.

# 2. DATABASE SCHEMA (Supabase)
- `services`: id (uuid, PK), name (text), duration_minutes (int), price (numeric)
- `staff`: id (uuid, PK), name (text), phone (text), telegram_chat_id (text), is_active (bool)
- `appointments`: id (uuid, PK), customer_name (text), customer_phone (text), service_id (uuid, FK), staff_id (uuid, FK), appointment_time (timestamptz), status (text: 'PENDING' | 'CONFIRMED' | 'REJECTED'), created_at (timestamptz)

# 3. CẤU TRÚC FILE & EXPORT QUAN TRỌNG ĐÃ CÓ
- `lib/supabase.ts`: Export biến `supabase` và các interfaces: `Service`, `Staff`, `Appointment`, `AppointmentStatus`.
- `.env.local`: Đã cấu hình `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `TELEGRAM_BOT_TOKEN`, `OWNER_TELEGRAM_CHAT_ID`.
- `lib/supabase.ts`: Export `supabase` và các interfaces `Service`, `Staff`, `Appointment`, `AppointmentStatus`.
- `components/BookingForm.tsx`: Giao diện khách chọn dịch vụ, thợ, ngày giờ và tự động khóa giờ đã kín lịch.
- `app/page.tsx`: Trang chủ hiển thị form đặt lịch.
# 4. TRẠNG THÁI TIẾN ĐỘ (PROGRESS)
- [x] Giai đoạn 1: Thiết lập Database & Kết nối Supabase (đã xong)
- [x] Giai đoạn 2: Giao diện Đặt lịch cho Khách hàng (Frontend) (đã xong)
- [x] Giai đoạn 3: API Lưu lịch tạm thời & Bắn thông báo Telegram
- [ ] Giai đoạn 4: Webhook xử lý Accept / Reject từ Telegram
- [ ] Giai đoạn 5: Trang Dashboard quản lý lịch (Realtime)

# 5. QUY TẮC CODE CHO GEMINI
- Chỉ viết code cho các file được yêu cầu trong bước hiện tại.
- Không viết lại các file đã đánh dấu [x] hoàn thành.
- Trả lời ngắn gọn, đi thẳng vào code, dùng đúng tên biến/cột trong Database Schema.