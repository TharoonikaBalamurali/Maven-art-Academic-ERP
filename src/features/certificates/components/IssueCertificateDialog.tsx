import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal, Select, toast } from '@/shared/ui';
import { useIssueCertificate } from '../hooks/useCertificates';
import { CERTIFICATE_TYPE_LABEL, type CertificateType } from '../types';

const TYPE_OPTIONS = Object.entries(CERTIFICATE_TYPE_LABEL).map(([value, label]) => ({ value, label }));

/**
 * Issue-certificate dialog (§27).
 *
 * Captures the request; the backend produces the certificate document and
 * number and returns the stored record. The frontend never generates a
 * certificate.
 */
export function IssueCertificateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const issue = useIssueCertificate();
  const [student, setStudent] = useState('');
  const [type, setType] = useState<CertificateType>('course_completion');
  const [course, setCourse] = useState('');
  const [note, setNote] = useState('');

  const valid = student.trim().length > 0;

  function reset() {
    setStudent('');
    setType('course_completion');
    setCourse('');
    setNote('');
  }

  async function submit() {
    if (!valid) return;
    try {
      const certificate = await issue.mutateAsync({
        student,
        type,
        course: course || undefined,
        note: note || undefined,
      });
      toast.success('Certificate issued', `${certificate.certificateNo} issued by the backend.`);
      reset();
      onClose();
      navigate(`/management/certificates/${certificate.id}`);
    } catch {
      toast.error('Could not issue certificate', 'Check the details and try again.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Issue certificate"
      description="The backend produces the certificate document and number."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={issue.isPending} disabled={!valid} onClick={() => void submit()}>
            Issue certificate
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input label="Student" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Full name" />
        <Select label="Type" options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value as CertificateType)} />
        <Input label="Course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Course (optional)" />
        <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason or remarks (optional)" />
      </div>
    </Modal>
  );
}
