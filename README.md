# SW-000: Plataforma Base de Desarrollo de Software

## Descripcion General

SW-000 es una solucion base (boilerplate / starter template) full-stack orientada a entornos corporativos y aplicaciones web escalables. Su proposito principal es proporcionar una arquitectura estandarizada, desacoplada, auditada y con seguridad multidimensional que sirva como cimiento solido para proyectos de software futuros, eliminando la necesidad de reconstruir infraestructura comun en cada nuevo desarrollo.

El sistema desacopla completamente el cliente web y la API RESTful mediante contratos tipados estrictos en TypeScript, gestionando de forma nativa autenticacion, control de acceso granular, registro de auditoria, ciclo de vida de entidades y reactividad de interfaz.

---

## Principios de Diseno

- Modularidad estricta: Separacion clara de responsabilidades por dominios y capas tecnicas.
- Tipado riguroso: TypeScript de extremo a extremo (Frontend y Backend) sin uso de tipos opacos o permisivos.
- Seguridad transversal: Autenticacion robusta mediante JWT con refresco automatico, OAuth2, integracion de captcha y modelo de permisos en cuatro dimensiones (4D).
- Reactividad moderna: Arquitectura orientada a senales (Signals) en el cliente, evitando sobrecarga de suscripciones manuales de RxJS en componentes de interfaz.
- Auditoria centralizada: Trazabilidad completa de operaciones criticas y cambios de estado en base de datos.
- Despliegue reproducible: Infraestructura de persistencia y cache empaquetada y versionada mediante Docker Compose.

---

## Arquitectura Tecnica

### Backend (API RESTful)

- Framework: NestJS v12 sobre plataforma Express en modo ECMAScript Modules (ESM).
- Persistencia relacional: TypeORM con base de datos MySQL 8.4 LTS y esquema gestionado mediante migraciones y semillas versionadas.
- Cache y gestion de estado distribuido: Redis 7 (Alpine) a traves del cliente ioredis.
- Motor de autorizacion: Integracion de CASL (@casl/ability) con extension de motor de reglas de campos y maquina de estados de flujo de trabajo.
- Autenticacion y proteccion perimetral: Passport (estrategias local y JWT), Google OAuth2, Google reCAPTCHA v2 y hashing criptografico con bcrypt.
- Mensajeria y notificaciones: Nodemailer configurado con plantillas para restablecimiento de credenciales, emision de contrasenas temporales y avisos del sistema.
- Validacion y serializacion: class-validator y class-transformer con tuberias globales (ValidationPipe) en modo lista blanca.
- Documentacion de API: Generacion automatica OpenAPI / Swagger accesible en `/api/docs`.
- Calidad y pruebas: Vitest para pruebas unitarias y de integracion, Oxlint para analisis estatico de alto rendimiento y Prettier para formateo uniforme.

### Frontend (Single Page Application)

- Framework: Angular v21 en arquitectura Standalone (sin NgModules).
- Reactividad de estado: Signals (`signal`, `computed`, `effect`, `linkedSignal`) para sincronizacion granular de UI con deteccion de cambios Zoneless.
- Biblioteca de componentes: PrimeNG v21 (Aura Theme, PrimeIcons, DrawerModule, TableModule, ToastModule, ConfirmDialog, etc.).
- Capa de diseno y estilos: Tailwind CSS v4 con paleta monocromatica, estados de foco accesibles y diseño responsivo.
- Internacionalizacion (i18n): Integracion de @ngx-translate/core y traducciones oficiales del diccionario de PrimeLocale en espanol.
- Enrutamiento y navegacion: Angular Router con Functional Route Guards (`authGuard`, `guestGuard`) e Interceptores HTTP funcionales para inyeccion transparente de Bearer Tokens y captura global de respuestas 401/403/500.
- Calidad y pruebas: Vitest con entorno simulado jsdom y Angular Testing Library.

---

## Motor de Permisos y Autorizacion 4D

La plataforma implementa un modelo de control de acceso multidimensional (4D) disenado para superar las limitaciones de los sistemas tradicionales de RBAC simple:

