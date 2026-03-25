import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function migrateAdmins() {
  console.log('Buscando SaaS Admins sem auth_user_id...');
  const { data: admins, error } = await supabaseAdmin
    .from('saas_admins')
    .select('id, email, nome')
    .is('auth_user_id', null);

  if (error) {
    console.error('Erro ao buscar admins:', error);
    return;
  }

  console.log(`Encontrados ${admins.length} admins para migrar.`);

  for (const admin of admins) {
    console.log(`Criando auth.users para ${admin.email}...`);
    
    // We create the user. Since we don't know the plain text password (it's hashed via subtle crypto on client),
    // we assign a strong temporary password. They might need to reset or use this for the first time.
    const tempPassword = `LogAxisAdmin@${new Date().getFullYear()}!`;
    
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: admin.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: admin.nome }
    });

    if (createError && createError.message.includes('already exists')) {
        // Find existing user if they already have an account
        console.log(`Usuário ${admin.email} já existe no auth.users. Vinculando...`);
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        const existing = users.find(u => u.email === admin.email);
        if (existing) {
            await linkAdmin(admin.id, existing.id);
        }
    } else if (createError) {
      console.error(`Erro ao criar ${admin.email}:`, createError.message);
    } else if (userData.user) {
      console.log(`Usuário criado (${userData.user.id}). Vinculando ao saas_admins...`);
      await linkAdmin(admin.id, userData.user.id);
      console.log(`Migrado com sucesso! Senha Temporária: ${tempPassword}`);
    }
  }
}

async function linkAdmin(adminId, authUserId) {
    const { error: updateError } = await supabaseAdmin
        .from('saas_admins')
        .update({ auth_user_id: authUserId })
        .eq('id', adminId);

    if (updateError) {
      console.error('Erro ao vincular auth_user_id:', updateError);
    }
}

migrateAdmins();
