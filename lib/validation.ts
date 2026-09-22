import { z } from "zod";

export const sellerSubmissionSchema = z.object({
  // Step 1 — Property information
  property_address: z.string().min(3, "Enter the property's street address."),
  city: z.string().min(1, "City is required."),
  state: z.string().min(2, "State is required.").max(2, "Use a 2-letter state code."),
  zip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code."),
  county: z.string().optional().or(z.literal("")),

  // Parsed automatically from the single address-autocomplete field
  // (see components/AddressAutocomplete.tsx) — never asked separately.
  formatted_address: z.string().min(3, "We couldn't confirm this address. Please check the address and try again."),
  latitude: z.coerce.number().optional().or(z.nan()),
  longitude: z.coerce.number().optional().or(z.nan()),
  place_id: z.string().optional().or(z.literal("")),
  address_country: z.string().optional().or(z.literal("")),
  address_confidence: z.enum(["high", "medium", "low", ""]).optional(),

  property_type: z.enum([
    "Single Family",
    "Multi-Family",
    "Condo",
    "Townhouse",
    "Mobile/Manufactured",
    "Land",
    "Other",
  ]),
  bedrooms: z.coerce.number().int().nonnegative().optional().or(z.nan()),
  bathrooms: z.coerce.number().nonnegative().optional().or(z.nan()),
  square_feet: z.coerce.number().int().nonnegative().optional().or(z.nan()),
  year_built: z.coerce.number().int().min(1700).max(2100).optional().or(z.nan()),

  // Step 2 — Condition
  condition: z.enum([
    "Move-in Ready",
    "Minor Repairs",
    "Moderate Repairs",
    "Major Repairs",
    "Full Rehab",
    "Not Sure",
  ]),
  roof_condition: z.string().optional().or(z.literal("")),
  hvac_condition: z.string().optional().or(z.literal("")),
  foundation_issue: z.boolean().optional(),
  plumbing_issue: z.boolean().optional(),
  electrical_issue: z.boolean().optional(),
  water_damage: z.boolean().optional(),
  fire_damage: z.boolean().optional(),
  mold: z.boolean().optional(),
  structural_issue: z.boolean().optional(),
  additional_details: z.string().max(3000).optional().or(z.literal("")),

  // Step 3 — Seller information
  // first_name/last_name/phone are optional — the owner wants a lead
  // saveable from just the property address, with contact details to
  // follow later. Only property_address/city/state/zip stay required.
  first_name: z.string().optional().or(z.literal("")),
  last_name: z.string().optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[\d\s()+-]{10,20}$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Enter a valid email address.").optional().or(z.literal("")),
  preferred_contact: z.enum(["Phone", "Text", "Email"]),
  owner_status: z.enum(["Yes", "No"]),
  owner_relationship: z.string().optional().or(z.literal("")),

  // Step 4 — Selling situation
  selling_reason: z.string().min(1, "Let us know why you're considering selling."),
  timeline: z.string().min(1, "Select a timeline."),
  asking_price: z.string().optional().or(z.literal("")),
  best_contact_time: z.string().optional().or(z.literal("")),

  // Consent
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please confirm you agree to be contacted." }),
  }),
});

export type SellerSubmissionInput = z.infer<typeof sellerSubmissionSchema>;

export const investorInquirySchema = z.object({
  property_id: z.string().optional().or(z.literal("")),
  property_title: z.string().optional().or(z.literal("")),
  name: z.string().min(1, "Name is required."),
  phone: z.string().min(10, "Enter a valid phone number."),
  email: z.string().email("Enter a valid email address."),
  company: z.string().optional().or(z.literal("")),
  investor_type: z.string().optional().or(z.literal("")),
  message: z.string().min(1, "Tell us a bit about your interest."),
});

export type InvestorInquiryInput = z.infer<typeof investorInquirySchema>;

export const contactMessageSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional().or(z.literal("")),
  interest: z.enum([
    "Selling a Property",
    "Buying a Property",
    "Investment Opportunities",
    "Partnership",
    "General Question",
  ]),
  message: z.string().min(1, "Message is required."),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
export const ALLOWED_DOCUMENT_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
];
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB per file
export const MAX_FILES_PER_SUBMISSION = 12;

// Video support for the lead detail page's media uploader. Videos are
// routed through direct-to-storage signed uploads (see
// app/admin/(dashboard)/leads/[id]/mediaActions.ts) rather than through a
// server action's request body — Vercel serverless functions cap request
// bodies well under what even a short phone video weighs, so a normal
// multipart POST would fail for any real video file.
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];
export const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200MB per video
export const MAX_MEDIA_FILES_PER_UPLOAD = 10;
