# TalentMatch — auditoría de administración y producción

Rama: `production-hardening`.

## Verificado

- Las rutas administrativas del servidor se agrupan bajo `/api/admin/` y se protegen mediante `requireAdmin`.
- Las rutas financieras sensibles requieren autenticación y privilegios administrativos, y se marcan como `MODELLED` mientras no exista telemetría contable real.
- `requireAdmin` acepta únicamente claims de Firebase `admin == true` o `role == 'admin'`.
- El alta normal de usuarios no puede crear un administrador: el rol solicitado `admin` se normaliza a `athlete` en la capa de registro.
- No existe un endpoint funcional `grant-admin` en el servidor.
- El seed de datos iniciales está deshabilitado cuando el build corre en producción; los `INITIAL_*` quedan reservados para demo/desarrollo.
- La fachada de servicios usa proyecciones públicas para los listados públicos de atletas, búsquedas, equipos y torneos.
- `PUBLIC_APP_URL` es obligatoria en producción y debe ser HTTPS; las credenciales de Mercado Pago y Gemini deben inyectarse fuera del repositorio.
- `.env.example` contiene únicamente placeholders y no valores reales de credenciales.
- `/api/analytics/summary` devuelve `NO_DATA` y `REAL_RUNTIME_ONLY`; no presenta KPIs históricos sintéticos como métricas de producción.
- El workflow temporal de endurecimiento financiero fue eliminado; no queda un workflow de GitHub Actions con permisos de escritura para auto-modificar `server.ts`.

## Hallazgos pendientes

- **Demo data en bundle:** `src/data/mockData.ts` contiene fixtures de desarrollo. El seed está bloqueado en producción, pero esos datos siguen formando parte del código fuente y pueden terminar en el bundle si son importados por la UI. Antes del despliegue público conviene separar los fixtures del código de producción o anonimizar cualquier dato de contacto.
- **Reglas/frontend:** falta una prueba E2E real con Firebase que confirme que las consultas de usuarios normales coinciden con las reglas endurecidas, especialmente `searches`, `teams`, `tournaments`, `applications`, conversaciones/mensajes y notificaciones.
- **Idempotencia Mercado Pago:** el ledger protege por `paymentId`, pero una carrera simultánea antes de crear el documento de idempotencia todavía merece una prueba de concurrencia en producción controlada.

## Pendientes externos

- Configurar Cloud Run y Secret Manager con valores reales del entorno de producción.
- Ejecutar una transacción controlada de Mercado Pago y verificar el webhook firmado.
- Ejecutar una prueba E2E con Firebase/Authentication real sobre las operaciones principales.
- El typecheck estricto mantiene deuda legacy conocida; el build de producción continúa siendo el gate principal.

## Seguridad de rama

No se modifica `main`. Este documento registra el estado de la auditoría en `production-hardening` y se mantiene separado del flujo de producción hasta cerrar los pendientes anteriores.
