# UITJobs - Full-Stack Recruitment Platform

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Backend-Express%205-339933?style=flat-square&logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Real--time-Socket.io-000000?style=flat-square&logo=socket.io)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

UITJobs is a specialized recruitment platform and career hub developed for student candidates and IT recruiters. The platform connects students seeking early-career opportunities with hiring companies through job discovery, application status tracking, real-time notifications, and an interview preparation hub.

---

## Key Features

### Candidate Workflow
- **Academic Profile Management:** Student account setup with profile fields (Student ID, Major, Cohort) for identity verification.
- **Job Discovery & Search:** Keyword and filter-based job search supporting position levels, skills, working forms, and locations.
- **Application Status Tracking:** Centralized dashboard tracking CV submissions through real-time updates (`Initial/Pending`, `Viewed`, `Approved`, `Rejected`).
- **Interview Preparation Hub:** Peer-shared interview experiences tagged by company and difficulty, alongside curated study resources and DSA code templates.
- **Company Reviews & Salary Trends:** 5-axis employer reviews with optional student anonymity and aggregated market salary statistics.

### Employer Workflow
- **Job Posting & Rich Editor:** Rich-text job creation (TinyMCE) with workplace image uploads, expiration dates, and applicant capacity caps.
- **Candidate CV Management:** Searchable applicant inbox with direct PDF viewing and status management (`Approved` / `Rejected`).
- **Recruitment Analytics:** Dashboard presenting total views, application counts, approval rates, and performance statistics.

### Admin Moderation
- **Role-Based Access Control (RBAC):** Permission-based administration protecting core management routes.
- **Account & Content Moderation:** User account verification, employer approval workflows, content moderation, and action audit logs.

---

## Technology Stack

- **Frontend:** Next.js 16 (App Router, Hybrid SSR/CSR), React 19, Tailwind CSS 4, Recharts, Socket.IO Client.
- **Backend:** Node.js, Express 5, TypeScript, Socket.IO, Nodemailer, Bcryptjs, Joi.
- **Database & Storage:** MongoDB Atlas (Mongoose ORM), Atlas Search, Cloudinary CDN.
- **Infrastructure:** Docker, Docker Compose, Nginx Reverse Proxy.

---

## Project Structure

```text
UITJobs/
├── BE/                  # Express REST API (TypeScript)
│   ├── config/          # Environment variables & constants
│   ├── controllers/     # Domain controllers (admin/, candidate/, company/)
│   ├── helpers/         # Search, mail, socket, cache, & mongoose-plugins/
│   ├── interfaces/      # Custom type extensions & interfaces
│   ├── middlewares/     # Auth JWT, RBAC guards, & rate limiters
│   ├── models/          # 18 Mongoose data schemas & plugins
│   ├── routes/          # API route definitions (admin, auth, candidate, company, job, review, salary, search, location, interview-experience — flat *.route.ts files)
│   ├── validates/       # Joi request payload validation schemas
│   ├── index.ts         # Backend server entry point & Socket.IO server
│   └── Dockerfile       # Backend container configuration
├── FE/                  # Next.js 16 App Router Frontend
│   ├── public/          # Static assets & public files
│   ├── src/
│   │   ├── actions/     # Server actions (revalidation)
│   │   ├── app/         # App router (pages: admin, candidate, company; components)
│   │   ├── configs/     # App variables & configurations
│   │   ├── contexts/    # React contexts (AuthContext, SocketContext)
│   │   ├── hooks/       # Custom React hooks (useAuth, useSocket)
│   │   ├── schemas/     # Zod form validation schemas
│   │   ├── types/       # TypeScript type definitions
│   │   ├── utils/       # Helper utilities (date, currency, API URL)
│   │   └── middleware.ts# Next.js request path header middleware
│   ├── next.config.ts   # Next.js build configuration
│   └── Dockerfile       # Frontend container configuration
├── Nginx_proxy/         # Nginx reverse proxy configuration
│   ├── nginx.conf       # Proxy routing configuration
│   └── Dockerfile       # Nginx container configuration
└── docker-compose.yaml  # Multi-container orchestration
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Yarn or npm
- MongoDB Atlas account
- Cloudinary account

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/thaihadefi/Innovation-Project.git
cd Innovation-Project

# Set up environment variables
cp BE/.env.example BE/.env
cp FE/.env.example FE/.env

# Start services using Docker Compose
docker compose up --build -d
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
