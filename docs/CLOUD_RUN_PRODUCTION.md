# TalentMatch — producción en Google Cloud Run

Esta guía deja preparada la rama `production-hardening` para un despliegue real sin almacenar credenciales en el repositorio.

## 1. Arquitectura de producción

- Runtime: Google Cloud Run.
- Puerto: Cloud Run proporciona `PORT`; el servidor usa `process.env.PORT` y escucha en `0.0.0.0`.
- Firebase Admin: Application Default Credentials del service account de Cloud Run. No se necesita subir un JSON de service account al repositorio.
- Frontend: el contenedor sirve `dist/` en modo producción.
- Health check: `GET /api/health`.

## 2. Secretos

Crear en Google Secret Manager y exponer al servicio de Cloud Run como variables de entorno:

- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `GEMINI_API_KEY`
- `ADMIN_MASTER_SECRET` si se utiliza el endpoint administrativo correspondiente.

No colocar valores reales de estos secretos en GitHub, Dockerfile, `.env` versionado ni en esta documentación.

## 3. Service account

El service account utilizado por Cloud Run debe disponer únicamente de los permisos necesarios para:

- Firestore/Cloud Firestore (lectura y escritura de las colecciones operativas de la aplicación).
- Firebase Storage si la aplicación realiza operaciones administrativas de archivos.
- Acceso de lectura a los secretos de Secret Manager utilizados por el servicio.

Evitar usar una cuenta con permisos de propietario del proyecto.

## 4. Variables no secretas

Configurar como mínimo:

```text
NODE_ENV=production
PUBLIC_APP_URL=https://<your-public-domain>
```

`PUBLIC_APP_URL` debe ser la URL HTTPS pública y estable de TalentMatch. En producción el backend rechaza una URL ausente, inválida o no HTTPS para evitar generar callbacks/redirects de Mercado Pago incorrectos.

No fijar manualmente `PORT`: Cloud Run lo inyecta.

## 5. Health check

Después del despliegue comprobar:

```text
GET https://<cloud-run-service-url>/api/health
```

Debe devolver HTTP 200 y un JSON con `status: "ok"`.

El endpoint no consulta Firestore ni Gemini, por lo que sirve como comprobación básica de disponibilidad del proceso.

## 6. Mercado Pago

El webhook de producción debe apuntar a:

```text
https://<cloud-run-service-url>/api/mercadopago/webhook
```

Mantener configurados `MERCADOPAGO_WEBHOOK_SECRET` y `MERCADOPAGO_ACCESS_TOKEN`. El backend valida la firma del webhook y verifica los pagos contra la API real de Mercado Pago.

## 7. Gemini

`GEMINI_API_KEY` es obligatoria para las rutas de IA. Si falta, las rutas protegidas deben responder con estado de servicio no disponible en lugar de simular una respuesta de IA.

## 8. Despliegue seguro

1. Construir la imagen con el Dockerfile del repositorio.
2. Publicarla en Artifact Registry.
3. Crear/actualizar el servicio Cloud Run usando la imagen.
4. Inyectar secretos desde Secret Manager.
5. Configurar `NODE_ENV=production` y `PUBLIC_APP_URL` con la URL HTTPS real.
6. Asignar el service account mínimo necesario.
7. Verificar `/api/health`.
8. Verificar autenticación Firebase y una operación de lectura no sensible.
9. Verificar Mercado Pago únicamente con credenciales reales y una transacción controlada.

No ejecutar una migración de datos ni cambiar reglas de Firestore como parte del primer despliegue sin una copia/plan de rollback.

## 9. Estado de calidad conocido

El build de producción es actualmente el gate de CI. El typecheck estricto continúa siendo **advisory** debido a deuda de tipos existente en la UI y servicios legacy; no debe interpretarse como typecheck limpio.

Antes de convertir el typecheck en gate obligatorio, deben corregirse los errores tipados ya identificados en componentes de UI, tipos de usuario/atleta, iconos Lucide, Firebase y servicios legacy.
