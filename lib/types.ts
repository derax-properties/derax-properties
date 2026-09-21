export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Offer Made"
  | "Under Contract"
  | "Closed"
  | "Not a Fit"
  | "Follow Up";

export type InquiryStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Under Review"
  | "Closed"
  | "Not Interested";

export type PropertyStatus = "Available" | "Under Contract" | "Sold" | "Coming Soon";

export type PropertyType =
  | "Single Family"
  | "Multi-Family"
  | "Condo"
  | "Townhouse"
  | "Mobile/Manufactured"
  | "Land"
  | "Other";

export type InvestmentStrategy =
  | "Fix & Flip"
  | "Buy & Hold"
  | "Wholesale"
  | "Development"
  | "Land";

export interface SellerSubmission {
  id: string;
  reference_number: string;
  created_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  preferred_contact: "Phone" | "Text" | "Email";
  property_address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  formatted_address: string | null;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  address_country: string | null;
  address_confidence: AddressConfidence | null;
  lead_source: LeadSource | null;
  lead_type: LeadType | null;
  pipeline_stage: PipelineStage | null;
  motivation_level: MotivationLevel | null;
  best_callback_time: string | null;
  preferred_contact_methods: string[] | null;
  possible_duplicate_of: string | null;
  property_type: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  year_built: number | null;
  condition: string;
  roof_condition: string | null;
  hvac_condition: string | null;
  foundation_issue: boolean | null;
  plumbing_issue: boolean | null;
  electrical_issue: boolean | null;
  water_damage: boolean | null;
  fire_damage: boolean | null;
  mold: boolean | null;
  structural_issue: boolean | null;
  additional_details: string | null;
  selling_reason: string;
  timeline: string;
  asking_price: string | null;
  best_contact_time: string | null;
  owner_status: "Yes" | "No";
  owner_relationship: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  created_by: string | null;
  notes: string | null;
  arv_estimate: number | null;
  repair_estimate: number | null;
  mao_multiplier: number;
  recommended_offer: number | null;
  comps_note: string | null;
  underwriting_updated_at: string | null;
}

export interface Property {
  id: string;
  slug: string;
  created_at: string;
  title: string;
  address_line: string | null;
  city: string;
  state: string;
  zip: string | null;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  year_built: number | null;
  property_type: PropertyType;
  strategy: InvestmentStrategy;
  status: PropertyStatus;
  badge: string | null;
  description: string;
  highlights: string[] | null;
  cover_image_url: string | null;
}

export interface PropertyPhoto {
  id: string;
  property_id: string;
  url: string;
  sort_order: number;
}

export interface InvestorInquiry {
  id: string;
  created_at: string;
  property_id: string | null;
  property_title: string | null;
  name: string;
  phone: string;
  email: string;
  company: string | null;
  investor_type: string | null;
  message: string;
  status: InquiryStatus;
}

export interface ContactMessage {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  interest: string;
  message: string;
  status: "New" | "Responded" | "Closed";
}

// ---------------------------------------------------------------------------
// CRM access & team (Phase 2)
// ---------------------------------------------------------------------------
export type AdminRole = "owner" | "admin" | "va";

export interface AdminProfile {
  id: string;
  full_name: string | null;
  role: AdminRole;
  email: string | null;
  invited_by: string | null;
  invited_at: string | null;
  deactivated_at: string | null;
  created_at: string;
}

