// Este código carga el detalle de un solo servicio.

// Apuntar al contenedor interno para no sobrescribir el elemento del carrito al renderizar
const serviceDetailContent = document.getElementById('service-detail-inner');
const urlParams = new URLSearchParams(window.location.search);
const serviceId = urlParams.get('id');

const url = 'data/servicios.json';

if (serviceId) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const servicio = data.servicios.find(s => s.id == serviceId);

            if (servicio) {
                const promotionTag = servicio.promocion ? '<span class="promotion">En promoción</span>' : '';
                const availabilityText = `Disponible: ${servicio.cantidad} unidades`;

                serviceDetailContent.innerHTML = `
                    <div class="service-detail-container">
                        <div class="service-detail-image">
                            <img src="${servicio.imagen}" alt="Imagen de ${servicio.nombre}">
                        </div>
                        <div class="service-detail-info">
                            <h2>${servicio.nombre}</h2>
                            <p class="price">Precio: ${servicio.precio}</p>
                            <p class="availability">${availabilityText}</p>
                            ${promotionTag}
                            <p>${servicio.descripcion}</p>
                            <a href="#" class="cta-button">Solicitar servicio</a>
                        </div>
                    </div>
                `;
                // Al cargar el detalle, agregamos el servicio al carrito (cantidad 1)
                try {
                    const cartRaw = localStorage.getItem('cart');
                    const cart = cartRaw ? JSON.parse(cartRaw) : [];
                    const exists = cart.find(i => String(i.id) === String(servicio.id));
                    if (!exists) {
                        cart.push({ id: servicio.id, nombre: servicio.nombre, precio: servicio.precio, quantity: 1 });
                        // usar saveLocalCart si existe (sincroniza con servidor)
                        if (typeof window.saveLocalCart === 'function') {
                            window.saveLocalCart(cart);
                        } else {
                            localStorage.setItem('cart', JSON.stringify(cart));
                            // si estamos autenticados, intentamos sincronizar directamente
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
                        // actualizar UI y abrir panel si es desktop
                        if (window.innerWidth > 900 && window.toggleCart) window.toggleCart();
                        if (typeof window.renderCart === 'function') window.renderCart();
                        if (typeof window.updateSessionUI === 'function') window.updateSessionUI();
                    }
                } catch (err) {
                    console.warn('Error al añadir al carrito desde detalle', err);
                }
                // Añadir un manejador de click al botón 'Solicitar servicio' para añadir al carrito bajo demanda
                setTimeout(() => {
                    const cta = document.querySelector('.service-detail-info .cta-button');
                    if (cta) {
                        cta.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            try {
                                const cartRaw = localStorage.getItem('cart');
                                const cart = cartRaw ? JSON.parse(cartRaw) : [];
                                const exists = cart.find(i => String(i.id) === String(servicio.id));
                                if (exists) {
                                    exists.quantity = (exists.quantity || 1) + 1;
                                } else {
                                    cart.push({ id: servicio.id, nombre: servicio.nombre, precio: servicio.precio, quantity: 1 });
                                }
                                if (typeof window.saveLocalCart === 'function') {
                                    window.saveLocalCart(cart);
                                } else {
                                    localStorage.setItem('cart', JSON.stringify(cart));
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
                                if (typeof window.renderCart === 'function') window.renderCart();
                                if (typeof window.updateSessionUI === 'function') window.updateSessionUI();
                                alert('Servicio agregado al carrito');
                            } catch (e) {
                                console.warn('Error al agregar desde detalle:', e);
                            }
                        });
                    }
                }, 50);
            } else {
                serviceDetailContent.innerHTML = '<p>Servicio no encontrado.</p>';
            }
        });
} else {
    serviceDetailContent.innerHTML = '<p>Selecciona un servicio para ver los detalles.</p>';
}