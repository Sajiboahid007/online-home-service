# 🧩 KajKhoj — Missing Features (Gap Analysis)

> **Source:** `kajkhoj-system-design.md` (the spec) compared with the code in `src/app` and `KAJKHOJ_PROGRESS.md`
> **Date:** 2026-11-13
> **Summary:** `KAJKHOJ_PROGRESS.md` says the project is 100% done, but most of that work is UI running on **mock in-memory data** (Angular signals). The app is **not connected to Firebase**, **no Cloud Functions exist**, and the **route guards are never applied**. Below is every feature still to build, in priority order.

Legend: 🔴 Critical (blocks a real launch) · 🟠 High (MVP / Phase 1) · 🟡 Medium (Phase 2) · 🟢 Low (Phase 3 / nice-to-have)

---

## 1. 🔴 Core Infrastructure (Foundation)

1. **Connect the Angular app to Firebase.** `app.config.ts` only provides the router; no service imports `firebase/*` or `@angular/fire`. Every service (`auth`, `job`, `worker`, `payment`, …) keeps data in local `signal<>` arrays, so the data disappears on refresh.
   - Add `provideFirebaseApp`, `provideFirestore`, `provideDatabase`, `provideAuth`, `provideStorage`, `provideMessaging`.
   - Rewrite the services to use Firestore queries and listeners (`collection`, `onSnapshot`) instead of mock arrays.
2. **Create the Cloud Functions project.** There is no `functions/` folder, yet the spec (Section 14) needs about 20 functions. Without them, money, ratings, dispatch and bans either cannot work or have to be computed on the client, which is insecure.
3. **Apply the route guards.** `auth.guard`, `role.guard`, `not-banned.guard` and `worker-onboarding.guard` exist, but `app.routes.ts` has **no `canActivate`**. Anyone can open `/admin` today.
4. **Build the Super Admin module (`/superadmin`).** The whole `features/superadmin/` tree from the spec is missing. Today the Super Admin uses the Admin panel.
5. **Configure PrimeNG properly.** `providePrimeNG()` with the Aura preset, the brand colors `#0f766e` and `#f97316`, and the Bengali font (`Hind Siliguri` / `Noto Sans Bengali`).
6. **Set up the Firestore indexes** from Spec §12 in a `firestore.indexes.json` file.
7. **Turn on Firebase App Check** to block bots and scripts.

---

## 2. 🔴 Authentication & Roles

8. **Real phone OTP login:** `signInWithPhoneNumber` + `RecaptchaVerifier`. The current login is a simulator with demo role switches.
9. **Email + password + 2FA (MFA)** required for Admin and Super Admin.
10. **Store roles in Custom Claims**, set only through the Cloud Function `setUserRole`.
11. **`onUserCreate` function:** check the blacklist and set the default role to `customer`.
12. **`registerAsWorker` function:** create the worker profile, set the role to `worker` and the status to `pending`.
13. **Remove the demo role switcher** from the login page and the admin layout, or put it behind a dev-only flag.
14. **Logout and session handling,** plus the `lastLoginAt` update.

---

## 3. 🟠 Customer Features

15. **Customer worker profile page** (`customer/worker-profile`): a full page with a portfolio gallery (`p-galleria`), recent reviews, experience, completion rate and work area. Today it is only a modal.
16. **Create job page** (`customer/create-job`): description, **photo upload** (for example a picture of the leaking pipe), and the estimated price shown before booking.
17. **"Searching for a worker…" screen** (`customer/searching-worker`): an animation that shows the radius growing, plus a "no worker found → schedule instead?" fallback.
18. **Direct Booking:** book one specific worker from the map or profile. The spec lists it as its own booking type.
19. **Payment page** (`customer/payment`): choose cash, bKash, Nagad or card, and see the invoice or receipt.
20. **Customer profile page:** edit name and photo, set the emergency contact, manage saved addresses.
21. **Customer approves the worker's new quote** after the worker inspects the job (in-app price renegotiation).
22. **Customer approves material costs,** shown with the receipt photo the worker uploads.
23. **Coupon code entry** while booking.
24. **"Show only female or Trusted workers" filter**, a safety option for women customers.
25. **"Are you safe?" check**, shown after a job or when a job runs unusually long.
26. **Phone number unmasking after a booking is confirmed,** plus a "Call" button. The setting `showFullPhoneBeforeBooking` needs to control this.

