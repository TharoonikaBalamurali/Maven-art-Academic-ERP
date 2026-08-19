import type { Settings } from '@/features/settings/types';

/** Settings mock (§ administration). Configuration owned by the backend; read-only here. */
const SETTINGS: Settings = {
  institution: 'Maven Art Academy',
  updatedAt: '2026-08-01',
  sections: [
    {
      title: 'Institution',
      description: 'Identity and contact details shown across the ERP.',
      items: [
        { label: 'Name', value: 'Maven Art Academy' },
        { label: 'Contact email', value: 'office@mavenart.test' },
        { label: 'Phone', value: '+91 44 4000 1234' },
        { label: 'Address', value: '12 Cathedral Road, Chennai 600086' },
      ],
    },
    {
      title: 'Academic',
      description: 'Term and grading configuration.',
      items: [
        { label: 'Current academic year', value: '2026–27' },
        { label: 'Grading scale', value: 'A+ to F (backend-computed)' },
        { label: 'Attendance threshold', value: '75%' },
      ],
    },
    {
      title: 'Finance',
      description: 'Currency and receipting.',
      items: [
        { label: 'Currency', value: 'Indian Rupee (INR)' },
        { label: 'Receipt prefix', value: 'MA/' },
        { label: 'Late-fee policy', value: 'Set by the backend' },
      ],
    },
    {
      title: 'Notifications',
      description: 'Centralised delivery (§25).',
      items: [
        { label: 'Email notifications', value: 'Enabled' },
        { label: 'SMS notifications', value: 'Disabled' },
      ],
    },
  ],
};

export function getSettings(): Settings {
  return { ...SETTINGS, sections: SETTINGS.sections.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i })) })) };
}
