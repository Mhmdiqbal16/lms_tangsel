# WEB SMKN2 Next.js Backend

Backend ini menggantikan scaffold Laravel sebelumnya dengan Next.js App Router API.

## Cara Menjalankan

```powershell
cd backend
npm install
npm run dev
```

Server API berjalan di:

```text
http://localhost:3001
```

## Endpoint Awal

- `GET /api/health`
- `POST /api/auth/login` dengan payload `{ "identifier": "0067458123", "password": "alya2026" }`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/student/schedules`
- `GET /api/student/attendances`
- `GET /api/teacher/attendances/today`
- `POST /api/teacher/teacher-attendances`
- `GET /api/teacher/schedules/[scheduleId]/student-attendances`
- `POST /api/teacher/student-attendances`
- `GET /api/curriculum/reports/teacher-attendances`
- `GET /api/curriculum/reports/student-attendances`

## Catatan

Saat ini data masih in-memory supaya API bisa dirapikan dulu tanpa menunggu database. Langkah berikutnya adalah mengganti `src/lib/data.ts` ke PostgreSQL/Supabase atau Prisma.