---

## 4. 🟠 Worker Features

27. **Real incoming-request delivery:** an FCM push with a loud sound and a full-screen popup, plus the Accept/Reject result written through the `acceptJob` transaction.
28. **Job history page** (`worker/job-history`).
29. **Earnings dashboard** (`worker/earnings`): daily, weekly and monthly charts (`p-chart`).
30. **Worker reviews page** (`worker/reviews`): reviews received, plus a way for the worker to rate the customer.
31. **Edit profile page** (`worker/edit-profile`): skills, rate (within the min/max limits), service radius, portfolio photos and bio.
32. **Premium subscription page** (`worker/premium`).
33. **Bidding UI on the job board:** submit a quote (`submitBid`), see your own bids, and let the customer choose a bid (`chooseBid`). Today `board_bid` exists only as a filter value.
34. **Before and after job photos** saved into the worker's portfolio.
35. **Due-limit enforcement:** stop dispatching jobs to a worker once their commission due passes ৳500. Today this is only a visual alert.
36. **Rate reward:** workers with a 4.5+ rating and 50+ jobs may raise their maximum rate by 20%.
37. **Cancellation penalty:** a high cancel rate triggers a 24-hour block.

---

## 5. 🟠 Map & Location System

38. **Real live location in Realtime Database:** `liveLocations/{uid}` writes, throttled to "moved more than 50 m or 30 s passed", with `onDisconnect().remove()`.
39. **Live job tracking:** `jobTracking/{jobId}` written by the worker and read by the customer to show the moving marker and ETA.
40. **Marker clustering** (for example a "25" bubble that splits apart when you zoom in).
41. **Radius circle** of 3, 5 or 10 km around the customer.
42. **Route line from worker to customer** using OSRM.
43. **Home location fuzzing** of about 200 m for offline workers (privacy).
44. **Fake GPS detection:** flag impossible jumps (for example 50 km in 10 seconds) and reject updates with poor accuracy.
45. **Address search and geocoding** with Nominatim or Barikoi.
46. **Admin demand heatmap.**
47. **Real geohash queries** using `geofire-common` (`geohashQueryBounds`) against Firestore.

---

## 6. 🟠 Job Dispatch & Job Lifecycle (Cloud Functions)

48. **`onJobCreated`:** find the job's area, calculate the price, and start dispatch.
49. **Server-side dispatch scoring** (distance 0.40, rating 0.25, accept rate 0.15, idle time 0.10, premium 0.10), with weights read from `settings.dispatch`.
50. **`jobs/{jobId}/offers` subcollection:** send offers to the top 3–5 workers with a 30-second expiry.
51. **`dispatchNextRound`:** widen the radius from 3 to 5 to 10 km, then post the job to the board when nobody accepts.
52. **`acceptJob` with a Firestore transaction**, so only the first worker gets the job and all other offers are cancelled.
53. **`grabBoardJob`, `submitBid` and `chooseBid`.**
54. **`updateJobStatus`** with the start OTP checked on the server.
55. **`completeJob`:** final bill, commission, transaction record and wallet update.
56. **`cancelJob`:** apply the cancellation rules (free within 2 minutes; a ৳50 fee once the worker has set off).
57. **Scheduled-job reminders and dispatch** when the scheduled time arrives.
58. **Rate limiting** on job creation (stop request spam).

---

## 7. 🟠 Pricing & Revenue

