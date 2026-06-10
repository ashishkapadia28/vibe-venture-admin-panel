const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8').split('\n');
  envConfig.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotification() {
  console.log("Logging in as admin...");
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'ashishkdevs@gmail.com',
    password: '@Ashu123'
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }

  console.log("Attempting to insert a test notification...");
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        title: "Test Inquiry from AI",
        message: "Hello! This is a test notification to verify the real-time system is working correctly.",
        type: "inquiry",
        read_status: false
      }
    ])
    .select();

  if (error) {
    console.error("Error inserting notification:", error.message);
    if (error.code === '42P01') {
      console.log("Error: The 'notifications' table does not exist. Please run the SQL query first.");
    }
  } else {
    console.log("Success! Notification inserted. Check your admin panel.");
    console.log("Inserted data:", data);
  }
}

testNotification();
