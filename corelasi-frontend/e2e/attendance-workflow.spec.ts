import { test, expect } from "@playwright/test";

test.describe("CORELASI Attendance Workflow E2E", () => {
  test("should complete the entire attendance workflow (Guru -> Siswa -> Admin)", async ({ page }) => {
    // ----------------------------------------------------
    // PART 1: GURU INPUT ATTENDANCE (TC-ATT-001)
    // ----------------------------------------------------
    await page.goto("/login");
    
    // Fill credentials for Drs. Budi Setiawan (Guru)
    await page.fill("input[id='email']", "guru@corelasi.test");
    await page.fill("input[id='password']", "password123");
    await page.click("button[type='submit']");
    
    // Verify redirected to Guru Dashboard
    await expect(page).toHaveURL(/.*\/guru\/dashboard/);
    
    // Navigate to Attendance Page
    await page.goto("/guru/attendance");
    
    // Wait for student list to load
    await expect(page.locator("text=Rian Adi Wijaya")).toBeVisible();
    
    // Click "Alpa" status button for student Rian Adi Wijaya (Siswa 1)
    const alpaButton = page.locator("button[aria-label='Tandai Rian Adi Wijaya Alpa']");
    await expect(alpaButton).toBeVisible();
    await alpaButton.click();
    
    // Add description / keterangan
    const keteranganInput = page.locator("input[aria-label='Keterangan absen untuk Rian Adi Wijaya']");
    await expect(keteranganInput).toBeVisible();
    await keteranganInput.fill("Tidak hadir tanpa keterangan.");
    
    // Click Simpan Absensi
    await page.click("button:has-text('Simpan Absensi')");
    
    // Verify success toast
    await expect(page.locator("text=Kehadiran kelas berhasil disimpan")).toBeVisible();
    
    // Logout Guru
    await page.click("button[aria-label='Keluar dari akun']");
    await expect(page).toHaveURL(/.*\/login/);

    // ----------------------------------------------------
    // PART 2: SISWA SUBMIT CORRECTION REQUEST (TC-ATT-003)
    // ----------------------------------------------------
    // Login as Siswa (Rian Adi Wijaya)
    await page.fill("input[id='email']", "siswa@corelasi.test");
    await page.fill("input[id='password']", "password123");
    await page.click("button[type='submit']");
    
    // Verify redirected to Siswa Dashboard
    await expect(page).toHaveURL(/.*\/siswa\/dashboard/);
    
    // Go to Attendance Page
    await page.goto("/siswa/attendance");
    
    // Wait for attendance records table
    await expect(page.locator("text=Histori Kehadiran Semester Ini")).toBeVisible();
    
    // Click "Ajukan Koreksi" row button (since the student has a non-Hadir record now)
    const requestCorrectionButton = page.locator("button:has-text('Ajukan Koreksi')").first();
    await expect(requestCorrectionButton).toBeVisible();
    await requestCorrectionButton.click();
    
    // Wait for the modal to open
    await expect(page.locator("text=Ajukan Koreksi Presensi")).toBeVisible();
    
    // Fill reasons/alasan
    await page.fill("textarea[id='form-alasan']", "Saya sudah masuk kelas Matematika, lupa tapping.");
    
    // Select status usulan
    await page.selectOption("select[id='form-status']", "Hadir");
    
    // Submit the request
    await page.click("button:has-text('Kirim Pengajuan')");
    
    // Verify success toast
    await expect(page.locator("text=Permintaan koreksi berhasil dikirim")).toBeVisible();
    
    // Logout Siswa
    await page.click("button[aria-label='Keluar dari akun']");
    await expect(page).toHaveURL(/.*\/login/);

    // ----------------------------------------------------
    // PART 3: ADMIN VERIFY CORRECTION REQUEST (TC-ATT-004)
    // ----------------------------------------------------
    // Login as Admin
    await page.fill("input[id='email']", "admin@corelasi.test");
    await page.fill("input[id='password']", "password123");
    await page.click("button[type='submit']");
    
    // Verify redirected to Admin Dashboard
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    
    // Go to Attendance monitoring page
    await page.goto("/admin/attendance");
    
    // Click Tab Koreksi Absensi
    await page.click("#tab-koreksi");
    
    // Wait for table to display correction requests
    await expect(page.locator("text=Permintaan Koreksi Kehadiran Siswa")).toBeVisible();
    await expect(page.locator("text=Rian Adi Wijaya").first()).toBeVisible();
    
    // Verify button
    const verifyButton = page.locator("button[aria-label='Verifikasi koreksi absensi Rian Adi Wijaya']").first();
    await expect(verifyButton).toBeVisible();
    await verifyButton.click();
    
    // Verify success toast
    await expect(page.locator("text=Koreksi absensi Rian Adi Wijaya berhasil diverifikasi")).toBeVisible();
    
    // Logout Admin
    await page.click("button[aria-label='Keluar dari akun']");
    await expect(page).toHaveURL(/.*\/login/);
  });
});