```
[1D: Rol del Usuario]
       |
       v
[2D: Permisos de Modulo y Accion (CASL)]
       |
       v
[3D: Permisos de Campo por Estado (ABAC)]
       |
       v
[4D: Transiciones de Ciclo de Vida (Workflow State Machine)]
```

1. Dimension 1 - Roles del Sistema:
   Clasificacion base de usuarios (`SUPERADMIN`, `ADMIN`, `USER`, roles corporativos a medida).

2. Dimension 2 - Acciones y Sujetos (CASL):
   Definicion estandar de operaciones (`create`, `read`, `update`, `delete`, `manage`) sobre recursos especificos del sistema (`User`, `Role`, `AuditLog`, `Module`, etc.) con soporte para condiciones invertidas.

3. Dimension 3 - Permisos de Campo Condicionados por Estado (ABAC):
   Control dinámico de atributos que determina que campos exactos pueden ser editados o visualizados en modo solo lectura segun el estado actual de la entidad y el rol del actor (por ejemplo: un usuario en estado `INACTIVE` solo permite modificar campos de auditoria y estado por parte de un Administrador).

4. Dimension 4 - Transiciones de Ciclo de Vida (State Machine):
   Validacion estricta de transiciones de estado permitidas por rol para cada modulo de negocio (por ejemplo: en usuarios, `ACTIVE -> INACTIVE`, `INACTIVE -> ACTIVE`, `ACTIVE -> DELETED`, `INACTIVE -> DELETED`). Bloquea mutaciones de estado no autorizadas antes de persistir en base de datos.

---

## Estructura del Proyecto

```
SW-000/
├── backend/
│   ├── docker-compose.yml              # Definicion de contenedores MySQL 8.4 y Redis 7
│   ├── .env.example                    # Plantilla de variables de entorno del servidor
│   ├── vitest.config.ts                # Configuracion de ejecucion de pruebas unitarias
│   ├── oxlint.json                     # Configuracion de linter de alto desempeno
│   └── src/
│       ├── main.ts                     # Punto de entrada de la API y configuracion global
│       ├── app.module.ts               # Modulo raiz de inyeccion de dependencias
│       ├── config/                     # Configuracion tipada de base de datos, jwt y cache
│       ├── database/                   # Data source TypeORM, migraciones y semillas
│       │   └── seeds/run-seeds.ts      # Sembrador inicial de roles, modulos y usuarios
│       ├── auth/                       # Controladores, servicios, estrategias y guards JWT
│       ├── users/                      # Logica de negocio, DTOs y persistencia de usuarios
│       ├── roles/                      # Definicion y asignacion de roles del sistema
│       ├── permissions/                # Matriz de permisos y factoria de habilidades CASL
│       ├── workflow-engine/            # Entidades y servicios de transiciones y campos 4D
│       ├── modules-registry/           # Registro dinamico de modulos y entrega de menus
│       ├── audit-logs/                 # Registro y consulta de pistas de auditoria
│       ├── captcha/                    # Validacion de Google reCAPTCHA v2
│       ├── mail/                       # Servicio de despacho de correos electronicos
│       ├── redis/                      # Modulo y servicio cliente de cache Redis
│       └── common/                     # Decoradores, filtros de excepcion e interceptores
│
├── frontend/
│   ├── angular.json                    # Configuracion de compilacion y presupuesto de bundle
│   ├── tsconfig.json                   # Configuracion estricta de TypeScript
│   └── src/
│       ├── main.ts                     # Arranque de aplicacion standalone
│       ├── index.html                  # Plantilla HTML raiz
│       ├── styles.css                  # Directivas de Tailwind CSS v4 y temas de PrimeNG
│       └── app/
│           ├── app.config.ts           # Proveedores globales (Router, Translate, Toast, etc.)
│           ├── app.routes.ts           # Definicion declarativa de rutas y guards
│           ├── core/                   # Servicios transversales y singleton
│           │   ├── environments/       # Parametrizacion por entorno (dev, prod)
│           │   ├── guards/             # Guards funcionales de autenticacion y roles
│           │   ├── interceptors/       # Inyeccion de token JWT y control de errores HTTP
│           │   ├── layouts/            # Plantillas estructurales (MainLayout, Sidebar, Navbar)
│           │   ├── models/             # Interfaces, enums y tipos globales
│           │   └── services/           # Autenticacion, traduccion y registro de modulos
│           ├── features/               # Modulos funcionales de negocio (Lazy Loaded)
│           │   ├── auth/               # Vistas de Login, Recuperacion y Restablecimiento
│           │   └── users/              # Listado en tabla, filtros avanzados y modal de usuario
│           └── shared/                 # Componentes y utilidades reutilizables
│               ├── components/         # Componentes especificos (e.g. ui-captcha)
│               └── services/           # Servicio de notificaciones (PrimeNG MessageService)
└── README.md
```

