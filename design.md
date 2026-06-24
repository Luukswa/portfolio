# Design System

All styling lives in `frontend/src/index.css`. Tailwind preflight is disabled — this file is the full reset + component library. Dark mode via `[data-dark]` on `<html>`.

## CSS variables

```css
/* Light */
--primary: #0d4c92        /* OSG navy */
--primary-dark: #093a72
--primary-light: #e8f0fb
--secondary: #09afd9      /* OSG cyan */
--bg: #f4f6f9
--surface: #ffffff
--surface2: #f0f2f5
--border: #dde2ea
--text: #1a202c
--text-soft: #4a5568
--text-dim: #8a93a0
--shadow-sm / --shadow / --shadow-md
--title: 'Titillium Web', sans-serif

/* Dark (under [data-dark]) */
--primary: #3d8fe0
--bg: #0f1117
--surface: #1a1d27
--surface2: #22263a
--border: #2d3348
--text: #e8ecf4
```

## Buttons

```jsx
<button className="btn btn-primary">Label</button>
<button className="btn btn-ghost">Label</button>
<button className="btn btn-danger">Label</button>
<button className="btn btn-success">Label</button>
<button className="btn btn-blue">Label</button>

// Small variant — add btn-sm
<button className="btn btn-primary btn-sm">Label</button>

// Icon-only
<button className="btn btn-icon">×</button>
```

## Badges

```jsx
<span className="badge badge-green">8.5</span>
<span className="badge badge-amber">6.0</span>
<span className="badge badge-red">4.5</span>
<span className="badge badge-blue">Label</span>
<span className="badge badge-gray">Label</span>
<span className="badge badge-primary">Label</span>
```

## Forms

```jsx
<div className="form-group">
  <label>Field label</label>
  <input className="edit-input" value={...} onChange={...} placeholder="..." />
</div>

<div className="form-group">
  <label>Textarea</label>
  <textarea className="edit-input" rows={3} value={...} onChange={...} />
</div>
```

## Cards & sections

```jsx
// Wrapper card
<div className="card">
  <div className="section-title">Titel</div>
  {/* content */}
</div>

// Page header (title + action button)
<div className="page-header">
  <div>
    <h2>Pagina titel</h2>
    <div className="subtitle">Omschrijving</div>
  </div>
  <button className="btn btn-primary">Actie</button>
</div>
```

## Tables

```jsx
<div className="table-wrap">
  <table>
    <thead><tr><th>Kolom</th><th>Kolom</th></tr></thead>
    <tbody>
      {rows.map(r => <tr key={r.id}><td>{r.field}</td><td>{r.other}</td></tr>)}
    </tbody>
  </table>
</div>
```

## Stat tiles (dashboard)

```jsx
<div className="stat green">    {/* green / amber / red / blue */}
  <div className="stat-icon-wrap">🎯</div>
  <div className="num">42</div>
  <div className="lbl">Label</div>
</div>
```

## Modal pattern

```jsx
// Overlay closes on click-outside; Escape key should be wired manually
<div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
  <div className="modal">
    <div className="modal-header">
      <span>Titel</span>
      <button className="btn btn-icon" onClick={close}>✕</button>
    </div>
    <div className="modal-body">{/* content */}</div>
    <div className="modal-footer">
      <button className="btn btn-primary" onClick={save}>Opslaan</button>
      <button className="btn btn-ghost" onClick={close}>Annuleren</button>
    </div>
  </div>
</div>
```

## Empty state

```jsx
<div className="empty-state">Nog niets toegevoegd.</div>
```

## Toggle switch

```jsx
<label className="toggle-switch">
  <input type="checkbox" checked={value} onChange={e => set(e.target.checked)} />
  <span className="slider" />
</label>
```

## Pagination

```jsx
<div className="pagination-bar">
  <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Vorige</button>
  <span>{page} / {totalPages}</span>
  <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Volgende →</button>
</div>
```

## Lightbox (inline pattern)

Used in Werkstukken.jsx and StudentDetail.jsx — no external lib, pure inline component:
- Fixed overlay `rgba(0,0,0,0.82)`, z-index 1000
- Click outside or Escape closes
- `useEffect` for keydown, `useCallback` for click handler
- Image: `objectFit: 'contain'`, `maxWidth: 90vw`, `maxHeight: 90vh`

## Layout dimensions

- Nav sidebar: 220px expanded, 52px collapsed (icons only)
- Header height: ~56px sticky
- Main content: padded, scrollable, `max-width` not constrained (full width)
- Grid for werkstukken cards: `repeat(auto-fill, minmax(280px, 1fr))`
- Grid for student detail werkstukken: `repeat(auto-fill, minmax(200px, 1fr))`

## Dark mode

Applied via `[data-dark]` attribute on `<html>`. Set in `index.html` inline script from `localStorage`. Toggled in `DarkModeContext`. All CSS variables override under `[data-dark]`. In JSX use CSS vars only — no hardcoded colors in `style={{}}` that don't respond to dark mode (exception: status colors like `#e53e3e` for destructive actions).

## Fonts

Loaded from Google Fonts in `index.html`:
- **Titillium Web** 400/600/700 — used for `--title` (nav labels, section headers, uppercase labels)
- **Barlow** 300/400/500/600 — used for body text
