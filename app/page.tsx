import BookingForm from '@/components/BookingForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-pink-50 py-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800">The A Nails</h1>
        <p className="text-gray-600 mt-2">Chọn dịch vụ và đặt lịch hẹn nhanh chóng ngay tại đây!</p>
      </div>
      <BookingForm />
    </main>
  );
}