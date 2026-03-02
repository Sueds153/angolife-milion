# CV Generator & State Management Modernization

This plan outlines the migration of the AngoLife application to a more robust architecture by implementing global state management with Zustand and professional CV generation with `react-pdf`.

## Proposed Changes

### 1. Global State Management (Zustand)
Currently, `App.tsx` manages over 20 state variables, which are passed down as props. We will centralize this into a Zustand store to improve performance and maintainability.

#### [NEW] [useAppStore.ts](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/store/useAppStore.ts)
- Define `AppStore` interface including `user`, `isAuthenticated`, `isDarkMode`, `activeNotification`, and UI flags.
- Implement actions for auth (login/logout), theme toggling, and notification management.

#### [MODIFY] [App.tsx](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/App.tsx)
- Remove local state managed by Zustand.
- Update `useEffect` hooks to update the store instead of local state.
- Remove prop drilling to children components.

#### [MODIFY] [Navbar.tsx](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/components/Navbar.tsx)
- Use `useAppStore` to access `user` and `isAuthenticated`.

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/pages/ProfilePage.tsx)
- Use `useAppStore` to access and update `user`.

---

### 2. CV Generator (react-pdf)
Replacing `window.print()` with a client-side PDF renderer provides consistent results across all browsers and devices.

#### [NEW] [CVDocument.tsx](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/components/cv-templates/CVDocument.tsx)
- Create a professional PDF layout using `@react-pdf/renderer`.
- Implement support for multiple templates (Classic, Modern, etc.).
- Ensure styling aligns with AngoLife's premium aesthetic.

#### [MODIFY] [CVBuilderPage.tsx](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/pages/CVBuilderPage.tsx)
- Integrate `PDFDownloadLink` to allow downloading the generated PDF.
- Use `useAppStore` for user data and authentication state.

## Verification Plan

### Automated Tests
- Verification of state updates via React DevTools/Zustand middleware.
- Build test to ensure `@react-pdf/renderer` is correctly bundled.

### Manual Verification
- **State Management**: Verify that logging in/out updates the Navbar and ProfilePage immediately without prop drilling errors.
- **CV Generation**: Download PDFs from different templates and verify formatting in Chrome, Firefox, and mobile browsers.
- **Theme Toggle**: Ensure dark mode persistency works through the global store.
