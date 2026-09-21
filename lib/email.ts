import { Resend } from "resend";
import type { SellerSubmission, InvestorInquiry, ContactMessage, AdminInvitation } from "./types";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM = process.env.EMAIL_FROM ?? "Derax Properties <notifications@deraxproperties.com>";
const NOTIFY = process.env.NOTIFICATION_EMAIL ?? "acquisitions@deraxproperties.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * All email sends are best-effort: if RESEND_API_KEY is not configured, or
 * the send fails, we log it and move on rather than failing the visitor's
 * submission. The record in Supabase is always the source of truth.
 */
async function safeSend(payload: Parameters<Resend["emails"]["send"]>[0]) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping email send.", payload.subject);
    return;
  }
  try {
    await resend.emails.send(payload);
  } catch (error) {
    console.error("[email] Failed to send:", error);
  }
}

export async function sendSellerLeadNotification(submission: SellerSubmission) {
  const dashboardLink = `${SITE_URL}/admin/leads/${submission.id}`;

  await safeSend({
    from: FROM,
    to: NOTIFY,
    subject: `New Property Submission – ${submission.property_address}`,
    html: `
      <h2>New Seller Lead: ${submission.reference_number}</h2>
      <p><strong>Seller:</strong> ${submission.first_name} ${submission.last_name}</p>
      <p><strong>Phone:</strong> ${submission.phone}</p>
      <p><strong>Email:</strong> ${submission.email ?? "Not provided"}</p>
      <p><strong>Property Address:</strong> ${submission.property_address}, ${submission.city}, ${submission.state} ${submission.zip}</p>
      <p><strong>Property Type:</strong> ${submission.property_type}</p>
      <p><strong>Condition:</strong> ${submission.condition}</p>
      <p><strong>Reason for Selling:</strong> ${submission.selling_reason}</p>
      <p><strong>Timeline:</strong> ${submission.timeline}</p>
      <p><strong>Asking Price:</strong> ${submission.asking_price ?? "Not specified"}</p>
      <p><strong>Additional Details:</strong> ${submission.additional_details ?? "None"}</p>
      <p><strong>Reference Number:</strong> ${submission.reference_number}</p>
      ${
        submission.possible_duplicate_of
          ? `<p style="color:#b45309"><strong>⚠ Possible duplicate</strong> — this matches an existing lead by phone, email, or address. Review both before contacting the seller twice.</p>`
          : ""
      }
      <p><a href="${dashboardLink}">Open this lead in the admin dashboard</a></p>
    `,
  });
}

export async function sendSellerConfirmationEmail(submission: SellerSubmission) {
  if (!submission.email) return;

  await safeSend({
    from: FROM,
    to: submission.email,
    subject: "We Received Your Property Information – Derax Properties",
    html: `
      <p>Hi ${submission.first_name},</p>
      <p>Thank you for submitting information about your property at ${submission.property_address}.
      Our team will review the details you provided and reach out if we need anything else or if the
      property fits our current buying criteria.</p>
      <p>We evaluate every property individually and are not able to guarantee an offer, but we do
      review every submission personally.</p>
      <p>Your reference number is <strong>${submission.reference_number}</strong>. Please keep this
      for your records.</p>
      <p>— The Derax Properties Team</p>
    `,
  });
}

export interface DigestLead {
  id: string;
  reference_number: string;
  first_name: string;
  last_name: string;
  property_address: string;
  city: string;
  state: string;
  status: string;
  motivation_level: string | null;
  created_at: string;
}

/**
 * Daily follow-up digest (plan section 6): one email listing every lead
 * that needs a human to look at it today — status "Follow Up", anything
 * still "New" after 24+ hours untouched, and any Hot lead not yet closed.
 * Sent once per calendar day by /api/cron/daily-followups, which owns the
 * idempotency check (notification_log) — this function just formats and
 * sends whatever list it's given.
 */
export async function sendDailyFollowupDigest(leads: DigestLead[]) {
  if (leads.length === 0) return;

  const rows = leads
    .map((l) => {
      const link = `${SITE_URL}/admin/leads/${l.id}`;
      const tag = l.motivation_level === "Hot" ? " 🔥" : "";
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${l.reference_number}${tag}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${l.first_name} ${l.last_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${l.property_address}, ${l.city}, ${l.state}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${l.status}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;"><a href="${link}">Open</a></td>
        </tr>`;
    })
    .join("");

  await safeSend({
    from: FROM,
    to: NOTIFY,
    subject: `Daily Follow-Up Digest – ${leads.length} lead${leads.length === 1 ? "" : "s"} need attention`,
    html: `
      <h2>Today's Follow-Ups</h2>
      <p>These leads are marked "Follow Up", still untouched a day after coming in, or flagged Hot and not yet closed.</p>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
        <thead>
          <tr style="text-align:left;background:#f7f5f0;">
            <th style="padding:8px 12px;">Reference</th>
            <th style="padding:8px 12px;">Seller</th>
            <th style="padding:8px 12px;">Property</th>
            <th style="padding:8px 12px;">Status</th>
            <th style="padding:8px 12px;"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `,
  });
}

export async function sendInvestorInquiryNotification(inquiry: InvestorInquiry) {
  await safeSend({
    from: FROM,
    to: NOTIFY,
    subject: `New Investor Inquiry${inquiry.property_title ? ` – ${inquiry.property_title}` : ""}`,
    html: `
      <h2>New Investor / Buyer Inquiry</h2>
      <p><strong>Property:</strong> ${inquiry.property_title ?? "General inquiry"}</p>
      <p><strong>Name:</strong> ${inquiry.name}</p>
      <p><strong>Phone:</strong> ${inquiry.phone}</p>
      <p><strong>Email:</strong> ${inquiry.email}</p>
      <p><strong>Company:</strong> ${inquiry.company ?? "N/A"}</p>
      <p><strong>Investor Type:</strong> ${inquiry.investor_type ?? "N/A"}</p>
      <p><strong>Message:</strong> ${inquiry.message}</p>
    `,
  });
}

export async function sendAdminInviteEmail(invitation: AdminInvitation) {
  const acceptLink = `${SITE_URL}/admin/accept-invite/${invitation.token}`;
  const roleLabel = invitation.role === "va" ? "Virtual Assistant" : invitation.role === "owner" ? "Owner" : "Admin";

  await safeSend({
    from: FROM,
    to: invitation.email,
    subject: "You've been invited to DERAX CRM",
    html: `
      <p>Hi${invitation.full_name ? ` ${invitation.full_name}` : ""},</p>
      <p>You've been invited to join DERAX CRM as a <strong>${roleLabel}</strong>.</p>
      <p><a href="${acceptLink}">Click here to set your password and activate your account</a></p>
      <p>This invitation expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
      <p>— DERAX CRM</p>
    `,
  });
}

export async function sendContactMessageNotification(message: ContactMessage) {
  await safeSend({
    from: FROM,
    to: NOTIFY,
    subject: `New Contact Message – ${message.interest}`,
    html: `
      <h2>New Contact Form Message</h2>
      <p><strong>Name:</strong> ${message.name}</p>
      <p><strong>Email:</strong> ${message.email}</p>
      <p><strong>Phone:</strong> ${message.phone ?? "N/A"}</p>
      <p><strong>Interested In:</strong> ${message.interest}</p>
      <p><strong>Message:</strong> ${message.message}</p>
    `,
  });
}
