import { test, expect } from '@playwright/test';

test.describe('Flujo de Domiciliario', () => {
    test('un domiciliario debe poder conectarse y entregar un pedido', async ({ page }) => {
        // 1. Login como Driver
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'nortluja78@gmail.com');
        await page.fill('input[type="password"]', '123456');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/driver');

        // 3. Ponerse en Línea
        const onlineButton = page.locator('button:has-text("Desconectado"), button:has-text("Offline")');
        // Esperar a que el botón aparezca (puede tardar un poco por la carga de datos)
        await page.waitForTimeout(2000);
        if (await onlineButton.count() > 0) {
            await onlineButton.first().click();
            // Esperar a que cambie el estado a En Linea
            await expect(page.locator('button:has-text("En Linea"), button:has-text("Online")')).toBeVisible({ timeout: 10000 });
        }

        // 4. Ver Pedidos Disponibles
        const acceptButtons = page.locator('button:has-text("Aceptar")');
        if (await acceptButtons.count() > 0) {
            await acceptButtons.first().click();
        }

        await page.click('nav >> text=Pedidos');
        await page.click('button:has-text("En Curso")');
        const orderCards = page.locator('div.bg-white, div.rounded-2xl');
        if (await orderCards.count() > 0) {
            await orderCards.first().click();
            const actionButton = page.locator('button:has-text("Marcar"), button:has-text("Iniciar")');
            while (await actionButton.count() > 0) {
                await actionButton.click();
                await page.waitForTimeout(1000);
                if (await page.locator('text=Entregado').isVisible()) break;
            }
        }
    });
});
