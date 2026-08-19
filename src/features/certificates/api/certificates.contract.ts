import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { CertificateDetail, CertificateListItem, IssueCertificateInput } from '../types';

/**
 * Certificates contract (§27). Issuing requires `certificates.issue`; the
 * backend produces the certificate document and number. Reading requires
 * `certificates.view`.
 *
 * TBD — BACKEND CONTRACT: provisional paths and payload.
 */
export const certificatesContract = {
  list: endpoint<void, Paginated<CertificateListItem>, ListQuery>({
    method: 'GET',
    path: '/certificates',
    auth: true,
    permission: 'certificates.view',
  }),
  get: endpoint<void, CertificateDetail>({
    method: 'GET',
    path: '/certificates/:certificateId',
    auth: true,
    permission: 'certificates.view',
  }),
  issue: endpoint<IssueCertificateInput, CertificateDetail>({
    method: 'POST',
    path: '/certificates',
    auth: true,
    permission: 'certificates.issue',
  }),
} as const;
