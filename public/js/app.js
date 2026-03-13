/* ===== MFC Food Shop — Core App JS ===== */

// ===== API Helper =====
const API = {
  async get(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  },
  async post(url, data) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  async put(url, data) {
    const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  async delete(url) {
    const res = await fetch(url, { method: 'DELETE' });
    return res.json();
  }
};

// ===== Auth State =====
const Auth = {
  getUser() { try { return JSON.parse(localStorage.getItem('mfc_user')); } catch { return null; } },
  setUser(user) { localStorage.setItem('mfc_user', JSON.stringify(user)); },
  logout() { localStorage.removeItem('mfc_user'); window.location.href = '/login'; },
  isLoggedIn() { return !!this.getUser(); },
  isAdmin() { const u = this.getUser(); return u && u.role === 'admin'; }
};

// ===== Cart Store =====
const Cart = {
  get() { try { return JSON.parse(localStorage.getItem('mfc_cart')) || []; } catch { return []; } },
  set(items) { localStorage.setItem('mfc_cart', JSON.stringify(items)); this.updateBadge(); },
  add(product, qty = 1) {
    const items = this.get();
    const idx = items.findIndex(i => i.id === product.id);
    if (idx >= 0) items[idx].quantity += qty;
    else items.push({ ...product, quantity: qty });
    this.set(items);
    Toast.success(`${product.name} added to cart!`);
  },
  remove(id) {
    const items = this.get().filter(i => i.id !== id);
    this.set(items);
  },
  updateQty(id, qty) {
    const items = this.get();
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) { if (qty <= 0) items.splice(idx, 1); else items[idx].quantity = qty; }
    this.set(items);
  },
  clear() { this.set([]); },
  count() { return this.get().reduce((s, i) => s + i.quantity, 0); },
  subtotal() { return this.get().reduce((s, i) => s + i.price * i.quantity, 0); },
  updateBadge() {
    const badge = document.getElementById('cartBadge');
    const count = this.count();
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
  }
};

// ===== Favorites Store =====
const Favorites = {
  get() { try { return JSON.parse(localStorage.getItem('mfc_favs')) || []; } catch { return []; } },
  toggle(id) {
    const favs = this.get();
    const idx = favs.indexOf(id);
    if (idx >= 0) favs.splice(idx, 1);
    else favs.push(id);
    localStorage.setItem('mfc_favs', JSON.stringify(favs));
    return idx < 0; // true if added
  },
  has(id) { return this.get().includes(id); }
};

// ===== Toast Notifications =====
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(msg, type = 'default', icon = '✓') {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
  },
  success(msg) { this.show(msg, 'success', '✓'); },
  error(msg) { this.show(msg, 'error', '✕'); },
  info(msg) { this.show(msg, 'default', 'ℹ'); }
};

// ===== DOM Helpers =====
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => { if (k === 'class') element.className = v; else if (k === 'html') element.innerHTML = v; else element.setAttribute(k, v); });
  children.forEach(c => element.append(typeof c === 'string' ? document.createTextNode(c) : c));
  return element;
}

