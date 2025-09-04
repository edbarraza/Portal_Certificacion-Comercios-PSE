/**
 * =============================================================================
 * CERTIFICACIÓN API - JAVASCRIPT PRINCIPAL
 * Funcionalidades para el checklist de certificación
 * =============================================================================
 */

// =============================================================================
// CONSTANTES Y CONFIGURACIÓN
// =============================================================================
const ITEMS_PER_PAGE = 2;

// Esquemas de certificación disponibles - Ahora se cargan dinámicamente
let CERTIFICATION_TYPES = {};

// Checklist por defecto (mantenido para compatibilidad)
let checklistItems = [
  { id: 1, texto: "Autenticación OAuth 2.0/OpenID Connect implementada", esperado: "El sistema debe autenticar usando OAuth 2.0 o OpenID Connect, siguiendo los estándares de seguridad." },
  { id: 2, texto: "Uso de tokens JWT válidos", esperado: "Las peticiones deben incluir tokens JWT válidos y no expirados." },
  { id: 3, texto: "Comunicación solo por HTTPS", esperado: "Todas las comunicaciones con la API deben realizarse exclusivamente por HTTPS." },
  { id: 4, texto: "Gestión de expiración y refresh de tokens", esperado: "El sistema debe manejar la expiración de tokens y usar refresh tokens cuando corresponda." },
  { id: 5, texto: "Almacenamiento seguro de credenciales", esperado: "Las credenciales y secretos deben almacenarse de forma segura y nunca exponerse públicamente." },
  { id: 6, texto: "Solicita solo los permisos necesarios", esperado: "El sistema debe solicitar únicamente los permisos (scopes) estrictamente necesarios." },
  { id: 7, texto: "Respeta restricciones de acceso", esperado: "El sistema debe respetar las restricciones de acceso según los permisos otorgados." },
  { id: 8, texto: "Manejo de errores y límites de uso", esperado: "El sistema debe manejar correctamente errores y límites de uso (rate limiting)." },
  { id: 9, texto: "Pruebas de integración y seguridad realizadas", esperado: "Se deben realizar pruebas de integración y seguridad con la API." },
  { id: 10, texto: "Documentación revisada y comprendida", esperado: "El equipo debe haber revisado y comprendido la documentación de autenticación y autorización." }
];

// =============================================================================
// VARIABLES GLOBALES
// =============================================================================
let currentPage = 1;
let camposEstado = {};
let numeroCliente = null;
let clienteSha = null; // Para GitHub API
let clienteActual = null; // Información completa del cliente actual
let tipoChecklistActual = checklistItems; // Items del checklist actual
let lastSelectedEvidencia = null; // Para rastrear el último campo de evidencia seleccionado

// Hacer variables disponibles globalmente para pdf-export.js
window.checklistItems = checklistItems;
window.camposEstado = camposEstado;
window.tipoChecklistActual = tipoChecklistActual;

// =============================================================================
// INICIALIZACIÓN
// =============================================================================
document.addEventListener('DOMContentLoaded', async function() {
  // Prevenir múltiples inicializaciones
  if (window.portalInitialized) {
    console.log('⚠️ Portal ya inicializado, saltando...');
    return;
  }
  window.portalInitialized = true;
  
  console.clear();
  console.log('🎯 Portal de Certificación iniciando...');
  
  // NUEVO: Limpiar localStorage corrupto de forma agresiva
  try {
    console.log('🧹 Limpiando localStorage corrupto...');
    const keysToClean = [];
    
    // Encontrar todas las claves problemáticas
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const value = localStorage.getItem(key);
        if (value && (value.includes('[object Object]') || value === 'undefined' || value === 'null')) {
          keysToClean.push(key);
        }
      } catch (error) {
        keysToClean.push(key);
      }
    }
    
    // Limpiar claves problemáticas
    keysToClean.forEach(key => {
      console.log(`🗑️ Removiendo clave corrupta: ${key}`);
      localStorage.removeItem(key);
    });
    
    console.log('✅ localStorage limpiado');
    
  } catch (error) {
    console.error('❌ Error limpiando localStorage:', error);
    // En caso extremo, limpiar todo
    try {
      localStorage.clear();
      console.log('🔄 localStorage completamente limpiado');
    } catch (e) {
      console.error('❌ No se puede limpiar localStorage:', e);
    }
  }

  // NUEVO: Inicializar sistema de persistencia colaborativo
  try {
    // El UnifiedCollaborativeAdapter maneja la selección automática del mejor sistema
    await collaborativeAdapter.initialize();
    console.log('✅ Sistema de persistencia colaborativo inicializado');
    
    // Mostrar estado del sistema después de 2 segundos
    setTimeout(() => {
      collaborativeAdapter.mostrarEstadoConexion();
    }, 2000);
  } catch (error) {
    console.error('❌ Error inicializando persistencia:', error);
  }
  
  // Usar setTimeout para asegurar que todos los elementos estén cargados
  setTimeout(() => {
    // Solo inicializamos lo necesario para la página de bienvenida
    initializeCleanButton();
    // initializeColorPalettes(); // DESHABILITADO
    initializeWelcomePage();
    initializeNewUXFeatures();
    
    // NUEVO: Inicializar selector de tipos de certificación
    updateCertificationTypeSelector();
    
    // Ocultar la barra lateral inicialmente
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.style.display = 'none';
    }
    
    // Mostrar página de bienvenida por defecto
    showWelcomePage();
    
    console.log('🎯 Inicialización completada');
  }, 100);
});

function initializeWelcomePage() {
  const searchInput = document.getElementById('searchClientInput');
  const searchBtn = document.getElementById('searchBtn');
  const createBtn = document.getElementById('createBtn');
  const backBtn = document.getElementById('backToWelcomeBtn');
  const backBtn2 = document.getElementById('backToWelcomeBtn2');
  
  // Debug: verificar que los elementos existan
  console.log('🔍 Inicializando página de bienvenida...');
  console.log('searchInput:', searchInput);
  console.log('searchBtn:', searchBtn);
  console.log('createBtn:', createBtn);
  
  // Modal elements
  const modal = document.getElementById('createClientModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelCreateBtn = document.getElementById('cancelCreateBtn');
  const confirmCreateBtn = document.getElementById('confirmCreateBtn');
  const clientNitInput = document.getElementById('clientNit');
  const clientNameInput = document.getElementById('clientName');
  const certificationTypeSelect = document.getElementById('certificationType');
  
  // Validar solo números en el input
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
    });
    
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        buscarCliente();
      }
    });
  }
  
  // Event listeners para botones principales
  if (searchBtn) {
    console.log('✅ Conectando evento click al botón de búsqueda');
    
    // Método 1: onclick
    searchBtn.onclick = function(e) {
      e.preventDefault();
      console.log('🔍 Click en botón de búsqueda detectado (onclick)');
      buscarCliente();
    };
    
    // Método 2: addEventListener (backup)
    searchBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('🔍 Click en botón de búsqueda detectado (addEventListener)');
      // No llamamos buscarCliente() aquí para evitar doble ejecución
    });
  } else {
    console.error('❌ Botón de búsqueda no encontrado');
  }
  
  if (createBtn) createBtn.onclick = abrirModalCreacion;
  if (backBtn) backBtn.onclick = showWelcomePage;
  
  // Botón de administración - usar función helper
  setupAdminButton();
  
  // También configurar cuando haga click (como fallback)
  document.addEventListener('click', function(e) {
    if (e.target && e.target.closest('#adminBtn')) {
      console.log('🔧 Click detectado en botón de administración via delegation');
      e.preventDefault();
      showConfigPage();
    }
  });
  
  // Event listeners del modal
  if (closeModalBtn) closeModalBtn.onclick = cerrarModal;
  if (cancelCreateBtn) cancelCreateBtn.onclick = cerrarModal;
  if (confirmCreateBtn) confirmCreateBtn.onclick = confirmarCreacion;
  
  // Validar campos del modal para habilitar botón
  if (clientNameInput && certificationTypeSelect) {
    const validarCampos = () => {
      const nombreValido = clientNameInput.value.trim().length > 0;
      const tipoValido = certificationTypeSelect.value !== '';
      confirmCreateBtn.disabled = !nombreValido || !tipoValido;
    };
    
    clientNameInput.addEventListener('input', validarCampos);
    certificationTypeSelect.addEventListener('change', validarCampos);
  }
  
  // Cerrar modal con Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
      cerrarModal();
    }
  });
}

function showWelcomePage() {
  document.getElementById('welcomePage').style.display = 'block';
  document.getElementById('checklistPage').style.display = 'none';
  
  // Agregar clase para ocultar elementos del checklist y sidebar
  document.body.classList.add('welcome-active');
  
  // Forzar ocultación de la barra lateral como fallback
  const sidebar = document.getElementById('sidebar');
  const sidebarFab = document.getElementById('sidebarFab');
  const cleanFab = document.getElementById('cleanFab');
  
  if (sidebar) {
    sidebar.style.display = 'none';
  }
  if (sidebarFab) {
    sidebarFab.style.display = 'none';
  }
  if (cleanFab) {
    cleanFab.style.display = 'none';
  }
  
  // Limpiar campos y estados
  numeroCliente = null;
  clienteActual = null;
  camposEstado = {};
  window.camposEstado = camposEstado; // Sincronizar variable global
  
  // Limpiar input de búsqueda
  const searchInput = document.getElementById('searchClientInput');
  if (searchInput) searchInput.value = '';
  
  // Limpiar mensaje de búsqueda
  showSearchMessage('', 'info');
}

async function buscarCliente() {
  console.log('🔍 Función buscarCliente() llamada');
  
  const input = document.getElementById('searchClientInput');
  const clientNumber = input.value.trim();
  
  console.log('Input encontrado:', input);
  console.log('Valor del input:', clientNumber);
  
  if (!clientNumber) {
    showSearchMessage('Por favor ingresa el NIT del comercio', 'error');
    return;
  }
  
  if (!/^\d{10}$/.test(clientNumber)) {
    showSearchMessage('El NIT debe tener exactamente 10 dígitos', 'error');
    return;
  }
  
  try {
    // NUEVO: Buscar usando el adaptador colaborativo unificado
    const datosCliente = await collaborativeAdapter.buscarCliente(clientNumber);
    const avancesGuardados = await collaborativeAdapter.obtenerAvances(clientNumber);
    
    if (datosCliente) {
      // Cliente existe - cargar datos completos
      clienteActual = datosCliente;
      numeroCliente = clientNumber;
      
      // Sincronizar variable global
      window.clienteActual = clienteActual;
      
      // Cargar checklist específico del tipo de certificación
      if (clienteActual.certificationType && CERTIFICATION_TYPES[clienteActual.certificationType]) {
        tipoChecklistActual = CERTIFICATION_TYPES[clienteActual.certificationType].items;
        window.tipoChecklistActual = tipoChecklistActual; // Sincronizar variable global
      } else {
        tipoChecklistActual = checklistItems; // Fallback al checklist por defecto
        window.tipoChecklistActual = tipoChecklistActual; // Sincronizar variable global
      }
      
      // Cargar avances si existen
      if (avancesGuardados && Object.keys(avancesGuardados).length > 0) {
        camposEstado = avancesGuardados;
        window.camposEstado = camposEstado; // Sincronizar variable global
      } else {
        camposEstado = {};
        window.camposEstado = camposEstado; // Sincronizar variable global
      }
      
      showSearchMessage(`✅ Cliente encontrado: ${clienteActual.name}`, 'success');
      
      // Mostrar el checklist después de un breve delay
      setTimeout(() => {
        document.body.classList.remove('welcome-active');
        document.getElementById('welcomePage').style.display = 'none';
        document.getElementById('checklistPage').style.display = 'block';
        
        // Inicializar sidebar
        initializeSidebar();
        
        showChecklistPage(clientNumber);
        mostrarMensaje(`Datos cargados para ${clienteActual.name} (${CERTIFICATION_TYPES[clienteActual.certificationType]?.name || 'Certificación estándar'})`, 'success');
      }, 1000);
    } else {
      // Cliente no existe
      showSearchMessage(`❌ Comercio ${clientNumber} no encontrado. Use el botón "Crear" para crear uno nuevo.`, 'warning');
    }
  } catch (error) {
    console.error('Error al buscar cliente:', error);
    showSearchMessage('Error al cargar datos del cliente', 'error');
  }
}

async function abrirModalCreacion() {
  const input = document.getElementById('searchClientInput');
  const clientNumber = input.value.trim();
  
  if (!clientNumber) {
    showSearchMessage('Por favor ingresa el NIT del comercio', 'error');
    return;
  }
  
  if (!/^\d{10}$/.test(clientNumber)) {
    showSearchMessage('El NIT debe tener exactamente 10 dígitos', 'error');
    return;
  }
  
  // Verificar que el cliente no exista ya
  const datosCliente = localStorage.getItem(`cliente_${clientNumber}`);
  if (datosCliente) {
    showSearchMessage(`⚠️ Cliente ${clientNumber} ya existe. Use "Buscar" para cargar progreso.`, 'warning');
    return;
  }
  
  // Abrir modal y llenar NIT
  const modal = document.getElementById('createClientModal');
  const clientNitInput = document.getElementById('clientNit');
  const clientNameInput = document.getElementById('clientName');
  const certificationTypeSelect = document.getElementById('certificationType');
  const confirmCreateBtn = document.getElementById('confirmCreateBtn');
  
  clientNitInput.value = clientNumber;
  clientNameInput.value = '';
  certificationTypeSelect.value = '';
  confirmCreateBtn.disabled = true;
  
  // NUEVO: Actualizar selector con tipos más recientes usando el sistema colaborativo
  updateCertificationTypeSelector();
  
  // Forzar recarga de datos de certificación desde archivos JSON
  try {
    const tipos = await collaborativeAdapter.obtenerTiposCertificacion();
    if (tipos && Object.keys(tipos).length > 0) {
      Object.assign(CERTIFICATION_TYPES, tipos);
      console.log('🔄 Tipos de certificación actualizados desde sistema colaborativo:', Object.keys(CERTIFICATION_TYPES));
    }
  } catch (error) {
    console.error('Error al cargar tipos de certificación:', error);
  }
  
  // Actualizar selector nuevamente después de cargar datos
  updateCertificationTypeSelector();
  
  modal.style.display = 'flex';
  clientNameInput.focus();
}

function cerrarModal() {
  const modal = document.getElementById('createClientModal');
  modal.style.display = 'none';
}

