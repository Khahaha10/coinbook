import { Inject, Injectable, Logger } from '@nestjs/common';
import { ENV, type Env } from '../../config/env';

const RESEND_URL = 'https://api.resend.com/emails';
const TIMEOUT_MS = 10_000;
const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function emailHtml(text: string): string {
  const body = text
    .split('\n')
    .map((line) =>
      escapeHtml(line).replace(URL_PATTERN, '<a href="$1" style="color:#4338CA">$1</a>'),
    )
    .join('<br>');
  return `<!doctype html><html lang="id"><body style="margin:0;padding:24px;background:#EEF0F6;font-family:Arial,sans-serif;color:#1E1B3A"><div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:14px;padding:24px;font-size:15px;line-height:1.5"><p style="margin:0 0 16px;font-weight:bold;color:#312E81">Coinbook</p><p style="margin:0">${body}</p></div></body></html>`;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  get enabled(): boolean {
    return Boolean(this.env.RESEND_API_KEY && this.env.EMAIL_FROM);
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`[email:console] subject=${subject} text=${text}`);
      return;
    }
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.env.EMAIL_FROM,
        to: [to],
        subject,
        text,
        html: emailHtml(text),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}`);
  }
}
