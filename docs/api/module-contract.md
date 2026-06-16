# API Module Contract - Corelasi Backend

**Document Version:** 1.0  
**Sprint:** Sprint 02  
**Draft ID:** S02-BE-01  
**Last Updated:** 2026-06-15  
**Owner:** Haafizd Alhabib Azwir (Backend), Gilang Tirta Kesumah (Secondary)

---

## Table of Contents

1. [Overview](#overview)
2. [Response Envelope Convention](#response-envelope-convention)
3. [Authentication & Session Management](#authentication--session-management)
4. [API Modules](#api-modules)
   - [Accounts (Authentication)](#accounts-authentication)
   - [Academic](#academic)
   - [Schedules](#schedules)
   - [Attendance](#attendance)
   - [Learning](#learning)
   - [Journals](#journals)
   - [Reports](#reports)

---

## Overview

This document defines the API contract for the Corelasi backend system. It covers all major modules including authentication, academic management, schedules, attendance tracking, learning materials, journals, and reporting.

**Base URL:** `/api/`

**API Architecture:**
- RESTful design with resource-based routing
- Django REST Framework with ViewSets and APIViews
- JWT-based authentication with refresh token rotation
- Role-based access control (admin, guru, siswa, staf, wali)
- Standardized response envelope for consistency

---

## Response Envelope Convention

All API responses follow a standardized envelope format using `StandardResponse` wrapper.

### Success Response

```json
{
  "success": true,
  "message": "Operasi berhasil.",
  "data": {
    // Response payload here
  }
}
```

**HTTP Status Codes for Success:**
- `200 OK` - Standard success
- `201 Created` - Resource created successfully

### Error Response

```json
{
  "success": false,
  "message": "Deskripsi error dalam bahasa Indonesia.",
  "errors": {
    "field_name": ["Error message for field"],
    "another_field": ["Another error message"]
  }
}
```

**HTTP Status Codes for Errors:**
- `400 Bad Request` - Validation errors, invalid input
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Permission denied (e.g., showcase account restrictions)
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded

### Pagination (for list endpoints)

```json
{
  "success": true,
  "message": "Data berhasil diambil.",
  "data": {
    "count": 100,
    "next": "http://api.example.com/api/resource/?page=2",
    "previous": null,
    "results": [
      // Array of resources
    ]
  }
}
```

---

## Authentication & Session Management

### Authentication Mechanisms

**1. JWT (JSON Web Tokens)**
- **Access Token:** Short-lived token (15 minutes) sent in response body
- **Refresh Token:** Long-lived token (7 days) stored in HTTP-only secure cookie
- **Cookie Name:** `refreshToken`
- **Cookie Attributes:** `HttpOnly`, `Secure` (production), `SameSite=Lax`

**2. CSRF Protection**
- Applied to state-changing operations (POST, PUT, PATCH, DELETE)
- CSRF token obtained via `/api/auth/csrf/` endpoint
- Token sent in `X-CSRFToken` header

**3. Session Notes**
- Access tokens should be stored in memory (not localStorage) for security
- Refresh token rotation: new refresh token issued on each refresh operation
- Old refresh token invalidated after rotation
- Token refresh rate-limited to prevent abuse

### Authorization Roles

- **admin:** Full system access, user management
- **guru:** Teacher access, can manage classes, materials, assignments
- **siswa:** Student access, can view materials, submit assignments
- **staf:** Staff access, can manage schedules, attendance
- **wali:** Parent/guardian access, can view student progress

### Showcase Mode

- Special mode for demo/presentation purposes
- Controlled by `SHOWCASE_MODE` setting
- Showcase accounts have restricted write operations
- Identified via `is_showcase_account()` utility
- Returns `403 Forbidden` for restricted operations

---

## API Modules

---

## Accounts (Authentication)

**Base Path:** `/api/`

### 1. Get CSRF Token

**Endpoint:** `GET /api/auth/csrf/`  
**Authentication:** Not required  
**Description:** Obtain CSRF token for subsequent state-changing requests

**Request:**
```http
GET /api/auth/csrf/
```

**Response:**
```json
{
  "success": true,
  "message": "CSRF token berhasil diambil.",
  "data": {
    "csrfToken": "abc123def456..."
  }
}
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login/`  
**Authentication:** Not required  
**Rate Limit:** Throttled (login scope)  
**CSRF:** Required

**Request:**
```json
{
  "email": "user@example.com",
  "password": "userpassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nama": "John Doe",
      "role": "guru",
      "status": "aktif",
      "nomorInduk": "123456",
      "telepon": "08123456789"
    }
  }
}
```

**Response Headers:**
```
Set-Cookie: refreshToken=eyJ0eXAiOiJKV1QiLCJhbGc...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email atau kata sandi salah.",
  "errors": null
}
```

---

### 3. Showcase Login

**Endpoint:** `POST /api/auth/showcase-login/`  
**Authentication:** Not required  
**Rate Limit:** Throttled (login scope)  
**CSRF:** Required  
**Availability:** Only when `SHOWCASE_MODE=True`

**Request:**
```json
{
  "email": "showcase@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login showcase berhasil.",
  "data": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 10,
      "email": "showcase@example.com",
      "nama": "Demo User",
      "role": "guru",
      "status": "aktif"
    }
  }
}
```

**Response (Error - Showcase Mode Disabled):**
```json
{
  "success": false,
  "message": "Mode showcase tidak aktif."
}
```

---

### 4. Token Refresh

**Endpoint:** `POST /api/auth/refresh/`  
**Authentication:** Refresh token in cookie  
**Rate Limit:** Throttled (token_refresh scope)  
**CSRF:** Required

**Request:**
```http
POST /api/auth/refresh/
Cookie: refreshToken=eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Token berhasil diperbarui.",
  "data": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Response Headers:**
```
Set-Cookie: refreshToken=<new_token>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Token refresh tidak valid atau sudah kadaluarsa."
}
```

---

### 5. Get Profile

**Endpoint:** `GET /api/auth/me/`  
**Authentication:** Required  
**Description:** Get current authenticated user's profile information

**Request:**
```http
GET /api/auth/me/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response:**
```json
{
  "success": true,
  "message": "Profil berhasil diambil.",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nama": "John Doe",
    "role": "guru",
    "status": "aktif",
    "nomorInduk": "123456",
    "telepon": "08123456789"
  }
}
```

---

### 6. Change Password

**Endpoint:** `POST /api/auth/change-password/`  
**Authentication:** Required  
**CSRF:** Required  
**Restrictions:** Not allowed for showcase accounts

**Request:**
```json
{
  "oldPassword": "currentpassword",
  "newPassword": "newpassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Kata sandi berhasil diubah."
}
```

**Response (Error - Showcase Account):**
```json
{
  "success": false,
  "message": "Akun showcase tidak dapat mengubah kata sandi."
}
```

---

### 7. Logout

**Endpoint:** `POST /api/auth/logout/`  
**Authentication:** Required  
**CSRF:** Required  
**Description:** Invalidate refresh token and clear cookie

**Request:**
```http
POST /api/auth/logout/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response:**
```json
{
  "success": true,
  "message": "Logout berhasil."
}
```

**Response Headers:**
```
Set-Cookie: refreshToken=; Max-Age=0
```

---

### 8. User Management

**Base Path:** `/api/users/`  
**Authentication:** Required  
**Permissions:** 
- List/Retrieve: Authenticated users (scoped by role)
- Create/Update/Delete: Admin only

#### 8.1 List Users

**Endpoint:** `GET /api/users/`  
**Permissions:** Authenticated (scoped results based on role)

**Request:**
```http
GET /api/users/?page=1&search=john
```

**Query Parameters:**
- `page` (optional): Page number for pagination
- `search` (optional): Search by name, email, or nomorInduk

**Response:**
```json
{
  "success": true,
  "message": "Data pengguna berhasil diambil.",
  "data": {
    "count": 50,
    "next": "/api/users/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "email": "user@example.com",
        "nama": "John Doe",
        "role": "guru",
        "status": "aktif",
        "nomorInduk": "123456"
      }
    ]
  }
}
```

#### 8.2 Get User Detail

**Endpoint:** `GET /api/users/{id}/`  
**Permissions:** Authenticated (scoped)

**Response:**
```json
{
  "success": true,
  "message": "Detail pengguna berhasil diambil.",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nama": "John Doe",
    "role": "guru",
    "status": "aktif",
    "nomorInduk": "123456",
    "telepon": "08123456789",
    "alamat": "Jl. Example No. 123"
  }
}
```

#### 8.3 Create User

**Endpoint:** `POST /api/users/`  
**Permissions:** Admin only  
**CSRF:** Required

**Request:**
```json
{
  "email": "newuser@example.com",
  "nama": "Jane Smith",
  "password": "securepassword123",
  "role": "guru",
  "status": "aktif",
  "nomorInduk": "654321",
  "telepon": "08198765432"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pengguna berhasil dibuat.",
  "data": {
    "id": 2,
    "email": "newuser@example.com",
    "nama": "Jane Smith",
    "role": "guru",
    "status": "aktif"
  }
}
```

#### 8.4 Update User

**Endpoint:** `PUT /api/users/{id}/` or `PATCH /api/users/{id}/`  
**Permissions:** Admin only  
**CSRF:** Required  
**Restrictions:** Not allowed for showcase accounts

**Request:**
```json
{
  "nama": "Jane Smith Updated",
  "telepon": "08111111111"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data pengguna berhasil diperbarui.",
  "data": {
    "id": 2,
    "email": "newuser@example.com",
    "nama": "Jane Smith Updated",
    "telepon": "08111111111"
  }
}
```

#### 8.5 Delete User

**Endpoint:** `DELETE /api/users/{id}/`  
**Permissions:** Admin only  
**CSRF:** Required  
**Restrictions:** Not allowed for showcase accounts

**Response:**
```json
{
  "success": true,
  "message": "Pengguna berhasil dihapus."
}
```

---

### 9. Password Reset Requests

**Base Path:** `/api/users/password-reset-requests/`

#### 9.1 Create Password Reset Request

**Endpoint:** `POST /api/users/password-reset-requests/`  
**Authentication:** Not required  
**Rate Limit:** Throttled (password_reset scope)  
**CSRF:** Required

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permintaan reset password berhasil diajukan."
}
```

#### 9.2 List Password Reset Requests

**Endpoint:** `GET /api/users/password-reset-requests/`  
**Permissions:** Admin only

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user": {
        "id": 5,
        "email": "user@example.com",
        "nama": "John Doe"
      },
      "status": "pending",
      "createdAt": "2026-06-15T10:30:00Z"
    }
  ]
}
```

#### 9.3 Resolve Password Reset Request

**Endpoint:** `PATCH /api/users/password-reset-requests/{id}/resolve/`  
**Permissions:** Admin only  
**CSRF:** Required  
**Restrictions:** Not allowed for showcase accounts

**Response:**
```json
{
  "success": true,
  "message": "Password berhasil di-reset.",
  "data": {
    "tempPassword": "pwd-123456"
  }
}
```

---

## Academic

**Base Path:** `/api/academic/`  
**Authentication:** Required for all endpoints

### 1. Tahun Ajaran (Academic Years)

**Endpoint:** `/api/academic/tahun-ajaran/`  
**Methods:** GET, POST, PUT, PATCH, DELETE  
**Permissions:** Read (all authenticated), Write (admin only)

#### List Academic Years

**Request:**
```http
GET /api/academic/tahun-ajaran/
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama": "2025/2026",
      "tanggalMulai": "2025-07-01",
      "tanggalSelesai": "2026-06-30",
      "status": "aktif"
    }
  ]
}
```

---

### 2. Semester

**Endpoint:** `/api/academic/semester/`  
**Methods:** GET, POST, PUT, PATCH, DELETE

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tahunAjaran": {
        "id": 1,
        "nama": "2025/2026"
      },
      "nama": "Ganjil",
      "tanggalMulai": "2025-07-01",
      "tanggalSelesai": "2025-12-31",
      "status": "aktif"
    }
  ]
}
```

