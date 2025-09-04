/**
 * =============================================================================
 * ADAPTADOR DE PERSISTENCIA PARA ARCHIVOS JSON LOCALES
 * Reemplaza las funciones de localStorage con descarga de archivos JSON
 * =============================================================================
 */

class LocalJSONAdapter {
  
  constructor() {
    console.log('🔧 LocalJSONAdapter inicializado');
  }
  
  /**
   * Guarda un cliente (reemplaza localStorage)
   */
  async guardarCliente(cliente) {
    try {
      console.log(`💾 Guardando cliente: ${cliente.nit} - ${cliente.nombre}`);
      
      // Validar datos del cliente
      if (!cliente.nit || !cliente.nombre) {
        throw new Error('Cliente debe tener NIT y nombre');
      }
      
      // Usar el LocalJSONManager para guardar y generar archivo
      await LocalJSONManager.guardarCliente(cliente);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error guardando cliente:', error);
      throw error;
    }
  }
  
  /**
   * Busca un cliente (desde JSON existente y localStorage)
   */
  async buscarCliente(nit) {
    try {
      console.log(`🔍 Buscando cliente: ${nit}`);
      
      // 1. Buscar en localStorage primero (datos más recientes)
      const clienteLocal = localStorage.getItem(`cliente_${nit}`);
      if (clienteLocal) {
        const cliente = JSON.parse(clienteLocal);
        console.log(`✅ Cliente encontrado en localStorage: ${cliente.nombre}`);
        return cliente;
      }
      
      // 2. Buscar en archivos JSON existentes
      const todosLosClientes = await LocalJSONManager.obtenerTodosLosClientes();
      if (todosLosClientes[nit]) {
        console.log(`✅ Cliente encontrado en archivos JSON: ${todosLosClientes[nit].nombre}`);
        return todosLosClientes[nit];
      }
      
      console.log(`⚠️ Cliente no encontrado: ${nit}`);
      return null;
      
    } catch (error) {
      console.error('❌ Error buscando cliente:', error);
      return null;
    }
  }
  
  /**
   * Obtiene lista de todos los clientes
   */
  async obtenerTodosLosClientes() {
    try {
      const clientes = await LocalJSONManager.obtenerTodosLosClientes();
      console.log(`📋 ${Object.keys(clientes).length} clientes cargados`);
      return clientes;
    } catch (error) {
      console.error('❌ Error obteniendo clientes:', error);
      return {};
    }
  }
  
