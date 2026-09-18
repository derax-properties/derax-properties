import { Resend } from "resend";
import type { SellerSubmission, InvestorInquiry, ContactMessage } from "./types";

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
