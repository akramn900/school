/**
 * clerk-auth.js — v3 (headless)
 * ─────────────────────────────────────────────────────────────────────────────
 * Add BOTH script tags to the <head> of every protected page, in this order:
 *
 *   <script
 *     data-clerk-publishable-key="pk_test_YWxlcnQtY293LTMyLmNsZXJrLmFjY291bnRzLmRldiQ"
 *     src="https://unpkg.com/@clerk/clerk-js@latest/dist/clerk.browser.js"
 *     type="text/javascript"
 *   ></script>
 *   <script src="./js/clerk-auth.js"></script>   ← root pages (dashboard.html)
 *   <script src="../js/clerk-auth.js"></script>  ← pages/ subfolder
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  function loginPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts.length <= 1 ? './index.html' : '../'.repeat(parts.length - 1) + 'index.html';
  }
  function redirectToLogin() { window.location.replace(loginPath()); }

  // Read school_user immediately (set by index.html after Clerk sign-in)
  const raw = localStorage.getItem('school_user');
  if (!raw) { redirectToLogin(); return; }

  let schoolUser;
  try { schoolUser = JSON.parse(raw); }
  catch (e) { localStorage.removeItem('school_user'); redirectToLogin(); return; }

  window.schoolUser = schoolUser;

  // Validate Clerk session asynchronously — poll until Clerk SDK is ready
  window.addEventListener('DOMContentLoaded', function () {
    let tries = 0;
    const timer = setInterval(async function () {
      tries++;
      if (typeof window.Clerk === 'undefined') {
        if (tries > 120) {                           // 6 s timeout → fail open
          clearInterval(timer);
          document.dispatchEvent(new CustomEvent('clerkReady', { detail: schoolUser }));
        }
        return;
      }
      clearInterval(timer);

      try { await window.Clerk.load(); } catch (e) {
        document.dispatchEvent(new CustomEvent('clerkReady', { detail: schoolUser }));
        return;
      }

      if (!window.Clerk.user) {
        localStorage.removeItem('school_user');
        redirectToLogin();
        return;
      }

      // Sync fresh profile data
      const u = window.Clerk.user;
      schoolUser.name     = ((u.firstName||'') + ' ' + (u.lastName||'')).trim() || schoolUser.name;
      schoolUser.email    = u.primaryEmailAddress?.emailAddress || schoolUser.email;
      schoolUser.imageUrl = u.imageUrl || schoolUser.imageUrl || '';
      localStorage.setItem('school_user', JSON.stringify(schoolUser));
      window.schoolUser = schoolUser;

      window.Clerk.addListener(({ user }) => {
        if (!user) { localStorage.removeItem('school_user'); redirectToLogin(); }
      });

      document.dispatchEvent(new CustomEvent('clerkReady', { detail: schoolUser }));
    }, 50);
  });

  // Global sign-out
  window.clerkSignOut = async function () {
    try { if (window.Clerk?.signOut) await window.Clerk.signOut(); } catch (_) {}
    localStorage.removeItem('school_user');
    redirectToLogin();
  };
})();
