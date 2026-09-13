# TalentMatch — Registro de producción y hardening

> Documento vivo de trabajo. Debe consultarse **antes de continuar una auditoría o corrección** y actualizarse después de cada avance relevante. El objetivo es evitar repetir descubrimientos, rehacer trabajos o depender de memoria conversacional.

## Reglas de trabajo

- Rama de trabajo: `production-hardening`.
- **No modificar `main`.**
- No guardar secretos, tokens, credenciales, CBU ni datos bancarios reales en Git.
- Registrar aquí descubrimientos, decisiones, correcciones, verificaciones y pendientes.
- Cada nueva sesión debe comenzar revisando este documento y el estado actual de la rama.
- No marcar algo como verificado si no existe evidencia de repositorio/CI/prueba correspondiente.

## Estado ejecutivo

**Objetivo:** dejar TalentMatch preparado para producción en Google Cloud Run con Firebase, Gemini y Mercado Pago reales, sin simulaciones inseguras ni datos financieros ficticios.

**Estado actual:** hardening avanzado; todavía no declarar producción lista hasta cerrar compatibilidad de reglas/frontend, validar CI sobre el HEAD final, configurar Cloud Run/Secret Manager y ejecutar una prueba controlada real de Mercado Pago.

## Arquitectura y despliegue

- Destino de producción: Google Cloud Run.
- El contenedor usa `PORT` y escucha en `0.0.0.0`.
- Firebase Admin debe usar Application Default Credentials del service account de Cloud Run; no subir JSON de service account al repositorio.
- Health check: `GET /api/health`.
- Producción requiere `PUBLIC_APP_URL` con HTTPS.
- Secretos esperados fuera del repositorio: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `GEMINI_API_KEY`; `ADMIN_MASTER_SECRET` solo si continúa existiendo algún endpoint administrativo que lo necesite.
- También debe configurarse el service account de Cloud Run con privilegio mínimo.

## Mercado Pago — hallazgos y correcciones

### Planes canónicos

- `plan-ath-pro`: ARS 4.990/mes.
- `plan-club-pro`: ARS 19.900/mes.
- Planes básicos: gratuitos.
- El backend usa una tabla canónica y no acepta que el cliente imponga el precio.

### Cupones vigentes

- `PROMO50`: 50%.
- `ARGENTINA50`: 50%.
- `PRO2025`: 30%.
- `CLUB30`: 30%.

Retirados: `TALENT100`, `PROMO100`, `TALENT20` y el antiguo `PRUEBA100`.

Existe una comprobación defensiva histórica para `TALENT100`/`PROMO100` en webhook; no son cupones válidos en la tabla actual. Es deuda de limpieza, no una vía válida de descuento.

### Seguridad implementada

- `requireFirebaseUser` verifica el token Firebase y sobreescribe identidad sensible con la identidad autenticada.
- `enforceServerPrice` deriva plan/precio desde el catálogo canónico.
- El cliente ya no controla `originalPrice`; la solicitud de cupón usa `planId`.
- `rejectSimulatedPreferenceResponse` bloquea respuestas simuladas/falsas de preferencia.
- `verifyPaymentAgainstMercadoPago` consulta el pago real y valida estado, usuario, referencia, plan, precio final y cupón.
- Webhook valida `MERCADOPAGO_WEBHOOK_SECRET`, timestamp, HMAC SHA-256 y comparación constant-time.
- Idempotencia de webhook mediante `mercadopagoWebhookEvents`; queda como mejora pendiente evitar la carrera teórica de dos eventos simultáneos antes de crear el documento.
- Ledger de pagos en Firestore evita reprocesamiento normal del mismo `paymentId`.
- Cancelación no implementada devuelve 501 en vez de simular éxito.

### Activación Premium

Webhook aprobado y consistente con referencia/precio/cupón activa Premium durante 30 días y conserva metadatos de plan, pago, importe y cupón. La fecha se extiende desde una expiración futura válida cuando corresponde.

