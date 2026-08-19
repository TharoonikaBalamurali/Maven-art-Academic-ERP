/**
 * Settings types (§ administration).
 *
 * Institution configuration, grouped into sections. Values are owned by the
 * backend; editing is gated on `settings.update` (TBD — BACKEND CONTRACT). This
 * module renders the current configuration read-only.
 */
export interface SettingItem {
  label: string;
  value: string;
}

export interface SettingsSection {
  title: string;
  description: string | null;
  items: SettingItem[];
}

export interface Settings {
  institution: string;
  updatedAt: string | null;
  sections: SettingsSection[];
}
