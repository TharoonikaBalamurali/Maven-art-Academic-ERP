import type { ReportListItem, ReportResult } from '@/features/reports/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Reports mock (§ reporting).
 *
 * Every metric and table cell is stored display-ready — the backend has already
 * computed and formatted it. The mock never aggregates; it returns the backend's
 * figures. This mirrors the invariant that reports are computed server-side.
 * In-memory for the session.
 */

interface ReportRecord {
  item: ReportListItem;
  result: ReportResult;
}

const GENERATED_AT = '2026-08-19';

const REPORTS: ReportResult[] = [
  {
    id: 'rep-collections',
    name: 'Fee Collections Summary',
    category: 'financial',
    generatedAt: GENERATED_AT,
    summary: 'Fees collected across all recorded payments, broken down by method.',
    metrics: [
      { label: 'Total collected', value: '₹4,28,500' },
      { label: 'Payments recorded', value: '5' },
      { label: 'Outstanding', value: '₹4,86,500' },
    ],
    table: {
      columns: ['Method', 'Payments', 'Amount'],
      rows: [
        ['Bank transfer', '1', '₹1,30,000'],
        ['Cheque', '1', '₹1,46,000'],
        ['Card', '1', '₹76,500'],
        ['UPI', '1', '₹51,000'],
        ['Cash', '1', '₹25,000'],
      ],
    },
  },
  {
    id: 'rep-outstanding',
    name: 'Outstanding Fees Report',
    category: 'financial',
    generatedAt: GENERATED_AT,
    summary: 'Students with an outstanding balance, as computed by the backend.',
    metrics: [
      { label: 'Students with dues', value: '4' },
      { label: 'Outstanding total', value: '₹4,86,500' },
      { label: 'Overdue total', value: '₹2,26,500' },
    ],
    table: {
      columns: ['Student', 'Outstanding', 'Severity'],
      rows: [
        ['Neha Krishnan', '₹1,58,000', 'Due'],
        ['Sameer Joshi', '₹1,50,000', 'Overdue'],
        ['Rahul Verma', '₹1,02,000', 'Due'],
        ['Kabir Menon', '₹76,500', 'Overdue'],
      ],
    },
  },
  {
    id: 'rep-admissions',
    name: 'Admissions Funnel',
    category: 'operational',
    generatedAt: GENERATED_AT,
    summary: 'Conversion across the admissions pipeline for the current cycle.',
    metrics: [
      { label: 'Enquiries', value: '41' },
      { label: 'Applications', value: '7' },
      { label: 'Admissions', value: '6' },
      { label: 'Enrollments', value: '4' },
    ],
    table: {
      columns: ['Stage', 'Count', 'Conversion'],
      rows: [
        ['Enquiries', '41', '—'],
        ['Applications', '7', '17%'],
        ['Admissions', '6', '86%'],
        ['Enrollments', '4', '67%'],
      ],
    },
  },
  {
    id: 'rep-enrollment',
    name: 'Enrollment by Course',
    category: 'operational',
    generatedAt: GENERATED_AT,
    summary: 'Active and completed enrollments per course.',
    metrics: [
      { label: 'Active', value: '2' },
      { label: 'Completed', value: '1' },
      { label: 'Withdrawn', value: '1' },
    ],
    table: {
      columns: ['Course', 'Active', 'Completed', 'Withdrawn'],
      rows: [
        ['Photography', '1', '0', '0'],
        ['Visual Communication & Design', '1', '0', '0'],
        ['Bachelor of Fine Arts', '0', '1', '0'],
        ['Animation & Motion Design', '0', '0', '1'],
      ],
    },
  },
  {
    id: 'rep-attendance',
    name: 'Attendance Summary',
    category: 'operational',
    generatedAt: GENERATED_AT,
    summary: 'Attendance across all batches for the current term.',
    metrics: [
      { label: 'Sessions held', value: '128' },
      { label: 'Average attendance', value: '92%' },
      { label: 'Below 75%', value: '6 students' },
    ],
    table: null,
  },
];

function buildStore(): ReportRecord[] {
  return REPORTS.map((result) => ({
    item: { id: result.id, name: result.name, category: result.category, description: result.summary },
    result,
  }));
}

const store = buildStore();

export function listReports(query: ListQuery): Paginated<ReportListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const category = String(query.filters?.category ?? '');
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 20) || 20;

  const rows = store
    .map((record) => record.item)
    .filter((item) => {
      if (search && !item.name.toLowerCase().includes(search) && !item.description.toLowerCase().includes(search)) {
        return false;
      }
      if (category && item.category !== category) return false;
      return true;
    });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getReport(id: string): ReportResult | null {
  const record = store.find((r) => r.item.id === id);
  return record ? record.result : null;
}

export function reportExists(id: string): boolean {
  return store.some((r) => r.item.id === id);
}
