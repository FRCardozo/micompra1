# Mapa Mental del Proyecto: MiCompra1

## 🛠️ Stack Técnico Exacto
*   **Frontend:** React 18.3, Vite, React Router DOM v6.20
*   **Estilos:** TailwindCSS, Framer Motion (Animaciones), Lucide React / React Icons
*   **Mapas y Geolocalización:** Leaflet, React-Leaflet
*   **Gráficos:** Recharts
*   **Backend as a Service (BaaS):** Supabase (Base de datos PostgreSQL, Auth, Storage)
*   **Testing:** Vitest, Playwright (E2E)

## 📁 Árbol de Carpetas Simplificado
```text
micompra1/
├── package.json
├── mi-proyecto-supabase/
│   └── schema.sql                  # Esquema y funciones (PostGIS, triggers)
└── src/
    ├── App.jsx                     # Enrutador principal y control de accesos (ProtectedRoute)
    ├── main.jsx
    ├── components/
    │   ├── admin/, ally-admin/, auth/, client/, driver/, store/, superadmin/
    │   └── common/                 # UI reutilizable
    ├── contexts/
    │   ├── AuthContext.jsx         # Estado de sesión y perfiles
    │   └── CartContext.jsx         # Manejo del carrito
    ├── hooks/
    ├── lib/
    │   ├── supabase.js             # Cliente de Supabase
    │   └── coverageHelper.js       # Lógica de validación de zonas
    ├── pages/
    │   ├── client/                 # Home, Checkout, Cart, Orders, Stores
    │   ├── store/                  # Dashboard, Profile, Products
    │   ├── driver/                 # Dashboard, Orders, Earnings
    │   ├── admin/ & superadmin/    # Gestión integral
    │   └── ally-admin/             # Gestión de aliados
    └── utils/
```

## 🔄 Flujo de Usuario (Cliente -> Checkout -> WhatsApp)
1.  **Exploración y Carrito:** El cliente navega por las tiendas (rol `client` o invitado), agrega productos al carrito (estado local/Contexto).
2.  **Checkout:** Ingresa a `Checkout.jsx`.
3.  **Ubicación:** Selecciona una dirección guardada o agrega una nueva en el mapa.
4.  **Logística / Cobertura:** El frontend descarga las zonas activas (`coverage_zones`), compara la ubicación del cliente y de la tienda, y determina el tipo de envío: *Express*, *Encargo Rutero*, o *Mensajería Certificada*.
5.  **Creación de Orden:** Se insertan registros en `orders` (con estado `created`) y `order_items` en Supabase con los cálculos de subtotal, envío y total generados en el frontend.
6.  **Redirección a WhatsApp:** Se formatea un mensaje detallado (productos, precios, link de Google Maps) y se abre WhatsApp con el número del comercio para finalizar el pago y coordinar el envío directamente por chat. Se vacía el carrito.

## 🗄️ Tablas de Supabase Clave y Campos
*   `profiles`: `id`, `role` (client, store, driver, admin), `email`, `full_name`.
*   `stores`: `id`, `owner_id`, `name`, `phone`, `latitude`, `longitude`, `status`.
*   `orders`: `id`, `order_number`, `client_id`, `store_id`, `status`, `total`, `delivery_type`, `delivery_address`.
*   `order_items`: `order_id`, `product_id`, `quantity`, `unit_price`, `subtotal`.
*   `client_addresses`: `client_id`, `latitude`, `longitude`, `address_line`, `is_default`.
*   `coverage_zones`: `polygon`, `center_lat`, `center_lng`, `base_delivery_cost`.
*   `products`: `id`, `store_id`, `price`, `name`.

## ⚠️ 3 Puntos Débiles o Riesgos en el Código Actual
1.  **Vulnerabilidad de Manipulación de Precios (Seguridad Front-End):** Todo el cálculo de precios, envíos y el total de la orden se realiza en el frontend (`Checkout.jsx` líneas 172-197) y se inserta directamente en Supabase. Un usuario malintencionado podría interceptar o alterar estos valores en el navegador y crear órdenes en la base de datos con precios manipulados.
2.  **Órdenes Fantasmas (Fricción del Flujo WhatsApp):** La base de datos registra la orden como `created` *antes* de abrir WhatsApp. Si el usuario cierra la ventana de WhatsApp y no envía el mensaje, el sistema queda con órdenes en la base de datos que la tienda nunca recibió. Esto puede ensuciar severamente las métricas y la operatividad.
3.  **Carga y Validación de Cobertura No Escalable:** Actualmente, el sistema descarga todas las zonas de cobertura activas en el frontend (`setZones`) e itera evaluando polígonos del lado del cliente (`validateCoverage`). Cuando existan docenas o cientos de zonas complejas, esto penalizará la memoria y el rendimiento del dispositivo del usuario. Debería validarse desde el backend aprovechando la extensión PostGIS que ya existe en el schema (`is_point_in_coverage`).