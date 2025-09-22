// Este código carga el detalle de un solo servicio.

const serviceDetailContent = document.querySelector('.service-detail-content');
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
            } else {
                serviceDetailContent.innerHTML = '<p>Servicio no encontrado.</p>';
            }
        });
} else {
    serviceDetailContent.innerHTML = '<p>Selecciona un servicio para ver los detalles.</p>';
}