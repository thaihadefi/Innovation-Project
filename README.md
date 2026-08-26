# UITJobs - Full-Stack Recruitment Platform

[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Backend-Express%205-339933?style=flat-square&logo=express)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Real--time-Socket.io-000000?style=flat-square&logo=socket.io)](https://socket.io/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%204-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

UITJobs is a specialized recruitment platform and career hub developed for student candidates and IT recruiters. The platform connects students seeking early-career opportunities with hiring companies through job discovery, application status tracking, real-time notifications, company reviews, salary insights, and an interview preparation hub.

---

## Key Features

### Candidate Workflow
- **Academic Profile Management:** Student account setup with academic identity fields (`Student ID`, `Major`, `Cohort`) for verification.
- **Job Discovery & Search:** Keyword and filter-based job search powered by MongoDB `Atlas Search` with multi-field fallback, supporting position levels, skills, working forms, and locations.
- **Personalized Job Recommendations:** Skill-based recommendation scoring engine surfacing best-fit vacancies from profile skill tags.
- **Saved Jobs & Company Following:** Bookmark job postings and follow verified companies to track new openings.
- **Application Status Tracking:** Centralized dashboard tracking CV submissions through real-time updates (`Initial/Pending`, `Viewed`, `Approved`, `Rejected`).
- **Interview Preparation Hub:** Peer-shared interview experiences tagged by company, result (`Passed`, `Failed`, `Pending`), and difficulty, alongside curated study resources and DSA code templates.
- **Company Reviews & Salary Trends:** 5-axis employer reviews with optional student anonymity and aggregated market salary statistics.

### Employer Workflow
- **Job Posting & Rich Editor:** Rich-text job creation (TinyMCE) with workplace image uploads, expiration dates, and applicant capacity caps.
- **Candidate CV Management:** Searchable applicant inbox with direct PDF viewing and status management (`Approved` / `Rejected`).
- **Recruitment Analytics:** Dashboard presenting total views, application counts, approval rates, and performance statistics.

### Admin Moderation
- **Role-Based Access Control (RBAC):** Permission-matrix administration protecting core management routes across staff roles.
- **Account & Content Moderation:** Student account verification, employer approval workflows, content moderation, and administrative audit logs (`admin-audit-log.model.ts`).

---

## Technology Stack

- **Frontend:** Next.js 16 (App Router, Hybrid SSR/CSR), React 19, Tailwind CSS 4, Recharts, Socket.IO Client, React Hook Form, Zod, TinyMCE Rich-Text Editor, FilePond Uploads, DOMPurify Sanitization.
- **Backend:** Node.js, Express 5, TypeScript (Strict Mode, Fully Typed), Socket.IO Server, Nodemailer, Bcryptjs, Joi, Helmet, express-rate-limit, gzip response compression, sanitize-html (rich-text XSS filter).
- **Database & Storage:** MongoDB Atlas (Mongoose ORM with Type Generics), Atlas Search Engine with Regex Fallback, NodeCache (In-Memory Caching), Cloudinary CDN.
- **Infrastructure & Design Patterns:** 3-Tier Layered Architecture (Routes → Controllers → Services → Models), DTO-Driven Domain Services, Admin Audit Trail Logging, Thin Controllers, Safe Regex Injection Filters, HttpOnly Cookies, Docker, Docker Compose, Nginx Reverse Proxy, OS Graceful Shutdown.

---

## Project Structure

```text
Innovation-Project/
├── BE/                               # Express REST API (Port 4001)
│   ├── config/                       # Database connection, env validation, audit actions, & rate-limit values
│   ├── controllers/                  # HTTP request delegates (admin/, candidate/, company/ + shared auth, job, review, search)
│   │   ├── admin/                    # Admin controllers delegating to admin services
│   │   ├── candidate/                # Candidate controllers delegating to candidate services
│   │   └── company/                  # Employer controllers delegating to employer services
│   ├── helpers/                      # Shared utility functions (slugify, mailer, jwt, cache, Cloudinary, Atlas search)
│   │   └── mongoose-plugins/         # Reusable schema plugins (soft-delete, is-edited, helpful-votes)
│   ├── interfaces/                   # Strict TypeScript domain interfaces & Input DTOs
│   │   ├── models/                   # Type declarations for Mongoose models & input DTO schemas
│   │   └── request.interface.ts      # Typed Express request augmentations (candidate/company/admin auth payloads)
│   ├── middlewares/                  # Security guards, RBAC matrices, rate limiters, & request logger
│   ├── models/                       # Mongoose data models with TypeScript generics
│   ├── routes/                       # Express routing modules (admin, candidate, company + auth, job, review, salary, search)
│   ├── services/                     # Core Business Logic & Database Transactions
│   │   ├── admin/                    # Admin management services (accounts, moderation, audit logs)
│   │   ├── candidate/                # Candidate services (profile, applications, bookmarks)
│   │   └── company/                  # Employer services (jobs, applicants, analytics)
│   ├── validates/                    # Joi request payload validation schemas
│   ├── Dockerfile                    # Backend container image (Node 22)
│   ├── index.ts                      # App server entry point, Socket.IO server, & OS Graceful Shutdown handler
│   ├── tsconfig.json                 # TypeScript strict-mode compiler config
│   └── package.json                  # Backend dependencies & strict verification scripts
│
├── FE/                               # Next.js 16 App Router Frontend (Port 3069)
│   ├── public/                       # Static assets & public files
│   ├── src/
│   │   ├── actions/                  # Server actions (revalidation)
│   │   ├── app/                      # App router layouts, error boundaries, route handlers & views
│   │   │   ├── (pages)/              # Public pages & role-based dashboards
│   │   │   │   ├── (home)/           # Landing page (recommended jobs, top companies)
│   │   │   │   ├── admin/            # Admin auth pages (login, register, password reset)
│   │   │   │   ├── admin-manage/     # Admin control panel dashboards
│   │   │   │   ├── candidate/        # Candidate auth pages
│   │   │   │   ├── candidate-manage/ # Candidate workspace & interview prep hub
│   │   │   │   ├── company/          # Company auth pages, public company list & profiles
│   │   │   │   ├── company-manage/   # Employer management & applicant inbox
│   │   │   │   ├── faq/              # FAQ page
│   │   │   │   ├── job/              # Public job detail pages
│   │   │   │   ├── salary-insights/  # Aggregated market salary statistics
│   │   │   │   └── search/           # Job discovery & Atlas search views
│   │   │   ├── components/           # Reusable UI components, modals & charts
│   │   │   └── globals.css           # Tailwind CSS 4 theme & layout styling
│   │   ├── configs/                  # Shared UI option lists, pagination & status-badge config
│   │   ├── contexts/                 # React contexts (AuthContext, SocketContext, AdminSocketContext)
│   │   ├── hooks/                    # Custom React hooks (useAuth, useSocket, useAdminListQuery, useListQueryState)
│   │   ├── schemas/                  # Zod form validation schemas
│   │   ├── types/                    # Frontend TypeScript type declarations
│   │   ├── utils/                    # Helper utilities (date formatting, API URL resolvers)
│   │   └── middleware.ts             # Next.js route protection middleware
│   ├── Dockerfile                    # Frontend container image (multi-stage, standalone output)
│   ├── next.config.ts                # Next.js build configuration
│   ├── tsconfig.json                 # TypeScript strict-mode compiler config
│   └── package.json                  # Frontend dependencies & build scripts
│
├── Nginx_proxy/                      # Nginx Reverse Proxy Configuration
│   ├── nginx.conf                    # Reverse proxy routing rules
│   └── Dockerfile                    # Nginx container configuration
│
└── docker-compose.yaml               # Multi-container orchestration
```

---

## Getting Started

### Prerequisites
- Node.js (v20+ for FE, v22+ for BE)
- Yarn or npm
- MongoDB Atlas account (or local MongoDB instance)
- Cloudinary account

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/thaihadefi/Innovation-Project.git
cd Innovation-Project

# Set up environment variables
cp BE/.env.example BE/.env
cp FE/.env.example FE/.env

# TinyMCE API key is a Docker build-arg, not read from FE/.env — export it in your shell first
export NEXT_PUBLIC_API_TINYMCE="your-tinymce-api-key"

# Start services using Docker Compose
docker compose up --build -d
```

### Local Development

1. **Start the Backend (`BE` - Port 4001):**

```bash
cd BE

# Install dependencies
yarn install

# Configure Environment Variables (.env)
cp .env.example .env

# Run development server
yarn dev
```

2. **In a new terminal window, start the Frontend (`FE` - Port 3069):**

```bash
cd FE

# Install dependencies
yarn install

# Configure Environment Variables (.env)
cp .env.example .env

# Run development server
yarn dev
```

---

## Screenshots

### Candidate Experience
<img width="1244" height="1032" alt="Candidate Dashboard" src="https://github.com/user-attachments/assets/d17136ac-ad61-4ec2-8c80-1d173a862894" />

<p>&nbsp;</p>

<img width="1241" height="693" alt="Job Search and Filters" src="https://github.com/user-attachments/assets/a8a4e355-a959-4b80-b925-3e1517d13948" />

<p>&nbsp;</p>

<img width="1240" height="812" alt="Company Reviews" src="https://github.com/user-attachments/assets/e68da430-580a-4e14-9ec6-c97a93907d38" />

<p>&nbsp;</p>

<img width="1250" height="812" alt="Interview Preparation Hub" src="https://github.com/user-attachments/assets/56fc75a8-2b12-42ce-bc28-30947ac0b7f4" />

<p>&nbsp;</p>

### Employer Workspace
<img width="1263" height="551" alt="Recruitment Analytics Dashboard" src="https://github.com/user-attachments/assets/ad3de90b-0cf2-4ded-912e-6af8daa485da" />

<p>&nbsp;</p>

<img width="1240" height="559" alt="Job Vacancy Management" src="https://github.com/user-attachments/assets/b45432ab-b77f-46a1-a21f-d9b164407b74" />

---

## License

This project is licensed under the [MIT License](LICENSE).
