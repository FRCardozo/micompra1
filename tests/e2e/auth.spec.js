import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
    test('debe permitir el login a un cliente', async ({ page }) => {
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'elviradiaz0825@gmail.com');
        await page.fill('input[type="password"]', '123456');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/');
        const toast = page.locator('text=Sesión iniciada exitosamente');
        await expect(toast).toBeVisible();
    });

    test('debe mostrar error con credenciales inválidas', async ({ page }) => {
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'fake@test.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        const errorToast = page.locator('text=Error al iniciar sesión');
        await expect(errorToast).toBeVisible();
    });
});
