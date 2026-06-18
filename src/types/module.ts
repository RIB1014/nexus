import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type ModuleCategory =
  | "productivity"
  | "academic"
  | "creative"
  | "athletics"
  | "wellness";

export interface ModuleSettingField {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  options?: { label: string; value: string }[];
  default?: string | number | boolean;
}

export interface ModuleSettingsSchema {
  fields: ModuleSettingField[];
}

/**
 * A Module is a self-contained feature that registers itself here. Adding a new
 * feature never requires touching the app shell — see CONTRIBUTING.md.
 */
export interface ModuleDefinition {
  id: string; // unique slug, e.g. 'tasks', 'practice-log'
  name: string;
  description: string; // one sentence, shown in onboarding & settings
  icon: LucideIcon;
  category: ModuleCategory;
  /** Full page component, lazy-loaded by the [moduleSlug] route. */
  component?: ComponentType;
  /** Compact home-dashboard widget (200–350px tall). */
  dashboardWidget?: ComponentType;
  defaultEnabled: boolean;
  settings?: ModuleSettingsSchema;
  requiredIntegrations?: string[]; // e.g. ['canvas']
  color?: string; // optional per-module accent override
  /** Identity tags that recommend this module during onboarding. */
  recommendedFor?: string[];
}

export const MODULE_CATEGORY_LABELS: Record<ModuleCategory, string> = {
  productivity: "Productivity",
  academic: "Academic",
  creative: "Creative",
  athletics: "Athletics",
  wellness: "Wellness",
};
