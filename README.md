# MFC Food Shop 🍽️

A professional full-stack food ordering web application built with vanilla HTML/CSS/JS, Node.js, and JSON file storage.

## Quick Start

```bash
# 1. Extract the zip and enter the folder
cd MFC-Food-Shop

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open in browser
http://localhost:3000
```

## Demo Login Credentials

| Role     | Email                 | Password  |
|----------|-----------------------|-----------|
| Admin    | admin@mfcfood.com     | admin123  |
| Customer | john@example.com      | pass123   |

## Pages

### Customer
| URL            | Description              |
|----------------|--------------------------|
| `/`            | Homepage with hero, featured items, categories |
| `/menu`        | Full menu with filters, search, sort |
| `/cart`        | Shopping cart with coupon codes |
| `/checkout`    | Checkout form with order placement |
| `/orders`      | Order history & tracking timeline |
| `/profile`     | User profile, favorites, order history |
| `/login`       | Sign in page |
| `/register`    | New account registration |

### Admin
| URL                  | Description              |
|----------------------|--------------------------|
| `/admin`             | Dashboard with stats & recent orders |
| `/admin/products`    | Add / edit / delete products |
| `/admin/orders`      | Manage & update order statuses |
| `/admin/users`       | View & manage customers |
| `/admin/categories`  | Manage food categories |
| `/admin/offers`      | Toggle discount codes |

## Coupon Codes
- `WELCOME5` — $5 off first order
- `WEEKEND20` — 20% off burgers
- `FREEDEL` — Free delivery

## Project Structure

```
MFC-Food-Shop/
├── public/
│   ├── css/          style.css, admin.css, responsive.css
│   ├── js/           app.js, menu.js, cart.js, auth.js, checkout.js, admin.js
│   └── pages/        All HTML pages
├── data/             JSON data files (products, users, orders, etc.)
├── routes/           Express route handlers
├── server.js         Main server entry point
└── package.json
```

## Features
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Real-time cart with localStorage persistence
- ✅ Order placement & tracking
- ✅ Admin CRUD for products, orders, users, categories
- ✅ Coupon/discount code system
- ✅ Favorites/wishlist
- ✅ Product search & category filtering
- ✅ Professional dark charcoal + red design
