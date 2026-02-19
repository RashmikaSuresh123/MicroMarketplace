# MicroMarketplace Deliverables

## 1) Creative UI Element
- Implemented micro-interaction in web app cart/billing header:
  - Cart count badge pulses whenever cart state changes.
  - Files: `web/src/pages/Products.jsx`, `web/src/index.css`

## 2) Seed Data (10 products, 2 users)
- Already configured in `backend/seed.js`.
- Users:
  - `user1@test.com` / `password123`
  - `user2@test.com` / `password123`
- Products seeded: 10

## 3) Web App (React)
- App location: `web/`
- Run:
  - `cd web`
  - `npm install`
  - `npm run dev`

## 4) Mobile App (React Native / Expo)
- App location: `mobile/`
- Run:
  - `cd mobile`
  - `npm install`
  - `npm run start`
- Note:
  - Update `API_BASE` in `mobile/App.js` to your machine IP when testing on a real device.
  - Example: `http://192.168.1.8:5000`

## 5) 3-5 min Demo Video OR Deployed Link

### Option A: Demo video script (3-5 min)
1. Show project structure: `backend`, `web`, `mobile`.
2. Run backend + seed:
   - `cd backend`
   - `npm install`
   - `npm run seed`
   - `npm run dev`
3. Web demo:
   - Register/login as seeded user.
   - Browse/search products.
   - Save favorite.
   - Add items to cart.
   - Adjust quantity and show billing updates.
   - Click checkout and show order success message.
   - Point out cart badge pulse micro-interaction.
4. Mobile demo:
   - Open Expo app.
   - Fetch products.
   - Add to cart and show billing summary updates.

### Option B: Deployed link
- Add your deployed URL here after deployment:
  - Web: `<paste-link>`
  - Backend API: `<paste-link>`
