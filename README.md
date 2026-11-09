# Suranga AgroERP – Frontend

Agricultural trading & processing management UI (Home, Buy Stock, My Stock, Sell Products, Processing, Money, People, Reports, Settings).
Vanilla JavaScript (ES modules) + Vite. No framework, no runtime dependencies.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Structure
```
index.html              App shell (sidebar, topbar, #view mount point)
public/                 Static assets (favicon)
src/
  main.js               Entry: styles, event registration, router start
  styles/               tokens.css (design tokens) · base · layout · components
  core/                 store (state) · router (hash routes) · events (delegation) · selectors (derived data)
  services/api.js       DATA LAYER – replace localStorage with your backend here
  components/           icons · sidebar · toast · ui (kpi, table, tabs, options)
  features/             One folder per screen (render() + actions)
    trade/              Shared purchase/sale form logic
  utils/                format (money, escape, dates) · dom
```

## Connecting your backend
The frontend checks `GET /api/v1/health/live` on startup and shows whether the API is online. During development, Vite proxies `/api` to `http://localhost:3001`; copy `.env.example` to `.env` only if you need to override `VITE_API_BASE_URL`.

The business screens still use browser `localStorage`: the backend currently provides health and authentication endpoints, not product, stock, purchase, or sales APIs. Those screens will move to server data as the business endpoints are implemented. The API liveness check does not require a database; `/api/v1/health/ready` reports database connectivity separately.

## Data model (`state.data`)
`prod[]` products · `stock{}` quantity by product id · `cost{}` average cost · `ppl[]` people (Farmer/Supplier/Customer) · `tx[]` transactions (`t` = purchase | sale | prod | expense | payin | payout) · `cash` opening cash.

## Not implemented yet
Transport, Sinhala language, date filters, CSV export, print, stock adjustments, sale returns, edit/archive people, payment-to-invoice allocation, authentication.
