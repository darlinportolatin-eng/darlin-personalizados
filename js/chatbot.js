/* Chat de atención - Estampado Darlin.
   - Al abrir, el cliente elige: hacer un pedido o hacer una pregunta.
   - Modo pedido: 3 preguntas y arma el resumen para WhatsApp.
   - Modo pregunta: la IA responde CUALQUIER pregunta.
   Para activar la IA, pega abajo la URL del Worker de Cloudflare. */
(function () {
    'use strict';

    var TELEFONO = '18492151857';

    /* ------------------------------------------------------------------
       IA (opcional). Si queda vacío, el chat funciona igual pero responde
       solo las preguntas frecuentes básicas.
       ------------------------------------------------------------------ */
    var IA_URL = 'https://darlin-bot.darlinportolatin.workers.dev';
    var IA_ACTIVA = /^https?:\/\//i.test(IA_URL.trim());

    var btnAbrir = document.getElementById('chat-abrir');
    var ventana = document.getElementById('chat-ventana');
    var btnCerrar = document.querySelector('.chat-cerrar');
    var zonaMensajes = document.getElementById('chat-mensajes');
    var zonaRespuestas = document.getElementById('chat-respuestas');
    var formulario = document.getElementById('chat-form');
    var entrada = document.getElementById('chat-input');

    if (!btnAbrir || !ventana || !zonaMensajes || !formulario || !entrada) {
        return;
    }

    var paso = null;
    var encendido = false;
    var datos = { producto: '', idea: '', cantidad: '' };
    var historialIA = [];

    var OPS_PRINCIPAL = ['Quiero hacer un pedido', 'Tengo una pregunta'];
    var OPS_PRODUCTO = ['Taza', 'Termo', 'Vaso', 'Camiseta', 'Gorra', 'Llavero', 'Otro', 'Tengo una pregunta'];
    var OPS_IDEA = ['Una foto', 'Un nombre o frase', 'Un diseño que ya tengo', 'Necesito ideas', 'Tengo una pregunta'];
    var OPS_CANTIDAD = ['1', '2 a 5', '6 o más', 'Tengo una pregunta'];
    var OPS_FINAL = ['Empezar de nuevo', 'Tengo una pregunta'];
    var OPS_DUDA = ['Quiero hacer un pedido'];

    var FAQS = [
        { patron: /(^|\s)(hola|buenas|hey|qué tal|que tal|saludos)(\s|$)/i, texto: '¡Hola! Puedo armar tu pedido o responder tus dudas. ¿Qué necesitas?' },
        { patron: /precio|cuesta|costo|cu[aá]nto|tarifa/i, texto: 'Los precios están en el catálogo: van desde USD$2 (pegatinas) hasta USD$23 (termos). ¿Qué producto te interesa?' },
        { patron: /env[ií]o|entrega|domicilio/i, texto: 'La entrega la coordinamos por WhatsApp según tu zona, así te confirmamos disponibilidad y tiempo.' },
        { patron: /pago|pagar|transferencia|efectivo/i, texto: 'El método de pago se confirma por WhatsApp cuando cerramos el pedido.' },
        { patron: /horario|abren|abierto|a qué hora/i, texto: 'Escríbenos por WhatsApp y te respondemos lo antes posible.' },
        { patron: /persona|humano|atend|operador/i, texto: 'Claro: toca el botón de WhatsApp y te atiende Darlin en persona.' },
        { patron: /gracias|grax|mil gracias/i, texto: '¡Con gusto! ¿Hacemos un pedido o tienes otra pregunta?' }
    ];

    function esc(valor) {
        return String(valor).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function bajar() {
        zonaMensajes.scrollTop = zonaMensajes.scrollHeight;
    }

    function burbujaBot(html) {
        var burbuja = document.createElement('div');
        burbuja.className = 'chat-msg chat-bot';
        burbuja.innerHTML = html;
        zonaMensajes.appendChild(burbuja);
        bajar();
        return burbuja;
    }

    function msgUsuario(texto) {
        var burbuja = document.createElement('div');
        burbuja.className = 'chat-msg chat-tu';
        burbuja.textContent = texto;
        zonaMensajes.appendChild(burbuja);
        bajar();
    }

    function msgBot(html, alTerminar) {
        var escribiendo = document.createElement('div');
        escribiendo.className = 'chat-msg chat-bot chat-typing';
        escribiendo.innerHTML = '<span></span><span></span><span></span>';
        zonaMensajes.appendChild(escribiendo);
        bajar();

        window.setTimeout(function () {
            if (escribiendo.parentNode) {
                escribiendo.parentNode.removeChild(escribiendo);
            }
            var burbuja = burbujaBot(html);
            if (alTerminar) {
                alTerminar(burbuja);
            }
        }, 500);
    }

    function opciones(lista) {
        zonaRespuestas.innerHTML = '';
        lista.forEach(function (texto) {
            var chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chat-chip';
            chip.textContent = texto;
            chip.addEventListener('click', function () {
                responder(texto, true);
            });
            zonaRespuestas.appendChild(chip);
        });
    }

    function limpiarOpciones() {
        zonaRespuestas.innerHTML = '';
    }

    function buscarFaq(texto) {
        for (var i = 0; i < FAQS.length; i++) {
            if (FAQS[i].patron.test(texto)) {
                return FAQS[i].texto;
            }
        }
        return null;
    }

    function pareceConsulta(texto) {
        return /[?¿]/.test(texto) ||
            /\b(cu[aá]nto|cuanto|cuesta|precio|cost|vale|valen|env[ií]o|entreg|domicilio|pago|pagar|transferencia|efectivo|horari|abren|abierto|tienen|tiene|hay|puedo|pueden|hacen|aceptan|duda|pregunta|c[oó]mo|d[oó]nde|cu[aá]ndo|qui[eé]n|por qu[eé]|quiero saber|informaci[oó]n)\b/i.test(texto);
    }

    /* --------------------------- IA --------------------------- */

    function mostrarEscribiendo() {
        var t = document.createElement('div');
        t.className = 'chat-msg chat-bot chat-typing chat-ia';
        t.innerHTML = '<span></span><span></span><span></span>';
        zonaMensajes.appendChild(t);
        bajar();
        return t;
    }

    function consultarIA(texto, alResponder) {
        historialIA.push({ role: 'user', text: texto });
        var indicador = mostrarEscribiendo();

        window.fetch(IA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: historialIA })
        })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var respuesta = (d && (d.reply || d.response)) || '';
                if (indicador.parentNode) {
                    indicador.parentNode.removeChild(indicador);
                }
                if (!respuesta) {
                    respuesta = 'No pude responder eso. Escríbenos al WhatsApp y te ayudamos.';
                }
                historialIA.push({ role: 'model', text: respuesta });
                if (alResponder) {
                    alResponder(respuesta);
                } else {
                    burbujaBot(esc(respuesta));
                }
            })
            .catch(function () {
                if (indicador.parentNode) {
                    indicador.parentNode.removeChild(indicador);
                }
                burbujaBot('No pude conectarme en este momento. Escríbenos al WhatsApp y te ayudamos.');
            });
    }

    function entrarEnDuda() {
        paso = 'duda';
        msgBot('Claro. Escribe tu pregunta y te la respondo.', function () {
            opciones(OPS_DUDA);
        });
    }

    function responderDuda(texto) {
        if (IA_ACTIVA) {
            consultarIA(texto, function (respuesta) {
                burbujaBot(esc(respuesta));
                opciones(OPS_DUDA);
            });
            return;
        }
        var faq = buscarFaq(texto);
        msgBot(faq || 'Entiendo. Escríbenos al WhatsApp y te respondemos enseguida.', function () {
            opciones(OPS_DUDA);
        });
    }

    /* --------------------------- FLUJO --------------------------- */

    function preguntarInicio() {
        paso = 'menu';
        msgBot('¡Hola! Soy el asistente de <strong>Estampado Darlin</strong>.<br><br>¿En qué te puedo ayudar? Toca un botón o escríbeme lo que necesites.', function () {
            opciones(OPS_PRINCIPAL);
        });
    }

    function preguntarProducto() {
        paso = 'inicio';
        msgBot('¡Perfecto! Respondes 3 preguntitas y tu pedido llega listo al WhatsApp.<br><br>¿Qué te gustaría personalizar?', function () {
            opciones(OPS_PRODUCTO);
        });
    }

    function repetirPaso() {
        if (paso === 'menu') {
            opciones(OPS_PRINCIPAL);
        } else if (paso === 'inicio') {
            opciones(OPS_PRODUCTO);
        } else if (paso === 'idea') {
            opciones(OPS_IDEA);
        } else if (paso === 'cantidad') {
            opciones(OPS_CANTIDAD);
        } else if (paso === 'final') {
            opciones(OPS_FINAL);
        } else if (paso === 'duda') {
            opciones(OPS_DUDA);
        }
    }

    function manejar(texto, esChip) {
        var limpio = texto.trim();

        if (paso === 'duda') {
            responderDuda(limpio);
            return;
        }

        if (/^(quiero )?hacer un pedido$/i.test(limpio)) {
            preguntarProducto();
            return;
        }

        if (/^tengo una (duda|pregunta)$/i.test(limpio)) {
            entrarEnDuda();
            return;
        }

        /* Con IA activa, CUALQUIER texto libre lo responde la IA
           (los botones/chips siguen armando el pedido). */
        if (!esChip && IA_ACTIVA && paso !== 'producto-otro') {
            consultarIA(limpio, function (respuesta) {
                burbujaBot(esc(respuesta));
                repetirPaso();
            });
            return;
        }

        if (!IA_ACTIVA && pareceConsulta(limpio)) {
            var faq = buscarFaq(limpio);
            msgBot(faq || 'Aún no tengo esa respuesta. Escríbenos al WhatsApp y te la damos.', repetirPaso);
            return;
        }

        if (paso === 'menu') {
            var faqMenu = buscarFaq(limpio);
            msgBot(faqMenu || 'Puedo armar tu pedido o resolver tus dudas. ¿Qué prefieres?', repetirPaso);
            return;
        }

        if (paso === 'inicio' || paso === 'producto-otro') {
            if (paso === 'inicio' && /^otro/i.test(limpio)) {
                msgBot('Sin problema, ¿qué producto tienes en mente?', function () {
                    paso = 'producto-otro';
                });
                return;
            }
            datos.producto = limpio;
            paso = 'idea';
            msgBot('Perfecto: <strong>' + esc(datos.producto) + '</strong>.<br><br>¿Qué quieres poner en él?', function () {
                opciones(OPS_IDEA);
            });
            return;
        }

        if (paso === 'idea') {
            datos.idea = limpio;
            paso = 'cantidad';
            msgBot('¡Se ve bien!<br><br>¿Cuántas unidades necesitas?', function () {
                opciones(OPS_CANTIDAD);
            });
            return;
        }

        if (paso === 'cantidad') {
            datos.cantidad = limpio;
            finalizar();
            return;
        }

        if (paso === 'final') {
            msgBot('Tu pedido está listo para enviar. Si quieres cambiar algo, toca <strong>Empezar de nuevo</strong>.', function () {
                opciones(OPS_FINAL);
            });
        }
    }

    function finalizar() {
        paso = 'final';

        var resumen = '¡Listo! Esto es lo que recibirás en el WhatsApp:<br><br>' +
            '<strong>Producto:</strong> ' + esc(datos.producto) + '<br>' +
            '<strong>Idea / diseño:</strong> ' + esc(datos.idea) + '<br>' +
            '<strong>Cantidad:</strong> ' + esc(datos.cantidad);

        var texto = 'Hola Darlin, quiero hacer un pedido desde la página web:\n\n' +
            'Producto: ' + datos.producto + '\n' +
            'Idea / diseño: ' + datos.idea + '\n' +
            'Cantidad: ' + datos.cantidad + '\n\n' +
            '(Mensaje enviado desde la página)';

        var url = 'https://wa.me/' + TELEFONO + '?text=' + encodeURIComponent(texto);

        msgBot(resumen, function (burbuja) {
            var enlace = document.createElement('a');
            enlace.className = 'btn btn-whatsapp chat-wa';
            enlace.href = url;
            enlace.target = '_blank';
            enlace.rel = 'noopener';
            enlace.innerHTML = '<i class="bi-whatsapp me-2"></i>Enviar por WhatsApp';
            burbuja.appendChild(enlace);
            bajar();
            opciones(OPS_FINAL);
        });
    }

    function reiniciar() {
        datos = { producto: '', idea: '', cantidad: '' };
        limpiarOpciones();
        msgBot('Perfecto, vamos de nuevo.', function () {
            preguntarInicio();
        });
    }

    function responder(texto, esChip) {
        limpiarOpciones();
        msgUsuario(texto);

        if (paso === 'final' && /^empezar de nuevo$/i.test(texto.trim())) {
            reiniciar();
            return;
        }

        manejar(texto, esChip);
    }

    /* --------------------------- VENTANA --------------------------- */

    function abrir() {
        ventana.classList.add('visible');
        ventana.setAttribute('aria-hidden', 'false');
        btnAbrir.setAttribute('aria-expanded', 'true');
        btnAbrir.hidden = true;

        if (!encendido) {
            encendido = true;
            preguntarInicio();
        }

        window.setTimeout(function () {
            entrada.focus();
        }, 250);
    }

    function cerrar() {
        ventana.classList.remove('visible');
        ventana.setAttribute('aria-hidden', 'true');
        btnAbrir.setAttribute('aria-expanded', 'false');
        btnAbrir.hidden = false;
        btnAbrir.focus();
    }

    btnAbrir.addEventListener('click', abrir);

    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrar);
    }

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape' && ventana.classList.contains('visible')) {
            cerrar();
        }
    });

    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();
        var texto = entrada.value.trim();
        if (!texto) {
            return;
        }
        entrada.value = '';
        limpiarOpciones();
        msgUsuario(texto);
        manejar(texto, false);
    });
})();
