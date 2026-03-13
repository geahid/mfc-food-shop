/* ===== MFC Food Shop — Menu Page JS ===== */

let allProducts = [];
let activeCategory = 'all';
let activeSort = 'default';
let searchQuery = '';

async function loadMenu() {
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    allProducts = await API.get('/api/products');
    await loadCategories();
    renderProducts();
  } catch (err) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><h3>Failed to load menu</h3><p>Please refresh the page.</p></div>';
  }
}

async function loadCategories() {
  const container = document.getElementById('categoriesScroll');
  if (!container) return;
  try {
    const cats = await API.get('/api/categories');
    container.innerHTML = cats.map(c => `
      <button class="cat-pill ${c.id === 'all' ? 'active' : ''}" data-id="${c.id}" onclick="filterByCategory('${c.id}')">
        <span class="icon">${c.icon}</span> ${c.name}
      </button>
    `).join('');
  } catch {}
}

function filterByCategory(catId) {
  activeCategory = catId;
  $$('.cat-pill').forEach(p => p.classList.toggle('active', p.dataset.id === catId));
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('menuGrid');
  let products = [...allProducts];

  if (activeCategory !== 'all') products = products.filter(p => p.category === activeCategory);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }
  if (activeSort === 'price_asc') products.sort((a, b) => a.price - b.price);
  else if (activeSort === 'price_desc') products.sort((a, b) => b.price - a.price);
  else if (activeSort === 'rating') products.sort((a, b) => b.rating - a.rating);

  const countEl = document.getElementById('resultCount');
  if (countEl) countEl.textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;

  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">🔍</div><h3>No items found</h3><p>Try a different search or category.</p></div>`;
    return;
  }

  grid.innerHTML = products.map(p => renderFoodCard(p)).join('');
}

function renderFoodCard(p) {
  const isFav = Favorites.has(p.id);
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : null;
  const badge = p.tags?.includes('new') ? `<span class="food-badge badge-new">New</span>` :
    p.tags?.includes('bestseller') ? `<span class="food-badge badge-popular">Popular</span>` :
    discount ? `<span class="food-badge badge-sale">-${discount}%</span>` : '';

  return `
    <div class="food-card" data-id="${p.id}">
      <div class="food-card-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&fit=crop'">
        ${badge}
        <button class="food-fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(event,'${p.id}')" title="Add to favorites">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="food-card-body">
        <div class="food-meta">
          <span class="food-category">${p.category}</span>
          <span class="food-rating"><span class="star">★</span> ${p.rating} <span class="count">(${p.reviews})</span></span>
        </div>
        <div class="food-card-name">${p.name}</div>
        <div class="food-card-desc">${p.description}</div>
        <div class="food-card-footer">
          <div class="food-price">
            <span class="current">${formatPrice(p.price)}</span>
            ${p.originalPrice ? `<span class="original">${formatPrice(p.originalPrice)}</span>` : ''}
          </div>
          <button class="add-to-cart-btn" onclick="addToCart('${p.id}')">
            <span class="plus">+</span> Add
          </button>
        </div>
      </div>
    </div>
  `;
}

function addToCart(id) {
  const product = allProducts.find(p => p.id === id);
  if (product) Cart.add(product);
}

function toggleFav(e, id) {
  e.stopPropagation();
  const added = Favorites.toggle(id);
  e.currentTarget.innerHTML = added ? '❤️' : '🤍';
  e.currentTarget.classList.toggle('active', added);
  Toast.show(added ? 'Added to favorites!' : 'Removed from favorites', added ? 'success' : 'default', added ? '❤️' : '💔');
}

// Product Detail Modal
function openProductModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;

  const modal = document.getElementById('productModal');
  if (!modal) return;

  const stars = '★'.repeat(Math.floor(p.rating)) + '☆'.repeat(5 - Math.floor(p.rating));
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-product-grid">
      <div class="modal-img-wrap">
        <img src="${p.image}" alt="${p.name}" class="modal-product-img"
          onerror="this.src='https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&fit=crop'">
      </div>
      <div class="modal-product-info">
        <span class="modal-cat-label">${p.category}</span>
        <h2 class="modal-product-name">${p.name}</h2>
        <div class="modal-rating">
          <span class="modal-stars">${stars}</span>
          <strong>${p.rating}</strong>
          <span class="modal-review-count">(${p.reviews} reviews)</span>
        </div>
        <p class="modal-desc">${p.description}</p>
        <div class="modal-meta">
          <span>⏱ ${p.prepTime || '15 min'}</span>
          <span>🔥 ${p.calories || 'N/A'} cal</span>
        </div>
        <div class="modal-price-row">
          <span class="modal-price">${formatPrice(p.price)}</span>
          ${p.originalPrice ? '<span class="modal-orig-price">' + formatPrice(p.originalPrice) + '</span>' : ''}
        </div>
        <div class="modal-actions">
          <div class="qty-control">
            <button class="qty-btn" id="qtyMinus" type="button">−</button>
            <span class="qty-display" id="qtyDisplay">1</span>
            <button class="qty-btn" id="qtyPlus" type="button">+</button>
          </div>
          <button class="btn btn-primary modal-add-btn" onclick="addToCartModal('${p.id}')">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
  // Wire up qty buttons with JS — no sibling traversal
  let _qty = 1;
  const display = document.getElementById('qtyDisplay');
  document.getElementById('qtyMinus').onclick = () => { if (_qty > 1) { _qty--; display.textContent = _qty; } };
  document.getElementById('qtyPlus').onclick  = () => { if (_qty < 20) { _qty++; display.textContent = _qty; } };
  window._modalQty = () => _qty;
  modal.classList.add('open');
}

function addToCartModal(id) {
  const qty = window._modalQty ? window._modalQty() : 1;
  const product = allProducts.find(p => p.id === id);
  if (product) Cart.add(product, qty);
  closeModal();
}

function closeModal() {
  document.getElementById('productModal')?.classList.remove('open');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();

  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => { searchQuery = e.target.value; renderProducts(); });
  }

  // Sort
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => { activeSort = e.target.value; renderProducts(); });
  }

  // Modal close
  const modalOverlay = document.getElementById('productModal');
  if (modalOverlay) modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

  // Card click opens modal — only block on the Add and Fav buttons themselves
  document.getElementById('menuGrid')?.addEventListener('click', e => {
    const card = e.target.closest('.food-card');
    if (!card) return;
    const blocked = e.target.closest('.add-to-cart-btn') || e.target.closest('.food-fav-btn');
    if (!blocked) openProductModal(card.dataset.id);
  });
});