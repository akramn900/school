# SchoolMS – GitHub Pages Frontend

This is the **static frontend** for the School Management System.

## 🗂 File Structure

```
frontend/
├── index.html              ← Login page
├── css/
│   └── style.css           ← Global styles
├── js/
│   ├── api.js              ← Apps Script REST client
│   ├── utils.js            ← UI helpers (toast, modal, table, pagination)
│   ├── sidebar.js          ← Sidebar builder + auth guard
│   └── crud-page.js        ← Generic CRUD controller
└── pages/
    ├── admin-dashboard.html
    ├── teacher-dashboard.html
    ├── student-dashboard.html
    ├── parent-dashboard.html
    ├── students.html
    ├── teachers.html
    ├── parents.html
    ├── classes.html
    ├── subjects.html
    ├── lessons.html
    ├── exams.html
    ├── assignments.html
    ├── results.html
    ├── attendance.html
    ├── events.html
    └── announcements.html
```

## 🚀 Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `school-frontend`)
2. Push the entire `frontend/` folder contents to the `main` branch root
3. Go to **Settings → Pages → Source: main / root**
4. Your site will be at `https://YOUR_USERNAME.github.io/school-frontend/`

## ⚙️ Configure Backend URL

After deploying the Apps Script (see `backend/README.md`), update the
`window.BACKEND_URL` variable in **every** HTML file:

```js
window.BACKEND_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

Or use a find-and-replace: `YOUR_DEPLOYMENT_ID` → your actual ID.

## 🔐 Default Login

| Role    | Username | Password   |
|---------|----------|------------|
| Admin   | admin    | admin123   |
| Teacher | Set in Spreadsheet Teachers sheet |
| Student | Set in Spreadsheet Students sheet |
| Parent  | Set in Spreadsheet Parents sheet  |

Change defaults via Apps Script Properties (see backend README).
