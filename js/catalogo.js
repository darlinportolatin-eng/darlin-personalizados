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
    var detalleProductoEl = document.getElementById('producto-detalle');
    var detalleContenidoEl = document.getElementById('producto-detalle-contenido');
    var tituloRelacionadosEl = document.getElementById('titulo-relacionados');
    var textoRelacionadosEl = document.getElementById('texto-relacionados');
    var volverCatalogoEl = document.getElementById('volver-catalogo');
    var carritoModalEl = document.getElementById('modal-carrito');
    var carritoItemsEl = document.getElementById('carrito-items');
    var carritoVacioEl = document.getElementById('carrito-vacio');
    var carritoTotalEl = document.getElementById('carrito-total');
    var carritoCantidadEl = document.getElementById('carrito-cantidad');
    var continuarEl = document.getElementById('carrito-continuar');
    var pedidoModalEl = document.getElementById('modal-pedido');
    var carrito = [];
    var abrirPedidoAlCerrarCarrito = false;
    var productoSeleccionado = null;

    function actualizarFiltroActivo(filtro) {
        botones.forEach(function (boton) {
            var activo = boton.dataset.filtro === filtro;
            boton.classList.toggle('active', activo);
            boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
        });
    }

    function cerrarDetalle() {
        productoSeleccionado = null;
        if (detalleProductoEl) detalleProductoEl.hidden = true;
        if (tituloRelacionadosEl) tituloRelacionadosEl.hidden = true;
    }

    function aplicarFiltro(filtro) {
        var visibles = 0;

        productos.forEach(function (producto) {
            var coincide = (filtro === 'todos' || producto.dataset.categoria === filtro) &&
                producto !== productoSeleccionado;
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

    function abrirDetalle(producto) {
        var tarjeta = producto.querySelector('.product-card');
        var imagenOriginal = tarjeta.querySelector('.product-img');
        var tituloOriginal = tarjeta.querySelector('h3');
        var descripcionOriginal = tarjeta.querySelector('.card-body p');
        var categoriaOriginal = tarjeta.querySelector('.badge-category');
        var precioOriginal = tarjeta.querySelector('.product-price');
        var imagen = document.createElement('img');
        var informacion = document.createElement('div');
        var categoria = document.createElement('span');
        var titulo = document.createElement('h3');
        var descripcion = document.createElement('p');
        var precio = document.createElement('p');
        var botonAgregar = document.createElement('button');

        productoSeleccionado = producto;
        imagen.className = 'producto-detalle-imagen';
        imagen.src = imagenOriginal.src;
        imagen.alt = imagenOriginal.alt;
        imagen.loading = 'eager';
        informacion.className = 'producto-detalle-informacion';
        categoria.className = 'badge-category';
        categoria.textContent = categoriaOriginal.textContent;
        titulo.className = 'producto-detalle-titulo';
        titulo.textContent = tituloOriginal.textContent;
        descripcion.className = 'producto-detalle-descripcion';
        descripcion.textContent = descripcionOriginal.textContent;
        precio.className = 'producto-detalle-precio';
        precio.textContent = precioOriginal.textContent.trim();
        botonAgregar.type = 'button';
        botonAgregar.className = 'btn btn-detalle-agregar';
        botonAgregar.innerHTML = '<i class="bi-cart-plus me-2" aria-hidden="true"></i>Agregar al carrito';
        botonAgregar.addEventListener('click', function () {
            tarjeta.querySelector('.btn-agregar-carrito').click();
        });

        informacion.replaceChildren(categoria, titulo, descripcion, precio, botonAgregar);
        detalleContenidoEl.replaceChildren(imagen, informacion);
        detalleProductoEl.hidden = false;
        tituloRelacionadosEl.hidden = false;
        textoRelacionadosEl.textContent = 'Otros productos de ' + categoria.textContent + '.';
        actualizarFiltroActivo(producto.dataset.categoria);
        aplicarFiltro(producto.dataset.categoria);

        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        detalleProductoEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }

    botones.forEach(function (boton) {
        boton.addEventListener('click', function () {
            cerrarDetalle();
            actualizarFiltroActivo(boton.dataset.filtro);
            aplicarFiltro(boton.dataset.filtro);
        });
    });

    if (volverCatalogoEl) {
        volverCatalogoEl.addEventListener('click', function () {
            cerrarDetalle();
            actualizarFiltroActivo('todos');
            aplicarFiltro('todos');
        });
    }

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
        if (carritoTotalEl) carritoTotalEl.textContent = 'RD$' + total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
            precio.textContent = 'RD$' + item.precio.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' c/u';
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

        var botonDetalle = document.createElement('button');
        botonDetalle.type = 'button';
        botonDetalle.className = 'btn btn-ver-producto';
        botonDetalle.innerHTML = '<i class="bi-search me-2" aria-hidden="true"></i>Ver detalles y relacionados';
        botonDetalle.addEventListener('click', function () {
            abrirDetalle(enlace.closest('.producto'));
        });
        enlace.parentNode.appendChild(botonDetalle);

        tarjeta.addEventListener('click', function (evento) {
            if (evento.target.closest('a, button')) return;
            abrirDetalle(enlace.closest('.producto'));
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
                return item.nombre + ' (foto ' + item.foto + ') x ' + item.cantidad;
            }).join('; ');
            if (productoEl) {
                productoEl.value = resumen;
                productoEl.readOnly = true;
            }
            if (precioEl) precioEl.value = totalCarrito().toFixed(2);
            pedidoModalEl.dataset.desdeCarrito = 'true';
            abrirPedidoAlCerrarCarrito = true;
            window.bootstrap.Modal.getOrCreateInstance(carritoModalEl).hide();
        });
    }

    window.resumenCarritoWhatsApp = function () {
        return carrito.map(function (item) {
            return '- ' + item.nombre + ' (foto ' + item.foto + '): ' + item.cantidad +
                ' x RD$' + item.precio.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' = RD$' +
                (item.cantidad * item.precio).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
