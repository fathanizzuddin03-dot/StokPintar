import { createClient } from '@base44/sdk';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually and trim carriage returns
const envPath = path.resolve(process.cwd(), '.env.local');
let env = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const cleanedLine = line.replace('\r', '').trim();
    const match = cleanedLine.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2] || '';
      value = value.trim();
      // Remove quotes if present
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      env[key] = value;
    }
  });
} else {
  console.error("Error: File .env.local tidak ditemukan!");
  process.exit(1);
}

const appId = env.VITE_BASE44_APP_ID;
const appBaseUrl = env.VITE_BASE44_APP_BASE_URL;

console.log(`Parsed App ID: [${appId}]`);
console.log(`Parsed Backend URL: [${appBaseUrl}]`);

if (!appId || !appBaseUrl) {
  console.error("Error: VITE_BASE44_APP_ID atau VITE_BASE44_APP_BASE_URL kosong!");
  process.exit(1);
}

const base44 = createClient({
  appId,
  requiresAuth: false,
  appBaseUrl
});

const targetUsers = [
  { email: 'owner1@stokpintar.com', password: 'OwnerPassword123!', role: 'owner' },
  { email: 'admin1@stokpintar.com', password: 'AdminPassword123!', role: 'admin' },
  { email: 'staff1@stokpintar.com', password: 'StaffPassword123!', role: 'staff' }
];

async function seed() {
  console.log("Memulai pembuatan akun di database Base44...");
  
  for (const user of targetUsers) {
    try {
      console.log(`Mencoba membuat akun: ${user.email} (Role: ${user.role})...`);
      // register via auth
      await base44.auth.register({ 
        email: user.email, 
        password: user.password,
        role: user.role
      });
      console.log(`Sukses membuat akun: ${user.email}`);
    } catch (error) {
      console.error(`Gagal membuat akun ${user.email}:`, error.message || error);
    }
  }
}

seed();
