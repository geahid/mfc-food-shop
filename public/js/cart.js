/* ===== MFC Food Shop — Cart Page JS ===== */

function renderCartPage() {
  const items = Cart.get();
  const container = document.getElementById('cartPageItems');
  const emptyState = document.getElementById('cartEmpty');
  const cartContent = document.getElementById('cartContent');
  if (!container) return;

  if (items.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (cartContent) cartContent.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (cartContent) cartContent.style.display = 'grid';

  container.innerHTML = items.map(item => `
    <div class="cart-page-item" style="display:flex;gap:20px;padding:20px;border-bottom:1px solid var(--gray-100);align-items:center">
      <img src="${item.image}" alt="${item.name}" style="width:90px;height:80px;border-radius:12px;object-fit:cover;flex-shrink:0" onerror="this.src='https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&fit=crop'">
      <div style="flex:1">
        <div style="font-weight:600;font-size:1rem;margin-bottom:4px">${item.name}</div>
        <div style="color:var(--gray-500);font-size:.85rem;text-transform:capitalize">${item.category || ''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <button class="qty-btn" onclick="updateCartItem('${item.id}', ${item.quantity - 1})">−</button>
        <span style="font-weight:600;min-width:24px;text-align:center">${item.quantity}</span>
        <button class="qty-btn" onclick="updateCartItem('${item.id}', ${item.quantity + 1})">+</button>
      </div>
      <div style="font-weight:700;font-size:1rem;min-width:80px;text-align:right">${formatPrice(item.price * item.quantity)}</div>
      <button onclick="removeCartItem('${item.id}')" style="color:var(--gray-300);font-size:1.1rem;background:none;border:none;cursor:pointer;padding:4px;transition:var(--transition)" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--gray-300)'">✕</button>
    </div>
  `).join('');

  updateSummary();
}

function updateCartItem(id, qty) {
  Cart.updateQty(id, qty);
  renderCartPage();
}

function removeCartItem(id) {
  Cart.remove(id);
  renderCartPage();
  Toast.info('Item removed from cart');
}

function updateSummary() {
  const items = Cart.get();
  const subtotal = Cart.subtotal();
  const tax = subtotal * 0.09;
  const delivery = subtotal >= 30 ? 0 : 2.99;

  // Coupon
  const couponCode = (document.getElementById('couponInput')?.value || '').toUpperCase().trim();
  let discount = 0;
  if (couponCode === 'WELCOME5') discount = 5;
  else if (couponCode === 'WEEKEND20') discount = subtotal * 0.2;

  const total = Math.max(0, subtotal - discount + tax + delivery);

  const el = id => document.getElementById(id);
  if (el('summarySubtotal')) el('summarySubtotal').textContent = formatPrice(subtotal);
  if (el('summaryTax')) el('summaryTax').textContent = formatPrice(tax);
  if (el('summaryDelivery')) el('summaryDelivery').innerHTML = delivery === 0 ? '<span style="color:var(--green)">Free</span>' : formatPrice(delivery);
  if (el('summaryDiscount')) {
    const row = el('discountRow');
    if (discount > 0) { el('summaryDiscount').textContent = `-${formatPrice(discount)}`; if (row) row.style.display = 'flex'; }
    else { if (row) row.style.display = 'none'; }
  }
  if (el('summaryTotal')) el('summaryTotal').textContent = formatPrice(total);
  if (el('summaryItems')) el('summaryItems').textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
}

function applyCoupon() {
  updateSummary();
  const code = document.getElementById('couponInput')?.value?.toUpperCase().trim();
  const validCodes = ['WELCOME5', 'WEEKEND20', 'FREEDEL'];
  if (validCodes.includes(code)) Toast.success('Coupon applied!');
  else Toast.error('Invalid coupon code');
}

document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();
  document.getElementById('applyCouponBtn')?.addEventListener('click', applyCoupon);
  document.getElementById('clearCartBtn')?.addEventListener('click', () => {
    if (confirm('Clear your entire cart?')) { Cart.clear(); renderCartPage(); }
  });
  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (Cart.count() === 0) { Toast.error('Your cart is empty!'); return; }
    window.location.href = '/checkout';
  });
});
