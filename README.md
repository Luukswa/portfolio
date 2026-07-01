# Portfolio — OSG Twente

Leerlingportfolio-webapp voor OSG Twente. Leerlingen vullen hun profiel, cijfers, doelen, CV, referenties en werkstukken in. Docenten zien een overzicht van al hun leerlingen; beheerders beheren gebruikersrollen, huisstijl en back-ups.

## Technische stack

| Laag | Technologie |
|---|---|
| Backend | Flask 3, psycopg3 (`psycopg[binary]`), psycopg-pool, Waitress WSGI, MSAL (Azure AD) |
| Frontend | React 18, React Router 6, Vite 5, Tailwind 3 (preflight uit — zie `design.md`) |
| Database | PostgreSQL |
| Deploy | PM2 (`ecosystem.config.cjs`), Flask op poort 5000 achter NGINX, statische build in `frontend/dist/` |

## Projectstructuur

```
backend/
  app.py                 Flask-app, blueprint-registratie, SPA-fallback
  middleware.py          @require_auth, @require_admin, @require_teacher
  db.py                  ConnectionPool; get_conn() / put_conn(conn)
  requirements.txt
  .env.example
  routes/
    auth.py              Portal-SSO (/sso) + directe Microsoft-login
                          (/api/auth/login, /api/auth/callback), /api/auth/me, /api/auth/logout
    profile.py            /api/profile, /api/profile/avatar/<id>
    grades.py             /api/grades
    goals.py              /api/goals
    cv.py                 /api/cv
    referenties.py        /api/referenties (per-referentie CRUD)
    werkstukken.py         /api/werkstukken + fotobeheer per werkstuk
    teacher.py             /api/teacher/students/<id>/...  (read-only inzage)
    admin.py               /api/admin/users, profielreset
    backup.py               /api/admin/backups  (maken/herstellen/verwijderen)
    branding.py             /api/config/branding, /api/admin/branding (thema + logo)

frontend/src/
  pages/                 Home, OverMij, Cijfers, Doelen, CV,
                         Referenties, Werkstukken, Hulp, Beheer, Overzicht, StudentDetail
  components/Layout.jsx  Header + navigatiezijbalk + <Outlet>
  context/
    AuthContext.jsx       Ingelogde gebruiker + logout()
    BrandingContext.jsx   Thema, appName, primaryColor, logoUrl
    DarkModeContext.jsx   Donkere modus (localStorage)
  index.css              Alle styling (zie design.md)
  App.jsx                Routeboom + context-providers

uploads/                 Geüploade bestanden (niet in git)
backups/                 Database-/uploadsback-ups (niet in git)
```

## Functies

- **Dashboard (Home)** — samenvatting van profiel, cijfers, doelen, referenties en werkstukken
- **Over mij** — naam (verplicht), titel/rol, bio, skills, hobby's, leukste vakken, profielfoto; eerste keer verschijnt een stapsgewijze setup-wizard
- **Cijfers** — cijfers per vak toevoegen, gemiddelde wordt automatisch berekend
- **Doelen** — persoonlijke leerdoelen (doel, wat wil ik leren, wat heb ik nodig) toevoegen/bewerken/verwijderen
- **CV** — persoonsgegevens, vaardigheden en ervaring
- **Referenties** — vrije lijst van referenties (type, naam, datum, vak, opmerking); elke referentie is een eigen kaart met directe opslag (zelfde interactiepatroon als Werkstukken)
- **Werkstukken** — meerdere foto's per werkstuk, album-lightbox
- **Hulp** — in-app FAQ-pagina met uitleg per onderdeel, bereikbaar via het ❓-icoon rechtsboven
- **Docentenweergave (Overzicht / StudentDetail)** — read-only inzage in alle leerlingen, incl. album-lightbox
- **Beheer (alleen admin)** — gebruikersrollen (beheerder/docent) toekennen, leerling-profiel resetten, huisstijl kiezen, back-ups maken/herstellen/verwijderen

## Authenticatie

Er zijn twee manieren om in te loggen — beide zetten dezelfde Flask-sessie (`id`, `display_name`, `email`, `is_teacher`, `is_admin`) en werken op hetzelfde `users`-record (gekoppeld op `azure_id`):

1. **Via het portaal (SSO)** — het portaal (`../portal`) doet de Microsoft-login en stuurt de gebruiker door naar `/sso?token=...`. De portfolio-backend verifieert dit eenmalige token server-to-server bij het portaal (`PORTAL_BASE_URL` + `SSO_SHARED_SECRET`).
2. **Direct via Microsoft** — de knop "Inloggen met Microsoft" op het inlogscherm stuurt naar `/api/auth/login`, wat rechtstreeks naar Azure AD redirect (MSAL, `authorization_code`-flow). `/api/auth/callback` verwerkt de terugkeer, leest de claims (`oid`, `name`, `preferred_username`) en logt de gebruiker in.

Dit gebruikt **dezelfde Azure-appregistratie** als het portaal — voeg de redirect-URI `https://<portfolio-domein>/api/auth/callback` toe aan die appregistratie. Omdat de Enterprise Application op "assignment required" staat, wijst Azure zelf al niet-toegewezen gebruikers af; `AZURE_ALLOWED_GROUP_ID` is een tweede controle (Graph `checkMemberGroups`) die hetzelfde gedrag als het portaal repliceert.

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

Maak een `.env` aan in `backend/` (zie `backend/.env.example`):