---

## Requisitos Previos

- Node.js: Version 20.11.0 LTS o superior (recomendado Node 22+).
- Gestor de paquetes: npm version 10 o superior.
- Docker & Docker Compose: Motor Docker activo para MySQL y Redis.
- Git: Para versionado del repositorio.

---

## Puesta en Marcha

### 1. Clonacion y Navegacion

```bash
git clone git@github.com:Juancalero01/SW-000.git
cd SW-000
```

### 2. Configuracion del Backend

1. Crear el archivo de variables de entorno a partir de la plantilla:

```bash
cd backend
cp .env.example .env
```

2. Ajustar los parametros requeridos en `backend/.env`:
   - `PORT`: Puerto de escucha del servidor (por defecto 3000).
   - `JWT_SECRET`: Clave criptografica para firma de tokens.
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Credenciales de MySQL.
   - `REDIS_HOST`, `REDIS_PORT`: Credenciales de conexion de Redis.
   - `RECAPTCHA_SECRET_KEY`: Llave de validacion de Google reCAPTCHA.
   - `SMTP_USER`, `SMTP_PASS`: Credenciales de envio de correo transaccional.

3. Instalar dependencias del backend:

```bash
npm install
```

4. Levantar la infraestructura en contenedores Docker:

```bash
npm run db:up
```

5. Ejecutar la siembra de base de datos (pobla roles, permisos 4D, modulos y usuarios iniciales):

```bash
npm run seed
```

6. Iniciar el servidor backend en modo desarrollo:

```bash
npm run start:dev
```

La API quedara disponible en: `http://localhost:3000/api`  
La documentacion Swagger interactiva en: `http://localhost:3000/api/docs`

### 3. Configuracion del Frontend

1. Abrir una nueva terminal y situarse en la carpeta `frontend`:

```bash
cd frontend
npm install
```

2. Iniciar el servidor de desarrollo de Angular:

```bash
npm run start
```

La aplicacion web estara disponible en: `http://localhost:4200`

---

## Cuentas Maestras Sembradas por Defecto

Al ejecutar `npm run seed`, se aprovisionan las siguientes cuentas de prueba con contrasena unificada:

| Rol | Correo Electronico | Contrasena | Descripcion de Acceso |
| :--- | :--- | :--- | :--- |
| SUPERADMIN | `superadmin@sw000.com` | `Password123!` | Acceso total irrestricto a todos los recursos y configuraciones. |
| ADMIN | `admin@sw000.com` | `Password123!` | Gestion de usuarios, roles, auditoria y maquinas de estado. |
| USER | `user@sw000.com` | `Password123!` | Perfil regular de solo lectura y actualizacion de datos propios. |

---

## Guia de Extension para Nuevos Desarrollos

Para utilizar SW-000 como base al crear un nuevo modulo de negocio (por ejemplo, `Products`), siga el siguiente flujo arquitectonico:

### Paso 1: Creacion de la Entidad y Logica en el Backend

