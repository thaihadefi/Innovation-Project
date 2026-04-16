# Codebase Summary

> Last updated: 2026-04-16

## Project Overview

Full-stack **job-board / recruitment platform** (ITViec + Glassdoor hybrid). Candidates find jobs, review companies, share interview experiences. Companies post jobs and manage applicants. Admins moderate all content with RBAC.

---

## Architecture

```
Innovation Project/
├── BE/   - Node.js + Express 5 REST API + Socket.IO (port 4001)
└── FE/   - Next.js 16 App Router (port 3069)
```

**Pattern:** MVC on BE (Routes -> Controllers -> Models + Helpers layer). FE uses Next.js App Router with Server/Client Components. REST API communication; Socket.IO for real-time events.

---

## Technology Stack

### Backend (`BE/`)
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 8 |
| Cache | NodeCache (in-memory) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Real-time | Socket.IO 4 |
| File storage | Cloudinary + multer-storage-cloudinary |
| Email | Nodemailer (direct send) |
| Validation | Joi |
| Search | MongoDB Atlas Search |
| Security | Helmet (CSP enabled in production, disabled in dev), CORS (allow-all dev / env-restricted prod), express-rate-limit, cookie-parser, sanitize-html (server-side rich-text sanitization) |
| Compression | gzip (compression middleware) |

### Frontend (`FE/`)
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS 4 |
| Forms | React Hook Form 7 + Zod 4 + Joi |
| Rich text | TinyMCE React |
| File upload | FilePond |
| Charts | Recharts |
| Real-time | Socket.IO Client |
| Notifications | Sonner (toast) |
| Date picker | react-datepicker |
| Icons | react-icons |
| Sanitization | isomorphic-dompurify |

---

## MVC Architecture & Request Flow

### Route -> Controller -> Model chain

```
index.route.ts
  ├── /admin               -> adminRoutes
  ├── /candidate           -> candidateRoutes
  ├── /auth                -> authRoutes
  ├── /company             -> companyRoutes
  ├── /location            -> locationRoutes
  ├── /search              -> searchRoutes
  ├── /job                 -> jobRoutes
  ├── /salary              -> salaryRoutes
  ├── /review              -> reviewRoutes
  └── /interview-experiences -> interviewExperienceRoutes
```

### Middleware chain per request

```
generalLimiter (rate limit)
  -> cors / helmet / compression / bodyParser / cookieParser
  -> requestLogger (structured logs with latency + requestId)
  -> route-specific rate limiter (login/apply/search/OTP)
  -> auth middleware (verifyTokenCandidate | verifyTokenCompany | verifyAdminToken)
  -> permission guard (requirePermission) [admin only]
  -> Joi validation middleware
  -> controller
  -> global error handler (4-param Express middleware - catches unhandled throws, guards res.headersSent, returns generic 500)
```

**Request Logger** (`middlewares/request-logger.middleware.ts`):
- Attaches UUID as `X-Request-Id` response header
- Smart logging: only logs errors (4xx/5xx), slow requests (>=800ms, configurable via `SLOW_REQUEST_MS` env), or when `LOG_EVERY_REQUEST=true`
- Masks sensitive query params (token, password, OTP, email, auth codes) before logging
- Suppresses expected 401s on `/auth/check` (not noise)

**Global Error Handling** (`index.ts`):
- Express 4-param error handler after all routes: catches unhandled throws, guards `res.headersSent`, returns generic `500` (no stack trace leak)
- `process.on('unhandledRejection')`: logs and swallows to prevent Node.js crash (v15+)
- **Async fire-and-forget rule:** non-critical async ops (Cloudinary deletes, notification emails) use `void fn().catch(log)` - errors logged but never propagate to user response. Critical ops (OTP emails) are `await`-ed with explicit rollback.
- **Cloudinary upload safety contract** (all 6 upload-accepting controllers: `applyPost`, `createJobPost`, `jobEditPatch`, `updateCVPatch`, `profilePatch` candidate/company/admin): (1) every early-return guard before DB write cleans up `req.file`/`req.files` first; (2) old file deleted only **after** DB write succeeds; (3) catch block uses `!saved` flag (`cvSaved`, `jobSaved`, `jobUpdated`, `profileUpdated`) to avoid deleting files already referenced in DB; (4) `cleanupFile`/`cleanupNewFiles` helpers used for DRY cleanup at multiple guards.
- **Candidate profile uniqueness guards:** email/phone duplicate checks use `req.body.X !== undefined` guard - prevents false-positive 409 when field not in request (matches company profile pattern).
- **`applyPost` slot rollback:** if `req.file` absent after slot reservation, `applicationCount` is decremented before returning 400 to prevent count leak.

**Joi Validation Middleware Pattern** (`validates/` - `candidate`, `company`, `review`, `interview-experience`, `admin`):
Validates `req.body` -> 400 + first error message on fail -> `next()` on success. Admin uses a `validate(schema)` factory; candidate/company/UGC use inline async middleware functions. All auth flows consistently validate via Joi middleware before reaching controllers.

### Request object extensions
- `req.account` - `AccountCandidate | AccountCompany | null`
- `req.accountType` - `"candidate" | "company" | "guest" | "admin"`
- `req.permissions` - `string[]` (for admins)
- `req.admin` - `AccountAdmin`

---

## Backend Structure

```
BE/
├── index.ts              - Entry: Express + HTTP server + Socket.IO + graceful shutdown
├── config/               - DB config, env validation (requires DATABASE + JWT_SECRET; exits on missing), configs
├── routes/               - Route definitions per domain
├── controllers/
│   ├── auth.controller.ts
│   ├── job.controller.ts
│   ├── review.controller.ts
│   ├── interview-experience.controller.ts
│   ├── salary.controller.ts
│   ├── search.controller.ts
│   ├── location.controller.ts
│   ├── admin/            - account, candidate, company, dashboard, interview-experience, job, notification, profile, review, role
│   ├── candidate/        - auth, profile, cv, misc (recommendations)
│   └── company/          - auth, profile, job, cv, misc
├── models/               - 18 Mongoose models (incl. AdminAuditLog)
├── middlewares/          - auth, admin-auth, rate-limit, request-logger
├── helpers/              - socket, mail, cache, cache-invalidation, cloudinary, email-template, atlas-search, slugify, skill, location, company-badges, query, job-recount, banned-candidates, generate, sanitize-rich-text, admin-audit-log
│   └── mongoose-plugins/ - helpful-votes, soft-delete, is-edited (reusable schema plugins)
├── validates/            - Joi schemas: candidate, company, review, interview-experience, admin
└── interfaces/           - RequestAccount (account + accountType), RequestAdmin (admin + permissions[])
```

