# 🧪 Test del Sistema de Cobertura

## Pruebas Rápidas

### 1. Verificar que el Módulo Aparece en el Menú

1. Iniciar sesión como Super Admin
2. Ir al menú lateral
3. Buscar el ícono 📍 "Cobertura"
4. ✅ Debe aparecer entre "Cupones" y "Soporte"

### 2. Crear Primera Zona de Cobertura

1. Clic en "Cobertura" en el menú
2. Clic en "Nueva Zona"
3. En el modal:
   - Buscar ciudad: "Galeras"
   - Nombre: "Zona Centro"
   - Clic en "Dibujar Polígono"
   - Hacer 4 clicks en el mapa formando un cuadrado
   - Clic en "Terminar"
   - Clic en "Crear Zona"
4. ✅ La zona debe aparecer en el mapa principal

### 3. Editar Zona Existente

1. En la lista de zonas, clic en "Editar" (ícono de lápiz)
2. Cambiar el costo base de $2,000 a $3,000
3. Cambiar tiempo estimado de 30 a 45 minutos
4. Clic en "Actualizar Zona"
5. ✅ Los cambios deben reflejarse inmediatamente

### 4. Ver Estadísticas de Zona

1. Clic en "Stats" (ícono de gráfica) en cualquier zona
2. ✅ Debe mostrar:
   - Métricas (pedidos, ingresos, tiempo, demanda)
   - Configuración actual
   - Tiendas disponibles
   - Domiciliarios disponibles

### 5. Activar/Desactivar Zona

1. Clic en el ícono de encendido/apagado
2. ✅ La zona cambia de verde (activa) a gris (inactiva)
3. ✅ Aparece notificación de confirmación

### 6. Eliminar Zona

1. Clic en el ícono de papelera (rojo)
2. Confirmar en el diálogo
3. ✅ La zona desaparece del mapa y de la lista

## Pruebas Técnicas (Console)

### Test 1: Validar Punto Dentro de Zona

```javascript
// En la consola del navegador:
import { isPointInPolygon } from './src/lib/coverageHelper';

const polygon = [
  { lat: 8.92, lng: -75.19 },
  { lat: 8.92, lng: -75.17 },
  { lat: 8.91, lng: -75.17 },
  { lat: 8.91, lng: -75.19 }
];

const pointInside = { lat: 8.915, lng: -75.18 };
const pointOutside = { lat: 8.93, lng: -75.20 };

console.log('Inside:', isPointInPolygon(pointInside, polygon)); // true
console.log('Outside:', isPointInPolygon(pointOutside, polygon)); // false
```

### Test 2: Buscar Zona por Coordenadas

```javascript
// Cargar zonas desde Supabase
const { data: zones } = await supabase
  .from('coverage_zones')
  .select('*')
  .eq('is_active', true);

// Validar cobertura
const result = validateCoverage({ lat: 8.9167, lng: -75.1833 }, zones);
console.log('Coverage:', result);
```

### Test 3: Verificar Horarios

```javascript
const zone = {
  operating_hours: {
    monday: { open: '08:00', close: '22:00' },
    // ... otros días
  }
};

console.log('Operating:', isZoneOperating(zone));
```

## Pruebas de Base de Datos

### Test 1: Verificar Tablas Creadas

```sql
-- En el SQL Editor de Supabase
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'coverage%';

-- Debe mostrar:
-- coverage_zones
-- coverage_history
-- coverage_zone_stores
-- coverage_zone_drivers
-- coverage_zone_stats
```

### Test 2: Verificar Función PostGIS

```sql
-- Verificar que PostGIS está habilitado
SELECT postgis_version();

-- Debe retornar la versión de PostGIS
```

### Test 3: Verificar Zona de Ejemplo

```sql
SELECT
  id,
  name,
  city,
  is_active,
  base_delivery_cost,
  estimated_delivery_time_minutes,
  jsonb_array_length(polygon) as polygon_points
FROM coverage_zones;

-- Debe mostrar la zona "Centro - Galeras"
```

### Test 4: Verificar Historial

