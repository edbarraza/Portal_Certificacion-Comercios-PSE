# Portal de Certificación PSE - ACH Colombia

## 🎯 Descripción

Portal web colaborativo para la gestión y seguimiento de certificaciones PSE (Pagos Seguros en Línea) de comercios afiliados a ACH Colombia S.A.

## ✨ Características Principales

- **🤝 Sistema Colaborativo**: Múltiples usuarios pueden trabajar simultáneamente
- **💾 Persistencia Flexible**: Soporte para LocalStorage, JSONBin.io y GitHub como base de datos
- **📊 Gestión Completa**: Registro de clientes, seguimiento de avances, tipos de certificación personalizables
- **📈 Reportes y Estadísticas**: Dashboard con métricas de progreso y completitud
- **🔄 Sincronización en Tiempo Real**: Actualizaciones automáticas entre usuarios
- **📱 Diseño Responsivo**: Interfaz adaptable a diferentes dispositivos

## 🚀 Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Persistencia**: 
  - LocalStorage (modo offline)
  - JSONBin.io API (colaborativo simple)
  - GitHub API (colaborativo con versionado)
- **UI/UX**: CSS Grid, Flexbox, Animaciones CSS

## 📁 Estructura del Proyecto

```
Portal_Certificacion-Comercios-PSE/
├── index.html                          # Página principal
├── script.js                          # Lógica principal de la aplicación
├── styles.css                         # Estilos globales
├── correo-avances-generator.js         # Generador de reportes por correo
├── pdf-export.js                      # Exportación a PDF
├── template-correo-avances.html        # Plantilla de correos
├── js/
│   ├── collaborative-jsonbin-manager.js    # Gestor JSONBin.io
│   ├── collaborative-github-manager.js     # Gestor GitHub
│   ├── unified-collaborative-adapter.js    # Adaptador unificado
│   └── local-json-adapter.js              # Adaptador local
├── img/
│   ├── ACH.png                         # Logo ACH Colombia
│   ├── PSE.png                         # Logo PSE
│   └── store.png                       # Iconos de comercio
└── README.md                           # Documentación
```

## 🔧 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/Portal_Certificacion-Comercios-PSE.git
cd Portal_Certificacion-Comercios-PSE
```

### 2. Abrir el Portal
Simplemente abre `index.html` en tu navegador web.

### 3. Configurar Sistema Colaborativo (Opcional)

#### Opción A: JSONBin.io (Recomendado para uso básico)
1. Crear cuenta gratuita en [JSONBin.io](https://jsonbin.io)
2. Obtener API Key
3. Configurar en el modal de sistema al abrir el portal

#### Opción B: GitHub como Base de Datos
1. Crear Personal Access Token en GitHub con permisos `repo`
2. Crear repositorio para almacenar datos
3. Configurar en el modal de sistema al abrir el portal

## 🎮 Uso del Portal

### 1. **Crear Nuevo Cliente**
- Ingresar NIT y nombre del comercio
- Seleccionar tipo de certificación
- El sistema crea automáticamente el checklist correspondiente

### 2. **Gestionar Avances**
- Navegar por las páginas del checklist
- Marcar elementos como "Sí", "No" o "No Aplica"
- Guardar progreso automáticamente

### 3. **Administración**
- Gestionar tipos de certificación personalizados
- Ver estadísticas del sistema
- Exportar/importar datos
- Generar reportes

### 4. **Colaboración**
- Múltiples usuarios pueden trabajar en paralelo
- Sincronización automática de cambios
- Notificaciones de actualizaciones en tiempo real

## 📊 Características Avanzadas

### Sistema de Checkpoints
- Guardar puntos de control del progreso
- Restaurar estado anterior si es necesario
- Historial de cambios por cliente

### Generación de Reportes
- Exportación a PDF con diseño profesional
- Plantillas de correo con resumen de avances
- Estadísticas detalladas del sistema

### Tipos de Certificación Personalizables
- Crear nuevos tipos según necesidades
- Configurar checklists específicos por tipo
- Gestión flexible de requisitos

## 🔒 Seguridad y Backup

- **Backup Automático**: Los datos se sincronizan automáticamente en el sistema colaborativo seleccionado
- **Versionado**: Con GitHub, mantiene historial completo de cambios
- **Fallback Local**: Funciona sin conexión con datos locales

## 🛠️ Desarrollo

### Agregar Nuevas Características
1. Crear rama de feature: `git checkout -b feature/nueva-caracteristica`
2. Implementar cambios
3. Probar en diferentes sistemas de persistencia
4. Crear pull request

### Sistema de Adaptadores
El portal usa un patrón de adaptador que permite cambiar fácilmente entre sistemas de persistencia:

```javascript
// Ejemplo de uso del adaptador unificado
await collaborativeAdapter.guardarCliente(cliente);
await collaborativeAdapter.obtenerAvances(nit);
```

## 📞 Soporte

Para soporte técnico o consultas sobre el portal, contactar al equipo de desarrollo de ACH Colombia S.A.

## 📝 Licencia

© 2025 ACH Colombia S.A. - Portal de Certificación PSE
Uso interno de la organización.

## 🚀 Deployment

### GitHub Pages (Recomendado)
1. Habilitar GitHub Pages en configuración del repositorio
2. Seleccionar rama `main` como source
3. El portal estará disponible en: `https://tu-usuario.github.io/Portal_Certificacion-Comercios-PSE/`

### Netlify
1. Conectar repositorio con Netlify
2. Deploy automático en cada push a `main`

### Vercel
1. Importar proyecto desde GitHub
2. Deploy automático configurado

---

**Desarrollado con ❤️ para ACH Colombia S.A.**
