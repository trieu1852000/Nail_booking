'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Đăng nhập thất bại.');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-pink-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center text-pink-600">🔒 Admin Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-400 outline-none"
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-400 outline-none"
        />
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-600 text-white p-3 rounded-lg font-bold hover:bg-pink-700 transition disabled:opacity-50"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  );
}