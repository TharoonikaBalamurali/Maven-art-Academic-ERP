import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { ArchivedBatchDetail, ArchivedBatchListItem, ArchivedStudentDetail, ClosedStudentRecord } from '../types';
import { archiveContract } from './archive.contract';

export const archiveService = {
  batches(query: ListQuery, options?: RequestOptions): Promise<Paginated<ArchivedBatchListItem>> {
    return apiClient.call(archiveContract.batches, { query: toListParams(query) as ListQuery, options });
  },
  batch(batchId: Id, options?: RequestOptions): Promise<ArchivedBatchDetail> {
    return apiClient.call(archiveContract.batch, { params: { batchId }, options });
  },
  student(studentId: Id, options?: RequestOptions): Promise<ArchivedStudentDetail> {
    return apiClient.call(archiveContract.student, { params: { studentId }, options });
  },
  students(query: ListQuery, options?: RequestOptions): Promise<Paginated<ClosedStudentRecord>> {
    return apiClient.call(archiveContract.students, { query: toListParams(query) as ListQuery, options });
  },
};
