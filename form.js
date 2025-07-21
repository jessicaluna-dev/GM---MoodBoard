

window.addEventListener("load", () => {
    const preloader = document.getElementById("preloader");
    const estudio = document.getElementById("estudio");
    const texto = "ESTUDIO DE ARQUITECTURA";
    let index = 0;

    function escribir() {
        if (index < texto.length) {
            estudio.innerHTML += texto.charAt(index);
            index++;
            setTimeout(escribir, 100);
        } else {
            setTimeout(() => {
                preloader.classList.add("lift");
                setTimeout(() => {
                    preloader.style.display = "none";
                    iniciarFormulario();
                }, 2000);
            }, 1000);
        }
    }

    escribir();
});

let preguntaActual = 0;
const preguntas = document.querySelectorAll(".pregunta");
const siguienteBtn = document.getElementById("siguienteBtn");
const volverBtn = document.getElementById("volverBtn");

function iniciarFormulario() {
    preguntas.forEach((p, i) => {
        p.classList.toggle("pregunta-active", i === 0);
        p.classList.toggle("hidden", i !== 0);
    });
    actualizarBotones();
}

function actualizarBotones() {
    volverBtn.style.display = preguntaActual > 0 ? "inline-block" : "none";
    siguienteBtn.textContent = preguntaActual === preguntas.length - 1 ? "Finalizar" : "Siguiente";
}

siguienteBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const actual = preguntas[preguntaActual];

    let inputValido = false;
    const inputsRadio = actual.querySelectorAll("input[type='radio']");
    const inputText = actual.querySelector("input[type='text']");

    if (inputsRadio.length > 0) {
        inputValido = Array.from(inputsRadio).some((input) => input.checked);
    } else if (inputText) {
        inputValido = inputText.value.trim() !== "" && inputText.checkValidity();
    }

    if (!inputValido) {
        if (inputText) inputText.reportValidity();
        else alert("Por favor, responde la pregunta.");
        return false;
    }

    actual.classList.remove("pregunta-active");
    actual.classList.add("hidden");

    preguntaActual++;

    if (preguntaActual < preguntas.length) {
        preguntas[preguntaActual].classList.remove("hidden");
        preguntas[preguntaActual].classList.add("pregunta-active");
        actualizarBotones();
    } else {
        mostrarMensajeFinal();
    }

    return false;
});

volverBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (preguntaActual === 0) return false;

    preguntas[preguntaActual].classList.remove("pregunta-active");
    preguntas[preguntaActual].classList.add("hidden");

    preguntaActual--;

    preguntas[preguntaActual].classList.remove("hidden");
    preguntas[preguntaActual].classList.add("pregunta-active");
    actualizarBotones();

    return false;
});

// Mostrar mensaje final y luego SOLO el moodboard (sin IA automática)
function mostrarMensajeFinal() {
    const formulario = document.getElementById("formulario");
    const mensaje = document.getElementById("mensajeFinal");
    const logo = document.querySelector(".form-container img");

    formulario.style.display = "none";
    if (logo) logo.style.display = "none";

    mensaje.classList.remove("hidden");
    mensaje.style.opacity = 0;
    mensaje.style.transform = "translateY(0)";
    mensaje.style.transition = "opacity 2s ease, transform 2s ease";

    void mensaje.offsetWidth;
    mensaje.style.opacity = 1;

    setTimeout(() => {
        mensaje.style.opacity = 0;
        mensaje.style.transform = "translateY(-100px)";
        mensaje.addEventListener(
            "transitionend",
            () => {
                mensaje.classList.add("hidden");
                mostrarMoodboardSinIA();
            },
            { once: true }
        );
    }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded - inicializando event listeners");

    // PREVENIR SUBMIT DEL FORMULARIO COMPLETAMENTE
    const formulario = document.getElementById("formulario");
    if (formulario) {
        // Remover cualquier action que pueda tener
        formulario.removeAttribute("action");
        formulario.removeAttribute("method");

        // Interceptar cualquier intento de envío del formulario
        formulario.addEventListener("submit", function (event) {
            console.log("⛔ Submit interceptado y cancelado");
            event.preventDefault();
            event.stopImmediatePropagation();
            return false;
        });


    }


    // Event listener único para el botón de generar IA - CON MÚLTIPLES PREVENCIONES
    const generateBtn = document.getElementById("generateAIImageBtn");
    if (generateBtn) {
        // Asegurar que es un botón y no un submit
        generateBtn.type = "button";

        generateBtn.addEventListener("click", function (event) {
            console.log("🎨 Botón de generar IA clickeado");

            // MÚLTIPLE PREVENCIÓN DE COMPORTAMIENTOS DEFAULT
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            // Llamar la función de generación
            generarImagenIA(event);

            return false;
        });

        // Event listener adicional para mousedown como backup
        generateBtn.addEventListener("mousedown", function (event) {
            event.preventDefault();
            event.stopPropagation();
        });

    } else {
        console.log("⚠️ Botón generateAIImageBtn no encontrado");
    }
});

