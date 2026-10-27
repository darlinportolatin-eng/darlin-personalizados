// Filtros, carrito y navegación del catálogo.
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    window.catalogoListo = true;

    var botones = document.querySelectorAll('.filtro-btn[data-filtro]');
    var productos = document.querySelectorAll('.producto');
    var contador = document.getElementById('contador-texto');
    var msgVacio = document.getElementById('msg-vacio');
    var seccionFilosofia = document.getElementById('filosofia');
    var enlacesFilosofia = document.querySelectorAll('a[href="#filosofia"]');
    var carritoModalEl = document.getElementById('modal-carrito');
    var carritoItemsEl = document.getElementById('carrito-items');
    var carritoVacioEl = document.getElementById('carrito-vacio');
    var carritoTotalEl = document.getElementById('carrito-total');
    var carritoCantidadEl = document.getElementById('carrito-cantidad');
    var continuarEl = document.getElementById('carrito-continuar');
    var pedidoModalEl = document.getElementById('modal-pedido');
    var carrito = [];
    var abrirPedidoAlCerrarCarrito = false;

    function aplicarFiltro(filtro) {
        var visibles = 0;

        productos.forEach(function (producto) {
            var coincide = filtro === 'todos' || producto.dataset.categoria === filtro;
            producto.classList.toggle('mostrar', coincide);
            if (coincide) visibles++;
        });

        if (contador) {
            contador.textContent = visibles === 1 ? '1 producto' : visibles + ' productos';
            contador.classList.remove('esperando');
        }

        if (msgVacio) {
            msgVacio.classList.toggle('visible', visibles === 0);
        }
    }

    botones.forEach(function (boton) {
        boton.addEventListener('click', function () {
            botones.forEach(function (otro) {
                otro.classList.remove('active');
                otro.setAttribute('aria-pressed', 'false');
            });
            boton.classList.add('active');
            boton.setAttribute('aria-pressed', 'true');
            aplicarFiltro(boton.dataset.filtro);
        });
    });

    aplicarFiltro('todos');

    if (seccionFilosofia) {
        enlacesFilosofia.forEach(function (enlace) {
            enlace.addEventListener('click', function (evento) {
                evento.preventDefault();
                seccionFilosofia.hidden = false;
                seccionFilosofia.scrollIntoView({ behavior: 'smooth', block: 'start' });

                var menu = document.getElementById('navbarResponsive');
                if (menu && menu.classList.contains('show') && window.bootstrap) {
                    window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
                }
            });
        });
    }

    function totalCarrito() {
        return carrito.reduce(function (total, item) {
            return total + item.precio * item.cantidad;
        }, 0);
    }

    function renderizarCarrito() {
        if (!carritoItemsEl) return;
        carritoItemsEl.replaceChildren();

        var cantidad = carrito.reduce(function (total, item) {
            return total + item.cantidad;
        }, 0);
        var total = totalCarrito();

        if (carritoCantidadEl) carritoCantidadEl.textContent = cantidad;
        if (carritoTotalEl) carritoTotalEl.textContent = 'USD$' + total.toFixed(2);
        if (carritoVacioEl) carritoVacioEl.hidden = carrito.length > 0;
        if (continuarEl) continuarEl.disabled = carrito.length === 0;

        carrito.forEach(function (item) {
            var fila = document.createElement('article');
            fila.className = 'carrito-item';

            var imagen = document.createElement('img');
            imagen.src = item.imagen;
            imagen.alt = item.nombre;
            imagen.loading = 'lazy';
            fila.appendChild(imagen);

            var info = document.createElement('div');
            info.className = 'carrito-item-info';
            var titulo = document.createElement('strong');
            titulo.textContent = item.nombre + ' (Foto ' + item.foto + ')';
            var precio = document.createElement('span');
            precio.textContent = 'USD$' + item.precio.toFixed(2) + ' c/u';
            info.appendChild(titulo);
            info.appendChild(precio);
            fila.appendChild(info);

            var controles = document.createElement('div');
            controles.className = 'carrito-controles';
            var menos = document.createElement('button');
            menos.type = 'button';
            menos.className = 'carrito-cantidad-btn';
            menos.setAttribute('aria-label', 'Quitar una unidad de ' + item.nombre);
            menos.textContent = '-';
            menos.addEventListener('click', function () {
                item.cantidad--;
                if (item.cantidad <= 0) carrito = carrito.filter(function (otro) { return otro !== item; });
                renderizarCarrito();
            });

            var unidades = document.createElement('span');
            unidades.textContent = item.cantidad;
            unidades.setAttribute('aria-label', 'Cantidad');
            var mas = document.createElement('button');
            mas.type = 'button';
            mas.className = 'carrito-cantidad-btn';
            mas.setAttribute('aria-label', 'Agregar una unidad de ' + item.nombre);
            mas.textContent = '+';
            mas.addEventListener('click', function () {
                item.cantidad++;
                renderizarCarrito();
            });

            controles.appendChild(menos);
            controles.appendChild(unidades);
            controles.appendChild(mas);
            fila.appendChild(controles);
            carritoItemsEl.appendChild(fila);
        });
    }

    function agregarProducto(producto) {
        var existente = carrito.find(function (item) { return item.id === producto.id; });
        if (existente) {
            existente.cantidad++;
        } else {
            producto.cantidad = 1;
            carrito.push(producto);
        }

        renderizarCarrito();
        if (window.bootstrap && carritoModalEl) {
            window.bootstrap.Modal.getOrCreateInstance(carritoModalEl).show();
        }
    }

    document.querySelectorAll('.product-card .btn-whatsapp').forEach(function (enlace) {
        var tarjeta = enlace.closest('.product-card');
        var producto = {
            id: tarjeta.querySelector('.product-img').getAttribute('src'),
            imagen: tarjeta.querySelector('.product-img').getAttribute('src'),
            nombre: tarjeta.querySelector('h3').textContent.trim(),
            foto: tarjeta.querySelector('.product-num').textContent.replace(/\D/g, ''),
            precio: Number(tarjeta.querySelector('.product-price').textContent.replace(/[^\d.]/g, ''))
        };

        enlace.href = '#modal-carrito';
        enlace.removeAttribute('target');
        enlace.removeAttribute('rel');
        enlace.classList.remove('btn-whatsapp');
        enlace.classList.add('btn-agregar-carrito');
        enlace.setAttribute('role', 'button');
        enlace.setAttribute('aria-label', 'Agregar ' + producto.nombre + ' al carrito');
        enlace.innerHTML = '<i class="bi-cart-plus me-2" aria-hidden="true"></i>Agregar al carrito';
        enlace.addEventListener('click', function (evento) {
            evento.preventDefault();
            agregarProducto(producto);
        });
    });

    if (carritoModalEl) {
        carritoModalEl.addEventListener('show.bs.modal', renderizarCarrito);
        carritoModalEl.addEventListener('hidden.bs.modal', function () {
            if (abrirPedidoAlCerrarCarrito && pedidoModalEl) {
                abrirPedidoAlCerrarCarrito = false;
                window.bootstrap.Modal.getOrCreateInstance(pedidoModalEl).show();
            }
        });
    }

    if (continuarEl) {
        continuarEl.addEventListener('click', function () {
            if (!carrito.length || !pedidoModalEl) return;
            var productoEl = document.getElementById('p-producto');
            var precioEl = document.getElementById('p-precio');
            var resumen = carrito.map(function (item) {
                return item.foto + 'x' + item.cantidad;
            }).join(',');
            if (productoEl) productoEl.value = 'Fotos ' + resumen;
            if (precioEl) precioEl.value = totalCarrito().toFixed(2);
            abrirPedidoAlCerrarCarrito = true;
            window.bootstrap.Modal.getOrCreateInstance(carritoModalEl).hide();
        });
    }

    window.resumenCarritoWhatsApp = function () {
        return carrito.map(function (item) {
            return '- ' + item.nombre + ' (foto ' + item.foto + '): ' + item.cantidad +
                ' x USD$' + item.precio.toFixed(2) + ' = USD$' +
                (item.cantidad * item.precio).toFixed(2);
        });
    };

    window.vaciarCarrito = function () {
        carrito = [];
        renderizarCarrito();
    };

    var btnSubir = document.getElementById('btn-subir');
    if (btnSubir) {
        window.addEventListener('scroll', function () {
            btnSubir.classList.toggle('visible', window.scrollY > 500);
        }, { passive: true });

        btnSubir.addEventListener('click', function () {
            var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        });
    }
});