## Firebase / Firestore

### Reglas

- Admin basado en custom claims (`admin == true` o `role == 'admin'`).
- Campos Premium protegidos contra escritura del cliente no-admin.
- Identidad/IDs sensibles de aplicaciones y perfiles tienen invariantes de inmutabilidad.
- `publicAthletes` solo lectura de documentos `published == true`; escrituras admin.
- Colecciones operativas sensibles (`aiUsageDaily`, `mercadopagoWebhookEvents`, etc.) no tienen acceso directo del cliente cuando corresponde.
- Catch-all de Firestore deniega por defecto.

### Storage

- Usuarios/atletas: lectura para propietario/admin; escritura con validación de tipo/tamaño; borrado propietario/admin.
- Público: lectura pública; escritura/borrado admin con validación.
- Límite de upload: 20 MB.
- Tipos permitidos: imagen/video/PDF según regla.

### Compatibilidad pendiente

Se debe terminar el cruce entre reglas y consultas frontend. Hay funciones de servicio que hacen `getDocs` sobre `athletes`, `searches`, etc.; las reglas endurecidas pueden bloquear consultas legítimas si no están alineadas con ownership/rol. No asumir compatibilidad sin revisar cada flujo.

## Demo / datos de prueba

La aplicación contiene `INITIAL_*` en `src/data/mockData.ts` y una función `seedInitialFirestoreDataIfNeeded()`.

Hallazgo importante: el seeding está condicionado por `isDemoMode()`. Si `VITE_DEMO_MODE` no está definido, `isDemoMode()` devuelve `!import.meta.env.PROD`, por lo que una build de desarrollo puede sembrar datos de demostración, mientras una build de producción no debe hacerlo.

Debe verificarse dónde se invoca el seeding y que jamás se ejecute en producción, además de revisar que no existan credenciales/demo accounts reales embebidas.

## Identidad / administración

- El registro público recibe un `role`, pero si recibe `admin` se transforma a rol de usuario normal; el cliente no puede autoelevarse a admin mediante ese flujo.
- El endpoint `grant-admin` fue eliminado anteriormente.
- `requireAdmin` y custom claims deben revisarse en conjunto con todos los endpoints administrativos.
- No confiar en `role` almacenado en un documento de usuario para autorización privilegiada; usar claims/token en backend.

## IA y costes

- `GEMINI_API_KEY` es obligatoria; las rutas de IA deben responder 503 si falta, sin simular resultados.
- Límite persistente diario de IA en Firestore.
- Free: 5 solicitudes/día; Premium: 100/día.
- Solicitud AI limitada a 100 KB, hasta 30 candidatos y 4.000 caracteres de texto.
- Los errores de IA se sanitizan.
- La cuota se reserva antes de la llamada real; una llamada fallida puede consumir cuota. Es un asunto de UX/coste, no un bypass de seguridad.

## Métricas financieras y analytics

- Se eliminaron KPIs financieros sintéticos como ARPU/CAC/churn/LTV inventados.
- El estado financiero actual es neutral en cero cuando no existe dato real conectado.
- Los endpoints financieros son admin-only y marcados `MODELLED` cuando corresponde.
- Analytics no debe presentarse como dato financiero real sin fuente real.

## CI/CD

Workflows permanentes previstos:

- `.github/workflows/quality.yml`: Bun 1.4.2, `bun install --frozen-lockfile`, build y typecheck.
- `.github/workflows/docker-build.yml`: Docker Buildx, build sin push, cache GHA.

Histórico: hubo workflows temporales de hardening que ya fueron eliminados.

**Pendiente:** el HEAD anterior no tenía ejecución de workflows asociada; después de crear/actualizar este registro debe verificarse el nuevo commit y sus ejecuciones Quality Gate + Docker.

## Historial de avances relevantes

