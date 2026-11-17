# Little Haven — Web app starter

Project ini sudah dikonfigurasi dengan URL dan publishable key Supabase milik project Little Haven.

## Langkah mengaktifkan database

1. Buka https://supabase.com/dashboard/project/fxwgsqholjszrmnydyfh/sql/new
2. Buka file `supabase/schema.sql` dari folder project ini.
3. Salin seluruh isinya ke SQL Editor Supabase, lalu klik **Run**.
4. Di Supabase, buka **Authentication → Users → Add user** untuk membuat akun staf. Gunakan email dan password yang ditentukan sendiri.
5. Setelah user dibuat, salin UUID user tersebut. Di **SQL Editor**, jalankan perintah berikut dengan UUID dan detail staf yang benar:

```sql
insert into public.profiles (id, full_name, username, role)
values ('UUID-DARI-AUTH', 'Evelyn Olivia Heista', 'LH-EVELYN #03', 'Doctor');
```

Untuk staf lain, buat user Auth masing-masing lalu masukkan satu baris profil dengan role `Doctor` atau `Receptionist`. Jangan membuat akun bersama. Clinic Manager adalah role terpisah.

## Jalankan web di komputer

1. Install Node.js versi 20 atau lebih baru.
2. Ekstrak ZIP ini.
3. Buka terminal di folder project, lalu jalankan `npm install`.
4. Jalankan `npm run dev`.
5. Buka alamat lokal yang ditampilkan Vite.

## Status dan batasan penting

- `.env.local` sudah diisi dengan Supabase Project URL dan publishable key yang diberikan pemilik project. Publishable key memang untuk aplikasi klien; jangan pernah menaruh `service_role` atau secret key di frontend.
- Database belum aktif sampai `supabase/schema.sql` dijalankan di SQL Editor.
- Login menggunakan Supabase Auth email/password. Username `LH-EVELYN #03` saat ini hanya label profil; login username belum diimplementasikan.
- Ini masih starter bertahap. Modul billing, manajemen akun, laporan, pembatasan UI per role, audit trigger, dan kebijakan RLS perlu dilengkapi serta diuji sebelum penggunaan klinis.
- Gunakan data dummy selama pengujian. Jangan masukkan data pemilik/pasien sungguhan sebelum keamanan, backup, dan hak akses ditinjau.