// ===== Format Helpers =====
function formatPrice(n) { return '₱' + Number(n).toFixed(2); }
function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function formatDateTime(d) { return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function stars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

// ===== Cart Sidebar =====
function initCartSidebar() {
  const overlay = document.getElementById('cartOverlay');
  const sidebar = document.getElementById('cartSidebar');
  const openBtn = document.getElementById('cartBtn');
  const closeBtn = document.getElementById('cartClose');

  if (!sidebar) return;

  function openCart() { overlay.classList.add('open'); sidebar.classList.add('open'); renderCartSidebar(); }
  function closeCart() { overlay.classList.remove('open'); sidebar.classList.remove('open'); }

  if (openBtn) openBtn.addEventListener('click', openCart);
  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  if (overlay) overlay.addEventListener('click', closeCart);
}

function renderCartSidebar() {
  const items = Cart.get();
  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  if (!itemsEl) return;

  if (items.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty"><div class="icon">🛒</div><p>Your cart is empty.<br>Add some delicious food!</p></div>`;
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (footerEl) footerEl.style.display = 'block';
  itemsEl.innerHTML = items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1546793665-c74683f339c1?w=100&fit=crop'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty('${item.id}', ${item.quantity - 1})">−</button>
          <span class="qty-count">${item.quantity}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}', ${item.quantity + 1})">+</button>
          <button class="remove-item-btn" onclick="removeItem('${item.id}')" title="Remove">✕</button>
        </div>
      </div>
    </div>
  `).join('');

  const subtotal = Cart.subtotal();
  const tax = subtotal * 0.09;
  const delivery = subtotal >= 30 ? 0 : 2.99;
  const total = subtotal + tax + delivery;

  const totalsEl = document.getElementById('cartTotals');
  if (totalsEl) totalsEl.innerHTML = `
    <div class="cart-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
    <div class="cart-row"><span>Tax (9%)</span><span>${formatPrice(tax)}</span></div>
    <div class="cart-row"><span>Delivery</span><span>${delivery === 0 ? '<span style="color:var(--green)">Free</span>' : formatPrice(delivery)}</span></div>
    <div class="cart-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
  `;
}

function changeQty(id, qty) { Cart.updateQty(id, qty); renderCartSidebar(); }
function removeItem(id) { Cart.remove(id); renderCartSidebar(); }

// ===== Navbar =====
function initNavbar() {
  Cart.updateBadge();
  const user = Auth.getUser();
  const userBtn = document.getElementById('userBtn');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (userBtn && user) {
    userBtn.textContent = user.name.split(' ')[0];
    userBtn.style.display = 'inline-flex';
    if (loginBtn) loginBtn.style.display = 'none';
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => Auth.logout());
  }

  // Mobile menu
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => mobileNav.classList.toggle('open'));
  }

  // Active nav link
  const path = window.location.pathname;
  $$('.nav-link').forEach(link => {
    if (link.getAttribute('href') === path) link.classList.add('active');
  });
}

// ===== Form Validation =====
function validateForm(formEl) {
  let valid = true;
  formEl.querySelectorAll('[required]').forEach(input => {
    const err = formEl.querySelector(`[data-for="${input.id}"]`);
    if (!input.value.trim()) {
      input.classList.add('error');
      if (err) { err.textContent = 'This field is required.'; err.classList.add('show'); }
      valid = false;
    } else {
      input.classList.remove('error');
      if (err) err.classList.remove('show');
    }
    if (input.type === 'email' && input.value && !/\S+@\S+\.\S+/.test(input.value)) {
      input.classList.add('error');
      if (err) { err.textContent = 'Enter a valid email.'; err.classList.add('show'); }
      valid = false;
    }
  });
  return valid;
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCartSidebar();
});

/* ===== 🔥 Firefly Engine ===== */
(function initFireflies() {
  const canvas = document.createElement('canvas');
  canvas.id = 'fireflyCanvas';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const COUNT = window.innerWidth < 600 ? 22 : 40;
  const flies = Array.from({ length: COUNT }, () => ({
    x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
    r: Math.random() * 2 + 1, dx: (Math.random() - .5) * .6, dy: (Math.random() - .5) * .6,
    phase: Math.random() * Math.PI * 2, speed: Math.random() * .02 + .008,
    hue: Math.random() < .7 ? 20 : 45,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;
    flies.forEach(f => {
      f.x += f.dx + Math.sin(frame * f.speed + f.phase) * .4;
      f.y += f.dy + Math.cos(frame * f.speed * .7 + f.phase) * .35;
      if (f.x < -10) f.x = canvas.width + 10;
      if (f.x > canvas.width + 10) f.x = -10;
      if (f.y < -10) f.y = canvas.height + 10;
      if (f.y > canvas.height + 10) f.y = -10;
      const glow = (Math.sin(frame * f.speed * 2 + f.phase) + 1) / 2;
      const alpha = .15 + glow * .65;
      const radius = f.r * (1 + glow * .8);
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius * 4);
      grad.addColorStop(0, `hsla(${f.hue}, 100%, 70%, ${alpha})`);
      grad.addColorStop(.4, `hsla(${f.hue}, 90%, 50%, ${alpha * .5})`);
      grad.addColorStop(1, `hsla(${f.hue}, 80%, 30%, 0)`);
      ctx.beginPath(); ctx.arc(f.x, f.y, radius * 4, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${f.hue + 20}, 100%, 90%, ${alpha})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();