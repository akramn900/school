/**
 * clerk-auth.js — v4
 * ─────────────────────────────────────────────────────────────────────────────
 * Place BOTH tags at top of <head> in every protected page, in this order:
 *
 *   <script
 *     data-clerk-publishable-key="pk_test_YWxlcnQtY293LTMyLmNsZXJrLmFjY291bnRzLmRlviQ"
 *     src="https://unpkg.com/@clerk/clerk-js@latest/dist/clerk.browser.js"
 *     type="text/javascript"
 *   ></script>
 *   <script src="./js/clerk-auth.js"></script>   ← root pages
 *   <script src="../js/clerk-auth.js"></script>  ← pages/ subfolder
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  // ── Path helpers ────────────────────────────────────────────────────────────
  function loginPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts.length <= 1 ? './index.html' : '../'.repeat(parts.length - 1) + 'index.html';
  }
  function redirectToLogin() {
    window.location.replace(loginPath());
  }

  // ── LOGOUT GUARD ────────────────────────────────────────────────────────────
  // doLogout() sets this flag BEFORE clearing school_user so we don't
  // immediately redirect back to dashboard while Clerk.signOut() is in progress
  if (localStorage.getItem('clerk_signing_out') === '1') {
    // We're in the middle of signing out — don't interfere
    return;
  }

  // ── Read school_user ────────────────────────────────────────────────────────
  const raw = localStorage.getItem('school_user');
  if (!raw) { redirectToLogin(); return; }

  let schoolUser;
  try { schoolUser = JSON.parse(raw); }
  catch (e) { localStorage.removeItem('school_user'); redirectToLogin(); return; }

  window.schoolUser = schoolUser;

  // ── Validate Clerk session (poll until SDK is available) ────────────────────
  window.addEventListener('DOMContentLoaded', function () {
    let tries = 0;
    const timer = setInterval(async function () {
      tries++;

      // If logout was triggered while we were waiting, abort
      if (localStorage.getItem('clerk_signing_out') === '1') {
        clearInterval(timer);
        return;
      }

      if (typeof window.Clerk === 'undefined') {
        if (tries > 120) { // 6 s max → fail open (don't block the page)
          clearInterval(timer);
          document.dispatchEvent(new CustomEvent('clerkReady', { detail: schoolUser }));
        }
        return;
      }
      clearInterval(timer);

      try { await window.Clerk.load(); }
      catch (e) {
        document.dispatchEvent(new CustomEvent('clerkReady', { detail: schoolUser }));
        return;
      }

      if (!window.Clerk.user) {
        localStorage.removeItem('school_user');
        redirectToLogin();
        return;
      }

      // Sync fresh Clerk profile into schoolUser
      const u = window.Clerk.user;
      schoolUser.name     = ((u.firstName || '') + ' ' + (u.lastName || '')).trim() || schoolUser.name;
      schoolUser.email    = u.primaryEmailAddress?.emailAddress || schoolUser.email;
      schoolUser.imageUrl = u.imageUrl || schoolUser.imageUrl || '';
      localStorage.setItem('school_user', JSON.stringify(schoolUser));
      window.schoolUser = schoolUser;

      // Watch for sign-out from another tab
      window.Clerk.addListener(({ user }) => {
        if (!user && localStorage.getItem('clerk_signing_out') !== '1') {
          localStorage.removeItem('school_user');
          redirectToLogin();
        }
      });

      document.dispatchEvent(new CustomEvent('clerkReady', { detail: schoolUser }));
    }, 50);
  });

  // ── Global sign-out ─────────────────────────────────────────────────────────
  window.clerkSignOut = async function () {
    localStorage.setItem('clerk_signing_out', '1');
    localStorage.removeItem('school_user');
    window.schoolUser = null;
    try {
      if (typeof window.Clerk !== 'undefined' && window.Clerk.signOut) {
        await window.Clerk.signOut();
      }
    } catch (_) {}
    localStorage.removeItem('clerk_signing_out');
    window.location.replace(loginPath());
  };

})();
