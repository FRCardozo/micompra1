# 🗺️ Sistema de Cobertura de Servicio

## Descripción General

El sistema de cobertura permite al Super Administrador definir, gestionar y controlar las zonas geográficas donde la plataforma ofrece sus servicios, usando un mapa visual e interactivo.

## 🎯 Características Principales

### A) Selección por Ciudad o Municipio
- ✅ Buscador integrado de ciudades/municipios (API de OpenStreetMap)
- ✅ Centrado automático del mapa al seleccionar ubicación
- ✅ Reconocimiento de límites municipales

### B) Definición del Perímetro de Cobertura
- ✅ Dibujo interactivo de polígonos sobre el mapa
- ✅ Ajuste de bordes con puntos movibles
- ✅ Soporte para múltiples zonas por ciudad
- ✅ Representación exacta del área de servicio

### C) Activar/Desactivar Cobertura
- ✅ Toggle de activación por zona
- ✅ Nombres personalizados (ej: "Zona Centro", "Zona Norte")
- ✅ Control de visibilidad para usuarios

### D) Reglas por Zona
Configuración individual para cada zona:
- ✅ Costo base de envío
- ✅ Tiempo estimado de entrega
- ✅ Horarios de operación
- ✅ Tiendas habilitadas
- ✅ Domiciliarios habilitados
- ✅ Prioridad (para zonas superpuestas)

### E) Vista de Impacto
Métricas por zona:
- ✅ Número de pedidos históricos
- ✅ Demanda promedio
- ✅ Horas pico
- ✅ Domiciliarios activos
- ✅ Tiendas activas en el perímetro

### F) Simulación de Usuario
- 🔄 En desarrollo (próxima versión)

### G) Comportamiento para Usuario Final
- ✅ Validación de cobertura en tiempo real
- ✅ Mensajes claros cuando no hay cobertura
- ✅ Restricción de pedidos fuera del área

### H) Historial y Control
- ✅ Registro automático de todos los cambios
- ✅ Auditoría completa (quién, cuándo, qué)
- ✅ Sistema de versiones para revertir cambios

## 🗂️ Estructura de Base de Datos

### Tablas Creadas

1. **coverage_zones** - Zonas de cobertura
   - Información geográfica (ciudad, coordenadas, polígono)
   - Configuración (costos, tiempos, horarios)
   - Estado activo/inactivo
   - Prioridad para zonas superpuestas

2. **coverage_history** - Historial de cambios
   - Registro automático de operaciones
   - Auditoría completa de modificaciones
   - Trazabilidad de cambios

3. **coverage_zone_stores** - Tiendas por zona
   - Relación zona-tienda
   - Habilitación individual

4. **coverage_zone_drivers** - Domiciliarios por zona
   - Asignación zona-conductor
   - Control de disponibilidad

5. **coverage_zone_stats** - Estadísticas por zona
   - Métricas diarias
   - Análisis de demanda
   - Horas pico

### Funciones de Base de Datos

- **is_point_in_coverage()** - Verifica si un punto está dentro de una zona activa
- **log_coverage_change()** - Registra cambios automáticamente
- **update_coverage_updated_at()** - Actualiza timestamps

## 📁 Archivos Creados

### Componentes React
```
src/components/
├── Coverage.jsx              # Componente principal
├── CoverageMap.jsx          # Mapa interactivo con Leaflet
├── ZoneModal.jsx            # Editor de zonas
└── ZoneStatsModal.jsx       # Estadísticas de zona
```

### Páginas
```
src/pages/admin/
└── Coverage.jsx             # Página admin de cobertura
```

### Utilidades
```
src/lib/
└── coverageHelper.js        # Funciones de validación geoespacial
```

### Migraciones
```
supabase/migrations/
├── 20251228030920_create_coverage_system.sql
└── 20251228031041_enable_postgis.sql
```

## 🚀 Cómo Usar el Sistema

### Para Super Administrador:

1. **Acceder al módulo:**
   - Ir al menú lateral → "Cobertura" 📍

2. **Crear nueva zona:**
   - Clic en "Nueva Zona"
   - Buscar ciudad/municipio en el buscador
   - El mapa se centra automáticamente
   - Completar información básica (nombre, descripción)

