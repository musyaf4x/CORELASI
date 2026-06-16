import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Showcase Quick Login Smoke Test', () => {
  const targetUrl = 'http://localhost:5173/';
  const evidenceDir = path.resolve(process.cwd(), '../docs/project-management/evidence/fresh-clone');

  test('Siswa quick login flow', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    await page.goto(targetUrl);
    
    // Expect login page to be loaded
    await expect(page.locator('h1')).toContainText('Masuk ke sistem');
    
    // Expand demo section
    const demoButton = page.locator('button:has-text("Butuh akun simulasi (demo)?")');
    await demoButton.click();
    
    // Click Siswa / Murid quick login
    const siswaButton = page.locator('button:has-text("Siswa / Murid")');
    await siswaButton.click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/siswa/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/.*\/siswa\/dashboard/);
    
    // Check elements on dashboard
    await expect(page.locator('body')).toContainText('Siswa');
    
    // Capture screenshot
    await page.screenshot({ path: path.join(evidenceDir, 'siswa_local_dashboard.png'), fullPage: true });
  });

  test('Guru quick login flow', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    await page.goto(targetUrl);
    
    // Expand demo section
    const demoButton = page.locator('button:has-text("Butuh akun simulasi (demo)?")');
    await demoButton.click();
    
    // Click Guru Pengajar quick login
    const guruButton = page.locator('button:has-text("Guru Pengajar")');
    await guruButton.click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/guru/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/.*\/guru\/dashboard/);
    
    // Check elements on dashboard
    await expect(page.locator('body')).toContainText('Guru');
    
    // Capture screenshot
    await page.screenshot({ path: path.join(evidenceDir, 'guru_local_dashboard.png'), fullPage: true });
  });

  test('Admin quick login flow', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    await page.goto(targetUrl);
    
    // Expand demo section
    const demoButton = page.locator('button:has-text("Butuh akun simulasi (demo)?")');
    await demoButton.click();
    
    // Click Admin Sekolah quick login
    const adminButton = page.locator('button:has-text("Admin Sekolah")');
    await adminButton.click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    
    // Check elements on dashboard
    await expect(page.locator('body')).toContainText('Administrator');
    
    // Capture screenshot
    await page.screenshot({ path: path.join(evidenceDir, 'admin_local_dashboard.png'), fullPage: true });
  });
});