---

## Data Models (18)

### User Accounts

| Model | Key Fields | Key Indexes |
|---|---|---|
| `AccountCandidate` | email, password, fullName, phone, avatar, studentId, cohort, major, skills[], isVerified, status, deleted (plugin) | email unique, phone unique, studentId unique; status+createdAt and isVerified partial `{deleted:false}` |
| `AccountCompany` | email, password, companyName, slug, location, address, companyModel, companyEmployees, workingTime, workOverTime, phone, description, logo, status (initial/active/inactive, default initial), deleted (plugin) | email unique, phone unique (sparse); status+createdAt partial `{deleted:false}` |
| `AccountAdmin` | email, password, fullName, phone, avatar, role (ObjectId), isSuperAdmin, status, deleted (plugin) | email unique; status+createdAt partial `{deleted:false}` |
| `Role` | name, description, permissions[], deleted (plugin) | name unique partial `{deleted:false}` — allows name reuse after soft-delete |

### Content

| Model | Key Fields | Notes |
|---|---|---|
| `Job` | title, slug, position, description, skills[] (String), locations[] (ObjectId ref Location), workingForm, salaryMin/Max, expirationDate, maxApplications (0=unlimited), maxApproved (0=unlimited), applicationCount, approvedCount, viewCount, images[] (String), deleted (plugin) | 7 discovery indexes all with partial `{deleted:false}`: companyId+createdAt, position, workingForm, salaryMin+Max, expirationDate+createdAt, skills+createdAt, locations+createdAt |
| `Review` | companyId, candidateId, overallRating (1-5), ratings{salary, workLifeBalance, career, culture, management}, title (max 100), content, pros, cons, isAnonymous, status (pending/approved/rejected, default approved), isEdited (plugin), helpfulVotes[] (plugin), helpfulCount (plugin), deleted (plugin) | companyId+createdAt and candidateId partial `{deleted:false}`; companyId+candidateId unique; deleted standalone for admin queries |
| `InterviewExperience` | title (max 150), content, companyName, position, result (passed/failed/pending), difficulty (easy/medium/hard), authorId, authorName (cached), isAnonymous, helpfulVotes[] (plugin), helpfulCount (plugin), commentCount, status (pending/approved/rejected), deleted (plugin), isEdited (plugin) | deleted+status+createdAt (already includes deleted); authorId partial `{deleted:false}` |
| `ExperienceComment` | experienceId, authorId, authorName, content, isAnonymous, parentId, replyToId, replyToName, helpfulVotes[] (plugin), helpfulCount (plugin), deleted (plugin), isEdited (plugin) | experienceId+parentId+createdAt and authorId both partial `{deleted:false}` |

### Interactions

| Model | Key Fields | Notes |
|---|---|---|
| `CV` | jobId, candidateId (optional, backfilled), fullName, email, phone, fileCV (Cloudinary URL), status (initial/viewed/approved/rejected) | One per job per email (unique index); state machine enforced server-side |
| `SavedJob` | candidateId, jobId | Bookmarks |
| `FollowCompany` | candidateId, companyId | Follower tracking for new job notifications |
| `JobView` | jobId, viewerId (nullable), fingerprint (IP, nullable), viewDate (YYYY-MM-DD) | Unique view per user per day via compound index `(jobId,viewerId,viewDate)` unique+sparse; anonymous users use IP fingerprint `(jobId,fingerprint,viewDate)`; duplicate key -> silently skip; owner viewing own job excluded; TTL: 30 days |
| `Notification` | candidateId/companyId/adminId, type, title, message, link, read, data{jobId,cvId,...} | TTL: 30 days; extra index `{candidateId,createdAt}` for max-50 trim aggregation |
| `Report` | targetType, targetId, reporterId, reporterType, reporterIp, reason, status | TTL: 30 days |

### Infrastructure

| Model | Purpose | Notes |
|---|---|---|
| `Location` | City/region lookup | Static reference data |
| `ForgotPassword` | OTP token for password reset | One-time use |
| `EmailChangeRequest` | OTP token for email change (`expireAt` TTL field, consistent with ForgotPassword) | One-time use |
| `AdminAuditLog` | Immutable log of sensitive admin actions | Fields: actorId, actorEmail, action, targetId, targetType, detail (Mixed); TTL: 90 days; collection: `admin_audit_logs`; actions: candidate.verify/unverify/ban/unban/delete, company.approve/ban/status_change/delete, job.delete, role.create/update/delete, experience.approve/reject/delete/comment_delete, review.approve/reject/delete, report.resolve/dismiss, account.create/update/delete/role_assign |

---

## Key BE Patterns & Business Rules

