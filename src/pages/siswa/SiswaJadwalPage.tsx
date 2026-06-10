import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { formatDayName } from '@/utils/date';

interface ScheduleRow {
  id: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  className: string;
}

export function SiswaJadwalPage() {
  const { session } = useAuth();
  const { students, schedules, classes, subjects, teachers } = useAppData();
  const student = students.find((item) => item.id === session?.referenceId);

  const rows: ScheduleRow[] =
    schedules
      .filter((item) => item.classId === student?.classId)
      .sort((first, second) => first.day - second.day || first.startTime.localeCompare(second.startTime))
      .map((item) => ({
        id: item.id,
        day: formatDayName(item.day),
        time: `${item.startTime} - ${item.endTime}`,
        subject: subjects.find((subject) => subject.id === item.subjectId)?.name ?? '-',
        teacher: teachers.find((teacher) => teacher.id === item.teacherId)?.name ?? '-',
        className: classes.find((classItem) => classItem.id === item.classId)?.name ?? '-',
      })) ?? [];

  const columns: TableColumn<ScheduleRow>[] = [
    { key: 'day', header: 'Hari', render: (item) => item.day },
    { key: 'time', header: 'Jam', render: (item) => item.time },
    { key: 'subject', header: 'Mata Pelajaran', render: (item) => item.subject },
    { key: 'teacher', header: 'Guru', render: (item) => item.teacher },
    { key: 'className', header: 'Kelas', render: (item) => item.className },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Pelajaran"
        description="Daftar lengkap jadwal pelajaran siswa berdasarkan kelas aktif saat ini."
      />

      <DataTable
        data={rows}
        columns={columns}
        getRowKey={(item) => item.id}
        emptyTitle="Jadwal belum tersedia"
        emptyDescription="Belum ada jadwal yang terhubung ke profil siswa."
      />
    </div>
  );
}

