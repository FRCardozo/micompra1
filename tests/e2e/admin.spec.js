import { test, expect } from '@playwright/test';

test.describe('Flujo de Super Admin', () => {
    test('un administrador debe poder ver las métricas globales', async ({ page }) => {
        // 1. Login
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'fabian.cardozo@hotmail.com');
        await page.fill('input[type="password"]', 'Admin9492');
        await page.click('button[type="submit"]');

        // 2. Esperar al dashboard
        await page.waitForURL('**/admin', { timeout: 15000 });

        // 3. Verificar elementos clave
        await expect(page.locator('h1')).toContainText('Dashboard');
        const metrics = page.locator('text=Pedidos Hoy');
        await expect(metrics).toBeVisible({ timeout: 10000 });

        // 4. Navegación
        await page.click('nav >> text=Usuarios');
        await expect(page).toHaveURL(/\/admin\/users/);
        await expect(page.locator('h1')).toContainText('Usuarios');
    });
});