- **Verified field locks:** After admin verifies candidate, fields `fullName`, `studentId`, `cohort`, `major` become read-only - cannot be changed via profile update
- **Email change flow:** Candidate cannot change email directly; must go through OTP flow (request -> OTP to new email + security alert to old -> verify -> cookie cleared -> forced re-login)
- **CV edit lock:** CV cannot be edited once status ≠ `"initial"` OR job has expired
- **Idempotency on apply:** Unique index `(jobId, email)` on CV prevents duplicate submissions
- **Atomic OTP ops:** `EmailChangeRequest` uses upsert to prevent race conditions; OTP verify uses findAndDelete (atomic one-time use)
- **Atomic counters:** All count increments/decrements (`applicationCount`, `approvedCount`, `viewCount`) use MongoDB `$inc` operator directly - never read-modify-write - eliminating race conditions under concurrent load
- **Floor guards:** `applicationCount`/`approvedCount` decrements guarded with `$gt: 0` to prevent negative values
- **Follower notification fanout:** On new job post -> bulk fetch all followers -> batch-create notifications -> queue emails (best-effort) -> auto-trim old notifications per user (maxStored=50)
- **Banned candidate soft-hide:** Content from banned users stays in DB; filtered at query time via `getBannedCandidateIds()`; unban auto-restores visibility
- **Cascading cache invalidation:** CV deletion triggers `invalidateJobDiscoveryCaches()` to keep search results consistent
- **Admin ban candidate cascade (atomic):** Status update + `recountJobApplications` run in the SAME MongoDB session (transaction). Post-transaction: invalidate BOTH job discovery caches AND experience caches (visibility changes affect both).
- **Admin delete candidate cascade:** Cloudinary avatar deleted -> all candidate CV files deleted from Cloudinary -> CVs deleted -> affected job application counts atomically recounted -> related content (saved jobs, follows, reviews, reports, notifications, experiences, comments) deleted.
- **Admin ban/approve company:** On status -> `active` transition: queue `companyApproved` email + Socket.IO notification to company; on any status change: `invalidateJobDiscoveryCaches()`.
- **Admin delete job cascade:** Cloudinary images deleted -> CV files deleted from Cloudinary -> CVs deleted -> Job + SavedJobs + JobViews + Notifications deleted in parallel (`Promise.allSettled`) -> `invalidateJobDiscoveryCaches()`.
- **Admin experience moderation idempotency:** `updateStatus` skips notification if status didn't change (idempotent); on actual status change: creates notification + `notifyCandidate` via Socket.IO + `invalidateExperienceCaches(id)`.
- **Admin review moderation:** `updateReviewStatus` (approve/reject); batch-fetches company + candidate names for admin list view; `invalidateJobDiscoveryCaches()` on status change (review stats affect company ranking). Admin/candidate delete uses soft-delete (`deleted: true`) - review stays in DB but excluded from all public queries and company rating aggregations.
- **Admin login `rememberPassword`:** Cookie TTL = 7d if checked, 1d otherwise; `adminToken` cookie with `httpOnly`, `sameSite: lax`, `secure` in production.
- **Candidate CV list triple-path Atlas search:** Parallel search on company name/slug AND job title/description -> merged jobId set; fallback gracefully to empty on Atlas errors.
- **Review isVerified guard:** Only `isVerified = true` candidates can create, edit, delete reviews, or mark reviews helpful (403 otherwise). `reportReview` is intentionally exempt - guests and any user can report. One review per candidate per company enforced by unique index.
- **Interview experience isVerified guard:** All endpoints (read + write) require `isVerified = true`. `GET /interview-experiences`, `GET /interview-experiences/:id`, `GET /interview-experiences/:id/comments` require `verifyTokenCandidate` + `isVerified`; all write ops (create, update, delete, helpful, comment CRUD, report) also require `isVerified`. No public access to interview experiences.
- **Admin notify on new content:** When a candidate submits a review or interview experience, all admin accounts with relevant permissions are fetched and notified in real-time via Socket.IO + DB notification; non-critical (fire-and-forget, errors swallowed).
- **Interview experience filters:** List endpoint accepts `result` (passed/failed/pending) + `difficulty` (easy/medium/hard) + `keyword`; paginated 10/page (`experiencesList`); cache key = `experiences:list:{page}:{keyword}:{result}:{difficulty}`.
- **Experience comments paginated:** 20/page (`experienceComments`); comments can be helpful-voted and reported.

---

## Helper Utilities (full list)

| Helper | Purpose |
|---|---|
| `generate.helper` | `generateRandomNumber(n)` - cryptographically secure via `crypto.randomInt` |
| `query.helper` | `decodeQueryValue()` (URL decode + trim), `escapeRegex()` (sanitize user input for regex) |
| `skill.helper` | `normalizeSkillKey()` - lowercase + NFD strip diacritics + keep `+.#-`; dedupes; handles C++/C# correctly |
| `location.helper` | `normalizeLocationSlug()` + `findLocationByNormalizedSlug()` - exact slug match with hex-suffix fallback |
| `slugify.helper` | `convertToSlug()` - Vietnamese-aware slug generation |
| `banned-candidates.helper` | `getBannedCandidateIds()` - cached (SHORT 60s TTL) list of inactive candidate IDs; `invalidateBannedCandidateCache()` called on ban/unban |
| `job-recount.helper` | `recountJobApplications()` - MongoDB transaction atomic recount of `applicationCount`/`approvedCount`; single bulk `CV.find({ jobId: { $in: ... } })` + JS grouping (no N+1); banned-candidate lookup scoped to affected CVs only (no full-table load); supports `preOps` in same transaction |
| `cache.helper` | In-memory cache via NodeCache (see Cache section). Note: single-process only - horizontal deployments with multiple instances will have per-instance caches (no shared invalidation). |
| `cache-invalidation.helper` | Domain-level cache invalidation (see Cache section) |
| `sanitize-rich-text.helper` | `sanitizeRichText(html)` - allowlist-based HTML sanitizer via `sanitize-html`; strips `<script>`, event handlers, `javascript:` hrefs, `data:` URIs. `stripHtml(text)` - removes all tags for plain-text fields. Applied on all user-generated rich text before DB write (Job, Review, InterviewExperience, ExperienceComment). |
| `admin-audit-log.helper` | `logAdminAction(params)` - fire-and-forget write to `AdminAuditLog` collection. Never throws; logging failure never interrupts the caller. |
| `atlas-search.helper` | `findIdsByKeyword({ model, keyword, atlasPaths, atlasMatch?, limit=2000 })` - generic reusable Atlas `$search` aggregation; rejects symbol-only inputs; detects Atlas-unavailable errors (free-tier / local dev) and re-throws with clear message; used across search, company CV, admin list controllers |
| `company-badges.helper` | Metric-based badge calculation (see Badges section) |
| `cloudinary.helper` | 3 Multer storage configs: `imageStorage` (jpg/jpeg/png/gif/webp -> folder `images`), `pdfStorage` (PDF -> folder `cvs`, resource_type: raw), `storage` (auto, legacy). `extractPublicId(url)` parses Cloudinary URL to public_id. Direct delete (no queue). All `deleteImage`/`deleteImages` calls are fire-and-forget (`void .catch(log)`) - Cloudinary failure never blocks user-facing operations. |
| `mail.helper` | Nodemailer direct send via `sendEmail()` (throws on SMTP failure). OTP/critical emails (`await` + rollback on failure). Notification emails fire-and-forget (`void .catch`). |
| `email-template.helper` | HTML email template builder |
| `socket.helper` | Socket.IO server init + notify functions |

---

## Algorithms & Business Logic

### 1. Recommendation Algorithm
**Location:** `controllers/candidate/misc.controller.ts -> getRecommendations()`

