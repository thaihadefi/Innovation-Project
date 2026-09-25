# UITJobs

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express%205-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

A recruitment platform for UIT students and IT employers, with instant student verification through Google OAuth, real-time application tracking, and an interview preparation hub.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Business rules](#business-rules)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Google OAuth setup](#google-oauth-setup)
- [Scripts](#scripts)
- [Screenshots](#screenshots)
- [Deployment and security notes](#deployment-and-security-notes)
- [License](#license)

## Features

**Candidates**
- Google OAuth sign-in with instant UIT student verification, or manual registration.
- Job search (MongoDB Atlas Search) with filters for skill, position, location and working form.
- Personalized job recommendations based on profile skills.
- Saved jobs, followed companies and company performance badges.
- Application tracking (pending → viewed → approved/rejected) with CV re-upload and withdrawal.
- Real-time notifications (Socket.IO + email).
- Interview experience sharing and an interview preparation hub with study resources.
- Company reviews (overall + salary, work-life balance, career, culture, management ratings) with optional anonymity, and aggregated salary insights.

**Employers**
- Rich-text job posting (TinyMCE) with images, expiration dates and applicant caps.
- Applicant inbox with CV viewing, status updates and real-time alerts.
- Recruitment analytics (views, applications, approval rate).

**Admins**
- Role-based access control across management routes.
- Employer approval, manual candidate verification (for students who can't verify via Google), report moderation and audit logs.

## Tech stack

- **Backend:** Node.js, Express 5, TypeScript, Socket.IO, Mongoose, Passport (Google OAuth), Nodemailer, Joi, Helmet, express-rate-limit
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, Recharts, React Hook Form, Zod, TinyMCE, FilePond, DOMPurify
- **Data:** MongoDB Atlas (Atlas Search with a regex fallback), NodeCache, Cloudinary for uploads
- **Deployment:** Docker Compose with nginx as the reverse proxy

## Business rules

- A verified UIT student's Student ID, Cohort, Full Name and Major lock once each is populated; unverified or manually registered candidates can still edit them (`FE/.../candidate-manage/profile/ProfileForm.tsx`).
- New employer accounts start pending (`initial`) and must be approved by an admin before they can post jobs ([company.service.ts](BE/services/admin/company.service.ts)).
- A candidate can edit or re-upload a CV only while it is still pending and the job hasn't expired; withdrawing an application has no such restriction ([cv.service.ts](BE/services/candidate/cv.service.ts)).
- A candidate can review a company at most once ([review.service.ts](BE/services/review.service.ts)).
- Company performance badges (Top Rated, Active Recruiter, Trusted Employer, Hot Jobs) are computed from activity, not manually assigned ([company-badges.helper.ts](BE/helpers/company-badges.helper.ts)).

## Architecture

```text
Browser ──> nginx ──┬──> FE (Next.js, port 3069)
                     └──> BE (Express API + Socket.IO, port 4001) ──> MongoDB Atlas
                                                                   └──> Cloudinary, Gmail, Google OAuth
```

- **FE** serves the public pages and the candidate/company/admin dashboards; nginx routes `/` to it.
- **BE** serves the JSON API (nginx `/api/`) and Socket.IO (`/socket.io/`). Code is layered: routes → controllers → services → models.
- **nginx** is the public entry point in Docker and upgrades `/socket.io/` to WebSocket.

```text
Innovation-Project/
├── BE/                  # Express REST API
│   ├── routes/          # URL -> controller
│   ├── controllers/     # Read the request, call a service, send the response
│   ├── services/        # Business logic and database access
│   ├── models/          # Mongoose schemas
│   ├── middlewares/     # Auth, RBAC, rate limiting
│   ├── validates/       # Joi request validation schemas
│   ├── interfaces/      # TypeScript domain interfaces & input DTOs
│   └── config/          # Env validation, DB connection, Passport (Google OAuth)
├── FE/                  # Next.js App Router frontend
│   └── src/
│       ├── app/(pages)/    # Public pages + candidate/company/admin dashboards
│       ├── app/components/ # Reusable UI components
│       ├── contexts/       # React contexts (Auth, Socket, AdminSocket)
│       ├── hooks/          # Custom hooks (useAuth, useSocket, useApiAction, ...)
│       ├── schemas/        # Zod form validation schemas
│       ├── types/          # Shared frontend domain types
│       └── utils/          # API client, error/FilePond helpers, formatting
├── Nginx_proxy/         # Reverse proxy config
└── docker-compose.yaml
```

## Getting started

### Prerequisites

- Node.js (v20+ for FE, v22+ for BE) and Yarn (to run locally), or Docker
- A MongoDB database (Atlas or local)
- A Cloudinary account and a Gmail account with an app password

### 1. Configure

```bash
git clone https://github.com/thaihadefi/Innovation-Project.git
cd Innovation-Project
cp BE/.env.example BE/.env
cp FE/.env.example FE/.env
```

Fill in at least these values; the rest are optional and explained in the two `.env.example` files.

| File | Variable | Purpose |
|---|---|---|
| `BE/.env` | `DATABASE` | MongoDB connection string |
| `BE/.env` | `JWT_SECRET` | Signs login tokens |
| `BE/.env` | `DOMAIN_FRONTEND`, `FRONTEND_URL` | Allowed CORS/Socket.IO origin and base URL for email links |
| `BE/.env` | `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Uploads (avatars, CVs, job images) |
| `BE/.env` | `GMAIL_USER`, `GMAIL_PASS` | Sends account and notification emails |
| `BE/.env` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Optional; enables Google sign-in and instant student verification (see below) |
| `FE/.env` | `NEXT_PUBLIC_API_URL` | `/api` behind the nginx proxy (Docker), or `http://localhost:4001` for standalone `yarn dev` |

Search uses the Atlas Search index named by `ATLAS_SEARCH_INDEX` when it exists, and a regex match otherwise.

### 2a. Run locally

```bash
# Terminal 1
cd BE && yarn install && yarn dev

# Terminal 2
cd FE && yarn install && yarn dev
```

The frontend runs at `http://localhost:3069` and the API at `http://localhost:4001`.

### 2b. Or run with Docker

```bash
docker compose up --build -d
```

nginx serves the site at `http://localhost` (port 80).

### 3. Create the first admin account

New employer accounts start as pending and require admin approval, while newly registered admins require activation. To bootstrap the first super admin directly in the database, hash a password from the `BE` folder:

```bash
node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" 'YourStrongPassword'
```

Then insert a document into the `accounts_admin` collection (using `mongosh` or the MongoDB Atlas Data Explorer):

```javascript
db.accounts_admin.insertOne({
  fullName: "Super Admin",
  email: "admin@uitjobs.local",
  password: "<your-hashed-password>",
  status: "active",
  isSuperAdmin: true,
  deleted: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Log in at `http://localhost:3069/admin/login` (or `http://localhost/admin/login` in Docker) to access the Admin Management panel (`/admin-manage`), approve employer registrations, and manage candidate verifications.

## Google OAuth setup

To enable Google sign-in and instant UIT student verification:

1. In the [Google Cloud Console](https://console.cloud.google.com/), create an OAuth 2.0 Client ID (Web application) under **APIs & Services > Credentials**.
2. Set the authorized redirect URI:
   - Docker Compose: `http://localhost/api/auth/google/callback`
   - Standalone local dev: `http://localhost:4001/auth/google/callback`
3. Add the credentials to `BE/.env` as `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_CALLBACK_URL`.

## Scripts

`BE` (see `BE/package.json`):
- `yarn dev` / `yarn start`: run with auto-reload (`nodemon`)
- `yarn build`: compile TypeScript to `dist/`
- `yarn typecheck`: type-check without building
- `yarn lint:any`: fail if any `.ts` file outside `dist/` uses an explicit `any`

`FE` (see `FE/package.json`):
- `yarn dev`: run with hot reload on port 3069
- `yarn build` then `yarn start`: build and run the production server
- `yarn lint`: run ESLint

## Screenshots

### Candidate Experience
<img width="1244" height="1032" alt="Candidate Dashboard" src="https://github.com/user-attachments/assets/d17136ac-ad61-4ec2-8c80-1d173a862894" />

<img width="1241" height="693" alt="Job Search and Filters" src="https://github.com/user-attachments/assets/a8a4e355-a959-4b80-b925-3e1517d13948" />

<img width="1240" height="812" alt="Company Reviews" src="https://github.com/user-attachments/assets/e68da430-580a-4e14-9ec6-c97a93907d38" />

<img width="1250" height="812" alt="Interview Preparation Hub" src="https://github.com/user-attachments/assets/56fc75a8-2b12-42ce-bc28-30947ac0b7f4" />

### Employer Workspace
<img width="1263" height="551" alt="Recruitment Analytics Dashboard" src="https://github.com/user-attachments/assets/ad3de90b-0cf2-4ded-912e-6af8daa485da" />

<img width="1240" height="559" alt="Job Vacancy Management" src="https://github.com/user-attachments/assets/b45432ab-b77f-46a1-a21f-d9b164407b74" />

## Deployment and security notes

- **Cookies:** login cookies are `httpOnly`, `sameSite: lax`, and marked `Secure` automatically when the site is served over HTTPS ([cookie.helper.ts](BE/helpers/cookie.helper.ts)).
- **Reverse proxy:** the app trusts one proxy hop (`app.set("trust proxy", 1)`) so rate limits see the real client IP behind nginx.
- **Redeploys:** on `SIGTERM`/`SIGINT` the API stops taking new requests, lets in-flight ones finish, and disconnects from MongoDB before exiting ([BE/index.ts](BE/index.ts)).
- **Uploads** are capped at 20MB by nginx ([nginx.conf](Nginx_proxy/nginx.conf)).

## License

[MIT](LICENSE)
