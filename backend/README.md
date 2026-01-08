# Shift White Gold - Backend

This is a minimal Express backend for the local Shift White Gold frontend.

Features:
- Register and login (passwords hashed with bcrypt)
- JWT-based authentication
- Sellers listing
- Cart persistence per user
- Place orders and generate seller messages
- Data persisted in `data.json` (simple file-based DB)

Getting started
1. Open a terminal in `backend/`.
2. Install dependencies:

```powershell
npm install
```

3. Run the server:

```powershell
npm start
```

The server runs by default on port 4000. You can set `PORT` and `JWT_SECRET` environment variables if desired.

Notes
- This backend is intentionally small and suitable for local development/testing only. For production use, switch to a real database and hardened auth.
- Endpoints are prefixed with `/api`:
  - `POST /api/register` { role, fname, lname, phone, email, password, ... }
  - `POST /api/login` { phone, password }
  - `GET /api/sellers`
  - `GET /api/cart`, `POST /api/cart`
  - `POST /api/orders` (places orders from cart if no items provided)
  - `GET /api/messages`

