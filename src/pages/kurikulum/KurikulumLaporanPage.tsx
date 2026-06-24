import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { useAppData } from '@/hooks/useAppData';
import { BookOpenText, ClipboardCheck, NotebookPen } from 'lucide-react';

interface TeacherReportRow {
  id: string;
  teacherName: string;
  totalSesi: number;
  totalPresensi: number;
  hadir: number;
  belumPresensi: number;
}

interface ActivityReportRow {
  id: string;
  subject: string;
  materi: number;
  jurnal: number;
}

interface JournalReportRow {
  id: string;
  className: string;
  totalJurnal: number;
  tervalidasi: number;
}

export function KurikulumLaporanPage() {
  const { teachers, teacherAttendances, subjects, schedules, learningMaterials, studentJournals, classes } = useAppData();
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'warning'; text: string } | null>(null);
  const [activeReport, setActiveReport] = useState<'teachers' | 'activities' | 'journals'>('teachers');
  const [reportSearch, setReportSearch] = useState('');

  const teachingSessions = new Map<string, { scheduleId: string; date: string; teacherId: string }>();

  teacherAttendances.forEach((attendance) => {
    teachingSessions.set(`${attendance.scheduleId}-${attendance.date}`, {
      scheduleId: attendance.scheduleId,
      date: attendance.date,
      teacherId: attendance.teacherId,
    });
  });

  learningMaterials.forEach((material) => {
    const schedule = schedules.find((item) => item.id === material.scheduleId);
    teachingSessions.set(`${material.scheduleId}-${material.date}`, {
      scheduleId: material.scheduleId,
      date: material.date,
      teacherId: material.teacherId || schedule?.teacherId || '',
    });
  });

  const teachingSessionList = Array.from(teachingSessions.values());

  const teacherReportRows: TeacherReportRow[] = teachers.map((teacher) => {
    const totalSesi = teachingSessionList.filter((item) => item.teacherId === teacher.id).length;
    const totalPresensi = teacherAttendances.filter((item) => item.teacherId === teacher.id).length;
    const hadir = teacherAttendances.filter((item) => item.teacherId === teacher.id && item.status === 'Hadir').length;

    return {
      id: teacher.id,
      teacherName: teacher.name,
      totalSesi,
      totalPresensi,
      hadir,
      belumPresensi: Math.max(0, totalSesi - totalPresensi),
    };
  });

  const activityReportRows: ActivityReportRow[] = subjects.map((subject) => ({
    id: subject.id,
    subject: subject.name,
    materi: learningMaterials.filter((item) => {
      const schedule = schedules.find((scheduleItem) => scheduleItem.id === item.scheduleId);
      return schedule?.subjectId === subject.id;
    }).length,
    jurnal: studentJournals.filter((item) => {
      const schedule = schedules.find((scheduleItem) => scheduleItem.id === item.scheduleId);
      return schedule?.subjectId === subject.id;
    }).length,
  }));

  const journalReportRows: JournalReportRow[] = classes.map((classItem) => ({
    id: classItem.id,
    className: classItem.name,
    totalJurnal: studentJournals.filter((item) => {
      const schedule = schedules.find((scheduleItem) => scheduleItem.id === item.scheduleId);
      return schedule?.classId === classItem.id;
    }).length,
    tervalidasi: studentJournals.filter((item) => {
      const schedule = schedules.find((scheduleItem) => scheduleItem.id === item.scheduleId);
      return schedule?.classId === classItem.id && item.validationStatus === 'Valid';
    }).length,
  }));

  const teacherColumns: TableColumn<TeacherReportRow>[] = [
    { key: 'teacherName', header: 'Guru', render: (item) => item.teacherName },
    { key: 'totalSesi', header: 'Sesi Terpantau', render: (item) => item.totalSesi },
    { key: 'totalPresensi', header: 'Total Presensi', render: (item) => item.totalPresensi },
    { key: 'hadir', header: 'Status Hadir', render: (item) => item.hadir },
    { key: 'belumPresensi', header: 'Belum Presensi', render: (item) => item.belumPresensi },
  ];

  const activityColumns: TableColumn<ActivityReportRow>[] = [
    { key: 'subject', header: 'Mapel', render: (item) => item.subject },
    { key: 'materi', header: 'Aktivitas Materi', render: (item) => item.materi },
    { key: 'jurnal', header: 'Jurnal Siswa', render: (item) => item.jurnal },
  ];

  const journalColumns: TableColumn<JournalReportRow>[] = [
    { key: 'className', header: 'Kelas', render: (item) => item.className },
    { key: 'totalJurnal', header: 'Total Jurnal', render: (item) => item.totalJurnal },
    { key: 'tervalidasi', header: 'Tervalidasi', render: (item) => item.tervalidasi },
  ];

  const normalizedReportSearch = reportSearch.trim().toLowerCase();
  const matchesReportSearch = (values: Array<string | number>) =>
    !normalizedReportSearch || values.some((value) => String(value).toLowerCase().includes(normalizedReportSearch));
  const filteredTeacherReportRows = teacherReportRows.filter((row) =>
    matchesReportSearch([row.teacherName, row.totalSesi, row.totalPresensi, row.hadir, row.belumPresensi]),
  );
  const filteredActivityReportRows = activityReportRows.filter((row) =>
    matchesReportSearch([row.subject, row.materi, row.jurnal]),
  );
  const filteredJournalReportRows = journalReportRows.filter((row) =>
    matchesReportSearch([row.className, row.totalJurnal, row.tervalidasi]),
  );

  const reportTabs = [
    { id: 'teachers' as const, label: 'Kehadiran Guru', count: filteredTeacherReportRows.length },
    { id: 'activities' as const, label: 'Aktivitas Pembelajaran', count: filteredActivityReportRows.length },
    { id: 'journals' as const, label: 'Jurnal Siswa', count: filteredJournalReportRows.length },
  ];

  const buildCsv = () => {
    const escapeCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const section = (title: string, headers: string[], rows: Array<Array<string | number>>) => [
      title,
      headers.map(escapeCell).join(','),
      ...rows.map((row) => row.map(escapeCell).join(',')),
      '',
    ];

    return [
      ...section(
        'Laporan Kehadiran Guru',
        ['Guru', 'Sesi Terpantau', 'Total Presensi', 'Status Hadir', 'Belum Presensi'],
        teacherReportRows.map((row) => [row.teacherName, row.totalSesi, row.totalPresensi, row.hadir, row.belumPresensi]),
      ),
      ...section(
        'Aktivitas Pembelajaran',
        ['Mapel', 'Aktivitas Materi', 'Jurnal Siswa'],
        activityReportRows.map((row) => [row.subject, row.materi, row.jurnal]),
      ),
      ...section(
        'Laporan Jurnal Siswa',
        ['Kelas', 'Total Jurnal', 'Tervalidasi'],
        journalReportRows.map((row) => [row.className, row.totalJurnal, row.tervalidasi]),
      ),
    ].join('\n');
  };

  const handleExportExcel = () => {
    const blob = new Blob([buildCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-monitoring-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage({ tone: 'success', text: 'Laporan CSV berhasil diunduh dan dapat dibuka melalui Excel.' });
  };

  const tableHtml = (title: string, headers: string[], rows: Array<Array<string | number>>) => `
    <h2>${title}</h2>
    <table>
      <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
      <tbody>${rows
        .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
        .join('')}</tbody>
    </table>
  `;

  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank', 'width=1024,height=768');

    if (!printWindow) {
      setMessage({ tone: 'warning', text: 'Popup laporan diblokir browser. Izinkan popup untuk mencetak PDF.' });
      return;
    }

    const generatedAt = new Date().toLocaleString('id-ID');
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Laporan Monitoring Pembelajaran</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            h2 { margin-top: 28px; font-size: 18px; }
            p { margin: 0 0 16px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #eff6ff; }
          </style>
        </head>
        <body>
          <h1>Laporan Monitoring Pembelajaran</h1>
          <p>Dicetak pada ${generatedAt}</p>
          ${tableHtml(
            'Laporan Kehadiran Guru',
            ['Guru', 'Sesi Terpantau', 'Total Presensi', 'Status Hadir', 'Belum Presensi'],
            teacherReportRows.map((row) => [row.teacherName, row.totalSesi, row.totalPresensi, row.hadir, row.belumPresensi]),
          )}
          ${tableHtml(
            'Aktivitas Pembelajaran',
            ['Mapel', 'Aktivitas Materi', 'Jurnal Siswa'],
            activityReportRows.map((row) => [row.subject, row.materi, row.jurnal]),
          )}
          ${tableHtml(
            'Laporan Jurnal Siswa',
            ['Kelas', 'Total Jurnal', 'Tervalidasi'],
            journalReportRows.map((row) => [row.className, row.totalJurnal, row.tervalidasi]),
          )}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setMessage({ tone: 'success', text: 'Tampilan cetak laporan dibuka. Pilih Save as PDF dari dialog print.' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Ringkasan laporan kehadiran guru, aktivitas pembelajaran, dan jurnal siswa dalam satu halaman."
        actions={
          <>
            <button
              type="button"
              onClick={handleExportPdf}
              className="rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
            >
              Export Excel
            </button>
          </>
        }
      />

      {message ? <InfoAlert tone={message.tone} message={message.text} /> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <StatCard
          title="Laporan Kehadiran Guru"
          value={teachingSessionList.length}
          description="Total sesi mengajar terpantau dari presensi guru atau input materi."
          icon={ClipboardCheck}
        />
        <StatCard
          title="Aktivitas Pembelajaran"
          value={learningMaterials.length}
          description="Jumlah materi pembelajaran yang sudah dicatat guru."
          icon={BookOpenText}
        />
        <StatCard
          title="Laporan Jurnal Siswa"
          value={studentJournals.length}
          description="Total jurnal siswa yang tercatat dalam monitoring pembelajaran."
          icon={NotebookPen}
        />
      </div>

      <FilterBar>
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-3">
          <span>Cari Laporan</span>
          <input
            value={reportSearch}
            onChange={(event) => setReportSearch(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
            placeholder="Cari nama guru, mapel, kelas, atau jumlah data"
          />
        </label>
      </FilterBar>

      <section className="rounded-3xl border border-brand-100 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                activeReport === tab.id ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-600 hover:bg-brand-50'
              }`}
            >
              <span>{tab.label}</span>
              <Badge variant={activeReport === tab.id ? 'slate' : 'blue'}>{tab.count}</Badge>
            </button>
          ))}
        </div>

        <div className="mt-4">
          {activeReport === 'teachers' ? (
            <DataTable data={filteredTeacherReportRows} columns={teacherColumns} getRowKey={(item) => item.id} />
          ) : null}
          {activeReport === 'activities' ? (
            <DataTable data={filteredActivityReportRows} columns={activityColumns} getRowKey={(item) => item.id} />
          ) : null}
          {activeReport === 'journals' ? (
            <DataTable data={filteredJournalReportRows} columns={journalColumns} getRowKey={(item) => item.id} />
          ) : null}
        </div>
      </section>
    </div>
  );
}
