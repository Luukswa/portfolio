# Portfolio — OSG Twente

Leerlingportfolio-webapp voor OSG Twente. Leerlingen vullen hun profiel, cijfers, doelen, CV, referenties en werkstukken in. Docenten en beheerders kunnen alle leerlingen bekijken. Inloggen gaat via SSO met het portaal.

## Technische stack

| Laag | Technologie |
|---|---|
| Backend | Flask 3, psycopg3, psycopg-pool, Waitress |
| Frontend | React 18, React Router 6, Vite 5, Tailwind 3 |
| Database | PostgreSQL |
| Deploy | PM2, NGINX (statische build in `frontend/dist/`) |

## Projectstructuur

```
backend/
  app.py                Flask-app, blueprint-registratie, SPA-fallback
  middleware.py         @require_auth, @require_admin, @require_teacher
  db.py                 ConnectionPool; get_conn() / put_conn()
  routes/
    auth.py             SSO-callback, /api/auth/me, /api/auth/logout
    profile.py          /api/profile, /api/profile/avatar/<id>
    grades.py           /api/grades
    goals.py            /api/goals
    cv.py               /api/cv
    referenties.py      /api/referenties
    werkstukken.py      /api/werkstukken + fotobeheer
    teacher.py          /api/teacher/students/<id>/...
    admin.py            /api/admin/users
    branding.py         /api/config/branding, /api/admin/branding

frontend/src/
  pages/                Home, OverMij, Cijfers, Doelen, CV,
                        Referenties, Werkstukken, Beheer, Overzicht, StudentDetail
  components/Layout.jsx Header + navigatiezijbalk + <Outlet>
  context/
    AuthContext.jsx      Ingelogde gebruiker + logout()
    BrandingContext.jsx  Thema, appName, primaryColor, logoUrl
    DarkModeContext.jsx  Donkere modus (localStorage)
  index.css             Alle styling
  App.jsx               Routeboom + context-providers
```

## Installatie (development)

### Vereisten
- Python 3.11+
- Node.js 20+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Maak een `.env` aan in de `backend/`-map:

```
FLASK_SECRET_KEY=jouw-geheime-sleutel
DATABASE_URL=postgresql://gebruiker:wachtwoord@localhost/portfolio
APP_NAME=Portfolio
```

Start de backend:

```bash
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

De Vite dev-server draait op `http://localhost:5173` en proxyt `/api/...` naar `localhost:5000`.

## Deployen (productie)

Stop PM2 voor het bouwen — PM2 houdt anders een bestandslock op `dist/assets`.

```
pm2 stop portfolio && git pull && cd frontend && npm run build && cd .. && pm2 start portfolio
```

De PM2-configuratie staat in `ecosystem.config.cjs`. Flask draait op poort 5000 achter NGINX; de frontend is een statische build.

## Functies

- **Dashboard** — samenvatting van profiel, cijfers, doelen en werkstukken
- **Over mij** — naam, bio, skills, hobby's, vakken, profielfoto
- **Cijfers** — cijfers per vak toevoegen en bewerken
- **Doelen** — persoonlijke leerdoelen bijhouden
- **CV** — werkervaring en opleiding
- **Referenties** — contactpersonen/referenties
- **Werkstukken** — meerdere foto's per werkstuk, album-lightbox
- **Docentenweergave** — leerlingenoverzicht met album-lightbox
- **Beheer** — gebruikersrollen (beheerder/docent) en huisstijlkeuze

## Huisstijl

In het beheerderspaneel kunnen twee thema's worden geactiveerd:

| Thema | Primaire kleur | Beschrijving |
|---|---|---|
| Standaard | `#0d4c92` | Donkerblauw met cyaan accent |
| 't Genseler | `#00bcdf` | Zomerlucht cyaan, Golven blauw, Morgenrood rood |

Het geselecteerde thema wordt in de database opgeslagen en geldt voor alle gebruikers.

## Bestandsuploads

Uploads staan in `uploads/` (naast `backend/`):

```
uploads/
  {naam}_{user_id}/
    avatar.{ext}
    werkstukken/
      {vak}_{werk_id}/
        foto_{foto_id}.{ext}
```

Toegestane bestandstypen: `jpg`, `jpeg`, `png`, `webp`, `gif`.

## Authenticatie

Inloggen verloopt via SSO van het portaal. Na authenticatie slaat het portaal een sessie op die door deze app gelezen wordt. De Flask-sessie bevat `id`, `display_name`, `email`, `is_teacher` en `is_admin`.
