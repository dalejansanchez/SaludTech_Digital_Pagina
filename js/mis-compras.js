const myPurchasesUrl = 'http://localhost:4000/my-purchases';

async function loadPurchases() {
  const container = document.getElementById('purchases-container');
  const token = localStorage.getItem('authToken');
  if (!token) {
    container.innerHTML = '<p>Debes iniciar sesión para ver tus compras. <a href="login.html">Iniciar sesión</a></p>';
    return;
  }
  try {
    const res = await fetch(myPurchasesUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const err = await res.json();
      container.innerHTML = `<p>Error: ${err.error || 'No se pudieron cargar tus compras'}</p>`;
      return;
    }
    const purchases = await res.json();
    if (!purchases || purchases.length === 0) {
      container.innerHTML = '<p>No tienes compras aún.</p>';
      return;
    }
    const list = document.createElement('div');
    purchases.forEach(p => {
      const card = document.createElement('div');
      card.className = 'service-card';
      card.innerHTML = `<h3>Compra ${p.id}</h3>
        <p>Fecha: ${new Date(p.createdAt).toLocaleString()}</p>
        <p>Total: ${p.total}</p>
      `;
      const ul = document.createElement('ul');
      p.items.forEach(it => {
        const li = document.createElement('li');
        li.textContent = `${it.nombre} - ${it.precio} x ${it.qty}`;
        ul.appendChild(li);
      });
      card.appendChild(ul);
      list.appendChild(card);
    });
    container.innerHTML = '';
    container.appendChild(list);
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Error de red al cargar tus compras.</p>';
  }
}

window.addEventListener('DOMContentLoaded', loadPurchases);
