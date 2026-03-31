/**
 * Mock email utility for HireOS.
 * In a production environment, this would use Resend, SendGrid, or AWS SES.
 */

export async function sendSchedulingEmail(candidateEmail, token) {
  const schedulingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/schedule/${token}`;
  
  console.log('--------------------------------------------------');
  console.log(`[EMAIL] To: ${candidateEmail}`);
  console.log(`[EMAIL] Subject: Schedule your HireOS Interview`);
  console.log(`[EMAIL] Body: Congratulations! You have been shortlisted. Please pick a time for your interview here: ${schedulingUrl}`);
  console.log('--------------------------------------------------');

  // Simulated delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true };
}

export async function sendConfirmationEmail(candidateEmail, startTime) {
  const date = new Date(startTime).toLocaleString();
  
  console.log('--------------------------------------------------');
  console.log(`[EMAIL] To: ${candidateEmail}`);
  console.log(`[EMAIL] Subject: Interview Confirmed - HireOS`);
  console.log(`[EMAIL] Body: Your interview has been confirmed for ${date}. We look forward to meeting you!`);
  console.log('--------------------------------------------------');

  return { success: true };
}
