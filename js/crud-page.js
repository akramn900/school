function initCrudPage({
  resource,
  apiList,
  apiCreate,
  apiUpdate,
  apiDelete,
  columns,
  formFields,
  allowedRoles,
  filterFields,
  searchKey,
}) {
  const PAGE_SIZE = 10;
  let currentPage = 1;
  let allFilters = {};

  const user = requireAuth(allowedRoles);
  if (!user) return;
  initLayout(allowedRoles);
  decorateListPage(resource, !!apiCreate);

  if (filterFields && filterFields.length) {
    const bar = document.getElementById('filter-bar');
    if (bar) {
      bar.innerHTML = filterFields.map(f => `
        <select class="form-control" onchange="window.__setFilter('${f.key}', this.value)">
          <option value="">All ${f.label}</option>
          ${(f.options || []).map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
        </select>`).join('');
    }
  }

  window.__setFilter = (key, value) => {
    allFilters[key] = value;
    currentPage = 1;
    loadData();
  };

  const searchEl = document.getElementById('search-input');
  if (searchEl) {
    searchEl.addEventListener('input', debounce(() => {
      allFilters.filter_field = searchKey || 'name';
      allFilters.filter_value = searchEl.value;
      if (!searchEl.value) {
        delete allFilters.filter_field;
        delete allFilters.filter_value;
      }
      currentPage = 1;
      loadData();
    }, 400));
  }

  async function loadData() {
    const tableEl = document.getElementById('data-table-container');
    if (!tableEl) return;
    tableEl.innerHTML = '<div class="loading">Loading...</div>';

    try {
      const res = await apiList({ page: currentPage, limit: PAGE_SIZE, ...allFilters });
      renderTable({
        containerId: 'data-table-container',
        columns,
        rows: res.data,
        onView: ['students', 'teachers'].includes(resource) ? row => openView(row) : null,
        onEdit: apiUpdate ? row => openEdit(row) : null,
        onDelete: apiDelete ? id => handleDelete(id) : null,
      });
      renderPagination({
        containerId: 'pagination',
        page: res.page,
        totalPages: res.totalPages,
        onPage: function(p) {
          currentPage = p;
          loadData();
        },
      });
    } catch (err) {
      tableEl.innerHTML = `<p class="empty-state" style="color:var(--danger)">${err.message}</p>`;
    }
  }

  function buildFormHtml(data = {}) {
    const fields = formFields.map(f => {
      const val = data[f.name] || '';
      let input;
      if (f.type === 'select') {
        const opts = (f.options || []).map(o =>
          `<option value="${o.value}" ${val == o.value ? 'selected' : ''}>${o.label}</option>`
        ).join('');
        input = `<select name="${f.name}" class="form-control" ${f.required ? 'required' : ''}><option value="">Select...</option>${opts}</select>`;
      } else if (f.type === 'textarea') {
        input = `<textarea name="${f.name}" class="form-control" rows="3">${val}</textarea>`;
      } else {
        input = `<input type="${f.type || 'text'}" name="${f.name}" class="form-control" value="${val}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}">`;
      }
      const span = f.span2 ? ' span-2' : '';
      return `<div class="form-group${span}"><label>${f.label}${f.required ? ' *' : ''}</label>${input}</div>`;
    }).join('');

    return `<div class="form-grid">${fields}</div>`;
  }

  const createBtn = document.getElementById('create-btn');
  if (createBtn && apiCreate) {
    createBtn.addEventListener('click', () => {
      buildModal('record-modal', `Add ${resource.slice(0, -1)}`, buildFormHtml(), async data => {
        await apiCreate(data);
        toast('Created successfully!');
        loadData();
      });
      openModal('record-modal');
    });
  }

  window.editRow = function(row) {
    buildModal('record-modal', `Edit ${resource.slice(0, -1)}`, buildFormHtml(row), async data => {
      await apiUpdate({ ...data, id: row.id });
      toast('Updated successfully!');
      loadData();
    });
    openModal('record-modal');
  };

  window.viewRow = function(id) {
    location.href = `detail.html?resource=${encodeURIComponent(resource)}&id=${encodeURIComponent(id)}`;
  };

  window.deleteRow = async function(id) {
    if (!confirm('Delete this record? This cannot be undone.')) return;
    try {
      await apiDelete(id);
      toast('Deleted successfully!');
      loadData();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  loadData();
}

function decorateListPage(resource, canCreate) {
  document.querySelector('.page-content')?.classList.add('list-page');
  const title = document.querySelector('.page-title');
  if (title) title.textContent = `All ${resource[0].toUpperCase()}${resource.slice(1)}`;

  const card = document.querySelector('.card');
  if (card) card.classList.add('list-table-card');

  const tools = document.querySelector('.page-header > div');
  if (tools && !tools.querySelector('.round-tool-filter')) {
    tools.classList.add('list-tools');
    const filterBtn = document.createElement('button');
    filterBtn.type = 'button';
    filterBtn.className = 'round-tool round-tool-filter';
    filterBtn.title = 'Filter';
    filterBtn.innerHTML = '<img src="../assets/lama/filter.png" alt="">';

    const sortBtn = document.createElement('button');
    sortBtn.type = 'button';
    sortBtn.className = 'round-tool round-tool-sort';
    sortBtn.title = 'Sort';
    sortBtn.innerHTML = '<img src="../assets/lama/sort.png" alt="">';

    tools.insertBefore(filterBtn, tools.firstChild);
    tools.insertBefore(sortBtn, tools.children[1] || null);
  }

  const createBtn = document.getElementById('create-btn');
  if (createBtn && canCreate) {
    createBtn.className = 'round-tool round-tool-create';
    createBtn.title = `Add ${resource.slice(0, -1)}`;
    createBtn.innerHTML = '<img src="../assets/lama/create.png" alt="">';
  }
}
