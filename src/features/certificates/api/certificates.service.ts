import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { CertificateDetail, CertificateListItem, IssueCertificateInput } from '../types';
import { certificatesContract } from './certificates.contract';

export const certificatesService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<CertificateListItem>> {
    return apiClient.call(certificatesContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(certificateId: Id, options?: RequestOptions): Promise<CertificateDetail> {
    return apiClient.call(certificatesContract.get, { params: { certificateId }, options });
  },
  /** Requests issuance; the backend produces the certificate document (§27). */
  issue(input: IssueCertificateInput, options?: RequestOptions): Promise<CertificateDetail> {
    return apiClient.call(certificatesContract.issue, { body: input, options });
  },
};
