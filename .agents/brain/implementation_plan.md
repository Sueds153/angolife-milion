# Implementation Plan - Mobile Layout Optimization

Address layout issues where information is cut off or overflows on mobile devices.

## Proposed Changes

### [Component Name] components/ConversionSimulator.tsx

#### [MODIFY] [ConversionSimulator.tsx](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/components/ConversionSimulator.tsx)
- Reduce the font size of the conversion result on mobile from `text-3xl` to `text-2xl`.
- Add `break-words` and `overflow-hidden` to ensure long numbers don't break the layout.

### [Component Name] components/admin/AdminJobsSection.tsx

#### [MODIFY] [AdminJobsSection.tsx](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/components/admin/AdminJobsSection.tsx)
- Update the job title header to allow wrapping of the "Pendente" badge on very small screens.
- Change `flex-nowrap` behavior in the job header to `flex-wrap` for mobile.

### [Component Name] components/admin/AdminDiagnostic.tsx

#### [MODIFY] [AdminDiagnostic.tsx](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/components/admin/AdminDiagnostic.tsx)
- Reposition the diagnostic overlay to `top-24` and `right-4` to avoid overlapping main content cards and stay out of the way of navigation.

## React Router Migration (UX Priority)

### [Component Name] App.tsx
- **[MODIFY]** Remove `currentPage` state and `renderPage` logic.
- **[MODIFY]** Implement `<BrowserRouter>`.
- **[MODIFY]** Define routes:
  - `/` -> `HomePage`
  - `/vagas` -> `JobsPage`
  - `/cambio` -> `ExchangePage`
  - `/ofertas` -> `DealsPage`
  - `/ofertas/:id` -> `DealDetailPage`
  - `/noticias` -> `NewsPage`
  - `/cv-criador` -> `CVBuilderPage`
  - `/admin` -> `AdminPage`
  - `/perfil` -> `ProfilePage`
- **[MODIFY]** Update `handleNavigate` to use `navigate()`.

### [Component Name] components/Navbar.tsx & components/BottomNav (App.tsx internal)
- **[MODIFY]** Replace `onClick` navigation with `<NavLink>` to leverage automatic "active" class handling and native browser history.

## Real Web Push Implementation (Retention)

### [NEW] [sw.js](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/public/sw.js)
- Implement a Service Worker to handle incoming push events and show native notifications.

### [Component Name] services/notificationService.ts
- **[MODIFY]** Add logic to request push permissions and register the service worker for real background notifications.

## Service Refactoring (Maintainability)

### [Component Name] services/
- **[DELETE]** `supabaseService.ts` (after splitting).
- **[NEW]** `auth.service.ts`, `jobs.service.ts`, `news.service.ts`, `exchange.service.ts`, `deals.service.ts`.

## Verification Plan

### Automated Tests
- Use `browser_subagent` to verify that URLs change when navigating.
- Test the "Back" button in the browser to ensure it returns to the previous page.

### Manual Verification
- Verify that sharing a link (e.g., `/cambio`) lands exactly on that page.
- Test push notification trigger via console/admin (once implemented).