// Función para mostrar moodboard SIN generar IA automáticamente
async function mostrarMoodboardSinIA() {
    console.log("Mostrando moodboard sin generar IA automáticamente");
    const moodboard = document.getElementById("moodboard");
    moodboard.classList.remove("hidden");
    moodboard.classList.add("animate-up");

    const collageImages = document.getElementById("collage-images");
    const collageTexts = document.getElementById("collage-texts");

    collageImages.innerHTML = "";
    collageTexts.innerHTML = "";

    // Agregar título con nombre del cliente
    const nombreCliente = document.querySelector("input[name='nombre']")?.value || "Cliente";
    const titulo = document.createElement("h2");
    titulo.textContent = nombreCliente;
    collageTexts.appendChild(titulo);

    const respuestas = [];
    const contWidth = collageImages.clientWidth;
    const contHeight = collageImages.clientHeight;
    const imgMaxWidth = 200;
    const imgMaxHeight = 200;

    document.querySelectorAll(".pregunta").forEach((pregunta) => {
        const inputTexto = pregunta.querySelector("input[type='text']");
        if (inputTexto && inputTexto.name === "nombre") return;

        const seleccion = pregunta.querySelector("input[type='radio']:checked");
        if (seleccion) {
            const imagen = seleccion.parentElement.querySelector("img");
            if (imagen) {
                const nuevaImg = document.createElement("img");
                nuevaImg.src = imagen.src;
                nuevaImg.alt = seleccion.value;

                const posX = Math.random() * (contWidth - imgMaxWidth);
                const posY = Math.random() * (contHeight - imgMaxHeight);
                Object.assign(nuevaImg.style, {
                    position: "absolute",
                    left: `${posX}px`,
                    top: `${posY}px`,
                    maxWidth: `${imgMaxWidth}px`,
                    maxHeight: `${imgMaxHeight}px`,
                    cursor: "grab",
                    userSelect: "none",
                });

                collageImages.appendChild(nuevaImg);

                if (typeof makeDraggable === 'function') {
                    makeDraggable(nuevaImg);
                } else {
                    console.warn("makeDraggable function not found");
                }
            }
            respuestas.push(seleccion.value);
        } else if (inputTexto && inputTexto.value.trim() !== "") {
            respuestas.push(inputTexto.value.trim());
        }
    });

    // 🔹 Agregar respuestas dentro del moodboard en collage-texts
    const respuestasContainer = document.createElement("div");
    respuestasContainer.innerHTML = `<p><strong>Respuestas seleccionadas:</strong></p><ul>${respuestas.map(respuesta => `<li>${respuesta}</li>`).join("")}</ul>`;
    collageTexts.appendChild(respuestasContainer);

    // Mostrar el botón de generar IA después del moodboard
    const aiSection = document.getElementById("ai-generation");
    if (aiSection) {
        aiSection.style.display = "block";
        console.log("✅ Moodboard mostrado con respuestas. Botón de IA disponible para click manual.");
    }
}

// FUNCIÓN CORREGIDA para generar imagen IA - SIN NAVEGACIÓN

async function generarImagenIA(event) {
    console.log("🎨 Iniciando generación de IA por click manual del botón");

    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    try {
        const respuestas = [];
        document.querySelectorAll(".pregunta").forEach((pregunta) => {
            const inputTexto = pregunta.querySelector("input[type='text']");
            if (inputTexto && inputTexto.name === "nombre") return;

            const seleccion = pregunta.querySelector("input[type='radio']:checked");
            if (seleccion) {
                respuestas.push(seleccion.value);
            } else if (inputTexto && inputTexto.value.trim() !== "") {
                respuestas.push(inputTexto.value.trim());
            }
        });

        if (respuestas.length === 0) {
            alert("Por favor, selecciona al menos una opción antes de generar la imagen.");
            return false;
        }

        // Obtén el botón
        const generateBtn = document.getElementById("generateAIImageBtn");
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = "🎨 Generando...";
        }

        console.log("Enviando solicitud al backend...");
        const response = await fetch("http://localhost:3000/generate-prompt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ respuestas }),
        });

        console.log("Respuesta del backend recibida:", response);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error del backend:", response.status, errorText);

            generateBtn.innerHTML = "Generar Imagen con IA";
            generateBtn.disabled = false;

            return false;
        }

        const data = await response.json();
        console.log("📄 Datos procesados desde el backend:", data);

        if (!data || data.error) {
            throw new Error(data.error || "No se pudo generar la imagen.");
        }

        mostrarImagenGenerada(data.imagenIA, data.prompt, respuestas);

        // Restaurar botón después de la generación
        generateBtn.innerHTML = "🎨 Generar imagen con IA";
        generateBtn.disabled = false;

        return false;

    } catch (error) {
        console.error("Error en la generación de imagen:", error);

        const generateBtn = document.getElementById("generateAIImageBtn");
        if (generateBtn) {
            generateBtn.innerHTML = "Generar Imagen con IA";
            generateBtn.disabled = false;
        }

        return false;
    }
}

