/**
 * =============================================================================
 * SISTEMA DE PERSISTENCIA LOCAL CON ARCHIVOS JSON
 * Genera y descarga archivos JSON que pueden reemplazar manualmente
 * =============================================================================
 */

class LocalJSONManager {
  
  static DATA_FOLDER = './data/';
  static FILES = {
    CLIENTES: 'clientes.json',
    AVANCES: 'avances.json', 
    TIPOS_CERTIFICACION: 'tipos-certificacion.json'
  };
  
  /**
   * Guarda un cliente y genera archivo JSON para descarga
   */
  static async guardarCliente(cliente) {
    // 1. Guardar en memoria/localStorage como respaldo
    localStorage.setItem(`cliente_${cliente.nit}`, JSON.stringify(cliente));
    
    // 2. Obtener todos los clientes actuales
    const todosLosClientes = await this.obtenerTodosLosClientes();
    
    // 3. Agregar/actualizar cliente
    todosLosClientes[cliente.nit] = cliente;
    
    // 4. Generar archivo JSON actualizado
    this.generarArchivoClientes(todosLosClientes);
    
    console.log('✅ Cliente guardado. Archivo JSON generado para descarga.');
  }
  
  /**
   * Guarda avances y genera archivo JSON
   */
  static async guardarAvances(nit, avances) {
    // 1. Guardar en localStorage como respaldo
    localStorage.setItem(`avances_${nit}`, JSON.stringify(avances));
    
    // 2. Obtener todos los avances actuales
    const todosLosAvances = await this.obtenerTodosLosAvances();
    
    // 3. Agregar/actualizar avances
    todosLosAvances[nit] = {
      nit: nit,
      avances: avances,
      actualizado: new Date().toISOString()
    };
    
    // 4. Generar archivo JSON actualizado
    this.generarArchivoAvances(todosLosAvances);
    
    console.log('✅ Avances guardados. Archivo JSON generado para descarga.');
  }
  
  /**
   * Guarda tipos de certificación y genera archivo JSON
   */
  static async guardarTiposCertificacion(tipos) {
    // 1. Guardar en localStorage como respaldo
    localStorage.setItem('certification_types', JSON.stringify(tipos));
    
    // 2. Generar archivo JSON
    const tiposData = {
      tipos: tipos,
      actualizado: new Date().toISOString(),
      version: '1.0'
    };
    
    this.generarArchivoTipos(tiposData);
    
    console.log('✅ Tipos guardados. Archivo JSON generado para descarga.');
  }
  
  /**
   * Genera y descarga archivo de clientes
   */
  static generarArchivoClientes(clientes) {
    const data = {
      clientes: clientes,
      generado: new Date().toISOString(),
      total: Object.keys(clientes).length
    };
    
    this.descargarJSON(data, this.FILES.CLIENTES, '👥 Archivo clientes.json generado');
    
    // Mostrar instrucciones al usuario
    this.mostrarInstrucciones('clientes');
  }
  
  /**
   * Genera y descarga archivo de avances
   */
  static generarArchivoAvances(avances) {
    const data = {
      avances: avances,
      generado: new Date().toISOString(),
      total: Object.keys(avances).length
    };
    
    this.descargarJSON(data, this.FILES.AVANCES, '📊 Archivo avances.json generado');
    this.mostrarInstrucciones('avances');
  }
  
  /**
   * Genera y descarga archivo de tipos
   */
  static generarArchivoTipos(tipos) {
    this.descargarJSON(tipos, this.FILES.TIPOS_CERTIFICACION, '🏷️ Archivo tipos-certificacion.json generado');
    this.mostrarInstrucciones('tipos');
  }
  