export interface AdminInvitation {
  id: string;
  created_at: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  token: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

// ---------------------------------------------------------------------------
// Lead pipeline enrichment fields (Phase 1) — kept as their own fields,
// never merged into `status` or `notes`.
// ---------------------------------------------------------------------------
export type LeadSource = "Website" | "VA Entry" | "Self-Entered" | "Auction" | "Referral" | "Other";
export type LeadType = "Off-Market" | "On-Market" | "Trustee Sale" | "Probate" | "Pre-Foreclosure" | "Other";
export type PipelineStage = "New Lead" | "Contacted" | "Qualified" | "Offer Made" | "Under Contract" | "Closed" | "Dead";
export type MotivationLevel = "Hot" | "Warm" | "Cold";
export type AddressConfidence = "high" | "medium" | "low" | "unresolved";

// The standard repair checklist categories (plan section 34's condition
// checklist) — every lead's repair estimate is the sum of these, one row
// each in `repair_items`, rather than a single lump-sum guess.
export const REPAIR_CATEGORIES = [
  "Roof",
  "HVAC",
  "Foundation",
  "Plumbing",
  "Electrical",
  "Kitchen",
  "Bathrooms",
  "Windows",
  "Siding/Exterior",
  "Flooring",
  "Other",
] as const;
export type RepairCategory = (typeof REPAIR_CATEGORIES)[number];

export interface RepairItem {
  id: string;
  seller_submission_id: string;
  category: RepairCategory | string;
  cost: number;
  source: "manual" | "ai";
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Cash buyers, title companies, deals (Phases 5-9)
// ---------------------------------------------------------------------------
export type BuyerType = "Fix & Flip" | "Buy & Hold" | "Wholesaler" | "Developer" | "Other";
export type BuyerStatus = "Active" | "Inactive" | "Do Not Contact";

export interface CashBuyer {
  id: string;
  created_at: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  buyer_type: BuyerType | null;
  proof_of_funds_on_file: boolean;
  notes: string | null;
  status: BuyerStatus;
}

export interface BuyerZipCode {
  id: string;
  buyer_id: string;
  zip: string;
}

export interface BuyerInvestmentCriteria {
  id: string;
  buyer_id: string;
  property_type: PropertyType | null;
  min_price: number | null;
  max_price: number | null;
  min_bedrooms: number | null;
  min_bathrooms: number | null;
  min_sqft: number | null;
  max_repair_budget: number | null;
  preferred_strategy: InvestmentStrategy | null;
  created_at: string;
}

export interface TitleCompany {
  id: string;
  created_at: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  states_covered: string[];
  notes: string | null;
  status: "Active" | "Inactive";
}

export type DealStage =
  | "Contract Sent"
  | "Contract Signed"
  | "Under Contract"
  | "Buyer Assigned"
  | "Closing Scheduled"
  | "Closed"
  | "Fell Through";

export interface Deal {
  id: string;
  created_at: string;
  updated_at: string;
  seller_submission_id: string | null;
  cash_buyer_id: string | null;
  title_company_id: string | null;
  exit_strategy: InvestmentStrategy | "Assignment" | "Double Close" | null;
  purchase_price: number | null;
  assignment_fee: number | null;
  estimated_repairs: number | null;
  arv_estimate: number | null;
  stage: DealStage;
  closing_date: string | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Contracts & documents (Phase 8-9)
// ---------------------------------------------------------------------------
export type EsignStatus = "Not Sent" | "Sent" | "Viewed" | "Signed" | "Declined" | "Voided";
export type DocumentType = "Purchase Agreement" | "Assignment Contract" | "Deal Summary PDF" | "Buyer Deal Package PDF" | "Other";

export interface ContractTemplate {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  field_map: Record<string, string>;
  storage_path: string;
  is_active: boolean;
}

export interface GeneratedDocument {
  id: string;
  created_at: string;
  deal_id: string | null;
  template_id: string | null;
  document_type: DocumentType;
  storage_path: string | null;
  esign_status: EsignStatus | null;
  esign_provider: string | null;
  esign_envelope_id: string | null;
  generated_by: string | null;
}

export interface ActivityLogEntry {
  id: string;
  created_at: string;
  seller_submission_id: string | null;
  deal_id: string | null;
  actor_id: string | null;
  actor_type: "user" | "ai" | "system";
  action: string;
  details: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Population intelligence (Phase 10)
// ---------------------------------------------------------------------------
export interface ZipPopulationCache {
  zip: string;
  population: number | null;
  city: string | null;
  county: string | null;
  state: string | null;
  data_source: string;
  data_year: number | null;
  lookup_failed: boolean;
  updated_at: string;
}
