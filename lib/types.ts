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
  notes: string | null;
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
