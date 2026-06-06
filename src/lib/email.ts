import 'server-only'

export async function enviarCodigoRecuperacao(para: string, matricula: string, codigo: string) {
  const apiUrl = process.env.COPA_API_URL
  const apiKey = process.env.COPA_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error('COPA_API_URL ou COPA_API_KEY não configurados')
  }

  const assunto = `${codigo} é seu código de acesso — Colleto Figurinhas`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070e1a;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070e1a;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0a1628,#0d2040);border-radius:16px 16px 0 0;padding:32px 32px 24px;text-align:center;border:1px solid rgba(59,130,246,0.2);border-bottom:none">
          <div style="font-size:10px;letter-spacing:5px;text-transform:uppercase;color:rgba(96,165,250,0.7);margin-bottom:6px">Colleto</div>
          <div style="font-size:22px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#ffffff">🃏 Figurinhas</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;letter-spacing:1px">Álbum Digital</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#0d1a2e;padding:32px;border:1px solid rgba(59,130,246,0.1);border-top:none;border-bottom:none">
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#ffffff">Olá! 👋</p>
          <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6">
            Recebemos uma solicitação para redefinir a senha da matrícula
            <strong style="color:#60a5fa">#${matricula}</strong>.<br>
            Use o código abaixo para continuar.
          </p>

          <!-- Código -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
            <tr><td style="background:linear-gradient(135deg,#0d1f40,#0f2450);border:1px solid rgba(96,165,250,0.3);border-radius:12px;padding:28px;text-align:center">
              <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(96,165,250,0.6);margin-bottom:12px">Seu código de acesso</div>
              <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#60a5fa;text-shadow:0 0 30px rgba(96,165,250,0.4)">${codigo}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:12px">⏱ Válido por <strong style="color:rgba(255,255,255,0.6)">1 hora</strong></div>
            </td></tr>
          </table>

          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.6">
            Se você não solicitou a redefinição de senha, ignore este e-mail com segurança — nenhuma alteração será feita na sua conta.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#070e1a;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border:1px solid rgba(59,130,246,0.1);border-top:1px solid rgba(59,130,246,0.08)">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:0.5px">
            Colleto Figurinhas · Álbum Digital<br>
            Este é um e-mail automático, não responda.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const res = await fetch(`${apiUrl}/album/enviar-email-recuperacao`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ para, matricula, assunto, html }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Email API retornou ${res.status}: ${body}`)
  }
}