---

### 3. Kelas (Classes)

**Endpoint:** `/api/academic/kelas/`  
**Methods:** GET, POST, PUT, PATCH, DELETE

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama": "10 IPA 1",
      "tingkat": "10",
      "jurusan": "IPA",
      "waliKelas": {
        "id": 5,
        "nama": "Budi Santoso"
      },
      "kapasitas": 30,
      "jumlahSiswa": 28
    }
  ]
}
```

---

### 4. Mata Pelajaran (Subjects)

**Endpoint:** `/api/academic/mapel/`  
**Methods:** GET, POST, PUT, PATCH, DELETE

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kode": "MAT10",
      "nama": "Matematika",
      "tingkat": "10",
      "kategori": "Wajib",
      "bebanJam": 4
    }
  ]
}
```

---

## Schedules

**Base Path:** `/api/schedules/`  
**Authentication:** Required for all endpoints

### 1. Jadwal Pembelajaran (Learning Schedule)

**Endpoint:** `/api/schedules/pembelajaran/`  
**Methods:** GET, POST, PUT, PATCH, DELETE

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kelas": {
        "id": 1,
        "nama": "10 IPA 1"
      },
      "mataPelajaran": {
        "id": 1,
        "nama": "Matematika"
      },
      "guru": {
        "id": 5,
        "nama": "Budi Santoso"
      },
      "hari": "Senin",
      "jamMulai": "08:00:00",
      "jamSelesai": "09:30:00",
      "ruangan": "Lab Komputer 1"
    }
  ]
}
```

---

### 2. Jadwal Piket (Duty Schedule)

**Endpoint:** `/api/schedules/piket/`  
**Methods:** GET, POST, PUT, PATCH, DELETE

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "guru": {
        "id": 5,
        "nama": "Budi Santoso"
      },
      "hari": "Senin",
      "shift": "Pagi",
      "jamMulai": "07:00:00",
      "jamSelesai": "13:00:00",
      "lokasi": "Pintu Utama"
    }
  ]
}
```

