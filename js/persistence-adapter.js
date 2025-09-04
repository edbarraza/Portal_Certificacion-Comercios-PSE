/**
 * =============================================================================
 * ADAPTADOR DE PERSISTENCIA - REEMPLAZO DE LOCALSTORAGE
 * Adapta las funciones existentes para usar Firebase
 * =============================================================================
 */

class PersistenceAdapter {
  
  static async initialize() {
    console.log('🔄 Inicializando adaptador de persistencia...');
    
    try {
      await window.PersistenceManager.initialize();
      
      // Cargar tipos de certificación al inicio
      const tipos = await window.PersistenceManager.cargarTiposCertificacion();
      Object.assign(CERTIFICATION_TYPES, tipos);
      
      console.log('✅ Adaptador de persistencia inicializado');
      console.log('📊 Tipos de certificación disponibles:', Object.keys(CERTIFICATION_TYPES));
      
    } catch (error) {
      console.error('❌ Error inicializando adaptador:', error);
    }
  }
  
  /**
   * Reemplaza localStorage.setItem para clientes
   */
  static async guardarCliente(nit, clienteData) {
    try {
      const cliente = typeof clienteData === 'string' ? JSON.parse(clienteData) : clienteData;
      await window.PersistenceManager.guardarCliente(cliente);
      
      // Actualizar variable global
      window.clienteActual = cliente;
      
      return true;
    } catch (error) {
      console.error('❌ Error guardando cliente:', error);
      return false;
    }
  }
  
  /**
   * Reemplaza localStorage.getItem para clientes
   */
  static async buscarCliente(nit) {
    try {
      const cliente = await window.PersistenceManager.buscarCliente(nit);
      return cliente;
    } catch (error) {
      console.error('❌ Error buscando cliente:', error);
      return null;
    }
  }
  
  /**
   * Reemplaza localStorage para avances
   */
  static async guardarAvances(nit, avancesData) {
    try {
      const avances = typeof avancesData === 'string' ? JSON.parse(avancesData) : avancesData;
      await window.PersistenceManager.guardarAvances(nit, avances);
      
      // Actualizar variable global
      window.camposEstado = avances;
      
      return true;
    } catch (error) {
      console.error('❌ Error guardando avances:', error);
      return false;
    }
  }
  
  /**
   * Busca avances de un cliente
   */
  static async buscarAvances(nit) {
    try {
      const avances = await window.PersistenceManager.buscarAvances(nit);
      return avances;
    } catch (error) {
      console.error('❌ Error buscando avances:', error);
      return {};
    }
  }
  
  /**
   * Guarda tipos de certificación
   */
  static async guardarTiposCertificacion() {
    try {
      await window.PersistenceManager.guardarTiposCertificacion(CERTIFICATION_TYPES);
      return true;
    } catch (error) {
      console.error('❌ Error guardando tipos:', error);
      return false;
    }
  }
  
  /**
   * Obtiene todos los clientes para informes
   */
  static async obtenerTodosLosClientes() {
    try {
      const clientes = await window.PersistenceManager.obtenerTodosLosClientes();
      return clientes;
    } catch (error) {
      console.error('❌ Error obteniendo todos los clientes:', error);
      return {};
    }
  }
  
  /**
   * Elimina un cliente completamente
   */
  static async eliminarCliente(nit) {
    try {
      // Por implementar en Firebase - eliminar documentos
      console.log('🗑️ Eliminando cliente:', nit);
      // Temporal: eliminar de localStorage también
      localStorage.removeItem(`cliente_${nit}`);
      localStorage.removeItem(`avances_${nit}`);
      return true;
    } catch (error) {
      console.error('❌ Error eliminando cliente:', error);
      return false;
    }
  }
  
  /**
   * Mostrar estado de conexión en la UI
   */
  static mostrarEstadoConexion() {
    const estado = window.PersistenceManager.offlineMode ? 'offline' : 'online';
    const mensaje = estado === 'offline' ? 
      '📵 Trabajando sin conexión - Los datos se sincronizarán cuando se recupere la conexión' :
      '🌐 Conectado - Los datos se guardan automáticamente en la nube';
    
    // Mostrar en algún lugar de la UI
    console.log(mensaje);
    
    // Opcionalmente mostrar un indicador visual
    this.actualizarIndicadorConexion(estado);
  }
  
  static actualizarIndicadorConexion(estado) {
    // Crear o actualizar indicador visual de conexión
    let indicador = document.getElementById('connection-status');
    
    if (!indicador) {
      indicador = document.createElement('div');
      indicador.id = 'connection-status';
      indicador.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 10000;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(indicador);
    }
    
    if (estado === 'offline') {
      indicador.textContent = '📵 Sin conexión';
      indicador.style.backgroundColor = '#f59e0b';
      indicador.style.color = 'white';
    } else {
      indicador.textContent = '🌐 Conectado';
      indicador.style.backgroundColor = '#10b981';
      indicador.style.color = 'white';
    }
    
    // Auto-ocultar después de 3 segundos si está conectado
    if (estado === 'online') {
      setTimeout(() => {
        if (indicador && indicador.textContent.includes('Conectado')) {
          indicador.style.opacity = '0.3';
        }
      }, 3000);
    }
  }
  
  /**
   * Exportar todos los datos
   */
  static async exportarTodosDatos() {
    try {
      const clientes = await this.obtenerTodosLosClientes();
      const tipos = CERTIFICATION_TYPES;
      
      const exportData = {
        clientes: clientes,
        tiposCertificacion: tipos,
        exportadoEn: new Date().toISOString(),
        version: '2.0-firebase'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-completo-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('📤 Backup completo exportado');
      
    } catch (error) {
      console.error('❌ Error exportando datos:', error);
    }
  }
  
  /**
   * Importar datos desde archivo
   */
  static async importarDatos(archivo) {
    try {
      const texto = await archivo.text();
      const datos = JSON.parse(texto);
      
      // Importar clientes
      if (datos.clientes) {
        for (const [nit, cliente] of Object.entries(datos.clientes)) {
          await this.guardarCliente(nit, cliente);
        }
        console.log('✅ Clientes importados:', Object.keys(datos.clientes).length);
      }
      
      // Importar tipos de certificación
      if (datos.tiposCertificacion) {
        Object.assign(CERTIFICATION_TYPES, datos.tiposCertificacion);
        await this.guardarTiposCertificacion();
        console.log('✅ Tipos de certificación importados:', Object.keys(datos.tiposCertificacion).length);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Error importando datos:', error);
      return false;
    }
  }
}

// Hacer disponible globalmente
window.PersistenceAdapter = PersistenceAdapter;
