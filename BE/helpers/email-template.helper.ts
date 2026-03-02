// Consistent HTML email template for all transactional emails

const BRAND_COLOR = "#2563eb";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3069";

// Escape HTML special characters in user-supplied strings to prevent broken email layout
function htmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Wraps any body HTML in the standard UITJobs email shell
export function buildEmailHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
        <!-- Header -->
        <tr><td style="background:${BRAND_COLOR};padding:20px 32px;border-radius:8px 8px 0 0;">
          <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">UITJobs</span>
        </td></tr>
        <!-- Title -->
        <tr><td style="background:#ffffff;padding:28px 32px 8px;">
          <h2 style="margin:0;color:#111827;font-size:18px;font-weight:600;line-height:1.4;">${title}</h2>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#ffffff;padding:12px 32px 32px;color:#374151;font-size:15px;line-height:1.6;">
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
            This is an automated message from UITJobs. Please do not reply to this email.<br>
            &copy; ${new Date().getFullYear()} UITJobs. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Styled OTP code block (reused in forgot-password and email-change emails)
export function otpBlock(otp: string): string {
  return `<div style="background:#eff6ff;border:2px dashed ${BRAND_COLOR};border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
  <span style="font-size:34px;font-weight:700;letter-spacing:10px;color:${BRAND_COLOR};">${otp}</span>
</div>`;
}

// CTA link button
function ctaButton(label: string, url: string): string {
  return `<p style="margin:20px 0 0;"><a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;">${label} →</a></p>`;
}

// Warning block for security alerts
function warningBlock(message: string): string {
  return `<div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;padding:12px 16px;margin:20px 0;">
  <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;">${message}</p>
</div>`;
}

// ─── Pre-built email templates ─────────────────────────────────────────────

export const emailTemplates = {

  // Forgot password OTP (5-minute expiry)
  forgotPasswordOtp: (otp: string) => ({
    subject: "Password Recovery OTP - UITJobs",
    html: buildEmailHtml(
      "Reset Your Password",
      `<p>We received a request to reset your UITJobs account password. Use the OTP below to continue:</p>
      ${otpBlock(otp)}
      <p style="color:#6b7280;font-size:14px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#6b7280;font-size:14px;">If you did not request a password reset, you can safely ignore this email.</p>`
    )
  }),

  // Email change OTP sent to the new email address (10-minute expiry)
  emailChangeOtp: (otp: string, newEmail: string) => ({
    subject: "Email Change Verification - UITJobs",
    html: buildEmailHtml(
      "Verify Your New Email Address",
      `<p>A request was made to link this address (<strong>${htmlEscape(newEmail)}</strong>) to a UITJobs account.</p>
      <p>Enter the OTP below to confirm ownership of this email:</p>
      ${otpBlock(otp)}
      <p style="color:#6b7280;font-size:14px;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="color:#6b7280;font-size:14px;">If you did not request this, please ignore this email — your inbox will not be affected.</p>`
    )
  }),

  // Security alert sent to the OLD email when a change is requested
  emailChangeSecurityAlert: (newEmail: string) => ({
    subject: "Security Alert: Email Change Requested - UITJobs",
    html: buildEmailHtml(
      "Email Change Requested on Your Account",
      `<p>A request was submitted to change the email address on your UITJobs account.</p>
      <table cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f9fafb;border-radius:6px;padding:12px 16px;width:100%;">
        <tr><td style="color:#6b7280;font-size:13px;">Requested new email</td></tr>
        <tr><td style="color:#111827;font-weight:600;">${htmlEscape(newEmail)}</td></tr>
      </table>
      ${warningBlock("If this was NOT you, change your password immediately to secure your account.")}
      <p style="color:#6b7280;font-size:14px;">If this was you, no action is needed — just verify with the OTP sent to your new email.</p>`
    )
  }),

  // Security notification after successful password reset
  passwordChanged: (email: string) => ({
    subject: "Security Alert: Your Password Was Changed - UITJobs",
    html: buildEmailHtml(
      "Your Password Has Been Changed",
      `<p>The password for your UITJobs account (<strong>${htmlEscape(email)}</strong>) was successfully changed.</p>
      ${warningBlock("If you did not make this change, reset your password immediately and contact support.")}
      <p style="color:#6b7280;font-size:14px;">If this was you, no action is needed.</p>`
    )
  }),

  // CV application approved
  cvApproved: (jobTitle: string, companyName: string) => ({
    subject: `Congratulations! Your Application for "${jobTitle}" Was Approved - UITJobs`,
    html: buildEmailHtml(
      "Your Application Was Approved!",
      `<p>Great news! Your application for the position below has been <strong style="color:#16a34a;">approved</strong>.</p>
      <table cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f0fdf4;border-radius:6px;padding:14px 16px;width:100%;">
        <tr><td style="color:#6b7280;font-size:13px;">Position</td></tr>
        <tr><td style="color:#111827;font-weight:600;padding-bottom:8px;">${htmlEscape(jobTitle)}</td></tr>
        <tr><td style="color:#6b7280;font-size:13px;">Company</td></tr>
        <tr><td style="color:#111827;font-weight:600;">${htmlEscape(companyName)}</td></tr>
      </table>
      <p>The company will reach out to you soon regarding the next steps.</p>
      ${ctaButton("View Your Applications", `${FRONTEND_URL}/candidate-manage/cv/list`)}`
    )
  }),

  // CV application not selected
  cvRejected: (jobTitle: string, companyName: string) => ({
    subject: `Update on Your Application for "${jobTitle}" - UITJobs`,
    html: buildEmailHtml(
      "Update on Your Application",
      `<p>Thank you for your interest in the following position:</p>
      <table cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f9fafb;border-radius:6px;padding:14px 16px;width:100%;">
        <tr><td style="color:#6b7280;font-size:13px;">Position</td></tr>
        <tr><td style="color:#111827;font-weight:600;padding-bottom:8px;">${htmlEscape(jobTitle)}</td></tr>
        <tr><td style="color:#6b7280;font-size:13px;">Company</td></tr>
        <tr><td style="color:#111827;font-weight:600;">${htmlEscape(companyName)}</td></tr>
      </table>
      <p>After careful consideration, the company has decided not to move forward with your application at this time. We encourage you to keep exploring — the right opportunity is out there.</p>
      ${ctaButton("Browse More Jobs", `${FRONTEND_URL}/search`)}`
    )
  }),
};
