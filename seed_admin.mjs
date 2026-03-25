import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);
async function seed() {
  const targetEmail = 'jeferson.costa@logaxis.com.br';
  
  // Find in auth.users
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  let user = users.find(u => u.email === targetEmail);
  
  if (!user) {
    console.log('User not found in auth.users, creating...');
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: targetEmail,
      password: 'StrongPassword123!',
      email_confirm: true,
      user_metadata: { name: 'Jeferson Costa' }
    });
    if (error) {
      console.error('Error creating auth user:', error);
      return;
    }
    user = data.user;
    console.log(`User created. Use password: StrongPassword123!`);
  } else {
    console.log('User already exists in auth.users');
  }

  // Insert into saas_admins
  const { data: existingAdmin } = await supabaseAdmin.from('saas_admins').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (existingAdmin) {
    console.log('Admin already exists in saas_admins');
  } else {
    const { error: insertError } = await supabaseAdmin.from('saas_admins').insert({
      nome: 'Jeferson Costa',
      email: targetEmail,
      senha_hash: 'MIGRATED',
      auth_user_id: user.id,
      ativo: true
    });
    if (insertError) {
      console.error('Error inserting saas_admin:', insertError);
    } else {
      console.log('SaaS Admin linked successfully! You can now log in.');
    }
  }
}
seed();
