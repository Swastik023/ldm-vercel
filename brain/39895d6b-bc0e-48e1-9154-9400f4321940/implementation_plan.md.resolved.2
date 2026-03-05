# Phase 5: Accessibility Enhancement Plan

## Goal
Achieve WCAG AA compliance across all 8 Academic ERP screens.

## Scope
- Run Lighthouse accessibility audits
- Implement keyboard navigation
- Add modal focus traps
- Verify color contrast
- Test with screen readers

---

## 1. Lighthouse Audit Strategy

### Screens to Audit
1. AcademicSessions (Admin)
2. ExamBuilder (Admin)
3. MarksEntry (Teacher)
4. ResultProcessing (Admin)
5. StudentReportCard (Student)
6. TranscriptGenerator (Admin)
7. ProgramsCurriculum (Admin)
8. TeacherAssignment (Admin)

### Process
- Start dev server
- Open each screen in browser
- Run Lighthouse accessibility audit
- Document scores and issues
- Prioritize fixes

---

## 2. Keyboard Navigation Requirements

### Universal (All Screens)
- [ ] Tab navigation through interactive elements
- [ ] Enter to activate buttons/links
- [ ] Escape to close modals
- [ ] Arrow keys for dropdowns/selects
- [ ] Focus visible indicators

### Screen-Specific
- **AcademicSessions:** Modal keyboard trap, form navigation
- **ExamBuilder:** Modal keyboard trap, table navigation
- **MarksEntry:** Input navigation, bulk action shortcuts
- **ResultProcessing:** Dropdown navigation
- **StudentReportCard:** Button navigation
- **TranscriptGenerator:** Search input focus
- **ProgramsCurriculum:** Sidebar navigation
- **TeacherAssignment:** Table + dropdown navigation

---

## 3. Modal Accessibility (3 screens)

### Screens with Modals
1. **AcademicSessions** - Create/Edit modal
2. **ExamBuilder** - Create/Edit modal
3. **ProgramsCurriculum** - Add Subject modal (future)

### Required Features
```typescript
// Focus trap on modal open
useEffect(() => {
  if (isOpen) {
    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    firstElement?.focus();
    
    // Trap focus within modal
    // Escape key handler
  }
}, [isOpen]);
```

### Implementation
- [ ] Focus first input on modal open
- [ ] Trap Tab/Shift+Tab within modal
- [ ] Escape key closes modal
- [ ] Return focus to trigger button on close
- [ ] `aria-modal="true"` attribute
- [ ] `role="dialog"` on modal container

---

## 4. Color Contrast Verification

### WCAG AA Requirements
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

### Elements to Check
- Primary buttons (blue/indigo/amber/purple)
- Secondary buttons (gray)
- Status badges (green, red, yellow)
- Table headers
- Form labels
- Disabled states
- Focus indicators

### Tools
- Lighthouse audit (automated)
- Browser DevTools Contrast Checker
- WebAIM Contrast Checker

---

## 5. Screen Reader Compatibility

### Required Attributes (Already Added)
- ✅ `aria-label` on icon-only buttons
- ✅ `aria-label` on form inputs
- ✅ `role="status"` on toast notifications
- ✅ `role="alert"` on error states

### Additional Requirements
- [ ] `aria-live` regions for dynamic content
- [ ] `aria-describedby` for form errors
- [ ] `aria-expanded` for dropdowns
- [ ] `aria-current` for active nav items
- [ ] Table headers with proper `scope`

---

## 6. Implementation Checklist

### Quick Wins (30 min)
- [ ] Add Escape key handler to modals
- [ ] Add focus trap to modals
- [ ] Verify all buttons have accessible names
- [ ] Add `aria-live` to toast container

### Medium Effort (45 min)
- [ ] Improve focus visible styles
- [ ] Add skip navigation links
- [ ] Verify table accessibility (headers, scope)
- [ ] Add `aria-expanded` to dropdowns

### Testing (15 min)
- [ ] Keyboard-only navigation test (each screen)
- [ ] Screen reader spot check (NVDA/VoiceOver)
- [ ] Lighthouse re-audit (target: 90+)

---

## 7. Expected Improvements

| Screen | Current Score* | Target Score | Key Fixes |
|--------|---------------|--------------|-----------|
| AcademicSessions | ~85 | 95+ | Modal focus trap, Escape key |
| ExamBuilder | ~85 | 95+ | Modal focus trap, Escape key |
| MarksEntry | ~90 | 95+ | Table headers |
| ResultProcessing | ~88 | 95+ | Dropdown labels |
| StudentReportCard | ~92 | 95+ | Minor fixes |
| TranscriptGenerator | ~90 | 95+ | Form labels |
| ProgramsCurriculum | ~88 | 95+ | Sidebar navigation |
| TeacherAssignment | ~90 | 95+ | Table accessibility |

*Estimated based on current implementation

---

## 8. Out of Scope (Future)

- ARIA landmarks (`<nav>`, `<main>`, `<aside>`)
- Page titles and meta descriptions
- Language attributes
- High contrast mode support
- Reduced motion preferences

---

## Success Criteria

✅ **Lighthouse Accessibility Score:** 90+ on all screens  
✅ **Keyboard Navigation:** Full navigation without mouse  
✅ **Modal Accessibility:** Focus trap + Escape key  
✅ **Color Contrast:** WCAG AA compliant  
✅ **Screen Reader:** Basic compatibility verified

**Estimated Time:** 90 minutes  
**Priority:** High (inclusivity requirement)
