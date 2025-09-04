/**
 * =============================================================================
 * GESTOR DE DATOS DE CERTIFICACIÓN - PERSISTENCIA PERMANENTE
 * Maneja la carga y sincronización entre archivos JSON y LocalStorage
 * =============================================================================
 */

class CertificationDataManager {
  
  static STORAGE_KEY = 'certification_types';
  static BASE_DATA_URL = './data/tipos-certificacion-base.json';
  
  /**
   * Inicializa el sistema de datos al cargar la página
   */
  static async initialize() {
    console.log('🔄 Inicializando sistema de datos de certificación...');
    
    try {
      // 1. Cargar datos base desde archivo JSON
      const baseData = await this.loadBaseData();
      
      // 2. Cargar datos guardados del usuario desde LocalStorage
      const userData = this.loadUserData();
      
      // 3. Combinar datos: Base + Usuario
      const combinedData = this.mergeData(baseData, userData);
      
      // 4. Actualizar variable global
      Object.assign(CERTIFICATION_TYPES, combinedData);
      
      // 5. Sincronizar con LocalStorage
      this.saveUserData(combinedData);
      
      console.log('✅ Sistema de datos inicializado correctamente');
      console.log('📊 Tipos disponibles:', Object.keys(CERTIFICATION_TYPES));
      
      return combinedData;
      
    } catch (error) {
      console.error('❌ Error inicializando sistema de datos:', error);
      // Fallback: usar datos hardcodeados si hay error
      return this.loadFallbackData();
    }
  }
  
  /**
   * Carga datos base desde archivo JSON del servidor
   */
  static async loadBaseData() {
    try {
      const response = await fetch(this.BASE_DATA_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📁 Datos base cargados desde archivo JSON');
      return data;
      
    } catch (error) {
      console.warn('⚠️ No se pudo cargar archivo base:', error.message);
      return this.loadFallbackData();
    }
  }
  
  /**
   * Carga datos del usuario desde LocalStorage
   */
  static loadUserData() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        console.log('💾 Datos de usuario cargados desde LocalStorage');
        return data;
      }
    } catch (error) {
      console.warn('⚠️ Error cargando datos de usuario:', error);
    }
    return {};
  }
  
  /**
   * Combina datos base con datos del usuario
   * Los datos del usuario tienen prioridad para tipos existentes
   */
  static mergeData(baseData, userData) {
    const merged = { ...baseData };
    
    // Agregar/actualizar con datos del usuario
    Object.keys(userData).forEach(key => {
      if (baseData[key] && baseData[key].protected) {
        // Tipo protegido: mantener estructura base pero permitir modificaciones a items
        merged[key] = {
          ...baseData[key],
          items: userData[key].items || baseData[key].items
        };
        console.log(`🔒 Tipo protegido '${key}' mantenido con modificaciones de usuario`);
      } else {
        // Tipo de usuario: usar completamente los datos del usuario
        merged[key] = userData[key];
        console.log(`👤 Tipo de usuario '${key}' agregado`);
      }
    });
    
    return merged;
  }
  
  /**
   * Guarda datos del usuario en LocalStorage
   */
  static saveUserData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data, null, 2));
      console.log('💾 Datos guardados en LocalStorage');
    } catch (error) {
      console.error('❌ Error guardando datos:', error);
    }
  }
  
  /**
   * Datos de fallback si no se puede cargar nada
   */
  static loadFallbackData() {
    console.log('🔄 Usando datos de fallback hardcodeados');
    return {
      'pse-avanzado': {
        name: 'PSE Avanzado',
        description: 'Certificación completa',
        protected: true,
        items: [
          { id: 1, texto: "Autenticación OAuth 2.0/OpenID Connect implementada", esperado: "El sistema debe autenticar usando OAuth 2.0 o OpenID Connect, siguiendo los estándares de seguridad." },
          { id: 2, texto: "Uso de tokens JWT válidos", esperado: "Las peticiones deben incluir tokens JWT válidos y no expirados." },
          // ... resto de items
        ]
      },
      'pse-empresarial': {
        name: 'PSE Empresarial',
        description: 'Certificación corporativa',
        protected: true,
        items: [
          // ... items empresariales
        ]
      }
    };
  }
  
  /**
   * Marca un tipo como protegido (no se puede eliminar)
   */
  static protectType(typeKey) {
    if (CERTIFICATION_TYPES[typeKey]) {
      CERTIFICATION_TYPES[typeKey].protected = true;
      this.saveUserData(CERTIFICATION_TYPES);
    }
  }
  
  /**
   * Verifica si un tipo está protegido
   */
  static isProtected(typeKey) {
    return CERTIFICATION_TYPES[typeKey]?.protected === true;
  }
  
  /**
   * Exporta toda la configuración actual
   */
  static exportConfiguration() {
    const config = {
      tipos: CERTIFICATION_TYPES,
      exportado: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `configuracion-certificacion-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📤 Configuración exportada');
  }
  
  /**
   * Importa configuración desde archivo
   */
  static async importConfiguration(file) {
    try {
      const text = await file.text();
      const config = JSON.parse(text);
      
      if (config.tipos) {
        // Combinar con datos existentes
        const merged = this.mergeData(CERTIFICATION_TYPES, config.tipos);
        Object.assign(CERTIFICATION_TYPES, merged);
        this.saveUserData(CERTIFICATION_TYPES);
        
        console.log('📥 Configuración importada correctamente');
        return true;
      } else {
        throw new Error('Archivo de configuración inválido');
      }
    } catch (error) {
      console.error('❌ Error importando configuración:', error);
      return false;
    }
  }
  
}

// Hacer disponible globalmente
window.CertificationDataManager = CertificationDataManager;
