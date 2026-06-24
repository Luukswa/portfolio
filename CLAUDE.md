# Portfolio App — Claude Context

## What this is
Student portfolio web app for OSG Twente. Students fill in their profile, grades, goals, CV, references, and artwork (werkstukken). Teachers and admins can view all students. SSO login via the portal (separate app at `C:\Users\LuukHennink\Desktop\portal`).

## Stack
- **Backend**: Flask 3, psycopg3 (`psycopg[binary]`), psycopg-pool, Waitress WSGI
- **Frontend**: React 18, React Router 6, Vite 5, Tailwind 3 (preflight disabled)
- **DB**: PostgreSQL
- **Deploy**: PM2 (`ecosystem.config.cjs`) serving Flask on port 5000 behind NGINX; frontend is a static build in `frontend/dist/`

## Project layout
```
backend/
  app.py              Flask app, blueprint registration, SPA fallback
  middleware.py       @require_auth, @require_admin, @require_teacher decorators
  db.py               ConnectionPool; get_conn() / put_conn(conn)
  routes/
    auth.py           /sso callback, /api/auth/me, /api/auth/logout
    profile.py        /api/profile, /api/profile/avatar/<id>
    grades.py         /api/grades
    goals.py          /api/goals
    cv.py             /api/cv
    referenties.py    /api/referenties
    werkstukken.py    /api/werkstukken, /api/werkstukken/<id>/fotos/<fid>
    teacher.py        /api/teacher/students/<id>/...
    admin.py          /api/admin/users
    branding.py       /api/config/branding

frontend/src/
  pages/              One file per page (Home, OverMij, Cijfers, Doelen, CV,
                      Referenties, Werkstukken, Beheer, Overzicht, StudentDetail)
  components/Layout.jsx   Header + nav sidebar + <Outlet>
  context/
    AuthContext.jsx        user object + logout()
    BrandingContext.jsx    appName, primaryColor, logoUrl
    DarkModeContext.jsx    dark mode toggle (localStorage)
  index.css           All styling — see design.md
  App.jsx             Route tree + context providers
  main.jsx            React root
```

## Auth & sessions
- Flask cookie sessions. `session['user']` has `id`, `display_name`, `email`, `is_teacher`, `is_admin`.
- Decorators: `@require_auth`, `@require_teacher`, `@require_admin`.
- SSO is handled by the portal; this app receives the session from the portal via a shared secret / redirect.

## Database conventions
- `get_conn()` / `put_conn(conn)` from `db.py` — always `put_conn` in a `finally` block.
- Use `with conn.cursor() as cur:` — psycopg3 context manager.
- `conn.commit()` explicitly after writes; pool does not auto-commit.
- Table creation uses `CREATE TABLE IF NOT EXISTS` inside `_ensure_tables(cur)` per-blueprint.

## File uploads
- Base dir: `uploads/` at repo root (sibling of `backend/`).
- User dir: `uploads/{safe_name}_{user_id}/` — find with `_find_user_dir(user_id)` (scans by `_{user_id}` suffix).
- Werkstuk photos: `uploads/{safe_name}_{user_id}/werkstukken/{safe_vak}_{werk_id}/foto_{foto_id}.{ext}`.
- `_find_werk_dir(user_dir, werk_id)` scans by `_{werk_id}` suffix — robust to vak renames.
- Allowed extensions: `jpg`, `jpeg`, `png`, `webp`, `gif`.

## Key data shapes (API responses)
```js
// werkstuk
{ id, vak, gemaakt_bij, datum, trots_omdat, fotos: [{id, url}] }

// foto URL served by
GET /api/werkstukken/<werk_id>/fotos/<foto_id>
```

## Frontend conventions
- All styling via CSS classes from `index.css` or inline `style={{}}` — no Tailwind utility classes in JSX (Tailwind 3 used only in CSS via `@apply`, if at all).
- `useRef` for files (avoids stale closure on `useState`).
- `FileReader.readAsDataURL()` for image previews — never `URL.createObjectURL()` (blob URLs break with cache-bust params).
- Cache-bust API image URLs with `?t=1` (static, no Date.now() on render).
- Fetch calls go to `/api/...` — proxied to `localhost:5000` in dev by Vite.

## Deployment
After every commit and push, always give the user this exact deploy command to run on the server:
```
pm2 stop portfolio && git pull && cd frontend && npm run build && cd .. && pm2 start portfolio
```
Stop PM2 before building — it holds a file lock on `dist/assets`.

## Branding
- Navy: `#0d4c92` (primary), Cyan: `#09afd9` (secondary)
- Dark mode: `[data-dark]` attribute on `<html>`, toggled via `DarkModeContext`, persisted in `localStorage`
- Fonts: Titillium Web (headings, labels), Barlow (body)

## What not to do
- Don't add `Co-Authored-By` trailers to commits.
- Don't add comments explaining what the code does — only comment non-obvious WHY.
- Don't add error handling for scenarios that can't happen.
- Always `git push` immediately after `git commit`.
