const form = document.getElementById("ticketForm");
const btnLimpiar = document.getElementById("btnLimpiar");
const mensaje = document.getElementById("mensaje");
const popupExito = document.getElementById("popupExito");
const popupTexto = document.getElementById("popupTexto");
const cerrarPopup = document.getElementById("cerrarPopup");
const ticketIdInput = document.getElementById("ticketId");
const btnEnviar = document.getElementById("btnEnviar");

const inputEvidencias = document.getElementById("evidencias");
const listaAdjuntos = document.getElementById("listaAdjuntos");
const btnLimpiarAdjuntos = document.getElementById("btnLimpiarAdjuntos");
const loaderEnvio = document.getElementById("loaderEnvio");

const formView = document.getElementById("formView");
const seguimientoView = document.getElementById("seguimientoView");
const btnSeguimientoCaso = document.getElementById("btnSeguimientoCaso");
const btnVolverFormulario = document.getElementById("btnVolverFormulario");
const btnRefrescarSeguimiento = document.getElementById("btnRefrescarSeguimiento");
const buscarSeguimiento = document.getElementById("buscarSeguimiento");
const seguimientoTableBody = document.getElementById("seguimientoTableBody");
const seguimientoResumen = document.getElementById("seguimientoResumen");

const API_URL = "https://script.google.com/macros/s/AKfycbzjRlVJhY28EsIzi1r1i9npHwRWitY8vlNLSXadr6QzqA2EgbKpZY1VZSIPPLkqmBntPA/exec";

/*
  Esta es la API del dashboard/seguimiento.
  Debe ser el despliegue donde existe accion=obtenerTickets.
*/
const API_SEGUIMIENTO_URL = "https://script.google.com/macros/s/AKfycbyH61t1jGJTog6IKxBu5NjmwGP09XXKFKV8G7nNifzu8eRhAEv3P5x8aDIlS3-iilxe/exec";

let archivosAdjuntos = [];
let ticketsSeguimiento = [];

/* =========================
   BLOQUEAR ENTER EN EL FORM
========================= */
if (form) {
  form.addEventListener("keydown", function (e) {
    const tag = e.target.tagName.toLowerCase();

    if (e.key === "Enter" && tag !== "textarea" && e.target !== btnEnviar) {
      e.preventDefault();
    }
  });
}

/* =========================
   LOADER DE ENVÍO
========================= */
function mostrarLoaderEnvio() {
  if (loaderEnvio) {
    loaderEnvio.classList.add("active");
  }
}

function ocultarLoaderEnvio() {
  if (loaderEnvio) {
    loaderEnvio.classList.remove("active");
  }
}

/* =========================
   VISTAS
========================= */
if (btnSeguimientoCaso) {
  btnSeguimientoCaso.addEventListener("click", async function () {
    mostrarVistaSeguimiento();

    if (!ticketsSeguimiento.length) {
      await cargarTicketsSeguimiento();
    }
  });
}

if (btnVolverFormulario) {
  btnVolverFormulario.addEventListener("click", function () {
    mostrarVistaFormulario();
  });
}

if (btnRefrescarSeguimiento) {
  btnRefrescarSeguimiento.addEventListener("click", cargarTicketsSeguimiento);
}

if (buscarSeguimiento) {
  buscarSeguimiento.addEventListener("input", renderizarTablaSeguimiento);
}

function mostrarVistaSeguimiento() {
  if (formView) formView.classList.add("hidden");
  if (seguimientoView) seguimientoView.classList.remove("hidden");
}

function mostrarVistaFormulario() {
  if (seguimientoView) seguimientoView.classList.add("hidden");
  if (formView) formView.classList.remove("hidden");
}

/* =========================
   AUTOCOMPLETADO DE SITES
========================= */
const buscadorSite = document.getElementById("buscadorSite");
const sugerenciasSite = document.getElementById("sugerenciasSite");
const inputCodigoUnico = document.getElementById("codigoUnico");
const inputSite = document.getElementById("site");
const inputTorrero = document.getElementById("torrero");

