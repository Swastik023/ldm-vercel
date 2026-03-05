# Task: MCQ Test + Website Fixes + Expansion

## Phase 1 – MCQ Test Feature
- [ ] `Test` Mongoose model (title, duration, questions[])
- [ ] `TestAttempt` Mongoose model (studentId, testId, answers, score)
- [ ] Admin: `POST /api/admin/tests` – create test (parse MCQ text)  
- [ ] Admin: `GET /api/admin/tests` – list all tests  
- [ ] Student: `GET /api/student/tests` – fetch available tests
- [ ] Student: `POST /api/student/tests/[id]/submit` – submit answers
- [ ] Admin: `GET /api/admin/tests/[id]` – view results
- [ ] MCQ parser utility function (`parseMCQText`)
- [ ] Admin page: `/admin/tests/create` (paste + generate)
- [ ] Admin page: `/admin/tests` (list + view results)
- [ ] Student page: `/student/tests` (list available tests)
- [ ] Student page: `/student/tests/[id]` (take test with timer + submit)
- [ ] Student page: `/student/tests/[id]/result` (score + review)

## Phase 2 – Navigation & Routing Fixes
- [ ] Add "Register" link to `PublicNavbar.tsx`
- [ ] Fix course `[id]/page.tsx` – Next.js 15 `params` as Promise
- [ ] Verify Home → Courses → Apply Now flow works end-to-end

## Phase 3 – Map Update
- [ ] Replace map iframe in `contact/page.tsx` with correct LDM College embed

## Phase 4 – Fee & Discount System (expand existing `/admin/finance`)
- [ ] `FeeRecord` model (student, course, basePrice, discount, finalFees, payments[])
- [ ] `POST /api/admin/finance/fee-records` – create student fee record
- [ ] `GET /api/admin/finance/fee-records` – list with filters
- [ ] `PATCH /api/admin/finance/fee-records/[id]` – update discount / add payment
- [ ] `GET /api/student/fees` – student sees own fee record
- [ ] Admin fee management page with discount calculator
- [ ] Student fee dashboard panel

## Phase 5 – Homepage Slider Admin Control
- [ ] `SliderImage` Mongoose model (url, title, order, isActive)
- [ ] Admin API: CRUD for slider images
- [ ] Admin page: `/admin/slider` – upload / reorder / activate
- [ ] Update `HeroSlider.tsx` to fetch from DB (with static fallback)

## Phase 6 – Google Analytics
- [ ] Add GA4 tracking script to `layout.tsx`
- [ ] Track: page views, course visits, Apply clicks, contact form submits

## Phase 7 – Apply Now Form Improvement
- [ ] Expand `/collect-info` form with: Full Name, Phone, Email, Course, Address, Qualification, Message
- [ ] Validate all fields
- [ ] Store in DB (extend existing Contact/Info model or create `ApplicationForm`)
- [ ] Success/error feedback

## Phase 8 – Full Audit (targeted fixes)
- [ ] Fix console errors site-wide
- [ ] Fix any broken links/buttons
- [ ] Test mobile responsiveness key pages

## Definition of Done
All phases implemented, build passes, no console errors on key pages.