**Logic:**
1. Load candidate's `profile.skills[]`
2. Load skills from past applications via `CV` email lookup -> `Job.skills`
3. Find active jobs with `skills $in [allRelevantSkills]`, excluding already applied/saved
4. **Score each job:**
   - +3 pts per skill matching profile skills
   - +1 pt per skill from past applications (not in profile)
5. Sort by score descending -> return top 10
6. **Cold start:** returns empty if candidate has no skills
7. **Response includes `basedOn`:** top 5 skills used (`candidateRecommendationBasedOnLimit = 5`) + optional `message` explaining empty results (already applied/no matches)

**Config:** `discoveryConfig.candidateRecommendationLimit = 10`

### 2. Search Algorithm
**Location:** `controllers/search.controller.ts -> search()`

**Pipeline (multi-filter with Atlas):**
1. Atlas `$search` full-text on `["title", "description", "position", "workingForm"]` (limit 5000)
2. `$match` filters applied after Atlas: keyword -> location slug -> position -> workingForm -> skill -> company -> active status
3. Results enriched with company info + location names + application counts
4. `isFull = maxApproved > 0 && approvedCount >= maxApproved`
5. **Cache:** key = `search:{normalized_params}`, TTL = 60s

### 3. Salary Insights Aggregation
**Location:** `controllers/salary.controller.ts -> getSalaryInsights()`

**Four parallel aggregations (active jobs only):**
1. **By Position:** group -> avg/min/max salary per position
2. **By Skill:** unwind skills[] -> top 15 skills by job count
3. **By Location:** unwind locations[] -> lookup city names -> top 10 locations
4. **Market Overview:** global avg/min/max across all active jobs
5. `avgSalary = Math.round((avgSalaryMin + avgSalaryMax) / 2)`

### 4. Company Badges
**Location:** `helpers/company-badges.helper.ts`

| Badge | Criteria |
|---|---|
| Top Rated | avgRating >= 4.5 AND reviewCount >= 3 |
| Active Recruiter | totalApproved >= 10 |
| Trusted Employer | reviewCount >= 15 |
| Hot Jobs | activeJobCount >= 5 |

**Approved count:** batch aggregation via CV -> Job lookup, avoids N+1 queries.

---

## Cache System

**Location:** `helpers/cache.helper.ts` + `helpers/cache-invalidation.helper.ts`

**In-memory only (NodeCache):** sync access, 5-min default TTL, 60s check period.

**TTL tiers:**
| Tier | Duration | Use |
|---|---|---|
| STATIC | 1800s | Locations, skills, static lists |
| DYNAMIC | 300s | Jobs, companies |
| SHORT | 60s | Search results, very dynamic data |

**API:** `cache.get/set/del/delPattern/delPrefix()`

**Invalidation patterns:**
- `invalidateJobDiscoveryCaches()` - clears job_skills, top_locations, top_companies, banned_company_ids, company_list:*, search:*
- `invalidateExperienceCaches()` - clears experiences:list:*, optionally detail cache

---

## Socket.IO Architecture

**Location:** `helpers/socket.helper.ts`

**Auth on handshake:**
- Extracts cookies from handshake headers
- **Admin guard:** Decodes `adminToken` and checks `role === "admin"` in the JWT payload - client query params (`isAdmin`) are ignored. Falls through to `token` (candidate/company) if adminToken is absent or decodes to a non-admin role.
- Real client IP extracted from `x-forwarded-for` header (Nginx proxy); falls back to `handshake.address` for direct connections.
- Rate limit: 60 auth attempts/min per IP
- Validates account status (active); rejects banned/inactive users

**In-memory socket maps (multi-tab/device support):**
```
userSockets:    Map<candidateId, Set<socketId>>
companySockets: Map<companyId, Set<socketId>>
adminSockets:   Map<adminId, Set<socketId>>
```

**Events emitted:**
- `"new_notification"` -> to all sockets of target user

**Helper functions:**
- `notifyCandidate(id, notification)`
- `notifyCompany(id, notification)`
- `notifyAdmin(id, notification)`

---

## Authentication Flow

**JWT Strategy:**
- Payload: `{ id, email, role }`; stored in HttpOnly cookies (`token`, `adminToken`)
- `verifyTokenCandidate` / `verifyTokenCompany` / `verifyTokenAny` / `verifyAdminToken`
- All `jwt.sign`/`jwt.verify` calls use `process.env.JWT_SECRET as string` (never template coercion). `validateEnv()` exits process on startup if `JWT_SECRET` is absent.

**Auth flows:**
1. **Register** -> Joi validate -> bcrypt hash -> save -> issue JWT
2. **Login** -> verify password -> JWT in cookie
3. **Forgot Password** -> 6-digit OTP -> email queue -> verify OTP -> reset
4. **Email Change** -> OTP to new email -> verify -> update

**Rate limits:** 5 forgot-password/15min, 10 OTP verify/15min, 5 email-change/15min

---

## Admin RBAC

**Permissions (20 strings):**
```
candidates_view, candidates_verify, candidates_ban, candidates_delete
companies_view, companies_approve, companies_ban, companies_delete
jobs_view, jobs_delete
roles_view, roles_manage
accounts_view, accounts_manage
experiences_view, experiences_manage
reviews_manage
reports_view, reports_manage
audit_logs_view
```

**Guard:** `requirePermission(perm)` - checks `req.admin.isSuperAdmin || req.permissions.includes(perm)`
**SuperAdmin bypass:** `isSuperAdmin = true` skips all permission checks.
**Admin activation:** Manual DB status update (not auto-approved on register).
**Privilege escalation prevention:** `canActorGrantRole()` in `account.controller.ts` ensures a non-superadmin actor can only assign roles whose permission set is a strict subset of their own. Applies to `create`, `update`, and `setRole` endpoints.
**Audit log:** All sensitive admin actions across all 6 admin controller domains are logged to `AdminAuditLog` via `logAdminAction()` (fire-and-forget, never blocks response). See AdminAuditLog model above for full action list. UI: `GET /admin/audit-logs` (requires `audit_logs_view`), paginated with actorEmail/action filters.

**Dashboard stats** (`/admin/dashboard` -> `dashboard.controller.ts -> stats()`):
10 parallel `countDocuments` queries returning:
- Candidates: total / active / inactive / unverified
- Companies: total / pending (`initial`) / active / inactive
- Jobs: total
- CVs: total

---

## Account Lifecycle Flows

