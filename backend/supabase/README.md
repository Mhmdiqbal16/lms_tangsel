# Setup Supabase

Gunakan file di folder ini untuk membuat database awal aplikasi.

## 1. Buat tabel dan bucket

1. Buka Supabase Dashboard.
2. Masuk ke menu SQL Editor.
3. Buat query baru.
4. Paste isi `schema.sql`.
5. Jalankan query.

File `schema.sql` akan membuat tabel utama aplikasi, enum status, index, mengaktifkan RLS, dan membuat bucket private bernama `journal-attachments`.

## 2. Masukkan data awal

1. Tetap di SQL Editor.
2. Buat query baru.
3. Paste isi `seed.sql`.
4. Jalankan query.

Akun demo dari seed:

- Siswa: `0067458123` / `alya2026`
- Guru: `198906122018011001` / `budi2026`
- Kurikulum: `197905182010012003` / `rina2026`
- Admin: `197912102009011001` / `admin2026`

## 2b. Opsional: hapus akun demo

Kalau ingin akun demo tidak dipakai dan semua akun dibuat dari menu Admin, jalankan `clear-demo-accounts.sql` setelah `seed.sql`.

File itu akan menghapus akun demo dari `app_users`, lalu membuat akun admin sementara:

- Admin setup: `000000000000000000` / `admin12345`

Login dengan akun admin setup tersebut, lalu buat akun role siswa/guru/kurikulum/admin dari aplikasi.

## 3. Isi environment backend

Buat file `backend/.env.local`, lalu isi:

```env
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SESSION_COOKIE_NAME="web_smkn2_session"
CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
```

Ambil `SUPABASE_URL` dan `service_role` key dari Supabase Dashboard > Project Settings > API.

## 4. Jalankan backend

```bash
npm install
npm run dev
```

Jalankan perintah tersebut dari folder `backend`.

Catatan: tabel memakai RLS, tetapi backend memakai service role key sehingga API backend tetap bisa membaca dan menulis data. Jangan taruh service role key di frontend.
