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

  el.innerHTML = `
    <button class="nav-circle" title="Messages"><img src="../assets/lama/message.png" alt=""></button>
    <button class="nav-circle nav-circle-badged" title="Announcements"><img src="../assets/lama/announcement.png" alt=""><span>1</span></button>
    <div class="nav-user-copy">
      <strong>${user.username}</strong>
      <small>${user.role}</small>
    </div>
    <button class="nav-avatar" title="Logout" onclick="API.logout()"><img src="../assets/lama/avatar.png" alt=""></button>`;
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
