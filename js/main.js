// Obtener el contenedor donde irán las tarjetas de servicio.
const serviciosContainer = document.querySelector('.services-container');

// URL de tu archivo JSON con los datos.
const url = 'data/servicios.json';

// Usamos fetch para obtener los datos.
fetch(url)
    .then(response => response.json())
    .then(data => {
        data.servicios.forEach(servicio => {
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

            cardLink.appendChild(card);
            serviciosContainer.appendChild(cardLink);
        });
    })
    .catch(error => {
        console.error('Error al cargar los datos:', error);
        serviciosContainer.innerHTML = '<p>Lo sentimos, no pudimos cargar los servicios.</p>';
    });