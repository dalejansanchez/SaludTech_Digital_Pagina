const purchaseUrl = 'http://localhost:4000/purchase';

function formatPriceToNumber(priceStr) {
  return Number(String(priceStr).replace(/[^0-9]/g, '')) || 0;
}

function formatNumberToCOP(num) {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
  } catch (e) {
    return num + ' COP';
  }
}

function renderCart() {
  const cartContainer = document.querySelector('#cart-container');
  if (!cartContainer) return;
  const cartRaw = localStorage.getItem('cart');
  const cart = cartRaw ? JSON.parse(cartRaw) : [];
  cartContainer.innerHTML = '';
  // update counter in nav toggle if present
  const counterEl = document.querySelector('#cart-toggle-count');
  if (counterEl) {
    const count = cart.reduce((s, i) => s + (i.quantity || 0), 0);
    counterEl.textContent = `(${count})`;
  }
  // ensure cart container visibility class
  cartContainer.classList.remove('cart-empty');
  if (cart.length === 0) {
    cartContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
    cartContainer.classList.add('cart-empty');
    return;
  }

  const list = document.createElement('ul');
  let total = 0;
  cart.forEach(item => {
    const li = document.createElement('li');
    const priceNum = formatPriceToNumber(item.precio);
    const line = priceNum * (item.quantity || 1);
    total += line;
    li.innerHTML = `${item.nombre} - ${item.precio} x ${item.quantity} <button class="cart-remove" data-id="${item.id}">Quitar</button>`;
    list.appendChild(li);
  });
  cartContainer.appendChild(list);

  const totalP = document.createElement('p');
  totalP.textContent = `Total: ${formatNumberToCOP(total)}`;
  cartContainer.appendChild(totalP);
  const checkoutBtn = document.createElement('button');
  checkoutBtn.textContent = 'Pagar';
  checkoutBtn.setAttribute('aria-label', 'Pagar carrito');
  checkoutBtn.disabled = false;
  checkoutBtn.addEventListener('click', async () => {
    if (checkoutBtn.disabled) return;
    checkoutBtn.disabled = true; // prevenir doble envío
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Debes iniciar sesión para pagar');
      window.location.href = 'login.html';
      return;
    }

    // preparar items para envío (id y quantity)
    const items = cart.map(i => ({ id: i.id, quantity: i.quantity }));
    try {
      const res = await fetch(purchaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al procesar pago');
        checkoutBtn.disabled = false;
        return;
      }
      alert('Compra realizada. ID: ' + (data.purchase && data.purchase.id ? data.purchase.id : 'n/a'));
      // limpiar carrito local y servidor
      localStorage.removeItem('cart');
      try {
        await fetch('http://localhost:4000/cart', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items: [] })
        });
      } catch (err) {
        console.warn('No se pudo limpiar carrito en servidor', err);
      }
      renderCart();
    } catch (err) {
      console.error('Error en checkout:', err);
      alert('Error de red al pagar');
      checkoutBtn.disabled = false;
    }
  });
  cartContainer.appendChild(checkoutBtn);

  // manejo de quitar
  cartContainer.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      const cartRaw = localStorage.getItem('cart');
      const cart = cartRaw ? JSON.parse(cartRaw) : [];
      const newCart = cart.filter(i => String(i.id) !== String(id));
      saveLocalCart(newCart);
      renderCart();
    });
  });
}

// Re-render on load
window.addEventListener('DOMContentLoaded', () => {
  // if user logged in, try to load cart from server and replace local cart
  const token = localStorage.getItem('authToken');
  if (token) {
    fetch('http://localhost:4000/cart', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(serverCart => {
      if (Array.isArray(serverCart)) {
        localStorage.setItem('cart', JSON.stringify(serverCart));
      }
    }).catch(err => console.warn('No se pudo cargar carrito desde servidor', err)).finally(() => renderCart());
  } else {
    renderCart();
  }
  // attach toggle button behaviour
  const toggleBtn = document.getElementById('cart-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      toggleCart();
    });
  }
});

function saveLocalCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  // if user is logged in, sync to server
  const token = localStorage.getItem('authToken');
  if (token) {
    fetch('http://localhost:4000/cart', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items: cart })
    }).catch(err => console.warn('No se pudo sincronizar carrito al servidor', err));
  }
}

function toggleCart() {
  const cartContainer = document.querySelector('#cart-container');
  const toggleBtn = document.getElementById('cart-toggle-btn');
  if (!cartContainer) return;
  const isOpen = cartContainer.classList.toggle('cart-visible');
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  }
  // ensure render updates counter when opening
  renderCart();
}

// Exportar para otros módulos (global opcional)
window.toggleCart = toggleCart;

// Ensure core helpers are available globally for other scripts
window.saveLocalCart = typeof window.saveLocalCart === 'function' ? window.saveLocalCart : saveLocalCart;
window.renderCart = typeof window.renderCart === 'function' ? window.renderCart : renderCart;

// Mejorar el comportamiento del toggle: también desplazar el carrito a la vista cuando se abra
const _origToggle = toggleCart;
window.toggleCart = function () {
  _origToggle();
  const cartContainer = document.querySelector('#cart-container');
  if (!cartContainer) return;
  // If cart is visible, ensure it's scrolled into view
  if (cartContainer.classList.contains('cart-visible') || window.innerWidth > 900) {
    cartContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
