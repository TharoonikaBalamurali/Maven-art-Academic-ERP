import type {
  ArchivedBatchDetail,
  ArchivedBatchListItem,
  ArchivedOutcome,
  ArchivedSection,
  ArchivedStudent,
  BoardExamResult,
  ClosedStudentRecord,
} from '@/features/archive/types';
import type { ListQuery, Paginated } from '@/shared/types';
import { closedStudents } from './students-data';
import { batchName, courseCode, courseName, facultyName, SEED_BATCHES } from './seed';

/**
 * Institutional archive (§ archive).
 *
 * Passed-out batches with their full leaving roster — every student's group,
 * board-examination result and exit remarks — plus the closed student records
 * from the live store. Board marks, percentages and grades are the backend's
 * authoritative results; nothing here is recomputed on the client.
 */

interface PassedBatch {
  id: string;
  name: string;
  courseId: string;
  section: string;
  academicYear: string;
  startedOn: string;
  completedOn: string;
  facultyId: string;
  /** Section → how many students passed out from it. */
  sectionSizes: Record<string, number>;
}

const PASSED_BATCHES: PassedBatch[] = [
  { id: 'bat-bfa-2023a', name: 'BFA Year 3 · A (2023)', courseId: 'crs-bfa', section: 'A', academicYear: '2022–23', startedOn: '2020-07-15', completedOn: '2023-05-31', facultyId: 'u-faculty', sectionSizes: { A: 16, B: 12 } },
  { id: 'bat-vcd-2023a', name: 'VCD Year 3 · A (2023)', courseId: 'crs-vcd', section: 'A', academicYear: '2022–23', startedOn: '2020-07-15', completedOn: '2023-05-31', facultyId: 'fac-002', sectionSizes: { A: 14, B: 10 } },
  { id: 'bat-anim-2024a', name: 'Animation Year 3 · A (2024)', courseId: 'crs-anim', section: 'A', academicYear: '2023–24', startedOn: '2021-07-15', completedOn: '2024-05-31', facultyId: 'fac-003', sectionSizes: { A: 19 } },
  { id: 'bat-photo-2024a', name: 'Photography Year 2 · A (2024)', courseId: 'crs-photo', section: 'A', academicYear: '2023–24', startedOn: '2022-07-15', completedOn: '2024-05-31', facultyId: 'fac-002', sectionSizes: { A: 16 } },
];

const ALUMNI_NAMES = [
  'Ananya Rao', 'Vikram Sethi', 'Meera Joshi', 'Rohan Das', 'Sneha Kapoor', 'Aditya Nair',
  'Ishita Bose', 'Karthik Menon', 'Divya Raman', 'Nikhil Shah', 'Pooja Verma', 'Siddharth Roy',
  'Tanya Mehra', 'Aravind Kumar', 'Ritu Singh', 'Manav Gupta', 'Lakshmi Iyer', 'Farhan Qureshi',
  'Neelam Chawla', 'Varun Pillai',
];

const GROUPS: Record<string, string[]> = {
  'crs-bfa': ['Fine Arts — Painting', 'Fine Arts — Sculpture'],
  'crs-vcd': ['Visual Communication — Branding', 'Visual Communication — Digital'],
  'crs-anim': ['Animation — 2D', 'Animation — 3D'],
  'crs-photo': ['Photography — Studio', 'Photography — Photojournalism'],
};

const SUBJECTS: Record<string, string[]> = {
  'crs-bfa': ['Drawing & Composition', 'Art History', 'Painting Practical', 'Sculpture Studio'],
  'crs-vcd': ['Typography', 'Brand Identity', 'Digital Media', 'Design History'],
  'crs-anim': ['Animation Principles', 'Character Design', 'Storyboarding', 'Rendering'],
  'crs-photo': ['Studio Lighting', 'Composition', 'Post-production', 'Photo History'],
};

const REMARKS = [
  'Consistent performer; strong portfolio at exit.',
  'Excellent studio discipline throughout the course.',
  'Improved markedly in the final year.',
  'Represented the academy at inter-college exhibitions.',
  'Completed all requirements with distinction.',
  'Reliable attendance and steady coursework.',
];

