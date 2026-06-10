const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  console.log("Checking if insert as anon works directly...");
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        title: "Test Inquiry from Website",
        message: "Hello! This is a test notification to verify the real-time system is working correctly.",
        type: "inquiry"
      }
    ]);
  console.log("Result:", { data, error });
}

checkPolicies();
