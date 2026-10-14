// Catálogo: al abrir NO se muestran productos.
// Solo aparecen los de la categoría que se elija en los botones.
document.addEventListener('DOMContentLoaded', function () {

    window.catalogoListo = true;

    var botones = document.querySelectorAll('.filtro-btn');
    var productos = document.querySelectorAll('.producto');
    var contador = document.getElementById('contador-texto');
    var msgVacio = document.getElementById('msg-vacio');

    function aplicarFiltro(filtro) {
        var visibles = 0;

        productos.forEach(function (producto) {
            var coincide = filtro !== null && producto.dataset.categoria === filtro;
            producto.classList.toggle('mostrar', coincide);
            if (coincide) visibles++;
        });

        if (contador) {
            if (filtro === null) {
                contador.textContent = 'Elige una categoría para ver los productos';
                contador.classList.add('esperando');
            } else {
                contador.textContent = visibles === 1 ? '1 producto' : visibles + ' productos';
                contador.classList.remove('esperando');
            }
        }

        if (msgVacio) {
            msgVacio.classList.toggle('visible', filtro !== null && visibles === 0);
        }
    }

    botones.forEach(function (boton) {
        boton.addEventListener('click', function () {
            botones.forEach(function (b) {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            boton.classList.add('active');
            boton.setAttribute('aria-pressed', 'true');
            aplicarFiltro(boton.dataset.filtro);
        });
    });

    // Estado inicial: nada visible hasta que se elija una categoría
    aplicarFiltro(null);

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