async function confirmarCreacion() {
  const clientNit = document.getElementById('clientNit').value;
  const clientName = document.getElementById('clientName').value.trim();
  const certificationType = document.getElementById('certificationType').value;
  
  if (!clientName || !certificationType) {
    return;
  }
  
  // Crear objeto del cliente
  clienteActual = {
    nit: clientNit,
    name: clientName,
    certificationType: certificationType,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
  
  // Guardar usando el adaptador colaborativo unificado
  await collaborativeAdapter.guardarCliente(clienteActual);
  
  // Sincronizar variable global
  window.clienteActual = clienteActual;
  
  // Configurar checklist según el tipo
  tipoChecklistActual = CERTIFICATION_TYPES[certificationType].items;
  window.tipoChecklistActual = tipoChecklistActual; // Sincronizar variable global
  
  // Inicializar variables
  numeroCliente = clientNit;
  camposEstado = {};
  window.camposEstado = camposEstado; // Sincronizar variable global
  
  // Cerrar modal y mostrar mensaje
  cerrarModal();
  showSearchMessage(`📋 Creando certificación ${CERTIFICATION_TYPES[certificationType].name}...`, 'success');
  
  setTimeout(() => {
    showChecklistPage(clientNit);
    mostrarMensaje(`Nueva certificación ${CERTIFICATION_TYPES[certificationType].name} creada para ${clientName}`, 'success');
  }, 1000);
}

function showChecklistPage(clientNumber) {
  const welcomePage = document.getElementById('welcomePage');
  const checklistPage = document.getElementById('checklistPage');
  const sidebar = document.getElementById('sidebar');
  
  // Ocultar página de bienvenida y mostrar checklist
  if (welcomePage) welcomePage.style.display = 'none';
  if (checklistPage) checklistPage.style.display = 'block';
  
  // Quitar clase para mostrar sidebar y botones
  document.body.classList.remove('welcome-active');
  
  // Restaurar visibilidad de la barra lateral
  if (sidebar) {
    sidebar.style.display = 'block';
  }
  
  // Actualizar información del cliente en el header (legacy)
  const clientInfo = document.getElementById('currentClientNumber');
  const clientNameInfo = document.getElementById('currentClientName');
  const certificationTypeInfo = document.getElementById('currentCertificationType');
  
  if (clientInfo) clientInfo.textContent = clientNumber;
  
  if (clienteActual) {
    if (clientNameInfo) clientNameInfo.textContent = `(${clienteActual.name})`;
    if (certificationTypeInfo && clienteActual.certificationType) {
      const certType = CERTIFICATION_TYPES[clienteActual.certificationType];
      if (certType) {
        certificationTypeInfo.textContent = certType.name.toUpperCase();
        certificationTypeInfo.title = certType.description;
      }
    }
  } else {
    // Fallback para clientes antiguos sin información completa
    if (clientNameInfo) clientNameInfo.textContent = '';
    if (certificationTypeInfo) certificationTypeInfo.textContent = 'ESTÁNDAR';
  }
  
  // Actualizar nuevo diseño UX
  actualizarClienteCard();
  actualizarEstadisticasProgreso();
  
  // Renderizar checklist
  renderChecklist();
}

function showSearchMessage(message, type) {
  const messageDiv = document.getElementById('searchMessage');
  if (!messageDiv) return;
  
  messageDiv.textContent = message;
  messageDiv.className = 'message-area';
  
  if (type && type !== 'info') {
    messageDiv.classList.add(type);
  }
  
  // Auto-limpiar mensajes después de cierto tiempo
  if (message && type !== 'error') {
    setTimeout(() => {
      if (messageDiv.textContent === message) {
        messageDiv.textContent = '';
        messageDiv.className = 'message-area';
      }
    }, 5000);
  }
}

// =============================================================================
// RENDERIZADO DEL CHECKLIST
// =============================================================================
function renderChecklist() {
  const container = document.getElementById('checklist');
  container.innerHTML = '';
  
  // Usar el checklist actual según el tipo de certificación
  const itemsActuales = tipoChecklistActual || checklistItems;
  
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, itemsActuales.length);
  
  itemsActuales.slice(startIdx, endIdx).forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'checklist-item';
    div.setAttribute('id', `item_${item.id}`);
    // Usar la implementación exacta del Portal 2 con estado y toolbar debajo
    div.innerHTML = `
      <div class="punto-container">
        <label>
          <span class="numero-punto">${startIdx + idx + 1}.</span>
          <span id="alerta_${item.id}" class="punto-faltante" style="display:none;" title="Falta completar este punto">&#9888;</span>
          ${item.texto}
        </label>
        <div class="campo-espera"><strong>¿Qué se espera?</strong><br>${item.esperado}</div>
        <div contenteditable="true" class="evidencias-editable" name="observaciones_${item.id}" data-id="${item.id}" spellcheck="true" aria-label="Evidencias"></div>
        <div class="punto-footer">
          <select name="aprobado_${item.id}" required onchange="guardarEstadoCampo(${item.id})" class="estado-select">
            <option value="">Estado</option>
            <option value="Aprobado">Aprobado</option>
            <option value="No aprobado">No aprobado</option>
            <option value="No aplica">No aplica</option>
          </select>
          <div class="toolbar-evidencia">
            <button type="button" title="Negrita" onclick="formatoEvidencia(this, 'bold')"><strong>B</strong></button>
            <button type="button" title="Cursiva" onclick="formatoEvidencia(this, 'italic')"><em>I</em></button>
            <button type="button" title="Subrayado" onclick="formatoEvidencia(this, 'underline')"><u>U</u></button>
            <button type="button" title="Alinear a la izquierda" onclick="formatoEvidencia(this, 'justifyLeft')">⬅</button>
            <button type="button" title="Centrar" onclick="formatoEvidencia(this, 'justifyCenter')">↔</button>
            <button type="button" title="Alinear a la derecha" onclick="formatoEvidencia(this, 'justifyRight')">➡</button>
            <button type="button" title="Lista numerada" onclick="formatoEvidencia(this, 'insertOrderedList')">1.</button>
            <button type="button" title="Lista con viñetas" onclick="formatoEvidencia(this, 'insertUnorderedList')">•</button>
            <div class="color-selector">
              <button type="button" class="color-selector-btn" title="Color de texto" onclick="toggleColorPalette(this)">🎨</button>
              <div class="color-palette">
                <div class="color-option" style="background-color: #000000;" onclick="aplicarColor(this, '#000000')"></div>
                <div class="color-option" style="background-color: #ff0000;" onclick="aplicarColor(this, '#ff0000')"></div>
                <div class="color-option" style="background-color: #00ff00;" onclick="aplicarColor(this, '#00ff00')"></div>
                <div class="color-option" style="background-color: #0000ff;" onclick="aplicarColor(this, '#0000ff')"></div>
                <div class="color-option" style="background-color: #ffff00;" onclick="aplicarColor(this, '#ffff00')"></div>
                <div class="color-option" style="background-color: #ff00ff;" onclick="aplicarColor(this, '#ff00ff')"></div>
                <div class="color-option" style="background-color: #00ffff;" onclick="aplicarColor(this, '#00ffff')"></div>
                <div class="color-option" style="background-color: #ffffff; border-color: #000;" onclick="aplicarColor(this, '#ffffff')"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="char-count" id="contador_${item.id}"></div>
      </div>
    `;
    container.appendChild(div);
  });
  
  cargarCambios();
  renderSidebar();
  renderPagination();
  inicializarEvidenciasEditables();
}

function renderSidebar() {
  const sidebarMenu = document.getElementById('sidebarMenu');
  if (!sidebarMenu) {
    console.log('❌ sidebarMenu no encontrado');
    return;
  }
  
  // Usar el checklist actual según el tipo de certificación
  const itemsActuales = tipoChecklistActual || checklistItems;
  console.log('📊 Renderizando sidebar con', itemsActuales.length, 'items');
  
  // Variables globales para controlar el estado
  if (typeof window.sidebarMostrandoFaltantes === 'undefined') {
    window.sidebarMostrandoFaltantes = false;
  }
  
  // Calcular cuántos puntos caben visualmente
  const puntosVisibles = calcularPuntosVisibles();
  let puntosAMostrar;
  let textoFlecha;
  let funcionFlecha;
  
  if (!window.sidebarMostrandoFaltantes) {
    // Mostrar los primeros puntos que caben
    puntosAMostrar = itemsActuales.slice(0, puntosVisibles);
    
    // Si hay más puntos, preparar para mostrar los faltantes
    const puntosRestantes = itemsActuales.length - puntosVisibles;
    if (puntosRestantes > 0) {
      textoFlecha = `Ver ${puntosRestantes} puntos más`;
      funcionFlecha = 'mostrarPuntosFaltantes()';
    }
  } else {
    // Mostrar solo los puntos faltantes
    puntosAMostrar = itemsActuales.slice(puntosVisibles);
    
    textoFlecha = `Ver primeros ${puntosVisibles} puntos`;
    funcionFlecha = 'mostrarPrimerosPuntos()';
  }
  
  // Construir HTML de forma segura
  let htmlContent = '';
  
  // Renderizar los puntos
  for (let i = 0; i < puntosAMostrar.length; i++) {
    const item = puntosAMostrar[i];
    // Calcular el índice real según qué puntos estamos mostrando
    const idx = window.sidebarMostrandoFaltantes ? puntosVisibles + i : i;
    
    // Determinar estado del item
    const aprobacionState = camposEstado[`aprobado_${item.id}`];
    const evidencias = camposEstado[`evidencias_${item.id}`] || camposEstado[`observaciones_${item.id}`];
    const tieneEvidencias = evidencias && evidencias.trim() !== '';
    
    let statusClass = '';
    
    if (aprobacionState && tieneEvidencias) {
      if (aprobacionState === 'Aprobado') {
        statusClass = 'completo';
      } else if (aprobacionState === 'No aprobado') {
        statusClass = 'incompleto';
      } else if (aprobacionState === 'No aplica') {
        statusClass = 'no-aplica';
      }
    }
    
    // Determinar si está en la página currentPage
    const pageNumber = Math.floor(idx / ITEMS_PER_PAGE) + 1;
    const isActive = currentPage === pageNumber;
    
    htmlContent += `
      <button class="nav-punto ${isActive ? 'active' : ''} ${statusClass}" 
              onclick="scrollToItem(${idx})" 
              title="Ir al punto ${idx + 1}: ${item.texto}">
        <span class="nav-punto-texto">${idx + 1}. ${item.texto}</span>
      </button>
    `;
  }
  
  // Agregar flecha si hay puntos para alternar
  if (itemsActuales.length > puntosVisibles) {
    const iconoFlecha = window.sidebarMostrandoFaltantes ? '▲' : '▼';
    const claseFlecha = window.sidebarMostrandoFaltantes ? 'arrow-up' : 'arrow-down';
    
    htmlContent += `
      <button class="nav-punto-arrow" onclick="${funcionFlecha}" title="Alternar vista de puntos">
        <div class="arrow-container">
          <div class="arrow-icon ${claseFlecha}">${iconoFlecha}</div>
          <div class="arrow-text">${textoFlecha}</div>
        </div>
      </button>
    `;
  }
  
  // Asignar todo el HTML de una sola vez
  sidebarMenu.innerHTML = htmlContent;
  
  console.log('🎯 Sidebar renderizado - Mostrando faltantes:', window.sidebarMostrandoFaltantes);
}

function calcularPuntosVisibles() {
  const sidebarMenu = document.getElementById('sidebarMenu');
  const sidebarContent = document.getElementById('sidebarContent');
  
  if (!sidebarMenu || !sidebarContent) {
    console.log('📏 Usando valor por defecto: 6 puntos - elementos no encontrados');
    return 6; // Valor por defecto
  }
  
  try {
    // Obtener las alturas reales con validación
    const sidebarContentHeight = sidebarContent.clientHeight || 600;
    const sidebarHeader = document.querySelector('.sidebar-header');
    const headerHeight = sidebarHeader ? sidebarHeader.offsetHeight : 80;
    
    // Validar que tengamos valores numéricos
    if (!sidebarContentHeight || !headerHeight) {
      console.log('📏 Usando valor por defecto: 6 puntos - alturas inválidas');
      return 6;
    }
    
    // Altura disponible para el menú
    const alturaDisponible = sidebarContentHeight - headerHeight - 20; // 20px margen
    
    // Altura estimada por punto basada en CSS real
    const alturaPorPunto = 65; // padding: 12px + texto + margin: 8px ≈ 65px
    
    // Altura reservada para la flecha
    const alturaFlecha = 80;
    
    // Calcular cuántos puntos caben sin la flecha
    const alturaParaPuntos = Math.max(0, alturaDisponible - alturaFlecha);
    const puntosQueCaben = Math.floor(alturaParaPuntos / alturaPorPunto);
    
    // Establecer límites razonables: mínimo 3, máximo 15
    const puntosVisibles = Math.max(3, Math.min(puntosQueCaben, 15));
    
    console.log('📏 Cálculo adaptativo:', {
      alturaDisponible,
      alturaPorPunto,
      alturaParaPuntos,
      puntosQueCaben,
      puntosVisibles,
      headerHeight,
      sidebarContentHeight
    });
    
    return puntosVisibles;
  } catch (error) {
    console.warn('📏 Error en cálculo de puntos visibles:', error);
    return 6; // Valor por defecto en caso de error
  }
}

function renderPagination() {
  // Usar el checklist actual según el tipo de certificación
  const itemsActuales = tipoChecklistActual || checklistItems;
  const totalPages = Math.ceil(itemsActuales.length / ITEMS_PER_PAGE);
  const pagDiv = document.getElementById('pagination');
  
  // Construir HTML de forma segura
  let htmlContent = '';
  
  htmlContent += `<button onclick="prevPage()" ${currentPage === 1 ? 'disabled' : ''}>&lt; Anterior</button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    htmlContent += `<button onclick="goToPage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
  }
  
  htmlContent += `<button onclick="nextPage()" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente &gt;</button>`;
  
  // Asignar todo el HTML de una sola vez
  pagDiv.innerHTML = htmlContent;
}

function goToPage(page) {
  guardarCamposPaginaActual();
  currentPage = page;
  renderChecklist();
}

function prevPage() {
  guardarCamposPaginaActual();
  if (currentPage > 1) {
    currentPage--;
    renderChecklist();
  }
}

function nextPage() {
  guardarCamposPaginaActual();
  // Usar el checklist actual según el tipo de certificación
  const itemsActuales = tipoChecklistActual || checklistItems;
  const totalPages = Math.ceil(itemsActuales.length / ITEMS_PER_PAGE);
  if (currentPage < totalPages) {
    currentPage++;
    renderChecklist();
  }
}

// =============================================================================
// MANEJO DE ESTADO
// =============================================================================
async function guardarCamposPaginaActual() {
  // Usar el checklist actual según el tipo de certificación
  const itemsActuales = tipoChecklistActual || checklistItems;
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, itemsActuales.length);
  
  itemsActuales.slice(startIdx, endIdx).forEach(item => {
    guardarEstadoCampo(item.id);
  });
}

 async function guardarCambios() {
  guardarCamposPaginaActual();
  guardarEnStorage();
  
  // Actualizar fecha de modificación del cliente
  if (clienteActual && numeroCliente) {
    clienteActual.lastModified = new Date().toISOString();
    await collaborativeAdapter.guardarCliente(clienteActual);
  }
}

function cargarCambios() {
  // Usar el checklist actual según el tipo de certificación
  const itemsActuales = tipoChecklistActual || checklistItems;
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, itemsActuales.length);
  
  itemsActuales.slice(startIdx, endIdx).forEach(item => {
    if (camposEstado[`aprobado_${item.id}`]) {
      const selectElement = document.querySelector(`[name="aprobado_${item.id}"]`);
      if (selectElement) {
        selectElement.value = camposEstado[`aprobado_${item.id}`];
      }
    }
    
    if (camposEstado[`evidencias_${item.id}`]) {
      const obsDiv = document.querySelector(`.evidencias-editable[name="observaciones_${item.id}"]`);
      if (obsDiv) {
        // Limpiar el contenido antes de asignarlo
        const contenidoLimpio = limpiarContenidoHTML(camposEstado[`evidencias_${item.id}`]);
        obsDiv.innerHTML = contenidoLimpio;
      }
    }
  });
}

