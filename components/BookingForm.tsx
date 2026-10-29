'use client';

import { useState, useEffect } from 'react';
import { supabase, Service, Staff } from '@/lib/supabase';

export default function BookingForm() {
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Lấy ngày hiện tại dạng YYYY-MM-DD một cách an toàn cho Client Component
  const [minDate, setMinDate] = useState<string>('');

  useEffect(() => {
    setMinDate(new Date().toISOString().split('T')[0]);
  }, []);

  // 1. Load danh sách dịch vụ và thợ từ Supabase khi mở trang
  useEffect(() => {
    async function fetchData() {
      const { data: sData } = await supabase.from('services').select('*');
      const { data: stData } = await supabase.from('staff').select('*').eq('is_active', true);
      if (sData) setServices(sData);
      if (stData) setStaffList(stData);
    }
    fetchData();
  }, []);

  // 2. Khi thợ và ngày thay đổi, kiểm tra các khung giờ đã bị đặt để vô hiệu hóa
  useEffect(() => {
    async function fetchBookedSlots() {
      if (!selectedStaff || !selectedDate) return;

      const startOfDay = `${selectedDate}T00:00:00Z`;
      const endOfDay = `${selectedDate}T23:59:59Z`;

      const { data } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('staff_id', selectedStaff)
        .in('status', ['PENDING', 'CONFIRMED'])
        .gte('appointment_time', startOfDay)
        .lte('appointment_time', endOfDay);

      if (data) {
        const times = data.map((item) => {
          const dateObj = new Date(item.appointment_time);
          return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        });
        setBookedSlots(times);
      }
    }
    fetchBookedSlots();
  }, [selectedStaff, selectedDate]);

  // Các khung giờ làm việc cố định trong ngày
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // 3. Xử lý khi khách bấm nút Đặt lịch (Gọi API Giai đoạn 3: Lưu DB + Bắn Telegram)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setLoading(true);
    const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          service_id: selectedService,
          staff_id: selectedStaff,
          appointment_time: appointmentDateTime,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert('Lỗi đặt lịch: ' + (result.error || 'Không thể tạo lịch hẹn'));
      } else {
        setSuccessMessage('Đặt lịch thành công! Tiệm sẽ sớm liên hệ xác nhận cho bạn.');
        setCustomerName('');
        setCustomerPhone('');
        setSelectedTime('');
        setBookedSlots((prev) => [...prev, selectedTime]); // Khoá ngay khung giờ vừa đặt trên giao diện
      }
    } catch (err) {
      alert('Lỗi kết nối tới hệ thống, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-xl mt-10">
      <h1 className="text-2xl font-bold text-center text-pink-600 mb-6">💅 Đặt Lịch Tiệm Nail</h1>

      {successMessage ? (
        <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-lg text-center font-medium">
          {successMessage}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bước 1: Chọn Dịch vụ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">1. Chọn Dịch vụ</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-400 outline-none"
            >
              <option value="">-- Chọn dịch vụ làm móng --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (${s.price} - {s.duration_minutes} phút)
                </option>
              ))}
            </select>
          </div>

          {/* Bước 2: Chọn Thợ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">2. Chọn Thợ làm móng</label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-400 outline-none"
            >
              <option value="">-- Chọn thợ yêu thích --</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  Thợ: {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bước 3: Chọn Ngày */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">3. Chọn Ngày đến làm</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-400 outline-none"
            />
          </div>

          {/* Chọn Giờ */}
          {selectedStaff && selectedDate && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">4. Chọn Khung giờ trống</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => {
                  const isBooked = bookedSlots.includes(time);
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 text-sm rounded-lg border font-medium transition ${
                        isBooked
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-white text-gray-700 hover:border-pink-400'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Thông tin khách hàng */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tên của bạn</label>
              <input
                type="text"
                placeholder="Nhập họ tên"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                placeholder="Số điện thoại"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-400 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedTime}
            className="w-full bg-pink-600 text-white p-3 rounded-lg font-bold hover:bg-pink-700 transition disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Xác Nhận Đặt Lịch'}
          </button>
        </form>
      )}
    </div>
  );
}