async function mostrarImagenGenerada(url, promptText) {
    console.log("URL recibida en el frontend:", url);

    try {
        // Obtener elementos del modal
        let imageModal = document.getElementById("imageModal");
        let generatedImage = document.getElementById("generatedImage");
        let downloadBtn = document.getElementById("downloadImageBtn");
        let generateNewBtn = document.getElementById("generateNewImageBtn");
        let closeModal = document.querySelector(".close");

        if (!imageModal || !generatedImage || !downloadBtn || !generateNewBtn || !closeModal) {
            console.error("No se encontraron los elementos del modal");
            return;
        }

        // Mostrar el modal si aún no está visible
        imageModal.style.display = "flex";

        // Mostrar indicador de carga en lugar de la imagen
        generatedImage.style.display = "none"; 
        generatedImage.insertAdjacentHTML("afterend", `<div id="loading-indicator">⏳ Generando imagen...</div>`);

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            // Configurar enlace de descarga
            downloadBtn.href = blobUrl;
            downloadBtn.download = "imagen_IA.png";

            console.log("✅ Imagen lista para descargar");

            // Remover indicador de carga si existe
            const loadingIndicator = document.getElementById("loading-indicator");
            if (loadingIndicator) loadingIndicator.remove();

            generatedImage.style.display = "block";
            generatedImage.src = blobUrl;

        } catch (error) {
            console.error("❌ Error al generar la imagen:", error);
        }

        // 🔄 Generar nueva imagen sin cerrar el modal
        generateNewBtn.onclick = async function () {
            console.log("🔄 Generando nueva imagen...");

            // Capturar respuestas antes de enviar la solicitud
            const respuestas = [];
            document.querySelectorAll(".pregunta").forEach((pregunta) => {
                const seleccion = pregunta.querySelector("input[type='radio']:checked");
                if (seleccion) respuestas.push(seleccion.value);
            });

            if (respuestas.length === 0) {
                console.error("❌ No hay respuestas seleccionadas, cancelando solicitud.");
                alert("Por favor, selecciona al menos una opción antes de generar una nueva imagen.");
                return;
            }

            console.log("📌 Datos enviados al backend:", JSON.stringify({ respuestas }));

            // Mostrar indicador de carga nuevamente
            generatedImage.style.display = "none";
            document.getElementById("loading-indicator")?.remove();
            generatedImage.insertAdjacentHTML("afterend", `<div id="loading-indicator">⏳ Generando nueva imagen...</div>`);

            try {
                const newResponse = await fetch("http://localhost:3000/generate-prompt", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ respuestas }), // Ahora enviamos respuestas válidas
                });

                if (!newResponse.ok) {
                    console.error("❌ Error en la generación de nueva imagen");
                    return;
                }

                const newData = await newResponse.json();
                console.log("📌 Nueva imagen recibida del backend:", newData);

                // Convertir imagen a blob para asegurar la descarga y visualización
                const newBlob = await fetch(newData.imagenIA).then(res => res.blob());
                const newBlobUrl = URL.createObjectURL(newBlob);

                // Remover indicador de carga si existe
                const loadingIndicator = document.getElementById("loading-indicator");
                if (loadingIndicator) loadingIndicator.remove();

                // Actualizar la imagen en el modal
                generatedImage.src = newBlobUrl;
                generatedImage.style.display = "block";

                // Actualizar el botón de descarga con la nueva imagen
                downloadBtn.href = newBlobUrl;
                downloadBtn.download = "imagen_IA_nueva.png";

                console.log("✅ Nueva imagen generada y mostrada en el modal");

            } catch (error) {
                console.error("❌ Error al generar la nueva imagen:", error);
            }
        };

        console.log("🖼️ Imagen mostrada exitosamente en el modal");

    } catch (error) {
        console.error("Error al mostrar imagen generada:", error);
    }
}