---

## Attendance

**Base Path:** `/api/attendance/`  
**Authentication:** Required for all endpoints

### 1. Absensi Siswa (Student Attendance)

**Endpoint:** `/api/attendance/siswa/`  
**Methods:** GET, POST, PUT, PATCH, DELETE  
**Permissions:** 
- Read: All authenticated users (scoped by role)
- Write: Guru, Staf, Admin

#### List Attendance Records

**Request:**
```http
GET /api/attendance/siswa/?tanggal=2026-06-15&kelas_id=1
```

**Query Parameters:**
- `tanggal` (optional): Filter by date (YYYY-MM-DD)
- `kelas_id` (optional): Filter by class ID
- `siswa_id` (optional): Filter by student ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "siswa": {
        "id": 10,
        "nama": "Ahmad Rizki",
        "nomorInduk": "2024001"
      },
      "kelas": {
        "id": 1,
        "nama": "10 IPA 1"
      },
      "tanggal": "2026-06-15",
      "status": "hadir",
      "keterangan": null,
      "waktuAbsen": "07:15:00"
    },
    {
      "id": 2,
      "siswa": {
        "id": 11,
        "nama": "Siti Nurhaliza",
        "nomorInduk": "2024002"
      },
      "kelas": {
        "id": 1,
        "nama": "10 IPA 1"
      },
      "tanggal": "2026-06-15",
      "status": "izin",
      "keterangan": "Sakit",
      "waktuAbsen": null
    }
  ]
}
```

**Status Values:**
- `hadir` - Present
- `izin` - Excused absence (with permission)
- `sakit` - Sick
- `alpa` - Unexcused absence

#### Create Attendance Record

**Request:**
```json
{
  "siswa_id": 10,
  "kelas_id": 1,
  "tanggal": "2026-06-15",
  "status": "hadir",
  "keterangan": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Absensi berhasil dicatat.",
  "data": {
    "id": 1,
    "siswa": {
      "id": 10,
      "nama": "Ahmad Rizki"
    },
    "status": "hadir",
    "tanggal": "2026-06-15"
  }
}
```

---

### 2. Permintaan Koreksi (Correction Requests)

**Endpoint:** `/api/attendance/koreksi/`  
**Methods:** GET, POST, PUT, PATCH, DELETE  
**Description:** Students can request attendance corrections

#### Create Correction Request

**Request:**
```json
{
  "absensi_id": 2,
  "alasan": "Saya sudah menyerahkan surat izin ke wali kelas",
  "statusDiminta": "izin",
  "bukti": "https://example.com/media/surat-izin.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permintaan koreksi berhasil diajukan.",
  "data": {
    "id": 1,
    "absensi": {
      "id": 2,
      "tanggal": "2026-06-15"
    },
    "alasan": "Saya sudah menyerahkan surat izin ke wali kelas",
    "statusDiminta": "izin",
    "statusPermintaan": "pending",
    "tanggalDiajukan": "2026-06-15T10:30:00Z"
  }
}
```

#### Approve/Reject Correction Request

**Endpoint:** `PATCH /api/attendance/koreksi/{id}/`  
**Permissions:** Guru, Admin

**Request:**
```json
{
  "statusPermintaan": "approved",
  "catatanPetugas": "Surat izin sudah diverifikasi"
}
```

---

## Learning

**Base Path:** `/api/learning/`  
**Authentication:** Required for all endpoints

### 1. Materi (Learning Materials)

**Endpoint:** `/api/learning/materi/`  
**Methods:** GET, POST, PUT, PATCH, DELETE  
**Permissions:**
- Read: All authenticated users
- Write: Guru (own materials), Admin

#### List Materials

**Request:**
```http
GET /api/learning/materi/?kelas_id=1&mapel_id=1
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "judul": "Pengenalan Aljabar",
      "deskripsi": "Materi pengenalan konsep dasar aljabar",
      "kelas": {
        "id": 1,
        "nama": "10 IPA 1"
      },
      "mataPelajaran": {
        "id": 1,
        "nama": "Matematika"
      },
      "guru": {
        "id": 5,
        "nama": "Budi Santoso"
      },
      "tipe": "dokumen",
      "fileUrl": "https://example.com/media/materi/aljabar.pdf",
      "tanggalUpload": "2026-06-10T09:00:00Z",
      "tanggalPublish": "2026-06-11T07:00:00Z"
    }
  ]
}
```

**Material Types:**
- `dokumen` - Document (PDF, DOCX)
- `video` - Video file or link
- `link` - External link
- `presentasi` - Presentation file

---

### 2. Tugas (Assignments)

**Endpoint:** `/api/learning/tugas/`  
**Methods:** GET, POST, PUT, PATCH, DELETE

#### List Assignments

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "judul": "Latihan Soal Aljabar",
      "deskripsi": "Kerjakan 10 soal aljabar pada halaman 45-46",
      "kelas": {
        "id": 1,
        "nama": "10 IPA 1"
      },
      "mataPelajaran": {
        "id": 1,
        "nama": "Matematika"
      },
      "guru": {
        "id": 5,
        "nama": "Budi Santoso"
      },
      "tanggalDibuat": "2026-06-12T10:00:00Z",
      "deadline": "2026-06-19T23:59:59Z",
      "nilaiMaksimal": 100,
      "fileUrl": "https://example.com/media/tugas/soal-aljabar.pdf"
    }
  ]
}
```

