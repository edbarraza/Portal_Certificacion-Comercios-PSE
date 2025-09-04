/**
 * =============================================================================
 * ADAPTADOR UNIFICADO PARA SISTEMAS COLABORATIVOS
 * Permite elegir entre JSONBin.io, GitHub, o modo local
 * =============================================================================
 */

class UnifiedCollaborativeAdapter {
  
  constructor() {
    this.currentSystem = null;
    this.availableSystems = {
      'local': 'local-json-adapter',
      'jsonbin': 'collaborative-jsonbin-manager', 
      'github': 'collaborative-github-manager'
    };
    
    // Configuración por defecto (puede cambiarla el usuario)
    this.defaultSystem = this.detectBestSystem();
    
    console.log('🔄 UnifiedCollaborativeAdapter inicializado');
  }
  
  /**
   * Detectar el mejor sistema disponible
   */
  detectBestSystem() {
    // Verificar variables de configuración en localStorage
    const storedSystem = localStorage.getItem('portal_collaboration_system');
    if (storedSystem && this.availableSystems[storedSystem]) {
      return storedSystem;
    }
    
    // Auto-detección basada en configuración
    if (this.hasGitHubConfig()) {
      return 'github';
    } else if (this.hasJSONBinConfig()) {
      return 'jsonbin';
    } else {
      return 'local';
    }
  }
  
  /**
   * Verificar si hay configuración de GitHub
   */
  hasGitHubConfig() {
    const token = localStorage.getItem('github_token');
    const owner = localStorage.getItem('github_owner');
    const repo = localStorage.getItem('github_repo');
    
    return token && owner && repo && 
           token !== 'ghp_YOUR_TOKEN_HERE' &&
           owner !== 'TU_USUARIO_GITHUB';
  }
  
  /**
   * Verificar si hay configuración de JSONBin
   */
  hasJSONBinConfig() {
    const apiKey = localStorage.getItem('jsonbin_api_key');
    return apiKey && apiKey !== '$2a$10$YOUR_API_KEY_HERE';
  }
  
  /**
   * Inicializar el sistema colaborativo
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando sistema colaborativo unificado...');
      
      // Mostrar panel de selección si no hay sistema configurado
      if (!localStorage.getItem('portal_collaboration_system')) {
        await this.showSystemSelectionModal();
      }
      
      const systemType = localStorage.getItem('portal_collaboration_system') || this.defaultSystem;
      await this.switchToSystem(systemType);
      
      console.log(`✅ Sistema colaborativo ${systemType} inicializado`);
      
    } catch (error) {
      console.error('❌ Error inicializando sistema colaborativo:', error);
      
      // Fallback a sistema local
      console.log('🔄 Fallback a sistema local...');
      await this.switchToSystem('local');
    }
  }
  
  /**
   * Cambiar a un sistema específico
   */
  async switchToSystem(systemType) {
    try {
      console.log(`🔄 Cambiando a sistema: ${systemType}`);
      
      // Terminar sistema actual si existe
      if (this.currentSystem && this.currentSystem.cleanup) {
        await this.currentSystem.cleanup();
      }
      
      // Inicializar nuevo sistema
      switch (systemType) {
        case 'local':
          this.currentSystem = window.localJSONAdapter || new LocalJSONAdapter();
          break;
          
        case 'jsonbin':
          if (!window.CollaborativeJSONBinManager) {
            throw new Error('JSONBin manager no está disponible');
          }
          this.currentSystem = new CollaborativeJSONBinManager();
          await this.currentSystem.initialize();
          break;
          
        case 'github':
          if (!window.CollaborativeGitHubManager) {
            throw new Error('GitHub manager no está disponible');
          }
          this.currentSystem = new CollaborativeGitHubManager();
          await this.currentSystem.initialize();
          break;
          
        default:
          throw new Error(`Sistema desconocido: ${systemType}`);
      }
      
      // Guardar selección
      localStorage.setItem('portal_collaboration_system', systemType);
      
      console.log(`✅ Sistema ${systemType} activado`);
      this.mostrarNotificacion(`Sistema ${systemType} activado`, 'success');
      
    } catch (error) {
      console.error(`❌ Error cambiando a sistema ${systemType}:`, error);
      throw error;
    }
  }
  
