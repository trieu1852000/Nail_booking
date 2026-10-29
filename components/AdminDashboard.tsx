'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Appointment, Staff } from '@/lib/supabase';

const START_HOUR = 9;
const END_HOUR = 19;
const HOUR_PX = 72;

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-yellow-100 border-yellow-400 text-yellow-900',
  CONFIRMED: 'bg-green-100 border-green-500 text-green-900',
  REJECTED: 'bg-gray-100 border-gray-300 text-gray-400 line-through',
};

function toDateInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showRejected, setShowRejected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDate(toDateInput(new Date()));
  }, []);

  const load = useCallback(async () => {
    if (!date) return;
    const [y, m, d] = date.split('-').map(Number);
    const start = new Date(y, m - 1, d);
    const end = new Date(y, m - 1, d + 1);

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/appointments?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`
      );
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      if (res.ok) {
        setStaff(json.staff);
        setAppointments(json.appointments);
      }
    } finally {
      setLoading(false);
    }
  }, [date, router]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: refetch whenever an appointment changes
  useEffect(() => {
    const channel = supabase
      .channel('admin-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const shiftDay = (delta: number) => {
    const [y, m, d] = date.split('-').map(Number);
    setDate(toDateInput(new Date(y, m - 1, d + delta)));
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const totalHeight = hours.length * HOUR_PX;
  const visible = appointments.filter((a) => showRejected || a.status !== 'REJECTED');

  return (
    <main className="min-h-screen bg-pink-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-extrabold text-gray-800">📅 Lịch hẹn - The A Nails</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold bg-white border rounded-lg hover:bg-gray-100"
          >
            Đăng xuất
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button onClick={() => shiftDay(-1)} className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-100">←</button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button onClick={() => shiftDay(1)} className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-100">→</button>
          <button onClick={() => setDate(toDateInput(new Date()))} className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-100 text-sm">
            Hôm nay
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={showRejected} onChange={(e) => setShowRejected(e.target.checked)} />
            Hiện lịch đã từ chối
          </label>
          {loading && <span className="text-sm text-gray-500">Đang tải...</span>}
        </div>

        <div className="flex gap-4 mb-3 text-xs text-gray-700">
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded bg-yellow-200 border border-yellow-400" /> Chờ xác nhận</span>
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded bg-green-200 border border-green-500" /> Đã xác nhận</span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
          <div
            className="grid min-w-fit"
            style={{ gridTemplateColumns: `56px repeat(${Math.max(staff.length, 1)}, minmax(180px, 1fr))` }}
          >
            {/* Header row */}
            <div className="border-b bg-gray-50" />
            {staff.map((s) => (
              <div key={s.id} className="p-3 text-center font-bold text-pink-600 border-b border-l bg-gray-50">
                {s.name}
                <span className="block text-xs font-normal text-gray-500">
                  {visible.filter((a) => a.staff_id === s.id).length} lịch
                </span>
              </div>
            ))}

            {/* Time column */}
            <div className="relative" style={{ height: totalHeight }}>
              {hours.map((h, i) => (
                <div
                  key={h}
                  className="absolute right-2 text-xs text-gray-500 -translate-y-2"
                  style={{ top: i * HOUR_PX }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Staff columns */}
            {staff.map((s) => (
              <div key={s.id} className="relative border-l" style={{ height: totalHeight }}>
                {hours.map((h, i) => (
                  <div key={h} className="absolute inset-x-0 border-t border-gray-100" style={{ top: i * HOUR_PX }} />
                ))}

                {visible
                  .filter((a) => a.staff_id === s.id)
                  .map((a) => {
                    const startDt = new Date(a.appointment_time);
                    const duration = a.services?.duration_minutes || 60;
                    const endDt = new Date(startDt.getTime() + duration * 60000);
                    const minutesFromStart = startDt.getHours() * 60 + startDt.getMinutes() - START_HOUR * 60;
                    const top = (minutesFromStart / 60) * HOUR_PX;
                    const height = Math.max((duration / 60) * HOUR_PX - 2, 36);

                    return (
                      <div
                        key={a.id}
                        className={`absolute inset-x-1 rounded-lg border-l-4 p-2 text-xs overflow-hidden shadow-sm ${STATUS_STYLE[a.status]}`}
                        style={{ top, height }}
                        title={`${a.customer_name} - ${a.customer_phone}`}
                      >
                        <div className="font-bold">
                          {fmtTime(startDt)} - {fmtTime(endDt)}
                        </div>
                        <div className="font-semibold truncate">{a.customer_name}</div>
                        <div className="truncate">{a.customer_phone}</div>
                        <div className="truncate">{a.services?.name}</div>
                      </div>
                    );
                  })}
              </div>
            ))}

            {staff.length === 0 && (
              <div className="p-6 text-center text-gray-500 border-l">Chưa có thợ nào đang hoạt động.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}