1. Cree el directorio `backend/src/products/`.
2. Defina la entidad `product.entity.ts` extendiendo campos de auditoria y declare sus estados (e.g. `DRAFT`, `PUBLISHED`, `ARCHIVED`).
3. Cree `products.service.ts` y `products.controller.ts`.
4. Registre la entidad en `backend/src/app.module.ts` dentro de `TypeOrmModule.forFeature([ProductEntity])`.

### Paso 2: Registro en el Motor de Permisos 4D

1. En `run-seeds.ts` o mediante migracion, inserte el permiso base para el recurso:
   - `action: 'manage', subject: 'Product'`
2. Defina las transiciones de estado autorizadas en la tabla `workflow_transitions`:
   - `module: 'PRODUCTS'`, `fromState: 'DRAFT'`, `toState: 'PUBLISHED'`, `allowedRoles: ['ADMIN']`
3. Defina los permisos de campo por estado en `field_state_permissions`:
   - En estado `DRAFT`, campos editables: `name`, `price`, `description`.
   - En estado `PUBLISHED`, campo editable: `price`; campo de solo lectura: `name`.

### Paso 3: Registro en el Modulo de Navegacion Dinamica

1. Inserte el modulo en la tabla `modules`:
   - `code: 'PRODUCTS'`, `name: 'Catalogo de Productos'`, `route: '/products'`, `icon: 'inventory_2'`, `order: 6`.
2. El sidebar del frontend renderizara automaticamente el acceso directo para aquellos usuarios cuyo rol posea permiso de lectura sobre el modulo.

### Paso 4: Implementacion del Modulo en el Frontend

1. Cree la carpeta `frontend/src/app/features/products/`.
2. Defina las rutas hijas en `products.routes.ts` y carguelas mediante lazy loading en `app.routes.ts`.
3. Implemente el servicio API con `HttpClient` y las vistas con componentes standalone, utilizando PrimeNG (`Table`, `Button`, `Dialog`) y Signals para el estado local.

---

## Scripts Disponibles

### Backend

| Comando | Descripcion |
| :--- | :--- |
| `npm run start:dev` | Inicia el servidor con recarga en caliente (watch mode). |
| `npm run build` | Compila la aplicacion hacia la carpeta `dist/`. |
| `npm run start:prod` | Ejecuta la version compilada en entorno de produccion. |
| `npm run test` | Ejecuta la suite de pruebas unitarias con Vitest. |
| `npm run test:watch` | Ejecuta las pruebas en modo interactivo. |
| `npm run test:cov` | Genera reporte de cobertura de codigo. |
| `npm run lint` | Ejecuta Oxlint sobre codigo fuente y pruebas. |
| `npm run format` | Aplica reglas de formato con Prettier. |
| `npm run db:up` | Inicia los servicios de MySQL y Redis en segundo plano. |
| `npm run db:down` | Detiene los contenedores de MySQL y Redis. |
| `npm run db:logs` | Muestra los registros de ejecucion del contenedor MySQL. |
| `npm run seed` | Ejecuta el sembrado determinista de la base de datos. |

### Frontend

| Comando | Descripcion |
| :--- | :--- |
| `npm run start` | Inicia el servidor de desarrollo en `http://localhost:4200`. |
| `npm run build` | Compila el paquete para produccion con optimizaciones activas. |
| `npm run test` | Ejecuta la suite de pruebas unitarias con Vitest. |

---

## Convenciones de Contribucion y Control de Versiones

Se utiliza el estandar Conventional Commits para mantener un historial trazable y claro:

- `feat(...)`: Nuevas caracteristicas funcionales.
- `fix(...)`: Correcciones de fallos o errores.
- `refactor(...)`: Mejoras de codigo sin cambios de comportamiento externo.
- `docs(...)`: Cambios exclusivos en documentacion.
- `test(...)`: Incorporacion o correccion de pruebas automatizadas.
- `chore(...)`: Tareas de mantenimiento de configuracion y dependencias.

---

## Licencia

Este proyecto esta estructurado como base propietaria para desarrollos de software internos y comerciales. Todos los derechos reservados.
