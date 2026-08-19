import type {
  FeeStructureDetail,
  FeeStructureListItem,
  FeeStructureStatus,
} from '@/features/fee-structures/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Fee structures mock (§19).
 *
 * The `total` is stored explicitly as the backend's authoritative figure — it
 * is NOT summed from components at read time. This mirrors the finance
 * invariant that the frontend never computes an authoritative amount; it only
 * displays what the backend reports. In-memory for the session.
 */

interface FeeComponentRecord {
  label: string;
  amount: number;
}

interface FeeStructureRecord {
  id: string;
  name: string;
  courseCode: string;
  courseName: string;
  academicYear: string;
  status: FeeStructureStatus;
  components: FeeComponentRecord[];
  total: number;
  note: string | null;
}

function buildStore(): FeeStructureRecord[] {
  return [
    {
      id: 'fs-bfa-2026',
      name: 'BFA — Year 1 (2026–27)',
      courseCode: 'BFA',
      courseName: 'Bachelor of Fine Arts',
      academicYear: '2026–27',
      status: 'active',
      components: [
        { label: 'Tuition fee', amount: 120000 },
        { label: 'Studio & materials', amount: 25000 },
        { label: 'Registration', amount: 5000 },
        { label: 'Examination', amount: 8000 },
      ],
      total: 158000,
      note: 'Annual fee, payable in three installments.',
    },
    {
      id: 'fs-vcd-2026',
      name: 'VCD — Year 1 (2026–27)',
      courseCode: 'VCD',
      courseName: 'Visual Communication & Design',
      academicYear: '2026–27',
      status: 'active',
      components: [
        { label: 'Tuition fee', amount: 110000 },
        { label: 'Software & lab', amount: 30000 },
        { label: 'Registration', amount: 5000 },
        { label: 'Examination', amount: 8000 },
      ],
      total: 153000,
      note: null,
    },
    {
      id: 'fs-photo-2026',
      name: 'Photography — Year 1 (2026–27)',
      courseCode: 'PHOT',
      courseName: 'Photography',
      academicYear: '2026–27',
      status: 'active',
      components: [
        { label: 'Tuition fee', amount: 90000 },
        { label: 'Equipment & darkroom', amount: 35000 },
        { label: 'Registration', amount: 5000 },
      ],
      total: 130000,
      note: null,
    },
    {
      id: 'fs-anim-2026',
      name: 'Animation — Year 1 (2026–27)',
      courseCode: 'ANIM',
      courseName: 'Animation & Motion Design',
      academicYear: '2026–27',
      status: 'draft',
      components: [
        { label: 'Tuition fee', amount: 130000 },
        { label: 'Software & render farm', amount: 40000 },
        { label: 'Registration', amount: 5000 },
      ],
      total: 175000,
      note: 'Awaiting finance committee approval.',
    },
    {
      id: 'fs-bfa-2025',
      name: 'BFA — Year 1 (2025–26)',
      courseCode: 'BFA',
      courseName: 'Bachelor of Fine Arts',
      academicYear: '2025–26',
      status: 'archived',
      components: [
        { label: 'Tuition fee', amount: 112000 },
        { label: 'Studio & materials', amount: 22000 },
        { label: 'Registration', amount: 5000 },
        { label: 'Examination', amount: 7000 },
      ],
      total: 146000,
      note: null,
    },
  ];
}

const store = buildStore();

function toListItem(record: FeeStructureRecord): FeeStructureListItem {
  return {
    id: record.id,
    name: record.name,
    courseCode: record.courseCode,
    courseName: record.courseName,
    academicYear: record.academicYear,
    componentCount: record.components.length,
    total: record.total,
    status: record.status,
  };
}

function toDetail(record: FeeStructureRecord): FeeStructureDetail {
  return {
    id: record.id,
    name: record.name,
    courseCode: record.courseCode,
    courseName: record.courseName,
    academicYear: record.academicYear,
    status: record.status,
    components: record.components.map((c) => ({ ...c })),
    total: record.total,
    note: record.note,
  };
}

export function listFeeStructures(query: ListQuery): Paginated<FeeStructureListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const status = String(query.filters?.status ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store
    .map(toListItem)
    .filter((row) => {
      if (
        search &&
        !row.name.toLowerCase().includes(search) &&
        !row.courseName.toLowerCase().includes(search) &&
        !row.courseCode.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (status && row.status !== status) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a.academicYear;
      const bv = b.academicYear;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getFeeStructure(id: string): FeeStructureDetail | null {
  const record = store.find((f) => f.id === id);
  return record ? toDetail(record) : null;
}
