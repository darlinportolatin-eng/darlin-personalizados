/* Solicitud de pedidos - Darlin Personalizados.
   El cliente llena el formulario, se guarda en la base de datos (D1)
   como "pendiente" y recibe un código de compra + botón de WhatsApp. */
(function () {
    'use strict';

    var TELEFONO = '18492151857';
    var PEDIDOS_URL = 'https://darlin-bot.darlinportolatin.workers.dev';

    var modal = document.getElementById('modal-pedido');
    var formulario = document.getElementById('form-pedido');
    if (!modal || !formulario) {
        return;
    }

    var exito = document.getElementById('pedido-exito');
    var error = document.getElementById('pedido-error');
    var botonEnviar = document.getElementById('pedido-enviar');
    var codigoEl = document.getElementById('pedido-codigo');
    var waEl = document.getElementById('pedido-wa');

    var campos = {
        nombre: document.getElementById('p-nombre'),
        edad: document.getElementById('p-edad'),
        sexo: document.getElementById('p-sexo'),
        telefono: document.getElementById('p-telefono'),
        producto: document.getElementById('p-producto'),
        precio: document.getElementById('p-precio'),
        notas: document.getElementById('p-notas')
    };

    function mostrarError(texto) {
        if (!error) return;
        error.textContent = texto;
        error.classList.remove('d-none');
    }

    function ocultarError() {
        if (error) error.classList.add('d-none');
    }

    function rellenarProducto(datos) {
        if (datos.producto && campos.producto) campos.producto.value = datos.producto;
        if (datos.precio && campos.precio) campos.precio.value = datos.precio;
    }

    // Si el botón que abre el modal trae producto/precio, se rellenan solos.
    modal.addEventListener('show.bs.modal', function (evento) {
        var disparador = evento.relatedTarget;
        ocultarError();
        if (disparador && disparador.dataset) {
            rellenarProducto(disparador.dataset);
        }
    });

    // Al cerrar, el modal vuelve a mostrar el formulario.
    modal.addEventListener('hidden.bs.modal', function () {
        formulario.classList.remove('d-none');
        exito.classList.add('d-none');
        botonEnviar.disabled = false;
        ocultarError();
    });

    function textoWhatsApp(datos, codigo) {
        var lineas = [
            'Hola Darlin, quiero confirmar mi pedido.',
            '',
            'Código: ' + codigo,
            'Nombre: ' + datos.nombre
        ];
        if (datos.edad) lineas.push('Edad: ' + datos.edad);
        if (datos.sexo) lineas.push('Sexo: ' + datos.sexo);
        lineas.push('Teléfono: ' + datos.telefono);
        lineas.push('Producto: ' + datos.producto);
        if (datos.precio) lineas.push('Precio: USD$' + datos.precio);
        if (datos.notas) lineas.push('Detalles: ' + datos.notas);
        lineas.push('', '(Estado: pendiente de confirmación)');
        return lineas.join('\n');
    }

    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();
        ocultarError();

        var datos = {
            nombre: campos.nombre.value.trim(),
            edad: campos.edad.value.trim(),
            sexo: campos.sexo.value,
            telefono: campos.telefono.value.trim(),
            producto: campos.producto.value.trim(),
            precio: campos.precio.value.trim(),
            notas: campos.notas.value.trim()
        };

        if (!datos.nombre || !datos.telefono || !datos.producto) {
            mostrarError('Completa tu nombre, teléfono y qué producto quieres.');
            return;
        }

        botonEnviar.disabled = true;
        botonEnviar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';

        window.fetch(PEDIDOS_URL + '/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        })
            .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, datos: d }; }); })
            .then(function (resultado) {
                if (!resultado.ok || !resultado.datos.codigo) {
                    throw new Error((resultado.datos && resultado.datos.error) || 'No se pudo registrar el pedido.');
                }
                var codigo = resultado.datos.codigo;
                codigoEl.textContent = codigo;
                waEl.href = 'https://wa.me/' + TELEFONO + '?text=' + encodeURIComponent(textoWhatsApp(datos, codigo));
                formulario.classList.add('d-none');
                exito.classList.remove('d-none');
            })
            .catch(function (err) {
                mostrarError(err.message || 'No se pudo conectar. Revisa tu conexión e intenta de nuevo.');
            })
            .then(function () {
                botonEnviar.disabled = false;
                botonEnviar.innerHTML = '<i class="bi-send me-2"></i>Enviar pedido';
            });
    });
})();