3. **Dibujar perímetro:**
   - Clic en "Dibujar Polígono"
   - Hacer clic en el mapa para agregar puntos
   - Mínimo 3 puntos para formar el área
   - Clic en "Terminar" cuando esté completo
   - Opción "Limpiar" para reiniciar

4. **Configurar zona:**
   - Costo base de envío
   - Tiempo estimado de entrega
   - Prioridad (mayor número = mayor prioridad)
   - Estado (activa/inactiva)

5. **Guardar zona:**
   - Clic en "Crear Zona"
   - Visualización inmediata en el mapa

6. **Gestionar zonas existentes:**
   - Ver todas las zonas en el mapa principal
   - Hacer clic en zona para editar
   - Botón de estadísticas para ver métricas
   - Toggle para activar/desactivar
   - Eliminar zonas obsoletas

### Para Desarrolladores:

#### Validar Cobertura (Cliente)
```javascript
import { validateCoverage } from '../lib/coverageHelper';
import { supabase } from '../lib/supabase';

// Cargar zonas
const { data: zones } = await supabase
  .from('coverage_zones')
  .select('*')
  .eq('is_active', true);

// Validar punto
const point = { lat: 8.9167, lng: -75.1833 };
const result = validateCoverage(point, zones);

if (result.available) {
  console.log('Servicio disponible en:', result.zone.name);
  console.log('Costo base:', result.zone.base_delivery_cost);
} else {
  console.log('Sin cobertura:', result.message);
}
```

#### Verificar Horarios
```javascript
import { isZoneOperating } from '../lib/coverageHelper';

if (isZoneOperating(zone)) {
  console.log('Zona operando actualmente');
} else {
  console.log('Zona fuera de horario');
}
```

## 🔧 Tecnologías Utilizadas

- **Leaflet.js** - Mapas interactivos
- **React Leaflet** - Integración con React
- **PostGIS** - Funciones geoespaciales en PostgreSQL
- **OpenStreetMap** - Tiles de mapas y geocoding
- **Supabase** - Backend y base de datos

## 📊 Algoritmos Geoespaciales

### Point-in-Polygon (Ray Casting)
Algoritmo para determinar si un punto está dentro de un polígono:
```javascript
function isPointInPolygon(point, polygon) {
  // Ray casting algorithm
  // Traza una línea desde el punto hacia el infinito
  // Cuenta cuántos bordes del polígono cruza
  // Si es impar = dentro, si es par = fuera
}
```

### Haversine Distance
Cálculo de distancia entre dos puntos geográficos:
```javascript
function calculateDistance(point1, point2) {
  // Fórmula de Haversine
  // Considera la curvatura de la Tierra
  // Resultado en kilómetros
}
```

## 🎨 Interfaz de Usuario

### Colores por Estado
- 🟢 Verde: Zona activa
- ⚫ Gris: Zona inactiva
- 🔵 Azul: Polígono en edición

### Controles Visuales
- ✏️ Editar zona
- 📊 Ver estadísticas
- 🔄 Activar/Desactivar
- 🗑️ Eliminar zona
- ➕ Crear nueva zona

## 📝 Datos de Ejemplo

El sistema incluye una zona de ejemplo:
- **Nombre:** Centro - Galeras
- **Ciudad:** Galeras, Sucre
- **Estado:** Activa
- **Costo base:** $2,000
- **Tiempo estimado:** 30 minutos

## 🔐 Seguridad

- ✅ RLS deshabilitado (acceso controlado por roles)
- ✅ Auditoría completa de cambios
- ✅ Validación de permisos en rutas
- ✅ Solo Super Admin puede modificar

## 🚀 Próximas Mejoras

- [ ] Simulación de cliente en zona
- [ ] Importar/Exportar zonas (GeoJSON)
- [ ] Análisis de demanda predictivo
- [ ] Sugerencias automáticas de expansión
- [ ] Integración con Google Maps
- [ ] Notificaciones cuando entras/sales de zona
- [ ] Heatmap de demanda
- [ ] Optimización de rutas por zona

## 📞 Soporte

Para preguntas o problemas:
1. Revisar logs del navegador (console)
2. Verificar que PostGIS está habilitado
3. Confirmar que las zonas tienen >= 3 puntos
4. Validar formato de coordenadas

---

**¡El sistema está listo para usar!** 🎉

Accede desde el menú de Super Admin → Cobertura 📍