---

### 3. Submissions (Assignment Submissions)

**Endpoint:** `/api/learning/submissions/`  
**Methods:** GET, POST, PUT, PATCH, DELETE  
**Permissions:**
- Create: Students (own submissions only)
- Update/Grade: Guru, Admin

#### Submit Assignment

**Request:**
```json
{
  "tugas_id": 1,
  "fileUrl": "https://example.com/media/submissions/jawaban-ahmad.pdf",
  "catatan": "Sudah dikerjakan semua soal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tugas berhasil dikumpulkan.",
  "data": {
    "id": 1,
    "tugas": {
      "id": 1,
      "judul": "Latihan Soal Aljabar"
    },
    "siswa": {
      "id": 10,
      "nama": "Ahmad Rizki"
    },
    "fileUrl": "https://example.com/media/submissions/jawaban-ahmad.pdf",
    "tanggalSubmit": "2026-06-18T15:30:00Z",
    "status": "submitted",
    "nilai": null
  }
}
```

#### Grade Submission

**Endpoint:** `PATCH /api/learning/submissions/{id}/`  
**Permissions:** Guru, Admin

**Request:**
```json
{
  "nilai": 85,
  "feedback": "Bagus, tapi perhatikan langkah nomor 7",
  "status": "graded"
}
```

