document.addEventListener('DOMContentLoaded', () => {
    // Obtener el contenedor donde irán las tarjetas de servicio.
    const serviciosContainer = document.querySelector('.services-container');
    if (!serviciosContainer) return; // salir si la página no tiene el contenedor

    // Intentamos primero la API real en el puerto 4000 y si falla usamos el mock en 3000 o el JSON local.
    const apiUrl = 'http://localhost:4000/servicios';
    const fallbackApiUrl = 'http://localhost:3000/servicios';
    const localUrl = 'data/servicios.json';

    function renderServicios(servicios) {
        // limpiar antes de renderizar para evitar duplicados
        serviciosContainer.innerHTML = '';
        servicios.forEach(servicio => {
            // Creamos un enlace <a> que envuelve la tarjeta.
            const cardLink = document.createElement('a');
            cardLink.href = `detalle-servicio.html?id=${servicio.id}`; // Pasamos el ID del servicio en la URL.
            cardLink.className = 'service-card-link';

            const card = document.createElement('div');
            card.className = 'service-card';

            card.innerHTML = `
                <img src="${servicio.imagen}" alt="Imagen de ${servicio.nombre}">
                <h3>${servicio.nombre}</h3>
                <p>Precio: ${servicio.precio}</p>
            `;

            // Crear botón Agregar al carrito
            const buyBtn = document.createElement('button');
            buyBtn.type = 'button';
            buyBtn.className = 'buy-button';
            buyBtn.textContent = 'Agregar al carrito';
            buyBtn.dataset.id = servicio.id;

            buyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert('Debes iniciar sesión para agregar al carrito. Serás redirigido al login.');
                    window.location.href = 'login.html';
                    return;
                }
                // Obtener carrito actual
                const cartRaw = localStorage.getItem('cart');
                const cart = cartRaw ? JSON.parse(cartRaw) : [];
                // comparar ids como strings para evitar mismatch de tipos
                const existing = cart.find(i => String(i.id) === String(servicio.id));
                if (existing) {
                    existing.quantity = (existing.quantity || 1) + 1;
                } else {
                    cart.push({ id: servicio.id, nombre: servicio.nombre, precio: servicio.precio, quantity: 1 });
                }
                // Preferir saveLocalCart (sincroniza al servidor) si existe
                if (typeof window.saveLocalCart === 'function') {
                    window.saveLocalCart(cart);
                } else {
                    localStorage.setItem('cart', JSON.stringify(cart));
                }
                // actualizar UI si las funciones están disponibles
                if (typeof window.renderCart === 'function') window.renderCart();
                if (typeof window.updateSessionUI === 'function') window.updateSessionUI();
                alert('Servicio agregado al carrito');
            });

            card.appendChild(buyBtn);

            cardLink.appendChild(card);
            serviciosContainer.appendChild(cardLink);
        });
    }

    // Intentar API principal (4000), si falla intentar mock (3000), si falla usar JSON local
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('API no disponible');
            return response.json();
        })
        .then(data => {
            const servicios = Array.isArray(data) ? data : data.servicios;
            renderServicios(servicios);
        })
        .catch(() => {
            return fetch(fallbackApiUrl).then(r => {
                if (!r.ok) throw new Error('Mock no disponible');
                return r.json();
            }).then(data => {
                const servicios = Array.isArray(data) ? data : data.servicios;
                renderServicios(servicios);
            }).catch(() => {
                // Fallback al archivo local
                fetch(localUrl)
                    .then(resp => resp.json())
                    .then(localData => {
                        const servicios = localData.servicios || [];
                        renderServicios(servicios);
                    })
                    .catch(error => {
                        console.error('Error al cargar los datos locales:', error);
                        serviciosContainer.innerHTML = '<p>Lo sentimos, no pudimos cargar los servicios.</p>';
                    });
            });
        });
});