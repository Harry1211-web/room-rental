// run 'node src/app/create_example_accounts.js'

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'  // để đọc biến môi trường từ .env
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Khởi tạo Supabase client với Service Role Key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  // process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

// Tạo user admin mới
async function createAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,       // đổi email admin của bạn
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD,             // đổi mật khẩu mạnh hơn
    email_confirm: true,              // xác nhận email luôn
    user_metadata: {
      name: 'Admin',
      role: 'admin',
      phone_number: '',
      avatar_url: null
    }
  })

  if (error) {
    console.error('Error admin creation: ', error)
  } else {
    console.log('Create admin successful!')
    console.log(data)
  }
}

createAdmin()

async function createLandlord() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "dongquan2110@gmail.com",       // đổi email admin của bạn
    password: "123",             // đổi mật khẩu mạnh hơn
    email_confirm: true,              // xác nhận email luôn
    user_metadata: {
      name: 'Quan',
      role: 'landlord',
      phone_number: '1',
      avatar_url: null
    }
  })

  if (error) {
    console.error('Error landlord creation: ', error)
  } else {
    console.log('Create landlord successful!')
    console.log(data)
  }
}

createLandlord()

async function createTenant() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "harryt121124@gmail.com",       // đổi email admin của bạn
    password: "123",             // đổi mật khẩu mạnh hơn
    email_confirm: true,              // xác nhận email luôn
    user_metadata: {
      name: 'Harry',
      role: 'tenant',
      phone_number: '2',
      avatar_url: null
    }
  })

  if (error) {
    console.error('Error tenant creation: ', error)
  } else {
    console.log('Create tenant successful!')
    console.log(data)
  }
}

createTenant()

// const { data, error } = await supabase
//   .from("Rooms")
//   .select("*")
//   .eq("idRoom", "e0ec078d-e102-457e-aad0-e32669d378ed")
//   .single()
// if (!data) {
//   console.log("Không tìm thấy room");
// } else {
//   console.log(data);
// }
