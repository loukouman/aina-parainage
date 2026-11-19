// Usage : npm run create-admin -- email@exemple.com 'mot-de-passe-de-12-caracteres-ou-plus'
// Si le compte existe déjà, son mot de passe est remplacé.
import { createClient } from '@supabase/supabase-js';
import { hash } from '@node-rs/argon2';
const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 12) { console.error('Usage : email + mot de passe (12 caractères minimum)'); process.exit(1); }
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { error } = await db.from('admin_users').upsert({ email: email.toLowerCase(), password_hash: await hash(password), approved: true }, { onConflict: 'email' });
if (error) { console.error(error.message); process.exit(1); }
console.log('Compte administrateur enregistré :', email.toLowerCase());