```sql
SELECT
  action,
  changed_at,
  changed_by,
  changes->>'new'->'name' as zone_name
FROM coverage_history
ORDER BY changed_at DESC
LIMIT 10;

-- Debe mostrar el historial de cambios
```

## Casos de Prueba Avanzados

### Caso 1: Zonas Superpuestas

1. Crear dos zonas que se superpongan parcialmente
2. Zona A: prioridad = 1
3. Zona B: prioridad = 2
4. Validar punto en zona superpuesta
5. ✅ Debe retornar Zona B (mayor prioridad)

### Caso 2: Polígono Inválido

1. Intentar crear zona con solo 2 puntos
2. ✅ Debe mostrar error: "El polígono debe tener al menos 3 puntos"

### Caso 3: Ciudad No Encontrada

1. Buscar ciudad: "ZonaInventada123"
2. ✅ Debe mostrar: "Ciudad no encontrada"

### Caso 4: Múltiples Zonas por Ciudad

1. Crear "Zona Norte - Galeras"
2. Crear "Zona Sur - Galeras"
3. Crear "Zona Este - Galeras"
4. ✅ Todas deben aparecer en el mapa con colores distintos
5. ✅ No deben interferir entre sí

## Verificación Visual

### Mapa Principal
- ✅ Zonas activas en verde
- ✅ Zonas inactivas en gris
- ✅ Marcadores en el centro de cada zona
- ✅ Popup con información al hacer click
- ✅ Vista ajustada para mostrar todas las zonas

### Lista de Zonas
- ✅ Cards con información resumida
- ✅ Badge de estado (Activa/Inactiva)
- ✅ Botones de acción visibles
- ✅ Responsive en móvil

### Modal de Edición
- ✅ Mapa interactivo para dibujar
- ✅ Buscador de ciudades funcional
- ✅ Formulario con validación
- ✅ Botones claramente identificados

## Logs Esperados

Al usar el sistema, deberías ver estos logs en la consola:

```
[Coverage] Loading zones
[Coverage] Zones loaded: 1
[CoverageMap] Initializing map
[CoverageMap] Map initialized
[CoverageMap] Rendering zones: 1
[Coverage] Opening create zone modal
[ZoneModal] Initializing map editor
[ZoneModal] Starting polygon drawing
[ZoneModal] Adding point to polygon: 8.92, -75.19
[ZoneModal] Finishing polygon drawing
[ZoneModal] Submitting zone
[ZoneModal] Creating new zone
[Coverage] Zones loaded: 2
```

## Problemas Comunes y Soluciones

### Problema: Mapa no se muestra
**Solución:** Verificar que el CSS de Leaflet está cargado en index.html

### Problema: No se puede dibujar polígono
**Solución:** Asegurarse de hacer click en "Dibujar Polígono" primero

### Problema: Ciudad no encontrada
**Solución:** Usar nombres completos en español (ej: "Galeras" no "Galeraz")

### Problema: Zona no aparece en el mapa
**Solución:** Verificar que el polígono tiene al menos 3 puntos y la zona está guardada

### Problema: PostGIS no habilitado
**Solución:** Ejecutar: `CREATE EXTENSION IF NOT EXISTS postgis;`

## Checklist Final

- [ ] Módulo aparece en menú de Super Admin
- [ ] Puede crear zona con búsqueda de ciudad
- [ ] Puede dibujar polígono en el mapa
- [ ] Puede editar zona existente
- [ ] Puede ver estadísticas de zona
- [ ] Puede activar/desactivar zona
- [ ] Puede eliminar zona
- [ ] Historial registra todos los cambios
- [ ] Validación de cobertura funciona
- [ ] Horarios de operación se respetan
- [ ] Zonas superpuestas usan prioridad correcta
- [ ] Mapa muestra todas las zonas correctamente
- [ ] Responsive en móvil

---

**Si todos los tests pasan, el sistema está funcionando correctamente** ✅

Para reportar problemas:
- Revisar logs del navegador (F12 → Console)
- Verificar logs de Supabase
- Comprobar que las migraciones se aplicaron
- Confirmar que PostGIS está habilitado
