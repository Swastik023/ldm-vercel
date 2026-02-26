# Failure Task Tracker

## How to Use
1. Copy a blank row for each failure.
2. Fill in all fields.
3. Update `Fix Status` as you progress.

---

| # | Test Name | Failure Type | Expected | Actual | Related File | Fix Status |
|---|-----------|-------------|----------|--------|-------------|------------|
| 1 | | `assertion` / `timeout` / `network` / `render` / `auth` / `data` | | | | `⬜ open` / `🔧 in-progress` / `✅ fixed` / `❌ wontfix` |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

---

## Blank Template (Copy-Paste)

```
- Test Name:
- Failure Type: [assertion | timeout | network | render | auth | data]
- Expected:
- Actual:
- Related File:
- Fix Status: [open | in-progress | fixed | wontfix]
- Root Cause:
- Fix Applied:
- Verified By:
- Date:
```

---

## Failure Type Legend

| Type | Description |
|------|-------------|
| `assertion` | Expected value mismatch |
| `timeout` | Element/page did not load in time |
| `network` | API call failed or returned unexpected status |
| `render` | Component did not render or render error |
| `auth` | Authentication/authorization failure |
| `data` | Missing or incorrect test data |
