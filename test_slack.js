const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSlackWebhook() {
  const { data: candidates } = await supabase
    .from('candidates')
    .select('*, offers!inner(*)')
    .eq('offers.status', 'ACCEPTED')
    .limit(1);

  if (!candidates || candidates.length === 0) {
    console.log('No accepted offers found to test.');
    return;
  }

  const email = candidates[0].email;
  console.log('Testing event webhook for email:', email);

  const payload = {
    token: 'test-token',
    team_id: 'T12345',
    api_app_id: 'A12345',
    event: {
      type: 'team_join',
      user: {
        id: 'U12345678',
        profile: {
          email: email
        }
      }
    },
    type: 'event_callback',
    event_id: 'Ev12345',
    event_time: Math.floor(Date.now() / 1000)
  };

  try {
    const res = await fetch('http://localhost:3000/api/slack/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    console.log('Webhook Response:', result);
    console.log('Check your Next.js terminal logs for the AI generation output!');
  } catch (err) {
    console.error('Webhook Error:', err);
  }
}
testSlackWebhook();
