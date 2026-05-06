async function test() {
  try {
    const email = `test-${Date.now()}@example.com`;
    const pass = 'StrongPass123!';
    
    console.log("Registering...");
    const regRes = await fetch('https://127.0.0.1/api/auth/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Host': 'eventify-api-dev.local.home' 
      },
      body: JSON.stringify({ email, password: pass, name: 'Test User' })
    });
    const regText = await regRes.text();
    let regData;
    try { regData = JSON.parse(regText); } catch(e) { regData = regText; }
    console.log("Register Response:", regRes.status, regData);

    console.log("Logging in...");
    const loginRes = await fetch('https://127.0.0.1/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Host': 'eventify-api-dev.local.home'
      },
      body: JSON.stringify({ email, password: pass })
    });
    const loginText = await loginRes.text();
    let loginData;
    try { loginData = JSON.parse(loginText); } catch(e) { loginData = loginText; }
    console.log("Login Response:", loginRes.status, loginData);

  } catch (e) {
    console.error(e);
  }
}
test();