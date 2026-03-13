/* ===== MFC Food Shop — Admin Panel JS ===== */

// ===== Admin Auth Guard =====
function requireAdmin() {
  if (!Auth.isAdmin()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

// ===== Dashboard =====
async function loadDashboard() {
  if (!requireAdmin()) return;
  try {
    const stats = await API.get('/api/stats');
    setText('statProducts', stats.totalProducts);
    setText('statOrders', stats.totalOrders);
    setText('statUsers', stats.totalUsers);
    setText('statRevenue', '₱' + Number(stats.totalRevenue).toFixed(2));
    setText('statPending', stats.pendingOrders);

    // Recent orders
    const tbody = document.getElementById('recentOrdersBody');
    if (tbody && stats.recentOrders) {
      tbody.innerHTML = stats.recentOrders.map(o => `
        <tr>
          <td><strong>#${o.id}</strong></td>
          <td>${o.customerName}</td>
          <td>${o.items.length} item(s)</td>
          <td><strong>${formatPrice(o.total)}</strong></td>
          <td><span class="status-badge status-${o.status}">${capitalize(o.status)}</span></td>
          <td>${formatDateTime(o.createdAt)}</td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('Dashboard error:', e);
  }
}

// ===== Products Admin =====
let adminProducts = [];

async function loadAdminProducts() {
  if (!requireAdmin()) return;
  try {
    adminProducts = await API.get('/api/products');
    renderAdminProducts(adminProducts);
  } catch { Toast.error('Failed to load products'); }
}

function renderAdminProducts(products) {
  const tbody = document.getElementById('productsBody');
  if (!tbody) return;
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-300)">No products found</td></tr>`;
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div class="product-thumb">
          <img src="${p.image}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1546793665-c74683f339c1?w=100&fit=crop'" class="table-img">
          <div class="product-thumb-info">
            <div class="name">${p.name}</div>
            <div class="cat">${p.category}</div>
          </div>
        </div>
      </td>
      <td><strong>${formatPrice(p.price)}</strong></td>
      <td><span style="color:var(--gold)">★</span> ${p.rating}</td>
      <td>${p.reviews}</td>
      <td>
        <label class="toggle">
          <input type="checkbox" class="toggle-input" ${p.available ? 'checked' : ''} onchange="toggleProduct('${p.id}', this.checked)">
          <span class="toggle-track"></span>
        </label>
      </td>
      <td>${p.featured ? '<span style="color:var(--green)">✓</span>' : '−'}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" onclick="editProduct('${p.id}')" title="Edit">✏️</button>
          <button class="action-btn delete" onclick="deleteProduct('${p.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function toggleProduct(id, available) {
  await API.put(`/api/products/${id}`, { available });
  Toast.success(`Product ${available ? 'enabled' : 'disabled'}`);
}

function searchProducts(q) {
  const filtered = adminProducts.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.category.toLowerCase().includes(q.toLowerCase())
  );
  renderAdminProducts(filtered);
}

// Product Form Modal
function openAddProduct() {
  document.getElementById('productFormTitle').textContent = 'Add New Product';
  document.getElementById('productForm').reset();
  document.getElementById('editProductId').value = '';
  document.getElementById('productModal').classList.add('open');
}

function editProduct(id) {
  const p = adminProducts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('productFormTitle').textContent = 'Edit Product';
  document.getElementById('editProductId').value = p.id;
  setVal('pName', p.name);
  setVal('pCategory', p.category);
  setVal('pPrice', p.price);
  setVal('pOriginalPrice', p.originalPrice || '');
  setVal('pImage', p.image);
  setVal('pDescription', p.description);
  setVal('pCalories', p.calories || '');
  setVal('pPrepTime', p.prepTime || '');
  document.getElementById('pFeatured').checked = p.featured;
  document.getElementById('pAvailable').checked = p.available;
  document.getElementById('productModal').classList.add('open');
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('editProductId').value;
  const data = {
    name: getVal('pName'),
    category: getVal('pCategory'),
    price: parseFloat(getVal('pPrice')),
    originalPrice: getVal('pOriginalPrice') ? parseFloat(getVal('pOriginalPrice')) : null,
    image: getVal('pImage'),
    description: getVal('pDescription'),
    calories: getVal('pCalories'),
    prepTime: getVal('pPrepTime'),
    featured: document.getElementById('pFeatured').checked,
    available: document.getElementById('pAvailable').checked,
    tags: [],
    rating: 4.5,
    reviews: 0
  };

  try {
    if (id) await API.put(`/api/products/${id}`, data);
    else await API.post('/api/products', data);
    Toast.success(id ? 'Product updated!' : 'Product created!');
    closeProductModal();
    loadAdminProducts();
  } catch { Toast.error('Failed to save product'); }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await API.delete(`/api/products/${id}`);
    Toast.success('Product deleted');
    loadAdminProducts();
  } catch { Toast.error('Failed to delete product'); }
}

function closeProductModal() {
  document.getElementById('productModal')?.classList.remove('open');
}

// ===== Orders Admin =====
let adminOrders = [];

async function loadAdminOrders() {
  if (!requireAdmin()) return;
  try {
    adminOrders = await API.get('/api/orders');
    renderAdminOrders(adminOrders);
  } catch { Toast.error('Failed to load orders'); }
}

function renderAdminOrders(orders) {
  const tbody = document.getElementById('ordersBody');
  if (!tbody) return;
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-300)">No orders found</td></tr>`;
    return;
  }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>
        <div style="font-weight:600">${o.customerName}</div>
        <div style="font-size:.78rem;color:var(--gray-500)">${o.customerEmail}</div>
      </td>
      <td>${o.items.length} item(s)</td>
      <td><strong>${formatPrice(o.total)}</strong></td>
      <td>
        <select onchange="updateOrderStatus('${o.id}', this.value)" style="border:1px solid var(--gray-100);border-radius:6px;padding:4px 8px;font-size:.8rem;background:white;cursor:pointer">
          ${['pending','confirmed','preparing','ready','delivered','cancelled'].map(s =>
            `<option value="${s}" ${o.status === s ? 'selected' : ''}>${capitalize(s)}</option>`
          ).join('')}
        </select>
      </td>
      <td style="font-size:.82rem">${formatDateTime(o.createdAt)}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn view" onclick="viewOrder('${o.id}')" title="View">👁️</button>
          <button class="action-btn delete" onclick="deleteOrder('${o.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function updateOrderStatus(id, status) {
  try {
    await API.put(`/api/orders/${id}`, { status });
    Toast.success('Order status updated');
  } catch { Toast.error('Failed to update status'); }
}

async function deleteOrder(id) {
  if (!confirm('Delete this order?')) return;
  try {
    await API.delete(`/api/orders/${id}`);
    Toast.success('Order deleted');
    loadAdminOrders();
  } catch { Toast.error('Failed to delete order'); }
}

function viewOrder(id) {
  const o = adminOrders.find(x => x.id === id);
  if (!o) return;
  const modal = document.getElementById('orderDetailModal');
  const content = document.getElementById('orderDetailContent');
  if (!content) return;

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div><strong>Order ID:</strong> #${o.id}</div>
      <div><strong>Date:</strong> ${formatDateTime(o.createdAt)}</div>
      <div><strong>Customer:</strong> ${o.customerName}</div>
      <div><strong>Email:</strong> ${o.customerEmail}</div>
      <div><strong>Phone:</strong> ${o.customerPhone || '—'}</div>
      <div><strong>Payment:</strong> ${capitalize(o.paymentMethod || 'card')}</div>
    </div>
    <div style="margin-bottom:16px"><strong>Address:</strong> ${o.address}${o.city ? ', ' + o.city : ''}</div>
    <table style="width:100%;border-collapse:collapse;font-size:.875rem;margin-bottom:16px">
      <thead><tr style="background:var(--gray-50)"><th style="padding:10px;text-align:left">Item</th><th style="padding:10px;text-align:center">Qty</th><th style="padding:10px;text-align:right">Price</th></tr></thead>
      <tbody>${o.items.map(i => `<tr><td style="padding:10px;border-top:1px solid var(--gray-100)">${i.name}</td><td style="padding:10px;border-top:1px solid var(--gray-100);text-align:center">×${i.quantity}</td><td style="padding:10px;border-top:1px solid var(--gray-100);text-align:right">${formatPrice(i.price * i.quantity)}</td></tr>`).join('')}</tbody>
    </table>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:.875rem;max-width:240px;margin-left:auto">
      <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${formatPrice(o.subtotal)}</span></div>
      <div style="display:flex;justify-content:space-between"><span>Tax</span><span>${formatPrice(o.tax)}</span></div>
      <div style="display:flex;justify-content:space-between"><span>Delivery</span><span>${formatPrice(o.deliveryFee)}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1rem;padding-top:8px;border-top:1px solid var(--gray-100)"><span>Total</span><span>${formatPrice(o.total)}</span></div>
    </div>
    ${o.notes ? `<div style="margin-top:16px;padding:12px;background:var(--gray-50);border-radius:8px;font-size:.875rem"><strong>Notes:</strong> ${o.notes}</div>` : ''}
  `;
  modal?.classList.add('open');
}

// ===== Users Admin =====
async function loadAdminUsers() {
  if (!requireAdmin()) return;
  try {
    const users = await API.get('/api/users');
    const tbody = document.getElementById('usersBody');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone || '—'}</td>
        <td><span class="status-badge ${u.role === 'admin' ? 'status-confirmed' : 'status-delivered'}">${capitalize(u.role)}</span></td>
        <td>${formatDate(u.createdAt)}</td>
        <td>
          <button class="action-btn delete" onclick="deleteUser('${u.id}')" title="Delete" ${u.role === 'admin' ? 'disabled style="opacity:.4"' : ''}>🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch { Toast.error('Failed to load users'); }
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  try {
    await API.delete(`/api/users/${id}`);
    Toast.success('User deleted');
    loadAdminUsers();
  } catch { Toast.error('Failed to delete user'); }
}

// ===== Categories Admin =====
async function loadAdminCategories() {
  if (!requireAdmin()) return;
  try {
    const cats = await API.get('/api/categories');
    const tbody = document.getElementById('categoriesBody');
    if (!tbody) return;
    tbody.innerHTML = cats.map(c => `
      <tr>
        <td>${c.icon || '🍽️'}</td>
        <td><strong>${c.name}</strong></td>
        <td>${c.count || 0}</td>
        <td>
          <button class="action-btn delete" onclick="deleteCategory('${c.id}')" title="Delete" ${c.id === 'all' ? 'disabled style="opacity:.4"' : ''}>🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch { Toast.error('Failed to load categories'); }
}

async function addCategory() {
  const name = prompt('Category name:');
  const icon = prompt('Emoji icon:', '🍽️');
  if (!name) return;
  try {
    await API.post('/api/categories', { name, icon: icon || '🍽️' });
    Toast.success('Category added');
    loadAdminCategories();
  } catch { Toast.error('Failed to add category'); }
}

async function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;
  try {
    await API.delete(`/api/categories/${id}`);
    Toast.success('Category deleted');
    loadAdminCategories();
  } catch { Toast.error('Failed to delete category'); }
}

