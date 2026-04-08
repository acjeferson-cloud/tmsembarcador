import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connString = process.env.VITE_SUPABASE_URL
  .replace('https://', 'postgres://postgres:wthpdsbvfrnrzupvhquo.supabase.co@') 
  // Wait, the password is not .supabase.co
  // Let's just use REST API to insert
