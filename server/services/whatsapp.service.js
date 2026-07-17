const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let clientReady = false;

// Initialize the WhatsApp Web Client with local session saving
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "authpro-session",
    dataPath: "./.wwebjs_auth"
  }),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  }
});

client.on('qr', (qr) => {
  console.log('\n======================================================================');
  console.log('  💬 [AuthPro WhatsApp Bot] Scan the QR code below to connect WhatsApp:');
  console.log('======================================================================\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  clientReady = true;
  console.log('\n===================================================');
  console.log('  💬 [AuthPro WhatsApp Bot] Connected & Ready!  ');
  console.log('===================================================\n');
});

client.on('auth_failure', (msg) => {
  console.error('WhatsApp Bot authentication failure:', msg);
});

client.on('disconnected', (reason) => {
  clientReady = false;
  console.log('WhatsApp Bot disconnected:', reason);
});

// Start the client initialization
console.log('Initializing WhatsApp Bot...');
client.initialize().catch(err => {
  console.error('Error initializing WhatsApp bot:', err);
});

async function sendWhatsAppOTP(phone, code) {
  if (!clientReady) {
    console.log(`\n⚠️ WhatsApp Bot is not connected yet. Cannot send message to ${phone}.`);
    return { success: false, fallback: true };
  }

  try {
    // Format the number: remove '+' and append '@c.us'
    const formattedNumber = phone.replace('+', '') + '@c.us';
    const message = `*AuthPro Secure Verification*\n\nYour 6-digit OTP code is: *${code}*\n\nThis code expires in 5 minutes.`;
    
    await client.sendMessage(formattedNumber, message);
    console.log(`\n💬 [WhatsApp Bot] OTP sent successfully to ${phone}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendWhatsAppOTP, isReady: () => clientReady };
