/**
 * =============================================================================
 * SISTEMA DE PERSISTENCIA COLABORATIVA CON JSONBin.io
 * Permite colaboración en tiempo real sin backend propio
 * =============================================================================
 */

class CollaborativeJSONBinManager {
  
  constructor() {
    // Configuración de JSONBin.io (API gratuita)
    this.config = {
      baseURL: 'https://api.jsonbin.io/v3/b',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$YOUR_API_KEY_HERE', // Reemplazar con tu API key
        'X-Bin-Private': 'false' // Hacer público para colaboración
      }
    };
    
    // IDs de los bins (se crean automáticamente)
    this.bins = {
      clientes: localStorage.getItem('jsonbin_clientes_id') || null,
      avances: localStorage.getItem('jsonbin_avances_id') || null,
      tipos: localStorage.getItem('jsonbin_tipos_id') || null
    };
    
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    
    // Detectar cambios de conectividad
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    console.log('🤝 CollaborativeJSONBinManager inicializado');
  }
  
  /**
   * Inicializar sistema colaborativo
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando sistema colaborativo...');
      
      // Verificar o crear bins necesarios
      await this.ensureBinsExist();
      
      // Sincronizar datos locales con remotos
      await this.syncAllData();
      
      // Configurar sincronización automática cada 30 segundos
      setInterval(() => {
        if (this.isOnline) {
          this.syncAllData();
        }
      }, 30000);
      
      console.log('✅ Sistema colaborativo listo');
      
    } catch (error) {
      console.error('❌ Error inicializando sistema colaborativo:', error);
      throw error;
    }
  }
  
  /**
   * Asegurar que existen los bins necesarios
   */
  async ensureBinsExist() {
    const binsToCreate = [
      { name: 'clientes', key: 'clientes' },
      { name: 'avances', key: 'avances' },
      { name: 'tipos', key: 'tipos' }
    ];
    
    for (const bin of binsToCreate) {
      if (!this.bins[bin.key]) {
        await this.createBin(bin.name, bin.key);
      }
    }
  }
  
  /**
   * Crear un nuevo bin en JSONBin.io
   */
  async createBin(name, key) {
    try {
      const initialData = {
        [key]: {},
        metadata: {
          name: `Portal PSE - ${name}`,
          created: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      const response = await fetch(this.config.baseURL, {
        method: 'POST',
        headers: this.config.headers,
        body: JSON.stringify(initialData)
      });
      
      if (!response.ok) {
        throw new Error(`Error creando bin ${name}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const binId = result.metadata.id;
      
      this.bins[key] = binId;
      localStorage.setItem(`jsonbin_${key}_id`, binId);
      
      console.log(`✅ Bin ${name} creado: ${binId}`);
      
    } catch (error) {
      console.error(`❌ Error creando bin ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Guardar cliente de forma colaborativa
   */
  async guardarCliente(cliente) {
    try {
      console.log(`💾 Guardando cliente colaborativo: ${cliente.nit}`);
      
      // 1. Guardar localmente como respaldo
      localStorage.setItem(`cliente_${cliente.nit}`, JSON.stringify(cliente));
      
      if (this.isOnline) {
        // 2. Obtener datos actuales del servidor
        const datosActuales = await this.obtenerDatosBin('clientes');
        
        // 3. Agregar/actualizar cliente
        datosActuales.clientes = datosActuales.clientes || {};
        datosActuales.clientes[cliente.nit] = {
          ...cliente,
          lastModified: new Date().toISOString(),
          modifiedBy: this.getUserId()
        };
        
        // 4. Actualizar metadatos
        datosActuales.metadata = {
          ...datosActuales.metadata,
          lastUpdate: new Date().toISOString(),
          totalClientes: Object.keys(datosActuales.clientes).length
        };
        
        // 5. Guardar en servidor
        await this.actualizarBin('clientes', datosActuales);
        
        console.log('✅ Cliente guardado colaborativamente');
        this.mostrarNotificacion('Cliente guardado y sincronizado', 'success');
        
      } else {
        // Agregar a cola de sincronización
        this.syncQueue.push({
          tipo: 'cliente',
          accion: 'guardar',
          datos: cliente,
          timestamp: new Date().toISOString()
        });
        
        console.log('📦 Cliente agregado a cola de sincronización');
        this.mostrarNotificacion('Cliente guardado localmente (se sincronizará cuando haya conexión)', 'warning');
      }
      
    } catch (error) {
      console.error('❌ Error guardando cliente:', error);
      throw error;
    }
  }
  
  /**
   * Buscar cliente colaborativo
   */
  async buscarCliente(nit) {
    try {
      console.log(`🔍 Buscando cliente colaborativo: ${nit}`);
      
      if (this.isOnline) {
        // Buscar en servidor primero (datos más actualizados)
        const datosServidor = await this.obtenerDatosBin('clientes');
        if (datosServidor.clientes && datosServidor.clientes[nit]) {
          const cliente = datosServidor.clientes[nit];
          
          // Actualizar cache local
          localStorage.setItem(`cliente_${nit}`, JSON.stringify(cliente));
          
          console.log(`✅ Cliente encontrado en servidor: ${cliente.nombre}`);
          return cliente;
        }
      }
      
      // Buscar en localStorage como fallback
      const clienteLocal = localStorage.getItem(`cliente_${nit}`);
      if (clienteLocal) {
        const cliente = JSON.parse(clienteLocal);
        console.log(`✅ Cliente encontrado localmente: ${cliente.name}`);
        return cliente;
      }
      
      console.log(`⚠️ Cliente no encontrado: ${nit}`);
      return null;
      
    } catch (error) {
      console.error('❌ Error buscando cliente:', error);
      
      // Fallback a localStorage en caso de error
      const clienteLocal = localStorage.getItem(`cliente_${nit}`);
      return clienteLocal ? JSON.parse(clienteLocal) : null;
    }
  }
  
  /**
   * Guardar avances colaborativamente
   */
  async guardarAvances(nit, avances) {
    try {
      console.log(`📊 Guardando avances colaborativos: ${nit}`);
      
      // 1. Guardar localmente
      localStorage.setItem(`avances_${nit}`, JSON.stringify(avances));
      
      if (this.isOnline) {
        // 2. Obtener datos actuales del servidor
        const datosActuales = await this.obtenerDatosBin('avances');
        
        // 3. Actualizar avances
        datosActuales.avances = datosActuales.avances || {};
        datosActuales.avances[nit] = {
          nit: nit,
          avances: avances,
          actualizado: new Date().toISOString(),
          actualizadoPor: this.getUserId()
        };
        
        // 4. Actualizar metadatos
        datosActuales.metadata = {
          ...datosActuales.metadata,
          lastUpdate: new Date().toISOString(),
          totalAvances: Object.keys(datosActuales.avances).length
        };
        
        // 5. Guardar en servidor
        await this.actualizarBin('avances', datosActuales);
        
        console.log('✅ Avances guardados colaborativamente');
        this.mostrarNotificacion('Avances sincronizados', 'success');
        
      } else {
        // Cola de sincronización
        this.syncQueue.push({
          tipo: 'avances',
          accion: 'guardar',
          nit: nit,
          datos: avances,
          timestamp: new Date().toISOString()
        });
        
        console.log('📦 Avances agregados a cola de sincronización');
      }
      
    } catch (error) {
      console.error('❌ Error guardando avances:', error);
      throw error;
    }
  }
  
  /**
   * Obtener datos de un bin
   */
  async obtenerDatosBin(tipo) {
    try {
      const binId = this.bins[tipo];
      if (!binId) {
        throw new Error(`No existe bin para tipo: ${tipo}`);
      }
      
      const response = await fetch(`${this.config.baseURL}/${binId}/latest`, {
        headers: {
          'X-Master-Key': this.config.headers['X-Master-Key']
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error obteniendo datos: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`❌ Error obteniendo datos de ${tipo}:`, error);
      
      // Retornar estructura vacía en caso de error
      return {
        [tipo]: {},
        metadata: {
          name: `Portal PSE - ${tipo}`,
          created: new Date().toISOString(),
          version: '1.0'
        }
      };
    }
  }
  
  /**
   * Actualizar un bin
   */
  async actualizarBin(tipo, datos) {
    try {
      const binId = this.bins[tipo];
      if (!binId) {
        throw new Error(`No existe bin para tipo: ${tipo}`);
      }
      
      const response = await fetch(`${this.config.baseURL}/${binId}`, {
        method: 'PUT',
        headers: this.config.headers,
        body: JSON.stringify(datos)
      });
      
      if (!response.ok) {
        throw new Error(`Error actualizando datos: ${response.statusText}`);
      }
      
      console.log(`✅ Bin ${tipo} actualizado correctamente`);
      
    } catch (error) {
      console.error(`❌ Error actualizando ${tipo}:`, error);
      throw error;
    }
  }
  
  /**
   * Sincronizar todos los datos
   */
  async syncAllData() {
    try {
      if (!this.isOnline) return;
      
      console.log('🔄 Sincronizando datos colaborativos...');
      
      // Procesar cola de sincronización pendiente
      await this.processSyncQueue();
      
      // Opcional: Verificar cambios remotos y notificar
      await this.checkRemoteChanges();
      
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
    }
  }
  
  /**
   * Procesar cola de sincronización
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;
    
    console.log(`📤 Procesando ${this.syncQueue.length} elementos de la cola...`);
    
    const queue = [...this.syncQueue];
    this.syncQueue = [];
    
    for (const item of queue) {
      try {
        switch (item.tipo) {
          case 'cliente':
            await this.guardarCliente(item.datos);
            break;
          case 'avances':
            await this.guardarAvances(item.nit, item.datos);
            break;
        }
      } catch (error) {
        console.error('❌ Error procesando item de cola:', error);
        // Reagregar a la cola si falló
        this.syncQueue.push(item);
      }
    }
    
    if (queue.length > 0) {
      this.mostrarNotificacion(`${queue.length} cambios sincronizados`, 'success');
    }
  }
  
  /**
   * Verificar cambios remotos
   */
  async checkRemoteChanges() {
    // Implementación para notificar cambios hechos por otros usuarios
    // Por ejemplo, comparar timestamps de última modificación
  }
  
  /**
   * Obtener ID único del usuario
   */
  getUserId() {
    let userId = localStorage.getItem('portal_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('portal_user_id', userId);
    }
    return userId;
  }
  
  /**
   * Mostrar notificación
   */
  mostrarNotificacion(mensaje, tipo = 'info') {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${tipo === 'success' ? '#10b981' : tipo === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: Inter, sans-serif;
      font-size: 14px;
      max-width: 350px;
    `;
    notif.textContent = mensaje;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
      if (notif.parentNode) {
        notif.parentNode.removeChild(notif);
      }
    }, 4000);
  }
  
  /**
   * Mostrar estado de conexión
   */
  mostrarEstadoConexion() {
    const estado = this.isOnline ? 
      { mensaje: '🟢 Conectado - Sincronización activa', color: '#10b981' } :
      { mensaje: '🔴 Offline - Cambios se sincronizarán al reconectar', color: '#ef4444' };
    
    this.mostrarNotificacion(estado.mensaje, this.isOnline ? 'success' : 'warning');
  }
  
  /**
   * Obtener estadísticas colaborativas
   */
  async obtenerEstadisticas() {
    try {
      const stats = {
        local: {
          clientes: 0,
          avances: 0
        },
        remoto: {
          clientes: 0,
          avances: 0
        },
        sincronizacion: {
          cola: this.syncQueue.length,
          estado: this.isOnline ? 'conectado' : 'desconectado'
        }
      };
      
      // Contar datos locales
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('cliente_')) stats.local.clientes++;
        if (key.startsWith('avances_')) stats.local.avances++;
      }
      
      // Contar datos remotos si hay conexión
      if (this.isOnline) {
        try {
          const clientesRemoto = await this.obtenerDatosBin('clientes');
          const avancesRemoto = await this.obtenerDatosBin('avances');
          
          stats.remoto.clientes = Object.keys(clientesRemoto.clientes || {}).length;
          stats.remoto.avances = Object.keys(avancesRemoto.avances || {}).length;
        } catch (error) {
          console.warn('Error obteniendo stats remotos:', error);
        }
      }
      
      return stats;
      
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }
}

// Hacer disponible globalmente
window.CollaborativeJSONBinManager = CollaborativeJSONBinManager;
