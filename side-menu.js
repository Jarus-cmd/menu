// ---- Element references ----
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuItems = document.querySelectorAll('.menu-item');
const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
const pages = document.querySelectorAll('.page');
const logoutBtn = document.getElementById('logoutBtn');
const logoutPageBtn = document.getElementById('logoutPageBtn');
const cartBadge = document.getElementById('cartBadge');
const cartBadgeMobile = document.getElementById('cartBadgeMobile');
const cartList = document.getElementById('cartList');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartShippingEl = document.getElementById('cartShipping');
const cartTotalEl = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const topbarCartBtn = document.getElementById('topbarCartBtn');
const productSearch = document.getElementById('productSearch');
const productGrid = document.getElementById('productGrid');
const searchEmpty = document.getElementById('searchEmpty');
const ordersList = document.getElementById('ordersList');

const SHIPPING_FEE = 60;

// Cart state kept in memory for this session: { id: { name, price, icon, qty } }
let cart = {};

// Orders state, seeded with sample order history — newest first.
// New checkouts get unshifted to the front with status "pending".
let orders = [
  { number: 'JS-1042', date: 'Aug 2, 2026', status: 'delivered', amount: 899 },
  { number: 'JS-1039', date: 'Jul 22, 2026', status: 'shipped', amount: 1148 },
  { number: 'JS-1031', date: 'Jul 10, 2026', status: 'pending', amount: 499 }
];
let nextOrderNum = 1043;

const STATUS_META = {
  delivered: { label: 'Delivered', icon: 'fa-circle-check' },
  shipped: { label: 'Shipped', icon: 'fa-truck-fast' },
  pending: { label: 'Pending', icon: 'fa-clock' }
};

function renderOrders() {
  if (orders.length === 0) {
    ordersList.innerHTML = '<p class="empty-state"><i class="fa-solid fa-box"></i><br>No orders yet. Your checkouts will show up here.</p>';
    return;
  }

  let html = '';
  orders.forEach(function (order) {
    const meta = STATUS_META[order.status];
    html += '' +
      '<div class="row-item">' +
      '  <div class="row-main">' +
      '    <span class="row-thumb status-icon-' + order.status + '"><i class="fa-solid ' + meta.icon + '"></i></span>' +
      '    <div>' +
      '      <strong>Order #' + order.number + '</strong>' +
      '      <p class="muted">Placed on ' + order.date + '</p>' +
      '    </div>' +
      '  </div>' +
      '  <span class="status status-' + order.status + '">' + meta.label + '</span>' +
      '  <span class="amount">₱' + order.amount.toLocaleString() + '</span>' +
      '</div>';
  });
  ordersList.innerHTML = html;
}

// ---- 1. Open / close the side menu ----
function toggleMenu() {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
  menuToggle.classList.toggle('open');
}
menuToggle.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

// ---- 2. Switch the visible page + active menu indicator (sidebar + bottom nav) ----
function showPage(pageKey) {
  pages.forEach(function (section) {
    section.classList.toggle('active', section.id === 'page-' + pageKey);
  });

  menuItems.forEach(function (item) {
    item.classList.toggle('active', item.dataset.page === pageKey);
  });

  bottomNavItems.forEach(function (item) {
    item.classList.toggle('active', item.dataset.page === pageKey);
  });

  if (window.innerWidth < 900) {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    menuToggle.classList.remove('open');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

menuItems.forEach(function (item) {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    showPage(item.dataset.page);
  });
});

bottomNavItems.forEach(function (item) {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    showPage(item.dataset.page);
  });
});

// "Shop Now" / "See all" links on Home that jump to another page
document.querySelectorAll('[data-goto]').forEach(function (el) {
  el.addEventListener('click', function (e) {
    e.preventDefault();
    showPage(el.dataset.goto);
  });
});

topbarCartBtn.addEventListener('click', function () {
  showPage('cart');
});

// ---- 3. Cart core: add, remove, change quantity ----
function bumpBadge() {
  [cartBadge, cartBadgeMobile].forEach(function (el) {
    el.classList.add('bump');
    setTimeout(function () { el.classList.remove('bump'); }, 150);
  });
}

function totalItemCount() {
  return Object.values(cart).reduce(function (sum, item) { return sum + item.qty; }, 0);
}

function updateBadge() {
  const count = totalItemCount();
  cartBadge.textContent = count;
  cartBadgeMobile.textContent = count;
  bumpBadge();
}

function addToCart(id, name, price, icon, qty) {
  qty = qty || 1;
  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { name: name, price: price, icon: icon || 'fa-bag-shopping', qty: qty };
  }
  updateBadge();
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  updateBadge();
  renderCart();
}

function changeCartQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) {
    delete cart[id];
  }
  updateBadge();
  renderCart();
}