---

### 4. File Upload

**Endpoint:** `POST /api/learning/upload/`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`  
**Description:** Upload files for materials, assignments, or submissions

**Request:**
```http
POST /api/learning/upload/
Content-Type: multipart/form-data

file: [binary file data]
category: "materi"
```

**Response:**
```json
{
  "success": true,
  "message": "File berhasil diupload.",
  "data": {
    "fileUrl": "https://example.com/media/materi/file-abc123.pdf",
    "fileName": "pengenalan-aljabar.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf"
  }
}
```

---

## Journals

**Base Path:** `/api/journals/`  
**Authentication:** Required for all endpoints

### Jurnal Pertemuan (Meeting Journals)

**Endpoint:** `/api/journals/`  
**Methods:** GET, POST, PUT, PATCH, DELETE  
**Permissions:**
- Read: All authenticated users (scoped)
- Write: Guru (own journals), Admin

#### List Journals

**Request:**
```http
GET /api/journals/?kelas_id=1&tanggal_dari=2026-06-01&tanggal_sampai=2026-06-15
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "jadwalPembelajaran": {
        "id": 1,
        "kelas": {
          "id": 1,
          "nama": "10 IPA 1"
        },
        "mataPelajaran": {
          "id": 1,
          "nama": "Matematika"
        }
      },
      "guru": {
        "id": 5,
        "nama": "Budi Santoso"
      },
      "tanggal": "2026-06-15",
      "jamMulai": "08:00:00",
      "jamSelesai": "09:30:00",
      "materiDiajarkan": "Pengenalan Aljabar - Operasi Dasar",
      "metode": "Ceramah dan Diskusi",
      "jumlahSiswaHadir": 28,
      "jumlahSiswaTotal": 30,
      "catatan": "Siswa cukup responsif, 2 siswa izin sakit",
      "statusJurnal": "submitted"
    }
  ]
}
```

#### Create Journal Entry

**Request:**
```json
{
  "jadwalPembelajaran_id": 1,
  "tanggal": "2026-06-15",
  "jamMulai": "08:00:00",
  "jamSelesai": "09:30:00",
  "materiDiajarkan": "Pengenalan Aljabar - Operasi Dasar",
  "metode": "Ceramah dan Diskusi",
  "jumlahSiswaHadir": 28,
  "catatan": "Siswa cukup responsif"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Jurnal pertemuan berhasil dibuat.",
  "data": {
    "id": 1,
    "statusJurnal": "submitted",
    "tanggal": "2026-06-15"
  }
}
```

---

## Reports

**Base Path:** `/api/reports/`  
**Authentication:** Required for all endpoints  
**Permissions:** Role-based access (typically Admin, Staf, Guru)

### 1. Attendance Report

**Endpoint:** `GET /api/reports/attendance/`  
**Description:** Generate attendance summary reports

**Request:**
```http
GET /api/reports/attendance/?tanggal_dari=2026-06-01&tanggal_sampai=2026-06-15&kelas_id=1
```

**Query Parameters:**
- `tanggal_dari` (required): Start date
- `tanggal_sampai` (required): End date
- `kelas_id` (optional): Filter by class
- `siswa_id` (optional): Filter by student

**Response:**
```json
{
  "success": true,
  "data": {
    "periode": {
      "dari": "2026-06-01",
      "sampai": "2026-06-15"
    },
    "ringkasan": {
      "totalHariSekolah": 10,
      "totalSiswa": 30,
      "totalKehadiran": 280,
      "totalIzin": 10,
      "totalSakit": 5,
      "totalAlpa": 5,
      "persentaseKehadiran": 93.3
    },
    "detailPerSiswa": [
      {
        "siswa": {
          "id": 10,
          "nama": "Ahmad Rizki",
          "nomorInduk": "2024001"
        },
        "hadir": 9,
        "izin": 1,
        "sakit": 0,
        "alpa": 0,
        "persentase": 90.0
      }
    ]
  }
}
```

---

### 2. Grade Report

**Endpoint:** `GET /api/reports/grades/`  
**Description:** Generate academic performance reports

**Request:**
```http
GET /api/reports/grades/?semester_id=1&kelas_id=1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "semester": {
      "id": 1,
      "nama": "Ganjil 2025/2026"
    },
    "kelas": {
      "id": 1,
      "nama": "10 IPA 1"
    },
    "detailPerSiswa": [
      {
        "siswa": {
          "id": 10,
          "nama": "Ahmad Rizki"
        },
        "nilaiPerMapel": [
          {
            "mataPelajaran": "Matematika",
            "nilaiRataRata": 85,
            "nilaiTugas": 88,
            "nilaiUTS": 82,
            "nilaiUAS": 85
          }
        ],
        "rataRataKeseluruhan": 84.5,
        "peringkat": 5
      }
    ]
  }
}
```

---

### 3. Operational Report

**Endpoint:** `GET /api/reports/operational/`  
**Description:** Generate operational/administrative reports

**Request:**
```http
GET /api/reports/operational/?tanggal_dari=2026-06-01&tanggal_sampai=2026-06-15
```

**Response:**
```json
{
  "success": true,
  "data": {
    "periode": {
      "dari": "2026-06-01",
      "sampai": "2026-06-15"
    },
    "jurnalPertemuan": {
      "total": 120,
      "submitted": 115,
      "pending": 5,
      "persentaseKelengkapan": 95.8
    },
    "tugasDanSubmissions": {
      "totalTugas": 25,
      "totalSubmissions": 680,
      "rataRataKumpulTepatWaktu": 88.5
    },
    "aktivitasPengguna": {
      "totalLogin": 450,
      "penggunaAktif": 85
    }
  }
}
```

---

## Additional Notes

### Error Handling
All endpoints follow the standardized error response format. Common error scenarios:
- **Validation errors:** `400 Bad Request` with detailed field errors
- **Authentication failures:** `401 Unauthorized`
- **Permission denied:** `403 Forbidden`
- **Resource not found:** `404 Not Found`
- **Rate limiting:** `429 Too Many Requests`

### Rate Limiting
Rate limits are applied to sensitive endpoints:
- **Login:** Limited to prevent brute force attacks
- **Password reset:** Limited to prevent abuse
- **Token refresh:** Limited to prevent token farming

### CORS Configuration
- Configured to allow requests from frontend domain
- Credentials (cookies) allowed for same-origin requests
- Preflight requests handled automatically

### Health Check Endpoints
- `GET /api/health/live/` - Liveness probe
- `GET /api/health/ready/` - Readiness probe

---

**End of API Module Contract**