**Candidate status:**
- Default: `status = "active"`, `isVerified = false`
- Admin verifies -> `isVerified = true` -> email `studentVerified` sent -> unlocks full features
- Admin bans -> `status = "inactive"` -> blocked at auth middleware; content soft-hidden from public queries (via `getBannedCandidateIds`); application counts recounted via transaction

**Company status:**
- Register -> `status = "initial"` (pending review)
- Admin approves -> `status = "active"` -> email `companyApproved` sent -> can post jobs
- Admin bans -> `status = "inactive"` -> blocked at auth middleware; jobs hidden from search

**Content moderation states:**
- `InterviewExperience`: default `status = "pending"` -> admin approves/rejects -> notification sent
- `Review`: default `status = "approved"` (auto-publish) -> admin can reject/delete (soft-delete: `deleted: true`); candidate can also delete own review (soft-delete)
- `Job`: always visible while not expired; admin can delete

---

## CV / Application System

**Status flow:** `initial -> viewed -> approved | rejected` (state machine enforced server-side; invalid transitions return 422)

**Application limits per job:**
- `maxApplications` - total submissions cap
- `maxApproved` - approved CV cap; `isFull = approvedCount >= maxApproved`

**On approve:** notification + email `cvApproved` sent to candidate; `approvedCount` incremented.
**On reject:** notification + email `cvRejected` sent to candidate.

---

## Notification System

**Types:** `new_job | application_received | application_viewed | application_approved | application_rejected | applications_limit_reached | experience_approved | experience_rejected | other`

**Delivery:** DB record + Socket.IO real-time push + optional email via queue

**Limits:** max 50 stored per user; dropdown shows 5; TTL 30 days auto-delete.

---

## Email Notification System (Transactional Emails)

All emails use a branded HTML template (UITJobs brand color `#2563eb`, responsive layout, auto-escaped user content).

| Template | Trigger | OTP expiry |
|---|---|---|
| `forgotPasswordOtp` | Password reset requested | 5 min |
| `emailChangeOtp` | Email change OTP to new address | 10 min |
| `emailChangeSecurityAlert` | Security alert to OLD address on change request | - |
| `passwordChanged` | Password successfully changed | - |
| `cvApproved` | Company approves candidate application | - |
| `cvRejected` | Company rejects candidate application | - |
| `studentVerified` | Admin verifies candidate's student account | - |
| `companyApproved` | Admin approves company registration | - |

All emails sent directly via Nodemailer (no queue, no retry).

---

## Company Analytics

**Endpoint:** `GET /company/analytics`
**Location:** `controllers/company/misc.controller.ts -> getAnalytics()`

**Overview metrics** (all jobs, all time):
- `totalViews` - sum of `Job.viewCount` across all jobs
- `totalApplications` - total CVs (all statuses)
- `totalApproved` / `totalRejected` / `totalViewed` / `totalInitial` - by CV status
- `approvalRate` per job = `approved / totalApplications * 100`
- `applyRate` per job = `applications / views * 100`

**Per-job breakdown:**
- Time range filter: `7d | 30d | 90d | all` (default 30d)
- Sort: `views | applications | approved` (default views)
- Top 10 jobs for chart (`analyticsTopJobs = 10`)
- Fields per job: id, title, slug, views, applications, approved, applyRate, approvalRate, isExpired

---

## Report / Moderation System

**Targets:** `review | comment`
**Reporter types:** `candidate | company | guest`
**Unique constraint:** one report per user per target; one per guest IP per target
**TTL:** auto-delete after 30 days
**Admin actions:** view pending -> resolved | dismissed
**Auto-resolve:** when admin/candidate deletes a review or comment, all associated reports are automatically set to `status: "resolved"` (preserves audit trail; TTL cleans up after 30 days)

---

## Frontend Structure

