/* Panel de pedidos - Estampado Darlin.
   Muestra los pedidos guardados en la base de datos (D1) y permite
   cambiar su estado entre "pendiente" y "realizado". */
(function () {
    'use strict';

    var PEDIDOS_URL = 'https://darlin-bot.darlinportolatin.workers.dev';
    var CLAVE_SESION = 'darlin_admin_token';

    var login = document.getElementById('admin-login');
    var panel = document.getElementById('admin-panel');
    var formulario = document.getElementById('admin-form');
    var claveInput = document.getElementById('admin-clave');
    var errorEl = document.getElementById('admin-error');
    var lista = document.getElementById('admin-lista');
    var vacio = document.getElementById('admin-vacio');
    var statPend = document.getElementById('stat-pendientes');
    var statReal = document.getElementById('stat-realizados');
    var statTotal = document.getElementById('stat-total');

    var pedidos = [];
    var filtroEstado = 'todos';
    var clave = '';

    function mostrarError(texto) {
        errorEl.textContent = texto;
        errorEl.classList.remove('d-none');
    }

    function ocultarError() {
        errorEl.classList.add('d-none');
    }

    function fechaHoy() {
        var f = document.getElementById('admin-fecha');
        if (f) {
            f.textContent = new Date().toLocaleDateString('es-DO', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        }
    }

    function pedirLista() {
        return window.fetch(PEDIDOS_URL + '/pedidos', {
            headers: { 'X-Admin-Token': clave }
        }).then(function (r) {
            if (r.status === 401) {
                throw new Error('CLAVE');
            }
            return r.json();
        });
    }

    function cargar() {
        ocultarError();
        return pedirLista()
            .then(function (d) {
                pedidos = (d && d.pedidos) || [];
                pintar();
            })
            .catch(function (err) {
                if (err.message === 'CLAVE') {
                    salir();
                    mostrarError('Clave incorrecta. Intenta de nuevo.');
                } else {
                    mostrarError('No se pudo cargar. Revisa tu conexión.');
                }
            });
    }

    function pintarResumen() {
        var pendientes = pedidos.filter(function (p) { return p.estado !== 'realizado'; }).length;
        statPend.textContent = pendientes;
        statReal.textContent = pedidos.length - pendientes;
        statTotal.textContent = pedidos.length;
    }

    function esc(texto) {
        return String(texto == null ? '' : texto).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function crearTarjeta(p) {
        var realizado = p.estado === 'realizado';
        var datos = [];
        if (p.edad) datos.push('Edad: ' + esc(p.edad));
        if (p.sexo) datos.push('Sexo: ' + esc(p.sexo));
        if (p.cedula_ultimos4) datos.push('Cédula terminada en: ' + esc(p.cedula_ultimos4));
        if (p.precio !== null && p.precio !== undefined && p.precio !== '') {
            datos.push('Precio: USD$' + esc(p.precio));
        }
        if (p.creado_en) datos.push('Fecha: ' + esc(p.creado_en));

        var tarjeta = document.createElement('article');
        tarjeta.className = 'admin-card' + (realizado ? ' es-realizado' : '');
        tarjeta.innerHTML =
            '<div class="admin-card-top">' +
                '<span class="admin-card-codigo">' + esc(p.codigo) + '</span>' +
                '<span class="admin-badge ' + (realizado ? 'badge-realizado' : 'badge-pendiente') + '">' +
                    (realizado ? 'Realizado' : 'Pendiente') +
                '</span>' +
            '</div>' +
            '<h3 class="admin-card-nombre">' + esc(p.nombre) + '</h3>' +
            '<p class="admin-card-tel"><i class="bi-telephone me-1"></i>' + esc(p.telefono) + '</p>' +
            '<p class="admin-card-prod"><i class="bi-bag me-1"></i>' + esc(p.producto) + '</p>' +
            (p.notas ? '<p class="admin-card-notas"><i class="bi-chat-left-text me-1"></i>' + esc(p.notas) + '</p>' : '') +
            (datos.length ? '<p class="admin-card-datos">' + datos.join(' &middot; ') + '</p>' : '') +
            '<div class="admin-card-acciones"></div>';

        var acciones = tarjeta.querySelector('.admin-card-acciones');

        var wa = document.createElement('a');
        wa.className = 'btn btn-whatsapp btn-sm';
        wa.href = 'https://wa.me/' + numero(p.telefono) + '?text=' +
            encodeURIComponent('Hola ' + p.nombre + ', sobre tu pedido ' + p.codigo + ' de Estampado Darlin:');
        wa.target = '_blank';
        wa.rel = 'noopener';
        wa.innerHTML = '<i class="bi-whatsapp me-1"></i>WhatsApp';
        acciones.appendChild(wa);

        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = realizado ? 'btn btn-outline-secondary btn-sm' : 'btn btn-rosa-solido btn-sm';
        boton.innerHTML = realizado
            ? '<i class="bi-arrow-counterclockwise me-1"></i>Volver a pendiente'
            : '<i class="bi-check-lg me-1"></i>Marcar realizado';
        boton.addEventListener('click', function () {
            cambiarEstado(p.codigo, realizado ? 'pendiente' : 'realizado', boton);
        });
        acciones.appendChild(boton);

        return tarjeta;
    }

    function numero(telefono) {
        return String(telefono || '').replace(/[^0-9]/g, '');
    }

    function pintar() {
        pintarResumen();
        lista.innerHTML = '';

        var visibles = pedidos.filter(function (p) {
            if (filtroEstado === 'todos') return true;
            if (filtroEstado === 'pendiente') return p.estado !== 'realizado';
            return p.estado === 'realizado';
        });

        visibles.forEach(function (p) {
            lista.appendChild(crearTarjeta(p));
        });

        vacio.classList.toggle('d-none', visibles.length > 0);
    }

    function cambiarEstado(codigo, estado, boton) {
        boton.disabled = true;
        window.fetch(PEDIDOS_URL + '/pedidos/estado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Token': clave },
            body: JSON.stringify({ codigo: codigo, estado: estado })
        })
            .then(function (r) { return r.json(); })
            .then(function () {
                var p = pedidos.filter(function (x) { return x.codigo === codigo; })[0];
                if (p) p.estado = estado;
                pintar();
            })
            .catch(function () {
                boton.disabled = false;
                mostrarError('No se pudo actualizar el pedido.');
            });
    }

    function entrar(token) {
        clave = token;
        cargar().then(function () {
            if (clave) {
                window.sessionStorage.setItem(CLAVE_SESION, clave);
                login.classList.add('d-none');
                panel.classList.remove('d-none');
                fechaHoy();
            }
        });
    }

    function salir() {
        clave = '';
        window.sessionStorage.removeItem(CLAVE_SESION);
        panel.classList.add('d-none');
        login.classList.remove('d-none');
        claveInput.value = '';
    }

    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();
        ocultarError();
        var token = claveInput.value.trim();
        if (!token) return;
        // Se valida intentando cargar la lista con esa clave.
        clave = token;
        pedirLista()
            .then(function (d) {
                pedidos = (d && d.pedidos) || [];
                window.sessionStorage.setItem(CLAVE_SESION, clave);
                login.classList.add('d-none');
                panel.classList.remove('d-none');
                fechaHoy();
                pintar();
            })
            .catch(function (err) {
                if (err.message === 'CLAVE') {
                    mostrarError('Clave incorrecta.');
                } else {
                    mostrarError('No se pudo conectar con el servidor.');
                }
            });
    });

    document.getElementById('admin-refrescar').addEventListener('click', cargar);
    document.getElementById('admin-salir').addEventListener('click', salir);

    document.querySelectorAll('[data-filtro-estado]').forEach(function (boton) {
        boton.addEventListener('click', function () {
            document.querySelectorAll('[data-filtro-estado]').forEach(function (b) {
                b.classList.remove('active');
            });
            boton.classList.add('active');
            filtroEstado = boton.dataset.filtroEstado;
            pintar();
        });
    });

    // Sesión guardada: entra directo.
    var guardada = window.sessionStorage.getItem(CLAVE_SESION);
    if (guardada) {
        entrar(guardada);
    }
})();