function normalizarBusqueda(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obtenerSitesDataSeguro() {
  if (typeof sitesData !== "undefined" && Array.isArray(sitesData)) {
    return sitesData;
  }

  if (window.sitesData && Array.isArray(window.sitesData)) {
    return window.sitesData;
  }

  return [];
}

if (buscadorSite && sugerenciasSite) {
  buscadorSite.addEventListener("input", function () {
    const texto = normalizarBusqueda(buscadorSite.value);

    inputCodigoUnico.value = "";
    inputSite.value = "";
    inputTorrero.value = "";

    if (texto.length < 2) {
      ocultarSugerencias();
      return;
    }

    const dataSites = obtenerSitesDataSeguro();

    if (!dataSites.length) {
      sugerenciasSite.innerHTML = `
        <div class="autocomplete-empty">
          No se encontró cargado el archivo sites-data.js.
        </div>
      `;
      sugerenciasSite.style.display = "block";
      return;
    }

    const resultados = dataSites.filter((item) => {
      const codigo = normalizarBusqueda(item.codigoUnico);
      const site = normalizarBusqueda(item.site);
      const torrero = normalizarBusqueda(item.torrero);

      return (
        codigo.includes(texto) ||
        site.includes(texto) ||
        torrero.includes(texto)
      );
    }).slice(0, 15);

    renderizarSugerencias(resultados);
  });

  buscadorSite.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      ocultarSugerencias();
    }
  });

  document.addEventListener("click", function (e) {
    if (!sugerenciasSite.contains(e.target) && e.target !== buscadorSite) {
      ocultarSugerencias();
    }
  });
}

function renderizarSugerencias(resultados) {
  sugerenciasSite.innerHTML = "";

  if (!resultados.length) {
    sugerenciasSite.innerHTML = `
      <div class="autocomplete-empty">
        Sin coincidencias. Pruebe con código único, site o torrero existente.
      </div>
    `;
    sugerenciasSite.style.display = "block";
    return;
  }

  resultados.forEach((item) => {
    const div = document.createElement("div");
    div.className = "autocomplete-item";
    div.textContent = `${item.codigoUnico || ""} | ${item.site || ""} | ${item.torrero || ""}`;

    div.addEventListener("click", function () {
      inputCodigoUnico.value = item.codigoUnico || "";
      inputSite.value = item.site || "";
      inputTorrero.value = item.torrero || "";
      buscadorSite.value = `${item.codigoUnico || ""} | ${item.site || ""} | ${item.torrero || ""}`;
      ocultarSugerencias();
    });

    sugerenciasSite.appendChild(div);
  });

  sugerenciasSite.style.display = "block";
}

function ocultarSugerencias() {
  if (!sugerenciasSite) return;
  sugerenciasSite.style.display = "none";
  sugerenciasSite.innerHTML = "";
}

/* =========================
   ADJUNTOS ACUMULABLES
========================= */
if (inputEvidencias) {
  inputEvidencias.addEventListener("change", function () {
    agregarArchivosAdjuntos(inputEvidencias.files);
    inputEvidencias.value = "";
  });
}

if (btnLimpiarAdjuntos) {
  btnLimpiarAdjuntos.addEventListener("click", function () {
    archivosAdjuntos = [];
    renderizarListaAdjuntos();
  });
}

function agregarArchivosAdjuntos(fileList) {
  const nuevosArchivos = Array.from(fileList || []);

  if (!nuevosArchivos.length) return;

  nuevosArchivos.forEach((file) => {
    if (!file.type.startsWith("image/")) {
      mostrarMensaje(`El archivo "${file.name}" no es una imagen.`, "red");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      mostrarMensaje(`El archivo "${file.name}" supera los 5 MB.`, "red");
      return;
    }

    const existe = archivosAdjuntos.some((item) =>
      item.name === file.name &&
      item.size === file.size &&
      item.lastModified === file.lastModified
    );

    if (!existe) {
      archivosAdjuntos.push(file);
    }
  });

  renderizarListaAdjuntos();
}

function renderizarListaAdjuntos() {
  if (!listaAdjuntos) return;

  if (!archivosAdjuntos.length) {
    listaAdjuntos.innerHTML = `<div class="attachments-empty">Aún no hay imágenes seleccionadas.</div>`;
    return;
  }

  listaAdjuntos.innerHTML = "";

  archivosAdjuntos.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "attachment-item";

    item.innerHTML = `
      <div class="attachment-info">
        <strong>${escapeHtml(file.name)}</strong>
        <span>${formatearPesoArchivo(file.size)}</span>
      </div>
      <button type="button" class="attachment-remove" data-index="${index}">
        Eliminar
      </button>
    `;

    listaAdjuntos.appendChild(item);
  });

  document.querySelectorAll(".attachment-remove").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = Number(btn.dataset.index);
      archivosAdjuntos.splice(index, 1);
      renderizarListaAdjuntos();
    });
  });
}

function formatearPesoArchivo(bytes) {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
}

