/**
 * clerk-auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop this script (and the Clerk SDK script tag) into every page that needs
 * auth protection.  It will:
 *   1. Wait for Clerk to load
 *   2. If no active session → redirect to login
 *   3. Expose window.schoolUser (from localStorage) for the rest of the page
 *   4. Listen for sign-out and redirect to login
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE: Add to the <head> of every protected page:
 *
 *   <script
 *     async crossorigin="anonymous"
 *     data-clerk-publishable-key="pk_test_Y_RzLmR1diQ"
 *     src="https://unpkg.com/@clerk/clerk-js@latest/dist/clerk.browser.js"
 *   ></script>
 *   <script src="../js/clerk-auth.js"></script>
 */

(function () {
  'use strict';

  // ── helpers ────────────────────────────────────────────────────────────────
  function loginPath() {
    const path = window.location.pathname;
    // works for /school/pages/foo.html → /school/index.html
    const parts = path.split('/');
    // Find index.html relative to current depth
    const depth = parts.filter(Boolean).length;
    const up = depth > 1 ? '../'.repeat(depth - 1) : './';
    return up + 'index.html';
  }

  function redirectToLogin() {
    window.location.href = loginPath();
  }

  // ── expose school_user ─────────────────────────────────────────────────────
  const raw = localStorage.getItem('school_user');
  if (!raw) { redirectToLogin(); return; }

  let schoolUser;
  try { schoolUser = JSON.parse(raw); }
  catch (e) { localStorage.removeItem('school_user'); redirectToLogin(); return; }

  window.schoolUser = schoolUser;

  // ── wait for Clerk, then validate session ──────────────────────────────────
  window.addEventListener('load', async () => {
    if (typeof Clerk === 'undefined') {
      // Clerk SDK not present on this page – fail open for non-Clerk pages
      return;
    }
    await Clerk.load();

    if (!Clerk.user) {
      // No active Clerk session
      localStorage.removeItem('school_user');
      redirectToLogin();
      return;
    }

    // Keep school_user in sync with fresh Clerk data
    const u = Clerk.user;
    schoolUser.name     = (u.firstName || '') + ' ' + (u.lastName || '');
    schoolUser.email    = u.emailAddresses?.[0]?.emailAddress || schoolUser.email;
    schoolUser.imageUrl = u.imageUrl || schoolUser.imageUrl;
    localStorage.setItem('school_user', JSON.stringify(schoolUser));
    window.schoolUser = schoolUser;

    // React to sign-out anywhere in the session
    Clerk.addListener(({ user }) => {
      if (!user) {
        localStorage.removeItem('school_user');
        redirectToLogin();
      }
    });

    // Fire a custom event so pages know auth is ready
    document.dispatchEvent(new CustomEvent('clerkReady', { detail: schoolUser }));
  });

  // ── sign-out helper available globally ────────────────────────────────────
  window.clerkSignOut = async function () {
    if (typeof Clerk !== 'undefined') {
      await Clerk.signOut();
    }
    localStorage.removeItem('school_user');
    redirectToLogin();
  };

})();
