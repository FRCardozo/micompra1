import { test, expect } from '@playwright/test';

test.describe('Flujo de Compra Completo', () => {
    test('un cliente debe poder realizar un pedido completo', async ({ page }) => {
        // 1. Login
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'elviradiaz0825@gmail.com');
        await page.fill('input[type="password"]', '123456');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/', { timeout: 10000 });

        // 2. Seleccionar Tienda
        const storeCard = page.locator('button:has-text("Tienda de"), button:has-text("Tienda")').first();
        await expect(storeCard).toBeVisible();
        await storeCard.click();

        // 3. Agregar Productos
        const addButtons = page.locator('button:has-text("+ Agregar"), button:has-text("Añadir")');
        await expect(addButtons.first()).toBeVisible();
        await addButtons.first().click();

        // 4. Ir al Carrito
        await page.locator('button:has(svg)').first().click();
        await expect(page).toHaveURL('/cart');

        // 5. Proceder al pago
        await page.click('button:has-text("Proceder al pago")');
        await expect(page).toHaveURL('/checkout');

        // 6. Seleccionar Pago (Efectivo)
        const cashPayment = page.locator('text=Efectivo').first();
        await cashPayment.click();

        // 7. Confirmar Pedido
        const confirmBtn = page.locator('button:has-text("Confirmar pedido")');
        await expect(confirmBtn).toBeEnabled({ timeout: 10000 });
        await confirmBtn.click();

        await expect(page).toHaveURL(/\/orders\/[a-zA-Z0-9-]+/, { timeout: 15000 });
        await expect(page.locator('text=Pedido realizado')).toBeVisible();

        // 8. Verificar Carrito Vacío
        await page.goto('/');
        const cartBadge = page.locator('span.bg-red-500');
        await expect(cartBadge).not.toBeVisible();
    });
});