/** Deterministic pseudo-random so the archive is stable between reads. */
function seedNum(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

function gradeFor(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  return 'C';
}

/** Builds one passed-out student's leaving record. */
function alumnus(batch: PassedBatch, section: string, index: number): ArchivedStudent {
  const key = `${batch.id}-${section}-${index}`;
  const h = seedNum(key);
  const name = ALUMNI_NAMES[h % ALUMNI_NAMES.length] ?? 'Alumnus';
  const groups = GROUPS[batch.courseId] ?? ['General'];
  const subjects = SUBJECTS[batch.courseId] ?? ['Paper I', 'Paper II', 'Paper III', 'Paper IV'];
  const year = batch.completedOn.slice(0, 4);

  // Backend-computed board result: per-subject marks and the overall percentage.
  const marks = subjects.map((subject, i) => {
    const m = 55 + ((h >> (i * 3)) % 44); // 55–98
    return { subject, marks: m, maxMarks: 100, grade: gradeFor(m) };
  });
  const percentage = Math.round((marks.reduce((sum, m) => sum + m.marks, 0) / (marks.length * 100)) * 1000) / 10;

  const boardExam: BoardExamResult = {
    examName: `${courseCode(batch.courseId)} Final Examination`,
    year,
    percentage,
    grade: gradeFor(percentage),
    result: percentage >= 40 ? 'Pass' : 'Fail',
    subjects: marks,
  };

  const seq = index + 1;
  return {
    id: `alum-${batch.id}-${section}-${seq}`,
    name,
    registerNo: `MAA${year}${String(1000 + h % 8999).slice(0, 4)}`,
    admissionNo: `ADM/${Number(year) - 3}/${String(2000 + (h % 999))}`,
    rollNo: `${courseCode(batch.courseId)}-${section}-${String(seq).padStart(2, '0')}`,
    group: groups[h % groups.length] ?? 'General',
    section,
    outcome: 'completed',
    effectiveDate: batch.completedOn,
    tcNumber: `TC/${year}/${String(500 + (h % 499))}`,
    destination: '',
    boardExam,
    remarks: REMARKS[h % REMARKS.length] ?? '',
  };
}

/** Closed students from the live store, mapped onto the archive shape. */
function closedFor(batchId: string): ArchivedStudent[] {
  return closedStudents()
    .filter((s) => s.batchId === batchId)
    .map((s) => ({
      id: s.id,
      name: s.name,
      registerNo: s.registerNo,
      admissionNo: s.admissionNo,
      rollNo: '',
      group: courseName(s.courseId),
      section: s.section,
      outcome: (s.closure.type === 'completion' ? 'completed' : s.closure.type === 'transfer' ? 'transferred' : 'withdrawn') as ArchivedOutcome,
      effectiveDate: s.closure.effectiveDate,
      tcNumber: s.closure.tcNumber,
      destination: s.closure.destination,
      // A student who left early has no final board result.
      boardExam: null,
      remarks: s.closure.reason,
    }));
}

function rosterFor(batch: PassedBatch): ArchivedSection[] {
  const closed = closedFor(batch.id);
  return Object.entries(batch.sectionSizes).map(([section, size]) => {
    const passed = Array.from({ length: size }, (_, i) => alumnus(batch, section, i));
    const closedHere = closed.filter((s) => s.section === section);
    const students = [...passed, ...closedHere];
    return { section, studentCount: students.length, students };
  });
}

function toListItem(b: PassedBatch): ArchivedBatchListItem {
  const sections = rosterFor(b);
  const all = sections.flatMap((s) => s.students);
  return {
    id: b.id,
    name: b.name,
    course: courseName(b.courseId),
    courseCode: courseCode(b.courseId),
    section: b.section,
    academicYear: b.academicYear,
    completedOn: b.completedOn,
    totalStudents: all.length,
    completed: all.filter((s) => s.outcome === 'completed').length,
    transferred: all.filter((s) => s.outcome === 'transferred').length,
    withdrawn: all.filter((s) => s.outcome === 'withdrawn').length,
  };
}

/** Live batches that are no longer active also belong in the archive. */
function inactiveAsPassed(): PassedBatch[] {
  return SEED_BATCHES.filter((b) => !b.active).map((b) => ({
    id: b.id, name: b.name, courseId: b.courseId, section: b.section,
    academicYear: '2025–26', startedOn: '2024-07-15', completedOn: '2026-05-31',
    facultyId: b.facultyId, sectionSizes: { [b.section]: b.studentCount },
  }));
}

function allBatches(): PassedBatch[] {
  return [...PASSED_BATCHES, ...inactiveAsPassed()];
}

export function listArchivedBatches(query: ListQuery): Paginated<ArchivedBatchListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const year = String(query.filters?.academicYear ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = allBatches().map(toListItem).filter((r) => {
    if (search && !r.name.toLowerCase().includes(search) && !r.course.toLowerCase().includes(search)) return false;
    if (year && r.academicYear !== year) return false;
    return true;
  }).sort((a, b) => {
    const av = a.completedOn ?? '';
    const bv = b.completedOn ?? '';
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getArchivedBatch(id: string): ArchivedBatchDetail | null {
  const base = allBatches().find((b) => b.id === id);
  if (!base) return null;

  const sections = rosterFor(base);
  const students = sections.flatMap((s) => s.students);
  const withResult = students.filter((s) => s.boardExam !== null);
  const averagePercentage = withResult.length
    ? Math.round((withResult.reduce((sum, s) => sum + (s.boardExam?.percentage ?? 0), 0) / withResult.length) * 10) / 10
    : null;

  return {
    ...toListItem(base),
    facultyName: facultyName(base.facultyId),
    startedOn: base.startedOn,
    averagePercentage,
    sections,
    students,
  };
}

/** One passed-out student's full leaving record. */
export function getArchivedStudent(studentId: string): (ArchivedStudent & { batchId: string; batch: string; course: string; academicYear: string }) | null {
  for (const batch of allBatches()) {
    for (const section of rosterFor(batch)) {
      const found = section.students.find((s) => s.id === studentId);
      if (found) {
        return {
          ...found,
          batchId: batch.id,
          batch: batch.name,
          course: courseName(batch.courseId),
          academicYear: batch.academicYear,
        };
      }
    }
  }
  return null;
}

/**
 * Every closed student record, regardless of whether its batch has passed out —
 * a student who withdraws mid-course must still be findable in the archive.
 */
export function listClosedStudents(query: ListQuery): Paginated<ClosedStudentRecord> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const outcome = String(query.filters?.outcome ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows: ClosedStudentRecord[] = closedStudents()
    .map((s) => ({
      id: s.id,
      name: s.name,
      registerNo: s.registerNo,
      admissionNo: s.admissionNo,
      rollNo: '',
      group: courseName(s.courseId),
      section: s.section,
      outcome: (s.closure.type === 'completion' ? 'completed' : s.closure.type === 'transfer' ? 'transferred' : 'withdrawn') as ArchivedOutcome,
      effectiveDate: s.closure.effectiveDate,
      tcNumber: s.closure.tcNumber,
      destination: s.closure.destination,
      boardExam: null,
      remarks: s.closure.reason,
      course: courseName(s.courseId),
      batch: batchName(s.batchId),
      reason: s.closure.reason,
      closedOn: s.closure.closedOn,
    }))
    .filter((r) => {
      if (search && !r.name.toLowerCase().includes(search) && !r.registerNo.toLowerCase().includes(search) && !r.admissionNo.toLowerCase().includes(search)) return false;
      if (outcome && r.outcome !== outcome) return false;
      return true;
    })
    .sort((a, b) => (sortDir === 'asc' ? a.effectiveDate.localeCompare(b.effectiveDate) : b.effectiveDate.localeCompare(a.effectiveDate)));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}