  /**
   * Función genérica para descargar JSON
   */
  static descargarJSON(data, filename, mensaje) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    // Mostrar notificación
    this.mostrarNotificacion(mensaje, 'success');
  }
  
  /**
   * Muestra instrucciones al usuario sobre qué hacer con el archivo
   */
  static mostrarInstrucciones(tipo) {
    let mensaje = '';
    
    switch(tipo) {
      case 'clientes':
        mensaje = `
          📁 clientes.json descargado
          
          Para aplicar los cambios:
          1. Copiar el archivo a la carpeta 'data/' de tu sitio web
          2. Reemplazar el archivo existente
          3. Los nuevos datos estarán disponibles al recargar
        `;
        break;
        
      case 'avances':
        mensaje = `
          📁 avances.json descargado
          
          Para aplicar los cambios:
          1. Copiar el archivo a la carpeta 'data/' de tu sitio web  
          2. Los avances se cargarán automáticamente
        `;
        break;
        
      case 'tipos':
        mensaje = `
          📁 tipos-certificacion.json descargado
          
          Para aplicar los cambios:
          1. Copiar el archivo a la carpeta 'data/' de tu sitio web
          2. Los nuevos tipos estarán disponibles al recargar
        `;
        break;
    }
    
    // Mostrar en modal o alert
    if (confirm(mensaje + '\n\n¿Deseas ver las instrucciones detalladas?')) {
      this.mostrarInstruccionesDetalladas(tipo);
    }
  }
  
  /**
   * Muestra instrucciones detalladas en modal
   */
  static mostrarInstruccionesDetalladas(tipo) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      ">
        <h3>📁 Instrucciones para ${tipo}</h3>
        <div style="line-height: 1.6; margin: 20px 0;">
          ${this.getInstruccionesHTML(tipo)}
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="
                  background: #3b82f6;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 5px;
                  cursor: pointer;
                ">
          Entendido
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  static getInstruccionesHTML(tipo) {
    const baseInstructions = `
      <p><strong>El archivo se descargó a tu carpeta de Descargas.</strong></p>
      <ol>
        <li>Localizar el archivo descargado</li>
        <li>Copiar a la carpeta <code>data/</code> de tu sitio web</li>
        <li>Reemplazar el archivo existente (si existe)</li>
        <li>Recargar el portal para ver los cambios</li>
      </ol>
      
      <p><strong>💡 Tip:</strong> Puedes automatizar este proceso con un script de deployment.</p>
      
      <h4>🔄 Alternativa automática:</h4>
      <p>Considera usar un simple script de Python o Node.js que:</p>
      <ul>
        <li>Monitoree la carpeta de descargas</li>
        <li>Copie automáticamente los archivos JSON a la carpeta correcta</li>
        <li>Opcional: haga commit a Git automáticamente</li>
      </ul>
    `;
    
    return baseInstructions;
  }
  
  /**
   * Cargar datos desde archivos JSON existentes
   */
  static async cargarDatosExistentes() {
    try {
      // Cargar clientes existentes
      const clientesResponse = await fetch(`${this.DATA_FOLDER}${this.FILES.CLIENTES}`);
      const clientesData = clientesResponse.ok ? await clientesResponse.json() : { clientes: {} };
      
      // Cargar avances existentes
      const avancesResponse = await fetch(`${this.DATA_FOLDER}${this.FILES.AVANCES}`);
      const avancesData = avancesResponse.ok ? await avancesResponse.json() : { avances: {} };
      
      // Cargar tipos existentes
      const tiposResponse = await fetch(`${this.DATA_FOLDER}${this.FILES.TIPOS_CERTIFICACION}`);
      const tiposData = tiposResponse.ok ? await tiposResponse.json() : { tipos: {} };
      
      console.log('✅ Datos existentes cargados desde archivos JSON');
      
      return {
        clientes: clientesData.clientes || {},
        avances: avancesData.avances || {},
        tipos: tiposData.tipos || {}
      };
      
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar algunos archivos JSON existentes:', error);
      return {
        clientes: {},
        avances: {},
        tipos: {}
      };
    }
  }
  
  /**
   * Obtener todos los clientes (desde JSON + localStorage)
   */
  static async obtenerTodosLosClientes() {
    // 1. Cargar desde archivos existentes
    const datosExistentes = await this.cargarDatosExistentes();
    let clientes = datosExistentes.clientes;
    
    // 2. Agregar clientes de localStorage (pueden ser más recientes)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cliente_')) {
        try {
          const clienteData = JSON.parse(localStorage.getItem(key));
          clientes[clienteData.nit] = clienteData;
        } catch (error) {
          console.warn('Error cargando cliente desde localStorage:', key);
        }
      }
    }
    
    return clientes;
  }
  
  /**
   * Obtener todos los avances
   */
  static async obtenerTodosLosAvances() {
    const datosExistentes = await this.cargarDatosExistentes();
    let avances = datosExistentes.avances;
    
    // Agregar avances de localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('avances_')) {
        try {
          const nit = key.replace('avances_', '');
          const avanceData = JSON.parse(localStorage.getItem(key));
          avances[nit] = {
            nit: nit,
            avances: avanceData,
            actualizado: new Date().toISOString()
          };
        } catch (error) {
          console.warn('Error cargando avance desde localStorage:', key);
        }
      }
    }
    
    return avances;
  }
  
  /**
   * Mostrar notificación
   */
  static mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear notificación temporal
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${tipo === 'success' ? '#10b981' : '#3b82f6'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: Inter, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    notif.textContent = mensaje;
    
    document.body.appendChild(notif);
    
    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
      if (notif.parentNode) {
        notif.parentNode.removeChild(notif);
      }
    }, 4000);
  }
  
  /**
   * Generar todos los archivos de una vez
   */
  static async generarTodosLosArchivos() {
    const clientes = await this.obtenerTodosLosClientes();
    const avances = await this.obtenerTodosLosAvances();
    const tipos = JSON.parse(localStorage.getItem('certification_types') || '{}');
    
    // Generar archivo maestro con todo
    const archivoMaestro = {
      generado: new Date().toISOString(),
      version: '1.0',
      clientes: clientes,
      avances: avances,
      tipos: tipos,
      estadisticas: {
        totalClientes: Object.keys(clientes).length,
        totalAvances: Object.keys(avances).length,
        totalTipos: Object.keys(tipos).length
      }
    };
    
    this.descargarJSON(archivoMaestro, 'portal-datos-completos.json', '📦 Archivo maestro generado');
    
    alert(`
      📦 Archivo maestro generado: portal-datos-completos.json
      
      Contiene:
      - ${Object.keys(clientes).length} clientes
      - ${Object.keys(avances).length} avances  
      - ${Object.keys(tipos).length} tipos de certificación
      
      Para aplicar: Copiar a la carpeta 'data/' y renombrar según sea necesario.
    `);
  }
}

// Hacer disponible globalmente
window.LocalJSONManager = LocalJSONManager;