  /**
   * Mostrar modal de selección de sistema
   */
  async showSystemSelectionModal() {
    return new Promise((resolve) => {
      const modalHTML = `
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 600px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          font-family: 'Inter', sans-serif;
        ">
          <h3 style="color: #1e40af; margin-bottom: 1.5rem; text-align: center;">
            🤝 Seleccionar Sistema Colaborativo
          </h3>
          
          <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
            
            <!-- Opción Local -->
            <div class="system-option" data-system="local" style="
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 1rem;
              cursor: pointer;
              transition: all 0.2s;
              background: #f8fafc;
            ">
              <h4 style="margin: 0 0 0.5rem 0; color: #374151;">
                💾 Sistema Local (JSON)
              </h4>
              <p style="margin: 0; color: #6b7280; font-size: 0.875rem; line-height: 1.4;">
                Genera archivos JSON automáticamente. Perfecto para uso individual.
                <br><strong>✅ Sin configuración</strong> • <strong>⚠️ No colaborativo</strong>
              </p>
            </div>
            
            <!-- Opción JSONBin -->
            <div class="system-option" data-system="jsonbin" style="
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 1rem;
              cursor: pointer;
              transition: all 0.2s;
              background: #f0fdf4;
            ">
              <h4 style="margin: 0 0 0.5rem 0; color: #374151;">
                🌐 JSONBin.io
              </h4>
              <p style="margin: 0; color: #6b7280; font-size: 0.875rem; line-height: 1.4;">
                API REST gratuita para colaboración en tiempo real.
                <br><strong>✅ Colaborativo</strong> • <strong>✅ 30k requests/mes</strong> • <strong>⚠️ Requiere API key</strong>
              </p>
            </div>
            
            <!-- Opción GitHub -->
            <div class="system-option" data-system="github" style="
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 1rem;
              cursor: pointer;
              transition: all 0.2s;
              background: #fefbf3;
            ">
              <h4 style="margin: 0 0 0.5rem 0; color: #374151;">
                🐙 GitHub como Base de Datos
              </h4>
              <p style="margin: 0; color: #6b7280; font-size: 0.875rem; line-height: 1.4;">
                Usa GitHub para almacenar datos con control de versiones completo.
                <br><strong>✅ Gratuito</strong> • <strong>✅ Historial</strong> • <strong>⚠️ Requiere token GitHub</strong>
              </p>
            </div>
          </div>
          
          <div style="text-align: center;">
            <button id="confirmSystemBtn" disabled style="
              background: #9ca3af;
              color: white;
              border: none;
              padding: 0.75rem 2rem;
              border-radius: 8px;
              cursor: not-allowed;
              font-weight: 500;
              font-size: 1rem;
            ">
              Continuar
            </button>
          </div>
          
          <p style="text-align: center; margin-top: 1rem; color: #6b7280; font-size: 0.8125rem;">
            💡 Puedes cambiar el sistema más tarde en Configuración
          </p>
        </div>
      `;
      
      // Crear overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      `;
      overlay.innerHTML = modalHTML;
      
      document.body.appendChild(overlay);
      
      // Manejar selección de sistema
      let selectedSystem = null;
      const systemOptions = overlay.querySelectorAll('.system-option');
      const confirmBtn = overlay.querySelector('#confirmSystemBtn');
      
      systemOptions.forEach(option => {
        option.addEventListener('click', () => {
          // Remover selección anterior
          systemOptions.forEach(opt => {
            opt.style.borderColor = '#e5e7eb';
            opt.style.transform = 'none';
          });
          
          // Aplicar selección actual
          option.style.borderColor = '#3b82f6';
          option.style.transform = 'translateY(-2px)';
          
          selectedSystem = option.dataset.system;
          
          // Habilitar botón
          confirmBtn.disabled = false;
          confirmBtn.style.background = '#3b82f6';
          confirmBtn.style.cursor = 'pointer';
        });
        
        // Hover effects
        option.addEventListener('mouseenter', () => {
          if (option.style.borderColor !== 'rgb(59, 130, 246)') {
            option.style.borderColor = '#d1d5db';
          }
        });
        
        option.addEventListener('mouseleave', () => {
          if (option.style.borderColor !== 'rgb(59, 130, 246)') {
            option.style.borderColor = '#e5e7eb';
          }
        });
      });
      
      // Manejar confirmación
      confirmBtn.addEventListener('click', async () => {
        if (!selectedSystem) return;
        
        overlay.remove();
        
        // Si requiere configuración, mostrar modal específico
        if (selectedSystem === 'jsonbin') {
          await this.showJSONBinConfigModal();
        } else if (selectedSystem === 'github') {
          await this.showGitHubConfigModal();
        }
        
        resolve(selectedSystem);
      });
    });
  }
  
