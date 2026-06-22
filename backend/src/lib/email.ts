import { Resend } from "resend";
import { getEnv } from "./env";

function getSecret(c: { env?: unknown }, key: string): string {
  const env = c.env as Record<string, string> | undefined;
  return env?.[key] || (process.env as Record<string, string>)?.[key] || getEnv(key) || "";
}

export async function sendDonationEmail(c: { env?: unknown }, email: string, name: string, amount: number, currency: string) {
  if (!email) return;
  const resendKey = getSecret(c, "RESEND_API_KEY");
  if (resendKey) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "Kingdom Mission Network <giving@heavenlykingdomnetwork.org>",
      to: email,
      subject: "Thank you for your Donation",
      html: `<p>Hi ${name || 'Anonymous'},</p><p>We have successfully received your donation of ${amount} ${currency}. Thank you for your generosity!</p>`,
    });
  }
}
