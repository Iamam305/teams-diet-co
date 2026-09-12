import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  return new Resend(apiKey);
}

function getFromAddress() {
  const from = process.env.EMAIL_FROM;

  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }

  return from;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not set");
    }

    console.info(`[email skipped] ${subject} -> ${to}`);
    const link = html.match(/href="([^"]+)"/)?.[1];
    if (link) {
      console.info(`[email link] ${link}`);
    }
    return;
  }

  const { error } = await getResend().emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emailLayout(title: string, body: string) {
  return `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5; color: #111; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">${escapeHtml(title)}</h1>
      ${body}
      <p style="margin-top: 32px; color: #666; font-size: 12px;">DietCo</p>
    </div>
  `;
}

export function verificationEmailHtml(url: string) {
  return emailLayout(
    "Verify your email",
    `
      <p>Confirm your email address to finish creating your DietCo account.</p>
      <p><a href="${escapeHtml(url)}">Verify email</a></p>
      <p>If you did not create this account, you can ignore this email.</p>
    `,
  );
}

export function resetPasswordEmailHtml(url: string) {
  return emailLayout(
    "Reset your password",
    `
      <p>We received a request to reset your DietCo password.</p>
      <p><a href="${escapeHtml(url)}">Reset password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  );
}

export function invitationCredentialsEmailHtml({
  organizationName,
  teamName,
  loginUrl,
  email,
  username,
  password,
  inviteUrl,
  expiresLabel,
}: {
  organizationName: string;
  teamName?: string | null;
  loginUrl: string;
  email: string;
  username: string;
  password: string;
  inviteUrl: string;
  expiresLabel: string;
}) {
  const teamLine = teamName
    ? `<p>You were invited to the <strong>${escapeHtml(teamName)}</strong> team.</p>`
    : "";

  return emailLayout(
    `Join ${organizationName} on DietCo`,
    `
      <p>You have been invited to join <strong>${escapeHtml(organizationName)}</strong>.</p>
      ${teamLine}
      <p>Use these temporary credentials to sign in. You must change this password after your first login.</p>
      <ul>
        <li>Email: <strong>${escapeHtml(email)}</strong></li>
        <li>Username: <strong>${escapeHtml(username)}</strong></li>
        <li>Temporary password: <strong>${escapeHtml(password)}</strong></li>
      </ul>
      <p><a href="${escapeHtml(loginUrl)}">Sign in</a></p>
      <p>After you change your password, accept the invitation: <a href="${escapeHtml(inviteUrl)}">Accept invitation</a></p>
      <p>This invitation expires ${escapeHtml(expiresLabel)}.</p>
    `,
  );
}

export function invitationExistingUserEmailHtml({
  organizationName,
  teamName,
  loginUrl,
  inviteUrl,
  expiresLabel,
}: {
  organizationName: string;
  teamName?: string | null;
  loginUrl: string;
  inviteUrl: string;
  expiresLabel: string;
}) {
  const teamLine = teamName
    ? `<p>You were invited to the <strong>${escapeHtml(teamName)}</strong> team.</p>`
    : "";

  return emailLayout(
    `Join ${organizationName} on DietCo`,
    `
      <p>You have been invited to join <strong>${escapeHtml(organizationName)}</strong>.</p>
      ${teamLine}
      <p><a href="${escapeHtml(loginUrl)}">Sign in</a> and then <a href="${escapeHtml(inviteUrl)}">accept the invitation</a>.</p>
      <p>This invitation expires ${escapeHtml(expiresLabel)}.</p>
    `,
  );
}
