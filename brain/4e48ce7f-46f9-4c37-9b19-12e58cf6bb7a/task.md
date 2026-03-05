# Seed Curriculum & Fix Course Display

## Phase 1: Schema & Seed
- [x] Extend `Program` model with optional `curriculum` sub-document
- [x] Create `seed_curriculum.js` script
- [x] Run seed script and verify 14 programs updated

## Phase 2: API & Frontend
- [x] Update public API to expose curriculum data on detail page
- [x] Enhance `CourseDetailClient.tsx` with dynamic section rendering
- [x] Ensure old courses without curriculum still render correctly

## Phase 3: Verification
- [x] TypeScript build check passes
- [ ] Manual testing: course with curriculum renders all sections
- [ ] Manual testing: course without curriculum renders basic layout