// Función para limpiar contenido HTML de caracteres residuales
function limpiarContenidoHTML(contenido) {
  if (!contenido || typeof contenido !== 'string') {
    return '';
  }
  
  // Eliminar caracteres de control y espacios extraños
  let contenidoLimpio = contenido
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Caracteres de control
    .replace(/\u00A0/g, ' ') // Espacios no separables
    .replace(/\s+/g, ' ') // Múltiples espacios
    .trim();
  
  // Si el contenido está vacío después de la limpieza, devolver cadena vacía
  if (contenidoLimpio === '' || contenidoLimpio === '<br>' || contenidoLimpio === '<div><br></div>') {
    return '';
  }
  
  return contenidoLimpio;
}

function guardarEstadoCampo(itemId) {
  const select = document.querySelector(`[name="aprobado_${itemId}"]`);
  const evidencias = document.querySelector(`.evidencias-editable[data-id="${itemId}"]`);
  const checklistItem = document.getElementById(`item_${itemId}`);
  
  if (select) camposEstado[`aprobado_${itemId}`] = select.value;
  if (evidencias) {
    // Limpiar el contenido antes de guardarlo
    const contenidoLimpio = limpiarContenidoHTML(evidencias.innerHTML);
    camposEstado[`evidencias_${itemId}`] = contenidoLimpio;
  }
  
  // Actualizar clases visuales del elemento
  if (checklistItem) {
    // Limpiar clases anteriores
    checklistItem.classList.remove('completo', 'incompleto', 'no-aplica');
    
    const tieneEvidencias = evidencias && limpiarContenidoHTML(evidencias.innerHTML).trim() !== '';
    const estado = select ? select.value : '';
    
    if (estado && tieneEvidencias) {
      if (estado === 'Aprobado') {
        checklistItem.classList.add('completo');
      } else if (estado === 'No aprobado') {
        checklistItem.classList.add('incompleto');
      } else if (estado === 'No aplica') {
        checklistItem.classList.add('no-aplica');
      }
    }
  }
  
  // Actualizar estadísticas y sidebar en tiempo real
  actualizarEstadisticasProgreso();
  renderSidebar();
  
  debouncedSave();
}

let saveTimeout;
/**
 * Actualiza las clases visuales de todos los elementos de validación
 */
function actualizarClasesVisuales() {
  const itemsActuales = tipoChecklistActual || checklistItems;
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, itemsActuales.length);
  
  itemsActuales.slice(startIdx, endIdx).forEach((item) => {
    const checklistItem = document.getElementById(`item_${item.id}`);
    const evidencias = document.querySelector(`.evidencias-editable[data-id="${item.id}"]`);
    const select = document.querySelector(`[name="aprobado_${item.id}"]`);
    
    if (checklistItem) {
      // Limpiar clases anteriores
      checklistItem.classList.remove('completo', 'incompleto', 'no-aplica');
      
      const tieneEvidencias = evidencias && evidencias.innerHTML.trim() !== '';
      const estado = camposEstado[`aprobado_${item.id}`] || '';
      
      if (estado && tieneEvidencias) {
        if (estado === 'Aprobado') {
          checklistItem.classList.add('completo');
        } else if (estado === 'No aprobado') {
          checklistItem.classList.add('incompleto');
        } else if (estado === 'No aplica') {
          checklistItem.classList.add('no-aplica');
        }
      }
    }
  });
}

function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    guardarEnStorage();
    mostrarIndicadorAutoGuardadoDiscreto();
  }, 300000); // 5 minutos = 300000ms
}

async function guardarEnStorage() {
  if (numeroCliente) {
    await collaborativeAdapter.guardarAvances(numeroCliente, camposEstado);
    console.log('✅ Avances guardados automáticamente en sistema colaborativo');
  }
}

function mostrarMensaje(texto, tipo = 'info') {
  const msgDiv = document.getElementById('formMsg');
  if (msgDiv) {
    msgDiv.textContent = texto;
    msgDiv.className = tipo;
    setTimeout(() => {
      msgDiv.textContent = '';
      msgDiv.className = '';
    }, 3000);
  }
}

// =============================================================================
// FUNCIONES ADICIONALES
// =============================================================================
function initializeSidebar() {
  // Implementación del nuevo sidebar marino moderno
  const sidebarToggle = document.getElementById('sidebarMuesca');
  const sidebarFab = document.getElementById('sidebarFab');
  const cleanFab = document.getElementById('cleanFab');
  const sidebar = document.getElementById('sidebar');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      
      // Mostrar/ocultar FAB según estado del sidebar
      if (sidebar.classList.contains('collapsed')) {
        sidebarFab.style.display = 'flex';
      } else {
        sidebarFab.style.display = 'none';
      }
    });
  }
  
  if (sidebarFab && sidebar) {
    sidebarFab.addEventListener('click', function() {
      sidebar.classList.remove('collapsed');
      sidebarFab.style.display = 'none';
    });
  }
  
  // Mostrar el botón de limpiar evidencias cuando estemos en la página de certificación
  function toggleCleanFab() {
    const checklistPage = document.getElementById('checklistPage');
    if (cleanFab) {
      if (checklistPage && checklistPage.style.display !== 'none') {
        cleanFab.style.display = 'flex';
      } else {
        cleanFab.style.display = 'none';
      }
    }
  }
  
  // Observar cambios en la página actual
  const observer = new MutationObserver(toggleCleanFab);
  observer.observe(document.body, { 
    attributes: true, 
    childList: true, 
    subtree: true 
  });
  
  // Verificar estado inicial
  toggleCleanFab();
}

function initializeCleanButton() {
  // Implementación básica del botón de limpiar
  const cleanBtn = document.getElementById('btnLimpiarEvidenciasDiscreto');
  if (cleanBtn) {
    cleanBtn.addEventListener('click', function(e) {
      e.preventDefault(); // Prevenir comportamiento por defecto
      e.stopPropagation(); // Evitar propagación del evento
      
      if (confirm('¿Desea limpiar todas las evidencias?')) {
        // Limpiar evidencias
        const evidencias = document.querySelectorAll('.evidencias-editable');
        evidencias.forEach(div => {
          div.innerHTML = '';
        });
      }
    });
  }
  
  // Conectar el FAB de limpiar evidencias
  const cleanFab = document.getElementById('cleanFab');
  if (cleanFab) {
    cleanFab.addEventListener('click', function(e) {
      e.preventDefault(); // Prevenir comportamiento por defecto
      e.stopPropagation(); // Evitar propagación del evento
      limpiarEvidencias(e);
    });
  }
  
  // Conectar botón volver del panel inferior
  const backBtn2 = document.getElementById('backToWelcomeBtn2');
  if (backBtn2) {
    backBtn2.addEventListener('click', function() {
      showWelcomePage();
    });
  }
  
  // Conectar botón modo compacto
  const compactBtn = document.getElementById('sidebarCompact');
  if (compactBtn) {
    compactBtn.addEventListener('click', function() {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('compact');
      
      // Cambiar el icono del botón
      const icon = compactBtn.querySelector('svg path');
      if (sidebar.classList.contains('compact')) {
        icon.setAttribute('d', 'M3,4H7V8H3V4M9,5V7H21V5H9M3,10H7V14H3V10M9,11V13H21V11H9M3,16H7V20H3V16M9,17V19H21V17H9');
        compactBtn.setAttribute('title', 'Modo normal');
      } else {
        icon.setAttribute('d', 'M3,3H21V5H3V3M3,7H21V9H3V7M3,11H21V13H3V11M3,15H21V17H3V15M3,19H21V21H3V19Z');
        compactBtn.setAttribute('title', 'Modo compacto');
      }
    });
  }
}

// Funciones de selector de colores - DESHABILITADAS
/*
function arreglarSelectorColores() {
  // Reemplazar completamente el HTML del selector de colores
  const colorSelectors = document.querySelectorAll('.color-selector');
  colorSelectors.forEach(selector => {
    selector.innerHTML = `
      <button type="button" class="color-selector-btn" title="Color de texto" onclick="toggleColorPalette(this)">🎨</button>
      <div class="color-palette">
        <div class="color-option" style="background-color: #000000;" onclick="aplicarColor(this, '#000000')"></div>
        <div class="color-option" style="background-color: #ff0000;" onclick="aplicarColor(this, '#ff0000')"></div>
        <div class="color-option" style="background-color: #00ff00;" onclick="aplicarColor(this, '#00ff00')"></div>
        <div class="color-option" style="background-color: #0000ff;" onclick="aplicarColor(this, '#0000ff')"></div>
        <div class="color-option" style="background-color: #ffff00;" onclick="aplicarColor(this, '#ffff00')"></div>
        <div class="color-option" style="background-color: #ff00ff;" onclick="aplicarColor(this, '#ff00ff')"></div>
        <div class="color-option" style="background-color: #00ffff;" onclick="aplicarColor(this, '#00ffff')"></div>
        <div class="color-option" style="background-color: #ffffff; border-color: #000;" onclick="aplicarColor(this, '#ffffff')"></div>
      </div>
    `;
  });
}

function initializeColorPalettes() {
  // Cerrar paleta de colores al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.color-selector')) {
      document.querySelectorAll('.color-palette').forEach(palette => {
        palette.classList.remove('show');
      });
    }
  });
  
  // Arreglar selectores después de que se rendericen
  setTimeout(arreglarSelectorColores, 100);
}
*/

// Permite redimensionar, mover y editar imágenes dentro del campo de evidencias - MEJORADO ESTILO PORTAL 2
function inicializarEvidenciasEditables() {
  document.querySelectorAll('.evidencias-editable').forEach(div => {
    const itemId = div.getAttribute('data-id');
    
    // Evento input para guardar cambios
    div.oninput = function() {
      guardarEstadoCampo(itemId);
    };
    
    // Eventos para actualizar estados de botones cuando cambia la selección o cursor
    div.addEventListener('keyup', function() {
      updateAllButtonStates(this);
    });
    
    div.addEventListener('mouseup', function() {
      updateAllButtonStates(this);
    });
    
    div.addEventListener('focus', function() {
      updateAllButtonStates(this);
      // Guardar referencia del último campo seleccionado
      lastSelectedEvidencia = this;
    });
    
    // Unified click handler para evitar duplicados
    div.addEventListener('click', function(e) {
      // Guardar referencia del último campo seleccionado
      lastSelectedEvidencia = this;
      
      // Deseleccionar imágenes si no se hizo clic en una
      if (!e.target.closest('.imagen-evidencia-container')) {
        document.querySelectorAll('.imagen-evidencia-container').forEach(w => w.classList.remove('selected'));
      }
      
      // Actualizar estados de botones al hacer click
      updateAllButtonStates(this);
    });
  });
  
  // Listener global para cambios de selección que actualice los estados de botones
  document.addEventListener('selectionchange', function() {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.classList.contains('evidencias-editable')) {
      // Debounce para evitar demasiadas actualizaciones
      clearTimeout(activeElement._updateTimeout);
      activeElement._updateTimeout = setTimeout(() => {
        updateAllButtonStates(activeElement);
      }, 100);
    }
  });
}

// =============================================================================
// FUNCIONES PARA EL NUEVO DISEÑO UX - MEJORADAS
// =============================================================================
// =============================================================================
// =============================================================================

/**
 * Limpia solo la evidencia del campo seleccionado
 */
function limpiarEvidencias(event) {
  // Prevenir comportamiento por defecto y propagación
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Usar el último campo seleccionado o buscar el activo
  let targetField = lastSelectedEvidencia;
  
  // Si no hay campo guardado, buscar el activo
  if (!targetField || !targetField.classList.contains('evidencias-editable')) {
    targetField = document.activeElement;
    if (!targetField || !targetField.classList.contains('evidencias-editable')) {
      // Si no hay campo activo, buscar todos los campos de evidencia visibles
      const evidenciasVisibles = document.querySelectorAll('.evidencias-editable');
      if (evidenciasVisibles.length > 0) {
        // Usar el primer campo visible como fallback
        targetField = evidenciasVisibles[0];
        mostrarMensaje('Se limpiará la evidencia del primer punto visible', 'info');
      } else {
        mostrarMensaje('No se encontraron campos de evidencia para limpiar', 'warning');
        return;
      }
    }
  }
  
  const confirmacion = confirm('¿Está seguro de que desea limpiar esta evidencia?\n\nEsta acción no se puede deshacer.');
  if (!confirmacion) return;
  
  try {
    // Limpiar solo el campo seleccionado
    targetField.innerHTML = '';
    
    // Obtener el ID del item desde el atributo data-id
    const itemId = targetField.getAttribute('data-id');
    if (itemId) {
      // Limpiar del estado global
      delete camposEstado[`observaciones_${itemId}`];
      
      // Guardar cambios
      guardarEstadoCampo(itemId);
    }
    
    actualizarEstadisticasProgreso();
    mostrarMensaje('✅ Evidencia limpiada', 'success');
    console.log('🧹 Evidencia limpiada exitosamente para item:', itemId);
    
    // Volver a enfocar el campo limpio
    setTimeout(() => {
      targetField.focus();
    }, 100);
    
  } catch (error) {
    console.error('Error al limpiar evidencia:', error);
    mostrarMensaje('❌ Error al limpiar evidencia', 'error');
  }
}

/**
 * Actualiza las estadísticas de progreso en el panel
 */
function actualizarEstadisticasProgreso() {
  try {
    const itemsActuales = tipoChecklistActual || checklistItems;
    const totalItems = itemsActuales.length;
    
    // Contar items completados
    let completados = 0;
    let aprobados = 0;
    let rechazados = 0;
    let pendientes = 0;
    
    itemsActuales.forEach(item => {
      const estadoAprobacion = camposEstado[`aprobado_${item.id}`];
      const tieneEvidencias = camposEstado[`evidencias_${item.id}`] || camposEstado[`observaciones_${item.id}`];
      
      if (estadoAprobacion && tieneEvidencias) {
        completados++;
        if (estadoAprobacion === 'si') {
          aprobados++;
        } else if (estadoAprobacion === 'no') {
          rechazados++;
        }
      } else {
        pendientes++;
      }
    });
    
    // Actualizar elementos del DOM con nuevos IDs
    const totalElement = document.getElementById('totalItems');
    const completadosElement = document.getElementById('completedItems');
    const progressElement = document.getElementById('progressPercentage');
    
    if (totalElement) totalElement.textContent = totalItems;
    if (completadosElement) completadosElement.textContent = completados;
    if (progressElement) {
      const porcentaje = totalItems > 0 ? Math.round((completados / totalItems) * 100) : 0;
      progressElement.textContent = `${porcentaje}%`;
    }
    
    // Actualizar barra de progreso
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      const porcentaje = totalItems > 0 ? (completados / totalItems) * 100 : 0;
      progressBar.style.width = `${porcentaje}%`;
    }
    
    console.log(`📊 Estadísticas actualizadas: ${completados}/${totalItems} items completados`);
    
  } catch (error) {
    console.error('Error actualizando estadísticas:', error);
  }
}

/**
 * Mejora la función guardarCambios para trabajar con el nuevo diseño
 */
