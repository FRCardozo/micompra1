import { test, expect } from '@playwright/test';

test.describe('Flujo de Tienda', () => {
    test('un administrador de tienda debe poder aceptar y preparar pedidos', async ({ page }) => {
        // 1. Login como Tienda
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'riicardofabian@gmail.com');
        await page.fill('input[type="password"]', '123456');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/store');
        await page.click('nav >> text=Pedidos');

        // 4. Aceptar un pedido nuevo
        const acceptButtons = page.locator('button:has-text("Aceptar")');
        if (await acceptButtons.count() > 0) {
            await acceptButtons.first().click();
            await expect(page.locator('text=Pedido aceptado')).toBeVisible();
        }

        // 5. Marcar como Listo
        await page.click('button:has-text("En Preparación")');
        const readyButtons = page.locator('button:has-text("Marcar Listo")');
        if (await readyButtons.count() > 0) {
            await readyButtons.first().click();
            await expect(page.locator('text=Pedido marcado como listo')).toBeVisible();
        }
    });
});
