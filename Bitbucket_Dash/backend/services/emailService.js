const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your App Password
  },
});

/**
 * Sends an email with error handling.
 */
const sendEmail = async (to, subject, text) => {
  try {
    if (!to || !subject || !text) {
      console.error("⚠️ Missing email details: Ensure 'to', 'subject', and 'text' are provided.");
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });

    console.log(`📧 Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Email failed to send to ${to}:`, error.response?.data || error.message);
  }
};

// ✅ Ensure this is the correct way to export
module.exports = { sendEmail };
