import 'server-only'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function enviarCodigoRecuperacao(para: string, matricula: string, codigo: string) {
  await transporter.sendMail({
    from:    `"Álbum Supermédica" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to:      para,
    subject: `${codigo} — Seu código de recuperação`,
    html: `
      <div style="font-family:sans-serif;max-width:440px;margin:0 auto;padding:32px;background:#06080f;color:#fff;border-radius:12px">
        <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#f0c040;margin-bottom:8px">Álbum Supermédica · Super Copa 2026</div>
        <h2 style="margin:0 0 16px;font-size:20px">Recuperação de senha</h2>
        <p style="color:#aaa;margin-bottom:24px">Matrícula: <strong style="color:#fff">${matricula}</strong></p>
        <p style="color:#aaa;margin-bottom:12px">Use o código abaixo para redefinir sua senha. Válido por <strong style="color:#fff">15 minutos</strong>.</p>
        <div style="background:#1c1540;border:1px solid rgba(240,192,64,0.3);border-radius:10px;padding:24px;text-align:center;margin:24px 0">
          <div style="font-size:42px;font-weight:900;letter-spacing:10px;color:#f0c040">${codigo}</div>
        </div>
        <p style="color:#666;font-size:12px">Se você não solicitou, ignore este e-mail. Nenhuma alteração será feita.</p>
      </div>
    `,
  })
}