  /**
   * Guarda avances de certificación
   */
  async guardarAvances(nit, avances) {
    try {
      console.log(`📊 Guardando avances para cliente: ${nit}`);
      
      if (!nit || !avances) {
        throw new Error('NIT y avances son requeridos');
      }
      
      await LocalJSONManager.guardarAvances(nit, avances);
      
      console.log(`✅ Avances guardados correctamente para ${nit}`);
      return true;
      
    } catch (error) {
      console.error('❌ Error guardando avances:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene avances de un cliente específico
   */
  async obtenerAvances(nit) {
    try {
      console.log(`📊 Obteniendo avances para: ${nit}`);
      
      // 1. Buscar en localStorage primero
      const avancesLocal = localStorage.getItem(`avances_${nit}`);
      if (avancesLocal) {
        const avances = JSON.parse(avancesLocal);
        console.log(`✅ Avances encontrados en localStorage`);
        return avances;
      }
      
      // 2. Buscar en archivos JSON
      const todosLosAvances = await LocalJSONManager.obtenerTodosLosAvances();
      if (todosLosAvances[nit]) {
        console.log(`✅ Avances encontrados en archivos JSON`);
        return todosLosAvances[nit].avances;
      }
      
      console.log(`⚠️ No hay avances para el cliente: ${nit}`);
      return {};
      
    } catch (error) {
      console.error('❌ Error obteniendo avances:', error);
      return {};
    }
  }
  
  /**
   * Obtiene todos los avances
   */
  async obtenerTodosLosAvances() {
    try {
      const avances = await LocalJSONManager.obtenerTodosLosAvances();
      console.log(`📊 ${Object.keys(avances).length} registros de avances cargados`);
      return avances;
    } catch (error) {
      console.error('❌ Error obteniendo todos los avances:', error);
      return {};
    }
  }
  
  /**
   * Guarda tipos de certificación
   */
  async guardarTiposCertificacion(tipos) {
    try {
      console.log('🏷️ Guardando tipos de certificación');
      
      if (!tipos || typeof tipos !== 'object') {
        throw new Error('Tipos de certificación deben ser un objeto válido');
      }
      
      await LocalJSONManager.guardarTiposCertificacion(tipos);
      
      console.log('✅ Tipos de certificación guardados correctamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error guardando tipos de certificación:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene tipos de certificación
   */
  async obtenerTiposCertificacion() {
    try {
      console.log('🏷️ Obteniendo tipos de certificación');
      
      // 1. Buscar en localStorage primero
      const tiposLocal = localStorage.getItem('certification_types');
      if (tiposLocal) {
        const tipos = JSON.parse(tiposLocal);
        console.log('✅ Tipos encontrados en localStorage');
        return tipos;
      }
      
      // 2. Para GitHub Pages, usar datos por defecto directamente
      if (window.location.hostname.includes('github.io')) {
        console.log('🌐 GitHub Pages: Usando tipos por defecto sin fetch');
        return {
          "oauth": {
            "nombre": "OAuth 2.0/OpenID Connect",
            "descripcion": "Certificación de implementación OAuth 2.0 y OpenID Connect",
            "items": [
              { id: 1, texto: "Autenticación OAuth 2.0/OpenID Connect implementada", esperado: "El sistema debe autenticar usando OAuth 2.0 o OpenID Connect, siguiendo los estándares de seguridad." },
              { id: 2, texto: "Uso de tokens JWT válidos", esperado: "Las peticiones deben incluir tokens JWT válidos y no expirados." }
            ]
          }
        };
      }
      
      // 2. Cargar desde archivo JSON si existe
      try {
        const response = await fetch('./data/tipos-certificacion.json');
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Tipos cargados desde archivo JSON');
          return data.tipos || {};
        }
      } catch (fetchError) {
        console.warn('⚠️ No se pudo cargar archivo tipos-certificacion.json');
      }
      
      // 3. Cargar tipos base si existe
      try {
        const response = await fetch('./data/tipos-certificacion-base.json');
        if (response.ok) {
          const tiposBase = await response.json();
          console.log('✅ Tipos base cargados');
          return tiposBase;
        }
      } catch (fetchError) {
        console.warn('⚠️ No se pudo cargar archivo tipos-certificacion-base.json');
      }
      
      console.log('⚠️ No se encontraron tipos de certificación, usando por defecto');
      return {};
      
    } catch (error) {
      console.error('❌ Error obteniendo tipos de certificación:', error);
      return {};
    }
  }
  
  /**
   * Elimina un cliente
   */
  async eliminarCliente(nit) {
    try {
      console.log(`🗑️ Eliminando cliente: ${nit}`);
      
      // Eliminar de localStorage
      localStorage.removeItem(`cliente_${nit}`);
      localStorage.removeItem(`avances_${nit}`);
      
      // Generar nuevos archivos sin este cliente
      const clientes = await this.obtenerTodosLosClientes();
      delete clientes[nit];
      
      const avances = await this.obtenerTodosLosAvances();
      delete avances[nit];
      
      // Generar archivos actualizados
      LocalJSONManager.generarArchivoClientes(clientes);
      LocalJSONManager.generarArchivoAvances(avances);
      
      console.log(`✅ Cliente eliminado: ${nit}`);
      return true;
      
    } catch (error) {
      console.error('❌ Error eliminando cliente:', error);
      throw error;
    }
  }
  
  /**
   * Exporta todos los datos
   */
  async exportarTodosLosDatos() {
    try {
      console.log('📦 Exportando todos los datos');
      await LocalJSONManager.generarTodosLosArchivos();
      return true;
    } catch (error) {
      console.error('❌ Error exportando datos:', error);
      throw error;
    }
  }
  
  /**
   * Importa datos desde un archivo JSON
   */
  async importarDatos(archivo) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const datos = JSON.parse(e.target.result);
          
          // Importar clientes si existen
          if (datos.clientes) {
            for (const [nit, cliente] of Object.entries(datos.clientes)) {
              localStorage.setItem(`cliente_${nit}`, JSON.stringify(cliente));
            }
            console.log(`✅ ${Object.keys(datos.clientes).length} clientes importados`);
          }
          
          // Importar avances si existen
          if (datos.avances) {
            for (const [nit, avanceData] of Object.entries(datos.avances)) {
              localStorage.setItem(`avances_${nit}`, JSON.stringify(avanceData.avances));
            }
            console.log(`✅ ${Object.keys(datos.avances).length} avances importados`);
          }
          
          // Importar tipos si existen
          if (datos.tipos) {
            localStorage.setItem('certification_types', JSON.stringify(datos.tipos));
            console.log('✅ Tipos de certificación importados');
          }
          
          LocalJSONAdapter.mostrarNotificacion('✅ Datos importados correctamente', 'success');
          resolve(true);
          
        } catch (error) {
          console.error('❌ Error procesando archivo:', error);
          LocalJSONAdapter.mostrarNotificacion('❌ Error procesando archivo JSON', 'error');
          reject(error);
        }
      };
      
      reader.onerror = () => {
        const error = new Error('Error leyendo archivo');
        console.error('❌ Error leyendo archivo:', error);
        reject(error);
      };
      
      reader.readAsText(archivo);
    });
  }
  
  /**
   * Muestra estadísticas de datos
   */
  async mostrarEstadisticas() {
    try {
      const clientes = await this.obtenerTodosLosClientes();
      const avances = await this.obtenerTodosLosAvances();
      const tipos = await this.obtenerTiposCertificacion();
      
      const stats = {
        clientes: Object.keys(clientes).length,
        avances: Object.keys(avances).length,
        tipos: Object.keys(tipos).length,
        ultimaActualizacion: new Date().toISOString()
      };
      
      console.log('📊 Estadísticas:', stats);
      
      alert(`
        📊 ESTADÍSTICAS DEL PORTAL
        
        👥 Clientes: ${stats.clientes}
        📈 Avances registrados: ${stats.avances}  
        🏷️ Tipos de certificación: ${stats.tipos}
        
        🕒 Última consulta: ${new Date().toLocaleString()}
      `);
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }
  
  /**
   * Función auxiliar para mostrar notificaciones
   */
  static mostrarNotificacion(mensaje, tipo = 'info') {
    LocalJSONManager.mostrarNotificacion(mensaje, tipo);
  }
}

// Hacer disponible globalmente
window.LocalJSONAdapter = LocalJSONAdapter;

// Crear instancia global
window.localJSONAdapter = new LocalJSONAdapter();