async function guardarCambiosEnLocal() {
  try {
    // Guardar campos de la página actual
    await guardarCamposPaginaActual();
    
    // Guardar en localStorage
    await guardarEnStorage();
    
    // Actualizar fecha de modificación del cliente
    if (clienteActual && numeroCliente) {
      clienteActual.lastModified = new Date().toISOString();
      await collaborativeAdapter.guardarCliente(clienteActual);
    }
    
    // Actualizar estadísticas
    actualizarEstadisticasProgreso();
    
    // Mostrar indicador de auto-guardado
    mostrarIndicadorAutoGuardado();
    
    console.log('💾 Cambios guardados en localStorage');
    
  } catch (error) {
    console.error('Error guardando cambios:', error);
    mostrarMensaje('❌ Error al guardar cambios', 'error');
  }
}

/**
 * Muestra un indicador temporal de guardado muy discreto
 */
function mostrarIndicadorAutoGuardado() {
  // Buscar o crear indicador
  let indicador = document.getElementById('auto-save-indicator');
  
  if (!indicador) {
    indicador = document.createElement('div');
    indicador.id = 'auto-save-indicator';
    indicador.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(71, 85, 105, 0.85);
      color: rgba(241, 245, 249, 0.95);
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 10px;
      font-weight: 400;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
      backdrop-filter: blur(6px);
      border: 1px solid rgba(148, 163, 184, 0.2);
    `;
    indicador.innerHTML = '💾 Guardado';
    document.body.appendChild(indicador);
  }
  
  // Mostrar indicador muy brevemente
  indicador.style.opacity = '1';
  
  // Ocultar después de 1.5 segundos
  setTimeout(() => {
    indicador.style.opacity = '0';
  }, 1500);
}

/**
 * Muestra un indicador discreto de auto-guardado cada 5 minutos
 */
function mostrarIndicadorAutoGuardadoDiscreto() {
  // Buscar o crear indicador discreto
  let indicador = document.getElementById('auto-save-indicator-discrete');
  
  if (!indicador) {
    indicador = document.createElement('div');
    indicador.id = 'auto-save-indicator-discrete';
    indicador.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(100, 116, 139, 0.9);
      color: rgba(241, 245, 249, 0.95);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 400;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.4s ease;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(148, 163, 184, 0.3);
    `;
    indicador.innerHTML = '💾 Auto-guardado';
    document.body.appendChild(indicador);
  }
  
  // Mostrar indicador discreto
  indicador.style.opacity = '1';
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    indicador.style.opacity = '0';
  }, 3000);
  
  console.log('💾 Auto-guardado discreto ejecutado cada 5 minutos');
}

/**
 * Actualiza la información del cliente en el card
 */
function actualizarClienteCard() {
  if (!clienteActual) return;
  
  try {
    // Actualizar nombre del cliente
    const clientNameElement = document.querySelector('.client-name');
    if (clientNameElement) {
      clientNameElement.textContent = clienteActual.name;
    }
    
    // Actualizar NIT
    const clientNitElement = document.querySelector('.client-nit');
    if (clientNitElement) {
      clientNitElement.textContent = `NIT: ${numeroCliente}`;
    }
    
    // Actualizar tipo de certificación
    const certTypeElement = document.querySelector('.cert-type');
    if (certTypeElement && clienteActual.certificationType) {
      const certInfo = CERTIFICATION_TYPES[clienteActual.certificationType];
      if (certInfo) {
        certTypeElement.textContent = certInfo.name;
      }
    }
    
    // Actualizar fecha de última modificación
    const lastModElement = document.querySelector('.last-modified');
    if (lastModElement && clienteActual.lastModified) {
      const fecha = new Date(clienteActual.lastModified);
      lastModElement.textContent = `Última modificación: ${fecha.toLocaleDateString()}`;
    }
    
  } catch (error) {
    console.error('Error actualizando cliente card:', error);
  }
}

// Actualizar función existente de guardarCambios para compatibilidad
/**
 * Inicializa las nuevas características UX
 */
function initializeNewUXFeatures() {
  console.log('🎨 Inicializando características UX...');
  
  // Configurar auto-guardado mejorado
  setupAutoSave();
  
  // Configurar tooltips si es necesario
  setupTooltips();
  
  console.log('✅ Características UX inicializadas');
}

/**
 * Configura el sistema de auto-guardado mejorado
 */
function setupAutoSave() {
  // Interceptar cambios en todos los campos de evidencias
  document.addEventListener('input', function(e) {
    if (e.target.classList.contains('evidencias-editable')) {
      const itemId = e.target.getAttribute('data-id');
      if (itemId) {
        // Guardar con debounce más agresivo para mejor UX
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          guardarEstadoCampo(itemId);
        }, 1000);
      }
    }
  });
  
  // Interceptar cambios en selectors de aprobación
  document.addEventListener('change', function(e) {
    if (e.target.name && e.target.name.startsWith('aprobado_')) {
      const itemId = e.target.name.replace('aprobado_', '');
      setTimeout(() => {
        actualizarEstadisticasProgreso();
      }, 100);
    }
  });
}

/**
 * Configura tooltips para elementos con título
 */
function setupTooltips() {
  // Los tooltips se manejan nativamente con el atributo title
  // Aquí se pueden agregar tooltips personalizados si es necesario
}

/**
 * Exporta el gráfico de progreso como imagen PNG
 */
async function exportarGraficoProgreso() {
  try {
    if (!clienteActual || !numeroCliente) {
      mostrarMensaje('❌ No hay información de cliente disponible', 'error');
      return;
    }

    // Obtener datos actuales
    const itemsActuales = tipoChecklistActual || checklistItems;
    const totalItems = itemsActuales.length;
    
    let completados = 0;
    let aprobados = 0;
    let rechazados = 0;

    itemsActuales.forEach(item => {
      const estadoAprobacion = camposEstado[`aprobado_${item.id}`];
      const tieneEvidencias = camposEstado[`evidencias_${item.id}`] || camposEstado[`observaciones_${item.id}`];
      
      if (estadoAprobacion && tieneEvidencias) {
        completados++;
        if (estadoAprobacion === 'si') {
          aprobados++;
        } else if (estadoAprobacion === 'no') {
          rechazados++;
        }
      }
    });

    const pendientes = totalItems - completados;
    const porcentaje = totalItems > 0 ? Math.round((completados / totalItems) * 100) : 0;

    // Crear canvas para el gráfico
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Fondo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título - cambiar según el porcentaje
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    const tituloImagen = porcentaje >= 100 ? 'Estado de Certificación' : 'Progreso de Certificación';
    ctx.fillText(tituloImagen, canvas.width / 2, 50);

    // Información de la empresa
    ctx.fillStyle = '#475569';
    ctx.font = '24px Arial';
    ctx.fillText(`${clienteActual.name}`, canvas.width / 2, 85);
    
    ctx.font = '18px Arial';
    ctx.fillText(`NIT: ${numeroCliente}`, canvas.width / 2, 110);

    // Tipo de certificación
    const certType = CERTIFICATION_TYPES[clienteActual.certificationType];
    if (certType) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`${certType.name}`, canvas.width / 2, 140);
    }

    // Gráfico circular
    const centerX = canvas.width / 2;
    const centerY = 300;
    const radius = 120;

    // Fondo del círculo
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();

    // Progreso
    if (porcentaje > 0) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * porcentaje / 100));
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    }

    // Texto del porcentaje
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${porcentaje}%`, centerX, centerY + 15);

    // Estadísticas detalladas
    const statsY = 480;
    const statsSpacing = 200;
    const statsStartX = (canvas.width - (statsSpacing * 2)) / 2;

    // Completados
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(completados.toString(), statsStartX, statsY);
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Arial';
    ctx.fillText('Completados', statsStartX, statsY + 25);

    // Total
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(totalItems.toString(), statsStartX + statsSpacing, statsY);
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Arial';
    ctx.fillText('Total', statsStartX + statsSpacing, statsY + 25);

    // Pendientes
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(pendientes.toString(), statsStartX + (statsSpacing * 2), statsY);
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Arial';
    ctx.fillText('Pendientes', statsStartX + (statsSpacing * 2), statsY + 25);

    // Fecha
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    const fecha = new Date().toLocaleDateString('es-CO');
    ctx.fillText(`Generado el ${fecha}`, canvas.width - 20, canvas.height - 20);

    // Descargar imagen
    const link = document.createElement('a');
    link.download = `progreso_certificacion_${clienteActual.name.replace(/\s+/g, '_')}_${numeroCliente}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    mostrarMensaje('📊 Gráfico de progreso exportado exitosamente', 'success');
    console.log('📊 Gráfico de progreso exportado');

  } catch (error) {
    console.error('Error exportando gráfico:', error);
    mostrarMensaje('❌ Error al exportar gráfico de progreso', 'error');
  }
}

