/**
 * Implementación básica de CollaborativeGitHubManager usando GitHub Contents API
 * Lee y escribe un único archivo JSON (data.json) en la rama 'main'.
 */
class CollaborativeGitHubManager {
  constructor() {
    this.owner = localStorage.getItem('github_owner');
    this.repo = localStorage.getItem('github_repo');
    this.token = localStorage.getItem('github_token');
    this.path = localStorage.getItem('github_path') || 'data.json';
    this.baseURL = 'https://api.github.com';
    this.rawURL = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/${this.path}`;
    this.data = { clientes: {}, avances: {}, tipos: {} };
    this.sha = null;
  }

  async initialize() {
    if (!this.owner || !this.repo || !this.token) {
      throw new Error('Credenciales de GitHub faltantes en localStorage');
    }
    // Cargar datos desde GitHub RAW
    const resp = await fetch(this.rawURL);
    if (resp.ok) {
      this.data = await resp.json();
    }
    // Obtener SHA para actualizaciones
    const metaResp = await fetch(
      `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${this.path}`,
      { headers: { Authorization: `token ${this.token}` } }
    );
    if (metaResp.ok) {
      const meta = await metaResp.json();
      this.sha = meta.sha;
    }
  }

  async saveData() {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(this.data, null, 2))));
    const body = { message: 'Update data.json desde Portal', content, sha: this.sha };
    const resp = await fetch(
      `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${this.path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    if (resp.ok) {
      const json = await resp.json();
      this.sha = json.content.sha;
    } else {
      throw new Error('Error guardando datos en GitHub');
    }
  }

  buscarCliente(nit) {
    return this.data.clientes[nit] || null;
  }

  obtenerAvances(nit) {
    return this.data.avances[nit] || {};
  }

  obtenerTiposCertificacion() {
    return this.data.tipos;
  }

  async guardarCliente(cliente) {
    this.data.clientes[cliente.nit] = cliente;
    await this.saveData();
  }

  async guardarAvances(nit, avances) {
    this.data.avances[nit] = avances;
    await this.saveData();
  }

  async guardarTiposCertificacion(tipos) {
    this.data.tipos = tipos;
    await this.saveData();
  }
}

// Hacer disponible globalmente
window.CollaborativeGitHubManager = CollaborativeGitHubManager;
