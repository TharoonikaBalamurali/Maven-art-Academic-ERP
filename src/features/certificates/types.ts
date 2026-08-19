import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Certificate types (§27).
 *
 * A certificate is a document ISSUED AND STORED BY THE BACKEND. The frontend
 * lists and views certificates and can request issuance, but never generates a
 * certificate or its number — the backend produces the document (document
 * invariant, as with receipts §24).
 *
 * TBD — BACKEND CONTRACT: type/status names and the document download endpoint
 * are provisional.
 */
export type CertificateType = KnownOr<'course_completion' | 'bonafide' | 'transfer' | 'merit' | 'participation'>;
export type CertificateStatus = KnownOr<'issued' | 'requested' | 'revoked'>;

export const CERTIFICATE_TYPE_LABEL: Record<string, string> = {
  course_completion: 'Course completion',
  bonafide: 'Bonafide',
  transfer: 'Transfer',
  merit: 'Merit',
  participation: 'Participation',
};

export const CERTIFICATE_STATUS_LABEL: Record<string, string> = {
  issued: 'Issued',
  requested: 'Requested',
  revoked: 'Revoked',
};

export interface CertificateListItem {
  id: Id;
  certificateNo: string;
  student: string;
  type: CertificateType;
  issuedAt: IsoDateString | null;
  status: CertificateStatus;
}

export interface CertificateDetail {
  id: Id;
  certificateNo: string;
  student: string;
  type: CertificateType;
  course: string | null;
  issuedAt: IsoDateString | null;
  issuedBy: string | null;
  status: CertificateStatus;
  note: string | null;
}

/** What an admin submits to request certificate issuance (§27). */
export interface IssueCertificateInput {
  student: string;
  type: CertificateType;
  course?: string;
  note?: string;
}