// =============================================================================
// FINALIZAR CERTIFICACIÓN
// =============================================================================
function finalizarCertificacion() {
  // Verificar que estamos en la página de certificación
  const checklistPage = document.getElementById('checklistPage');
  const welcomePage = document.getElementById('welcomePage');
  
  if (!checklistPage || checklistPage.style.display === 'none' || 
      !welcomePage || welcomePage.style.display !== 'none') {
    mostrarMensaje('❌ Debe estar en una certificación activa para poder finalizarla', 'error');
    return;
  }

  // Intentar obtener datos del cliente desde el DOM si clienteActual no está disponible
  let clienteParaFinalizar = clienteActual;
  
  if (!clienteParaFinalizar || !clienteParaFinalizar.nit) {
    const currentClientName = document.getElementById('currentClientName');
    const currentClientNumber = document.getElementById('currentClientNumber');
    const currentCertificationType = document.getElementById('currentCertificationType');
    
    if (currentClientName && currentClientNumber && 
        currentClientName.textContent !== '-' && currentClientNumber.textContent !== '-') {
      
      clienteParaFinalizar = {
        nombre: currentClientName.textContent,
        nit: currentClientNumber.textContent,
        certificationType: currentCertificationType ? currentCertificationType.textContent : 'No definido'
      };
    }
  }
  
  // Verificar que tenemos datos del cliente
  if (!clienteParaFinalizar || !clienteParaFinalizar.nit || clienteParaFinalizar.nit === '-') {
    mostrarMensaje('❌ No se pueden obtener los datos del cliente para finalizar la certificación', 'error');
    return;
  }

  // Mostrar confirmación única más amigable
  const confirmar = confirm(
    `🗑️ Finalizar Certificación\n\n` +
    `Cliente: ${clienteParaFinalizar.nombre || 'Sin nombre'}\n` +
    `NIT: ${clienteParaFinalizar.nit}\n\n` +
    `Esta acción eliminará todos los datos de esta certificación incluyendo evidencias y avances.\n\n` +
    `¿Desea continuar?`
  );

  if (!confirmar) {
    return;
  }

  try {
    // Guardar el NIT antes de limpiar clienteActual
    const nitAEliminar = clienteParaFinalizar.nit;
    
    // Usar función auxiliar para limpiar completamente el cliente
    limpiarClienteCompleto(nitAEliminar);
    
    // Limpiar variables globales
    clienteActual = null;
    checklistItems = [];
    currentPage = 1;
    
    // Limpiar sidebar
    const sidebarMenu = document.getElementById('sidebarMenu');
    if (sidebarMenu) {
      sidebarMenu.innerHTML = '';
    }
    
    // Ocultar FABs si están visibles
    const cleanFab = document.getElementById('cleanFab');
    const sidebarFab = document.getElementById('sidebarFab');
    if (cleanFab) cleanFab.style.display = 'none';
    if (sidebarFab) sidebarFab.style.display = 'none';
    
    // Mostrar mensaje de éxito amigable
    mostrarMensaje('✅ Certificación cerrada correctamente', 'success');
    
    // Regresar a la página de bienvenida después de un breve delay
    setTimeout(() => {
      showWelcomePage();
      
      // Limpiar campos del formulario de búsqueda
      const searchInput = document.getElementById('searchClientInput');
      if (searchInput) {
        searchInput.value = '';
      }
      
      const searchMessage = document.getElementById('searchMessage');
      if (searchMessage) {
        searchMessage.innerHTML = '';
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error al finalizar certificación:', error);
    mostrarMensaje('❌ Error al finalizar la certificación. Intente nuevamente.', 'error');
  }
}

// =============================================================================
// FUNCIÓN AUXILIAR: LIMPIAR COMPLETAMENTE UN CLIENTE
// =============================================================================
function limpiarClienteCompleto(nitCliente) {
  if (!nitCliente) return;
  
  try {
    // Lista de todas las claves posibles relacionadas con el cliente
    const clavesAEliminar = [
      `cliente_${nitCliente}`,
      `avances_${nitCliente}`,
      `evidencias_${nitCliente}`,
      `progreso_${nitCliente}`,
      `checklist_${nitCliente}`,
      `datos_${nitCliente}`,
      `autosave_${nitCliente}`
    ];
    
    // Eliminar todas las claves relacionadas
    clavesAEliminar.forEach(clave => {
      localStorage.removeItem(clave);
    });
    
    console.log(`✅ Cliente ${nitCliente} eliminado completamente de localStorage`);
    
  } catch (error) {
    console.error('Error al limpiar cliente:', error);
  }
}

// =============================================================================
// FUNCIONES MEJORADAS PARA BARRA DE HERRAMIENTAS DE EVIDENCIAS - ESTILO PORTAL 2
// =============================================================================

// Cerrar paleta de colores al hacer clic fuera - MEJORADO
document.addEventListener('click', function(e) {
  if (!e.target.closest('.color-selector')) {
    document.querySelectorAll('.color-palette').forEach(palette => {
      palette.classList.remove('show');
    });
  }
});

// Función auxiliar para convertir comandos de formato a estilos CSS
function getFormatStyle(comando) {
  switch(comando) {
    case 'bold':
      return 'font-weight: bold;';
    case 'italic':
      return 'font-style: italic;';
    case 'underline':
      return 'text-decoration: underline;';
    default:
      return '';
  }
}

// Función para limpiar spans de formato conflictivos
function cleanupFormatMarkers(div, comando) {
  try {
    // Buscar y limpiar spans con marcadores de formato específicos
    const markers = div.querySelectorAll(`[data-format-marker="${comando}"]`);
    markers.forEach(marker => {
      // Si el span solo contiene espacios no rompibles, eliminarlo
      if (marker.innerHTML === '&nbsp;' || marker.textContent.trim() === '') {
        marker.remove();
      } else {
        // Si tiene contenido, unwrap el contenido
        const parent = marker.parentNode;
        while (marker.firstChild) {
          parent.insertBefore(marker.firstChild, marker);
        }
        parent.removeChild(marker);
      }
    });
    
    // Limpiar spans vacíos que puedan haber quedado
    const emptySpans = div.querySelectorAll('span:empty');
    emptySpans.forEach(span => span.remove());
    
  } catch (e) {
    console.log('Error cleaning format markers:', e);
  }
}

// Función de depuración para verificar estado de formatos
function debugFormatState(evidenciaDiv) {
  if (!evidenciaDiv) return;
  
  const commands = ['bold', 'italic', 'underline'];
  const states = {};
  
  commands.forEach(cmd => {
    try {
      states[cmd] = document.queryCommandState(cmd);
    } catch (e) {
      states[cmd] = 'error: ' + e.message;
    }
  });
  
  console.log('🔍 Debug Format States:', states);
  return states;
}

// Función de formato simplificada y funcional
function formatoEvidencia(btn, comando) {
  console.log('🚀 formatoEvidencia called with:', comando);
  
  // Test simple para verificar que la función se está llamando
  if (comando === 'bold') {
    console.log('🎯 Botón de negrita presionado');
  }
  
  const div = btn.closest('.checklist-item').querySelector('.evidencias-editable');
  if (!div) {
    console.error('❌ No se encontró el div evidencias-editable');
    return;
  }
  
  console.log('✅ Div encontrado:', div);
  
  // Asegurar que el div tenga el foco
  div.focus();
  
  try {
    if (comando === 'createLink') {
      let url = prompt('Ingrese la URL del enlace:');
      if (url && url.trim()) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        document.execCommand('createLink', false, url);
      }
    } else {
      // Para todos los otros comandos, usar execCommand directamente
      const result = document.execCommand(comando, false, null);
      console.log(`✅ execCommand(${comando}) result:`, result);
    }
    
    // Actualizar estado visual del botón después de un pequeño delay
    setTimeout(() => {
      updateButtonState(btn, comando);
    }, 50);
    
  } catch (error) {
    console.error('❌ Error al ejecutar comando:', comando, error);
  }
  
  // Guardar cambios
  setTimeout(() => {
    const itemId = div.getAttribute('data-id');
    if (itemId) {
      guardarEstadoCampo(itemId);
    }
  }, 100);
}

// Función auxiliar simplificada para actualizar estado visual de botones
function updateButtonState(btn, comando) {
  console.log('🔄 updateButtonState called for:', comando);
  
  const div = btn.closest('.checklist-item').querySelector('.evidencias-editable');
  if (!div) {
    console.error('❌ No se encontró div en updateButtonState');
    return;
  }
  
  const toolbar = btn.closest('.toolbar-evidencia');
  if (!toolbar) {
    console.error('❌ No se encontró toolbar');
    return;
  }
  
  try {
    // Resetear todos los botones de formato en esta toolbar
    toolbar.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    
    // Verificar estados básicos y marcar botones activos
    setTimeout(() => {
      try {
        if (document.queryCommandState('bold')) {
          const boldBtn = toolbar.querySelector('button[title*="Negrita"]');
          if (boldBtn) boldBtn.classList.add('active');
        }
        if (document.queryCommandState('italic')) {
          const italicBtn = toolbar.querySelector('button[title*="Cursiva"]');
          if (italicBtn) italicBtn.classList.add('active');
        }
        if (document.queryCommandState('underline')) {
          const underlineBtn = toolbar.querySelector('button[title*="Subrayado"]');
          if (underlineBtn) underlineBtn.classList.add('active');
        }
        
        console.log('✅ Button states updated successfully');
      } catch (e) {
        console.error('❌ Error checking command states:', e);
      }
    }, 50);
    
  } catch (e) {
    console.error('❌ Error general en updateButtonState:', e);
  }
}

// Función para actualizar estados de botones cuando cambia la selección - MEJORADA
function updateAllButtonStates(evidenciaDiv) {
  const toolbar = evidenciaDiv.closest('.checklist-item').querySelector('.toolbar-evidencia');
  if (!toolbar) return;
  
  try {
    // Resetear todos los botones
    toolbar.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    
    // Mapeo de comandos y títulos para evitar repetición
    const formatCommands = {
      'bold': 'Negrita',
      'italic': 'Cursiva', 
      'underline': 'Subrayado',
      'justifyLeft': 'Alinear a la izquierda',
      'justifyCenter': 'Centrar',
      'justifyRight': 'Alinear a la derecha',
      'insertOrderedList': 'Lista numerada',
      'insertUnorderedList': 'Lista con viñetas'
    };
    
    // Verificar y marcar estados activos
    for (const [cmd, title] of Object.entries(formatCommands)) {
      try {
        if (document.queryCommandState(cmd)) {
          const targetBtn = toolbar.querySelector(`button[title*="${title}"]`);
          if (targetBtn) {
            targetBtn.classList.add('active');
          }
        }
      } catch (e) {
        // Ignorar errores específicos de queryCommandState para comandos individuales
      }
    }
  } catch (e) {
    // Ignorar errores generales
    console.log('Error updating all button states:', e);
  }
}

// Función para mostrar/ocultar paleta de colores - MEJORADA
function toggleColorPalette(btn) {
  const palette = btn.nextElementSibling;
  const isVisible = palette.classList.contains('show');
  
  // Cerrar todas las paletas
  document.querySelectorAll('.color-palette').forEach(p => p.classList.remove('show'));
  
  // Mostrar la paleta actual si no estaba visible
  if (!isVisible) {
    palette.classList.add('show');
  }
}

// Función para aplicar color seleccionado - MEJORADA
function aplicarColor(colorDiv, color) {
  const evidenciaDiv = colorDiv.closest('.checklist-item').querySelector('.evidencias-editable');
  if (!evidenciaDiv) return;
  
  evidenciaDiv.focus();
  
  // Obtener la selección actual
  const selection = window.getSelection();
  const hasSelection = selection.toString().length > 0;
  
  // Si no hay texto seleccionado, insertar un marcador con el color
  if (!hasSelection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    
    // Crear un span temporal con el color
    const span = document.createElement('span');
    span.style.color = color;
    span.innerHTML = '&nbsp;'; // Espacio no rompible
    span.setAttribute('data-color-marker', 'true');
    
    // Insertar el span en la posición del cursor
    range.insertNode(span);
    range.setStartAfter(span);
    range.setEndAfter(span);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  // Habilitar CSS styling para colores
  document.execCommand('styleWithCSS', false, true);
  document.execCommand('foreColor', false, color);
  
  // Cerrar la paleta
  colorDiv.closest('.color-palette').classList.remove('show');
  
  // Mantener el foco y cursor al final
  setTimeout(() => {
    evidenciaDiv.focus();
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, 10);
}

// =============================================================================
// FUNCIONES DE EDICIÓN DE IMÁGENES MEJORADAS - ESTILO PORTAL 2
// =============================================================================

// Edición de imágenes: rotar, voltear, eliminar - MEJORADO
function editarImagen(btn, accion) {
  const wrapper = btn.closest('.img-resizable-wrapper');
  if (!wrapper) return;
  
  const img = wrapper.querySelector('img');
  if (!img) return;
  
  if (accion === 'rotar') {
    let rot = parseInt(img.getAttribute('data-rot') || '0', 10);
    rot = (rot + 90) % 360;
    img.style.transform = `rotate(${rot}deg) scaleX(${img.getAttribute('data-flipH') === '1' ? -1 : 1})`;
    img.setAttribute('data-rot', rot);
  } else if (accion === 'flipH') {
    let flip = img.getAttribute('data-flipH') === '1' ? '0' : '1';
    img.style.transform = `rotate(${img.getAttribute('data-rot') || 0}deg) scaleX(${flip === '1' ? -1 : 1})`;
    img.setAttribute('data-flipH', flip);
  } else if (accion === 'eliminar') {
    wrapper.remove();
  }
}

// Funciones de paleta de colores comentadas - ya no se usan
/*
function toggleColorPalette(boton) {
  console.log('🎨 toggleColorPalette llamado');
  
  // Cerrar todas las paletas primero
  document.querySelectorAll('.color-palette').forEach(p => {
    p.style.setProperty('display', 'none', 'important');
  });
  
  // Mostrar la paleta de este botón
  const paleta = boton.nextElementSibling;
  if (paleta) {
    // Forzar display con !important
    paleta.style.setProperty('display', 'block', 'important');
    
    // Verificar que se aplicó correctamente
    const computedStyle = window.getComputedStyle(paleta);
    const displayValue = computedStyle.display;
    
    console.log('✅ Paleta encontrada. Display actual:', displayValue);
    console.log('✅ Elemento paleta:', paleta);
    
    if (displayValue === 'none') {
      console.log('⚠️ La paleta sigue oculta, intentando método alternativo');
      // Método alternativo: cambiar visibilidad
      paleta.style.setProperty('visibility', 'visible', 'important');
      paleta.style.setProperty('opacity', '1', 'important');
      paleta.style.setProperty('display', 'block', 'important');
    }
  } else {
    console.log('❌ No se encontró paleta');
  }
}

function aplicarColor(colorDiv, color) {
  console.log('🎨 aplicarColor llamado con color:', color);
  
  // Encontrar el campo de texto
  const item = colorDiv.closest('.checklist-item');
  const campo = item.querySelector('.evidencias-editable');
  
  if (!campo) {
    console.log('❌ No se encontró campo');
    return;
  }
  
  // Enfocar el campo
  campo.focus();
  
  // Aplicar el color de la manera más simple
  try {
    // Si hay texto seleccionado
    if (window.getSelection().toString()) {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('foreColor', false, color);
      console.log('✅ Color aplicado a selección');
    } else {
      // Si no hay selección, aplicar a todo el campo
      campo.style.color = color;
      console.log('✅ Color aplicado a todo el campo');
    }
  } catch (error) {
    // Fallback súper simple
    campo.style.color = color;
    console.log('✅ Color aplicado como fallback');
  }
  
  // Cerrar la paleta con !important
  const paleta = colorDiv.closest('.color-palette');
  if (paleta) {
    paleta.style.setProperty('display', 'none', 'important');
    console.log('✅ Paleta cerrada');
  }
}

// Cerrar paletas al hacer clic fuera
document.addEventListener('click', function(e) {
  if (!e.target.closest('.color-selector')) {
    document.querySelectorAll('.color-palette').forEach(p => {
      p.style.setProperty('display', 'none', 'important');
    });
  }
});
*/

// =============================================================================
// FIN FUNCIONES DE COLOR SIMPLES
// =============================================================================

function mostrarPuntosFaltantes() {
  window.sidebarMostrandoFaltantes = true;
  renderSidebar();
  
  // Scroll hacia arriba del sidebar
  const sidebarMenu = document.getElementById('sidebarMenu');
  if (sidebarMenu) {
    sidebarMenu.scrollTop = 0;
  }
  
  console.log('👁️ Mostrando puntos faltantes');
}

function mostrarPrimerosPuntos() {
  window.sidebarMostrandoFaltantes = false;
  renderSidebar();
  
  // Scroll hacia arriba del sidebar
  const sidebarMenu = document.getElementById('sidebarMenu');
  if (sidebarMenu) {
    sidebarMenu.scrollTop = 0;
  }
  
  console.log('👁️ Mostrando primeros puntos');
}

// Funciones legacy para compatibilidad
function expandirTodosLosPuntos() {
  mostrarPuntosFaltantes();
}

function contraerPuntos() {
  mostrarPrimerosPuntos();
}

function scrollToItem(itemIndex) {
  const itemsActuales = tipoChecklistActual || checklistItems;
  
  // Si el punto no está en la página actual, navegar a su página
  const pageNumber = Math.floor(itemIndex / ITEMS_PER_PAGE) + 1;
  if (pageNumber !== currentPage) {
    currentPage = pageNumber;
    renderChecklist();
    
    // Esperar a que se renderice y luego hacer scroll
    setTimeout(() => {
      scrollToItemElement(itemIndex);
    }, 100);
  } else {
    scrollToItemElement(itemIndex);
  }
}

function scrollToItemElement(itemIndex) {
  const itemsActuales = tipoChecklistActual || checklistItems;
  const item = itemsActuales[itemIndex];
  
  if (item) {
    const itemElement = document.getElementById(`item_${item.id}`);
    if (itemElement) {
      itemElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Agregar efecto visual temporal
      itemElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
      itemElement.style.transition = 'box-shadow 0.3s ease';
      setTimeout(() => {
        itemElement.style.boxShadow = '';
        setTimeout(() => {
          itemElement.style.transition = '';
        }, 300);
      }, 2000);
    }
  }
}

// Función legacy mantenida para compatibilidad
function expandirPuntosSiguientes() {
  expandirTodosLosPuntos();
}

// =============================================================================
// SIDEBAR ADAPTATIVO - RESPONSIVE
// =============================================================================

// Recalcular puntos visibles cuando cambie el tamaño de ventana
function initSidebarAdaptativo() {
  let resizeTimeout;
  
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      // Recalcular siempre, manteniendo el estado actual
      console.log('📐 Recalculando sidebar por cambio de tamaño');
      renderSidebar();
    }, 250);
  });
  
  // También recalcular cuando se carga la página
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      renderSidebar();
    }, 500);
  });
}

// Inicializar el sistema adaptativo
initSidebarAdaptativo();

// =============================================================================
// FUNCIÓN PARA MENÚ CONTEXTUAL DEL CLIENTE
// =============================================================================
function toggleClientMenu() {
  const dropdown = document.getElementById('clientDropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', function(e) {
  const menu = document.querySelector('.client-options-menu');
  const dropdown = document.getElementById('clientDropdown');
  
  if (menu && dropdown && !menu.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

// =============================================================================
// MANEJO DE IMÁGENES EN EVIDENCIAS
// =============================================================================

// Variables globales para el editor de imágenes
let imagenActual = null;
let datosImagenOriginal = null;

// Interceptar pegado de imágenes en evidencias
function initImagenHandler() {
  const evidenciasEditables = document.querySelectorAll('.evidencias-editable');
  
  evidenciasEditables.forEach(evidencia => {
    evidencia.addEventListener('paste', manejarPegadoImagen);
    evidencia.addEventListener('drop', manejarArrastrarImagen);
    evidencia.addEventListener('dragover', (e) => e.preventDefault());
  });
}

// Manejar pegado de imágenes
function manejarPegadoImagen(e) {
  const items = e.clipboardData.items;
  
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      e.preventDefault();
      const file = items[i].getAsFile();
      procesarImagen(file, e.target);
      break;
    }
  }
}

// Manejar arrastrar y soltar imágenes
function manejarArrastrarImagen(e) {
  e.preventDefault();
  const files = e.dataTransfer.files;
  
  for (let file of files) {
    if (file.type.indexOf('image') !== -1) {
      procesarImagen(file, e.target);
      break;
    }
  }
}

// Procesar imagen y crear contenedor con controles
function procesarImagen(file, contenedor) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const imagenData = e.target.result;
    const imagenId = 'img_' + Date.now();
    
    // Crear una imagen temporal para obtener dimensiones originales
    const tempImg = new Image();
    tempImg.onload = function() {
      // Usar la imagen original sin procesamiento de canvas para mantener máxima calidad
      let imagenFinal = imagenData;
      
      // Solo aplicar mejoras si la imagen es muy pequeña o de baja calidad
      const needsEnhancement = tempImg.width < 200 || tempImg.height < 200;
      
      if (needsEnhancement) {
        // Solo para imágenes muy pequeñas, aplicar mejora mínima
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Mantener tamaño original
        canvas.width = tempImg.width;
        canvas.height = tempImg.height;
        
        // Configurar ctx para máxima calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Dibujar imagen original
        ctx.drawImage(tempImg, 0, 0);
        
        // Aplicar mejora muy sutil solo al contraste
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Contraste muy sutil (factor 1.05) sin cambio de brillo
        const contrast = 1.05;
        
        for (let i = 0; i < data.length; i += 4) {
          // Aplicar contraste muy sutil solo a RGB
          data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128));     // R
          data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128)); // G
          data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128)); // B
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Usar máxima calidad de compresión
        imagenFinal = canvas.toDataURL('image/png'); // PNG para máxima calidad
      }
      
      // Crear contenedor de imagen con controles integrados
      const imagenContainer = document.createElement('div');
      imagenContainer.className = 'imagen-evidencia-container';
      imagenContainer.innerHTML = `
        <div class="imagen-wrapper">
          <img src="${imagenFinal}" class="imagen-evidencia" id="${imagenId}" alt="Evidencia" style="max-width: 100%; height: auto;">
          <div class="resize-handles">
            <div class="resize-handle nw" data-direction="nw"></div>
            <div class="resize-handle n" data-direction="n"></div>
            <div class="resize-handle ne" data-direction="ne"></div>
            <div class="resize-handle w" data-direction="w"></div>
            <div class="resize-handle e" data-direction="e"></div>
            <div class="resize-handle sw" data-direction="sw"></div>
            <div class="resize-handle s" data-direction="s"></div>
            <div class="resize-handle se" data-direction="se"></div>
          </div>
        </div>
      `;
      
      // Insertar la imagen en el contenedor
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(imagenContainer);
        range.collapse(false);
      } else {
        contenedor.appendChild(imagenContainer);
      }
      
      // Agregar un salto de línea después de la imagen
      const br = document.createElement('br');
      imagenContainer.parentNode.insertBefore(br, imagenContainer.nextSibling);
    };
    
    tempImg.src = imagenData;
  };
  
  reader.readAsDataURL(file);
}