- Eliminación de monkey-patching de Express para Mercado Pago y uso de middleware explícito.
- Exportación y conexión del middleware de seguridad de Mercado Pago.
- Hardening de `applications`: autenticación, pertenencia de club a búsqueda, IDs inmutables.
- Public discovery limitado a perfiles publicados.
- Allowlist de proyecciones públicas.
- Protección de `athlete.userId` contra cambios del cliente.
- Aislamiento de cache AI.
- Eliminación de token MP hardcodeado/fallback inseguro.
- Verificación real de pagos MP.
- Firestore rules endurecidas y Storage rules corregidas.
- Premium protegido contra escrituras del cliente y expiración validada.
- Eliminación de endpoint `grant-admin`.
- Reglas de inputs financieros endurecidas.
- Cuota AI persistente.
- Gemini obligatorio.
- Bun/Docker/CI fijados a versiones reproducibles.
- Eliminación de datos financieros ficticios.

## Registro cronológico

### 2026-09-13 — Creación del registro persistente

**Acción:** se crea este documento en `production-hardening` para centralizar descubrimientos, avances y planificación.

**Propósito:** consultar este archivo antes de cada nueva fase y actualizarlo después de cada corrección/verificación.

**Estado heredado:** Mercado Pago, Firebase/Storage, IA, métricas financieras, Cloud Run y endurecimiento de aplicaciones ya fueron trabajados; quedan por cerrar auditoría administrativa, demo/seed, compatibilidad de reglas con frontend, CI sobre HEAD actual y configuración/prueba real de producción.

### 2026-09-13 — Auditoría inicial de demo/producción

**Hallazgo:** `seedInitialFirestoreDataIfNeeded()` importa múltiples `INITIAL_*` de `mockData.ts`, pero tiene guardia explícita `if (!isDemoMode()) return`. Esto reduce el riesgo de sembrado accidental en producción.

**Hallazgo:** `registerUser()` convierte explícitamente `role === 'admin'` a rol de usuario normal; por tanto el selector de rol del cliente no concede privilegios administrativos.

**Hallazgo:** `.env.example` contiene variables de secretos vacías, sin credenciales reales. Cloud Run documentation exige inyectarlas desde Secret Manager/entorno, no desde Git.

**Pendiente inmediato:** localizar todas las llamadas a `seedInitialFirestoreDataIfNeeded`, todas las rutas `requireAdmin`/`/api/admin`, y consultas frontend afectadas por las nuevas Firestore rules.

## Plan de trabajo siguiente

1. Auditar exhaustivamente endpoints administrativos y operaciones privilegiadas.
2. Auditar demo/mock/seed y credenciales de prueba; garantizar cero seed en producción.
3. Cruzar Firestore rules contra todas las consultas/escrituras frontend por colección.
4. Corregir cualquier incompatibilidad encontrada sin debilitar seguridad.
5. Resolver la carrera teórica de idempotencia de webhook si es posible sin complejidad innecesaria.
6. Revisar deuda de typecheck y decidir qué errores deben ser bloqueantes antes de producción.
7. Verificar CI Quality Gate y Docker sobre el HEAD final de `production-hardening`.
8. Revisar configuración de Cloud Run/Secret Manager y `PUBLIC_APP_URL` real sin inventar valores.
9. Ejecutar prueba controlada real de Mercado Pago y verificar webhook/Premium/ledger.
10. Auditoría final y checklist de go-live.

## Formato obligatorio para futuras actualizaciones

Cada avance debe añadir una entrada con:

- **Fecha**
- **Acción realizada**
- **Archivos/áreas afectadas**
- **Hallazgos**
- **Correcciones aplicadas**
- **Evidencia/verificación**
- **Pendientes nuevos**
- **Commit SHA**, cuando exista

Nunca borrar descubrimientos históricos salvo que se marque explícitamente como superseded/obsolete y se conserve la razón.
