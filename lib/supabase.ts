import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

export interface Staff {
  id: string;
  name: string;
  phone: string | null;
  telegram_chat_id: string | null;
  is_active: boolean;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_id: string;
  staff_id: string;
  appointment_time: string;
  status: AppointmentStatus;
  created_at: string;
  services?: Service;
  staff?: Staff;
}