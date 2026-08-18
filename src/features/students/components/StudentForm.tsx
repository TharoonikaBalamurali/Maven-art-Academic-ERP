import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useCreateStudent, useStudentFilterOptions, useUpdateStudent } from '../hooks/useStudents';
import type { StudentInput } from '../types';
import type { Id } from '@/shared/types';
import { FormError } from '@/shared/forms/FormError';
import { FormActions, FormFieldWide, FormSection } from '@/shared/forms/FormLayout';
import { useApiForm } from '@/shared/forms/useApiForm';
import { Button, DatePicker, Input, Select, toast } from '@/shared/ui';

/**
 * Shape/presence validation only — fast UX feedback. The backend re-validates
 * everything and owns the rules the client cannot (uniqueness), which
 * `useApiForm` maps back onto these fields from a 422 (§30).
 */
const schema = z.object({
  name: z.string().trim().min(1, 'Enter the student’s full name.'),
  dateOfBirth: z.string().min(1, 'Select a date of birth.'),
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.'),
  phone: z.string().trim().min(1, 'Enter a phone number.'),
  bloodGroup: z.string().default(''),
  address: z.string().default(''),
  courseId: z.string().min(1, 'Select a course.'),
  batchId: z.string().min(1, 'Select a batch.'),
  section: z.string().min(1, 'Select a section.'),
  status: z.string().min(1, 'Select a status.'),
});

export type StudentFormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'graduated', label: 'Graduated' },
];

export interface StudentFormProps {
  mode: 'create' | 'edit';
  /** Present in edit mode. */
  studentId?: Id;
  initialValues: StudentFormValues;
}

export function StudentForm({ mode, studentId, initialValues }: StudentFormProps) {
  const navigate = useNavigate();
  const options = useStudentFilterOptions();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent(studentId ?? '');

  const { form, formError, submit, isSubmitting } = useApiForm<StudentFormValues>({
    schema,
    defaultValues: initialValues,
    onSubmit: async (values) => {
      const input = values as StudentInput;
      if (mode === 'create') {
        const created = await createStudent.mutateAsync(input);
        toast.success('Student created', `${created.name} · ${created.registerNo}`);
        navigate(`/management/students/${created.id}`);
      } else if (studentId) {
        const updated = await updateStudent.mutateAsync(input);
        toast.success('Changes saved', updated.name);
        navigate(`/management/students/${studentId}`);
      }
    },
  });

  const { errors } = form.formState;
  const selectedCourse = form.watch('courseId');

  const courseOptions = (options.data?.courses ?? []).map((c) => ({ value: c.id, label: c.name }));
  const batchOptions = (options.data?.batches ?? [])
    .filter((b) => !selectedCourse || b.courseId === selectedCourse)
    .map((b) => ({ value: b.id, label: b.name }));
  const sectionOptions = (options.data?.sections ?? []).map((s) => ({ value: s, label: s }));

  const courseField = form.register('courseId');

  const cancelTo =
    mode === 'edit' && studentId ? `/management/students/${studentId}` : '/management/students';

  return (
    <form onSubmit={submit} noValidate>
      {formError && (
        <div className="mb-4">
          <FormError message={formError} />
        </div>
      )}

      <FormSection
        title="Personal information"
        description="The student’s identity and contact details."
        columns={2}
      >
        <FormFieldWide>
          <Input label="Full name" required error={errors.name?.message} {...form.register('name')} />
        </FormFieldWide>
        <DatePicker
          label="Date of birth"
          required
          error={errors.dateOfBirth?.message}
          {...form.register('dateOfBirth')}
        />
        <Select
          label="Blood group"
          placeholder="Select"
          options={['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((g) => ({ value: g, label: g }))}
          error={errors.bloodGroup?.message}
          {...form.register('bloodGroup')}
        />
        <Input
          label="Email"
          type="email"
          required
          autoComplete="off"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <Input label="Phone" type="tel" required error={errors.phone?.message} {...form.register('phone')} />
        <FormFieldWide>
          <Input label="Address" error={errors.address?.message} {...form.register('address')} />
        </FormFieldWide>
      </FormSection>

      <FormSection
        title="Academic information"
        description="Course, batch and enrolment status."
        columns={2}
      >
        <Select
          label="Course"
          required
          placeholder="Select a course"
          options={courseOptions}
          error={errors.courseId?.message}
          {...courseField}
          onChange={(event) => {
            void courseField.onChange(event);
            // Batches belong to a course; clear a now-mismatched batch.
            form.setValue('batchId', '', { shouldValidate: false });
          }}
        />
        <Select
          label="Batch"
          required
          placeholder={selectedCourse ? 'Select a batch' : 'Select a course first'}
          options={batchOptions}
          error={errors.batchId?.message}
          disabled={!selectedCourse}
          {...form.register('batchId')}
        />
        <Select
          label="Section"
          required
          placeholder="Select a section"
          options={sectionOptions}
          error={errors.section?.message}
          {...form.register('section')}
        />
        <Select
          label="Status"
          required
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          {...form.register('status')}
        />
      </FormSection>

      <FormActions
        primary={
          <Button type="submit" loading={isSubmitting}>
            {mode === 'create' ? 'Create student' : 'Save changes'}
          </Button>
        }
        secondary={
          <Button type="button" variant="secondary" onClick={() => navigate(cancelTo)}>
            Cancel
          </Button>
        }
      />
    </form>
  );
}
