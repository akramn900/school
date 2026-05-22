// REST client for SchoolMS.
// Supabase is used when SUPABASE_ANON_KEY is filled; otherwise the old GAS
// backend is kept as a safe fallback during migration.

const API = (() => {
  const GAS_URL = window.BACKEND_URL || 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

  const SUPABASE_URL = (window.SUPABASE_URL || 'https://cllnpkysirxrjxwixqme.supabase.co').replace(/\/$/, '');
  const SUPABASE_KEY_PLACEHOLDER = 'PASTE_SUPABASE_ANON_KEY_HERE';
  const SUPABASE_ANON_KEY = (
    window.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbG5wa3lzaXJ4cmp4d2l4cW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODUwOTMsImV4cCI6MjA5NDg2MTA5M30.xYDIvV8bwnm9Thn2wctNzERCBVWG07tKpVHEtlR48Xk'
  ).trim();
  const USE_SUPABASE = Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== SUPABASE_KEY_PLACEHOLDER &&
    SUPABASE_ANON_KEY !== 'PASTE_YOUR_SUPABASE_ANON_PUBLIC_KEY_HERE'
  );

  const TABLES = {
    students: 'students',
    teachers: 'teachers',
    parents: 'parents',
    classes: 'classes',
    subjects: 'subjects',
    grades: 'grades',
    lessons: 'lessons',
    exams: 'exams',
    assignments: 'assignments',
    results: 'results',
    attendance: 'attendance',
    events: 'events',
    announcements: 'announcements',
  };

  const SELECTS = {
    students: 'id,username,name,surname,email,phone,address,bloodType,sex,img,birthday,gradeId,classId,parentId,createdAt',
    teachers: 'id,username,name,surname,email,phone,address,bloodType,sex,img,birthday,createdAt',
    parents: 'id,username,name,surname,email,phone,address,createdAt',
  };

  let _token = localStorage.getItem('school_token') || '';
  let _user = null;
  try { _user = JSON.parse(localStorage.getItem('school_user') || 'null'); } catch (_) {}

  function setAuth(token, user) {
    _token = token;
    _user = user;
    localStorage.setItem('school_token', token);
    localStorage.setItem('school_user', JSON.stringify(user));
  }

  function clearAuth() {
    _token = '';
    _user = null;
    localStorage.removeItem('school_token');
    localStorage.removeItem('school_user');
  }

  function getUser() { return _user; }
  function getToken() { return _token; }
  function isLoggedIn() { return !!_token; }

  function qs(params) {
    const p = { ...params, token: _token };
    return Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
      .join('&');
  }

  async function gasGet(path, params = {}) {
    const url = `${GAS_URL}?path=${encodeURIComponent(path)}&${qs(params)}`;
    const res = await fetch(url, { redirect: 'follow' });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json;
  }

  async function gasPost(path, body = {}) {
    const url = `${GAS_URL}?path=${encodeURIComponent(path)}&token=${encodeURIComponent(_token)}`;
    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json;
  }

  function sbHeaders(extra = {}) {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  async function sbFetch(endpoint, options = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: sbHeaders(options.headers || {}),
    });

    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const message = json?.message || json?.error || res.statusText;
      throw new Error(message);
    }
    return { json, res };
  }

  async function sbRpc(name, payload = {}) {
    const { json } = await sbFetch(`rpc/${name}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return json;
  }

  function normalizeBody(data = {}) {
    const body = { ...data };
    if (body.password === '') delete body.password;
    Object.keys(body).forEach(key => {
      if (body[key] === undefined) delete body[key];
    });
    return body;
  }

  function buildListEndpoint(resource, params = {}) {
    const table = TABLES[resource] || resource;
    const page = Math.max(parseInt(params.page || '1', 10), 1);
    const limit = Math.max(parseInt(params.limit || '10', 10), 1);
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    const search = new URLSearchParams();
    search.set('select', SELECTS[resource] || '*');

    if (params.filter_field && params.filter_value !== undefined && params.filter_value !== '') {
      search.set(params.filter_field, `eq.${params.filter_value}`);
    }

    return { table, page, limit, start, end, endpoint: `${table}?${search.toString()}` };
  }

  async function sbList(resource, params = {}) {
    const { page, limit, start, end, endpoint } = buildListEndpoint(resource, params);
    const { json, res } = await sbFetch(endpoint, {
      headers: {
        Prefer: 'count=exact',
        Range: `${start}-${end}`,
        'Range-Unit': 'items',
      },
    });

    const contentRange = res.headers.get('content-range') || '';
    const total = parseInt(contentRange.split('/')[1] || json?.length || '0', 10);
    return {
      data: json || [],
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async function sbUpsert(resource, data = {}) {
    const table = TABLES[resource] || resource;
    const body = normalizeBody(data);
    if (body.id) {
      const id = body.id;
      delete body.id;
      const { json } = await sbFetch(`${table}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(body),
      });
      return { success: true, action: 'updated', id, data: json?.[0] };
    }

    const { json } = await sbFetch(table, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(body),
    });
    return { success: true, action: 'created', id: json?.[0]?.id, data: json?.[0] };
  }

  async function sbDelete(resource, id) {
    const table = TABLES[resource] || resource;
    await sbFetch(`${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { success: true, deleted: id };
  }

  async function get(path, params = {}) {
    if (!USE_SUPABASE) return gasGet(path, params);
    if (path === 'dashboard/stats') return sbRpc('dashboard_stats');
    return sbList(path, params);
  }

  async function post(path, body = {}) {
    if (!USE_SUPABASE) return gasPost(path, body);
    if (path === 'auth/login') {
      return sbRpc('login_user', {
        p_username: body.username,
        p_password: body.password,
        p_role: body.role || null,
      });
    }

    if (path.endsWith('/delete')) {
      return sbDelete(path.replace('/delete', ''), body.id);
    }

    return sbUpsert(path, body);
  }

  async function login(username, password, role) {
    const data = await post('auth/login', { username, password, role });
    if (!data || data.error) throw new Error(data?.error || 'Invalid credentials');
    const user = { username: data.username, role: data.role, id: data.id };
    setAuth(data.token || `supabase-${data.role}-${data.username}`, user);
    return data;
  }

  function logout() {
    clearAuth();
    window.location.href = '../index.html';
  }

  function listResource(resource, params) { return get(resource, params); }
  function createResource(resource, data) { return post(resource, data); }
  function updateResource(resource, data) { return post(resource, data); }
  function deleteResource(resource, id) { return post(resource + '/delete', { id }); }

  function getDashboardStats() { return get('dashboard/stats'); }

  function getStudents(params) { return get('students', params); }
  function createStudent(data) { return post('students', data); }
  function updateStudent(data) { return post('students', data); }
  function deleteStudent(id) { return post('students/delete', { id }); }

  function getTeachers(params) { return get('teachers', params); }
  function createTeacher(data) { return post('teachers', data); }
  function updateTeacher(data) { return post('teachers', data); }
  function deleteTeacher(id) { return post('teachers/delete', { id }); }

  function getParents(params) { return get('parents', params); }
  function createParent(data) { return post('parents', data); }
  function updateParent(data) { return post('parents', data); }
  function deleteParent(id) { return post('parents/delete', { id }); }

  function getClasses(params) { return get('classes', params); }
  function createClass(data) { return post('classes', data); }
  function updateClass(data) { return post('classes', data); }
  function deleteClass(id) { return post('classes/delete', { id }); }

  function getSubjects(params) { return get('subjects', params); }
  function createSubject(data) { return post('subjects', data); }
  function updateSubject(data) { return post('subjects', data); }
  function deleteSubject(id) { return post('subjects/delete', { id }); }

  function getGrades() { return get('grades'); }

  function getLessons(params) { return get('lessons', params); }
  function createLesson(data) { return post('lessons', data); }
  function updateLesson(data) { return post('lessons', data); }
  function deleteLesson(id) { return post('lessons/delete', { id }); }

  function getExams(params) { return get('exams', params); }
  function createExam(data) { return post('exams', data); }
  function updateExam(data) { return post('exams', data); }
  function deleteExam(id) { return post('exams/delete', { id }); }

  function getAssignments(params) { return get('assignments', params); }
  function createAssignment(data) { return post('assignments', data); }
  function updateAssignment(data) { return post('assignments', data); }
  function deleteAssignment(id) { return post('assignments/delete', { id }); }

  function getResults(params) { return get('results', params); }
  function createResult(data) { return post('results', data); }
  function updateResult(data) { return post('results', data); }
  function deleteResult(id) { return post('results/delete', { id }); }

  function getAttendance(params) { return get('attendance', params); }
  function markAttendance(data) { return post('attendance', data); }
  function deleteAttendance(id) { return post('attendance/delete', { id }); }

  function getEvents(params) { return get('events', params); }
  function createEvent(data) { return post('events', data); }
  function updateEvent(data) { return post('events', data); }
  function deleteEvent(id) { return post('events/delete', { id }); }

  function getAnnouncements(params) { return get('announcements', params); }
  function createAnnouncement(data) { return post('announcements', data); }
  function updateAnnouncement(data) { return post('announcements', data); }
  function deleteAnnouncement(id) { return post('announcements/delete', { id }); }

  return {
    login, logout, getUser, getToken, isLoggedIn, setAuth, clearAuth,
    getDashboardStats,
    getStudents, createStudent, updateStudent, deleteStudent,
    getTeachers, createTeacher, updateTeacher, deleteTeacher,
    getParents, createParent, updateParent, deleteParent,
    getClasses, createClass, updateClass, deleteClass,
    getSubjects, createSubject, updateSubject, deleteSubject,
    getGrades,
    getLessons, createLesson, updateLesson, deleteLesson,
    getExams, createExam, updateExam, deleteExam,
    getAssignments, createAssignment, updateAssignment, deleteAssignment,
    getResults, updateResult, createResult, deleteResult,
    getAttendance, markAttendance, deleteAttendance,
    getEvents, createEvent, updateEvent, deleteEvent,
    getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
    listResource, createResource, updateResource, deleteResource,
  };
})();
