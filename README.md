# Módulo 11 — Incidentes Médicos (Festival Picnic 2026)

API REST para el registro, atención y seguimiento de incidentes médicos durante el Festival Picnic 2026. Proyecto desarrollado para la maratón de desarrollo backend (Desarrollo Web Backend, Universidad de Medellín).

---

## 👥 Integrantes y Responsabilidades

- **Juan Esteban Vallejo** — GitHub: [`Juanexzz`](https://github.com/Juanexzz) (Integrante A — Dueño del repositorio)
  - Configuración inicial del proyecto con Express, TypeScript y Prisma 7.
  - Sincronización del esquema de base de datos compartida (`prisma/schema.prisma`).
  - Definición del modelo de Dominio: entidad `Incidente`, constantes, excepciones de dominio e interfaces de repositorios.
  - Capa de Infraestructura: repositorios Prisma (`PrismaIncidenteRepository`, `PrismaReferenciaRepository`).
  - Endpoints implementados:
    - `GET /api/incidentes` (listado con paginación estricta y filtros por estado, severidad y dia_id).
    - `GET /api/incidentes/:id` (detalle con validación de ID y 404).
    - `POST /api/incidentes` (creación con validaciones de tipos, formatos, longitudes y referencias foráneas).
    - `PATCH /api/incidentes/:id/estado` (transiciones de estado con regla pura de dominio y códigos 400/404/409).
    - `GET /api/incidentes/resumen` (conteo agregado por estado, filtro opcional por `dia_id` y manejo de ceros).
  - Middleware centralizado de manejo de errores (`errorHandler.ts`).
  - Suites de pruebas propias para paginación, filtros, POST, transiciones de estado y resumen (`pruebas-propias/estado-resumen.mjs`).
  - Documentación técnica del proyecto (`README.md`).

- **Jose Daniel Morales** — GitHub: [`danijm1207`](https://github.com/danijm1207) (Integrante B)
  - Endpoints implementados:
    - `PATCH /api/incidentes/:id` (actualización parcial de campos editables con validación de tipos y referencias).
    - `DELETE /api/incidentes/:id` (borrado lógico modificando `state` a `'REMOVED'`).
  - Reglas de negocio 409 asociadas:
    - Restricción de no edición sobre incidentes en estado `CERRADO`.
    - Restricción de eliminación permitida únicamente para incidentes en estado `ABIERTO`.
  - Suite de pruebas propias del CRUD de incidentes y matriz de casos borde (`pruebas-propias/incidentes.mjs`).
  - Documentación de puntos de extensión y flujo de validaciones en casos de uso.

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js (versión 20+ recomendada)
- npm

### 1. Clonar el repositorio
```bash
git clone https://github.com/Juanexzz/Incidentes_FestivalPicnic_2026.git
cd Incidentes_FestivalPicnic_2026
```

### 2. Instalar dependencias
```bash
npm install
```
*(El script `postinstall` ejecutará automáticamente `prisma generate` para compilar el cliente en `./generated/prisma`)*.

### 3. Configurar variables de entorno
Copiar el archivo de plantilla `.env.example` a `.env`:
```bash
cp .env.example .env
```
Configurar los valores de conexión:
```ini
DATABASE_URL="postgresql://USUARIO:CONTRASENA@HOST:5432/postgres"
PORT=3000
```

### 4. Sincronizar con la base de datos compartida
```bash
npm run sync
```
*(Equivalente a `npx prisma db pull && npx prisma generate`. Nunca ejecutar migrate o db push)*.

### 5. Iniciar la API en desarrollo
```bash
npm run dev
```
La API arrancará en el puerto configurado en `PORT` (por defecto `http://localhost:3000`).

---

## 🧪 Ejecución de Pruebas

Con el servidor API en ejecución:

### Pruebas públicas (oficiales del kit)
```bash
node kit/pruebas/correr.mjs incidentes http://localhost:3000
```

### Pruebas públicas + pruebas propias (suite completa)
```bash
node kit/pruebas/correr.mjs incidentes http://localhost:3000 --ocultas pruebas-propias
```

---

## 🏛️ Arquitectura del Sistema (4 Capas)

El microservicio está construido siguiendo los principios de Arquitectura Limpia / Hexagonal, separando responsabilidades en cuatro capas bien delimitadas:

```
src/
├── domain/                  # Capa 1: Dominio (Núcleo puro)
│   ├── constants.ts         # Severidades, estados, estados lógicos
│   ├── entities.ts          # Entidad Incidente
│   ├── errors.ts            # Jerarquía de errores (Validation, NotFound, Conflict)
│   ├── repositories.ts      # Interfaces de repositorio y DTOs
│   └── transiciones.ts      # Regla pura de transiciones de estado
├── application/             # Capa 2: Casos de Uso (Lógica de Aplicación)
│   └── incidentes/
│       ├── ActualizarIncidente.ts
│       ├── CambiarEstadoIncidente.ts
│       ├── CrearIncidente.ts
│       ├── EliminarIncidente.ts
│       ├── ListarIncidentes.ts
│       ├── ObtenerIncidente.ts
│       ├── ResumenIncidentes.ts
│       └── validaciones.ts
├── infrastructure/          # Capa 3: Infraestructura (Persistencia y Adaptadores)
│   ├── database.ts          # Cliente Prisma con adaptador pg
│   └── repositories/
│       ├── PrismaIncidenteRepository.ts
│       └── PrismaReferenciaRepository.ts
├── interface/               # Capa 4: Interfaz HTTP (Controladores y Rutas Express)
│   ├── controllers/
│   │   └── IncidenteController.ts
│   ├── middlewares/
│   │   └── errorHandler.ts
│   └── routes/
│       └── incidenteRoutes.ts
└── app.ts                   # Composición raíz e inyección de dependencias
```

- **Domain (`src/domain/`)**: Cero dependencias externas. Define las entidades, las constantes de negocio, los errores semánticos y los contratos de persistencia mediante interfaces (`IncidenteRepository`, `ReferenciaRepository`).
- **Application (`src/application/`)**: Contiene los casos de uso que orquestan el flujo. Dependen exclusivamente de las interfaces del dominio, nunca de Prisma. Aplican el orden estricto de validaciones (400 formato/tipos → 404 existencia de registro/referencias → 409 reglas de negocio).
- **Infrastructure (`src/infrastructure/`)**: Único lugar donde se importa y utiliza `@prisma/client`. Implementa las interfaces del dominio y realiza el mapeo de registros de base de datos a entidades de dominio.
- **Interface (`src/interface/`)**: Controladores delgados que reciben solicitudes HTTP, delegan a los casos de uso y serializan respuestas en formato estándar `{ data }` o `{ pagination, data }`. Un middleware centralizado intercepta los errores de dominio y genera respuestas normalizadas `{ error }`.

---

## 📋 Regla de Negocio: Transiciones de Estado

<!-- REESCRIBIR CON MIS PALABRAS -->
### Descripción Técnica de la Regla
El ciclo de vida de atención médica de un incidente debe cumplir una máquina de estados unidireccional y secuencial estricta:
$$\text{ABIERTO} \longrightarrow \text{EN\_ATENCION} \longrightarrow \text{CERRADO}$$

#### Validaciones aplicadas:
1. **Flujo secuencial permitido:**
   - De `ABIERTO` solo es posible transicionar a `EN_ATENCION`.
   - De `EN_ATENCION` solo es posible transicionar a `CERRADO`.
2. **Restricciones de conflicto (HTTP 409):**
   - **Saltarse pasos:** Pasar de `ABIERTO` directamente a `CERRADO` dispara un `ConflictError` (409).
   - **Retroceder:** Pasar de `EN_ATENCION` a `ABIERTO` dispara un `ConflictError` (409).
   - **Repetición:** Intentar asignar el mismo estado actual (`ABIERTO` → `ABIERTO`, `EN_ATENCION` → `EN_ATENCION`) dispara un `ConflictError` (409).
   - **Estado final:** Un incidente en estado `CERRADO` es terminal; cualquier intento de cambio a cualquier otro estado o repetición dispara un `ConflictError` (409).

#### Archivo de implementación real:
- [`src/domain/transiciones.ts`](file:///src/domain/transiciones.ts): Implementada como función pura `validarTransicionEstado(estadoActual: string, nuevoEstado: string): void`.
- Orquestada por el caso de uso [`src/application/incidentes/CambiarEstadoIncidente.ts`](file:///src/application/incidentes/CambiarEstadoIncidente.ts) en el endpoint `PATCH /api/incidentes/:id/estado`.

#### Casos de prueba que la cubren:
- **Pruebas públicas (`Kit/Pruebas/Publicas/incidentes.mjs`):**
  - `Regla: no se salta de ABIERTO a CERRADO (409)`
  - `Transición ABIERTO → EN_ATENCION`
  - `Regla: no se devuelve a ABIERTO (409)`
  - `Transición EN_ATENCION → CERRADO`
- **Pruebas propias (`pruebas-propias/estado-resumen.mjs`):**
  - `PATCH /api/incidentes/abc/estado responde 400 (id inválido)`
  - `PATCH /api/incidentes/:id/estado sin campo estado responde 400`
  - `PATCH /api/incidentes/:id/estado con estado "FOO" responde 400`
  - `PATCH /api/incidentes/:id/estado con estado en minúsculas "cerrado" responde 400`
  - `PATCH /api/incidentes/:id/estado body inválido con id inexistente responde 400 (valida body antes que 404)`
  - `PATCH /api/incidentes/999999/estado con estado válido responde 404 (id inexistente)`
  - `Transiciones de estado: ciclo completo y restricciones 409 en dia 2` (prueba exhaustiva del ciclo `ABIERTO → CERRADO (409)`, `ABIERTO → ABIERTO (409)`, `ABIERTO → EN_ATENCION (200)`, `EN_ATENCION → ABIERTO (409)`, `EN_ATENCION → EN_ATENCION (409)`, `EN_ATENCION → CERRADO (200)` y `CERRADO → cualquiera (409)`).
<!-- REESCRIBIR CON MIS PALABRAS -->
