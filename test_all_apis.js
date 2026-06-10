const endpoints = [
  '/api/settings',
  '/api/services',
  '/api/industries',
  '/api/authors',
  '/api/blogs',
  '/api/case-studies',
  '/api/inquiries',
  '/api/jobs',
  '/api/applications'
];

async function testApis() {
  console.log('Testing GET APIs to verify Database connections...');
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`http://127.0.0.1:3001${endpoint}`);
      if (res.ok) {
         console.log(`✅ [GET] ${endpoint} -> ${res.status} OK`);
      } else {
         const text = await res.text();
         console.log(`❌ [GET] ${endpoint} -> ${res.status} FAILED: ${text}`);
      }
    } catch (e) {
      console.log(`❌ [GET] ${endpoint} -> ERROR: ${e.message}`);
    }
  }
}

testApis();