// Redimensionar imagen directamente en línea
function redimensionarImagenInline(imagenId, nuevoTamaño) {
  const imagen = document.getElementById(imagenId);
  const sizeDisplay = imagen.closest('.imagen-wrapper').querySelector('.size-display');
  
  if (imagen && sizeDisplay) {
    imagen.style.maxWidth = nuevoTamaño + 'px';
    sizeDisplay.textContent = nuevoTamaño + 'px';
  }
}

// Rotar imagen 90 grados
function rotarImagenInline(imagenId) {
  const imagen = document.getElementById(imagenId);
  if (!imagen) return;
  
  let rotacionActual = imagen.dataset.rotacion || 0;
  rotacionActual = (parseInt(rotacionActual) + 90) % 360;
  
  imagen.style.transform = `rotate(${rotacionActual}deg)`;
  imagen.dataset.rotacion = rotacionActual;
}

// Inicializar manejadores de imagen cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
  initImagenHandler();
  
  // También reinicializar cuando se carguen nuevos checkpoints
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && node.querySelector && node.querySelector('.evidencias-editable')) {
            initImagenHandler();
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// === FUNCIONES PARA CONTROLES INLINE DE IMAGEN ===

let isDragging = false;
let currentHandle = null;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
let aspectRatioLocked = false; // Por defecto libre

// Inicializar eventos de redimensionamiento
function inicializarRedimensionamiento() {
  document.addEventListener('mousedown', function(e) {
    if (e.target.classList.contains('resize-handle')) {
      isDragging = true;
      currentHandle = e.target;
      startX = e.clientX;
      startY = e.clientY;
      
      const container = currentHandle.closest('.imagen-evidencia-container');
      const img = container.querySelector('.imagen-evidencia');
      
      // Obtener dimensiones reales actuales
      const computedStyle = window.getComputedStyle(img);
      startWidth = parseFloat(computedStyle.width);
      startHeight = parseFloat(computedStyle.height);
      
      e.preventDefault();
      document.body.style.cursor = getResizeCursor(currentHandle.dataset.direction);
      container.classList.add('resizing');
    }
  });
  
  document.addEventListener('mousemove', function(e) {
    if (isDragging && currentHandle) {
      e.preventDefault();
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const container = currentHandle.closest('.imagen-evidencia-container');
      const img = container.querySelector('.imagen-evidencia');
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      switch (currentHandle.dataset.direction) {
        case 'nw':
          newWidth = startWidth - deltaX;
          if (aspectRatioLocked) {
            newHeight = newWidth * (startHeight / startWidth);
          } else {
            newHeight = startHeight - deltaY;
          }
          break;
        case 'n':
          newWidth = startWidth;
          newHeight = startHeight - deltaY;
          if (aspectRatioLocked) {
            newWidth = newHeight * (startWidth / startHeight);
          }
          break;
        case 'ne':
          newWidth = startWidth + deltaX;
          if (aspectRatioLocked) {
            newHeight = newWidth * (startHeight / startWidth);
          } else {
            newHeight = startHeight - deltaY;
          }
          break;
        case 'w':
          newWidth = startWidth - deltaX;
          newHeight = startHeight;
          if (aspectRatioLocked) {
            newHeight = newWidth * (startHeight / startWidth);
          }
          break;
        case 'e':
          newWidth = startWidth + deltaX;
          newHeight = startHeight;
          if (aspectRatioLocked) {
            newHeight = newWidth * (startHeight / startWidth);
          }
          break;
        case 'sw':
          newWidth = startWidth - deltaX;
          if (aspectRatioLocked) {
            newHeight = newWidth * (startHeight / startWidth);
          } else {
            newHeight = startHeight + deltaY;
          }
          break;
        case 's':
          newWidth = startWidth;
          newHeight = startHeight + deltaY;
          if (aspectRatioLocked) {
            newWidth = newHeight * (startWidth / startHeight);
          }
          break;
        case 'se':
          newWidth = startWidth + deltaX;
          if (aspectRatioLocked) {
            newHeight = newWidth * (startHeight / startWidth);
          } else {
            newHeight = startHeight + deltaY;
          }
          break;
      }
      
      // Aplicar límites mínimos
      newWidth = Math.max(50, newWidth);
      newHeight = Math.max(50, newHeight);
      
      // Aplicar nuevas dimensiones
      img.style.width = newWidth + 'px';
      img.style.height = newHeight + 'px';
      
      // Actualizar posición de handles
      actualizarHandles(container);
    }
  });
  
  document.addEventListener('mouseup', function(e) {
    if (isDragging) {
      isDragging = false;
      if (currentHandle) {
        const container = currentHandle.closest('.imagen-evidencia-container');
        container.classList.remove('resizing');
      }
      currentHandle = null;
      document.body.style.cursor = 'default';
    }
  });
}

// Actualizar posición de handles
function actualizarHandles(container) {
  const img = container.querySelector('.imagen-evidencia');
  const handles = container.querySelector('.resize-handles');
  
  if (img && handles) {
    // Los handles se posicionan automáticamente con CSS relativo al contenedor
    // No necesita cálculos especiales sin rotación
  }
}

// Obtener cursor apropiado para la dirección
function getResizeCursor(direction) {
  const cursors = {
    'n': 'n-resize',
    's': 's-resize',
    'e': 'e-resize',
    'w': 'w-resize',
    'nw': 'nw-resize',
    'ne': 'ne-resize',
    'sw': 'sw-resize',
    'se': 'se-resize'
  };
  return cursors[direction] || 'default';
}

// Función optimizada para eliminar imagen completa
function eliminarImagenCompleta(container) {
    if (!container || !container.classList.contains('imagen-evidencia-container')) {
        return;
    }
    
    // Limpiar elementos hermanos que puedan ser residuos
    const parent = container.parentNode;
    
    // Eliminar <br> antes del contenedor
    const prevSibling = container.previousSibling;
    if (prevSibling && prevSibling.nodeName === 'BR') {
        prevSibling.remove();
    }
    
    // Eliminar <br> después del contenedor
    const nextSibling = container.nextSibling;
    if (nextSibling && nextSibling.nodeName === 'BR') {
        nextSibling.remove();
    }
    
    // Eliminar nodos de texto vacíos adyacentes
    let node = container.previousSibling;
    while (node && node.nodeType === 3 && node.textContent.trim() === '') {
        const toRemove = node;
        node = node.previousSibling;
        toRemove.remove();
    }
    
    node = container.nextSibling;
    while (node && node.nodeType === 3 && node.textContent.trim() === '') {
        const toRemove = node;
        node = node.nextSibling;
        toRemove.remove();
    }
    
    // Finalmente eliminar el contenedor
    container.remove();
    
    // Normalizar el contenedor padre para limpiar espacios
    if (parent && parent.normalize) {
        parent.normalize();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  inicializarRedimensionamiento();
  
  // Agregar event listener para tecla Delete
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Verificar si hay una imagen seleccionada
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Buscar el contenedor de imagen más cercano
        let imagenContainer = null;
        
        if (container.nodeType === 3) { // Text node
          imagenContainer = container.parentElement?.closest('.imagen-evidencia-container');
        } else if (container.nodeType === 1) { // Element node
          imagenContainer = container.closest?.('.imagen-evidencia-container') || 
                           container.querySelector?.('.imagen-evidencia-container');
        }
        
        // Si se encontró un contenedor de imagen, eliminarlo
        if (imagenContainer) {
          e.preventDefault();
          eliminarImagenCompleta(imagenContainer);
        }
      }
      
      // También verificar si el elemento activo es una imagen
      const activeElement = document.activeElement;
      if (activeElement && activeElement.closest('.imagen-evidencia-container')) {
        e.preventDefault();
        const container = activeElement.closest('.imagen-evidencia-container');
        eliminarImagenCompleta(container);
      }
    }
  });
  
  // Hacer las imágenes seleccionables y focusables
  document.addEventListener('click', function(e) {
    // Limpiar selecciones previas
    document.querySelectorAll('.imagen-evidencia-container.selected').forEach(container => {
      container.classList.remove('selected');
    });
    
    if (e.target.classList.contains('imagen-evidencia') || e.target.closest('.imagen-evidencia-container')) {
      const container = e.target.closest('.imagen-evidencia-container');
      const imagen = container.querySelector('.imagen-evidencia');
      
      if (container && imagen) {
        e.preventDefault();
        
        // Marcar como seleccionada
        container.classList.add('selected');
        imagen.focus();
        imagen.tabIndex = 0;
        
        // Seleccionar toda la imagen para que sea reemplazable
        const selection = window.getSelection();
        const range = document.createRange();
        
        try {
          range.selectNode(container);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (error) {
          // Si hay error, simplemente enfocar la imagen
          imagen.focus();
        }
      }
    }
  });
  
  // Limpiar selección cuando se hace clic fuera de las imágenes
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.imagen-evidencia-container')) {
      document.querySelectorAll('.imagen-evidencia-container.selected').forEach(container => {
        container.classList.remove('selected');
      });
    }
  });
  
  // Observer para nuevas imágenes
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1 && node.classList && node.classList.contains('imagen-evidencia-container')) {
          // Las nuevas imágenes funcionarán automáticamente con el sistema de handles
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// =============================================================================
//                           CONFIGURACIÓN DE PUNTOS DE CHEQUEO
// =============================================================================

// Variables globales para configuración
let editingCertType = null;
let editingCheckpoint = null;

// Función helper para configurar el botón de administración
function setupAdminButton() {
  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn && !adminBtn.hasAttribute('data-configured')) {
    console.log('✅ Configurando botón de administración...');
    adminBtn.onclick = function() {
      console.log('🔧 CLICK EN ADMINISTRACIÓN DETECTADO');
      showConfigPage();
    };
    adminBtn.setAttribute('data-configured', 'true');
    console.log('✅ Botón de administración configurado exitosamente');
  }
}

// Función para mostrar la página de configuración
function showConfigPage() {
  console.log('🔧 Mostrando página de configuración...');
  
  try {
    // Ocultar otras páginas
    const welcomePage = document.getElementById('welcomePage');
    const checklistPage = document.getElementById('checklistPage');
    const configPage = document.getElementById('configPage');
    
    if (welcomePage) welcomePage.style.display = 'none';
    if (checklistPage) checklistPage.style.display = 'none';
    if (configPage) {
      configPage.style.display = 'block';
      console.log('✅ Página de configuración mostrada');
    } else {
      console.error('❌ Página de configuración no encontrada en el DOM');
      return;
    }
    
    // Ocultar sidebar y botones flotantes
    const sidebar = document.getElementById('sidebar');
    const sidebarFab = document.getElementById('sidebarFab');
    const cleanFab = document.getElementById('cleanFab');
    
    if (sidebar) sidebar.style.display = 'none';
    if (sidebarFab) sidebarFab.style.display = 'none';
    if (cleanFab) cleanFab.style.display = 'none';
    
    // Cargar datos
    loadConfigurationData();
    console.log('✅ Datos de configuración cargados');
    
  } catch (error) {
    console.error('❌ Error al mostrar página de configuración:', error);
  }
}

// Función para volver a la página de bienvenida desde configuración
function backToWelcome() {
  document.getElementById('configPage').style.display = 'none';
  document.getElementById('welcomePage').style.display = 'block';
}

// Cargar datos de configuración
function loadConfigurationData() {
  console.log('📊 Cargando datos de configuración...');
  try {
    // Primero cargar tipos para que el filtro tenga opciones
    loadCertificationTypes();
    
    // Luego inicializar el filtro con todos los tipos
    updateCertTypeFilter();
    
    // Finalmente cargar los checkpoints con el filtro aplicado
    loadCheckpoints();
    
    console.log('✅ Datos de configuración cargados correctamente');
  } catch (error) {
    console.error('❌ Error al cargar datos de configuración:', error);
  }
}

// Cargar tipos de certificación
function loadCertificationTypes() {
  const container = document.getElementById('certTypesList');
  container.innerHTML = '';
  
  Object.keys(CERTIFICATION_TYPES).forEach(key => {
    const certType = CERTIFICATION_TYPES[key];
    const isProtected = CertificationDataManager.isProtected(key);
    
    const item = document.createElement('div');
    item.className = 'cert-type-item';
    item.innerHTML = `
      <div class="item-info">
        <div class="item-title">
          ${certType.name}
          ${isProtected ? '<span class="protected-badge">🔒 Protegido</span>' : ''}
        </div>
        <div class="item-key">${key}</div>
        <div class="item-description">${certType.description}</div>
      </div>
      <div class="item-actions">
        <button class="btn-edit" onclick="editCertificationType('${key}')" title="Editar tipo">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button class="btn-delete" onclick="deleteCertificationType('${key}')" title="${isProtected ? 'Tipo protegido - No se puede eliminar' : 'Eliminar tipo'}" ${isProtected ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
          </svg>
        </button>
      </div>
    `;
    container.appendChild(item);
  });
  
  // Actualizar el filtro de tipos
  updateCertTypeFilter();
}

// Cargar puntos de chequeo con filtro mejorado
function loadCheckpoints() {
  const container = document.getElementById('checkpointsList');
  const filter = document.getElementById('certTypeFilter');
  
  if (!container) {
    console.error('❌ Contenedor checkpointsList no encontrado');
    return;
  }
  
  // Si no hay filtro seleccionado, usar el primer tipo disponible
  let selectedType = filter ? filter.value : '';
  if (!selectedType && Object.keys(CERTIFICATION_TYPES).length > 0) {
    selectedType = Object.keys(CERTIFICATION_TYPES)[0];
    if (filter) filter.value = selectedType;
  }
  
  container.innerHTML = '';
  
  let checkpointNumber = 1;
  let totalPoints = 0;
  
  // Mostrar solo el tipo seleccionado
  const certType = CERTIFICATION_TYPES[selectedType];
  if (certType) {
    certType.items.forEach(item => {
      const checkpointItem = createCheckpointItem(selectedType, certType, item, checkpointNumber);
      container.appendChild(checkpointItem);
      checkpointNumber++;
      totalPoints++;
    });
  }
  
  // Mostrar resumen
  const summary = document.createElement('div');
  summary.className = 'checkpoints-summary';
  summary.innerHTML = `
    <span>📊 Total: <strong>${totalPoints} puntos de certificación</strong></span>
  `;
  container.appendChild(summary);
}

