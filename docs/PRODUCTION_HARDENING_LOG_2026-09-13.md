# TalentMatch — continuación de auditoría de hardening

Rama: `production-hardening` (sin modificar `main`).

## Hallazgos verificados

- Las rutas administrativas del servidor están bajo `/api/admin/` y protegidas por `requireAdmin`.
- Las rutas financieras sensibles están protegidas y marcadas como `MODELLED`; no deben presentarse como métricas financieras reales.
- No existe un endpoint funcional `grant-admin` en el servidor.
- El seed inicial de Firestore está condicionado por `isDemoMode()` y no se ejecuta en build de producción.
- Los datos `INITIAL_*` siguen existiendo para demo/desarrollo y deben permanecer aislados del flujo productivo.
- Se detectó deuda de UI en `src/App.tsx`: valores iniciales sintéticos para `growthProfile`, `applications`, `notifications` y banderas PRO. Antes del lanzamiento deben quedar condicionados explícitamente a modo demo o sustituirse por estado real.
- El endpoint `/api/analytics/summary` todavía contiene un conjunto de KPIs/infraestructura numéricos hardcodeados. Aunque está protegido por `requireAdmin` y marcado como `MODELLED`, esos valores deben eliminarse o reemplazarse por datos reales antes de usar el panel en producción.
- Las reglas Firestore son restrictivas; las lecturas de `searches`, `teams`, `tournaments`, `applications`, `conversations`, `notifications`, `reviews` y colecciones administrativas no pueden asumirse compatibles sin revisar cada llamada frontend.
- La fachada de `firebaseService` ya deriva las lecturas públicas de atletas, búsquedas, equipos y torneos a proyecciones públicas; esto evita que el listado público dependa de reglas privadas de las colecciones operativas.

## Pendientes

1. Eliminar/aislar defaults sintéticos de `src/App.tsx` en producción.
2. Eliminar los KPIs hardcodeados de `/api/analytics/summary` y devolver `NO_DATA`/métricas reales hasta disponer de una fuente persistente.
3. Completar la matriz frontend ↔ Firestore Rules para operaciones privadas.
4. Ejecutar Quality Gate y Docker Build sobre el HEAD final.
5. Configurar en Cloud Run `NODE_ENV=production` y `PUBLIC_APP_URL` HTTPS real, además de los secretos de Mercado Pago y Gemini mediante Secret Manager.
6. Verificar `/api/health`, autenticación y una operación no sensible en el servicio desplegado.
7. Realizar una prueba controlada de Mercado Pago con credenciales reales y webhook firmado.

## Estado de esta revisión

- La rama sigue aislada de `main`.
- Se mantiene el objetivo de no convertir datos modelados/demo en métricas de producción.
- Se solicita una nueva ejecución de CI sobre el HEAD resultante para cerrar la validación técnica del artefacto.