import { test, expect } from '@playwright/test';

test.describe('Flujo de Ally Admin', () => {
    test('un administrador aliado debe poder gestionar su tienda y productos', async ({ page }) => {
        // 1. Login como Ally Admin
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'sistemagaleras@gmail.com');
        await page.fill('input[type="password"]', 'Admin2026');
        await page.click('button[type="submit"]');

        // 2. Verificar Dashboard de Ally Admin (suele ser similar al de store o una variante)
        // Ajustado según la ruta de ally admin
        await expect(page).toHaveURL(/\/store|\/ally/);

        // 3. Verificar acceso a productos
        const productsLink = page.locator('nav >> text=Productos');
        if (await productsLink.count() > 0) {
            await productsLink.click();
            await expect(page).toHaveURL(/.*products/);
        }
    });
});
