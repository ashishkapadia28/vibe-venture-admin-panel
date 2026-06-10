async function testPost() {
  console.log('Testing POST API on /api/inquiries ...');
  try {
    const res = await fetch(`http://127.0.0.1:3001/api/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        project_info: "This is a test project to check POST API"
      })
    });
    
    if (res.ok) {
       const json = await res.json();
       console.log(`✅ [POST] /api/inquiries -> ${res.status} OK`);
       console.log('Created Record:', json);
    } else {
       const text = await res.text();
       console.log(`❌ [POST] /api/inquiries -> ${res.status} FAILED: ${text}`);
    }
  } catch (e) {
    console.log(`❌ [POST] /api/inquiries -> ERROR: ${e.message}`);
  }
}

testPost();
