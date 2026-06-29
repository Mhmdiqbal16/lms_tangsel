import { FormEvent, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FilterBar } from '@/components/ui/FilterBar';
import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/apiClient';
import { useActionNotifier } from '@/useActionNotifier';
import { ClassRoom, Role, Schedule, StudentProfile, Subject, TeacherProfile, User } from '@/types';
import { formatDayName } from '@/utils/date';
import { getRoleLabel } from '@/utils/helpers';

type AdminTab = 'accounts' | 'teachers' | 'classes' | 'subjects' | 'schedules';
type MasterDataKind = 'teacher' | 'class' | 'subject' | 'schedule';
type AccountRecord = Omit<User, 'password'>;
type AccountRoleFilter = Role | 'all';
type AccountEditForm = {
  id: string;
  role: Role;
  name: string;
  identifier: string;
  password: string;
};
type DeleteConfirmation =
  | { type: 'account'; account: AccountRecord }
  | { type: 'master-data'; kind: MasterDataKind; id: string; label: string; name: string };

const roleOptions: Role[] = ['siswa', 'guru', 'kurikulum', 'admin'];
const masterDataKindLabels: Record<MasterDataKind, string> = {
  teacher: 'guru',
  class: 'kelas',
  subject: 'mapel',
  schedule: 'jadwal',
};

const emptyAccountForm = {
  role: 'siswa' as Role,
  referenceId: '',
  identifier: '',
  password: '',
  name: '',
  email: '',
  employeeId: '',
  classId: '',
  subjectIds: [] as string[],
};

const emptyTeacherForm = {
  id: '',
  name: '',
  nip: '',
  email: '',
  subjectIds: [] as string[],
};

const emptyClassForm = {
  id: '',
  name: '',
  major: '',
  homeroomTeacherId: '',
};

const emptySubjectForm = {
  id: '',
  name: '',
  shortName: '',
};

const emptyScheduleForm = {
  id: '',
  classId: '',
  subjectId: '',
  teacherId: '',
  day: 1,
  startTime: '07:00',
  endTime: '08:40',
  room: '',
};

const dayOptions = [1, 2, 3, 4, 5];

function upsertRecord<T extends { id: string }>(items: T[], nextItem: T) {
  return items.some((item) => item.id === nextItem.id)
    ? items.map((item) => (item.id === nextItem.id ? nextItem : item))
    : [nextItem, ...items];
}

function toTeacherForm(teacher: TeacherProfile) {
  return {
    id: teacher.id,
    name: teacher.name,
    nip: teacher.nip,
    email: teacher.email,
    subjectIds: [...teacher.subjectIds],
  };
}

