import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xfrzrcjnuyzijsddwyuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcnpyY2pudXl6aWpzZGR3eXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDk0NzYsImV4cCI6MjA4NjA4NTQ3Nn0.EJ_3YfzDZVV3wE6TvR1ASD5JRcKB2HvpyjR6RMM0xM8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
