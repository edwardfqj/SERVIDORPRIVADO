# Hospital Angular - Sistema de Agendamiento de Citas

Sistema de gestión de citas médicas con Angular 21 y Node.js.

## Requisitos Previos

- Node.js 18+
- MySQL Server
- Angular CLI

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/hospitalangularv2.git
cd hospitalangularv2
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Base de Datos

- Crear base de datos MySQL llamada `agendamiento`
- Importar las tablas necesarias

### 4. Configurar Backend

```bash
# Copiar archivo de ejemplo
cp server-simple.example.cjs server-simple.cjs
```

Editar `server-simple.cjs` con tus credenciales de MySQL:
```javascript
const dbConfig = {
  host: 'localhost',
  user: 'TU_USUARIO',
  password: 'TU_PASSWORD',
  database: 'agendamiento',
  ...
};
```

## Ejecutar el Proyecto

### Terminal 1 - Backend
```bash
node server-simple.cjs
```
El backend corre en `http://localhost:3001`

### Terminal 2 - Frontend
```bash
npm start
```
El frontend corre en `http://localhost:4200`

## Funcionalidades

- **Pacientes**: Login con cédula y fecha de nacimiento, agendar citas, ver código QR
- **Administradores**: Login con cédula y contraseña, gestionar horarios, cancelar citas

## Tecnologías

- Angular 21
- Node.js + Express
- MySQL
- TailwindCSS
- QRCode

## Build

```bash
ng build
```

## Nota de Seguridad

El archivo `server-simple.cjs` está excluido del repositorio porque contiene credenciales de base de datos. Usa `server-simple.example.cjs` como plantilla.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
