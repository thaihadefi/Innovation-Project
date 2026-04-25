# 🚀 Innovation Project: Recruitment & Review Platform

[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20%7C%20React%2019-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%204-06B6D4?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/Real--time-Socket.io-010101?style=flat-square&logo=socket.io)](https://socket.io/)

UITJobs is a comprehensive Full-stack recruitment platform—a hybrid of ITViec and Glassdoor—designed specifically for the UIT-VNUHCM ecosystem. The platform empowers candidates to discover career opportunities, review companies, and share interview insights. Simultaneously, it provides organizations with robust tools to post vacancies and manage applicants, all secured through Role-Based Access Control (RBAC).ols.

---

## ✨ Key Features

### 👤 For Candidates
- **Smart Discovery:** Personalized job recommendations based on skills and application history.
- **Advanced Search:** Full-text search powered by MongoDB Atlas Search with multi-filters.
- **Community Insights:** Browse and share company reviews and detailed interview experiences.
- **Real-time:** Instant notifications for application status updates.
- **Preparation Hub:** Access curated DSA templates and interview resources.

### 🏢 For Companies
- **Talent Management:** Comprehensive CV inbox with status tracking (Viewed, Approved, Rejected).
- **Recruitment Analytics:** Visual dashboards tracking job views, application rates, and approval metrics.
- **Brand Building:** Showcase company culture with rich descriptions, image galleries, and achievement badges.
- **Notification Fanout:** Automatically notify followers when new jobs are posted.

### 🛡️ For Admins
- **Full Moderation:** Review and approve jobs, company registrations, and community content.
- **RBAC:** Granular Role-Based Access Control for managing staff permissions.
- **Audit Logs:** Immutable tracking of all sensitive administrative actions.
- **Dashboard:** Real-time system-wide statistics overview.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, Recharts, Lucide Icons |
| **Backend** | Node.js, Express 5, TypeScript, Socket.io 4, Nodemailer |
| **Database** | MongoDB 8 (Mongoose), Atlas Search, In-memory Caching (NodeCache) |
| **Infrastructure** | Docker, Nginx Proxy, Cloudinary (Media Storage) |
| **Security** | JWT (HttpOnly Cookies), BCrypt, Helmet, Rate Limiting, HTML Sanitization |

---

## 🏗️ Architecture Overview

The project follows a decoupled MVC-inspired pattern on the backend and a modern Server/Client component hybrid strategy on the frontend.

```text
Innovation-Project/
├── BE/                  # Express 5 REST API + Socket.IO server
│   ├── controllers/     # Business logic (Admin, Candidate, Company)
│   ├── models/          # 18 Mongoose schemas
│   ├── helpers/         # Utilities: caching, mailing, search, analytics
│   └── index.ts         # Entry point & Socket.io setup
├── FE/                  # Next.js 16 App Router application
│   ├── src/app/         # Pages, Layouts, and Server Components
│   ├── src/components/  # UI Library (Tailwind 4 + Shadcn-style)
│   └── src/contexts/    # Real-time & Auth state management
└── Nginx_proxy/         # Reverse proxy configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Yarn
- MongoDB Atlas account (for search features)
- Cloudinary account (for file storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thaihadefi/Innovation-Project.git
   ```

2. **Setup Backend**
   ```bash
   cd BE
   cp .env.example .env  
   yarn install
   yarn start
   ```

3. **Setup Frontend**
   ```bash
   cd ../FE
   cp .env.example .env  # Configure API URLs
   yarn install
   yarn dev
   ```

4. **Using Docker (Recommended)**
   ```bash
   docker compose up --build -d
   ```

---

## 🔒 Security & Performance
- **Data Integrity:** Atomic MongoDB operations for application counters.
- **Privacy:** Anonymous posting options for reviews and interview experiences.
- **Safety:** Sanitized rich-text input to prevent XSS.
- **Speed:** Tiered caching system (Static/Dynamic/Short) for high-traffic endpoints.

---

## 📝 License
This project is licensed under the MIT License.
