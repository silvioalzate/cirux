<div align="center">

# 🏥 CiruX

### **Asistente Virtual AI para Clínicas de Cirugía Plástica**

**Automatiza la atención al paciente. Recupera prospectos. Libera a tu equipo.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.103-green?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![n8n](https://img.shields.io/badge/n8n-FF6D5A?style=flat-square&logo=n8n&logoColor=white)](https://n8n.io/)
[![WhatsApp Business API](https://img.shields.io/badge/WhatsApp_Business_API-25D366?style=flat-square&logo=whatsapp&logoColor=white)](https://business.whatsapp.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?style=flat-square)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=flat-square)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.59-45ba4c?style=flat-square)](https://playwright.dev/)

[🇪🇸 Español](#español) | [🇺🇸 English](#english)

</div>

---

## 🇪🇸 Español {#español}

### ¿Qué es CiruX?

**CiruX** es una plataforma integral que combina una web moderna con un asistente virtual inteligente conectado a **WhatsApp Business API**. Diseñado específicamente para clínicas de cirugía plástica, automatiza la captura de prospectos, la programación de citas y el seguimiento de pacientes—operando 24/7 sin intervención humana.

### ⚡️ Resultados Reales

> "CiruX reduce en un **90%** la pérdida de prospectos y hasta un **70%** la carga de trabajo de la asistente."

| Métrica | Resultado |
|---------|-----------|
| Pérdida de prospectos | **-90%** |
| Carga de trabajo asistente | **-70%** |
| Disponibilidad | **24/7** |
| Canal principal | **WhatsApp** |

### 🛠 Stack Técnico

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| **Backend & DB** | Supabase (PostgreSQL, Auth, Realtime) |
| **Automatización** | n8n |
| **Mensajería** | WhatsApp Business API (Evolution API) |
| **Estado** | Zustand |
| **Validación** | Zod + React Hook Form |
| **Testing** | Vitest + Playwright |
| **Despliegue** | Vercel / VPS con Docker + Nginx |

### 🏗 Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Supabase DB   │────▶│  WhatsApp API   │
│  (Frontend Web) │     │  (Datos & Auth) │     │  (Mensajería)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                          ┌───────▼────────┐
                          │      n8n        │
                          │  Automatización │
                          │  & Workflows   │
                          └─────────────────┘
```

### ✨ Funcionalidades Clave

- 🤖 **Asistente Virtual AI** — Responde preguntas, captura datos y agenda citas automáticamente vía WhatsApp
- 📅 **Agenda Inteligente** — Sincronización con calendarios y recordatorios automáticos a pacientes
- 📊 **Dashboard de Métricas** — Monitoreo de leads, conversiones y estado de seguimiento
- 🔔 **Notificaciones Automáticas** — Recordatorios de citas, seguimiento post-consulta y campañas de reactivación
- 👥 **Gestión de Prospectos** — CRUD completo con historial de interacciones y notas
- 📋 **Gestión de Pacientes** — Registro, historial de citas y datos de contacto
- 🏥 **Catálogo de Procedimientos** — Procedimientos y tratamientos de la clínica
- 💬 **Comunicación Multicanal** — WhatsApp, Messenger, Instagram, TikTok, Web

### ⚙️ Cómo Funciona

1. **El paciente escribe por WhatsApp** — Un prospecto envía un mensaje al número de la clínica. Se recibe vía WhatsApp Business API y procesa en tiempo real.

2. **El Asistente Virtual AI interpreta la intención** — Mediante n8n, el mensaje se envía a un modelo de IA (OpenAI/Claude) que clasifica la intención: consulta de precios, agendamiento, pregunta post-operación, etc.

3. **La lógica de negocio ejecuta la acción** — Según la intención detectada, el flujo consulta/actualiza Supabase, agenda la cita y envía respuesta personalizada en segundos.

4. **Los datos se visualizan en el Dashboard** — El equipo accede a la web para ver leads, citas, estado de seguimiento y métricas en tiempo real.

### 🚀 Empezar

#### Requisitos

- Node.js 20+
- npm / yarn / pnpm / bun
- Cuenta de Supabase (local o cloud)
- Instancia de Evolution API (opcional, para WhatsApp)

#### Instalación

```bash
# Clonar el repositorio
git clone <tu-repo>
cd CIRUX-APP

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus credenciales

# Iniciar desarrollo
npm run dev
```

#### Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-supabase-url.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
EVOLUTION_API_KEY=tu-evolution-api-key
EVOLUTION_URL=https://tu-evolution-url.com
```

#### Scripts disponibles

```bash
npm run dev          # Desarrollo (localhost:3000)
npm run build        # Build de producción
npm run start        # Iniciar producción
npm run lint         # ESLint
npm run test         # Tests unitarios (Vitest)
npm run test:watch   # Tests en modo watch
npm run test:coverage # Coverage report
npm run test:e2e     # Tests E2E (Playwright)
npm run test:e2e:ui # Playwright UI mode
npm run test:all     # Todos los tests
```

#### API de salud

```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

### 📁 Estructura del proyecto

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── health/             # Health check
│   │   └── v1/evolution-webhook/ # Webhook de Evolution API
│   ├── dashboard/              # Área protegida
│   │   ├── appointments/       # Gestión de citas
│   │   ├── calendar/           # Calendario interactivo
│   │   ├── notifications/      # Conversaciones pendientes
│   │   ├── patients/           # Gestión de pacientes
│   │   ├── procedures/         # Catálogo de procedimientos
│   │   ├── settings/           # Configuración
│   │   └── page.tsx            # Dashboard principal
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Redirige a /dashboard
├── components/
│   ├── layout/                 # Sidebar, Topbar
│   ├── providers/              # Context providers
│   └── ui/                     # Componentes shadcn/ui
├── lib/
│   ├── stores/                 # Zustand stores
│   ├── validations/            # Esquemas Zod
│   └── utils.ts                # Utilidades
├── utils/
│   └── supabase/               # Client, Server, Middleware
└── __tests__/
    ├── e2e/                    # Playwright tests
    ├── integration/            # Tests de integración
    └── unit/                   # Tests unitarios
```

### 🗺 Roadmap

| Estado | Funcionalidad |
|--------|---------------|
| ✅ Listo | Asistente Virtual WhatsApp con IA |
| ✅ Listo | Dashboard de métricas y CRM básico |
| ✅ Listo | Agenda inteligente con recordatorios automáticos |
| 🔄 En progreso | Integración multi-clínica (SaaS multi-tenant) |
| 📋 Próximo | Campañas de remarketing por WhatsApp |
| 📋 Próximo | Teleconsulta y videollamadas integradas |
| 💡 Futuro | IA para seguimiento post-quirúrgico personalizado |

### 🌐 En vivo

🔗 [cirux.cloud](https://cirux.cloud/)

---

## 🇺🇸 English {#english}

### What is CiruX?

**CiruX** is a comprehensive platform that combines a modern website with an intelligent virtual assistant connected to the **WhatsApp Business API**. Designed specifically for plastic surgery clinics, it automates lead capture, appointment scheduling, and patient follow-up—operating 24/7 without human intervention.

### ⚡️ Real Results

> "CiruX reduces prospect loss by 90% and lowers assistant workload by up to 70%."

| Metric | Result |
|--------|--------|
| Prospect loss | **-90%** |
| Assistant workload | **-70%** |
| Availability | **24/7** |
| Primary channel | **WhatsApp** |

### 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| **Backend & DB** | Supabase (PostgreSQL, Auth, Realtime) |
| **Automation** | n8n |
| **Messaging** | WhatsApp Business API (Evolution API) |
| **State** | Zustand |
| **Validation** | Zod + React Hook Form |
| **Testing** | Vitest + Playwright |
| **Deployment** | Vercel / VPS with Docker + Nginx |

### 🏗 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Supabase DB   │────▶│  WhatsApp API   │
│  (Web Frontend) │     │ (Data & Auth)   │     │  (Messaging)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                          ┌───────▼────────┐
                          │      n8n        │
                          │  Automation &  │
                          │   Workflows    │
                          └─────────────────┘
```

### ✨ Key Features

- 🤖 **AI Virtual Assistant** — Answers questions, captures data, and schedules appointments automatically via WhatsApp
- 📅 **Smart Scheduling** — Calendar sync and automatic patient reminders
- 📊 **Metrics Dashboard** — Lead tracking, conversion rates, and follow-up status
- 🔔 **Automated Notifications** — Appointment reminders, post-consultation follow-up, and reactivation campaigns
- 👥 **Lead Management** — Full CRUD with interaction history and notes
- 📋 **Patient Management** — Registration, appointment history, and contact data
- 🏥 **Procedure Catalog** — Clinic procedures and treatments
- 💬 **Multi-channel Communication** — WhatsApp, Messenger, Instagram, TikTok, Web

### ⚙️ How It Works

1. **Patient sends a WhatsApp message** — A prospect sends a message to the clinic's WhatsApp. Received via WhatsApp Business API and processed in real-time.

2. **AI Virtual Assistant interprets intent** — Through n8n, the message is sent to an AI model (OpenAI/Claude) that classifies the user's intent: price inquiry, appointment scheduling, post-op question, etc.

3. **Business logic executes the action** — Based on the detected intent, the flow queries/updates Supabase, schedules the appointment, and sends a personalized response in seconds.

4. **Data is visualized on the Dashboard** — The team accesses the web dashboard to view leads, appointments, follow-up status, and real-time metrics.

### 🚀 Getting Started

#### Requirements

- Node.js 20+
- npm / yarn / pnpm / bun
- Supabase account (local or cloud)
- Evolution API instance (optional, for WhatsApp)

#### Installation

```bash
# Clone the repository
git clone <your-repo>
cd CIRUX-APP

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Start development
npm run dev
```

#### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EVOLUTION_API_KEY=your-evolution-api-key
EVOLUTION_URL=https://your-evolution-url.com
```

#### Available scripts

```bash
npm run dev          # Development (localhost:3000)
npm run build        # Production build
npm run start        # Start production
npm run lint         # ESLint
npm run test         # Unit tests (Vitest)
npm run test:watch   # Watch mode tests
npm run test:coverage # Coverage report
npm run test:e2e     # E2E tests (Playwright)
npm run test:e2e:ui  # Playwright UI mode
npm run test:all     # All tests
```

#### Health API

```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

### 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── health/             # Health check
│   │   └── v1/evolution-webhook/ # Evolution API webhook
│   ├── dashboard/              # Protected area
│   │   ├── appointments/       # Appointments management
│   │   ├── calendar/           # Interactive calendar
│   │   ├── notifications/      # Pending conversations
│   │   ├── patients/           # Patient management
│   │   ├── procedures/         # Procedure catalog
│   │   ├── settings/           # Settings
│   │   └── page.tsx            # Main dashboard
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Redirects to /dashboard
├── components/
│   ├── layout/                 # Sidebar, Topbar
│   ├── providers/              # Context providers
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── stores/                 # Zustand stores
│   ├── validations/            # Zod schemas
│   └── utils.ts               # Utilities
├── utils/
│   └── supabase/               # Client, Server, Middleware
└── __tests__/
    ├── e2e/                    # Playwright tests
    ├── integration/            # Integration tests
    └── unit/                   # Unit tests
```

### 🗺 Roadmap

| Status | Feature |
|--------|---------|
| ✅ Ready | WhatsApp AI Virtual Assistant |
| ✅ Ready | Metrics dashboard & basic CRM |
| ✅ Ready | Smart scheduling with automatic reminders |
| 🔄 In Progress | Multi-clinic integration (SaaS multi-tenant) |
| 📋 Next | WhatsApp remarketing campaigns |
| 📋 Next | Teleconsultation & integrated video calls |
| 💡 Future | AI-powered personalized post-surgical follow-up |

### 🌐 Live

🔗 [cirux.cloud](https://cirux.cloud/)

---

## 📸 Capturas / Screenshots

(Añadir capturas de pantalla del dashboard, conversaciones de WhatsApp, y flujos de n8n aquí)

---

## 🤝 Contacto / Contact

¿Interesado en una solución similar para tu negocio? / Interested in a similar solution for your business?

- 💼 [LinkedIn](https://linkedin.com/in/silvio-alzate)
- 📧 Email: silvioalzate@gmail.com

---

<div align="center">
  <sub>Hecho con ❤️ por Silvio Alzate | Pereira, Colombia 🇨🇴</sub>
</div>
