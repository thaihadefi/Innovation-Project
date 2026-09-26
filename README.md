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
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Development](#development)
- [Architecture](#architecture)
- [Business rules](#business-rules)
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

## Screenshots

**Candidate experience**

<img width="1244" alt="Candidate dashboard" src="https://github.com/user-attachments/assets/d17136ac-ad61-4ec2-8c80-1d173a862894" />
<img width="1241" alt="Job search and filters" src="https://github.com/user-attachments/assets/a8a4e355-a959-4b80-b925-3e1517d13948" />
<img width="1240" alt="Company reviews" src="https://github.com/user-attachments/assets/e68da430-580a-4e14-9ec6-c97a93907d38" />
<img width="1250" alt="Interview preparation hub" src="https://github.com/user-attachments/assets/56fc75a8-2b12-42ce-bc28-30947ac0b7f4" />

**Employer workspace**

<img width="1263" alt="Recruitment analytics dashboard" src="https://github.com/user-attachments/assets/ad3de90b-0cf2-4ded-912e-6af8daa485da" />
<img width="1240" alt="Job vacancy management" src="https://github.com/user-attachments/assets/b45432ab-b77f-46a1-a21f-d9b164407b74" />

## Tech stack

- **Backend:** Express 5 + TypeScript, Socket.IO, Mongoose, Passport (Google OAuth), Nodemailer, Joi
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, React Hook Form + Zod, TinyMCE
- **Data and services:** MongoDB Atlas (Atlas Search), Cloudinary for uploads, Gmail for email
- **Deployment:** Docker Compose behind an nginx reverse proxy

Exact dependencies and versions live in [BE/package.json](BE/package.json) and [FE/package.json](FE/package.json).

## Getting started

### Prerequisites

- Docker, **or** Node.js and Yarn to run without containers (the images use Node 22 for BE and Node 20 for FE; see the two `Dockerfile`s)
- A MongoDB database (Atlas or local)
- A Cloudinary account and a Gmail account with an app password

### 1. Configure

```bash
git clone https://github.com/thaihadefi/Innovation-Project.git
cd Innovation-Project
cp BE/.env.example BE/.env
cp FE/.env.example FE/.env
```

Every variable is documented inline in [BE/.env.example](BE/.env.example) and [FE/.env.example](FE/.env.example). The API refuses to start without `DATABASE` and `JWT_SECRET` ([BE/config/env.ts](BE/config/env.ts)); uploads and email also need the Cloudinary and Gmail values. Google OAuth is optional and is disabled while its credentials are empty (see [Google OAuth](#optional-google-oauth)).

Search uses the Atlas Search index named by `ATLAS_SEARCH_INDEX` when it exists, and falls back to a regex match otherwise, so a local MongoDB works without Atlas.

### 2. Run

**With Docker** (the site is served by nginx at `http://localhost`):

```bash
docker compose up --build -d
```

[docker-compose.yaml](docker-compose.yaml) overrides the URL and callback variables for the proxied setup, so `BE/.env` can keep its local-dev values.

**Without Docker**, in two terminals (set `NEXT_PUBLIC_API_URL=http://localhost:4001` in `FE/.env` first):

```bash
cd BE && yarn install && yarn dev   # API on http://localhost:4001
cd FE && yarn install && yarn dev   # site on http://localhost:3069
```

### 3. Create the first admin account

There is no seed script: employer accounts need admin approval and new admins need activation, so the first super admin is inserted directly into the database. From the `BE` folder, hash a password:

```bash
node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" 'YourStrongPassword'
```

Then insert a document into the `accounts_admin` collection (with `mongosh` or the Atlas Data Explorer). Field definitions are in [account-admin.model.ts](BE/models/account-admin.model.ts).

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

Log in at `/admin/login` to open the admin panel (`/admin-manage`), approve employers and verify candidates.

### Optional: Google OAuth

Google sign-in is what lets UIT students verify instantly; without it, admins verify candidates manually.

1. In the [Google Cloud Console](https://console.cloud.google.com/), create an OAuth 2.0 Client ID (Web application) under **APIs & Services > Credentials**.
2. Add the authorized redirect URI for your setup:
   - Docker Compose: `http://localhost/api/auth/google/callback`
   - Without Docker: `http://localhost:4001/auth/google/callback`
3. Put the credentials in `BE/.env` as `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_CALLBACK_URL`.

## Development

The project has no automated test suite; type-checking and linting are the quality gates. Run them before committing:

```bash
cd BE && yarn typecheck && yarn lint:any   # lint:any fails on any explicit `any`
cd FE && yarn lint && yarn build
```

All scripts are defined in [BE/package.json](BE/package.json) and [FE/package.json](FE/package.json).

## Architecture

```text
Browser ──> nginx ──┬──> FE (Next.js, port 3069)
                    └──> BE (Express API + Socket.IO, port 4001) ──> MongoDB Atlas
                                                               └──> Cloudinary, Gmail, Google OAuth
```

nginx is the public entry point: it routes `/` to FE, strips the `/api/` prefix before forwarding to BE, and upgrades `/socket.io/` to WebSocket ([nginx.conf](Nginx_proxy/nginx.conf)).

The backend is layered **routes → controllers → services → models**: controllers only read the request and send the response, and all business logic and database access live in services. Where to start reading:

| Area | Entry point |
|---|---|
| API bootstrap, shutdown | [BE/index.ts](BE/index.ts), [BE/app.ts](BE/app.ts) |
| Route map | [BE/routes/index.route.ts](BE/routes/index.route.ts) |
| Auth, RBAC, rate limiting | [BE/middlewares/](BE/middlewares/) |
| Request validation (Joi) | [BE/validates/](BE/validates/) |
| Pages and dashboards | [FE/src/app/(pages)/](<FE/src/app/(pages)/>) |
| Shared frontend types | [FE/src/types/](FE/src/types/) |

## Business rules

These rules are enforced in code; the linked file is the source of truth.

- A verified UIT student's Student ID, Cohort, Full Name and Major lock once each is populated; unverified or manually registered candidates can still edit them ([ProfileForm.tsx](<FE/src/app/(pages)/candidate-manage/profile/ProfileForm.tsx>)).
- New employer accounts start pending (`initial`) and must be approved by an admin before they can post jobs ([company.service.ts](BE/services/admin/company.service.ts)).
- A candidate can edit or re-upload a CV only while it is still pending and the job hasn't expired; withdrawing an application has no such restriction ([cv.service.ts](BE/services/candidate/cv.service.ts)).
- A candidate can review a company at most once ([review.service.ts](BE/services/review.service.ts)).
- Company performance badges (Top Rated, Active Recruiter, Trusted Employer, Hot Jobs) are computed from activity, not assigned manually ([company-badges.helper.ts](BE/helpers/company-badges.helper.ts)).

## Deployment and security notes

- **Cookies:** login cookies are `httpOnly`, `sameSite: lax`, and marked `Secure` automatically when the request arrived over HTTPS ([cookie.helper.ts](BE/helpers/cookie.helper.ts)).
- **Reverse proxy:** the API trusts exactly one proxy hop so rate limits see the real client IP behind nginx; adding another proxy layer in front requires changing this ([BE/app.ts](BE/app.ts)).
- **Redeploys:** on `SIGTERM`/`SIGINT` the API stops accepting requests, lets in-flight ones finish, then closes Socket.IO, the cache and MongoDB before exiting ([BE/index.ts](BE/index.ts)).
- **Uploads** are capped at 20 MB by nginx ([nginx.conf](Nginx_proxy/nginx.conf)).

## License

[MIT](LICENSE)
