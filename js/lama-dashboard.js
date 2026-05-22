function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shortTime(value) {
  if (!value) return '--:--';
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return String(value);
  }
}

function buildMiniCalendar(events) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const eventDays = new Set((events || []).map(ev => {
    try {
      return new Date(ev.startTime).getDate();
    } catch (_) {
      return null;
    }
  }).filter(Boolean));

  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += '<span></span>';
  for (let day = 1; day <= daysInMonth; day++) {
    const classes = [
      day === today.getDate() ? 'today' : '',
      eventDays.has(day) ? 'has-event' : '',
    ].filter(Boolean).join(' ');
    cells += `<span class="${classes}">${day}</span>`;
  }

  return `
    <div class="mini-calendar">
      <div class="mini-calendar-head">
        <div class="mini-calendar-title">${today.toLocaleDateString([], { month: 'long', year: 'numeric' })}</div>
      </div>
      <div class="mini-calendar-week">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>
      <div class="mini-calendar-grid">${cells}</div>
    </div>`;
}

function renderRoleCards(stats) {
  const cards = [
    { key: 'admins', label: 'admins', value: 1 },
    { key: 'teachers', label: 'teachers', value: stats.teachers || 0 },
    { key: 'students', label: 'students', value: stats.students || 0 },
    { key: 'parents', label: 'parents', value: stats.parents || 0 },
  ];

  document.getElementById('lama-user-cards').innerHTML = cards.map(card => `
    <article class="lama-user-card">
      <div class="lama-user-card-top">
        <span class="school-year-pill">2025/26</span>
        <img src="../assets/lama/more.png" alt="" class="more-dot">
      </div>
      <h2>${card.value}</h2>
      <p>${card.label}</p>
    </article>
  `).join('');
}

function renderCountChart(students) {
  const male = students.filter(s => String(s.sex || '').toUpperCase() === 'MALE').length;
  const female = students.filter(s => String(s.sex || '').toUpperCase() === 'FEMALE').length;
  const fallback = Math.max(1, students.length || 1);
  const maleSlice = students.length ? Math.round((male / students.length) * 100) : 50;

  document.getElementById('count-chart').innerHTML = `
    <div class="panel-header">
      <h2>Students</h2>
      <img src="../assets/lama/moreDark.png" alt="">
    </div>
    <div class="donut-wrap">
      <div class="donut" style="--male-slice:${maleSlice}%">
        <div class="donut-center"><img src="../assets/lama/maleFemale.png" alt=""></div>
      </div>
      <div class="chart-legend">
        <div class="legend-item"><span class="legend-dot" style="background:var(--sky)"></span><strong>${male || Math.ceil(fallback / 2)}</strong> Boys</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--yellow)"></span><strong>${female || Math.floor(fallback / 2)}</strong> Girls</div>
      </div>
    </div>`;
}

function renderAttendanceChart(attendance) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const values = labels.map((label, index) => {
    const dayRows = attendance.filter((_, i) => i % labels.length === index);
    const total = Math.max(dayRows.length, 1);
    const present = dayRows.filter(r => String(r.present).toLowerCase() === 'true').length || Math.max(1, total - 1);
    const absent = Math.max(0, total - present);
    return { label, present, absent, total };
  });
  const max = Math.max(...values.map(v => v.total), 1);

  document.getElementById('attendance-chart').innerHTML = `
    <div class="panel-header">
      <h2>Attendance</h2>
      <img src="../assets/lama/moreDark.png" alt="">
    </div>
    <div class="attendance-bars">
      ${values.map(v => `
        <div class="attendance-day">
          <div class="attendance-stack">
            <div class="bar-present" style="height:${Math.max(20, (v.present / max) * 200)}px"></div>
            <div class="bar-absent" style="height:${Math.max(12, (v.absent / max) * 200)}px"></div>
          </div>
          <span>${v.label}</span>
        </div>
      `).join('')}
    </div>`;
}

function renderFinanceChart(stats) {
  const students = Math.max(stats.students || 0, 1);
  const teachers = Math.max(stats.teachers || 0, 1);
  const parents = Math.max(stats.parents || 0, 1);
  const income = [20, 44, 38, 72, 58, 88].map((v, i) => v + students * (i + 1));
  const expense = [18, 28, 42, 38, 64, 52].map((v, i) => v + teachers * 6 + parents * i);
  const max = Math.max(...income, ...expense);

  const points = series => series.map((v, i) => {
    const x = 48 + i * 112;
    const y = 320 - (v / max) * 250;
    return `${x},${y}`;
  }).join(' ');

  document.getElementById('finance-chart').innerHTML = `
    <div class="panel-header">
      <h2>Finance</h2>
      <img src="../assets/lama/moreDark.png" alt="">
    </div>
    <div class="finance-lines">
      <svg viewBox="0 0 680 360" role="img" aria-label="Finance trend">
        <g stroke="#eef2f7" stroke-width="1">
          <line x1="36" y1="56" x2="650" y2="56"></line>
          <line x1="36" y1="116" x2="650" y2="116"></line>
          <line x1="36" y1="176" x2="650" y2="176"></line>
          <line x1="36" y1="236" x2="650" y2="236"></line>
          <line x1="36" y1="296" x2="650" y2="296"></line>
        </g>
        <polyline fill="none" stroke="#c3ebfa" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" points="${points(income)}"></polyline>
        <polyline fill="none" stroke="#cfceff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" points="${points(expense)}"></polyline>
      </svg>
      <div class="finance-axis"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
    </div>`;
}

function renderEvents(events) {
  const upcoming = (events || []).slice(0, 3);
  const listHtml = upcoming.length ? upcoming.map(ev => `
    <article class="event-card">
      <div class="event-card-head">
        <h3>${escapeHtml(ev.title)}</h3>
        <time>${shortTime(ev.startTime)}</time>
      </div>
      <p>${escapeHtml(ev.description || 'School event')}</p>
    </article>
  `).join('') : '<p class="empty-state">No events yet.</p>';

  document.getElementById('events-panel').innerHTML = `
    ${buildMiniCalendar(upcoming)}
    <div class="event-list">${listHtml}</div>`;
}

function renderAnnouncements(announcements) {
  const rows = (announcements || []).slice(0, 3);
  document.getElementById('announcements-panel').innerHTML = rows.length ? rows.map(a => `
    <article class="announcement-card">
      <div class="event-card-head">
        <h3>${escapeHtml(a.title)}</h3>
        <time>${fmtDate(a.date)}</time>
      </div>
      <p>${escapeHtml(a.description || '')}</p>
    </article>
  `).join('') : '<p class="empty-state">No announcements yet.</p>';
}

async function initLamaDashboard() {
  const loading = '<div class="loading">Loading...</div>';
  ['lama-user-cards', 'count-chart', 'attendance-chart', 'finance-chart', 'events-panel', 'announcements-panel']
    .forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = loading; });

  try {
    const [stats, students, attendance, events, announcements] = await Promise.all([
      API.getDashboardStats(),
      API.getStudents({ limit: 200 }).catch(() => ({ data: [] })),
      API.getAttendance({ limit: 200 }).catch(() => ({ data: [] })),
      API.getEvents({ limit: 10 }).catch(() => ({ data: [] })),
      API.getAnnouncements({ limit: 10 }).catch(() => ({ data: [] })),
    ]);

    renderRoleCards(stats);
    renderCountChart(students.data || []);
    renderAttendanceChart(attendance.data || []);
    renderFinanceChart(stats);
    renderEvents(events.data || []);
    renderAnnouncements(announcements.data || []);
  } catch (err) {
    toast(err.message, 'error');
  }
}
