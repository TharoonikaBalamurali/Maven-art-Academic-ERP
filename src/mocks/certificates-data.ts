import type {
  CertificateDetail,
  CertificateListItem,
  CertificateStatus,
  CertificateType,
  IssueCertificateInput,
} from '@/features/certificates/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Certificates mock (§27).
 *
 * Issuing a certificate is a backend operation: the mock assigns the
 * certificate number, records the issuer and returns the stored record. The
 * frontend never generates a certificate or its number. In-memory for the
 * session.
 */

interface CertificateRecord {
  id: string;
  certificateNo: string;
  student: string;
  type: CertificateType;
  course: string | null;
  issuedAt: string | null;
  issuedBy: string | null;
  status: CertificateStatus;
  note: string | null;
}

function buildStore(): CertificateRecord[] {
  return [
    { id: 'cert-401', certificateNo: 'MA/CERT/2025/0401', student: 'Priya Iyer', type: 'course_completion', course: 'Bachelor of Fine Arts', issuedAt: '2025-06-30', issuedBy: 'Aarthi Menon', status: 'issued', note: null },
    { id: 'cert-402', certificateNo: 'MA/CERT/2026/0402', student: 'Aisha Rahman', type: 'bonafide', course: 'Photography', issuedAt: '2026-08-01', issuedBy: 'Aarthi Menon', status: 'issued', note: null },
    { id: 'cert-403', certificateNo: 'MA/CERT/2026/0403', student: 'Neha Krishnan', type: 'merit', course: 'Bachelor of Fine Arts', issuedAt: '2026-08-13', issuedBy: 'Aarthi Menon', status: 'issued', note: 'Awarded for the highest midterm score.' },
    { id: 'cert-404', certificateNo: 'MA/CERT/2026/0404', student: 'Rahul Verma', type: 'bonafide', course: 'Visual Communication & Design', issuedAt: null, issuedBy: null, status: 'requested', note: 'Requested for a bank loan application.' },
    { id: 'cert-405', certificateNo: 'MA/CERT/2025/0405', student: 'Vikram Nair', type: 'transfer', course: 'Animation & Motion Design', issuedAt: '2025-09-10', issuedBy: 'Aarthi Menon', status: 'revoked', note: 'Superseded by a corrected certificate.' },
  ];
}

let store = buildStore();
let certificateSeq = 406;

export function resetCertificates(): void {
  store = buildStore();
  certificateSeq = 406;
}

function toListItem(record: CertificateRecord): CertificateListItem {
  return {
    id: record.id,
    certificateNo: record.certificateNo,
    student: record.student,
    type: record.type,
    issuedAt: record.issuedAt,
    status: record.status,
  };
}

function toDetail(record: CertificateRecord): CertificateDetail {
  return {
    id: record.id,
    certificateNo: record.certificateNo,
    student: record.student,
    type: record.type,
    course: record.course,
    issuedAt: record.issuedAt,
    issuedBy: record.issuedBy,
    status: record.status,
    note: record.note,
  };
}

export function listCertificates(query: ListQuery): Paginated<CertificateListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const status = String(query.filters?.status ?? '');
  const type = String(query.filters?.type ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store
    .map(toListItem)
    .filter((row) => {
      if (search && !row.student.toLowerCase().includes(search) && !row.certificateNo.toLowerCase().includes(search)) {
        return false;
      }
      if (status && row.status !== status) return false;
      if (type && row.type !== type) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a.issuedAt ?? '';
      const bv = b.issuedAt ?? '';
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getCertificate(id: string): CertificateDetail | null {
  const record = store.find((c) => c.id === id);
  return record ? toDetail(record) : null;
}

/**
 * Issues a certificate. The backend owns the record: it assigns the id and
 * certificate number, stamps the issuer and marks it issued. The frontend never
 * generates the document.
 */
export function issueCertificate(input: IssueCertificateInput, issuedBy: string): CertificateDetail {
  const seq = certificateSeq;
  certificateSeq += 1;
  const year = new Date().getFullYear();
  const record: CertificateRecord = {
    id: `cert-${seq}`,
    certificateNo: `MA/CERT/${year}/0${seq}`,
    student: input.student.trim(),
    type: input.type,
    course: input.course?.trim() || null,
    issuedAt: new Date().toISOString().slice(0, 10),
    issuedBy,
    status: 'issued',
    note: input.note?.trim() || null,
  };
  store.unshift(record);
  return toDetail(record);
}