  /**
   * Modal de configuración de JSONBin
   */
  async showJSONBinConfigModal() {
    return new Promise((resolve) => {
      const configHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px;">
          <h3 style="color: #1e40af; margin-bottom: 1.5rem;">🌐 Configurar JSONBin.io</h3>
          
          <div style="margin-bottom: 1.5rem;">
            <p style="color: #6b7280; margin-bottom: 1rem; line-height: 1.5;">
              <strong>Paso 1:</strong> Ve a <a href="https://jsonbin.io" target="_blank" style="color: #3b82f6;">jsonbin.io</a> y crea una cuenta gratuita
            </p>
            <p style="color: #6b7280; margin-bottom: 1rem; line-height: 1.5;">
              <strong>Paso 2:</strong> Copia tu API Key desde el dashboard
            </p>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">
              API Key de JSONBin.io:
            </label>
            <input type="text" id="jsonbinApiKey" placeholder="$2a$10$..." style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-family: Monaco, monospace;
              font-size: 0.875rem;
            ">
          </div>
          
          <div style="text-align: center;">
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
              background: #6b7280;
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              margin-right: 0.5rem;
            ">
              Cancelar
            </button>
            <button id="saveJSONBinConfig" style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 6px;
            ">
              Guardar
            </button>
          </div>
        </div>
      `;
      
      const overlay = this.createModalOverlay(configHTML);
      document.body.appendChild(overlay);
      
      overlay.querySelector('#saveJSONBinConfig').addEventListener('click', () => {
        const apiKey = overlay.querySelector('#jsonbinApiKey').value.trim();
        
        if (!apiKey) {
          alert('Por favor ingresa tu API Key');
          return;
        }
        
        localStorage.setItem('jsonbin_api_key', apiKey);
        overlay.remove();
        resolve();
      });
    });
  }
  
  /**
   * Modal de configuración de GitHub
   */
  async showGitHubConfigModal() {
    return new Promise((resolve) => {
      const configHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px;">
          <h3 style="color: #1e40af; margin-bottom: 1.5rem;">🐙 Configurar GitHub</h3>
          
          <div style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #6b7280; line-height: 1.5;">
            <p><strong>Paso 1:</strong> Crea un repositorio público en GitHub para los datos</p>
            <p><strong>Paso 2:</strong> Ve a Settings → Developer settings → Personal access tokens</p>
            <p><strong>Paso 3:</strong> Genera un token con permisos de 'repo'</p>
          </div>
          
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Usuario GitHub:</label>
            <input type="text" id="githubOwner" placeholder="tu-usuario" style="
              width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px;
            ">
          </div>
          
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Repositorio:</label>
            <input type="text" id="githubRepo" placeholder="portal-pse-data" style="
              width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px;
            ">
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Token de Acceso:</label>
            <input type="password" id="githubToken" placeholder="ghp_..." style="
              width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px;
              font-family: Monaco, monospace; font-size: 0.875rem;
            ">
          </div>
          
          <div style="text-align: center;">
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
              background: #6b7280; color: white; border: none; padding: 0.5rem 1rem;
              border-radius: 6px; margin-right: 0.5rem;
            ">Cancelar</button>
            <button id="saveGitHubConfig" style="
              background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px;
            ">Guardar</button>
          </div>
        </div>
      `;
      
      const overlay = this.createModalOverlay(configHTML);
      document.body.appendChild(overlay);
      
      overlay.querySelector('#saveGitHubConfig').addEventListener('click', () => {
        const owner = overlay.querySelector('#githubOwner').value.trim();
        const repo = overlay.querySelector('#githubRepo').value.trim();
        const token = overlay.querySelector('#githubToken').value.trim();
        
        if (!owner || !repo || !token) {
          alert('Por favor completa todos los campos');
          return;
        }
        
        localStorage.setItem('github_owner', owner);
        localStorage.setItem('github_repo', repo);
        localStorage.setItem('github_token', token);
        
        overlay.remove();
        resolve();
      });
    });
  }
  
