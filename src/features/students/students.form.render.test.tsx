import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/lib/api';
import { renderWithProviders, signIn } from '@/test/render';
import type { StudentFilterOptions } from './types';

const mutateCreate = vi.fn();
const mutateUpdate = vi.fn();
const useStudentFilterOptions = vi.fn();

vi.mock('./hooks/useStudents', () => ({
  useCreateStudent: () => ({ mutateAsync: mutateCreate }),
  useUpdateStudent: () => ({ mutateAsync: mutateUpdate }),
  useStudentFilterOptions: () => useStudentFilterOptions(),
}));

const { StudentForm } = await import('./components/StudentForm');

const OPTIONS: StudentFilterOptions = {
  courses: [
    { id: 'crs-bfa', name: 'Bachelor of Fine Arts' },
    { id: 'crs-vcd', name: 'Visual Communication & Design' },
  ],
  batches: [
    { id: 'bat-bfa-1a', name: 'BFA Year 1 · A', courseId: 'crs-bfa' },
    { id: 'bat-vcd-1a', name: 'VCD Year 1 · A', courseId: 'crs-vcd' },
  ],
  sections: ['A', 'B', 'C'],
  statuses: [
    { value: 'active', label: 'Active' },
    { value: 'on_leave', label: 'On leave' },
  ],
};

const ADDRESS = { line1: '1, Studio Lane', line2: '', area: 'Besant Nagar', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', country: 'India', postalCode: '600090' };
const EMPTY_ADDRESS = { line1: '', line2: '', area: '', city: '', district: '', state: '', country: 'India', postalCode: '' };
const MEDICAL = { foodAllergies: '', otherAllergies: '', accessibility: '', emergencyContact: '', notes: '' };
const PREV = { name: '', lastClass: '', tcNumber: '', tcDate: '', boardOrUniversity: '', yearOfLeaving: '', reasonForLeaving: '' };

const FILLED = {
  name: 'Test Candidate',
  gender: 'female',
  dateOfBirth: '2005-06-15',
  bloodGroup: 'O+',
  email: 'test.candidate@student.mavenart.test',
  phone: '+91 90000 00000',
  alternatePhone: '',
  rollNo: '',
  admissionNo: '',
  address: ADDRESS,
  courseId: 'crs-bfa',
  batchId: 'bat-bfa-1a',
  section: 'A',
  status: 'active',
  medical: MEDICAL,
  previousInstitution: PREV,
};

const EMPTY = {
  name: '',
  gender: '',
  dateOfBirth: '',
  bloodGroup: '',
  email: '',
  phone: '',
  alternatePhone: '',
  rollNo: '',
  admissionNo: '',
  address: EMPTY_ADDRESS,
  courseId: '',
  batchId: '',
  section: '',
  status: 'active',
  medical: MEDICAL,
  previousInstitution: PREV,
};

beforeEach(() => {
  vi.clearAllMocks();
  useStudentFilterOptions.mockReturnValue({ data: OPTIONS, isPending: false });
});

describe('StudentForm', () => {
  it('groups fields into sectioned biodata and admission blocks', () => {
    signIn('admin', ['students.create']);
    renderWithProviders(<StudentForm mode="create" initialValues={EMPTY} />);

    expect(screen.getByRole('heading', { name: 'Identity' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admission & academics' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Health & special information' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Course/)).toBeInTheDocument();
  });

  it('blocks submit and shows client validation errors when empty', async () => {
    const user = userEvent.setup();
    signIn('admin', ['students.create']);
    renderWithProviders(<StudentForm mode="create" initialValues={EMPTY} />);

    await user.click(screen.getByRole('button', { name: 'Create student' }));

    expect(await screen.findByText('Enter the student’s full name.')).toBeInTheDocument();
    expect(screen.getByText('Select a course.')).toBeInTheDocument();
    expect(mutateCreate).not.toHaveBeenCalled();
  });

  it('submits a valid create and passes the values to the API', async () => {
    const user = userEvent.setup();
    mutateCreate.mockResolvedValue({ id: 'stu-new', name: 'Test Candidate', registerNo: 'MAA20260051' });
    signIn('admin', ['students.create']);
    renderWithProviders(<StudentForm mode="create" initialValues={FILLED} />);

    await user.click(screen.getByRole('button', { name: 'Create student' }));

    await waitFor(() => expect(mutateCreate).toHaveBeenCalledTimes(1));
    expect(mutateCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Candidate', courseId: 'crs-bfa' }));
  });

  it('maps a backend 422 field error onto the matching input', async () => {
    const user = userEvent.setup();
    mutateCreate.mockRejectedValue(
      new ApiError({
        kind: 'validation',
        message: 'Some of the information provided is not valid.',
        status: 422,
        fieldErrors: { email: ['A student with this email already exists.'] },
      }),
    );
    signIn('admin', ['students.create']);
    renderWithProviders(<StudentForm mode="create" initialValues={FILLED} />);

    await user.click(screen.getByRole('button', { name: 'Create student' }));

    expect(await screen.findByText('A student with this email already exists.')).toBeInTheDocument();
    const email = screen.getByLabelText(/Email/);
    expect(email).toHaveAttribute('aria-invalid', 'true');
  });

  it('prefills every field in edit mode', () => {
    signIn('admin', ['students.update']);
    renderWithProviders(<StudentForm mode="edit" studentId="stu-001" initialValues={FILLED} />);

    expect(screen.getByLabelText(/Full name/)).toHaveValue('Test Candidate');
    expect(screen.getByLabelText(/Email/)).toHaveValue('test.candidate@student.mavenart.test');
    expect(screen.getByLabelText(/Course/)).toHaveValue('crs-bfa');
    expect(screen.getByLabelText(/Batch/)).toHaveValue('bat-bfa-1a');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('disables the batch select until a course is chosen', () => {
    signIn('admin', ['students.create']);
    renderWithProviders(<StudentForm mode="create" initialValues={EMPTY} />);
    expect(screen.getByLabelText(/Batch/)).toBeDisabled();
  });
});
