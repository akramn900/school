function buildSidebar(role) {
  const iconBase = '../assets/lama/';
  const visible = {
    admin: ['home', 'teacher', 'student', 'parent', 'subject', 'class', 'lesson', 'exam', 'assignment', 'result', 'attendance', 'calendar', 'message', 'announcement', 'profile', 'setting', 'logout'],
    teacher: ['home', 'teacher', 'student', 'parent', 'class', 'lesson', 'exam', 'assignment', 'result', 'attendance', 'calendar', 'message', 'announcement', 'profile', 'setting', 'logout'],
    student: ['home', 'lesson', 'exam', 'assignment', 'result', 'attendance', 'calendar', 'message', 'announcement', 'profile', 'setting', 'logout'],
    parent: ['home', 'exam', 'assignment', 'result', 'attendance', 'calendar', 'message', 'announcement', 'profile', 'setting', 'logout'],
  };

  const dashboardByRole = {
    admin: 'admin-dashboard.html',
    teacher: 'teacher-dashboard.html',
    student: 'student-dashboard.html',
    parent: 'parent-dashboard.html',
  };

  const menuItems = [
    {
      title: 'MENU',
      links: [
        { key: 'home', icon: 'home.png', label: 'Home', href: dashboardByRole[role] || 'student-dashboard.html' },
        { key: 'teacher', icon: 'teacher.png', label: 'Teachers', href: 'teachers.html' },
        { key: 'student', icon: 'student.png', label: 'Students', href: 'students.html' },
        { key: 'parent', icon: 'parent.png', label: 'Parents', href: 'parents.html' },
        { key: 'subject', icon: 'subject.png', label: 'Subjects', href: 'subjects.html' },
        { key: 'class', icon: 'class.png', label: 'Classes', href: 'classes.html' },
        { key: 'lesson', icon: 'lesson.png', label: 'Lessons', href: 'lessons.html' },
        { key: 'exam', icon: 'exam.png', label: 'Exams', href: 'exams.html' },
        { key: 'assignment', icon: 'assignment.png', label: 'Assignments', href: 'assignments.html' },
        { key: 'result', icon: 'result.png', label: 'Results', href: 'results.html' },
        { key: 'attendance', icon: 'attendance.png', label: 'Attendance', href: 'attendance.html' },
        { key: 'calendar', icon: 'calendar.png', label: 'Events', href: 'events.html' },
        { key: 'message', icon: 'message.png', label: 'Messages', href: 'messages.html' },
        { key: 'announcement', icon: 'announcement.png', label: 'Announcements', href: 'announcements.html' },
      ],
    },
    {
      title: 'OTHER',
      links: [
        { key: 'profile', icon: 'profile.png', label: 'Profile', href: 'profile.html' },
        { key: 'setting', icon: 'setting.png', label: 'Settings', href: 'settings.html' },
        { key: 'logout', icon: 'logout.png', label: 'Logout', href: '#', action: 'API.logout()' },
      ],
    },
  ];

  const allowed = visible[role] || visible.student;
  const currentPage = location.pathname.split('/').pop();

  let html = `
    <a class="sidebar-logo" href="${dashboardByRole[role] || 'student-dashboard.html'}">
      <img src="${iconBase}logo.png" alt="" class="sidebar-logo-img">
      <span class="logo-text">SchooLama</span>
    </a>`;

  for (const section of menuItems) {
    html += `<div class="sidebar-section"><div class="sidebar-section-label">${section.title}</div>`;
    for (const link of section.links) {
      if (!allowed.includes(link.key)) continue;
      const active = link.href !== '#' && currentPage === link.href ? ' active' : '';
      const action = link.action ? ` onclick="${link.action}; return false;"` : '';
      html += `
        <a href="${link.href}" class="sidebar-link${active}"${action}>
          <img src="${iconBase}${link.icon}" alt="" class="sidebar-link-icon">
          <span>${link.label}</span>
        </a>`;
    }
    html += `</div>`;
  }

  return html;
}

function initLayout(allowedRoles) {
  const user = requireAuth(allowedRoles);
  if (!user) return null;

  document.getElementById('sidebar').innerHTML = buildSidebar(user.role);
  renderUserBadge('user-info');

  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  return user;
}
