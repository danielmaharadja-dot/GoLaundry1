import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Konfigurasi transporter SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: parseInt(process.env.SMTP_PORT) === 465 || !process.env.SMTP_PORT, // true jika port 465 atau default
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Mengirim email reset password ke pengguna
 * @param {string} toEmail - Alamat email tujuan
 * @param {string} resetLink - Link tautan untuk reset password
 * @returns {Promise<boolean>} - Status pengiriman email
 */
export async function sendResetPasswordEmail(toEmail, resetLink) {
  const isSmtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!isSmtpConfigured) {
    console.warn("==================================================");
    console.warn("WARNING: SMTP credentials (SMTP_USER/SMTP_PASS) are not configured.");
    console.warn(`RESET PASSWORD LINK FOR ${toEmail}:`);
    console.warn(resetLink);
    console.warn("==================================================");
    return false;
  }

  const mailOptions = {
    from: `"GoLaundry Support" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Reset Password - GoLaundry",
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f9fa; padding: 30px; margin: 0;">
        <div style="max-width: 600px; background-color: #ffffff; border-radius: 12px; margin: 0 auto; box-shadow: 0 4px 12px rgba(10, 61, 61, 0.05); overflow: hidden; border: 1px solid rgba(15, 110, 110, 0.1);">
          <!-- Header -->
          <div style="background-color: #0F6E6E; padding: 25px; text-align: center;">
            <span style="font-size: 32px;">🧺</span>
            <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">GoLaundry</h1>
          </div>
          <!-- Body -->
          <div style="padding: 35px 25px; color: #16303A;">
            <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; color: #0A3D3D;">Permintaan Reset Password</h2>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Halo, <br/>
              Kami menerima permintaan untuk menyetel ulang password akun GoLaundry Anda. Silakan klik tombol di bawah ini untuk mengganti password Anda:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" target="_blank" style="background-color: #0F6E6E; color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(15, 110, 110, 0.15); transition: background-color 0.2s;">
                Reset Password Saya
              </a>
            </div>
            <p style="font-size: 14px; line-height: 1.5; color: rgba(22, 48, 58, 0.6); margin-top: 30px;">
              Tautan ini hanya berlaku selama 1 jam. Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini dan password Anda akan tetap aman.
            </p>
            <hr style="border: 0; border-top: 1px solid rgba(15, 110, 110, 0.15); margin: 30px 0;" />
            <p style="font-size: 12px; line-height: 1.5; color: rgba(22, 48, 58, 0.4); word-break: break-all;">
              Jika tombol di atas tidak berfungsi, salin dan tempel URL berikut ke browser Anda:<br/>
              <a href="${resetLink}" style="color: #0F6E6E; text-decoration: underline;">${resetLink}</a>
            </p>
          </div>
          <!-- Footer -->
          <div style="background-color: #EAF6F4; padding: 20px; text-align: center; font-size: 12px; color: #0A3D3D; opacity: 0.8;">
            &copy; ${new Date().getFullYear()} GoLaundry. Semua Hak Dilindungi.
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
}
