/**
 * =============================================================================
 * FIREBASE DATA MANAGER - PERSISTENCIA REAL EN LA NUBE
 * Sistema de almacenamiento persistente para hosting básico
 * =============================================================================
 */

// Configuración de Firebase - DEBES REEMPLAZAR CON TUS DATOS
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "certificacion-pse.firebaseapp.com",
  projectId: "certificacion-pse",
  storageBucket: "certificacion-pse.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

class FirebasePersistenceManager {
  
  constructor() {
    this.db = null;
    this.initialized = false;
    this.offlineMode = false;
  }
  
  /**
   * Inicializa Firebase
   */
  async initialize() {
    try {
      // Importar Firebase dinámicamente
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js');
      const { getFirestore, enableNetwork, disableNetwork } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js');
      
      // Inicializar app
      const app = initializeApp(firebaseConfig);
      this.db = getFirestore(app);
      
      this.initialized = true;
      console.log('✅ Firebase inicializado correctamente');
      
      // Probar conexión
      await this.testConnection();
      
    } catch (error) {
      console.warn('⚠️ Firebase no disponible, usando modo offline:', error.message);
      this.offlineMode = true;
    }
  }
  
  /**
   * Prueba la conexión con Firebase
   */
  async testConnection() {
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js');
      await getDoc(doc(this.db, 'test', 'connection'));
      this.offlineMode = false;
      console.log('🌐 Conexión con Firebase establecida');
    } catch (error) {
      console.warn('📵 Sin conexión, trabajando offline');
      this.offlineMode = true;
    }
  }
  
  /**
   * Guarda un cliente en Firebase
   */
  async guardarCliente(cliente) {
    if (!this.initialized || this.offlineMode) {
      return this.guardarClienteLocal(cliente);
    }
    
    try {
      const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js');
      
      const clienteData = {
        ...cliente,
        updatedAt: serverTimestamp(),
        syncedAt: new Date().toISOString()
      };
      
      await setDoc(doc(this.db, 'clientes', cliente.nit), clienteData);
      
      // También guardar local como backup
      localStorage.setItem(`cliente_${cliente.nit}`, JSON.stringify(clienteData));
      
      console.log('✅ Cliente guardado en Firebase:', cliente.nit);
      return true;
      
    } catch (error) {
      console.error('❌ Error guardando cliente en Firebase:', error);
      return this.guardarClienteLocal(cliente);
    }
  }
  
  /**
   * Busca un cliente en Firebase
   */
  async buscarCliente(nit) {
    if (!this.initialized || this.offlineMode) {
      return this.buscarClienteLocal(nit);
    }
    
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js');
      
      const docRef = doc(this.db, 'clientes', nit);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Actualizar cache local
        localStorage.setItem(`cliente_${nit}`, JSON.stringify(data));
        
        console.log('✅ Cliente encontrado en Firebase:', nit);
        return data;
      } else {
        console.log('❌ Cliente no encontrado en Firebase:', nit);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error buscando cliente en Firebase:', error);
      return this.buscarClienteLocal(nit);
    }
  }
  
  /**
   * Guarda avances de certificación en Firebase
   */
  async guardarAvances(nit, avances) {
    if (!this.initialized || this.offlineMode) {
      return this.guardarAvancesLocal(nit, avances);
    }
    
    try {
      const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js');
      
      const avancesData = {
        nit: nit,
        avances: avances,
        updatedAt: serverTimestamp(),
        syncedAt: new Date().toISOString()
      };
      
      await setDoc(doc(this.db, 'avances', nit), avancesData);
      
      // También guardar local como backup
      localStorage.setItem(`avances_${nit}`, JSON.stringify(avances));
      
      console.log('✅ Avances guardados en Firebase:', nit);
      return true;
      
    } catch (error) {
      console.error('❌ Error guardando avances en Firebase:', error);
      return this.guardarAvancesLocal(nit, avances);
    }
  }
  
  /**
   * Busca avances de certificación en Firebase
   */
  async buscarAvances(nit) {
    if (!this.initialized || this.offlineMode) {
      return this.buscarAvancesLocal(nit);
    }
    
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js');
      
      const docRef = doc(this.db, 'avances', nit);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Actualizar cache local
        localStorage.setItem(`avances_${nit}`, JSON.stringify(data.avances));
        
        console.log('✅ Avances encontrados en Firebase:', nit);
        return data.avances;
      } else {
        return {};
      }
      
    } catch (error) {
      console.error('❌ Error buscando avances en Firebase:', error);
      return this.buscarAvancesLocal(nit);
    }
  }
  
  /**
   * Guarda tipos de certificación en Firebase
   */
  async guardarTiposCertificacion(tipos) {
    if (!this.initialized || this.offlineMode) {
      return this.guardarTiposLocal(tipos);
    }
    
    try {
      const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js');
      
      const tiposData = {
        tipos: tipos,
        updatedAt: serverTimestamp(),
        syncedAt: new Date().toISOString()
      };
      
      await setDoc(doc(this.db, 'configuracion', 'tipos-certificacion'), tiposData);
      
      // También guardar local como backup
      localStorage.setItem('certification_types', JSON.stringify(tipos));
      
      console.log('✅ Tipos de certificación guardados en Firebase');
      return true;
      
    } catch (error) {
      console.error('❌ Error guardando tipos en Firebase:', error);
      return this.guardarTiposLocal(tipos);
    }
  }
  
  /**
   * Carga tipos de certificación desde Firebase
   */
  async cargarTiposCertificacion() {
    if (!this.initialized || this.offlineMode) {
      return this.cargarTiposLocal();
    }
    
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js');
      
      const docRef = doc(this.db, 'configuracion', 'tipos-certificacion');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Actualizar cache local
        localStorage.setItem('certification_types', JSON.stringify(data.tipos));
        
        console.log('✅ Tipos de certificación cargados desde Firebase');
        return data.tipos;
      } else {
        // Si no existen en Firebase, usar tipos por defecto y subirlos
        const tiposDefecto = this.getTiposDefecto();
        await this.guardarTiposCertificacion(tiposDefecto);
        return tiposDefecto;
      }
      
    } catch (error) {
      console.error('❌ Error cargando tipos desde Firebase:', error);
      return this.cargarTiposLocal();
    }
  }
  
  /**
   * Obtiene todos los clientes desde Firebase
   */
  async obtenerTodosLosClientes() {
    if (!this.initialized || this.offlineMode) {
      return this.obtenerClientesLocales();
    }
    
    try {
      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js');
      
      const querySnapshot = await getDocs(collection(this.db, 'clientes'));
      const clientes = {};
      
      querySnapshot.forEach((doc) => {
        clientes[doc.id] = doc.data();
      });
      
      console.log('✅ Todos los clientes cargados desde Firebase');
      return clientes;
      
    } catch (error) {
      console.error('❌ Error obteniendo clientes desde Firebase:', error);
      return this.obtenerClientesLocales();
    }
  }
  
  // =============================================================================
  // MÉTODOS DE FALLBACK (LocalStorage)
  // =============================================================================
  
  guardarClienteLocal(cliente) {
    try {
      localStorage.setItem(`cliente_${cliente.nit}`, JSON.stringify(cliente));
      console.log('💾 Cliente guardado localmente:', cliente.nit);
      return true;
    } catch (error) {
      console.error('❌ Error guardando cliente localmente:', error);
      return false;
    }
  }
  
  buscarClienteLocal(nit) {
    try {
      const data = localStorage.getItem(`cliente_${nit}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Error buscando cliente localmente:', error);
      return null;
    }
  }
  
  guardarAvancesLocal(nit, avances) {
    try {
      localStorage.setItem(`avances_${nit}`, JSON.stringify(avances));
      console.log('💾 Avances guardados localmente:', nit);
      return true;
    } catch (error) {
      console.error('❌ Error guardando avances localmente:', error);
      return false;
    }
  }
  
  buscarAvancesLocal(nit) {
    try {
      const data = localStorage.getItem(`avances_${nit}`);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Error buscando avances localmente:', error);
      return {};
    }
  }
  
  guardarTiposLocal(tipos) {
    try {
      localStorage.setItem('certification_types', JSON.stringify(tipos));
      console.log('💾 Tipos guardados localmente');
      return true;
    } catch (error) {
      console.error('❌ Error guardando tipos localmente:', error);
      return false;
    }
  }
  
  cargarTiposLocal() {
    try {
      const data = localStorage.getItem('certification_types');
      return data ? JSON.parse(data) : this.getTiposDefecto();
    } catch (error) {
      console.error('❌ Error cargando tipos localmente:', error);
      return this.getTiposDefecto();
    }
  }
  
  obtenerClientesLocales() {
    const clientes = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cliente_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          clientes[data.nit] = data;
        } catch (error) {
          console.warn('Error parsing cliente:', key);
        }
      }
    }
    return clientes;
  }
  
  /**
   * Tipos de certificación por defecto
   */
  getTiposDefecto() {
    return {
      'pse-avanzado': {
        name: 'PSE Avanzado',
        description: 'Certificación completa',
        items: [
          { id: 1, texto: "Autenticación OAuth 2.0/OpenID Connect implementada", esperado: "El sistema debe autenticar usando OAuth 2.0 o OpenID Connect, siguiendo los estándares de seguridad." },
          { id: 2, texto: "Uso de tokens JWT válidos", esperado: "Las peticiones deben incluir tokens JWT válidos y no expirados." },
          { id: 3, texto: "Comunicación solo por HTTPS", esperado: "Todas las comunicaciones con la API deben realizarse exclusivamente por HTTPS." },
          { id: 4, texto: "Gestión de expiración y refresh de tokens", esperado: "El sistema debe manejar la expiración de tokens y usar refresh tokens cuando corresponda." },
          { id: 5, texto: "Almacenamiento seguro de credenciales", esperado: "Las credenciales y secretos deben almacenarse de forma segura y nunca exponerse públicamente." },
          { id: 6, texto: "Solicita solo los permisos necesarios", esperado: "El sistema debe solicitar únicamente los permisos (scopes) estrictamente necesarios." },
          { id: 7, texto: "Respeta restricciones de acceso", esperado: "El sistema debe respetar las restricciones de acceso según los permisos otorgados." },
          { id: 8, texto: "Manejo de errores y límites de uso", esperado: "El sistema debe manejar correctamente errores y límites de uso (rate limiting)." }
        ]
      },
      'pse-empresarial': {
        name: 'PSE Empresarial',
        description: 'Certificación corporativa',
        items: [
          { id: 1, texto: "Autenticación OAuth 2.0/OpenID Connect implementada", esperado: "El sistema debe autenticar usando OAuth 2.0 o OpenID Connect, siguiendo los estándares de seguridad." },
          { id: 2, texto: "Uso de tokens JWT válidos", esperado: "Las peticiones deben incluir tokens JWT válidos y no expirados." },
          { id: 3, texto: "Comunicación solo por HTTPS", esperado: "Todas las comunicaciones con la API deben realizarse exclusivamente por HTTPS." },
          { id: 4, texto: "Gestión de expiración y refresh de tokens", esperado: "El sistema debe manejar la expiración de tokens y usar refresh tokens cuando corresponda." },
          { id: 5, texto: "Almacenamiento seguro de credenciales", esperado: "Las credenciales y secretos deben almacenarse de forma segura y nunca exponerse públicamente." },
          { id: 6, texto: "Solicita solo los permisos necesarios", esperado: "El sistema debe solicitar únicamente los permisos (scopes) estrictamente necesarios." },
          { id: 7, texto: "Respeta restricciones de acceso", esperado: "El sistema debe respetar las restricciones de acceso según los permisos otorgados." },
          { id: 8, texto: "Manejo de errores y límites de uso", esperado: "El sistema debe manejar correctamente errores y límites de uso (rate limiting)." },
          { id: 9, texto: "Pruebas de integración y seguridad realizadas", esperado: "Se deben realizar pruebas de integración y seguridad con la API." },
          { id: 10, texto: "Documentación revisada y comprendida", esperado: "El equipo debe haber revisado y comprendido la documentación de autenticación y autorización." },
          { id: 11, texto: "Implementación de auditoría y logging", esperado: "El sistema debe registrar todas las transacciones y eventos de seguridad relevantes." },
          { id: 12, texto: "Configuración de alta disponibilidad", esperado: "El sistema debe estar configurado para garantizar alta disponibilidad y recuperación ante desastres." }
        ]
      }
    };
  }
  
  /**
   * Sincronizar datos offline con Firebase cuando se recupere conexión
   */
  async sincronizarOffline() {
    if (!this.initialized || this.offlineMode) return;
    
    try {
      // Detectar datos pendientes de sync
      const pendingData = this.detectarDatosPendientes();
      
      for (const item of pendingData) {
        switch (item.tipo) {
          case 'cliente':
            await this.guardarCliente(item.data);
            break;
          case 'avances':
            await this.guardarAvances(item.nit, item.data);
            break;
          case 'tipos':
            await this.guardarTiposCertificacion(item.data);
            break;
        }
      }
      
      console.log('✅ Sincronización offline completada');
      
    } catch (error) {
      console.error('❌ Error en sincronización offline:', error);
    }
  }
  
  detectarDatosPendientes() {
    // Lógica para detectar datos que necesitan sincronización
    // Por implementar según necesidades específicas
    return [];
  }
}

// Instancia global
window.PersistenceManager = new FirebasePersistenceManager();
