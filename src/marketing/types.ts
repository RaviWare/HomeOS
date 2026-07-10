export type MarketingPage =
  | "home"
  | "features"
  | "how-it-works"
  | "roles"
  | "security"
  | "pricing"
  | "roadmap"
  | "faq"
  | "about"
  | "contact"
  | "privacy"
  | "terms";

export interface MarketingNavItem {
  id: MarketingPage;
  label: string;
}
