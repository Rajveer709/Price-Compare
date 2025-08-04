import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://isnrkhpeikpyqsrcrkr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbnJraHBlaXBreXNxc3Jja2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODk3ODcsImV4cCI6MjA2OTg2NTc4N30.2acM7PQ2Tkn5zX3ibanIvx4V0L1K7Y2NAKYubLm22zc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
