# Talent-match — modelo de costos de producción

## Objetivo

Mantener el costo operativo controlado mientras crece el producto. Las cifras de este documento son presupuestos de referencia, no métricas reales de facturación.

## Presupuesto inicial recomendado

Para un MVP comercial con pocos cientos de usuarios y consumo moderado:

- Firebase/Firestore/Storage: objetivo US$0–15/mes.
- Hosting/backend: objetivo US$0–15/mes.
- Gemini: objetivo US$5–20/mes.
- Observabilidad y margen operativo: US$5–10/mes.
- **Presupuesto total inicial:** US$20–60/mes.

No se debe escalar marketing hasta conocer el costo real por usuario activo y por función.

## Variables que deben medirse

Cada operación costosa debe poder asociarse a:

- `userId` anonimizado o interno.
- tipo de operación.
- feature.
- timestamp.
- proveedor.
- unidades consumidas.
- costo estimado.
- resultado/error.

Eventos mínimos:

- `AI_REQUEST`
- `STORAGE_UPLOAD`
- `STORAGE_DOWNLOAD`
- `FIRESTORE_READ`
- `FIRESTORE_WRITE`
- `PAYMENT_ATTEMPT`
- `PAYMENT_SUCCESS`
- `EXPORT_GENERATED`

## Reglas de protección

1. Nunca confiar en costos o rentabilidad hardcodeados como datos contables.
2. Los límites de IA deben existir por usuario/plan y también a nivel global.
3. No almacenar archivos binarios Base64 en Firestore.
4. Los uploads deben tener límites de tamaño y MIME.
5. Las operaciones de pago deben ser idempotentes y verificadas en backend.
6. El cache en memoria del proceso es válido como optimización inicial, pero no como cache distribuida cuando haya múltiples instancias.
7. Las alertas financieras deben basarse en eventos reales y no en datos simulados.

## Umbrales iniciales sugeridos

- Alerta IA: >80% del presupuesto mensual.
- Bloqueo/protección IA: >100% del presupuesto configurado.
- Alerta Storage: >80% del límite presupuestado.
- Alerta Firestore: >80% del presupuesto.
- Alerta de crecimiento anómalo: >2x promedio móvil de 7 días.

## Fórmula de unit economics

`margen de contribución = ingresos - Mercado Pago - IA - Firestore - Storage - hosting - otros costos variables`

`LTV/CAC` solo debe mostrarse cuando CAC y churn provengan de datos reales.

## Producción

Antes de activar tráfico comercial:

- configurar proyecto Firebase definitivo;
- configurar secretos fuera del repositorio;
- validar reglas de Firestore y Storage;
- ejecutar typecheck/build en CI;
- activar monitoreo de errores;
- verificar límites de IA;
- validar webhooks de pago e idempotencia;
- probar backup/restore de datos críticos.
