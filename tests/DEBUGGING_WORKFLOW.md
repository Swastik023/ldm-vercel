# Debugging Workflow

## Step 1: Reproduce

```bash
# Run specific failing test
npx playwright test tests/e2e/<path> --headed --debug

# Run with trace
npx playwright test tests/e2e/<path> --trace on
```

## Step 2: Classify Failure

| Symptom | Type | Action |
|---------|------|--------|
| `expect(...)` failed | assertion | Check selector, value |
| `Timeout exceeded` | timeout | Increase timeout or check element exists |
| `net::ERR_*` | network | Check API route, DB connection |
| `Cannot find element` | render | Check component mount, conditional render |
| `Redirected to /login` | auth | Check session, token expiry |
| `null / undefined` | data | Check seed data, API response |

## Step 3: Inspect

```bash
# View trace
npx playwright show-trace test-results/artifacts/<test>/trace.zip

# View HTML report
npx playwright show-report test-results/html-report

# Check screenshots
ls test-results/artifacts/
```

## Step 4: Fix

1. Update `FAILURE_TASKS.md` with failure details.
2. Fix the source code or test.
3. Re-run only the fixed test:
   ```bash
   npx playwright test tests/e2e/<path> --grep "<test name>"
   ```

## Step 5: Verify

```bash
# Full suite
npm run test:e2e

# Unit tests
npm run test:unit

# All
npm run test
```

## Step 6: Close

1. Update `Fix Status` in `FAILURE_TASKS.md` to `✅ fixed`.
2. Commit with message: `fix(test): <test-name> - <root-cause>`

---

## Quick Commands

```bash
# Run all E2E
npm run test:e2e

# Run all unit
npm run test:unit

# Run specific spec
npx playwright test auth/login.spec.ts

# Run in UI mode
npx playwright test --ui

# Generate report
npx playwright show-report test-results/html-report

# Debug single test
npx playwright test --debug -g "admin login"
```
