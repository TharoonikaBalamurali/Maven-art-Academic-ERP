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
 *
 * The form captures the essential identity + admission information a complete
 * student record needs; optional biodata (address, medical) is grouped below.
 */
const schema = z.object({
  name: z.string().trim().min(1, 'Enter the student’s full name.'),
  gender: z.string().min(1, 'Select a gender.'),
  dateOfBirth: z.string().min(1, 'Select a date of birth.'),
  bloodGroup: z.string().default(''),
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.'),
  phone: z.string().trim().min(1, 'Enter a phone number.'),
  alternatePhone: z.string().default(''),
  rollNo: z.string().default(''),
  admissionNo: z.string().default(''),
  address: z.object({
    line1: z.string().default(''),
    line2: z.string().default(''),
    area: z.string().default(''),
    city: z.string().default(''),
    district: z.string().default(''),
    state: z.string().default(''),
    country: z.string().default('India'),
    postalCode: z.string().default(''),
  }),
  courseId: z.string().min(1, 'Select a course.'),
  batchId: z.string().min(1, 'Select a batch.'),
  section: z.string().min(1, 'Select a section.'),
  status: z.string().min(1, 'Select a status.'),
  previousInstitution: z.object({
    name: z.string().default(''),
    lastClass: z.string().default(''),
    tcNumber: z.string().default(''),
    tcDate: z.string().default(''),
    boardOrUniversity: z.string().default(''),
    yearOfLeaving: z.string().default(''),
    reasonForLeaving: z.string().default(''),
  }),
  medical: z.object({
    foodAllergies: z.string().default(''),
    otherAllergies: z.string().default(''),
    accessibility: z.string().default(''),
    emergencyContact: z.string().default(''),
    notes: z.string().default(''),
  }),
});

export type StudentFormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'graduated', label: 'Graduated' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
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

  const cancelTo = mode === 'edit' && studentId ? `/management/students/${studentId}` : '/management/students';

  return (
    <form onSubmit={submit} noValidate>
      {formError && (
        <div className="mb-4">
          <FormError message={formError} />
        </div>
      )}

      <FormSection title="Identity" description="The student’s name and personal details." columns={2}>
        <FormFieldWide>
          <Input label="Full name" required error={errors.name?.message} {...form.register('name')} />
        </FormFieldWide>
        <Select label="Gender" required placeholder="Select" options={GENDER_OPTIONS} error={errors.gender?.message} {...form.register('gender')} />
        <DatePicker label="Date of birth" required error={errors.dateOfBirth?.message} {...form.register('dateOfBirth')} />
        <Select
          label="Blood group"
          placeholder="Select"
          options={['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((g) => ({ value: g, label: g }))}
          error={errors.bloodGroup?.message}
          {...form.register('bloodGroup')}
        />
      </FormSection>

      <FormSection title="Contact" description="How to reach the student." columns={2}>
        <Input label="Email" type="email" required autoComplete="off" error={errors.email?.message} {...form.register('email')} />
        <Input label="Mobile number" type="tel" required error={errors.phone?.message} {...form.register('phone')} />
        <Input label="Alternate contact" type="tel" error={errors.alternatePhone?.message} {...form.register('alternatePhone')} />
      </FormSection>

      <FormSection title="Address" description="Residential address." columns={2}>
        <FormFieldWide>
          <Input label="Address line 1" {...form.register('address.line1')} />
        </FormFieldWide>
        <FormFieldWide>
          <Input label="Address line 2" {...form.register('address.line2')} />
        </FormFieldWide>
        <Input label="Area / locality" {...form.register('address.area')} />
        <Input label="City" {...form.register('address.city')} />
        <Input label="District" {...form.register('address.district')} />
        <Input label="State" {...form.register('address.state')} />
        <Input label="Country" {...form.register('address.country')} />
        <Input label="Postal code" {...form.register('address.postalCode')} />
      </FormSection>

      <FormSection title="Admission & academics" description="Identifiers, course, batch and status." columns={2}>
        <Input label="Admission number" placeholder="Auto-assigned if left blank" error={errors.admissionNo?.message} {...form.register('admissionNo')} />
        <Input label="Roll number" placeholder="Auto-assigned if left blank" error={errors.rollNo?.message} {...form.register('rollNo')} />
        <Select
          label="Course"
          required
          placeholder="Select a course"
          options={courseOptions}
          error={errors.courseId?.message}
          {...courseField}
          onChange={(event) => {
            void courseField.onChange(event);
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
        <Select label="Section" required placeholder="Select a section" options={sectionOptions} error={errors.section?.message} {...form.register('section')} />
        <Select label="Status" required options={STATUS_OPTIONS} error={errors.status?.message} {...form.register('status')} />
      </FormSection>

      <FormSection
        title="Previous institution"
        description="Prior schooling and the Transfer Certificate submitted at admission."
        columns={2}
      >
        <FormFieldWide>
          <Input label="Institution name" {...form.register('previousInstitution.name')} />
        </FormFieldWide>
        <Input label="Last class / course" {...form.register('previousInstitution.lastClass')} />
        <Input label="Board / university" {...form.register('previousInstitution.boardOrUniversity')} />
        <Input label="TC number" {...form.register('previousInstitution.tcNumber')} />
        <DatePicker label="TC date" {...form.register('previousInstitution.tcDate')} />
        <Input label="Year of leaving" {...form.register('previousInstitution.yearOfLeaving')} />
        <Input label="Reason for leaving" {...form.register('previousInstitution.reasonForLeaving')} />
      </FormSection>

      <FormSection title="Health & special information" description="Confidential — kept for the institution’s duty of care." columns={2}>
        <Input label="Food allergies" {...form.register('medical.foodAllergies')} />
        <Input label="Other allergies" {...form.register('medical.otherAllergies')} />
        <Input label="Accessibility / support needs" {...form.register('medical.accessibility')} />
        <Input label="Emergency contact" type="tel" {...form.register('medical.emergencyContact')} />
        <FormFieldWide>
          <Input label="Notes" {...form.register('medical.notes')} />
        </FormFieldWide>
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