export function AdminMasterDataPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('accounts');
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'warning'; text: string } | null>(null);
  useActionNotifier(message);
  const [teacherForm, setTeacherForm] = useState(emptyTeacherForm);
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [subjectForm, setSubjectForm] = useState(emptySubjectForm);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [accountEditForm, setAccountEditForm] = useState<AccountEditForm | null>(null);
  const accountEditFormRef = useRef<HTMLFormElement | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [accountRoleFilter, setAccountRoleFilter] = useState<AccountRoleFilter>('all');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [scheduleClassFilter, setScheduleClassFilter] = useState('all');
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [databaseStudents, setDatabaseStudents] = useState<StudentProfile[]>([]);
  const [databaseTeachers, setDatabaseTeachers] = useState<TeacherProfile[]>([]);
  const [databaseClasses, setDatabaseClasses] = useState<ClassRoom[]>([]);
  const [databaseSubjects, setDatabaseSubjects] = useState<Subject[]>([]);
  const [databaseSchedules, setDatabaseSchedules] = useState<Schedule[]>([]);
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);
  const [isAccountEditSubmitting, setIsAccountEditSubmitting] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [deletingMasterDataKey, setDeletingMasterDataKey] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);
  const [isReferencesLoading, setIsReferencesLoading] = useState(false);
  const [isTeacherSubmitting, setIsTeacherSubmitting] = useState(false);
  const [isClassSubmitting, setIsClassSubmitting] = useState(false);
  const [isSubjectSubmitting, setIsSubjectSubmitting] = useState(false);
  const [isScheduleSubmitting, setIsScheduleSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setIsAccountsLoading(true);
    setIsReferencesLoading(true);

    Promise.all([
      apiRequest<AccountRecord[]>('/api/admin/accounts'),
      apiRequest<StudentProfile[]>('/api/admin/students'),
      apiRequest<TeacherProfile[]>('/api/admin/teachers'),
      apiRequest<ClassRoom[]>('/api/admin/classes'),
      apiRequest<Subject[]>('/api/admin/subjects'),
      apiRequest<Schedule[]>('/api/admin/schedules'),
    ])
      .then(([accountData, studentData, teacherData, classData, subjectData, scheduleData]) => {
        if (isMounted) {
          setAccounts(accountData);
          setDatabaseStudents(studentData);
          setDatabaseTeachers(teacherData);
          setDatabaseClasses(classData);
          setDatabaseSubjects(subjectData);
          setDatabaseSchedules(scheduleData);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setMessage({
            tone: 'warning',
            text: error instanceof Error ? error.message : 'Data Super Admin gagal dimuat dari database.',
          });
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsAccountsLoading(false);
          setIsReferencesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!accountEditForm) {
      return;
    }

    accountEditFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [accountEditForm?.id]);

  const tabs: Array<{ id: AdminTab; label: string; count: number }> = [
    { id: 'accounts', label: 'Akun', count: accounts.length },
    { id: 'teachers', label: 'Guru', count: databaseTeachers.length },
    { id: 'classes', label: 'Kelas', count: databaseClasses.length },
    { id: 'subjects', label: 'Mapel', count: databaseSubjects.length },
    { id: 'schedules', label: 'Jadwal', count: databaseSchedules.length },
  ];

  const requestMasterDataDelete = (kind: MasterDataKind, id: string, name: string) => {
    setDeleteConfirmation({
      type: 'master-data',
      kind,
      id,
      label: masterDataKindLabels[kind],
      name,
    });
  };

  const executeMasterDataDelete = async (kind: MasterDataKind, id: string) => {
    const deleteKey = `${kind}-${id}`;
    setDeletingMasterDataKey(deleteKey);

    try {
      await apiRequest('/api/admin/master-data', {
        method: 'DELETE',
        body: JSON.stringify({ kind, id }),
      });

      if (kind === 'teacher') {
        setDatabaseTeachers((current) => current.filter((item) => item.id !== id));
      } else if (kind === 'class') {
        setDatabaseClasses((current) => current.filter((item) => item.id !== id));
      } else if (kind === 'subject') {
        setDatabaseSubjects((current) => current.filter((item) => item.id !== id));
      } else {
        setDatabaseSchedules((current) => current.filter((item) => item.id !== id));
      }

      setMessage({ tone: 'success', text: 'Data berhasil dihapus dari database.' });
    } catch (error) {
      setMessage({
        tone: 'warning',
        text: error instanceof Error ? error.message : 'Data gagal dihapus.',
      });
    } finally {
      setDeletingMasterDataKey(null);
      setDeleteConfirmation(null);
    }
  };

  const handleTeacherSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsTeacherSubmitting(true);

    try {
      const teacher = await apiRequest<TeacherProfile>('/api/admin/teachers', {
        method: 'POST',
        body: JSON.stringify({
          ...teacherForm,
          id: teacherForm.id || undefined,
        }),
      });

      setDatabaseTeachers((current) => upsertRecord(current, teacher));
      setTeacherForm(emptyTeacherForm);
      setMessage({ tone: 'success', text: 'Guru berhasil disimpan ke database.' });
    } catch (error) {
      setMessage({
        tone: 'warning',
        text: error instanceof Error ? error.message : 'Guru gagal disimpan.',
      });
    } finally {
      setIsTeacherSubmitting(false);
    }
  };

  const handleClassSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsClassSubmitting(true);

    try {
      const classRoom = await apiRequest<ClassRoom>('/api/admin/classes', {
        method: 'POST',
        body: JSON.stringify({
          ...classForm,
          id: classForm.id || undefined,
          homeroomTeacherId: classForm.homeroomTeacherId || undefined,
        }),
      });

      setDatabaseClasses((current) => upsertRecord(current, classRoom));
      setClassForm(emptyClassForm);
      setMessage({ tone: 'success', text: 'Kelas berhasil disimpan ke database.' });
    } catch (error) {
      setMessage({
        tone: 'warning',
        text: error instanceof Error ? error.message : 'Kelas gagal disimpan.',
      });
    } finally {
      setIsClassSubmitting(false);
    }
  };

  const handleSubjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubjectSubmitting(true);

    try {
      const subject = await apiRequest<Subject>('/api/admin/subjects', {
        method: 'POST',
        body: JSON.stringify({
          ...subjectForm,
          id: subjectForm.id || undefined,
        }),
      });

      setDatabaseSubjects((current) => upsertRecord(current, subject));
      setSubjectForm(emptySubjectForm);
      setMessage({ tone: 'success', text: 'Mata pelajaran berhasil disimpan ke database.' });
    } catch (error) {
      setMessage({
        tone: 'warning',
        text: error instanceof Error ? error.message : 'Mata pelajaran gagal disimpan.',
      });
    } finally {
      setIsSubjectSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsScheduleSubmitting(true);

    try {
      const schedule = await apiRequest<Schedule>('/api/admin/schedules', {
        method: 'POST',
        body: JSON.stringify({
          ...scheduleForm,
          id: scheduleForm.id || undefined,
        }),
      });

      setDatabaseSchedules((current) => upsertRecord(current, schedule));
      setScheduleForm(emptyScheduleForm);
      setMessage({ tone: 'success', text: 'Jadwal berhasil disimpan ke database.' });
    } catch (error) {
      setMessage({
        tone: 'warning',
        text: error instanceof Error ? error.message : 'Jadwal gagal disimpan.',
      });
    } finally {
      setIsScheduleSubmitting(false);
    }
  };

  const handleAccountSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedAccountForm = {
      role: accountForm.role,
      referenceId: accountForm.referenceId.trim(),
      identifier: accountForm.identifier.trim(),
      password: accountForm.password,
      name: accountForm.name.trim(),
      email: accountForm.email.trim(),
      employeeId: accountForm.employeeId.trim(),
      classId: accountForm.classId.trim(),
      subjectIds: accountForm.subjectIds,
    };
    const linkedStudent = databaseStudents.find((student) => student.nisn === normalizedAccountForm.identifier);

    if (!normalizedAccountForm.name || !normalizedAccountForm.identifier || normalizedAccountForm.password.length < 6) {
      setMessage({
        tone: 'warning',
        text: 'Nama, username/NISN/NIP, dan password minimal 6 karakter wajib diisi.',
      });
      return;
    }

    if (normalizedAccountForm.role === 'siswa' && !linkedStudent && !normalizedAccountForm.classId) {
      setMessage({
        tone: 'warning',
        text: 'Pilih kelas siswa terlebih dahulu untuk membuat akun siswa baru.',
      });
      return;
    }

    if (normalizedAccountForm.role === 'guru' && !normalizedAccountForm.referenceId && normalizedAccountForm.subjectIds.length === 0) {
      setMessage({
        tone: 'warning',
        text: 'Pilih minimal satu mata pelajaran untuk membuat akun guru baru.',
      });
      return;
    }

    if (normalizedAccountForm.role === 'kurikulum' && !normalizedAccountForm.employeeId) {
      setMessage({ tone: 'warning', text: 'ID pegawai wajib diisi untuk akun kurikulum.' });
      return;
    }

    setIsAccountSubmitting(true);

    try {
      const account = await apiRequest<AccountRecord>('/api/admin/accounts', {
        method: 'POST',
        body: JSON.stringify({
          role: normalizedAccountForm.role,
          identifier: normalizedAccountForm.identifier,
          password: normalizedAccountForm.password,
          name: normalizedAccountForm.name,
          email: normalizedAccountForm.email || undefined,
          classId: normalizedAccountForm.role === 'siswa' ? normalizedAccountForm.classId : undefined,
          referenceId:
            normalizedAccountForm.role === 'guru' && normalizedAccountForm.referenceId
              ? normalizedAccountForm.referenceId
              : undefined,
          employeeId: normalizedAccountForm.role === 'kurikulum' ? normalizedAccountForm.employeeId : undefined,
          subjectIds: normalizedAccountForm.role === 'guru' ? normalizedAccountForm.subjectIds : undefined,
        }),
      });

      setAccounts((current) => upsertRecord(current, account));

      let refreshFailed = false;
      try {
        if (normalizedAccountForm.role === 'siswa') {
          setDatabaseStudents(await apiRequest<StudentProfile[]>('/api/admin/students'));
        } else if (normalizedAccountForm.role === 'guru') {
          setDatabaseTeachers(await apiRequest<TeacherProfile[]>('/api/admin/teachers'));
        }
      } catch {
        refreshFailed = true;
      }

      setAccountForm(emptyAccountForm);
      setMessage({
        tone: 'success',
        text: refreshFailed
          ? 'Akun berhasil dibuat. Muat ulang halaman jika data profil belum langsung terlihat.'
          : 'Akun berhasil dibuat dan tersimpan ke database.',
      });
    } catch (error) {
      setMessage({
        tone: 'warning',
        text: error instanceof Error ? error.message : 'Akun gagal dibuat.',
      });
    } finally {
      setIsAccountSubmitting(false);
    }
  };

  const handleAccountEdit = (account: AccountRecord) => {
    if (account.role === 'admin') {
      setMessage({ tone: 'warning', text: 'Akun Super Admin tidak dapat diedit dari menu operator.' });
      return;
    }

    setAccountEditForm({
      id: account.id,
      role: account.role,
      name: account.name,
      identifier: account.identifier,
      password: '',
    });
  };

  const handleAccountEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accountEditForm) {
      return;
    }

    const identifier = accountEditForm.identifier.trim();
    const password = accountEditForm.password.trim();

    if (!identifier) {
      setMessage({ tone: 'warning', text: 'Username wajib diisi.' });
      return;
    }

    if (password && password.length < 6) {
      setMessage({ tone: 'warning', text: 'Password baru minimal 6 karakter.' });
      return;
    }

    setIsAccountEditSubmitting(true);

    try {
      const account = await apiRequest<AccountRecord>('/api/admin/accounts', {
        method: 'PATCH',
        body: JSON.stringify({
          id: accountEditForm.id,
          identifier,
          password: password || undefined,
        }),
      });

      setAccounts((current) => upsertRecord(current, account));
      setAccountEditForm(null);
      setMessage({ tone: 'success', text: 'Username atau password akun berhasil diperbarui.' });
    } catch (error) {
      setMessage({
        tone: 'warning',
        text: error instanceof Error ? error.message : 'Akun gagal diperbarui.',
      });
    } finally {
      setIsAccountEditSubmitting(false);
    }
  };

  const handleDeleteAccount = async (account: AccountRecord) => {
    if (account.id === session?.userId) {
      setMessage({ tone: 'warning', text: 'Akun Super Admin yang sedang digunakan tidak bisa dihapus.' });
      return;
    }

    setDeleteConfirmation({ type: 'account', account });
  };

  const executeDeleteAccount = async (account: AccountRecord) => {
    setDeletingAccountId(account.id);

    try {
      await apiRequest('/api/admin/accounts', {
        method: 'DELETE',
        body: JSON.stringify({ id: account.id }),
      });

      setAccounts((current) => current.filter((item) => item.id !== account.id));
      if (account.role === 'siswa') {
        setDatabaseStudents(await apiRequest<StudentProfile[]>('/api/admin/students'));
      } else if (account.role === 'guru') {
        setDatabaseTeachers(await apiRequest<TeacherProfile[]>('/api/admin/teachers'));
      }
      setMessage({ tone: 'success', text: 'Akun berhasil dihapus. Data profil terkait tetap tersimpan.' });
    } catch (error) {
      setMessage({
        tone: 'warning',
        text: error instanceof Error ? error.message : 'Akun gagal dihapus.',
      });
    } finally {
      setDeletingAccountId(null);
      setDeleteConfirmation(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmation) {
      return;
    }

    if (deleteConfirmation.type === 'account') {
      void executeDeleteAccount(deleteConfirmation.account);
      return;
    }

    void executeMasterDataDelete(deleteConfirmation.kind, deleteConfirmation.id);
  };

  const isDeleteConfirmationLoading =
    deleteConfirmation?.type === 'account'
      ? deletingAccountId === deleteConfirmation.account.id
      : deleteConfirmation?.type === 'master-data'
        ? deletingMasterDataKey === `${deleteConfirmation.kind}-${deleteConfirmation.id}`
        : false;

  const deleteConfirmationTitle =
    deleteConfirmation?.type === 'account'
      ? `Hapus akun ${deleteConfirmation.account.name}?`
      : deleteConfirmation
        ? `Hapus data ${deleteConfirmation.label}?`
        : 'Hapus data?';

  const deleteConfirmationDescription =
    deleteConfirmation?.type === 'account'
      ? 'Akun ini tidak bisa digunakan login lagi, tetapi data profil terkait tetap disimpan.'
      : deleteConfirmation
        ? `Data ${deleteConfirmation.label} "${deleteConfirmation.name}" akan dihapus dari database jika tidak sedang dipakai data lain.`
        : 'Data akan dihapus dari database.';

  const toggleTeacherSubject = (subjectId: string) => {
    setTeacherForm((current) => ({
      ...current,
      subjectIds: current.subjectIds.includes(subjectId)
        ? current.subjectIds.filter((item) => item !== subjectId)
        : [...current.subjectIds, subjectId],
    }));
  };

  const toggleAccountSubject = (subjectId: string) => {
    setAccountForm((current) => ({
      ...current,
      subjectIds: current.subjectIds.includes(subjectId)
        ? current.subjectIds.filter((item) => item !== subjectId)
        : [...current.subjectIds, subjectId],
    }));
  };

  const handleTeacherSelect = (teacherId: string) => {
    const teacher = databaseTeachers.find((item) => item.id === teacherId);
    setTeacherForm(teacher ? toTeacherForm(teacher) : emptyTeacherForm);
  };

  const handleAccountTeacherSelect = (teacherId: string) => {
    const teacher = databaseTeachers.find((item) => item.id === teacherId);

    setAccountForm((current) => ({
      ...current,
      referenceId: teacherId,
      name: teacher?.name ?? '',
      identifier: teacher?.nip ?? '',
      email: teacher?.email ?? '',
      subjectIds: teacher ? [...teacher.subjectIds] : [],
    }));
  };

  const teacherAccountReferenceIds = new Set(
    accounts.filter((account) => account.role === 'guru').map((account) => account.referenceId),
  );
  const teachersWithoutAccounts = databaseTeachers.filter(
    (teacher) => !teacher.userId && !teacherAccountReferenceIds.has(teacher.id),
  );
  const selectedAccountTeacher = accountForm.referenceId
    ? databaseTeachers.find((teacher) => teacher.id === accountForm.referenceId)
    : undefined;

  const normalizedAccountSearch = accountSearch.trim().toLowerCase();
  const hasAccountFilter = accountRoleFilter !== 'all' || normalizedAccountSearch.length > 0;
  const filteredAccounts = accounts.filter((account) => {
    const matchesRole = accountRoleFilter === 'all' || account.role === accountRoleFilter;
    const searchableText = `${account.name} ${account.identifier} ${account.referenceId} ${getRoleLabel(
      account.role,
    )}`.toLowerCase();

    return matchesRole && searchableText.includes(normalizedAccountSearch);
  });

  const normalizedTeacherSearch = teacherSearch.trim().toLowerCase();
  const filteredTeachers = databaseTeachers.filter((teacher) => {
    if (!normalizedTeacherSearch) {
      return true;
    }

    const subjectText = teacher.subjectIds
      .map((subjectId) => {
        const subject = databaseSubjects.find((item) => item.id === subjectId);
        return `${subject?.name ?? ''} ${subject?.shortName ?? ''}`;
      })
      .join(' ');
    const searchableText = `${teacher.name} ${teacher.nip} ${teacher.email} ${subjectText}`.toLowerCase();

    return searchableText.includes(normalizedTeacherSearch);
  });

  const normalizedClassSearch = classSearch.trim().toLowerCase();
  const filteredClasses = databaseClasses.filter((classItem) => {
    if (!normalizedClassSearch) {
      return true;
    }

    const homeroomTeacher = databaseTeachers.find((teacher) => teacher.id === classItem.homeroomTeacherId)?.name ?? '';
    const studentCount = databaseStudents.filter((student) => student.classId === classItem.id).length;
    const searchableText = `${classItem.name} ${classItem.major} ${homeroomTeacher} ${studentCount}`.toLowerCase();

    return searchableText.includes(normalizedClassSearch);
  });

  const normalizedSubjectSearch = subjectSearch.trim().toLowerCase();
  const filteredSubjects = databaseSubjects.filter((subject) => {
    if (!normalizedSubjectSearch) {
      return true;
    }

    const scheduleCount = databaseSchedules.filter((schedule) => schedule.subjectId === subject.id).length;
    const searchableText = `${subject.name} ${subject.shortName} ${scheduleCount}`.toLowerCase();

    return searchableText.includes(normalizedSubjectSearch);
  });

  const accountColumns: TableColumn<AccountRecord>[] = [
    {
      key: 'name',
      header: 'Nama',
      render: (item) => item.name,
      className: 'max-w-[260px] break-words [overflow-wrap:anywhere]',
    },
    { key: 'role', header: 'Role', render: (item) => <Badge variant="blue">{getRoleLabel(item.role)}</Badge> },
    {
      key: 'identifier',
      header: 'NISN/NIP/Username',
      render: (item) => item.identifier,
      className: 'max-w-[220px] break-words [overflow-wrap:anywhere]',
    },
    {
      key: 'reference',
      header: 'Profil',
      render: (item) => item.referenceId,
      className: 'max-w-[220px] break-words [overflow-wrap:anywhere]',
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'min-w-[150px] whitespace-nowrap',
      render: (item) =>
        item.id === session?.userId ? (
          <Badge variant="yellow">Akun aktif</Badge>
        ) : (
          <div className="flex flex-nowrap gap-2">
            {item.role !== 'admin' ? (
              <button
                type="button"
                onClick={() => handleAccountEdit(item)}
                className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Edit Login
              </button>
            ) : null}
            <button
              type="button"
              disabled={deletingAccountId === item.id}
              onClick={() => handleDeleteAccount(item)}
              className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              {deletingAccountId === item.id ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        ),
    },
  ];

  const teacherColumns: TableColumn<TeacherProfile>[] = [
    { key: 'name', header: 'Nama', render: (item) => item.name },
    { key: 'nip', header: 'NIP', render: (item) => item.nip },
    {
      key: 'subjects',
      header: 'Mapel',
      render: (item) =>
        item.subjectIds
          .map((subjectId) => databaseSubjects.find((subject) => subject.id === subjectId)?.shortName)
          .filter(Boolean)
          .join(', ') || '-',
    },
    { key: 'email', header: 'Email', render: (item) => item.email },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'min-w-[132px] whitespace-nowrap',
      render: (item) => (
        <div className="flex flex-nowrap gap-2">
          <button
            type="button"
            onClick={() => setTeacherForm(toTeacherForm(item))}
            className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={deletingMasterDataKey === `teacher-${item.id}`}
            onClick={() => requestMasterDataDelete('teacher', item.id, item.name)}
            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {deletingMasterDataKey === `teacher-${item.id}` ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      ),
    },
  ];

  const classColumns: TableColumn<ClassRoom>[] = [
    { key: 'name', header: 'Kelas', render: (item) => item.name },
    { key: 'major', header: 'Jurusan', render: (item) => item.major },
    {
      key: 'homeroom',
      header: 'Wali Kelas',
      render: (item) => databaseTeachers.find((teacher) => teacher.id === item.homeroomTeacherId)?.name ?? '-',
    },
    {
      key: 'students',
      header: 'Jumlah Siswa',
      render: (item) => databaseStudents.filter((student) => student.classId === item.id).length,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setClassForm(item)}
            className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={deletingMasterDataKey === `class-${item.id}`}
            onClick={() => requestMasterDataDelete('class', item.id, item.name)}
            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {deletingMasterDataKey === `class-${item.id}` ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      ),
    },
  ];

  const subjectColumns: TableColumn<Subject>[] = [
    { key: 'name', header: 'Mata Pelajaran', render: (item) => item.name },
    { key: 'shortName', header: 'Singkatan', render: (item) => item.shortName },
    {
      key: 'scheduleCount',
      header: 'Jumlah Jadwal',
      render: (item) => databaseSchedules.filter((schedule) => schedule.subjectId === item.id).length,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubjectForm(item)}
            className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={deletingMasterDataKey === `subject-${item.id}`}
            onClick={() => requestMasterDataDelete('subject', item.id, item.name)}
            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {deletingMasterDataKey === `subject-${item.id}` ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      ),
    },
  ];

  const getScheduleLabel = (schedule: Schedule) => {
    const className = databaseClasses.find((classItem) => classItem.id === schedule.classId)?.name ?? '-';
    const subjectName = databaseSubjects.find((subject) => subject.id === schedule.subjectId)?.name ?? '-';
    return `${className} - ${subjectName} (${formatDayName(schedule.day)}, ${schedule.startTime}-${schedule.endTime})`;
  };

  const scheduleColumns: TableColumn<Schedule>[] = [
    { key: 'day', header: 'Hari', render: (item) => formatDayName(item.day) },
    { key: 'time', header: 'Waktu Pelajaran', render: (item) => `${item.startTime} - ${item.endTime}` },
    {
      key: 'class',
      header: 'Kelas',
      render: (item) => databaseClasses.find((classItem) => classItem.id === item.classId)?.name ?? '-',
    },
    {
      key: 'subject',
      header: 'Mapel',
      render: (item) => databaseSubjects.find((subject) => subject.id === item.subjectId)?.name ?? '-',
    },
    {
      key: 'teacher',
      header: 'Guru',
      render: (item) => databaseTeachers.find((teacher) => teacher.id === item.teacherId)?.name ?? '-',
    },
    { key: 'room', header: 'Ruang', render: (item) => item.room },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setScheduleForm(item)}
            className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={deletingMasterDataKey === `schedule-${item.id}`}
            onClick={() => requestMasterDataDelete('schedule', item.id, getScheduleLabel(item))}
            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {deletingMasterDataKey === `schedule-${item.id}` ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      ),
    },
  ];

  const filteredSchedules = databaseSchedules
    .filter((schedule) => scheduleClassFilter === 'all' || schedule.classId === scheduleClassFilter)
    .slice()
    .sort((first, second) => first.day - second.day || first.startTime.localeCompare(second.startTime));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Master"
        description="Super Admin mengelola akun pengguna, guru, kelas, mata pelajaran, dan jadwal yang menjadi dasar seluruh fitur monitoring."
      />

      {message ? <InfoAlert tone={message.tone} message={message.text} /> : null}
      {isReferencesLoading ? <InfoAlert tone="info" message="Data kelas dan mapel sedang dimuat dari database." /> : null}

      <div className="flex flex-wrap gap-2 rounded-3xl border border-brand-100 bg-white p-3 shadow-soft">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === tab.id ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-600 hover:bg-brand-50'
            }`}
          >
            <span>{tab.label}</span>
            <Badge variant={activeTab === tab.id ? 'slate' : 'blue'}>{tab.count}</Badge>
          </button>
        ))}
      </div>

      {activeTab === 'accounts' ? (
        <section className="space-y-6">
          <form className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft" onSubmit={handleAccountSubmit}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Buat Akun Role</h2>
              <Badge variant="blue">Supabase</Badge>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <select
                value={accountForm.role}
                onChange={(event) =>
                  setAccountForm((current) => ({
                    ...current,
                    role: event.target.value as Role,
                    referenceId: '',
                    name: '',
                    identifier: '',
                    email: '',
                    employeeId: '',
                    classId: '',
                    subjectIds: [],
                  }))
                }
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {getRoleLabel(role)}
                  </option>
                ))}
              </select>
              {accountForm.role === 'guru' && teachersWithoutAccounts.length > 0 ? (
                <select
                  value={accountForm.referenceId}
                  onChange={(event) => handleAccountTeacherSelect(event.target.value)}
                  className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none md:col-span-2"
                >
                  <option value="">Buat guru baru dari form akun</option>
                  {teachersWithoutAccounts.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} - {teacher.nip}
                    </option>
                  ))}
                </select>
              ) : null}
              <input
                value={accountForm.name}
                onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))}
                disabled={Boolean(selectedAccountTeacher)}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder={accountForm.role === 'siswa' ? 'Nama siswa' : 'Nama akun'}
              />
              <input
                value={accountForm.identifier}
                onChange={(event) => setAccountForm((current) => ({ ...current, identifier: event.target.value }))}
                disabled={Boolean(selectedAccountTeacher)}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder={accountForm.role === 'siswa' ? 'NISN' : 'NIP/username'}
              />
              <input
                type="password"
                value={accountForm.password}
                onChange={(event) => setAccountForm((current) => ({ ...current, password: event.target.value }))}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Password minimal 6 karakter"
              />
              <input
                type="email"
                value={accountForm.email}
                onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))}
                disabled={Boolean(selectedAccountTeacher)}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder={accountForm.role === 'siswa' ? 'Email siswa' : 'Email'}
              />
              {accountForm.role === 'kurikulum' ? (
                <input
                  value={accountForm.employeeId}
                  onChange={(event) => setAccountForm((current) => ({ ...current, employeeId: event.target.value }))}
                  className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                  placeholder="ID pegawai"
                />
              ) : null}
              {accountForm.role === 'siswa' ? (
                <select
                  value={accountForm.classId}
                  onChange={(event) => setAccountForm((current) => ({ ...current, classId: event.target.value }))}
                  className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                >
                  <option value="">Pilih kelas siswa</option>
                  {databaseClasses.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            {accountForm.role === 'guru' ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {databaseSubjects.map((subject) => (
                  <label
                    key={subject.id}
                    className={`flex items-center gap-3 rounded-2xl border border-brand-100 px-4 py-3 text-sm font-medium text-slate-700 ${
                      selectedAccountTeacher ? 'bg-slate-100 text-slate-500' : 'bg-brand-50/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={accountForm.subjectIds.includes(subject.id)}
                      disabled={Boolean(selectedAccountTeacher)}
                      onChange={() => toggleAccountSubject(subject.id)}
                      className="h-4 w-4 accent-brand-600 disabled:cursor-not-allowed"
                    />
                    <span>{subject.name}</span>
                  </label>
                ))}
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isAccountSubmitting}
                className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {isAccountSubmitting
                  ? 'Menyimpan...'
                  : accountForm.role === 'siswa'
                    ? 'Simpan Akun Siswa'
                    : 'Simpan Akun'}
              </button>
              <button
                type="button"
                onClick={() => setAccountForm(emptyAccountForm)}
                className="rounded-2xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Reset Form
              </button>
            </div>
          </form>
          {accountEditForm ? (
            <form
              ref={accountEditFormRef}
              className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft"
              onSubmit={handleAccountEditSubmit}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Edit Login Akun</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {accountEditForm.name} - {getRoleLabel(accountEditForm.role)}
                  </p>
                </div>
                <Badge variant="yellow">Operator</Badge>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Username / NISN / NIP</span>
                  <input
                    value={accountEditForm.identifier}
                    onChange={(event) =>
                      setAccountEditForm((current) =>
                        current ? { ...current, identifier: event.target.value } : current,
                      )
                    }
                    className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                    placeholder="Username baru"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Password Baru</span>
                  <input
                    type="password"
                    value={accountEditForm.password}
                    onChange={(event) =>
                      setAccountEditForm((current) =>
                        current ? { ...current, password: event.target.value } : current,
                      )
                    }
                    className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                    placeholder="Kosongkan jika tidak diganti"
                  />
                </label>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isAccountEditSubmitting}
                  className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
                >
                  {isAccountEditSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => setAccountEditForm(null)}
                  className="rounded-2xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : null}
          {isAccountsLoading ? (
            <InfoAlert tone="info" message="Daftar akun sedang dimuat dari database." />
          ) : (
            <>
              <FilterBar>
                <input
                  value={accountSearch}
                  onChange={(event) => setAccountSearch(event.target.value)}
                  className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                  placeholder="Cari nama, username, atau profil"
                />
                <select
                  value={accountRoleFilter}
                  onChange={(event) => setAccountRoleFilter(event.target.value as AccountRoleFilter)}
                  className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                >
                  <option value="all">Semua role</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-slate-600">
                  <span>
                    <span className="font-semibold text-slate-900">{filteredAccounts.length}</span> dari {accounts.length}{' '}
                    akun
                  </span>
                  <button
                    type="button"
                    disabled={!hasAccountFilter}
                    onClick={() => {
                      setAccountSearch('');
                      setAccountRoleFilter('all');
                    }}
                    className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  >
                    Reset
                  </button>
                </div>
              </FilterBar>
              <DataTable
                data={filteredAccounts}
                columns={accountColumns}
                getRowKey={(item) => item.id}
                emptyTitle="Akun tidak ditemukan"
                emptyDescription="Tidak ada akun yang sesuai dengan filter saat ini."
              />
            </>
          )}
        </section>
      ) : null}

      {activeTab === 'teachers' ? (
        <section className="space-y-6">
          <form className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft" onSubmit={handleTeacherSubmit}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">{teacherForm.id ? 'Edit Guru' : 'Tambah Guru'}</h2>
              {teacherForm.id ? <Badge variant="yellow">Mode edit</Badge> : null}
            </div>
            <label className="mt-5 block space-y-2 text-sm font-medium text-slate-700">
              <span>Pilih Guru dari Data Guru</span>
              <select
                value={teacherForm.id}
                onChange={(event) => handleTeacherSelect(event.target.value)}
                className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
              >
                <option value="">Tambah guru baru / pilih guru yang akan diberi mapel</option>
                {databaseTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.nip}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <input
                value={teacherForm.name}
                onChange={(event) => setTeacherForm((current) => ({ ...current, name: event.target.value }))}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Nama guru"
              />
              <input
                value={teacherForm.nip}
                onChange={(event) => setTeacherForm((current) => ({ ...current, nip: event.target.value }))}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="NIP"
              />
              <input
                type="email"
                value={teacherForm.email}
                onChange={(event) => setTeacherForm((current) => ({ ...current, email: event.target.value }))}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Email"
              />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {databaseSubjects.map((subject) => (
                <label
                  key={subject.id}
                  className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={teacherForm.subjectIds.includes(subject.id)}
                    onChange={() => toggleTeacherSubject(subject.id)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span>{subject.name}</span>
                </label>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isTeacherSubmitting}
                className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {isTeacherSubmitting ? 'Menyimpan...' : 'Simpan Guru'}
              </button>
              <button
                type="button"
                onClick={() => setTeacherForm(emptyTeacherForm)}
                className="rounded-2xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Reset Form
              </button>
            </div>
          </form>
          <FilterBar>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Cari Guru</span>
              <input
                value={teacherSearch}
                onChange={(event) => setTeacherSearch(event.target.value)}
                className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Cari nama, NIP, email, atau mapel"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-slate-600">
              <span>
                <span className="font-semibold text-slate-900">{filteredTeachers.length}</span> dari{' '}
                {databaseTeachers.length} guru
              </span>
              <button
                type="button"
                disabled={!teacherSearch.trim()}
                onClick={() => setTeacherSearch('')}
                className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Reset
              </button>
            </div>
          </FilterBar>
          <DataTable
            data={filteredTeachers}
            columns={teacherColumns}
            getRowKey={(item) => item.id}
            emptyTitle="Guru tidak ditemukan"
            emptyDescription="Tidak ada guru yang cocok dengan pencarian saat ini."
          />
        </section>
      ) : null}

      {activeTab === 'classes' ? (
        <section className="space-y-6">
          <form className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft" onSubmit={handleClassSubmit}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">{classForm.id ? 'Edit Kelas' : 'Tambah Kelas'}</h2>
              {classForm.id ? <Badge variant="yellow">Mode edit</Badge> : null}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <input
                value={classForm.name}
                onChange={(event) => setClassForm((current) => ({ ...current, name: event.target.value }))}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Nama kelas"
              />
              <input
                value={classForm.major}
                onChange={(event) => setClassForm((current) => ({ ...current, major: event.target.value }))}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Jurusan"
              />
              <select
                value={classForm.homeroomTeacherId}
                onChange={(event) => setClassForm((current) => ({ ...current, homeroomTeacherId: event.target.value }))}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
              >
                <option value="">Pilih wali kelas</option>
                {databaseTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isClassSubmitting}
                className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {isClassSubmitting ? 'Menyimpan...' : 'Simpan Kelas'}
              </button>
              <button
                type="button"
                onClick={() => setClassForm(emptyClassForm)}
                className="rounded-2xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Reset Form
              </button>
            </div>
          </form>
          <FilterBar>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Cari Kelas</span>
              <input
                value={classSearch}
                onChange={(event) => setClassSearch(event.target.value)}
                className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Cari kelas, jurusan, wali kelas, atau jumlah siswa"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-slate-600">
              <span>
                <span className="font-semibold text-slate-900">{filteredClasses.length}</span> dari{' '}
                {databaseClasses.length} kelas
              </span>
              <button
                type="button"
                disabled={!classSearch.trim()}
                onClick={() => setClassSearch('')}
                className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Reset
              </button>
            </div>
          </FilterBar>
          <DataTable
            data={filteredClasses}
            columns={classColumns}
            getRowKey={(item) => item.id}
            emptyTitle="Kelas tidak ditemukan"
            emptyDescription="Tidak ada kelas yang cocok dengan pencarian saat ini."
          />
        </section>
      ) : null}

      {activeTab === 'subjects' ? (
        <section className="space-y-6">
          <form className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft" onSubmit={handleSubjectSubmit}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">{subjectForm.id ? 'Edit Mapel' : 'Tambah Mapel'}</h2>
              {subjectForm.id ? <Badge variant="yellow">Mode edit</Badge> : null}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                value={subjectForm.name}
                onChange={(event) => setSubjectForm((current) => ({ ...current, name: event.target.value }))}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Nama mata pelajaran"
              />
              <input
                value={subjectForm.shortName}
                onChange={(event) => setSubjectForm((current) => ({ ...current, shortName: event.target.value }))}
                className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Singkatan"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubjectSubmitting}
                className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {isSubjectSubmitting ? 'Menyimpan...' : 'Simpan Mapel'}
              </button>
              <button
                type="button"
                onClick={() => setSubjectForm(emptySubjectForm)}
                className="rounded-2xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Reset Form
              </button>
            </div>
          </form>
          <FilterBar>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Cari Mapel</span>
              <input
                value={subjectSearch}
                onChange={(event) => setSubjectSearch(event.target.value)}
                className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Cari nama mapel, singkatan, atau jumlah jadwal"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-slate-600">
              <span>
                <span className="font-semibold text-slate-900">{filteredSubjects.length}</span> dari{' '}
                {databaseSubjects.length} mapel
              </span>
              <button
                type="button"
                disabled={!subjectSearch.trim()}
                onClick={() => setSubjectSearch('')}
                className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Reset
              </button>
            </div>
          </FilterBar>
          <DataTable
            data={filteredSubjects}
            columns={subjectColumns}
            getRowKey={(item) => item.id}
            emptyTitle="Mapel tidak ditemukan"
            emptyDescription="Tidak ada mata pelajaran yang cocok dengan pencarian saat ini."
          />
        </section>
      ) : null}

      {activeTab === 'schedules' ? (
        <section className="space-y-6">
          <form className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft" onSubmit={handleScheduleSubmit}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                {scheduleForm.id ? 'Edit Jadwal' : 'Tambah Jadwal'}
              </h2>
              {scheduleForm.id ? <Badge variant="yellow">Mode edit</Badge> : null}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Hari Pelajaran</span>
                <select
                  value={scheduleForm.day}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, day: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                >
                  {dayOptions.map((day) => (
                    <option key={day} value={day}>
                      {formatDayName(day)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Kelas</span>
                <select
                  value={scheduleForm.classId}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, classId: event.target.value }))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                >
                  <option value="">Pilih kelas</option>
                  {databaseClasses.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Mata Pelajaran</span>
                <select
                  value={scheduleForm.subjectId}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, subjectId: event.target.value }))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                >
                  <option value="">Pilih mapel</option>
                  {databaseSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Guru Pengajar</span>
                <select
                  value={scheduleForm.teacherId}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, teacherId: event.target.value }))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                >
                  <option value="">Pilih guru</option>
                  {databaseTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Jam Mulai Pelajaran</span>
                <input
                  type="time"
                  value={scheduleForm.startTime}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, startTime: event.target.value }))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Jam Selesai Pelajaran</span>
                <input
                  type="time"
                  value={scheduleForm.endTime}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, endTime: event.target.value }))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-3">
                <span>Ruang Belajar</span>
                <input
                  value={scheduleForm.room}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, room: event.target.value }))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                  placeholder="Contoh: Lab RPL 1"
                />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isScheduleSubmitting}
                className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {isScheduleSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
              </button>
              <button
                type="button"
                onClick={() => setScheduleForm(emptyScheduleForm)}
                className="rounded-2xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Reset Form
              </button>
            </div>
          </form>
          <FilterBar>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Filter Kelas</span>
              <select
                value={scheduleClassFilter}
                onChange={(event) => setScheduleClassFilter(event.target.value)}
                className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
              >
                <option value="all">Semua kelas</option>
                {databaseClasses.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-slate-600">
              <span>
                <span className="font-semibold text-slate-900">{filteredSchedules.length}</span> dari{' '}
                {databaseSchedules.length} jadwal
              </span>
              <button
                type="button"
                disabled={scheduleClassFilter === 'all'}
                onClick={() => setScheduleClassFilter('all')}
                className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Reset
              </button>
            </div>
          </FilterBar>
          <DataTable
            data={filteredSchedules}
            columns={scheduleColumns}
            getRowKey={(item) => item.id}
            emptyTitle="Jadwal tidak ditemukan"
            emptyDescription="Tidak ada jadwal yang cocok dengan filter kelas saat ini."
          />
        </section>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteConfirmation)}
        title={deleteConfirmationTitle}
        description={deleteConfirmationDescription}
        tone="danger"
        confirmLabel={isDeleteConfirmationLoading ? 'Menghapus...' : 'Hapus'}
        isLoading={isDeleteConfirmationLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmation(null)}
      />
    </div>
  );
}
