/* ===== MFC Food Shop — Checkout JS ===== */

let selectedPayment = 'card';

document.addEventListener('DOMContentLoaded', () => {
  const items = Cart.get();
  if (items.length === 0) { window.location.href = '/cart'; return; }

  renderOrderSummary();
  prefillUserInfo();
  initPaymentOptions();

  document.getElementById('checkoutForm')?.addEventListener('submit', submitOrder);
});

function renderOrderSummary() {
  const items = Cart.get();
  const container = document.getElementById('summaryItemsList');
  if (container) {
    container.innerHTML = items.map(item => `
      <div class="summary-item">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546793665-c74683f339c1?w=100&fit=crop'">
        <div class="summary-item-info">
          <div class="summary-item-name">${item.name}</div>
          <div class="summary-item-qty">× ${item.quantity}</div>
        </div>
        <div class="summary-item-price">${formatPrice(item.price * item.quantity)}</div>
      </div>
    `).join('');
  }

  updateTotals();
}

function updateTotals(discount = 0) {
  const subtotal = Cart.subtotal();
  const tax = subtotal * 0.09;
  const delivery = subtotal >= 30 ? 0 : 2.99;
  const total = Math.max(0, subtotal - discount + tax + delivery);

  setText('chkSubtotal', formatPrice(subtotal));
  setText('chkTax', formatPrice(tax));
  setText('chkDelivery', delivery === 0 ? 'Free' : formatPrice(delivery));
  setText('chkTotal', formatPrice(total));
  if (discount > 0) {
    const row = document.getElementById('chkDiscountRow');
    if (row) { row.style.display = 'flex'; setText('chkDiscount', `-${formatPrice(discount)}`); }
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function prefillUserInfo() {
  const user = Auth.getUser();
  if (!user) return;
  setVal('chkName', user.name);
  setVal('chkEmail', user.email);
  setVal('chkPhone', user.phone || '');
  setVal('chkAddress', user.address || '');
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function initPaymentOptions() {
  $$('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      selectedPayment = opt.dataset.value;
      $$('.payment-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
    });
  });
}

function applyCoupon() {
  const code = document.getElementById('couponField')?.value?.toUpperCase().trim();
  const subtotal = Cart.subtotal();
  let discount = 0;
  let msg = '';

  if (code === 'WELCOME5') { discount = 5; msg = '$5 discount applied!'; }
  else if (code === 'WEEKEND20') { discount = subtotal * 0.2; msg = '20% discount applied!'; }
  else if (code === 'FREEDEL') { msg = 'Free delivery applied!'; }
  else { Toast.error('Invalid coupon code'); return; }

  updateTotals(discount);
  Toast.success(msg);
}

async function submitOrder(e) {
  e.preventDefault();
  if (!validateForm(e.target)) return;

  const user = Auth.getUser();
  const items = Cart.get();
  const subtotal = Cart.subtotal();
  const tax = subtotal * 0.09;
  const delivery = subtotal >= 30 ? 0 : 2.99;
  const total = subtotal + tax + delivery;

  const order = {
    userId: user?.id || 'guest',
    customerName: document.getElementById('chkName').value,
    customerEmail: document.getElementById('chkEmail').value,
    customerPhone: document.getElementById('chkPhone').value,
    items: items.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
    subtotal: +subtotal.toFixed(2),
    tax: +tax.toFixed(2),
    deliveryFee: delivery,
    total: +total.toFixed(2),
    address: document.getElementById('chkAddress').value,
    city: document.getElementById('chkCity').value,
    paymentMethod: selectedPayment,
    notes: document.getElementById('chkNotes').value || ''
  };

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Placing Order...';

  try {
    const result = await API.post('/api/orders', order);
    if (result.id) {
      Cart.clear();
      localStorage.setItem('mfc_last_order', JSON.stringify(result));
      window.location.href = '/orders?success=1&id=' + result.id;
    } else {
      throw new Error('Failed');
    }
  } catch {
    Toast.error('Failed to place order. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}
