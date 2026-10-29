import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin-auth';
import AdminDashboard from '@/components/AdminDashboard';

async function Guard() {
  if (!(await isAdmin())) redirect('/admin/login');
  return <AdminDashboard />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-600">Đang tải...</p>}>
      <Guard />
    </Suspense>
  );
}