  /**
   * Crear overlay modal genérico
   */
  createModalOverlay(content) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center;
      z-index: 10000; backdrop-filter: blur(4px);
    `;
    overlay.innerHTML = content;
    return overlay;
  }
  
  // =============================================================================
  // MÉTODOS UNIFICADOS (delegados al sistema actual)
  // =============================================================================
  
  async guardarCliente(cliente) {
    if (!this.currentSystem) {
      throw new Error('Sistema colaborativo no inicializado');
    }
    return await this.currentSystem.guardarCliente(cliente);
  }
  
  async buscarCliente(nit) {
    if (!this.currentSystem) {
      throw new Error('Sistema colaborativo no inicializado');
    }
    return await this.currentSystem.buscarCliente(nit);
  }
  
  async guardarAvances(nit, avances) {
    if (!this.currentSystem) {
      throw new Error('Sistema colaborativo no inicializado');
    }
    return await this.currentSystem.guardarAvances(nit, avances);
  }
  
  async obtenerAvances(nit) {
    if (!this.currentSystem) {
      throw new Error('Sistema colaborativo no inicializado');
    }
    return await this.currentSystem.obtenerAvances(nit);
  }
  
  async obtenerTodosLosClientes() {
    if (!this.currentSystem) {
      throw new Error('Sistema colaborativo no inicializado');
    }
    return await this.currentSystem.obtenerTodosLosClientes();
  }
  
  async obtenerTiposCertificacion() {
    if (!this.currentSystem) {
      throw new Error('Sistema colaborativo no inicializado');
    }
    return await this.currentSystem.obtenerTiposCertificacion();
  }
  
  async guardarTiposCertificacion(tipos) {
    if (!this.currentSystem) {
      throw new Error('Sistema colaborativo no inicializado');  
    }
    return await this.currentSystem.guardarTiposCertificacion(tipos);
  }
  
  mostrarEstadoConexion() {
    if (this.currentSystem && this.currentSystem.mostrarEstadoConexion) {
      return this.currentSystem.mostrarEstadoConexion();
    }
  }
  
  async mostrarEstadisticas() {
    if (!this.currentSystem) {
      throw new Error('Sistema colaborativo no inicializado');
    }
    return await this.currentSystem.mostrarEstadisticas();
  }
  
  /**
   * Mostrar notificación unificada
   */
  mostrarNotificacion(mensaje, tipo = 'info') {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: ${tipo === 'success' ? '#10b981' : tipo === 'warning' ? '#f59e0b' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
      color: white; padding: 15px 20px; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: Inter, sans-serif;
      font-size: 14px; max-width: 350px;
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
   * Panel de administración unificado
   */
  async mostrarPanelAdministracion() {
    const currentSystemName = localStorage.getItem('portal_collaboration_system') || 'local';
    const systemInfo = {
      local: { name: '💾 Local JSON', desc: 'Archivos locales' },
      jsonbin: { name: '🌐 JSONBin.io', desc: 'API colaborativa' },
      github: { name: '🐙 GitHub', desc: 'Repositorio Git' }
    };
    
    const panelHTML = `
      <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 700px; max-height: 80vh; overflow-y: auto;">
        <h3 style="color: #1e40af; margin-bottom: 1.5rem;">⚙️ Panel de Administración Colaborativo</h3>
        
        <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 0.5rem 0;">Sistema Actual:</h4>
          <p style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #1e40af;">
            ${systemInfo[currentSystemName].name} - ${systemInfo[currentSystemName].desc}
          </p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <button id="switchSystemBtn" style="
            background: #f59e0b; color: white; border: none; padding: 1rem;
            border-radius: 8px; cursor: pointer; font-weight: 500;
          ">🔄 Cambiar Sistema</button>
          
          <button id="showStatsBtn" style="
            background: #10b981; color: white; border: none; padding: 1rem;
            border-radius: 8px; cursor: pointer; font-weight: 500;
          ">📊 Ver Estadísticas</button>
          
          <button id="exportDataBtn" style="
            background: #3b82f6; color: white; border: none; padding: 1rem;
            border-radius: 8px; cursor: pointer; font-weight: 500;
          ">📤 Exportar Todo</button>
          
          <button id="historyBtn" ${currentSystemName === 'github' ? '' : 'disabled'} style="
            background: ${currentSystemName === 'github' ? '#8b5cf6' : '#9ca3af'}; 
            color: white; border: none; padding: 1rem; border-radius: 8px; 
            cursor: ${currentSystemName === 'github' ? 'pointer' : 'not-allowed'}; font-weight: 500;
          ">🔍 Ver Historial</button>
        </div>
        
        <div style="text-align: center;">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: #6b7280; color: white; border: none; padding: 0.75rem 2rem;
            border-radius: 8px; cursor: pointer; font-weight: 500;
          ">Cerrar</button>
        </div>
      </div>
    `;
    
    const overlay = this.createModalOverlay(panelHTML);
    document.body.appendChild(overlay);
    
    // Eventos de botones
    overlay.querySelector('#switchSystemBtn').addEventListener('click', async () => {
      overlay.remove();
      await this.showSystemSelectionModal();
      const newSystem = localStorage.getItem('portal_collaboration_system');
      await this.switchToSystem(newSystem);
    });
    
    overlay.querySelector('#showStatsBtn').addEventListener('click', async () => {
      await this.mostrarEstadisticas();
    });
    
    overlay.querySelector('#exportDataBtn').addEventListener('click', async () => {
      if (this.currentSystem.exportarTodosLosDatos) {
        await this.currentSystem.exportarTodosLosDatos();
      } else {
        this.mostrarNotificacion('Función no disponible en este sistema', 'warning');
      }
    });
    
    if (currentSystemName === 'github' && overlay.querySelector('#historyBtn')) {
      overlay.querySelector('#historyBtn').addEventListener('click', async () => {
        if (this.currentSystem.verHistorialCambios) {
          await this.currentSystem.verHistorialCambios();
        }
      });
    }
  }
}

// Hacer disponible globalmente
window.UnifiedCollaborativeAdapter = UnifiedCollaborativeAdapter;

// Crear instancia global
window.collaborativeAdapter = new UnifiedCollaborativeAdapter();