// Función makeDraggable original
function makeDraggable(el) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    el.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - el.getBoundingClientRect().left;
        offsetY = e.clientY - el.getBoundingClientRect().top;
        el.style.zIndex = "600";
        el.style.cursor = "grabbing";
        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        el.style.left = `${e.clientX - offsetX}px`;
        el.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        el.style.cursor = "grab";
    });
}

// Descargar collage como imagen
document.getElementById("downloadBtn").addEventListener("click", (e) => {
  e.preventDefault();
  const moodboard = document.getElementById("collage-container");
  html2canvas(moodboard).then((canvas) => {
    const link = document.createElement("a");
    link.download = "moodboard.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
});

// Añadir nota al collage
document.getElementById("addNoteBtn").addEventListener("click", (e) => {
  e.preventDefault();
  const note = document.createElement("div");
  note.className = "note";
  note.contentEditable = true;
  note.textContent = "Escribe algo...";
  Object.assign(note.style, {
    position: "absolute",
    left: "100px",
    top: "100px",
    zIndex: "500",
  });
  document.getElementById("collage-images").appendChild(note);
  makeDraggable(note);

  note.addEventListener("dblclick", () => {
    if (confirm("¿Eliminar esta nota?")) note.remove();
  });
});

// Flechas
let drawingArrow = false, arrowStart = null, visibleArrow = null, clickableArrow = null, arrowGroup = null, svgOverlay = null;

document.getElementById("addArrowBtn").addEventListener("click", (e) => {
  e.preventDefault();
  drawingArrow = true;
  arrowStart = null;
  document.getElementById("collage-images").style.cursor = "crosshair";

  if (!svgOverlay) {
    svgOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgOverlay.setAttribute("class", "arrow-layer");
    Object.assign(svgOverlay.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "0",
    });

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "10");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");

    const arrowShape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrowShape.setAttribute("points", "0 0, 10 3.5, 0 7");
    arrowShape.setAttribute("fill", "#777");

    marker.appendChild(arrowShape);
    defs.appendChild(marker);
    svgOverlay.appendChild(defs);

    document.getElementById("collage-images").appendChild(svgOverlay);

    svgOverlay.addEventListener("dblclick", (e) => {
      const target = e.target;
      if (target.tagName === "path" && target.classList.contains("clickable-path")) {
        e.stopPropagation();
        if (confirm("¿Eliminar esta flecha?")) {
          const group = target.closest("g");
          if (group) group.remove();
        }
      }
    });
  }

  svgOverlay.style.pointerEvents = "auto";
  svgOverlay.style.zIndex = "1000";
});

document.getElementById("collage-images").addEventListener("mousedown", (e) => {
  if (!drawingArrow) return;

  const rect = svgOverlay.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  arrowStart = { x, y };

  arrowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

  clickableArrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
  clickableArrow.setAttribute("stroke", "transparent");
  clickableArrow.setAttribute("stroke-width", "15");
  clickableArrow.setAttribute("fill", "none");
  clickableArrow.classList.add("clickable-path");
  clickableArrow.style.pointerEvents = "all";

  visibleArrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
  visibleArrow.setAttribute("stroke", "#777");
  visibleArrow.setAttribute("stroke-width", "2");
  visibleArrow.setAttribute("fill", "none");
  visibleArrow.setAttribute("marker-end", "url(#arrowhead)");
  visibleArrow.style.pointerEvents = "none";

  arrowGroup.appendChild(clickableArrow);
  arrowGroup.appendChild(visibleArrow);
  svgOverlay.appendChild(arrowGroup);
});

document.getElementById("collage-images").addEventListener("mousemove", (e) => {
  if (!drawingArrow || !arrowStart) return;

  const rect = svgOverlay.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const midX = (arrowStart.x + x) / 2;
  const midY = (arrowStart.y + y) / 2 - 50;

  const d = `M ${arrowStart.x},${arrowStart.y} Q ${midX},${midY} ${x},${y}`;
  visibleArrow.setAttribute("d", d);
  clickableArrow.setAttribute("d", d);
});

document.getElementById("collage-images").addEventListener("mouseup", () => {
  if (!drawingArrow) return;

  drawingArrow = false;
  arrowStart = null;
  visibleArrow = null;
  clickableArrow = null;
  arrowGroup = null;

  document.getElementById("collage-images").style.cursor = "default";
  svgOverlay.style.pointerEvents = "none";
  svgOverlay.style.zIndex = "0";
});



document.getElementById("restartPageBtn").onclick = function () {
    console.log("🔄 Reiniciando la página...");
    location.reload(); // Recarga completamente la página
};