// ===== Offers Admin =====
async function loadAdminOffers() {
  if (!requireAdmin()) return;
  try {
    const offers = await API.get('/api/offers');
    const tbody = document.getElementById('offersBody');
    if (!tbody) return;
    tbody.innerHTML = offers.map(o => `
      <tr>
        <td><strong>${o.title}</strong></td>
        <td><code style="background:var(--gray-50);padding:2px 8px;border-radius:4px;font-size:.85rem">${o.code}</code></td>
        <td>${o.type === 'percentage' ? o.discount + '%' : o.type === 'fixed' ? formatPrice(o.discount) : 'Free Delivery'}</td>
        <td>
          <label class="toggle">
            <input type="checkbox" class="toggle-input" ${o.active ? 'checked' : ''} onchange="toggleOffer('${o.id}', this.checked)">
            <span class="toggle-track"></span>
          </label>
        </td>
        <td>${formatDate(o.expiresAt)}</td>
      </tr>
    `).join('');
  } catch { Toast.error('Failed to load offers'); }
}

async function toggleOffer(id, active) {
  await API.put(`/api/offers/${id}`, { active });
  Toast.success(`Offer ${active ? 'activated' : 'deactivated'}`);
}

// ===== Helpers =====
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val || ''; }
function getVal(id) { return document.getElementById(id)?.value || ''; }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

// ===== Admin Logout =====
function adminLogout() {
  Auth.logout();
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAdmin()) return;

  const adminUser = Auth.getUser();
  const adminName = document.getElementById('adminUserName');
  if (adminName && adminUser) adminName.textContent = adminUser.name;

  // Determine page
  const page = document.body.dataset.page;
  if (page === 'dashboard') loadDashboard();
  else if (page === 'products') loadAdminProducts();
  else if (page === 'orders') loadAdminOrders();
  else if (page === 'users') loadAdminUsers();
  else if (page === 'categories') loadAdminCategories();
  else if (page === 'offers') loadAdminOffers();

  // Product form
  document.getElementById('productForm')?.addEventListener('submit', saveProduct);

  // Search
  document.getElementById('adminSearchInput')?.addEventListener('input', e => {
    if (page === 'products') searchProducts(e.target.value);
  });

  // Modal close on overlay click
  $$('.modal-overlay').forEach(mo => {
    mo.addEventListener('click', e => { if (e.target === mo) mo.classList.remove('open'); });
  });
});