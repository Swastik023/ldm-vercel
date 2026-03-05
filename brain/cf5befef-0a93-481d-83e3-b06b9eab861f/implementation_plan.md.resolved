# LDM College Public Website — UI Overhaul Plan

## Problem Summary
After a full audit, the following user experience problems were identified:

| Area | Issue |
|---|---|
| **Header** | 4 logos + collaboration subtitle is visually cluttered and too tall |
| **Navbar** | 9+ items at one level — pages like Collaborations, Ayurvedic Pharma, Hospital, Vaidya Saurabh are buried inside dropdowns |
| **Homepage** | Missing: Collaborations section, Library CTA, Courses preview, Certificates trust strip |
| **Collaborations** | Great page, but never shown on homepage — users have no reason to visit it |
| **Footer** | No site-wide footer — users at the bottom of any page have no Next Steps or navigation |
| **Apply CTA** | "Apply for Courses" is hidden inside the Contact dropdown — most users never find it |

---

## Proposed Changes

### 1. Header — Slim Down & Modernise
#### [MODIFY] [Navbar.tsx](file:///media/swastik/focus/ldm%20feb/src/components/layout/Navbar.tsx)
- Reduce the top `<Header>` height from ~100px to ~70px
- Keep both primary logos (LDM + Hospital) but remove the two intermediate logos
- Make the **"In collaboration with Dr. Dharam Dev Hospital"** line into a **styled badge/pill** with a teal accent, not plain grey text
- Add a prominent **"Apply Now" button** (gradient pill, top-right) in the header

---

### 2. Navbar — Mega-menu Restructure
#### [MODIFY] [Navbar.tsx](file:///media/swastik/focus/ldm%20feb/src/components/layout/Navbar.tsx)
Reduce from 9 top-level items to 6 clean items. Buried pages become **mega-menu** panels:

| Old (9 items) | New (6 items) |
|---|---|
| Home | Home |
| About Us → Overview, Mission, Our Team | About |
| Notices | Notices |
| E-Library | E-Library |
| Courses → All, Apply | Courses |
| Gallery | Academics *(Courses, Gallery, Facilities, E-Library)* |
| Facilities | Collaborations *(with partner cards in the dropdown)* |
| Collaborations → Overview, Hospital, Ayurvedic, Vaidya | Contact |
| Contact → Contact, Apply | — |
| Login | Login (right-aligned, styled as button) |

Mega-menu for **Collaborations**: shows 3 cards with icons and names (Hospital Partners, Ayurvedic Pharma, Vaidya Saurabh) directly in the dropdown so they're visible without clicking.

---

### 3. Homepage — 5 New Sections
#### [MODIFY] [page.tsx](file:///media/swastik/focus/ldm%20feb/src/app/%28public%29/page.tsx)

**Section order after overhaul:**
1. Hero Slider *(keep)*
2. Stats *(keep, but add 4th stat: Partner Hospitals)*
3. **NEW — Courses Preview Strip**: 3-4 course cards with icons, "Apply" button per card
4. **NEW — Collaborations Spotlight**: Eye-catching 3-column section with Hospital, Ayurvedic, Vaidya cards — gradient backgrounds, partner logos, "Learn More" links
5. Welcome / About *(keep, tighten copy)*
6. **NEW — Trust Strip (Certificates)**: Horizontal scrollable bar showing NAAC, University Approvals, LDM Affiliation badges
7. Why Choose Us *(keep)*
8. **NEW — E-Library CTA Banner**: "Browse 50+ Academic Documents Free" with a violet gradient and "Open Library" button
9. Call to Action — Apply Now *(improve: add phone + WhatsApp links alongside the button)*

---

### 4. Footer — New Component
#### [NEW] [Footer.tsx](file:///media/swastik/focus/ldm%20feb/src/components/layout/Footer.tsx)
#### [MODIFY] [(public)/layout.tsx](file:///media/swastik/focus/ldm%20feb/src/app/%28public%29/layout.tsx)

A proper site-wide footer with 4 columns:
- **Column 1**: Logo + tagline + social/phone links
- **Column 2**: Quick Links (Home, About, Courses, Gallery, Notices, E-Library)
- **Column 3**: Collaborations (Hospital Partners, Ayurvedic Pharma, Vaidya Saurabh)
- **Column 4**: Contact (address, phone, email, Apply Now button)
- Bottom bar: Copyright

---

## Verification Plan
- Visual check at `http://localhost:3000` for each section
- Test navbar on mobile (hamburger) to confirm all pages are still reachable
- Check mega-menu hover on desktop
- Verify footer links all navigate correctly