/* =========================
   ENVÍO DEL FORMULARIO
========================= */
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  mensaje.textContent = "";
  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";
  mostrarLoaderEnvio();

  try {
    const correo = document.getElementById("correo").value.trim();

    if (correo && !validarCorreo(correo)) {
      ocultarLoaderEnvio();
      mostrarMensaje("Ingrese un correo válido.", "red");
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Enviar";
      return;
    }

    const evidencias = await convertirArchivosBase64(archivosAdjuntos);

    const data = {
      asunto: document.getElementById("asunto").value.trim(),
      reportadoPor: document.getElementById("reportadoPor").value.trim(),
      correo: correo,
      empresa: document.getElementById("empresa").value.trim(),
      areaTdp: document.getElementById("areaTdp").value.trim(),
      site: document.getElementById("site").value.trim(),
      codigoUnico: document.getElementById("codigoUnico").value.trim(),
      sitioCoubicado: getRadioValue("sitioCoubicado"),
      torrero: document.getElementById("torrero").value.trim(),
      impedimientoTrabajos: getRadioValue("impedimientoTrabajos"),
      tipoIncidencia: document.getElementById("tipoIncidencia").value,
      descripcionIncidencia: document.getElementById("descripcionIncidencia").value.trim(),
      sitioIncidencia: getCheckboxValues("sitioIncidencia"),
      tipoMantenimiento: document.getElementById("tipoMantenimiento").value,
      tipoAfectacion: document.getElementById("tipoAfectacion").value,
      ticketAtencion: document.getElementById("ticketAtencion").value.trim(),
      paraTorrera: "",
      evidencias: evidencias
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.status === "success") {
      const idGenerado = result.ticketId || "SIN_ID";
      ticketIdInput.value = idGenerado;
      popupTexto.textContent = `${idGenerado} registrado y notificado.`;

      limpiarFormularioCompleto();

      ocultarLoaderEnvio();
      popupExito.classList.add("active");
    } else {
      ocultarLoaderEnvio();
      mostrarMensaje(result.message || "Ocurrió un error al guardar.", "red");
    }
  } catch (error) {
    console.error(error);
    ocultarLoaderEnvio();
    mostrarMensaje(error.message || "Error de conexión al guardar el registro.", "red");
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = "Enviar";
  }
});

btnLimpiar.addEventListener("click", function () {
  limpiarFormularioCompleto();
  ticketIdInput.value = "Generado automáticamente";
});

cerrarPopup.addEventListener("click", function () {
  popupExito.classList.remove("active");
  ticketIdInput.value = "Generado automáticamente";
});

function limpiarFormularioCompleto() {
  form.reset();
  mensaje.textContent = "";

  archivosAdjuntos = [];
  renderizarListaAdjuntos();

  if (buscadorSite) buscadorSite.value = "";
  if (inputCodigoUnico) inputCodigoUnico.value = "";
  if (inputSite) inputSite.value = "";
  if (inputTorrero) inputTorrero.value = "";

  ocultarSugerencias();
}

function getRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
}

function getCheckboxValues(name) {
  const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checked).map(el => el.value).join(", ");
}

async function convertirArchivosBase64(fileList) {
  const archivos = Array.from(fileList || []);
  const resultado = [];

  for (const file of archivos) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`El archivo ${file.name} no es una imagen.`);
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`El archivo ${file.name} supera los 5 MB.`);
    }

    const base64 = await leerArchivoComoBase64(file);

    resultado.push({
      nombre: file.name,
      tipo: file.type,
      contenido: base64.split(",")[1]
    });
  }

  return resultado;
}

function leerArchivoComoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* =========================
   SEGUIMIENTO DE CASOS
