# CORELASI QA Folder

Folder ini disiapkan untuk role QA. Isi folder ini adalah skenario dan template baru, bukan hasil testing lama.

Owner:

```text
Nashbilla Nurfazza
```

## Isi Folder

| File | Fungsi |
| --- | --- |
| `manual-test-cases.md` | Skenario manual testing baru. |
| `test-execution-template.md` | Template pencatatan hasil eksekusi. |
| `bug-report-template.md` | Template laporan bug. |
| `traceability-matrix.md` | Mapping requirement ke test case. |

## Cara Pakai

1. Ambil test case dari `manual-test-cases.md`.
2. Jalankan test pada environment yang disepakati.
3. Catat hasil di `test-execution-template.md`.
4. Jika ada bug, buat Jira issue memakai format di `bug-report-template.md`.
5. Setelah developer memperbaiki bug, lakukan retest.
6. Update status requirement di `traceability-matrix.md`.

## Aturan QA

1. QA tidak mengubah source code aplikasi.
2. QA boleh mengubah file di `docs/qa/`.
3. QA mencatat bukti manual berupa screenshot/video/log bila diperlukan.
4. QA menulis status dengan jelas: Pass, Failed, Blocked, atau Not Run.
5. QA membuat bug ticket untuk defect yang bisa direproduksi.
