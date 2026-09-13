# TalentMatch — continuación de auditoría de hardening

Rama: `production-hardening` (sin modificar `main`).

## Hallazgos verificados

- Las rutas administrativas del servidor están bajo `/api/admin/` y protegidas por `requireAdmin`.
- Las rutas financieras sensibles están protegidas y marcadas como `MODELLED`; no deben presentarse como métricas financieras reales.
- No existe un endpoint funcional `grant-admin` en el servidor.
- El seed inicial de Firestore está condicionado por `isDemoMode()` y no se ejecuta en build de producción.
- Los datos `INITIAL_*` siguen existiendo para demo/desarrollo y deben permanecer aislados del flujo productivo.
- Se detectó deuda de UI en `src/App.tsx`: valores iniciales sintéticos para `growthProfile`, `applications`, `notifications` y banderas PRO. Antes del lanzamiento deben quedar condicionados explícitamente a modo demo o sustituirse por estado real.
- Las reglas Firestore son restrictivas; hay que validar las consultas frontend de `searches`, `teams`, `tournaments`, `applications`, `conversations`, `notifications`, `reviews` y colecciones administrativas contra esas reglas.

## Pendientes

1. Eliminar/aislar defaults sintéticos de `src/App.tsx` en producción.
2. Completar la matriz frontend ↔ Firestore Rules.
3. Ejecutar Quality Gate y Docker Build sobre el HEAD final.
4. Configurar en Cloud Run `NODE_ENV=production` y `PUBLIC_APP_URL` HTTPS real, además de los secretos de Mercado Pago y Gemini mediante Secret Manager.
5. Verificar `/api/health`, autenticación y una operación no sensible en el servicio desplegado.
6. Realizar una prueba controlada de Mercado Pago con credenciales reales y webhook firmado.
