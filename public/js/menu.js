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

  document.getElementById('modalContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start">
      <div>
        <img src="${p.image}" alt="${p.name}" style="width:100%;border-radius:12px;aspect-ratio:4/3;object-fit:cover" onerror="this.src='https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&fit=crop'">
      </div>
      <div>
        <span class="food-category" style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--red)">${p.category}</span>
        <h2 style="margin:8px 0 12px;font-size:1.5rem">${p.name}</h2>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <span style="color:var(--gold);font-size:1rem">${'★'.repeat(Math.floor(p.rating))}</span>
          <strong>${p.rating}</strong>
          <span style="color:var(--gray-300);font-size:.875rem">(${p.reviews} reviews)</span>
        </div>
        <p style="color:var(--gray-500);font-size:.9rem;line-height:1.7;margin-bottom:20px">${p.description}</p>
        <div style="display:flex;gap:20px;margin-bottom:20px;font-size:.85rem;color:var(--gray-500)">
          <span>⏱ ${p.prepTime || '15 min'}</span>
          <span>🔥 ${p.calories || 'N/A'} cal</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
          <span style="font-size:2rem;font-weight:800;font-family:'Playfair Display',serif">${formatPrice(p.price)}</span>
          ${p.originalPrice ? `<span style="font-size:1rem;color:var(--gray-300);text-decoration:line-through">${formatPrice(p.originalPrice)}</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="display:flex;align-items:center;border:1.5px solid var(--gray-100);border-radius:8px;overflow:hidden">
            <button onclick="this.nextSibling.value=Math.max(1,+this.nextSibling.value-1)" style="width:38px;height:44px;font-size:1.2rem;background:var(--gray-50);border:none;cursor:pointer">−</button>
            <input type="number" value="1" min="1" max="20" id="modalQty" style="width:50px;height:44px;text-align:center;border:none;border-left:1px solid var(--gray-100);border-right:1px solid var(--gray-100);font-size:.95rem;font-weight:600;outline:none">
            <button onclick="this.previousSibling.value=Math.min(20,+this.previousSibling.value+1)" style="width:38px;height:44px;font-size:1.2rem;background:var(--gray-50);border:none;cursor:pointer">+</button>
          </div>
          <button class="btn btn-primary" style="flex:1" onclick="addToCartModal('${p.id}')">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('open');
}

function addToCartModal(id) {
  const qty = parseInt(document.getElementById('modalQty')?.value || 1);
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

  // Card click opens modal
  document.getElementById('menuGrid')?.addEventListener('click', e => {
    const card = e.target.closest('.food-card');
    if (card && !e.target.closest('button')) openProductModal(card.dataset.id);
  });
});