```
FE/src/
├── app/
│   ├── layout.tsx / globals.css / not-found.tsx
│   └── (pages)/
│       ├── (home)/              - Landing page + RecommendedJobs
│       ├── admin/               - Admin auth (login, register, forgot-password, OTP, reset)
│       ├── admin-manage/        - Admin dashboard (accounts, candidates, companies, jobs, reviews, experiences, roles, notifications, reports, profile)
│       ├── candidate/           - Candidate auth pages
│       ├── candidate-manage/    - Profile, CV (list/view/edit), saved-jobs, followed-companies, recommendations, interview-preparation, notifications
│       ├── company/             - Company public pages (list, detail) + auth
│       ├── company-manage/      - Profile, job management, CV inbox, analytics, notifications
│       ├── job/detail           - Job detail page
│       ├── search/              - Full-text search results
│       ├── salary-insights/     - Salary charts (Recharts)
│       └── faq/                 - FAQ (static, data-driven via faq-data.ts)
├── actions/revalidate.ts        - Next.js Server Actions (cache revalidation)
├── configs/                     - API endpoints, constants
├── contexts/AuthContext.tsx     - Global auth state
├── hooks/                       - useAuth (wraps AuthContext), useSocket (Socket.IO client), useListQueryState (URL page/keyword state via history.replaceState), useIsMounted (SSR hydration guard)
├── contexts/AdminSocketContext  - Context Provider for admin socket; wraps admin layout; auto-disconnect on unmount
├── contexts/SocketContext       - Candidate/company socket; skips creation if admin socket active
├── schemas/                     - admin.schema.ts, auth.schema.ts, job.schema.ts, profile.schema.ts (Zod + RHF)
├── types/                       - global.d.ts (TypeScript type definitions)
├── middleware.ts                - Sets `x-current-path` header so server components can read current URL (Next.js headers() only works server-side)
└── utils/                       - keyword.ts (`normalizeKeyword` + `hasAlphaNum`, same symbol-only guard as BE Atlas helper), locationSort.ts (puts "Other" last), skill.ts (`normalizeSkillDisplay` lowercase+trim, `normalizeSkillKey` NFD strip diacritics + keep `+.#-`), slugify.ts, time-ago.ts (relative time)
```

**Server vs Client Component strategy:**
- **Default: Server Components** - pages, layouts, data-fetching wrappers. Run on server, zero JS bundle cost, can `await` directly.
- **`"use client"` boundary** - added only when component needs: browser APIs (`window`, `localStorage`), React state/effects, event handlers, or context consumers. Naming convention: `*Client.tsx` suffix (e.g. `SearchContainer.tsx`, `JobListClient.tsx`) signals client boundary clearly.
- **Data flow pattern:** Server Component fetches data via `fetch()` → passes as props to Client Component child. Client Components also call `fetch()` directly inside event handlers/form submits (mutations). No SWR or React Query used.
- **Auth state:** `AuthContext` is client-only (`"use client"`); server components read auth from cookies via `middleware.ts` injected header or direct cookie access.
- **Socket contexts:** `SocketContext` + `AdminSocketContext` are both `"use client"` - live in root/admin layout, passed down via context.
- **Actions:** `actions/revalidate.ts` uses `"use server"` directive - called from client to trigger `revalidatePath`/`revalidateTag` after mutations.

**Interview Preparation Hub** (`candidate-manage/interview-preparation/`):
Two sections (config-driven via `interviewPrepConfig.ts`):
1. **Interview Experiences** (Community) - browse/create anonymous interview stories from UIT students/alumni
2. **Resources** - currently featuring DSA code templates, stages of an interview, cheatsheets, and practice resources - with active expansion planned to cover system design, CS fundamentals, behavioral questions, and beyond - giving candidates structured support through every stage from job discovery to offer.

**FE shared component groups:**
- `components/section/Section1.tsx` - Homepage **search hero**: keyword input + location dropdown + total job count display + skill autocomplete; uses `normalizeKeyword` for symbol-only guard; dual mode (standalone URL navigation vs controlled via props for search page)
- `components/common/JobDataRefreshListener` - Cross-tab data freshness: writes `job_data_mutated_at` to localStorage on mutation, reads on navigation; triggers `router.refresh()` on pages (home / search / company list / company detail) if mutation is newer than last applied; prevents stale SSR data after apply/follow actions
- `components/common/LayoutShell` - Wraps Header+Footer; hides both for `/admin-manage/*` routes
- `components/common/` - also: BackToTop, DisableNumberInputScroll, ListSearchBar, SanitizedHTML
- `components/notification/` - 3 role-specific variants: `NotificationDropdown` (candidate, integrates `useSocket` for real-time unread count bump), `CompanyNotificationDropdown`, `AdminNotificationDropdown` (uses `useAdminSocketContext()` for real-time updates); all show latest 5, mark read on open
- `components/review/ReviewSection` - Full review UI: star rating display, inline `ReviewForm` (Zod + RHF), helpful vote toggle, report button, filter by rating, anonymous name masking; `ReviewForm` supports create + edit modes
- `components/ui/CompanyBadges` - Renders company achievement badges (max 3 shown, "+n more" overflow); hover tooltip with description; maps badge `id` -> react-icon (FaStar/FaBriefcase/FaCircleCheck/FaFire)
- `components/header/` - Header, `HeaderAccount` (candidate Login button passes `?redirect=currentPath`; **Logout also passes `?redirect=currentPath`** so both login and post-logout re-login return to originating page; same for company Logout), `HeaderMenu` (client: lazy-fetches topSkills/topCompanies/topLocations on mount for navbar dropdowns; mobile accordion nav; `buildSearchLink()` constructs search URL with skill/location/company param; Employer Login link also passes `?redirect=currentPath`)
- `components/button/`, `components/card/`, `components/modal/`, `components/pagination/`, `components/editor/`, `components/gallery/`
- `components/skill-input-autocomplete.tsx` - autocomplete skill selector

**AuthContext (`src/contexts/AuthContext.tsx`):**
- Shape: `{ isLogin, infoCandidate, infoCompany, authLoading, refreshAuth }`
- Initialized from: (1) server-passed `initialAuth` prop, or (2) `sessionStorage` cache (5-min TTL), or (3) fresh API fetch
- Prevents auth flash on client navigation via sessionStorage cache
- `refreshAuth()` re-fetches from API and updates state + cache

**Admin permission resolver (`admin-manage/helpers.ts`):**
`getAdminPermissions()` - SSR server function; fetches `/admin/auth/check`; returns `null` for SuperAdmin (full access bypass), `string[]` from role for role-based admins, `[]` for no-role (dashboard-only access).

**Interview Prep layout (`InterviewPrepLayoutClient.tsx`):**
Client-side sidebar with built-in keyword search across all prep sections; search index is derived from `interviewPreparationSections` config at build time; navigates on Enter/click.

**FE configs (`src/configs/variable.ts`):**
- `positionList` - intern / fresher / junior / middle / senior / manager (FE enforces these 6; BE stores position as free text, no enum restriction)
- `workingFormList` - office (On-site) / remote / flexible
- `cvStatusList` - initial(#121212) / viewed(#0088FF) / approved(#47BE02) / rejected(#FF5100)
- `paginationConfig` - companyList: 20, companyDetailJobs: 9, homeTopEmployers: 12, homeTopCompanies: 6, analyticsTopJobs: 10, interviewPrepRoot: 8, topSkills: 5, navbarTopSkills: 5, navbarTopCompanies: 5, navbarTopLocations: 5, maxDisplayedJobLocations: 5
- `notificationConfig` - dropdownLimit: 5, pageSize: 10
- `followConfig` - pageSize: 9

**Socket architecture (Context-based):**
- `SocketContext` - Candidate/company socket. Initializes on mount when logged in + not admin. Checks `window.__admin_socket_active__` to skip socket creation during admin session. Listens to `admin-socket-inactive` CustomEvent on real unmount to reconnect when admin session ends. Uses polling (dev) or polling+WebSocket (prod) with exponential backoff (1s–5s). Singleton stored in `window.__app_socket__`.
- `AdminSocketContext` - Admin socket. Wraps admin layout (`/admin-manage`). Auto-initializes regardless of auth state. Sends `query: { isAdmin: "true" }` in socket.io options. Dispatches `admin-socket-inactive` CustomEvent on unmount (guarded by `hasMounted` ref). Singleton stored in `window.__app_admin_socket__`.
- Both contexts listen for `"new_notification"` events; Admin components use `useAdminSocketContext()` to access the admin socket.

**Key SSR pages:**
- **Home** - 5 parallel server fetches: auth + total job count + top companies + top skills + locations (sorted, "Other" last); `Section2` renders top employers grid (3-col, `CardCompanyItem`); `RecommendedJobs` client component - pre-seeded with SSR recommendations, re-fetches client-side on mount if candidate logged in, shows top 6 from API
- **Company list** (`/company/list`) - SSR seed + `Section2` client component: keyword + location filter; 30s client-side cache (`COMPANY_SEARCH_CACHE_TTL_MS`); paginated (20/page); `CardSkeleton` while loading
- **Company job create/edit** (`/company-manage/job/create` + `/edit/[id]`) - `FormCreate`/`FormEdit` integrates: FilePond (image upload with preview, `FilePondPluginFileValidateType` + `FilePondPluginImagePreview`), TinyMCE (`next/dynamic`, SSR disabled), Zod+RHF (`jobFormSchema`), react-datepicker (expiration), SkillInputAutocomplete - all in one form
- **Company analytics** (`/company-manage/analytics`) - `AnalyticsClient`: URL-driven time range (7d/30d/90d/all) + sort (views/applications/approved) via `useSearchParams`; Recharts `BarChart` per-job breakdown; summary metrics cards
- **Company detail** (`/company/detail/[slug]`) - SSR: company info (model, size, working hours, overtime, description, follower count) + `CompanyJobsPagination` (client, 9/page) + `ReviewSection`; owner detection (disables follow for own company); `SanitizedHTML` for description
- **Job detail** (`/job/detail/[slug]`) - SSR: 65/35 layout; expiration countdown (red <3d, orange <7d); status warnings (expired/full/closed); application stats (total applications, approved count, fill indicator); image gallery; `ConditionallyShowsFormApply`; view count tracked via cookies; company info card
- **Salary insights** (`/salary-insights`) - SSR fetches all 4 aggregations; `SalaryInsightsClient` renders 4 `BarChart` (Recharts) tabs: by position / by skill / by location / market overview; each bar shows avg/min/max salary
- **Recommendations** (`/candidate-manage/recommendations`) - SSR pre-seeded; `RecommendationsClient` shows recommended jobs + `basedOn` skills pills + fallback message if no results
- **Interview experience detail** (`/experiences/[id]`) - SSR; `ExperienceHelpful` (toggle helpful vote), `ExperienceDetailActions` (edit/delete for author, uses `ConfirmModal`), `ExperienceComments` (Zod+RHF comment CRUD, anonymous option, helpful vote + report per comment)
- **Search** (`/search`) - `SearchContainer` client; URL-driven filters (keyword, location, position, workingForm, skills); debounced refetch; shows `Section1` hero in controlled mode

**Key page-level components:** CardJobItem, CardCompanyItem, SaveJobButton, FollowButton, FormApply, SearchContainer, Pagination, EditorMCE (TinyMCE), SanitizedHTML (dompurify), JobDataRefreshListener, ConfirmModal, EmailChangeModal, ReviewSection, CompanyBadges, ImageGallery

---

## REST API Endpoints

### Shared Auth
| Method | Path | Description |
|---|---|---|
| GET | `/auth/check` | Verify JWT -> returns candidate or company profile; no-cache headers (used by FE AuthContext) |
| POST | `/auth/logout` | Clear `token` cookie |

### Public / Job
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/job/skills` | - | All skill keys |
| GET | `/job/detail/:slug` | any | Job detail + viewed tracking |
| POST | `/job/apply` | verified candidate | Submit CV (PDF upload, rate-limited) |
| GET | `/job/check-applied/:jobId` | any | Check if already applied |
| GET | `/search` | - | Full-text search with filters |
| GET | `/salary/insights` | - | Salary insights aggregation |
| GET | `/location` | - | All locations (cached STATIC 1800s) |
| GET | `/location/top-locations` | - | Top 5 locations by active job count; sorted by count DESC then name ASC (vi locale); cached STATIC 1800s |

### Candidate
| Method | Path | Description |
|---|---|---|
| POST | `/candidate/register` | Register |
| POST | `/candidate/login` | Login (rate-limited) |
| POST | `/candidate/forgot-password` | Send OTP |
| POST | `/candidate/otp-password` | Verify OTP |
| POST | `/candidate/reset-password` | Reset after OTP |
| PATCH | `/candidate/profile` | Update profile + avatar |
| GET/PATCH/DELETE | `/candidate/cv/list`, `/candidate/cv/detail/:id`, `/candidate/cv/edit/:id`, `/candidate/cv/delete/:id` | CV management (apply via `/job/apply`) |
| POST/GET | `/candidate/job/save/:jobId`, `/candidate/job/saved`, `/candidate/job/save/check/:jobId` | Saved jobs |
| POST/GET | `/candidate/follow/:companyId`, `/candidate/followed-companies`, `/candidate/follow/check/:companyId` | Follow management |
| GET | `/candidate/recommendations` | Personalized recommendations |
| GET/PATCH | `/candidate/notifications/*` | Notifications |
| POST | `/candidate/request-email-change` | Email change OTP |
| POST | `/candidate/verify-email-change` | Verify email change |

### Company
| Method | Path | Description |
|---|---|---|
| GET | `/company/top-companies` | Top companies by job count + badges |
| GET | `/company/list` | Company list (public) |
| GET | `/company/detail/:slug` | Company detail (public) |
| POST | `/company/register` | Register |
| POST | `/company/login` | Login |
| POST/POST/POST | `/company/forgot-password`, `/company/otp-password`, `/company/reset-password` | Password flow |
| PATCH | `/company/profile` | Update profile + logo |
| GET/POST/PATCH/DELETE | `/company/job/*` | Job CRUD + image upload (max 6) |
| GET/PATCH/DELETE | `/company/cv/*` | View applications (dual Atlas search: by job title + by candidate fullName/email; excludes banned candidates), update status, delete |
| GET | `/company/analytics` | Company analytics |
| GET | `/company/follower-count` | Follower count |
| GET/PATCH | `/company/notifications/*` | Notifications |
| POST | `/company/request-email-change` | Email change OTP |
| POST | `/company/verify-email-change` | Verify email change |

### Review
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/review/company/:companyId` | - | Company reviews list |
| POST | `/review/create` | verified candidate | Create review |
| PATCH | `/review/:id` | verified candidate | Edit review |
| DELETE | `/review/:id` | verified candidate | Delete review |
| GET | `/review/my-reviews` | candidate | My reviews |
| GET | `/review/can-review/:companyId` | candidate | Check eligibility |
| POST | `/review/:id/helpful` | verified candidate | Mark helpful |
| POST | `/review/:id/report` | any | Report review |

### Interview Experiences
> All endpoints require `verifyTokenCandidate` + `isVerified`. No public access.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/interview-experiences` | verified candidate | List all (paginated) |
| GET | `/interview-experiences/:id` | verified candidate | Detail |
| POST | `/interview-experiences` | verified candidate | Create post |
| PATCH | `/interview-experiences/:id` | verified candidate | Edit post |
| DELETE | `/interview-experiences/:id` | verified candidate | Delete post |
| POST | `/interview-experiences/:id/helpful` | verified candidate | Mark post helpful |
| GET | `/interview-experiences/:id/comments` | verified candidate | Get comments |
| POST | `/interview-experiences/:id/comments` | verified candidate | Create comment |
| PATCH | `/interview-experiences/comments/:commentId` | verified candidate | Edit comment |
| DELETE | `/interview-experiences/comments/:commentId` | verified candidate | Delete comment |
| POST | `/interview-experiences/comments/:commentId/helpful` | verified candidate | Mark comment helpful |
| POST | `/interview-experiences/comments/:commentId/report` | verified candidate | Report comment |

### Admin Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/admin/auth/register` | - | Register admin (status=initial, awaits activation) |
| POST | `/admin/auth/login` | - | Login; `rememberPassword` -> 7d vs 1d cookie |
| POST | `/admin/auth/forgot-password` | - | Send OTP (rate-limited) |
| POST | `/admin/auth/otp-password` | - | Verify OTP |
| POST | `/admin/auth/reset-password` | admin token | Reset password |
| POST | `/admin/auth/logout` | - | Clear `adminToken` cookie |
| GET | `/admin/auth/check` | admin token | Verify token -> returns admin info + permissions + role |

### Admin (all require `verifyAdminToken`)
| Endpoint group | Permission required |
|---|---|
| GET/PATCH/DELETE `/admin/candidates/*` | candidates_view/verify/ban/delete |
| GET/PATCH/DELETE `/admin/companies/*` | companies_view/approve/ban/delete |
| GET/DELETE `/admin/jobs/*` | jobs_view/jobs_delete |
| GET/POST/PATCH/DELETE `/admin/roles/*` | roles_view/roles_manage (also: `GET /admin/roles/permissions` -> returns ALL_PERMISSIONS array) |
| GET/POST/PATCH/DELETE `/admin/accounts/*` | accounts_view/accounts_manage (includes `/status` + `/role` sub-patches) |
| GET/PATCH/DELETE `/admin/experiences/*` | experiences_view/experiences_manage |
| GET/PATCH/DELETE `/admin/reviews/*` | reviews_manage |
| GET/PATCH `/admin/reports/*` | reports_view/reports_manage |
| GET `/admin/dashboard` | any admin |
| GET/PATCH `/admin/profile` | any admin |

---

### 5. Top Companies Algorithm
**Location:** `controllers/company/misc.controller.ts -> topCompanies()`

**Logic:**
1. Find all active (non-expired) jobs -> count jobs per company
2. Fetch company info (name, slug, logo, location) for companies with jobs
3. Aggregate review stats (avgRating, reviewCount) - excludes banned candidates and soft-deleted reviews (`deleted: false` filter in `$lookup` pipeline)
4. Batch-fetch approved CV counts via `getApprovedCountsByCompany()`
5. Calculate badges via `calculateCompanyBadges()`
6. Sort by active job count -> return top N (config: `discoveryConfig.topCompanies = 5`)
7. **Cache:** key `top_companies`, TTL = DYNAMIC (300s)

---

## Security Summary

| Control | Implementation |
|---|---|
| Password policy | 8+ chars, upper + lower + digit + special |
| Token storage | HttpOnly cookies (no JS access) |
| Rate limits (prod) | General: 1000 req/15min; Login: 20/15min; Apply: 30/15min; Search: 120/15min; Forgot-password: 5/15min; OTP verify: 10/15min; Email-change request: 5/15min; Email-change OTP: 10/15min; Socket auth: 60/min |
| CORS | Allow-all in dev (`NODE_ENV !== production`); restrict to `DOMAIN_FRONTEND` in prod |
| Request size | 50kb JSON + urlencoded body limit |
| HTTP headers | Helmet |
| Rate limiting | Per-IP per-endpoint (tiered) |
| Account guards | Inactive accounts blocked at middleware; `isVerified` required for reviews (all ops), interview experiences (all ops including read), job apply |
| Admin activation | Manual (not self-service) |
| Anonymity | isAnonymous flag masks author |
| XSS | dompurify on FE, Joi on BE |
| SQL/NoSQL injection | Mongoose ODM (type-safe queries) + Joi schema validation on auth, profile, and UGC routes; remaining routes rely on Mongoose type enforcement |

---

## Performance Optimizations

- **Bulk queries:** company/location lookups batched (no N+1)
- `.lean()` on read queries (POJO, not Mongoose docs)
- `.select()` to limit payload fields
- Compound indexes on common filter patterns; non-unique query indexes on soft-delete models use `partialFilterExpression: { deleted: false }` — smaller indexes, faster scans
- In-memory NodeCache (TTL tiered)
- Atlas Search delegates full-text to MongoDB
- Socket Map for O(1) user -> socket lookup
- Server-side pagination caps (maxPageSize: 50)
- Graceful shutdown: closes all connections cleanly (SIGINT/SIGTERM/SIGUSR2)

## Technical Debt

| Priority | Issue | Fix |
|----------|-------|-----|
| High | **No JWT refresh token** - token expires (1d/7d), no silent refresh; user logged out mid-session | Refresh token (httpOnly, 30d); `/auth/refresh`; FE intercepts 401 and retries |
| High | **No test suite** - manual testing only; regressions undetected | Unit tests for helpers; integration tests for apply, auth, notifications |
| High | **Fat controllers, no service layer** - business logic in controllers blocks testability and reuse | Extract service classes per domain |
| Medium | **DRY: Role-based controller split causes widespread duplication** - auth flow (forgot-password/OTP/reset), notification handling, and profile update logic each implemented 2–3× across `candidate/`, `company/`, `admin/` controllers; shared logic has no common home | Extract shared service fns (e.g. `handleOtpFlow`, `handleProfileUpdate`) called by each role's controller |
| Medium | **No centralized error codes** - FE string-matches raw error messages | Machine-readable sub-codes (`ERR_OTP_EXPIRED` etc.) |
| Low | **No job queue** - fire-and-forget emails/Cloudinary; fanout spikes at scale | BullMQ + Redis when fanout >1000 or retry needed |
