/**
 * clerk-auth.js  — v2
 * ─────────────────────────────────────────────────────────────────────────────
 * CORRECT SCRIPT ORDER in every protected page's <head>:
 *
 *   1.  <script data-clerk-publishable-key="pk_test_..."
 *           src="https://unpkg.com/@clerk/clerk-js@latest/dist/clerk.browser.js">
 *       </script>
 *   2.  <script src="./js/clerk-auth.js"></script>   ← always AFTER clerk SDK
 *
 * Both scripts are regular (not async/defer) so they execute in order.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── path helpers ─────────────────────────────────────────────────────── */
  function loginPath() {
    const path  = window.location.pathname;          // e.g. /school/dashboard.html
    const parts = path.split('/').filter(Boolean);   // ['school','dashboard.html']
    // If we're in a sub-folder (pages/) go up two levels, else one
    const depth = parts.length;                      // 2 for root, 3 for pages/
    if (depth <= 1) return './index.html';           // root level
    return '../'.repeat(depth - 1) + 'index.html';  // sub-level
  }

  function redirectToLogin() {
    window.location.replace(loginPath());
  }

  /* ── read school_user set by index.html after sign-in ─────────────────── */
  const raw = localStorage.getItem('school_user');
  if (!raw) { redirectToLogin(); return; }

  let schoolUser;
  try { schoolUser = JSON.parse(raw); }
  catch (e) { localStorage.removeItem('school_user'); redirectToLogin(); return; }

  // Expose immediately so any inline scripts can read it
  window.schoolUser = schoolUser;

  /* ── wait for DOM+Clerk, then validate session ─────────────────────────── */
  window.addEventListener('DOMContentLoaded', function initClerkAuth() {

    // Clerk SDK may not have injected `window.Clerk` yet if it was async.
    // Poll briefly (max 5 s) then give up gracefully (don't block the page).
    let attempts = 0;
    const maxAttempts = 100;

    const poll = setInterval(async function () {
      attempts++;

      if (typeof window.Clerk === 'undefined') {
        if (attempts >= maxAttempts) {
          clearInterval(poll);
          console.warn('clerk-auth: Clerk SDK not available after 5 s – running without session validation');
          document.dispatchEvent(new CustomEvent('clerkReady', { detail: schoolUser }));
        }
        return;
      }

      clearInterval(poll);

      try {
        await window.Clerk.load();
      } catch (err) {
        console.warn('clerk-auth: Clerk.load() failed –', err.message);
        document.dispatchEvent(new CustomEvent('clerkReady', { detail: schoolUser }));
        return;
      }

      if (!window.Clerk.user) {
        // No active Clerk session – clear cache and go to login
        localStorage.removeItem('school_user');
        redirectToLogin();
        return;
      }

      // Sync fresh data from Clerk into school_user
      const u = window.Clerk.user;
      schoolUser.name     = ((u.firstName || '') + ' ' + (u.lastName || '')).trim() || schoolUser.name;
      schoolUser.email    = u.emailAddresses?.[0]?.emailAddress || schoolUser.email;
      schoolUser.imageUrl = u.imageUrl || schoolUser.imageUrl || '';
      localStorage.setItem('school_user', JSON.stringify(schoolUser));
      window.schoolUser = schoolUser;

      // Watch for sign-out in another tab
      window.Clerk.addListener(function ({ user }) {
        if (!user) {
          localStorage.removeItem('school_user');
          redirectToLogin();
        }
      });

      document.dispatchEvent(new CustomEvent('clerkReady', { detail: schoolUser }));
    }, 50);
  });

  /* ── global sign-out helper ────────────────────────────────────────────── */
  window.clerkSignOut = async function () {
    try {
      if (typeof window.Clerk !== 'undefined' && window.Clerk.signOut) {
        await window.Clerk.signOut();
      }
    } catch (e) { /* ignore */ }
    localStorage.removeItem('school_user');
    redirectToLogin();
  };

})();
