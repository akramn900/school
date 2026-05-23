// Shared UI helpers for the static SchoolMS frontend.

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function buildModal(id, title, formHtml, onSubmit) {
  let modal = document.getElementById(id);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${title}</h3>
        <button onclick="closeModal('${id}')" class="btn-icon">x</button>
      </div>
      <div class="modal-body">
        <form id="${id}-form">${formHtml}</form>
      </div>
      <div class="modal-footer">
        <button type="button" onclick="closeModal('${id}')" class="btn btn-ghost">Cancel</button>
        <button type="submit" form="${id}-form" class="btn btn-primary">Save</button>
      </div>
    </div>`;

  document.getElementById(id + '-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    try {
      await onSubmit(data);
      closeModal(id);
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  return modal;
}

function renderTable({ containerId, columns, rows, onView, onEdit, onDelete }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!rows || rows.length === 0) {
    container.innerHTML = '<p class="empty-state">No records found.</p>';
    return;
  }

  const thead = columns.map(c => `<th class="${c.className || ''}">${c.label}</th>`).join('') +
    (onView || onEdit || onDelete ? '<th>Actions</th>' : '');

  const tbody = rows.map(row => {
    const cells = columns.map(c => {
      const val = c.render ? c.render(row) : (row[c.key] ?? '-');
      return `<td class="${c.className || ''}">${val}</td>`;
    }).join('');

    const actions = [];
    if (onView) {
      actions.push(`<button class="row-action row-action-view" title="View" onclick="viewRow('${row.id}')"><img src="../assets/lama/view.png" alt=""></button>`);
    }
    if (onEdit) {
      actions.push(`<button class="row-action row-action-edit" title="Edit" onclick='editRow(${JSON.stringify(row)})'><img src="../assets/lama/update.png" alt=""></button>`);
    }
    if (onDelete) {
      actions.push(`<button class="row-action row-action-delete" title="Delete" onclick="deleteRow('${row.id}')"><img src="../assets/lama/delete.png" alt=""></button>`);
    }

    const actionCell = actions.length ? `<td class="action-cell">${actions.join('')}</td>` : '';
    return `<tr>${cells}${actionCell}</tr>`;
  }).join('');

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="data-table">
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>`;
}

function renderPagination({ containerId, page, totalPages, onPage }) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const prev = page > 1
    ? `<button class="pager-btn" onclick="(${onPage})(${page - 1})">Prev</button>`
    : '<button class="pager-btn" disabled>Prev</button>';
  const next = page < totalPages
    ? `<button class="pager-btn" onclick="(${onPage})(${page + 1})">Next</button>`
    : '<button class="pager-btn" disabled>Next</button>';

  container.innerHTML = `
    <div class="pagination">
      ${prev}
      <span>Page ${page} of ${totalPages}</span>
      ${next}
    </div>`;
}

function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function fmtDate(val) {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleDateString();
  } catch (_) {
    return val;
  }
}

function fmtDateTime(val) {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  } catch (_) {
    return val;
  }
}

function requireAuth(allowedRoles) {
  if (!API.isLoggedIn()) {
    window.location.href = '../index.html';
    return false;
  }

  const user = API.getUser();
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast('Access denied', 'error');
    window.location.href = '../index.html';
    return false;
  }

  return user;
}

function renderUserBadge(containerId) {
  const user = API.getUser();
  if (!user) return;

  const el = document.getElementById(containerId);
  if (!el) return;

  const initial = (user.name || user.username || 'U')[0].toUpperCase();
  const avatarHtml = user.imageUrl
    ? `<img src="${user.imageUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
    : initial;

  el.innerHTML = `
    <button class="nav-circle" title="Messages"><img src="../assets/lama/message.png" alt=""></button>
    <button class="nav-circle nav-circle-badged" title="Announcements"><img src="../assets/lama/announcement.png" alt=""><span>1</span></button>
    <div style="position:relative;">
      <button class="nav-avatar" title="Profile" onclick="toggleSubProfileMenu(event)" style="width:36px;height:36px;border-radius:50%;background:var(--purple,#4361EE);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;overflow:hidden;">${avatarHtml}</button>
      <div id="sub-profile-menu" style="display:none;position:absolute;top:calc(100% + 8px);right:0;width:230px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.12);z-index:999;overflow:hidden;">
        <div style="display:flex;align-items:center;gap:10px;padding:14px;">
          <div style="width:40px;height:40px;border-radius:50%;background:#4361EE;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;overflow:hidden;">${avatarHtml}</div>
          <div>
            <div style="font-weight:700;font-size:13px;color:#1a1a2e;">${user.name || user.username}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:1px;">${user.email || ''}</div>
            <div style="display:inline-block;margin-top:3px;font-size:10px;font-weight:600;background:#C3EBFA;color:#4361EE;border-radius:6px;padding:1px 7px;text-transform:uppercase;">${user.role || ''}</div>
          </div>
        </div>
        <div style="height:1px;background:#e5e7eb;"></div>
        <button onclick="window.location.href='profile.html'" style="width:100%;text-align:left;background:none;border:none;padding:10px 16px;font-size:13px;color:#1a1a2e;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;">👤 My Profile</button>
        <button onclick="window.location.href='settings.html'" style="width:100%;text-align:left;background:none;border:none;padding:10px 16px;font-size:13px;color:#1a1a2e;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;">⚙️ Settings</button>
        <div style="height:1px;background:#e5e7eb;"></div>
        <button onclick="API.logout()" style="width:100%;text-align:left;background:none;border:none;padding:10px 16px;font-size:13px;color:#ef4444;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;">🚪 Sign out</button>
      </div>
    </div>`;

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      const menu = document.getElementById('sub-profile-menu');
      if (menu && !menu.parentElement.contains(e.target)) {
        menu.style.display = 'none';
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 0);
}

function toggleSubProfileMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('sub-profile-menu');
  if (!menu) return;
  const isOpen = menu.style.display === 'block';
  menu.style.display = isOpen ? 'none' : 'block';
}

function getDashboardPath(role) {
  return {
    admin: 'admin-dashboard.html',
    teacher: 'teacher-dashboard.html',
    student: 'student-dashboard.html',
    parent: 'parent-dashboard.html',
  }[role] || 'student-dashboard.html';
}

function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name);
}