```
FLASK_SECRET_KEY=jouw-geheime-sleutel-min-32-tekens

# Portal SSO
PORTAL_BASE_URL=https://portaal-domein.nl
SSO_SHARED_SECRET=zelfde-waarde-als-in-het-portaal

# Directe Microsoft-login (zelfde appregistratie als het portaal)
APP_BASE_URL=https://portfolio-domein.nl
AZURE_CLIENT_ID=
AZURE_TENANT_ID=
AZURE_CLIENT_SECRET=
AZURE_ALLOWED_GROUP_ID=

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portfolio
DB_USER=postgres
DB_PASS=

# Huisstijl
APP_NAME=Portfolio
PRIMARY_COLOR=#0d4c92
LOGO_URL=
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

## Database

- `db.py` beheert een psycopg3 `ConnectionPool`; gebruik `get_conn()` / `put_conn(conn)` en sluit altijd af met `put_conn` in een `finally`.
- Elke blueprint maakt zijn eigen tabellen aan via `CREATE TABLE IF NOT EXISTS` in een `_ensure_table(s)`-functie — er is geen aparte migratiestap nodig, tabellen ontstaan bij eerste gebruik.
- Schrijfacties committen expliciet (`conn.commit()`); de pool doet dit niet automatisch.

## Bestandsuploads

Uploads staan in `uploads/` naast `backend/`:

```
uploads/
  branding/
    logo.{ext}
  {naam}_{user_id}/
    avatar.{ext}
    werkstukken/
      {vak}_{werk_id}/
        foto_{foto_id}.{ext}
```

Gebruikersmappen worden gevonden op basis van de `_{user_id}`-suffix, ongeacht naamswijzigingen. Toegestane afbeeldingstypen: `jpg`, `jpeg`, `png`, `webp`, `gif` (logo ook `svg`). Maximale uploadgrootte: 20 MB.

## Back-ups (beheer)

Beheerders kunnen via het Beheer-scherm een volledige back-up maken van alle gebruikersdata (profielen, cijfers, doelen, cv, referenties, werkstukken + foto's, instellingen) als JSON + kopie van `uploads/`, opgeslagen onder `backups/backup_{datum}_{tijd}/`. Back-ups kunnen worden hersteld (overschrijft huidige data) of verwijderd vanuit hetzelfde scherm.

## Huisstijl

In het beheerderspaneel kan het thema worden gewisseld en een eigen logo geüpload worden:

| Thema | Primaire kleur | Beschrijving |
|---|---|---|
| Standaard | `#0d4c92` | Donkerblauw met cyaan accent |
| 't Genseler | `#00bcdf` | Zomerlucht cyaan, Golven blauw, Morgenrood rood |

Het geselecteerde thema en logo worden in de database opgeslagen (`settings`-tabel) en gelden voor alle gebruikers. Dark mode is een aparte, per-gebruiker instelling (`localStorage`), los van het thema.

## API-overzicht

| Blueprint | Endpoints |
|---|---|
| `auth.py` | `GET /sso`, `GET /api/auth/login`, `GET /api/auth/callback`, `GET /api/auth/me`, `POST /api/auth/logout` |
| `profile.py` | `GET/PUT /api/profile`, `POST /api/profile/avatar`, `GET/DELETE /api/profile/avatar/<id>` |
| `grades.py` | `GET/POST /api/grades`, `DELETE /api/grades/<id>` |
| `goals.py` | `GET/POST /api/goals`, `PUT/DELETE /api/goals/<id>` |
| `cv.py` | `GET/PUT /api/cv` |
| `referenties.py` | `GET/POST /api/referenties`, `PUT/DELETE /api/referenties/<id>` |
| `werkstukken.py` | `GET/POST /api/werkstukken`, `PUT/DELETE /api/werkstukken/<id>`, `POST /api/werkstukken/<id>/fotos`, `GET/DELETE /api/werkstukken/<id>/fotos/<foto_id>` |
| `teacher.py` | `GET /api/teacher/students`, `GET /api/teacher/students/<id>/{profile,grades,goals,werkstukken,referenties,cv}` (read-only) |
| `admin.py` | `GET /api/admin/users`, `PUT /api/admin/users/<id>`, `POST /api/admin/users/<id>/profile/reset` |
| `backup.py` | `GET/POST /api/admin/backups`, `POST /api/admin/backups/<name>/restore`, `DELETE /api/admin/backups/<name>` |
| `branding.py` | `GET /api/config/branding`, `GET /api/config/logo`, `PUT /api/admin/branding`, `POST/DELETE /api/admin/branding/logo` |

Alle routes behalve `/sso`, de auth-routes en `/api/config/branding` vereisen een ingelogde sessie (`@require_auth`); `teacher.py` vereist `@require_teacher`, `admin.py`/`backup.py`/branding-writes vereisen `@require_admin`.

## Deployen (productie)

Stop PM2 vóór het bouwen — PM2 houdt anders een bestandslock op `dist/assets`:

```bash
pm2 stop portfolio && git pull && cd frontend && npm run build && cd .. && pm2 start portfolio
```

Bij wijzigingen aan `backend/requirements.txt` eerst ook `pip install -r requirements.txt` draaien in de backend-virtualenv voordat je PM2 herstart.

De PM2-configuratie staat in `ecosystem.config.cjs` — Flask draait via Waitress op poort 5000 (127.0.0.1) achter NGINX; de frontend is een statische build.
