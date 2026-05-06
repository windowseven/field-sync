<<<<<<< HEAD
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
=======
# User Dashboard Integration TODO

## Steps

1. ✅ Create lib/mock-user.ts
2. ✅ Create components/user/user-sidebar.tsx
3. ✅ Create app/user/layout.tsx
4. ✅ Create app/user/page.tsx
5. Create app/user/home/page.tsx
6. Create app/user/tasks/page.tsx
7. Create app/user/forms/page.tsx
8. Create app/user/forms/[formId]/page.tsx
9. Create app/user/map/page.tsx
10. Create app/user/team/page.tsx
11. Create app/user/notifications/page.tsx
12. Create app/user/help/page.tsx
13. Create app/user/sync/page.tsx
14. Create app/user/settings/page.tsx

## Post-creation
- Test: cd v0-modified-admindashboard-field Ascent: 1
  v0-modified-admindashboard-field-operations-system && npm run dev
- Visit /user/home
>>>>>>> 5d39e8afb23a42ad78c6ba37e974c849e7c6fcc4
