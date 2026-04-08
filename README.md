# CineList

Aplicação de watchlist de filmes com busca via TMDB, avaliações, reviews e controle de status.

## Tecnologias

**Backend**
- Python 3.11+
- FastAPI + Uvicorn
- SQLAlchemy + Alembic
- PostgreSQL
- TMDB API

**Frontend**
- React + Vite
- React Router DOM
- TanStack React Query
- Axios
- Zustand

## Pré-requisitos

- Python 3.11 ou superior
- Node.js 18 ou superior
- PostgreSQL instalado e rodando
- Conta no [TMDB](https://www.themoviedb.org) para obter a chave de API

---

## Backend

**1. Entre na pasta**

```bash
cd backend
```

**2. Crie e ative o ambiente virtual**

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

**3. Instale as dependências**

```bash
pip install -r requirements.txt
```

**4. Configure as variáveis de ambiente**

Crie um arquivo `.env` na pasta `backend` com base no `.env.example`:

```
DATABASE_URL=postgresql://watchlist_user:sua_senha@localhost:5432/watchlist_db
TMDB_API_KEY=seu_token_aqui
SECRET_KEY=sua_chave_secreta_aqui
```

> Para o `TMDB_API_KEY`, use o **API Read Access Token (v4 auth)** disponível em [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api). O token começa com `eyJ...`

**5. Configure o banco de dados**

Abra o terminal e entre no PostgreSQL:

```bash
# Windows
psql -U postgres

# Linux/Mac
sudo -u postgres psql
```

Execute os comandos:

```sql
CREATE DATABASE watchlist_db;
CREATE USER watchlist_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE watchlist_db TO watchlist_user;
\q
```

Se estiver no PostgreSQL 15 ou superior, execute também:

```bash
psql -U postgres -d watchlist_db
```

```sql
GRANT ALL ON SCHEMA public TO watchlist_user;
ALTER DATABASE watchlist_db OWNER TO watchlist_user;
\q
```

**6. Rode as migrações**

```bash
# Windows
$env:PYTHONPATH = "caminho\para\backend"

# Linux/Mac
export PYTHONPATH=./

alembic upgrade head
```

**7. Inicie o servidor**

```bash
uvicorn app.main:app --reload
```

A API estará disponível em `http://localhost:8000`
A documentação interativa estará em `http://localhost:8000/docs`

---

## Frontend

**1. Entre na pasta**

```bash
cd frontend
```

**2. Instale as dependências**

```bash
npm install
```

**3. Configure as variáveis de ambiente**

Crie um arquivo `.env` na pasta `frontend`:

```
VITE_API_URL=http://localhost:8000
```

**4. Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

---

## Endpoints disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/movies/search?q=` | Busca filmes no TMDB |
| `GET` | `/movies/{tmdb_id}` | Detalhes do filme e salva no cache |

---

## Estrutura do projeto

```
cinelist/
├── backend/
│   ├── app/
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── main.py
│   │   ├── routers/
│   │   │   └── movies.py
│   │   ├── schemas/
│   │   │   └── movie.py
│   │   └── services/
│   │       └── tmdb.py
│   ├── alembic/
│   ├── .env.example
│   ├── .gitignore
│   ├── alembic.ini
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── hooks/
    │   ├── services/
    │   └── store/
    ├── .env.example
    ├── .gitignore
    └── package.json
```