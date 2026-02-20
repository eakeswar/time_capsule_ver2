
Goal
- Undo the landing-page refactor by moving the Hero / How It Works / Benefits / CTA / Footer JSX back into `src/pages/Index.tsx` and removing usage of `src/components/landing/*` components.
- Keep the `src/components/landing/*` files in the repo (but unused).
- Make no functional changes (same content, links, scroll behavior, and animations).

What I found in the current code
- `src/pages/Index.tsx` is currently still importing and rendering:
  - `LandingHero`
  - `HowItWorksSection`
  - `BenefitsSection`
  - `LandingCTA`
  - `LandingFooter`
- So the “undo” didn’t actually happen yet in code. We need to implement it now.

Implementation steps (safe, minimal)
1. Update `src/pages/Index.tsx`
   - Remove imports of:
     - `LandingHero`, `HowItWorksSection`, `BenefitsSection`, `LandingCTA`, `LandingFooter`
   - Add the necessary direct imports used by the inlined JSX:
     - `Link` from `react-router-dom`
     - `Button` from `@/components/ui/button`
     - Lucide icons used across sections: `Calendar`, `Clock`, `Mail`, `Filter`, `Settings`, `Shield`
   - Paste the exact JSX from each landing component into `Index.tsx` in the same order:
     - Hero section (with “Get Started” and “Learn More” buttons)
     - How It Works section (with `ref={howItWorksRef}` on the section)
     - Benefits section (including the “Dashboard Preview” glass-card mock)
     - CTA section
     - Footer section
   - Wire functionality exactly as it works today:
     - Keep `useRef<HTMLElement>(null)`
     - Keep `scrollToHowItWorks()` calling `howItWorksRef.current?.scrollIntoView({ behavior: "smooth" })`
     - Ensure the “Learn More” button calls `scrollToHowItWorks`
     - Ensure the How It Works `<section>` uses `ref={howItWorksRef}`

2. Keep `src/components/landing/*` files untouched
   - No deletions and no edits (per your “Cleanup: Keep files”).
   - They will become unused; that’s expected.

3. Quick verification checklist (no functional changes)
   - Landing page renders all five sections exactly as before.
   - “Learn More” still smooth-scrolls to the How It Works section.
   - All `/auth` links still navigate correctly.
   - No console errors introduced (you may still see lint warnings about unused files; that’s acceptable since we’re intentionally keeping them).

Files involved
- Will change:
  - `src/pages/Index.tsx`
- Will not change (but will become unused):
  - `src/components/landing/LandingHero.tsx`
  - `src/components/landing/HowItWorksSection.tsx`
  - `src/components/landing/BenefitsSection.tsx`
  - `src/components/landing/LandingCTA.tsx`
  - `src/components/landing/LandingFooter.tsx`

Notes / edge cases
- There’s no behavioral dependency on props beyond the “Learn More” handler and the `sectionRef`; both will be preserved by moving the exact logic into `Index.tsx`.
- This is a purely structural refactor reversal: UI and behavior remain the same, only the component boundaries change.
