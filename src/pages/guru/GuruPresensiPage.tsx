import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { academicDateReference } from '@/data/mockData';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { StudentAttendanceStatus } from '@/types';
import { formatDateID, parseISODate } from '@/utils/date';

interface AttendanceRow {
  id: string;
  date: string;
  time: string;
  className: string;
  subject: string;
  status: string;
  notes: string;
}

const studentStatusOptions: StudentAttendanceStatus[] = ['Hadir', 'Izin', 'Alfa'];

export function GuruPresensiPage() {
  const { session, hasPermission } = useAuth();
  const {
    teachers,
    students,
    schedules,
    classes,
    subjects,
    teacherAttendances,
    studentAttendances,
    addTeacherAttendance,
    saveStudentAttendances,
  } = useAppData();
  const teacher = teachers.find((item) => item.id === session?.referenceId);
  const today = parseISODate(academicDateReference);
  const [scheduleId, setScheduleId] = useState('');
  const [status, setStatus] = useState<'Hadir' | 'Izin'>('Hadir');
  const [notes, setNotes] = useState('');
  const [studentStatuses, setStudentStatuses] = useState<Record<string, StudentAttendanceStatus>>({});
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'warning'; text: string } | null>(null);
  const [isSavingTeacherAttendance, setIsSavingTeacherAttendance] = useState(false);
  const [isSavingStudentAttendances, setIsSavingStudentAttendances] = useState(false);

  if (!teacher) {
    return null;
  }

  const todaySchedules = schedules.filter((item) => item.teacherId === teacher.id && item.day === today.getDay());
  const activeScheduleId = scheduleId || todaySchedules[0]?.id || '';
  const activeSchedule = schedules.find((item) => item.id === activeScheduleId);
  const activeClass = classes.find((item) => item.id === activeSchedule?.classId);
  const activeSubject = subjects.find((item) => item.id === activeSchedule?.subjectId);
  const classStudents = activeSchedule
    ? students
        .filter((item) => item.classId === activeSchedule.classId)
        .slice()
        .sort((first, second) => first.name.localeCompare(second.name))
    : [];

  useEffect(() => {
    if (!activeSchedule) {
      setStudentStatuses({});
      return;
    }

    const nextStatuses = students
      .filter((item) => item.classId === activeSchedule.classId)
      .reduce<Record<string, StudentAttendanceStatus>>((result, student) => {
      const existingAttendance = studentAttendances.find(
        (item) =>
          item.studentId === student.id && item.scheduleId === activeSchedule.id && item.date === academicDateReference,
      );
      result[student.id] = existingAttendance?.status ?? 'Hadir';
      return result;
      }, {});

    setStudentStatuses(nextStatuses);
  }, [activeSchedule?.classId, activeSchedule?.id, studentAttendances, students]);

  const todayAttendances = teacherAttendances
    .filter((item) => item.teacherId === teacher.id && item.date === academicDateReference)
    .map((item) => {
      const schedule = schedules.find((scheduleItem) => scheduleItem.id === item.scheduleId);
      return {
        id: item.id,
        date: item.date,
        time: schedule ? `${schedule.startTime} - ${schedule.endTime}` : '-',
        className: classes.find((classItem) => classItem.id === schedule?.classId)?.name ?? '-',
        subject: subjects.find((subjectItem) => subjectItem.id === schedule?.subjectId)?.name ?? '-',
        status: item.status,
        notes: item.notes,
      };
    });

  const activeTeacherAttendance = teacherAttendances.find(
    (item) => item.teacherId === teacher.id && item.scheduleId === activeScheduleId && item.date === academicDateReference,
  );
  const canManageStudentAttendances =
    hasPermission('student.attendance.manage_taught_classes') && activeTeacherAttendance?.status === 'Hadir';
  const hadirCount = classStudents.filter((student) => (studentStatuses[student.id] ?? 'Hadir') === 'Hadir').length;
  const izinCount = classStudents.filter((student) => studentStatuses[student.id] === 'Izin').length;
  const alfaCount = classStudents.filter((student) => studentStatuses[student.id] === 'Alfa').length;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeScheduleId) {
      setMessage({ tone: 'warning', text: 'Pilih jadwal mengajar yang akan dipresensi.' });
      return;
    }

    setIsSavingTeacherAttendance(true);
    const result = await addTeacherAttendance({
      teacherId: teacher.id,
      scheduleId: activeScheduleId,
      date: academicDateReference,
      status,
      notes,
    }).finally(() => setIsSavingTeacherAttendance(false));

    setMessage({ tone: result.success ? 'success' : 'warning', text: result.message });
    if (result.success) {
      setNotes('');
    }
  };

  const handleStudentAttendanceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeSchedule) {
      setMessage({ tone: 'warning', text: 'Pilih jadwal mengajar untuk mengisi absensi siswa.' });
      return;
    }

    setIsSavingStudentAttendances(true);
    const result = await saveStudentAttendances({
      teacherId: teacher.id,
      scheduleId: activeSchedule.id,
      date: academicDateReference,
      attendances: classStudents.map((student) => ({
        studentId: student.id,
        status: studentStatuses[student.id] ?? 'Hadir',
      })),
    }).finally(() => setIsSavingStudentAttendances(false));

    setMessage({ tone: result.success ? 'success' : 'warning', text: result.message });
  };

  const setAllStudentStatuses = (nextStatus: StudentAttendanceStatus) => {
    setStudentStatuses(
      classStudents.reduce<Record<string, StudentAttendanceStatus>>((result, student) => {
        result[student.id] = nextStatus;
        return result;
      }, {}),
    );
  };

  const columns: TableColumn<AttendanceRow>[] = [
    { key: 'date', header: 'Tanggal', render: (item) => formatDateID(item.date) },
    { key: 'time', header: 'Jam', render: (item) => item.time },
    { key: 'className', header: 'Kelas', render: (item) => item.className },
    { key: 'subject', header: 'Mapel', render: (item) => item.subject },
    {
      key: 'status',
      header: 'Status Hadir',
      render: (item) => <Badge variant={item.status === 'Hadir' ? 'green' : 'yellow'}>{item.status}</Badge>,
    },
    { key: 'notes', header: 'Catatan', render: (item) => item.notes },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presensi Mengajar"
        description="Guru mengisi presensi diri lebih dulu, lalu melengkapi absensi siswa pada jadwal yang sama."
      />

      {message ? <InfoAlert tone={message.tone} message={message.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-slate-900">Jadwal Mengajar Hari Ini</h2>
          <div className="mt-6 max-h-[360px] space-y-4 overflow-y-auto pr-2">
            {todaySchedules.map((schedule) => {
              const attendance = teacherAttendances.find(
                (item) =>
                  item.teacherId === teacher.id &&
                  item.scheduleId === schedule.id &&
                  item.date === academicDateReference,
              );

              return (
                <button
                  key={schedule.id}
                  type="button"
                  onClick={() => setScheduleId(schedule.id)}
                  className={`w-full rounded-3xl border p-5 text-left transition ${
                    activeScheduleId === schedule.id
                      ? 'border-brand-600 bg-brand-50 shadow-soft'
                      : 'border-brand-100 bg-white hover:border-brand-300 hover:bg-brand-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {subjects.find((item) => item.id === schedule.subjectId)?.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {classes.find((item) => item.id === schedule.classId)?.name} - {schedule.room}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="blue">
                        {schedule.startTime} - {schedule.endTime}
                      </Badge>
                      <Badge variant={attendance ? 'green' : 'slate'}>
                        {attendance ? 'Sudah presensi' : 'Belum presensi'}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-slate-900">Form Presensi Guru</h2>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Jadwal</span>
              <select
                value={activeScheduleId}
                onChange={(event) => setScheduleId(event.target.value)}
                className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
              >
                {todaySchedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {classes.find((item) => item.id === schedule.classId)?.name} -{' '}
                    {subjects.find((item) => item.id === schedule.subjectId)?.name} ({schedule.startTime} -{' '}
                    {schedule.endTime})
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Tanggal</span>
                <input
                  readOnly
                  value={formatDateID(academicDateReference)}
                  className="w-full rounded-2xl border border-brand-100 bg-slate-50 px-4 py-3 outline-none"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Status Hadir</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as 'Hadir' | 'Izin')}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Izin">Izin</option>
                </select>
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Catatan</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Contoh: Pembelajaran berjalan lancar dengan diskusi kelompok."
              />
            </label>

            <button
              type="submit"
              disabled={isSavingTeacherAttendance}
              className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSavingTeacherAttendance ? 'Menyimpan...' : 'Simpan Presensi Guru'}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Absensi Siswa per Kelas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tandai status siswa untuk jadwal aktif. Default seluruh siswa akan dianggap hadir.
            </p>
          </div>
          {activeSchedule ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="blue">{activeClass?.name ?? '-'}</Badge>
              <Badge variant="blue">{activeSubject?.name ?? '-'}</Badge>
              <Badge variant="blue">
                {activeSchedule.startTime} - {activeSchedule.endTime}
              </Badge>
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          {!activeSchedule ? (
            <InfoAlert tone="warning" message="Belum ada jadwal yang dipilih untuk mengisi absensi siswa." />
          ) : !hasPermission('student.attendance.manage_taught_classes') ? (
            <InfoAlert tone="warning" message="Akun aktif belum memiliki hak akses untuk mengelola absensi siswa." />
          ) : !activeTeacherAttendance ? (
            <InfoAlert
              tone="warning"
              message="Isi presensi guru lebih dulu pada jadwal ini sebelum melanjutkan ke absensi siswa."
            />
          ) : activeTeacherAttendance.status !== 'Hadir' ? (
            <InfoAlert
              tone="warning"
              message="Absensi siswa hanya dapat diisi jika presensi guru pada jadwal ini berstatus hadir."
            />
          ) : null}
        </div>

        {activeSchedule ? (
          <form className="mt-6 space-y-6" onSubmit={handleStudentAttendanceSubmit}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                <p className="text-sm font-medium text-slate-500">Total Siswa</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{classStudents.length}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-medium text-emerald-700">Hadir</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{hadirCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-sm font-medium text-amber-700">Izin</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{izinCount}</p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                <p className="text-sm font-medium text-rose-700">Alfa</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{alfaCount}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Data yang sudah pernah disimpan akan otomatis dimuat kembali saat jadwal yang sama dipilih.
              </p>
              <button
                type="button"
                onClick={() => setAllStudentStatuses('Hadir')}
                className="rounded-2xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Tandai Semua Hadir
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-brand-100">
              <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full divide-y divide-brand-100">
                  <thead className="bg-brand-50/70">
                    <tr>
                      {['No', 'Nama Siswa', 'NISN', 'Status'].map((header) => (
                        <th
                          key={header}
                          className="sticky top-0 z-10 bg-brand-50 px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {classStudents.map((student, index) => (
                      <tr key={student.id} className="align-middle hover:bg-brand-50/30">
                        <td className="px-4 py-4 text-sm text-slate-500">{index + 1}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{student.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{student.email}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">{student.nisn}</td>
                        <td className="px-4 py-4">
                          <select
                            value={studentStatuses[student.id] ?? 'Hadir'}
                            onChange={(event) =>
                              setStudentStatuses((current) => ({
                                ...current,
                                [student.id]: event.target.value as StudentAttendanceStatus,
                              }))
                            }
                            disabled={!canManageStudentAttendances}
                            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            {studentStatusOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canManageStudentAttendances || classStudents.length === 0 || isSavingStudentAttendances}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSavingStudentAttendances ? 'Menyimpan...' : 'Simpan Absensi Siswa'}
            </button>
          </form>
        ) : null}
      </section>

      <DataTable
        data={todayAttendances}
        columns={columns}
        getRowKey={(item) => item.id}
        emptyTitle="Presensi hari ini belum ada"
        emptyDescription="Silakan isi form presensi mengajar sesuai jadwal."
      />
    </div>
  );
}
