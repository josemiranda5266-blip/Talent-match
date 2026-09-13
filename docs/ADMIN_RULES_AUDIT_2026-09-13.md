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
- El endpoint de analytics no debe considerarse fuente productiva: sus valores están neutralizados/modelados hasta conectar una fuente persistente real.
- `PUBLIC_APP_URL` es obligatoria en producción y debe ser HTTPS; las credenciales de Mercado Pago y Gemini deben inyectarse fuera del repositorio.

## Riesgos/pendientes no bloqueantes de código

- Completar una prueba E2E real con Firebase, una cuenta normal y una cuenta administrativa para validar las reglas contra las consultas reales del frontend.
- Configurar Cloud Run y Secret Manager con valores reales del entorno de producción.
- Ejecutar una transacción controlada de Mercado Pago y verificar el webhook firmado.
- El typecheck estricto mantiene deuda legacy conocida; el build de producción continúa siendo el gate principal.

## Seguridad de rama

No se modifica `main`. Este documento existe únicamente para registrar el estado de la auditoría en `production-hardening` y disparar la validación CI del HEAD resultante.
