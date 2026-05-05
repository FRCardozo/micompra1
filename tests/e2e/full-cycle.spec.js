import { test, expect } from '@playwright/test';

test.describe('Ciclo de Pedido Completo (Multi-rol)', () => {
    test('debe permitir un flujo completo desde la compra hasta la entrega', async ({ browser }) => {
        test.setTimeout(180000); // Dar más tiempo para el flujo multi-rol

        const STORE_OWNER_EMAIL = 'riicardofabian@gmail.com';
        const PASSWORD = '123456';
        const CLIENT_EMAIL = 'elviradiaz0825@gmail.com';
        const DRIVER_EMAIL = 'riicardofabian_95@hotmail.com';

        // --- PRE-PASO: Obtener el nombre de la tienda del dueño ---
        console.log('Obteniendo nombre de la tienda del dueño...');
        const initStoreContext = await browser.newContext();
        const initStorePage = await initStoreContext.newPage();
        await initStorePage.goto('http://localhost:3000/auth/login');
        await initStorePage.fill('input[type="email"]', STORE_OWNER_EMAIL);
        await initStorePage.fill('input[type="password"]', PASSWORD);
        await initStorePage.click('button[type="submit"]');

        await expect(initStorePage.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });

        await initStorePage.goto('http://localhost:3000/store/profile');

        // Intentar obtener el nombre del input primero
        let storeNameFromProfile = '';
        const nameInput = initStorePage.locator('input[name="store_name"]').first();
        try {
            await expect(nameInput).toBeVisible({ timeout: 5000 });
            storeNameFromProfile = await nameInput.inputValue();
        } catch (e) {
            console.log('Input store_name no encontrado, probando con h2...');
            storeNameFromProfile = await initStorePage.locator('h2').first().innerText();
        }

        console.log(`La tienda del dueño es: ${storeNameFromProfile}`);
        await initStoreContext.close();

        // --- 1. CLIENTE CREA EL PEDIDO ---
        const clientContext = await browser.newContext();
        const clientPage = await clientContext.newPage();
        await clientPage.goto('http://localhost:3000/auth/login');
        await clientPage.fill('input[type="email"]', CLIENT_EMAIL);
        await clientPage.fill('input[type="password"]', PASSWORD);
        await clientPage.click('button[type="submit"]');
        await expect(clientPage).toHaveURL('/', { timeout: 15000 });

        console.log(`Buscando la tienda "${storeNameFromProfile}" para compra...`);
        await clientPage.waitForLoadState('networkidle');

        // Selector más específico para el botón de la tienda en el Home
        const storeLink = clientPage.locator('button').filter({ has: clientPage.locator('h3', { hasText: new RegExp(storeNameFromProfile, 'i') }) }).first();

        if (await storeLink.count() === 0) {
            console.log('Tienda específica no encontrada en Home, buscando en la sección de tiendas...');
            await clientPage.goto('http://localhost:3000/stores');
            await clientPage.waitForLoadState('networkidle');
            const storeCard = clientPage.locator('div, button').filter({ has: clientPage.locator('h3', { hasText: new RegExp(storeNameFromProfile, 'i') }) }).first();
            await storeCard.click();
        } else {
            await storeLink.click();
        }

        console.log('Esperando a que los productos carguen...');
        await clientPage.waitForLoadState('networkidle');
        const addBtn = clientPage.locator('button:has-text("Agregar")').first();
        await expect(addBtn).toBeVisible({ timeout: 20000 });
        await addBtn.click();

        console.log('Navegando al carrito y checkout...');
        await clientPage.goto('http://localhost:3000/cart');
        await clientPage.click('button:has-text("Proceder al pago"), a[href="/checkout"]');

        await clientPage.waitForURL(/\/checkout/);
        await clientPage.waitForLoadState('networkidle');

        // Seleccionar Efectivo
        await clientPage.click('text=Efectivo');
        await clientPage.click('button:has-text("Confirmar pedido")');

        await clientPage.waitForURL(/\/orders\/[a-zA-Z0-9-]+/, { timeout: 20000 });
        const orderId = clientPage.url().split('/').pop();
        const shortOrderId = orderId.slice(0, 8);
        console.log(`Pedido creado: ${orderId}`);

        // --- 2. TIENDA PROCESA EL PEDIDO ---
        const storeContext = await browser.newContext();
        const storePage = await storeContext.newPage();
        await storePage.goto('http://localhost:3000/auth/login');
        await storePage.fill('input[type="email"]', STORE_OWNER_EMAIL);
        await storePage.fill('input[type="password"]', PASSWORD);
        await storePage.click('button[type="submit"]');
        await expect(storePage.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });

        console.log(`Buscando pedido #${shortOrderId} en la tienda...`);
        await storePage.goto('http://localhost:3000/store/orders');
        await storePage.waitForLoadState('networkidle');

        // Asegurarse de estar en la pestaña "Nuevos"
        await storePage.click('button:has-text("Nuevos")');

        // Localizador específico del card del pedido: un div que contiene un h3 con el ID del pedido
        const orderCard = storePage.locator('div').filter({ has: storePage.locator('h3', { hasText: new RegExp(shortOrderId, 'i') }) }).first();
        await expect(orderCard).toBeVisible({ timeout: 20000 });

        const acceptBtn = orderCard.locator('button:has-text("Aceptar")');
        await expect(acceptBtn).toBeVisible({ timeout: 10000 });
        await acceptBtn.click();

        // Cambiar a "En Preparación"
        console.log('Cambiando a pestaña En Preparación...');
        await storePage.click('button:has-text("En Preparación")');
        await storePage.waitForLoadState('networkidle');

        // Buscar el card en la nueva pestaña
        const preparingCard = storePage.locator('div').filter({ has: storePage.locator('h3', { hasText: new RegExp(shortOrderId, 'i') }) }).first();
        const readyBtn = preparingCard.locator('button:has-text("Listo")');
        await expect(readyBtn).toBeVisible({ timeout: 15000 });
        await readyBtn.click();

        console.log('Tienda procesó el pedido exitosamente');

        // --- 3. DOMICILIARIO ENTREGA EL PEDIDO ---
        const driverContext = await browser.newContext();
        const driverPage = await driverContext.newPage();
        await driverPage.goto('http://localhost:3000/auth/login');
        await driverPage.fill('input[type="email"]', DRIVER_EMAIL);
        await driverPage.fill('input[type="password"]', PASSWORD);
        await driverPage.click('button[type="submit"]');

        await expect(driverPage.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });

        const onlineBtn = driverPage.locator('button:has-text("Desconectado"), button:has-text("Offline")');
        if (await onlineBtn.count() > 0) {
            await onlineBtn.first().click();
            await expect(driverPage.locator('button:has-text("En Linea"), button:has-text("Online")')).toBeVisible({ timeout: 10000 });
        }

        console.log('Buscando pedido en el dashboard del domiciliario...');
        const driverOrderCard = driverPage.locator('div').filter({ has: driverPage.locator('h3, p', { hasText: new RegExp(shortOrderId, 'i') }) }).first();
        await expect(driverOrderCard).toBeVisible({ timeout: 20000 });
        await driverOrderCard.click();

        await expect(driverPage).toHaveURL(/\/driver\/orders\/[a-zA-Z0-9-]+/);

        // Flujo de entrega: Aceptar, Recoger, Entregar
        const states = ['Aceptar Pedido', 'Marcar como Recogido', 'Marcar como Entregado'];
        for (const state of states) {
            console.log(`Ejecutando paso: ${state}`);
            const btn = driverPage.locator(`button:has-text("${state}")`);
            await expect(btn).toBeVisible({ timeout: 15000 });
            await btn.click();
            await driverPage.waitForTimeout(1000); // Pequeña pausa para transiciones
        }

        await expect(driverPage.locator('text=Entregado')).toBeVisible({ timeout: 10000 });
        console.log('Ciclo completo finalizado exitosamente');
        await browser.close();
    });
});