59. **Full bill formula on the server:** visit charge + rate × hours or days + material cost, multiplied by surge, plus the platform fee, minus the coupon.
60. **Area-based commission and pricing** looked up from `pricing/{areaId_categoryId}`.
61. **Surge pricing engine:** automatic multipliers of 1.2x–1.5x when demand is high and few workers are free.
62. **Premium subscription billing** (for example ৳299 a month): lower commission, a highlighted marker and a "Pro" badge.
63. **Featured listings:** workers pay to appear at the top of search results.
64. **Coupons:** model, validation, usage limits and per-area rules.

---

## 8. 🟡 Payments

65. **Payment gateway integration:** SSLCommerz, aamarPay or ShurjoPay, or bKash and Nagad directly. Today it is a simulation.
66. **`paymentWebhook` function:** confirm payments on the server; never trust the client.
67. **`requestWithdraw` function** plus an **Admin withdraw-approval screen**.
68. **Invoices and receipts** shown in the app and sent by SMS.
69. **Refund flow,** started by an Admin from a job or a dispute.

---

## 9. 🟡 Ratings, Reviews & Ban System

70. **`submitReview` function:** confirm the job is completed and calculate the average on the server, weighting the last 50 jobs.
71. **`checkAutoBan`:** apply the rules for ratings below 3.5, 3.0 and 2.5, 3 serious complaints in 30 days, and a cancel rate above 20%.
72. **`banUser` / `unbanUser`:** update the status and the `banned` claim, add the phone, NID and device to the blacklist, and write an audit log entry.
73. **`liftExpiredSuspensions` scheduler.**
74. **Device ID capture** for the blacklist.
75. **Appeal system:** a banned or suspended user can submit an appeal, and an Admin reviews it.
76. **Admin review moderation:** hide or delete abusive reviews (`isHidden`).
77. **Two-way rating UI:** the worker rates the customer.

---

## 10. 🟡 Safety & Security

78. **`triggerSOS` function:** send an SMS with the location to the emergency contact. Today SOS is a UI-only alarm.
79. **Live trip share page:** a real public tracking link that works without login. Today it shares a static link.
80. **Store chat in `jobs/{jobId}/messages`** in Firestore (today `chat.service` uses mock data), and **record voice notes for real** (MediaRecorder upload to Storage).
81. **KYC uploads to private Storage** (`kyc/{uid}/*`). Today the uploads are only previews.
82. **File upload validation:** at most 5 MB, only jpg, png or webp.
83. **Audit logs written for every sensitive Admin action.**
84. **Scheduled Firestore backups.**

---

## 11. 🟡 Admin Panel

85. **Admin CRUD gaps:**
    - **Jobs module:** list, assign a worker manually, cancel, refund.
    - **Reviews module:** hide or delete.
    - **Transactions module.**
    - **Areas module:** draw and edit polygons on the map, turn areas on or off.
    - **SOS alerts module.** It is partly inside `/admin/reports`.
86. **Export tables to CSV or Excel** from every `p-table`.
87. **Dashboard charts:** daily job trend, revenue by category (pie chart), jobs by area, and the top and lowest-rated workers.
88. **Live map extras:** lines connecting customer and worker for active jobs, plus the heatmap.
89. **Area-scoped admins:** each admin sees only data from their own `areaIds`.
90. **Award badges** (Trusted / Verified) and **turn premium on manually** for a worker.
91. **Waive or adjust a worker's commission due.**
92. **`approveWorker` / `rejectWorker` functions** that send a notification.

---

## 12. 🟡 Super Admin Panel (the whole module is missing)

93. **Super Admin dashboard:** the full revenue picture by day, month, area and category.
94. **Admin management:** create admins, assign areas, deactivate and ban them.
95. **Categories CRUD:** icon, Bengali and English names, on/off, display order.
96. **Commission settings:** default commission and the due limit.
97. **Dispatch settings:** radius, timeout, batch size and scoring weights.
98. **Ban rules editor.**
99. **Blacklist manager.**
100. **Coupons manager.**
101. **Audit log viewer** (read-only).
102. **Platform settings:** support phone, maintenance mode, phone visibility.

