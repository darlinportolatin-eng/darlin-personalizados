/* Solicitud de pedidos - Estampado Darlin. */
(function () {
    'use strict';

    var PEDIDOS_URL = 'https://darlin-bot.darlinportolatin.workers.dev';
    var TIEMPO_LIMITE_MS = 20000;

    var modal = document.getElementById('modal-pedido');
    var formulario = document.getElementById('form-pedido');
    if (!modal || !formulario) return;

    var exito = document.getElementById('pedido-exito');
    var error = document.getElementById('pedido-error');
    var botonEnviar = document.getElementById('pedido-enviar');
    var codigoEl = document.getElementById('pedido-codigo');
    var botonCancelar = document.getElementById('pedido-cancelar');
    var accionesEl = document.getElementById('pedido-acciones');
    var enviandoEl = document.getElementById('pedido-enviando');
    var enviando = false;
    var temporizador = null;

    var campos = {
        nombre: document.getElementById('p-nombre'),
        edad: document.getElementById('p-edad'),
        sexo: document.getElementById('p-sexo'),
        cedula: document.getElementById('p-cedula'),
        telefono: document.getElementById('p-telefono'),
        producto: document.getElementById('p-producto'),
        precio: document.getElementById('p-precio'),
        notas: document.getElementById('p-notas')
    };

    function mostrarError(texto) {
        if (!error) return;
        error.textContent = texto;
        error.classList.remove('d-none');
        error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function ocultarError() {
        if (error) error.classList.add('d-none');
    }

    function mostrarEstadoEnviando(visible) {
        enviando = visible;
        if (accionesEl) accionesEl.classList.toggle('d-none', visible);
        if (enviandoEl) enviandoEl.classList.toggle('d-none', !visible);
        botonEnviar.disabled = visible;
    }

    function validarCedula(cedula) {
        if (!/^\d{11}$/.test(cedula)) return false;
        var suma = 0;
        for (var i = 0; i < 10; i++) {
            var digito = Number(cedula.charAt(i));
            var producto = digito * (i % 2 === 0 ? 1 : 2);
            suma += producto > 9 ? producto - 9 : producto;
        }
        return (10 - suma % 10) % 10 === Number(cedula.charAt(10));
    }

    function rellenarProducto(datos) {
        if (datos.producto && campos.producto) campos.producto.value = datos.producto;
        if (datos.precio && campos.precio) campos.precio.value = datos.precio;
    }

    modal.addEventListener('show.bs.modal', function (evento) {
        var disparador = evento.relatedTarget;
        var desdeCarrito = modal.dataset.desdeCarrito === 'true';
        delete modal.dataset.desdeCarrito;
        ocultarError();
        if (!desdeCarrito && campos.producto.readOnly) {
            campos.producto.value = '';
            campos.producto.readOnly = false;
        }
        if (disparador && disparador.dataset) rellenarProducto(disparador.dataset);
    });

    modal.addEventListener('hide.bs.modal', function (evento) {
        if (enviando) {
            evento.preventDefault();
            mostrarError('Espera a que termine el envío antes de cerrar o cancelar el pedido.');
        }
    });

    modal.addEventListener('hidden.bs.modal', function () {
        if (!exito.classList.contains('d-none')) formulario.reset();
        campos.producto.readOnly = false;
        formulario.classList.remove('d-none');
        exito.classList.add('d-none');
        mostrarEstadoEnviando(false);
        ocultarError();
    });

    if (botonCancelar) {
        botonCancelar.addEventListener('click', function () {
            if (enviando) return;
            formulario.reset();
            if (typeof window.vaciarCarrito === 'function') window.vaciarCarrito();
            if (window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(modal).hide();
        });
    }

    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();
        if (botonEnviar.disabled) return;
        ocultarError();

        var nombre = campos.nombre.value.trim();
        var cedulaEntrada = campos.cedula.value.trim();
        var cedula = cedulaEntrada.replace(/[\s-]/g, '');
        var telefono = campos.telefono.value.replace(/\D/g, '');
        var edad = campos.edad.value.trim();
        var producto = campos.producto.value.trim();
        var precio = campos.precio.value.trim();
        var notas = campos.notas.value.trim();

        campos.cedula.value = cedula;
        campos.telefono.value = telefono;

        var palabrasNombre = nombre ? nombre.split(/\s+/).length : 0;
        if (!nombre || palabrasNombre > 30 || nombre.length > 120) {
            mostrarError('Escribe tu nombre completo; el límite es 30 palabras y 120 caracteres.');
            campos.nombre.focus();
            return;
        }
        if (cedulaEntrada && !validarCedula(cedula)) {
            mostrarError('Si escribes la cédula, debe tener 11 dígitos y su número de verificación debe ser válido.');
            campos.cedula.focus();
            return;
        }
        if (!/^\d{1,2}$/.test(edad) || Number(edad) < 1 || Number(edad) > 99) {
            mostrarError('La edad debe estar entre 1 y 99 años y tener máximo dos dígitos.');
            campos.edad.focus();
            return;
        }
        if (!campos.sexo.value) {
            mostrarError('Selecciona una opción para el sexo.');
            campos.sexo.focus();
            return;
        }
        if (!/^\d{10}$/.test(telefono)) {
            mostrarError('El teléfono debe tener exactamente 10 dígitos.');
            campos.telefono.focus();
            return;
        }
        if (!producto || producto.length > 1000) {
            mostrarError('Indica el producto (máximo 1000 caracteres).');
            campos.producto.focus();
            return;
        }
        if (!precio || !Number.isFinite(Number(precio)) || Number(precio) < 0 || Number(precio) > 999999.99) {
            mostrarError('El precio debe ser un monto válido.');
            campos.precio.focus();
            return;
        }
        if (!notas || notas.length > 500) {
            mostrarError('Escribe los detalles de personalización (máximo 500 caracteres).');
            campos.notas.focus();
            return;
        }

        var datos = {
            nombre: nombre,
            edad: edad,
            sexo: campos.sexo.value,
            cedula: cedula,
            telefono: telefono,
            producto: producto,
            precio: precio,
            notas: notas
        };

        mostrarEstadoEnviando(true);
        var controlador = new AbortController();
        temporizador = window.setTimeout(function () {
            controlador.abort();
        }, TIEMPO_LIMITE_MS);

        window.fetch(PEDIDOS_URL + '/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos),
            signal: controlador.signal
        })
            .then(function (respuesta) {
                return respuesta.text().then(function (texto) {
                    var contenido;
                    try {
                        contenido = texto ? JSON.parse(texto) : {};
                    } catch (errorParseo) {
                        throw new Error('El servicio de pedidos respondió con datos inválidos.');
                    }
                    return { ok: respuesta.ok, datos: contenido };
                });
            })
            .then(function (resultado) {
                if (!resultado.ok || !resultado.datos.codigo) {
                    throw new Error((resultado.datos && resultado.datos.error) || 'No se pudo registrar el pedido.');
                }
                codigoEl.textContent = resultado.datos.codigo;
                formulario.classList.add('d-none');
                exito.classList.remove('d-none');
                if (typeof window.vaciarCarrito === 'function') window.vaciarCarrito();
            })
            .catch(function (err) {
                mostrarError(err.name === 'AbortError'
                    ? 'La solicitud tardó demasiado. Revisa tu conexión e intenta de nuevo.'
                    : err.message || 'No se pudo conectar. Revisa tu conexión e intenta de nuevo.');
            })
            .then(function () {
                window.clearTimeout(temporizador);
                temporizador = null;
                mostrarEstadoEnviando(false);
            });
    });
})();
