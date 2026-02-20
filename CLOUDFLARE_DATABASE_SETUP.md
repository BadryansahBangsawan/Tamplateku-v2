# Cloudflare D1 Setup

## 1) Create D1 database
1. Open Cloudflare Dashboard.
2. Go to `Workers & Pages` → `D1`.
3. Create database (example: `tamplateku-auth`).
4. Copy the `Database ID`.

## 2) Create API token
Create token in Cloudflare with permissions:
- `D1:Edit`
- `Account:Read` (recommended)

Copy:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 3) Set environment variables
In `.env.local` and Cloudflare deployment env:

```bash
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_D1_DATABASE_ID=...
CLOUDFLARE_API_TOKEN=...
ADMIN_EMAILS=badryansah99@gmail.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OTP_PEPPER=...
RESET_TOKEN_SECRET=...
RESEND_API_KEY=...
SMTP_FROM=Tamplateku <onboarding@resend.dev>
# Optional SMTP fallback (if not using Resend API):
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
```

## 4) Deploy
Deploy app to Cloudflare (Workers/Pages).  
Auth API endpoints will create `auth_users` table automatically on first register/login request.

## Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`

## CMS tables used by admin page
```sql
CREATE TABLE IF NOT EXISTS cms_site_content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  content_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_templates (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  main_image_src TEXT NOT NULL,
  logo_src TEXT NOT NULL,
  description TEXT NOT NULL,
  features_json TEXT NOT NULL,
  case_study_link TEXT NOT NULL,
  demo_images_json TEXT NOT NULL,
  project_link TEXT,
  cta_talk TEXT,
  cta_read_case_study TEXT,
  test_img TEXT,
  testimonial TEXT,
  founder_name TEXT,
  position TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('REGISTER', 'RESET_PASSWORD', 'CHANGE_EMAIL')),
  otp_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  consumed_at TEXT,
  request_ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  otp_request_id TEXT,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  request_ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## CMS endpoints
- `GET /api/cms/content`
- `PUT /api/cms/content` (requires login cookie)
- `GET /api/cms/templates`
- `PUT /api/cms/templates` (requires login cookie)

## OTP endpoints
- `POST /api/otp/request`
- `POST /api/otp/verify`
- `POST /api/auth/reset-password`

Request body `POST /api/otp/request`:
```json
{
  "email": "user@example.com",
  "purpose": "REGISTER"
}
```

Request body `POST /api/otp/verify`:
```json
{
  "email": "user@example.com",
  "purpose": "RESET_PASSWORD",
  "otp": "123456"
}
```

If purpose is `RESET_PASSWORD`, verify endpoint returns short-lived `resetToken`.
