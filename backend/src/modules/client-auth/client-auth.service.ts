import nodemailer from 'nodemailer';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Crée le transporteur Nodemailer (identique à auth.service.ts)
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}


// ── Email de réinitialisation de mot de passe ─────────────────────────────────
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  prenom: string
): Promise<void> {
  const baseUrl = FRONTEND_URL.replace(/\/+$/, '');
  const link = `${baseUrl}/reinitialiser-mot-de-passe?token=${token}`;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n📧 [DEV] Lien de réinitialisation pour ${email}: ${link}\n`);
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"RZMedical" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔑 Réinitialisez votre mot de passe RZMedical',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #1e3a5f; margin-bottom: 4px;">RZMedical</h2>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <p style="color: #374151; font-size: 15px;">Bonjour <strong>${prenom}</strong>,</p>
        <p style="color: #374151; font-size: 15px;">
          Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau :
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}"
             style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">
          Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe reste inchangé.
        </p>
        <p style="color: #6b7280; font-size: 12px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
          <span style="word-break: break-all; color: #f59e0b;">${link}</span>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 11px; text-align: center;">© RZMedical — Équipement médico-dentaire professionnel</p>
      </div>
    `,
  });
}