// Función auxiliar para crear elemento de checkpoint
function createCheckpointItem(certTypeKey, certType, item, number) {
  const checkpointItem = document.createElement('div');
  checkpointItem.className = 'checkpoint-item';
  checkpointItem.innerHTML = `
    <div class="item-info">
      <div class="item-title">${number}. ${item.texto}</div>
      <div class="criterion-text">${item.esperado}</div>
    </div>
    <div class="item-actions">
      <button class="btn-edit" onclick="editCheckpoint('${certTypeKey}', ${item.id})" title="Editar">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
      </button>
      <button class="btn-delete" onclick="deleteCheckpoint('${certTypeKey}', ${item.id})" title="Eliminar">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
        </svg>
      </button>
    </div>
  `;
  return checkpointItem;
}

// Función auxiliar para filtrar checkpoints (llamada desde updateCertTypeFilter)
function filterCheckpoints() {
  loadCheckpoints();
}

// Actualizar filtro de tipos de certificación
function updateCertTypeFilter() {
  const filter = document.getElementById('certTypeFilter');
  const checkpointCertType = document.getElementById('checkpointCertType');
  
  // Limpiar opciones existentes
  filter.innerHTML = ''; // Sin opción "Todos los tipos"
  if (checkpointCertType) {
    checkpointCertType.innerHTML = '<option value="">Seleccione el tipo</option>';
  }
  
  const keys = Object.keys(CERTIFICATION_TYPES);
  let firstKey = null;
  
  // Agregar opciones
  keys.forEach((key, index) => {
    const certType = CERTIFICATION_TYPES[key];
    
    if (index === 0) {
      firstKey = key;
    }
    
    const filterOption = document.createElement('option');
    filterOption.value = key;
    filterOption.textContent = certType.name;
    filter.appendChild(filterOption);
    
    if (checkpointCertType) {
      const checkpointOption = document.createElement('option');
      checkpointOption.value = key;
      checkpointOption.textContent = certType.name;
      checkpointCertType.appendChild(checkpointOption);
    }
  });
  
  // Por defecto seleccionar el primer tipo
  if (firstKey) {
    filter.value = firstKey;
  }
}

// Alias para compatibilidad con el HTML
function filterCheckpointsByType() {
  filterCheckpoints();
}

// Editar tipo de certificación
function editCertificationType(key) {
  editingCertType = key;
  const certType = CERTIFICATION_TYPES[key];
  
  document.getElementById('certTypeModalTitle').textContent = 'Editar Tipo de Certificación';
  document.getElementById('certTypeKey').value = key; // Campo oculto mantiene la clave original
  document.getElementById('certTypeName').value = certType.name;
  document.getElementById('certTypeDescription').value = certType.description;
  document.getElementById('deleteCertTypeBtn').style.display = 'inline-block';
  
  showModal('editCertTypeModal');
}

// Agregar nuevo tipo de certificación
function addCertificationType() {
  editingCertType = null;
  
  document.getElementById('certTypeModalTitle').textContent = 'Agregar Tipo de Certificación';
  document.getElementById('certTypeKey').value = ''; // Campo oculto, se generará automáticamente
  document.getElementById('certTypeName').value = '';
  document.getElementById('certTypeDescription').value = '';
  document.getElementById('deleteCertTypeBtn').style.display = 'none';
  
  showModal('editCertTypeModal');
}

// Guardar tipo de certificación
async function saveCertificationType() {
  const name = document.getElementById('certTypeName').value.trim();
  const description = document.getElementById('certTypeDescription').value.trim() || 'Certificación personalizada';
  
  if (!name) {
    showDiscreteMessage('Por favor ingrese el nombre del tipo de certificación.', 'error');
    return;
  }
  
  // Generar clave automáticamente si no estamos editando
  let key = document.getElementById('certTypeKey').value;
  if (!key || !editingCertType) {
    key = generateCertTypeKey(name);
    document.getElementById('certTypeKey').value = key;
  }
  
  // Si es nuevo tipo y ya existe la clave
  if (!editingCertType && CERTIFICATION_TYPES[key]) {
    showDiscreteMessage('Ya existe un tipo de certificación con ese nombre.', 'error');
    return;
  }
  
  // Crear o actualizar
  if (!CERTIFICATION_TYPES[key]) {
    CERTIFICATION_TYPES[key] = {
      name: name,
      description: description,
      items: []
    };
  } else {
    CERTIFICATION_TYPES[key].name = name;
    CERTIFICATION_TYPES[key].description = description;
  }
  
  // Guardar tipos usando el adaptador colaborativo
  await collaborativeAdapter.guardarTiposCertificacion(CERTIFICATION_TYPES);
  
  // Recargar datos y cerrar modal
  loadConfigurationData();
  hideModal('editCertTypeModal');
  
  // NUEVO: Actualizar certificaciones en tiempo real
  refreshCertificationSystem();
  
  // Mensaje discreto
  showDiscreteMessage('Tipo de certificación guardado correctamente.', 'success');
}

// Eliminar tipo de certificación
async function deleteCertificationType(key) {
  // Verificar si el tipo está protegido
  if (CertificationDataManager.isProtected(key)) {
    showDiscreteMessage('Este tipo de certificación está protegido y no se puede eliminar.', 'warning');
    return;
  }
  
  if (confirm('¿Está seguro de que desea eliminar este tipo de certificación? Se perderán todos los puntos de chequeo asociados.')) {
    delete CERTIFICATION_TYPES[key];
    await collaborativeAdapter.guardarTiposCertificacion(CERTIFICATION_TYPES);
    loadConfigurationData();
    hideModal('editCertTypeModal');
    
    // NUEVO: Actualizar certificaciones en tiempo real
    refreshCertificationSystem();
    
    // Mensaje discreto sin alert adicional
    showDiscreteMessage('Tipo de certificación eliminado correctamente.', 'success');
  }
}

// Editar punto de chequeo
function editCheckpoint(certTypeKey, checkpointId) {
  editingCheckpoint = { certTypeKey, checkpointId };
  const certType = CERTIFICATION_TYPES[certTypeKey];
  const checkpoint = certType.items.find(item => item.id === checkpointId);
  
  document.getElementById('checkpointModalTitle').textContent = 'Editar Punto de Chequeo';
  document.getElementById('checkpointCertType').value = certTypeKey;
  document.getElementById('checkpointTitle').value = checkpoint.texto;
  document.getElementById('checkpointExpected').value = checkpoint.esperado;
  document.getElementById('deleteCheckpointBtn').style.display = 'inline-block';
  
  updateCertTypeFilter(); // Asegurar que las opciones estén actualizadas
  showModal('editCheckpointModal');
}

// Agregar nuevo punto de chequeo
function addCheckpoint() {
  editingCheckpoint = null;
  
  document.getElementById('checkpointModalTitle').textContent = 'Agregar Punto de Chequeo';
  document.getElementById('checkpointCertType').value = '';
  document.getElementById('checkpointTitle').value = '';
  document.getElementById('checkpointExpected').value = '';
  document.getElementById('deleteCheckpointBtn').style.display = 'none';
  
  updateCertTypeFilter();
  showModal('editCheckpointModal');
}

// Guardar punto de chequeo
async function saveCheckpoint() {
  const certTypeKey = document.getElementById('checkpointCertType').value;
  const title = document.getElementById('checkpointTitle').value.trim();
  const expected = document.getElementById('checkpointExpected').value.trim();
  
  if (!certTypeKey || !title || !expected) {
    showDiscreteMessage('Por favor complete todos los campos obligatorios.', 'error');
    return;
  }
  
  if (!CERTIFICATION_TYPES[certTypeKey]) {
    showDiscreteMessage('Tipo de certificación no válido.', 'error');
    return;
  }
  
  if (editingCheckpoint) {
    // Editando checkpoint existente
    const { certTypeKey: oldCertType, checkpointId } = editingCheckpoint;
    
    // Si cambió de tipo de certificación, mover el checkpoint
    if (oldCertType !== certTypeKey) {
      // Remover del tipo anterior
      CERTIFICATION_TYPES[oldCertType].items = CERTIFICATION_TYPES[oldCertType].items.filter(
        item => item.id !== checkpointId
      );
      
      // Agregar al nuevo tipo con nuevo ID
      const newId = Math.max(0, ...CERTIFICATION_TYPES[certTypeKey].items.map(item => item.id)) + 1;
      CERTIFICATION_TYPES[certTypeKey].items.push({
        id: newId,
        texto: title,
        esperado: expected
      });
    } else {
      // Actualizar en el mismo tipo
      const checkpoint = CERTIFICATION_TYPES[certTypeKey].items.find(item => item.id === checkpointId);
      checkpoint.texto = title;
      checkpoint.esperado = expected;
    }
  } else {
    // Nuevo checkpoint
    const newId = Math.max(0, ...CERTIFICATION_TYPES[certTypeKey].items.map(item => item.id)) + 1;
    CERTIFICATION_TYPES[certTypeKey].items.push({
      id: newId,
      texto: title,
      esperado: expected
    });
  }
  
  // Guardar tipos usando el adaptador colaborativo
  await collaborativeAdapter.guardarTiposCertificacion(CERTIFICATION_TYPES);
  
  // Recargar datos y cerrar modal
  loadConfigurationData();
  hideModal('editCheckpointModal');
  
  // NUEVO: Actualizar certificaciones en tiempo real
  refreshCertificationSystem();
  
  // Mensaje discreto
  showDiscreteMessage('Punto de chequeo guardado correctamente.', 'success');
}

// Eliminar punto de chequeo
async function deleteCheckpoint(certTypeKey, checkpointId) {
  if (confirm('¿Está seguro de que desea eliminar este punto de chequeo?')) {
    CERTIFICATION_TYPES[certTypeKey].items = CERTIFICATION_TYPES[certTypeKey].items.filter(
      item => item.id !== checkpointId
    );
    
    await collaborativeAdapter.guardarTiposCertificacion(CERTIFICATION_TYPES);
    loadConfigurationData();
    
    // NUEVO: Actualizar certificaciones en tiempo real
    refreshCertificationSystem();
    
    // Mensaje discreto sin alert adicional
    showDiscreteMessage('Punto de chequeo eliminado correctamente.', 'success');
  }
}

// Función helper para mostrar modales
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  } else {
    console.error('❌ Modal no encontrado:', modalId);
  }
}