function renderCart() {
  const ids = Object.keys(cart);

  if (ids.length === 0) {
    cartList.innerHTML = '<p class="empty-state"><i class="fa-solid fa-cart-shopping"></i><br>Your cart is empty. Add items from the Products page.</p>';
    cartSubtotalEl.textContent = '₱0';
    cartShippingEl.textContent = '₱0';
    cartTotalEl.textContent = '₱0';
    return;
  }

  let subtotal = 0;
  let html = '';

  ids.forEach(function (id) {
    const item = cart[id];
    const lineTotal = item.price * item.qty;
    subtotal += lineTotal;

    html += '' +
      '<div class="cart-row">' +
      '  <div class="cart-row-thumb"><i class="fa-solid ' + item.icon + '"></i></div>' +
      '  <div class="cart-row-info">' +
      '    <strong>' + item.name + '</strong>' +
      '    <p class="unit-price">₱' + item.price + ' each</p>' +
      '  </div>' +
      '  <div class="cart-row-qty">' +
      '    <button class="qty-btn cart-qty-minus" data-id="' + id + '" type="button">−</button>' +
      '    <span class="qty-value">' + item.qty + '</span>' +
      '    <button class="qty-btn cart-qty-plus" data-id="' + id + '" type="button">+</button>' +
      '  </div>' +
      '  <div class="cart-row-subtotal">₱' + lineTotal + '</div>' +
      '  <button class="remove-btn" data-id="' + id + '" title="Remove item" type="button"><i class="fa-solid fa-trash"></i></button>' +
      '</div>';
  });

  cartList.innerHTML = html;

  const shipping = SHIPPING_FEE;
  cartSubtotalEl.textContent = '₱' + subtotal;
  cartShippingEl.textContent = '₱' + shipping;
  cartTotalEl.textContent = '₱' + (subtotal + shipping);

  cartList.querySelectorAll('.cart-qty-plus').forEach(function (btn) {
    btn.addEventListener('click', function () { changeCartQty(btn.dataset.id, 1); });
  });
  cartList.querySelectorAll('.cart-qty-minus').forEach(function (btn) {
    btn.addEventListener('click', function () { changeCartQty(btn.dataset.id, -1); });
  });
  cartList.querySelectorAll('.remove-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { removeFromCart(btn.dataset.id); });
  });
}

// ---- 4. Quantity steppers on Products page (choose qty before adding) ----
document.querySelectorAll('.qty-stepper').forEach(function (stepper) {
  const valueEl = stepper.querySelector('.qty-value');
  const minusBtn = stepper.querySelector('.qty-minus');
  const plusBtn = stepper.querySelector('.qty-plus');

  minusBtn.addEventListener('click', function () {
    let val = parseInt(valueEl.textContent, 10);
    if (val > 1) valueEl.textContent = val - 1;
  });

  plusBtn.addEventListener('click', function () {
    let val = parseInt(valueEl.textContent, 10);
    if (val < 20) valueEl.textContent = val + 1;
  });
});

// ---- 5. Add to Cart button interaction (Products page) ----
document.querySelectorAll('.add-cart-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const card = btn.closest('.product-card');
    const stepperValue = card ? card.querySelector('.qty-value') : null;
    const qty = stepperValue ? parseInt(stepperValue.textContent, 10) : 1;

    addToCart(btn.dataset.id, btn.dataset.name, Number(btn.dataset.price), btn.dataset.icon, qty);

    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Added';
    setTimeout(function () { btn.innerHTML = original; }, 900);

    if (stepperValue) stepperValue.textContent = '1';
  });
});

// ---- 6. Move to Cart button interaction (Wishlist page) ----
document.querySelectorAll('.move-cart-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    addToCart(btn.dataset.id, btn.dataset.name, Number(btn.dataset.price), btn.dataset.icon, 1);

    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Moved';
    setTimeout(function () { btn.innerHTML = original; }, 900);
  });
});

// ---- 7. Checkout: save the cart as a new Pending order ----
checkoutBtn.addEventListener('click', function () {
  const ids = Object.keys(cart);
  if (ids.length === 0) {
    alert('Your cart is empty. Add a product first.');
    return;
  }

  const subtotal = ids.reduce(function (sum, id) { return sum + cart[id].price * cart[id].qty; }, 0);
  const total = subtotal + SHIPPING_FEE;

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const newOrder = {
    number: 'JS-' + nextOrderNum,
    date: dateLabel,
    status: 'pending',
    amount: total
  };
  nextOrderNum++;

  orders.unshift(newOrder);
  renderOrders();

  alert('Order #' + newOrder.number + ' placed! It now shows as Pending in My Orders.');

  cart = {};
  updateBadge();
  renderCart();
  showPage('orders');
});

// ---- 8. Logout alert (sidebar link + Logout page button) ----
logoutBtn.addEventListener('click', function () {
  showPage('logout');
});

logoutPageBtn.addEventListener('click', function () {
  alert('You have been logged out.');
});

// ---- 9. Dark / light theme switcher ----
themeToggleBtn.addEventListener('click', function () {
  document.body.classList.toggle('light-theme');
});

// ---- 10. Product search / filter ----
productSearch.addEventListener('input', function () {
  const query = productSearch.value.trim().toLowerCase();
  const cards = productGrid.querySelectorAll('.product-card');
  let visibleCount = 0;

  cards.forEach(function (card) {
    const matches = card.dataset.search.indexOf(query) !== -1;
    card.style.display = matches ? '' : 'none';
    if (matches) visibleCount++;
  });

  searchEmpty.style.display = visibleCount === 0 ? 'block' : 'none';
});

// ---- Initial render ----
renderCart();
renderOrders();