========================= */
async function cargarTicketsSeguimiento() {
  if (!seguimientoTableBody) return;

  seguimientoTableBody.innerHTML = `
    <tr>
      <td colspan="10" class="seguimiento-empty">Cargando tickets...</td>
    </tr>
  `;

  if (seguimientoResumen) {
    seguimientoResumen.textContent = "Cargando tickets...";
  }

  try {
    const response = await fetch(`${API_SEGUIMIENTO_URL}?accion=obtenerTickets`, {
      method: "GET",
      cache: "no-store"
    });

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("La API de seguimiento no devolvió una lista válida.");
    }

    ticketsSeguimiento = data.map(ticket => ({
      ...ticket,
      DIAS_CALCULADOS: calcularDiasTicketSeguimiento(ticket.FECHA_REGISTRO, ticket.FECHA_CIERRE)
    }));

    renderizarTablaSeguimiento();
  } catch (error) {
    console.error(error);

    seguimientoTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="seguimiento-empty">
          No se pudo cargar la información de seguimiento.
        </td>
      </tr>
    `;

    if (seguimientoResumen) {
      seguimientoResumen.textContent = "Error al cargar tickets.";
    }
  }
}

function renderizarTablaSeguimiento() {
  if (!seguimientoTableBody) return;

  const texto = normalizarBusqueda(buscarSeguimiento?.value || "");

  const filtrados = ticketsSeguimiento.filter(ticket => {
    const campos = [
      ticket.FECHA_REGISTRO,
      ticket.ID,
      ticket.CU,
      ticket.SITE,
      ticket.INCIDENCIA,
      ticket.AFECTACION,
      ticket.TORRERO,
      ticket.ESTADO,
      ticket.RESPONSABLE,
      ticket.DIAS_CALCULADOS
    ].map(valor => normalizarBusqueda(valor));

    return texto === "" || campos.some(valor => valor.includes(texto));
  });

  if (seguimientoResumen) {
    seguimientoResumen.textContent = `Tickets cargados: ${filtrados.length}`;
  }

  if (!filtrados.length) {
    seguimientoTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="seguimiento-empty">No se encontraron tickets.</td>
      </tr>
    `;
    return;
  }

  seguimientoTableBody.innerHTML = "";

  filtrados.forEach(ticket => {
    const tr = document.createElement("tr");

    const responsable = String(ticket.RESPONSABLE || "Sin asignar").trim() || "Sin asignar";

    tr.innerHTML = `
      <td title="${escapeAttribute(formatearFechaSeguimiento(ticket.FECHA_REGISTRO))}">
        ${escapeHtml(formatearFechaSeguimiento(ticket.FECHA_REGISTRO))}
      </td>
      <td title="${escapeAttribute(ticket.ID || "")}">
        ${escapeHtml(ticket.ID || "")}
      </td>
      <td title="${escapeAttribute(ticket.CU || "")}">
        ${escapeHtml(ticket.CU || "")}
      </td>
      <td title="${escapeAttribute(ticket.SITE || "")}">
        ${escapeHtml(ticket.SITE || "")}
      </td>
      <td title="${escapeAttribute(ticket.INCIDENCIA || "")}">
        ${escapeHtml(ticket.INCIDENCIA || "")}
      </td>
      <td title="${escapeAttribute(ticket.AFECTACION || "")}">
        ${escapeHtml(ticket.AFECTACION || "")}
      </td>
      <td title="${escapeAttribute(ticket.TORRERO || "")}">
        ${escapeHtml(ticket.TORRERO || "")}
      </td>
      <td>
        <span class="badge-status ${obtenerClaseEstadoSeguimiento(ticket.ESTADO)}">
          ${escapeHtml(ticket.ESTADO || "")}
        </span>
      </td>
      <td title="${escapeAttribute(responsable)}">
        ${escapeHtml(responsable)}
      </td>
      <td>
        ${ticket.DIAS_CALCULADOS ?? 0}
      </td>
    `;

    seguimientoTableBody.appendChild(tr);
  });
}

function obtenerClaseEstadoSeguimiento(estado) {
  const texto = normalizarBusqueda(estado);

  if (texto.includes("cerrado")) return "badge-cerrado";
  if (texto.includes("abierto")) return "badge-abierto";
  if (texto.includes("proceso")) return "badge-proceso";

  return "badge-otro";
}

function calcularDiasTicketSeguimiento(fechaRegistro, fechaCierre) {
  const fechaInicio = convertirAFechaLocalSeguimiento(fechaRegistro);
  if (!fechaInicio) return 0;

  const fechaFin = convertirAFechaLocalSeguimiento(fechaCierre) || obtenerHoyPeruSoloFechaSeguimiento();

  const diferenciaMs = fechaFin - fechaInicio;
  const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

  return dias >= 0 ? dias : 0;
}

function convertirAFechaLocalSeguimiento(fechaValor) {
  if (!fechaValor) return null;

  const fecha = new Date(fechaValor);
  if (isNaN(fecha.getTime())) return null;

  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function obtenerHoyPeruSoloFechaSeguimiento() {
  const hoyPeruTexto = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  return new Date(`${hoyPeruTexto}T00:00:00`);
}

function formatearFechaSeguimiento(fecha) {
  if (!fecha) return "-";

  const d = new Date(fecha);
  if (isNaN(d.getTime())) return String(fecha);

  return d.toLocaleString("es-PE", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* =========================
   UTILIDADES
========================= */
function validarCorreo(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo || "").trim());
}

function mostrarMensaje(texto, color) {
  mensaje.textContent = texto;
  mensaje.style.color = color;
}

function escapeHtml(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