// Función helper para ocultar modales
function hideModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Función para mostrar mensajes discretos (toast)
function showDiscreteMessage(message, type = 'info') {
  // Crear elemento toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Estilos inline para el toast
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 24px',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '500',
    fontSize: '0.875rem',
    zIndex: '10000',
    transform: 'translateX(100%)',
    transition: 'all 0.3s ease',
    maxWidth: '350px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  });
  
  // Colores según el tipo
  if (type === 'success') {
    toast.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  } else if (type === 'error') {
    toast.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  } else if (type === 'warning') {
    toast.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  } else {
    toast.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
  }
  
  // Agregar al DOM
  document.body.appendChild(toast);
  
  // Animar entrada
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Animar salida y remover
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Función para generar clave automáticamente a partir del nombre
function generateCertTypeKey(name) {
  if (!name) return '';
  
  // Convertir a minúsculas, remover acentos y caracteres especiales
  let key = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
  
  // Agregar sufijo numérico si ya existe
  let finalKey = key;
  let counter = 1;
  while (CERTIFICATION_TYPES[finalKey]) {
    finalKey = `${key}-${counter}`;
    counter++;
  }
  
  return finalKey;
}

// Event listeners para la página de configuración
document.addEventListener('DOMContentLoaded', function() {
  // Prevenir múltiples inicializaciones
  if (window.configPageInitialized) {
    console.log('⚠️ Página de configuración ya inicializada, saltando...');
    return;
  }
  window.configPageInitialized = true;
  
  // Botón para volver de configuración
  const backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
  if (backToWelcomeBtn) backToWelcomeBtn.addEventListener('click', backToWelcome);
  
  // Botones para agregar
  const addCertTypeBtn = document.getElementById('addCertTypeBtn');
  const addCheckpointBtn = document.getElementById('addCheckpointBtn');
  if (addCertTypeBtn) addCertTypeBtn.addEventListener('click', addCertificationType);
  if (addCheckpointBtn) addCheckpointBtn.addEventListener('click', addCheckpoint);
  
  // Filtro de tipos
  const certTypeFilter = document.getElementById('certTypeFilter');
  if (certTypeFilter) certTypeFilter.addEventListener('change', loadCheckpoints);
  
  // Modales - Tipo de certificación
  const closeCertTypeModalBtn = document.getElementById('closeCertTypeModalBtn');
  const cancelCertTypeBtn = document.getElementById('cancelCertTypeBtn');
  const saveCertTypeBtn = document.getElementById('saveCertTypeBtn');
  const deleteCertTypeBtn = document.getElementById('deleteCertTypeBtn');
  
  if (closeCertTypeModalBtn) closeCertTypeModalBtn.addEventListener('click', () => hideModal('editCertTypeModal'));
  if (cancelCertTypeBtn) cancelCertTypeBtn.addEventListener('click', () => hideModal('editCertTypeModal'));
  if (saveCertTypeBtn) saveCertTypeBtn.addEventListener('click', saveCertificationType);
  if (deleteCertTypeBtn) deleteCertTypeBtn.addEventListener('click', () => {
    deleteCertificationType(editingCertType);
    hideModal('editCertTypeModal');
  });
  
  // Modales - Punto de chequeo
  const closeCheckpointModalBtn = document.getElementById('closeCheckpointModalBtn');
  const cancelCheckpointBtn = document.getElementById('cancelCheckpointBtn');
  const saveCheckpointBtn = document.getElementById('saveCheckpointBtn');
  const deleteCheckpointBtn = document.getElementById('deleteCheckpointBtn');
  
  if (closeCheckpointModalBtn) closeCheckpointModalBtn.addEventListener('click', () => hideModal('editCheckpointModal'));
  if (cancelCheckpointBtn) cancelCheckpointBtn.addEventListener('click', () => hideModal('editCheckpointModal'));
  if (saveCheckpointBtn) saveCheckpointBtn.addEventListener('click', saveCheckpoint);
  if (deleteCheckpointBtn) deleteCheckpointBtn.addEventListener('click', () => {
    const { certTypeKey, checkpointId } = editingCheckpoint;
    deleteCheckpoint(certTypeKey, checkpointId);
    hideModal('editCheckpointModal');
  });
  
  // Cerrar modales haciendo clic fuera
  window.addEventListener('click', function(event) {
    const modals = ['editCertTypeModal', 'editCheckpointModal'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (event.target === modal) {
        hideModal(modalId);
      }
    });
  });
  
  // Cargar tipos de certificación desde localStorage al iniciar - REMOVIDO
  // Ahora se maneja con CertificationDataManager
  
  // Test de configuración - ejecutar después de un pequeño delay
  setTimeout(() => {
    console.log('🧪 Ejecutando test de configuración...');
    const configBtn = document.getElementById('configBtn');
    const configPage = document.getElementById('configPage');
    console.log('Botón de configuración:', configBtn ? 'ENCONTRADO' : 'NO ENCONTRADO');
    console.log('Página de configuración:', configPage ? 'ENCONTRADA' : 'NO ENCONTRADA');
    
    // El botón de configuración se maneja en el HTML directamente
  }, 1000);
  
  // Observer para detectar cambios en el DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Verificar si se necesita alguna reconfiguración del DOM
        console.log('DOM cambió');
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// =============================================================================
// FUNCIONES DE ACTUALIZACIÓN EN TIEMPO REAL
// =============================================================================

/**
 * Actualiza las certificaciones en curso cuando se modifican tipos/puntos
 */
function updateActiveCertifications() {
  // Si hay una certificación en curso
  if (clienteActual && clienteActual.certificationType) {
    const currentCertType = clienteActual.certificationType;
    
    // Verificar si el tipo de certificación todavía existe
    if (CERTIFICATION_TYPES[currentCertType]) {
      // Actualizar el checklist actual con los nuevos puntos
      tipoChecklistActual = CERTIFICATION_TYPES[currentCertType].items;
      window.tipoChecklistActual = tipoChecklistActual;
      
      // Si estamos en la página del checklist, actualizar la vista
      const checklistPage = document.getElementById('checklistPage');
      if (checklistPage && checklistPage.style.display !== 'none') {
        // Preservar el estado actual de los campos antes de renderizar
        guardarCamposPaginaActual();
        
        // Re-renderizar el checklist con los nuevos puntos
        renderChecklist();
        
        // Actualizar estadísticas y sidebar
        actualizarEstadisticasProgreso();
        renderSidebar();
        
        console.log('🔄 Certificación en curso actualizada con nuevos puntos');
      }
    } else {
      // El tipo de certificación fue eliminado
      showDiscreteMessage('⚠️ El tipo de certificación de este cliente fue eliminado. La certificación continúa con puntos básicos.', 'warning');
      
      // Fallback a checklist básico
      tipoChecklistActual = checklistItems;
      window.tipoChecklistActual = tipoChecklistActual;
      
      if (checklistPage && checklistPage.style.display !== 'none') {
        renderChecklist();
        actualizarEstadisticasProgreso();
        renderSidebar();
      }
    }
  }
}

/**
 * Actualiza el selector de tipos de certificación en el modal de creación
 */
function updateCertificationTypeSelector() {
  const selector = document.getElementById('certificationType');
  if (selector) {
    const currentValue = selector.value;
    
    // Debug: mostrar tipos disponibles
    console.log('🔄 Actualizando selector. Tipos disponibles:', Object.keys(CERTIFICATION_TYPES));
    
    // Limpiar opciones existentes
    selector.innerHTML = '<option value="">Seleccione el tipo de certificación</option>';
    
    // Agregar opciones actualizadas
    Object.keys(CERTIFICATION_TYPES).forEach(key => {
      const certType = CERTIFICATION_TYPES[key];
      if (certType && certType.name) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${certType.name} - ${certType.description}`;
        selector.appendChild(option);
        console.log(`✅ Agregado: ${key} - ${certType.name}`);
      }
    });
    
    // Restaurar valor seleccionado si todavía existe
    if (currentValue && CERTIFICATION_TYPES[currentValue]) {
      selector.value = currentValue;
    }
    
    console.log(`📊 Selector actualizado con ${Object.keys(CERTIFICATION_TYPES).length} tipos`);
  } else {
    console.error('❌ Selector de certificación no encontrado');
  }
}

/**
 * Función principal para refrescar todo el sistema después de cambios
 */
function refreshCertificationSystem() {
  // 1. Actualizar certificaciones en curso
  updateActiveCertifications();
  
  // 2. Actualizar selector de tipos en modal de creación
  updateCertificationTypeSelector();
  
  // 3. Actualizar filtros en página de configuración
  updateCertTypeFilter();
  
  // 4. Recargar datos de configuración
  loadConfigurationData();
  
  console.log('🔄 Sistema de certificación completamente actualizado');
}

// =============================================================================
// FUNCIONES DE EXPORTACIÓN E INFORMES
// =============================================================================

/**
 * Descarga un informe completo de avances y clientes en proceso de certificación en formato Excel (CSV)
 */
function downloadProgressReport() {
  try {
    const allClients = [];
    
    // Recopilar todos los clientes del localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('cliente_')) {
        const clientData = JSON.parse(localStorage.getItem(key));
        const progressData = localStorage.getItem(`avances_${clientData.nit}`);
        
        // Calcular estadísticas de progreso
        let totalPoints = 0;
        let completedPoints = 0;
        let approvedPoints = 0;
        
        if (clientData.certificationType && CERTIFICATION_TYPES[clientData.certificationType]) {
          totalPoints = CERTIFICATION_TYPES[clientData.certificationType].items.length;
          
          if (progressData) {
            const progress = JSON.parse(progressData);
            Object.keys(progress).forEach(fieldKey => {
              if (fieldKey.startsWith('aprobado_')) {
                completedPoints++;
                if (progress[fieldKey] === 'Aprobado') {
                  approvedPoints++;
                }
              }
            });
          }
        }
        
        allClients.push({
          nit: clientData.nit,
          nombre: clientData.name || clientData.nombre,
          tipoCertificacion: CERTIFICATION_TYPES[clientData.certificationType]?.name || 'No definido',
          fechaCreacion: new Date(clientData.createdAt).toLocaleDateString(),
          ultimaModificacion: new Date(clientData.lastModified).toLocaleDateString(),
          puntosTotal: totalPoints,
          puntosCompletados: completedPoints,
          puntosAprobados: approvedPoints,
          porcentajeProgreso: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
          porcentajeAprobacion: completedPoints > 0 ? Math.round((approvedPoints / completedPoints) * 100) : 0
        });
      }
    }
    
    if (allClients.length === 0) {
      showDiscreteMessage('No hay clientes registrados para exportar.', 'warning');
      return;
    }
    
    // Crear CSV con BOM para UTF-8
    const BOM = '\uFEFF';
    const headers = [
      'NIT', 'Nombre del Comercio', 'Tipo de Certificación', 'Fecha de Creación', 
      'Última Modificación', 'Puntos Total', 'Puntos Completados', 'Puntos Aprobados',
      'Progreso (%)', 'Aprobación (%)'
    ];
    
    let csvContent = BOM + headers.join(',') + '\n';
    
    allClients.forEach(client => {
      const row = [
        client.nit,
        `"${client.nombre}"`,
        `"${client.tipoCertificacion}"`,
        client.fechaCreacion,
        client.ultimaModificacion,
        client.puntosTotal,
        client.puntosCompletados,
        client.puntosAprobados,
        client.porcentajeProgreso,
        client.porcentajeAprobacion
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `informe_certificaciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showDiscreteMessage(`Informe descargado: ${allClients.length} clientes exportados.`, 'success');
    
  } catch (error) {
    console.error('Error al generar informe:', error);
    showDiscreteMessage('Error al generar el informe. Intente nuevamente.', 'error');
  }
}

/**
 * Descarga la configuración de tipos de certificación y puntos en formato Excel
 */
function downloadConfigurationReport() {
  try {
    // BOM para UTF-8 para preservar tildes y caracteres especiales
    const BOM = '\uFEFF';
    let csvContent = BOM + "Tipo de Certificación,Punto de Control,Descripción\n";
    
    // Iterar sobre todos los tipos de certificación
    Object.entries(CERTIFICATION_TYPES).forEach(([typeKey, typeData]) => {
      const typeName = typeData.name || typeKey;
      
      if (typeData.items && typeData.items.length > 0) {
        typeData.items.forEach((item, index) => {
          // Manejar diferentes estructuras de datos para los puntos
          let punto = '';
          let descripcion = '';
          
          if (typeof item === 'string') {
            punto = `${index + 1}. ${item}`;
            descripcion = 'Que se espera';
          } else if (typeof item === 'object' && item !== null) {
            // Buscar el texto del punto en diferentes propiedades posibles
            const puntoTexto = item.texto || item.name || item.text || item.title || item.label || 
                   (typeof item.toString === 'function' && item.toString() !== '[object Object]' ? item.toString() : '') ||
                   JSON.stringify(item);
            punto = `${index + 1}. ${puntoTexto}`;
            // Extraer el resultado esperado del campo esperado
            descripcion = item.esperado || item.expected || item.description || item.desc || item.details || 'Que se espera';
          } else {
            punto = `${index + 1}. ${String(item || '')}`;
            descripcion = 'Que se espera';
          }
          
          // Convertir a string y escapar comillas para CSV
          const typeNameEscaped = `"${String(typeName).replace(/"/g, '""')}"`;
          const puntoEscaped = `"${String(punto).replace(/"/g, '""')}"`;
          const descripcionEscaped = `"${String(descripcion).replace(/"/g, '""')}"`;
          
          csvContent += `${typeNameEscaped},${puntoEscaped},${descripcionEscaped}\n`;
        });
      } else {
        // Si no hay puntos definidos, agregar una fila vacía
        const typeNameEscaped = `"${String(typeName).replace(/"/g, '""')}"`;
        csvContent += `${typeNameEscaped},"Sin puntos definidos","Que se espera"\n`;
      }
    });
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const fechaActual = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `configuracion_certificaciones_${fechaActual}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Calcular estadísticas para mensaje
    const totalTypes = Object.keys(CERTIFICATION_TYPES).length;
    const totalPoints = Object.values(CERTIFICATION_TYPES).reduce((total, type) => {
      return total + (type.items ? type.items.length : 0);
    }, 0);
    
    showDiscreteMessage(`Configuración exportada: ${totalTypes} tipos, ${totalPoints} puntos.`, 'success');
    
  } catch (error) {
    console.error('Error al exportar configuración:', error);
    showDiscreteMessage('Error al exportar configuración. Intente nuevamente.', 'error');
  }
}

/**
 * Verifica si se está accediendo con una URL informativa
 */
function checkInformativeURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const infoParam = urlParams.get('info');
  
  if (infoParam) {
    try {
      // Decodificar datos de la URL
      const decodedData = JSON.parse(decodeURIComponent(atob(infoParam)));
      
      if (decodedData.readonly) {
        showInformativeView(decodedData);
        return;
      }
    } catch (error) {
      console.error('Error al procesar URL informativa:', error);
      showDiscreteMessage('URL informativa inválida.', 'error');
    }
  }
}

/**
 * Muestra la vista informativa de un tipo de certificación
 */
function showInformativeView(certData) {
  // Ocultar todos los elementos principales
  document.getElementById('welcomePage').style.display = 'none';
  document.getElementById('configPage').style.display = 'none';
  document.getElementById('certificationPage').style.display = 'none';
  
  // Crear contenido informativo
  const informativeHTML = `
    <div class="informative-page">
      <div class="informative-header">
        <div class="informative-brand">
          <img src="img/PSE.png" alt="PSE Logo" class="info-logo">
          <div class="info-title">
            <h1>Portal de Certificación PSE</h1>
            <p>Información de Certificación</p>
          </div>
        </div>
      </div>
      
      <div class="informative-content">
        <div class="cert-info-card">
          <h2>📋 ${certData.name}</h2>
          <p class="cert-description">${certData.description}</p>
          <p class="info-note"><strong>Vista informativa:</strong> Esta es una vista de solo lectura de los requisitos de certificación.</p>
          
          <div class="requirements-section">
            <h3>📝 Requisitos de Certificación</h3>
            <div class="requirements-list">
              ${certData.items.map((item, index) => `
                <div class="requirement-item">
                  <div class="requirement-header">
                    <span class="requirement-number">${index + 1}</span>
                    <h4>${item.texto || item.name || item}</h4>
                  </div>
                  <div class="requirement-expected">
                    <strong>Resultado esperado:</strong>
                    <p>${item.esperado || item.expected || 'No especificado'}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="info-footer">
            <p>📅 Información generada el: ${new Date(certData.generated).toLocaleDateString()}</p>
            <p>Para iniciar un proceso de certificación, contacte al administrador del sistema.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Insertar el contenido en el body
  document.body.insertAdjacentHTML('beforeend', informativeHTML);
}

// =============================================================================
// FUNCIONES DE ADMINISTRACIÓN JSON
// =============================================================================

/**
 * Exporta todos los datos del sistema colaborativo
 */
async function exportarTodosLosDatos() {
  try {
    console.log('📦 Iniciando exportación completa...');
    
    // Mostrar indicador de carga
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" class="loading-spinner"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416"><animateTransform attributeName="transform" type="rotate" dur="2s" values="0 12 12;360 12 12" repeatCount="indefinite"/></circle></svg> Exportando...';
    btn.disabled = true;
    
    // Usar función específica del sistema actual si existe
    if (collaborativeAdapter.currentSystem && collaborativeAdapter.currentSystem.exportarTodosLosDatos) {
      await collaborativeAdapter.currentSystem.exportarTodosLosDatos();
    } else {
      // Fallback: mostrar panel de administración
      await collaborativeAdapter.mostrarPanelAdministracion();
    }
    
    // Restaurar botón
    btn.innerHTML = originalText;
    btn.disabled = false;
    
    console.log('✅ Exportación completada');
    
  } catch (error) {
    console.error('❌ Error en exportación:', error);
    collaborativeAdapter.mostrarNotificacion('Error al exportar datos', 'error');
    
    // Restaurar botón en caso de error
    if (event.target) {
      event.target.innerHTML = originalText;
      event.target.disabled = false;
    }
  }
}

/**
 * Importa datos desde un archivo JSON
 */
async function importarDatos(archivo) {
  if (!archivo) {
    collaborativeAdapter.mostrarNotificacion('No se seleccionó ningún archivo', 'error');
    return;
  }
  
  if (!archivo.name.endsWith('.json')) {
    collaborativeAdapter.mostrarNotificacion('Por favor seleccione un archivo JSON válido', 'error');
    return;
  }
  
  try {
    console.log(`📥 Importando archivo: ${archivo.name}`);
    
    // Usar función específica del sistema actual si existe
    let resultado = false;
    if (collaborativeAdapter.currentSystem && collaborativeAdapter.currentSystem.importarDatos) {
      resultado = await collaborativeAdapter.currentSystem.importarDatos(archivo);
    } else {
      // Fallback a función genérica de importación
      resultado = await importarDatosGenerico(archivo);
    }
    
    if (resultado) {
      // Recargar datos en la interfaz
      await loadConfigurationData();
      
      // Actualizar selector de certificaciones
      updateCertificationTypeSelector();
      
      console.log('✅ Importación completada correctamente');
      collaborativeAdapter.mostrarNotificacion(`Datos importados exitosamente desde ${archivo.name}`, 'success');
    }
    
  } catch (error) {
    console.error('❌ Error en importación:', error);
    collaborativeAdapter.mostrarNotificacion('Error al importar el archivo JSON', 'error');
  } finally {
    // Limpiar input de archivo
    const fileInput = document.getElementById('importFileInput');
    if (fileInput) fileInput.value = '';
  }
}

/**
 * Muestra estadísticas completas del sistema colaborativo
 */
async function mostrarEstadisticas() {
  try {
    console.log('📊 Obteniendo estadísticas...');
    
    // Usar función específica del sistema actual si existe
    if (collaborativeAdapter.currentSystem && collaborativeAdapter.currentSystem.mostrarEstadisticas) {
      return await collaborativeAdapter.currentSystem.mostrarEstadisticas();
    }
    
    // Fallback: obtener estadísticas básicas
    const stats = await collaborativeAdapter.mostrarEstadisticas();
    
    if (!stats) {
      collaborativeAdapter.mostrarNotificacion('No se pudieron obtener las estadísticas', 'error');
      return;
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    collaborativeAdapter.mostrarNotificacion('Error al obtener estadísticas', 'error');
  }
}
