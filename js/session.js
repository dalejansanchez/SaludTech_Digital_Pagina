function updateSessionUI() {
  const token = localStorage.getItem('authToken');
  const nav = document.querySelector('.nav-links');
  if (!nav) return;
  // Mostrar estado en la barra de navegación
  let sessionLi = document.querySelector('#session-li');
  if (!sessionLi) {
    sessionLi = document.createElement('li');
    sessionLi.id = 'session-li';
    nav.appendChild(sessionLi);
  }
  // Eliminar cualquier enlace de carrito existente
  const existingCart = document.querySelector('#cart-link-li');
  if (existingCart) existingCart.remove();

  if (token) {
    // Add cart link
    const cartLi = document.createElement('li');
    cartLi.id = 'cart-link-li';
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((s, i) => s + (i.quantity || 0), 0);
    cartLi.innerHTML = `<a href="servicios.html">Carrito (${count})</a>`;
    nav.insertBefore(cartLi, sessionLi);

    sessionLi.innerHTML = '<a href="#" id="logout-link">Cerrar sesión</a>';
    document.getElementById('logout-link').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('authToken');
      alert('Sesión cerrada');
      updateSessionUI();
      // reload to reflect state across pages
      window.location.href = 'index.html';
    });
  } else {
    sessionLi.innerHTML = '<a href="login.html">Iniciar sesión</a>';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  updateSessionUI();
  // If we are on login page and already have token, redirect to servicios
  if (window.location.pathname.endsWith('login.html') && localStorage.getItem('authToken')) {
    window.location.href = 'servicios.html';
  }
});
