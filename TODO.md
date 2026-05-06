# FieldSync Full Integration TODO

## ✅ Phase A: Backend Bugs & Schema Fixes
- [x] Edit schema.sql (remove dup notifications, add OTP/reset cols to users)
- [x] Fix auditLogController.js (metadata → detail)
- [x] Fix auditController.js (SQL params) — DELETED (dead code)
- [x] Fix notificationController.js (column unify)
- [x] Fix seed.js notifications INSERT

## ✅ Phase B: Expand Seed Data
- [x] Edit seed.js (20+ users/teams/zones/tasks/forms/submissions/notifs/audits/locations)

## ✅ Phase C: New Endpoints
- [x] Edit authController.js (add register/forgot/verify/reset/resend)
- [x] Create dashboardController.js
- [x] Create analyticsController.js
- [x] Add routes in index.js
- [x] Create validationMiddleware.js
- [x] Create emailService.js (nodemailer)

## ✅ Phase D: Frontend Real API
- [x] Create services/*.ts (dashboard/analytics/team)
- [x] Edit admin dashboard
- [ ] Edit teamleader pages (tasks/forms/activity etc.)
- [ ] Edit user map/forms
- [ ] Delete mock lib files — DONE

## ✅ Phase E: Security Hardening (Senior Review)
- [x] Separate JWT secrets (access vs refresh)
- [x] Crypto-secure OTP generation
- [x] Fix WebSocket fallback secret
- [x] CSRF backend middleware
- [x] HTML escaping in email templates
- [x] Input validation on routes
- [x] Auth on health endpoint
- [x] Fix notification route ordering
- [x] Fix schema ENUMs
- [x] Implement user CRUD (create/update/delete)
- [x] Remove Socket.io (using ws only)
- [x] Remove seed from server startup
- [x] Activate Next.js middleware (proxy.ts → middleware.ts)
- [x] Professional folder structure cleanup

## [ ] Phase F: Remaining Frontend Integration
- [ ] Edit teamleader pages (tasks/forms/activity)
- [ ] Edit user map/forms
- [ ] Frontend CSRF token fetch on mount
