import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bfnkbidqriackvtsvqqq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbmtiaWRxcmlhY2t2dHN2cXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTgwMjUsImV4cCI6MjA4NzA5NDAyNX0.mo_X9CfCDiEaKesbD1A5F1fUH9P_cJoWqJNsgq9NiNw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
