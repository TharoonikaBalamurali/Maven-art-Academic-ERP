import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useFeeStructure } from '../hooks/useFeeStructures';
import { feeStructureStatusTone } from '../status';
import { FEE_STRUCTURE_STATUS_LABEL, type FeeStructureDetail } from '../types';

/**
 * Fee structure detail (§19).
 *
 * Displays the components and the backend's authoritative total. The total is
 * rendered from `structure.total` as reported by the backend — it is never
 * summed from the components on the client (finance invariant).
 */
export function FeeStructureDetailPage() {
  const { feeStructureId = '' } = useParams();
  const query = useFeeStructure(feeStructureId);

  return (
    <>
      <Link
        to="/management/fee-structures"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to fee structures
      </Link>

      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={
          <Card>
            <CardBody className="flex flex-col gap-4">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-40 w-full" />
            </CardBody>
          </Card>
        }
      >
        {query.data && <FeeStructureDetailView structure={query.data} />}
      </QueryBoundary>
    </>
  );
}

function FeeStructureDetailView({ structure }: { structure: FeeStructureDetail }) {
  return (
    <>
      <PageHeader
        title={structure.name}
        description={`${structure.courseCode} · ${structure.courseName} · ${structure.academicYear}`}
        meta={<Badge tone={feeStructureStatusTone(structure.status)}>{FEE_STRUCTURE_STATUS_LABEL[structure.status] ?? structure.status}</Badge>}
      />

      <ContentSection title="Fee components">
        <Card className="overflow-hidden">
          <table className="w-full text-body">
            <caption className="sr-only">Fee components</caption>
            <thead>
              <tr className="border-b border-[var(--border)] text-caption text-[var(--text-muted)] uppercase">
                <th scope="col" className="px-4 py-2.5 text-left font-semibold tracking-wide">Component</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              {structure.components.map((component) => (
                <tr key={component.label} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2.5 text-[var(--text)]">{component.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[var(--text)]">{formatCurrency(component.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {/* Backend-provided total — displayed, never computed here (finance invariant). */}
              <tr className="border-t border-[var(--border)] bg-[var(--surface-hover)]">
                <th scope="row" className="px-4 py-3 text-left font-semibold text-[var(--text)]">Total</th>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--text)]">{formatCurrency(structure.total)}</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      </ContentSection>

      {structure.note && (
        <ContentSection title="Note">
          <Card>
            <CardBody className="text-body">{structure.note}</CardBody>
          </Card>
        </ContentSection>
      )}
    </>
  );
}
