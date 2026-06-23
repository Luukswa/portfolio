# Portfolio

Persoonlijke portfolio-app voor OSG Twente. Gebouwd met Flask 3 (backend) en React 18 + Vite + Tailwind 3 (frontend), geserveerd via NGINX en beheerd met PM2.

## Functionaliteiten

- SSO via het portaal (geen apart login-systeem)
- **Over mij** — bio, skills, hobbys, favoriete vakken en profielfoto (per gebruiker)
- **Mijn cijfers** — vakken en cijfers bijhouden met kleurgecodeerde badges
- **Beheer** — gebruikersbeheer voor beheerders (admin-toggle)
- Dark mode via `[data-dark]` op `<html>`

## Technische stack

| Laag | Technologie |
|---|---|
| Backend | Flask 3, Waitress, psycopg3, psycopg-pool |
| Frontend | React 18, Vite 5, Tailwind 3 |
| Database | PostgreSQL |
| Proces | PM2 (`ecosystem.config.cjs`) |
| Proxy | NGINX → `127.0.0.1:5000` |

## Lokale ontwikkeling

### Vereisten

- Python 3.11+
- Node 20+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # vul waarden in
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxiet `/api/*` naar `http://localhost:5000` (zie `vite.config.js`).

## Productie-deployment

```bash
# Eerste keer
pm2 start ecosystem.config.cjs
pm2 save

# Update
git pull
cd frontend && npm run build && cd ..
pm2 restart portfolio
```

## Omgevingsvariabelen

Kopieer `backend/.env.example` naar `backend/.env` en vul in:

| Variabele | Omschrijving |
|---|---|
| `FLASK_SECRET_KEY` | Willekeurige string ≥ 32 tekens |
| `PORTAL_BASE_URL` | Base-URL van het portaal (SSO) |
| `SSO_SHARED_SECRET` | Gedeeld secret met portaal |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASS` | PostgreSQL-verbinding |
| `APP_NAME` | Naam in de header |
| `PRIMARY_COLOR` | Accentkleur (hex) |
| `LOGO_URL` | URL van het logo |

## Eerste beheerder instellen

Na de eerste login via het portaal:

```sql
psql -U postgres -d portfolio -c "UPDATE users SET is_admin = true WHERE email = 'jouw@email.nl';"
```

Log daarna opnieuw in — het tandwiel verschijnt in de header.

## Mappenstructuur

```
portfolio/
├── backend/
│   ├── app.py               # Flask-app + blueprints
│   ├── db.py                # Connection pool
│   ├── middleware.py        # require_auth / require_admin
│   ├── routes/
│   │   ├── auth.py          # SSO-callback
│   │   ├── branding.py      # APP_NAME / kleur / logo
│   │   ├── profile.py       # Over mij + avatar-upload
│   │   ├── grades.py        # Mijn cijfers
│   │   └── admin.py         # Gebruikersbeheer
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # Home, OverMij, Cijfers, Beheer
│   │   ├── components/      # Layout (header + nav)
│   │   └── context/         # Auth, Branding, DarkMode
│   └── package.json
├── uploads/                 # Profielfotos (niet in git)
└── ecosystem.config.cjs     # PM2-configuratie
```