---

## 13. 🟡 Notifications

103. **FCM setup:** a service worker, saving `fcmTokens`, and push messages for each event in Spec §18.
104. **In-app notification center** (`notifications/{uid}/items`), with the bell icon and an unread count.
105. **SMS gateway integration** (SSL Wireless or BulkSMSBD) for verification results, bans and SOS.
106. **Due-limit warning push** when a worker gets close to the limit.

---

## 14. 🟡 Scheduled Jobs (Cloud Scheduler)

107. **`autoOfflineStaleWorkers`** (every 5 minutes).
108. **`liftExpiredSuspensions`** (every hour).
109. **`dailyReport`** (every midnight).

---

## 15. 🟢 UX & Platform

110. **PWA:** a manifest, a service worker and installing to the home screen. None of these exist yet.
111. **Bengali and English language switch** (`@ngx-translate/core` or Angular i18n).
112. **Dark mode.**
113. **Skeleton loaders** (`p-skeleton`) while data loads.
114. **"Coming soon" screen** for areas where the service is not available.
115. **Shared components from the spec** that are missing: `worker-card`, `worker-profile-dialog`, `map-view`, `location-picker`, `image-uploader`, `confirm-dialog`.
116. **Android app with Capacitor,** needed for background location, reliable notifications and mock-location detection.

---

## 16. 🟢 Advanced / Future (Spec §19)

117. **Voice search for jobs** ("my bathroom pipe is leaking" shows plumbers).
118. **Category suggestion from a photo.**
119. **Recurring bookings** (weekly cleaning, monthly AC service).
120. **Fixed-price service packages** (for example "AC full service ৳1200").
121. **Simple worker mode:** big icons and Bengali voice guidance.
122. **7-day work warranty** (free re-fix).
123. **Skill test:** a quiz or video that sets a Beginner or Expert level.
124. **Insurance.**
125. **Referral bonuses.**
126. **Daily target bonus** (Quest style).
127. **Income certificate** for workers.
128. **Team and agency accounts** (a contractor manages their crew).
129. **Corporate and B2B accounts** with monthly billing.
130. **Emergency 24/7 service and "Express" (15-minute) option.**
131. **Demand forecasting.**
132. **Worker recruitment alerts** ("shortage of electricians in Ashulia").
133. **Fraud detection** (catch repeat cancellations between the same worker and customer, which suggests they are bypassing the platform).
134. **Material supply marketplace.**

---

## ✅ Already Implemented (UI level, mostly mock data)

- Customer: home map with colored markers, category chips, bottom sheet, instant, scheduled and bulk booking UI, job tracking timeline, start OTP display, bookings history, review modal, favorites drawer, trip share link, complaint form, SOS button
- Worker: 5-step registration, online toggle, 30-second offer countdown, active job workflow with OTP check, job board with Grab, wallet with due progress and simulated payment and withdraw
- Admin: dashboard KPIs, KYC verification queue, users list with warn and ban, pricing matrix, live map, SOS and complaints desk
- Shared: Bengali pipes, status badge, rating stars, empty state, job chat drawer
- Firebase: models, `firestore.rules`, `database.rules.json`, `storage.rules`, and a seed script that fills Firestore

---

## 🎯 Recommended Next Steps

1. Wire up Firebase in `app.config.ts`, then move the services from mock data to Firestore (items 1, 8–14).
2. Add `canActivate` guards to `app.routes.ts` (item 3). This is quick and important.
3. Scaffold `functions/` and build the core: `onJobCreated`, `acceptJob`, `completeJob`, `submitReview`, `banUser` (sections 6 and 9).
4. Make live location real in RTDB (items 38–39).
5. Build the Super Admin module (section 12).
6. Then payments, FCM and the remaining Phase 2 items.
