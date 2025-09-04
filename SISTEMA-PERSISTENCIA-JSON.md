# 💾 Sistema de Persistencia Local JSON

## 🎯 **¿Qué es esto?**

Esta es una **alternativa completamente local** que NO requiere conexiones externas. En lugar de usar servicios en la nube, el sistema:

1. **Guarda datos localmente** en el navegador (localStorage)
2. **Genera archivos JSON automáticamente** cuando haces cambios  
3. **Te permite descargar los archivos** para conservar los datos permanentemente
4. **Funciona con hosting básico** (GitHub Pages, Netlify, etc.)

---

## 🔄 **¿Cómo funciona?**

### **Flujo Automático:**
```
Usuario guarda datos → LocalStorage + Archivo JSON descargado → Usuario copia archivo a servidor
```

### **Ventajas:**
- ✅ **Sin dependencias externas** - No necesita Firebase, APIs, etc.
- ✅ **Funciona offline** completamente  
- ✅ **Hosting básico** - Compatible con GitHub Pages
- ✅ **Control total** - Tus datos siempre en tu poder
- ✅ **Respaldos automáticos** - Cada cambio genera un archivo

### **Limitaciones:**
- ⚠️ **Proceso manual** - Debes copiar archivos al servidor manualmente
- ⚠️ **No sincronización automática** - Diferentes navegadores no se sincronizan solos
- ⚠️ **Dependiente del navegador** - Si borras el cache, pierdes datos locales

---

## 🚀 **Uso Básico**

### **1. Funcionamiento Normal:**
- Trabajas normalmente en el portal
- Al guardar clientes/avances/configuraciones, se generan archivos JSON automáticamente
- Los archivos se descargan a tu carpeta de Descargas

### **2. Aplicar Cambios al Servidor:**
```bash
# Paso 1: Localizar archivos descargados
# - clientes.json
# - avances.json  
# - tipos-certificacion.json

# Paso 2: Copiar a tu sitio web
cp ~/Descargas/clientes.json ./data/
cp ~/Descargas/avances.json ./data/
cp ~/Descargas/tipos-certificacion.json ./data/

# Paso 3: Subir al servidor (Git, FTP, etc.)
git add data/*.json
git commit -m "Actualizar datos del portal"
git push origin main
```

### **3. Respaldo y Restauración:**
- **Exportar Todo:** Botón en Configuración → Genera archivo completo
- **Importar:** Subir archivo JSON para restaurar datos

---

## 🛠️ **Funciones Principales**

### **LocalJSONManager**
Clase principal que maneja la generación de archivos:

```javascript
// Guardar cliente (genera clientes.json)
await LocalJSONManager.guardarCliente(cliente);

// Guardar avances (genera avances.json)  
await LocalJSONManager.guardarAvances(nit, avances);

// Guardar tipos (genera tipos-certificacion.json)
await LocalJSONManager.guardarTiposCertificacion(tipos);

// Exportar todo (genera portal-datos-completos.json)
await LocalJSONManager.generarTodosLosArchivos();
```

### **LocalJSONAdapter**  
Capa que reemplaza las llamadas anteriores a localStorage:

```javascript
// Buscar cliente (localStorage + archivos)
const cliente = await localJSONAdapter.buscarCliente(nit);

// Obtener avances
const avances = await localJSONAdapter.obtenerAvances(nit);

// Importar desde archivo
await localJSONAdapter.importarDatos(archivo);
```

---

## 📁 **Estructura de Archivos**

### **Archivos Generados:**
```
Portal_Certificacion-Comercios-PSE/
├── data/
│   ├── clientes.json          # Datos de comercios
│   ├── avances.json           # Progreso de certificaciones  
│   ├── tipos-certificacion.json # Configuraciones
│   └── tipos-certificacion-base.json # Tipos base (backup)
├── js/
│   ├── local-json-manager.js  # Gestión de archivos
│   └── local-json-adapter.js  # Adaptador de localStorage
└── Descargas/ (tu carpeta personal)
    ├── clientes.json          # ← Archivos generados automáticamente
    ├── avances.json
    ├── tipos-certificacion.json
    └── portal-datos-completos.json
```

### **Formato de Datos:**

**clientes.json:**
```json
{
  "clientes": {
    "1234567890": {
      "nit": "1234567890",
      "name": "Comercio Ejemplo",
      "certificationType": "pse_basico",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastModified": "2024-01-01T12:00:00Z"
    }
  },
  "generado": "2024-01-01T12:00:00Z",
  "total": 1
}
```

**avances.json:**
```json
{
  "avances": {
    "1234567890": {
      "nit": "1234567890",
      "avances": {
        "aprobado_1": "si",
        "observaciones_1": "Completado correctamente",
        "aprobado_2": "no"
      },
      "actualizado": "2024-01-01T12:00:00Z"
    }
  },
  "generado": "2024-01-01T12:00:00Z",
  "total": 1
}
```

---

## ⚙️ **Configuración y Personalización**

### **Cambiar Ubicación de Archivos:**
```javascript
// En local-json-manager.js
LocalJSONManager.DATA_FOLDER = './mi-carpeta-datos/';
```

### **Cambiar Nombres de Archivos:**
```javascript
LocalJSONManager.FILES = {
  CLIENTES: 'mis-clientes.json',
  AVANCES: 'mis-avances.json', 
  TIPOS_CERTIFICACION: 'mis-tipos.json'
};
```

### **Personalizar Notificaciones:**
```javascript
// Cambiar duración de notificaciones
setTimeout(() => {
  notif.remove();
}, 6000); // 6 segundos en lugar de 4
```

---

## 🔧 **Solución de Problemas**

### **Problema: Archivos no se descargan**
```javascript
// Verificar permisos del navegador
// Ir a: Configuración → Privacidad → Descargas → Permitir automáticamente
```

### **Problema: Datos no se cargan después de copiar archivos**
```javascript
// 1. Verificar que los archivos estén en ./data/
// 2. Verificar formato JSON válido
// 3. Recargar página completamente (Ctrl+F5)
// 4. Verificar consola del navegador para errores
```

### **Problema: LocalStorage lleno**
```javascript
// Limpiar datos antiguos
localStorage.clear();

// O exportar datos y limpiar selectivamente
await localJSONAdapter.exportarTodosLosDatos();
// Luego limpiar localStorage manualmente
```

### **Problema: Pérdida de datos**
```javascript
// 1. Verificar archivos en Descargas
// 2. Usar función de importar para restaurar
// 3. Verificar carpeta data/ del servidor
// 4. Usar archivo portal-datos-completos.json como respaldo maestro
```

---

## 🤖 **Automatización Opcional**

### **Script Python para Automatizar Copia:**
```python
# auto-deploy.py
import os
import shutil
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class JSONHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.src_path.endswith('.json'):
            filename = os.path.basename(event.src_path)
            if filename in ['clientes.json', 'avances.json', 'tipos-certificacion.json']:
                dest = f'./data/{filename}'
                shutil.copy2(event.src_path, dest)
                print(f'✅ {filename} copiado automáticamente')

# Monitorear carpeta de descargas
downloads_folder = os.path.expanduser('~/Downloads')
observer = Observer()
observer.schedule(JSONHandler(), downloads_folder, recursive=False)
observer.start()

print("🔄 Monitoreando archivos JSON...")
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    observer.stop()
observer.join()
```

### **Script Bash Simple:**
```bash
#!/bin/bash
# deploy-json.sh

echo "🚀 Copiando archivos JSON..."

# Copiar archivos más recientes
cp ~/Downloads/clientes.json ./data/ 2>/dev/null && echo "✅ clientes.json copiado"
cp ~/Downloads/avances.json ./data/ 2>/dev/null && echo "✅ avances.json copiado"  
cp ~/Downloads/tipos-certificacion.json ./data/ 2>/dev/null && echo "✅ tipos-certificacion.json copiado"

# Subir a Git
git add data/*.json
git commit -m "🔄 Actualización automática de datos - $(date)"
git push origin main

echo "🎉 Deployment completado"
```

---

## 📈 **Estadísticas y Monitoreo**

El sistema incluye un **panel de estadísticas** completo:

- 👥 **Total de clientes** registrados
- 📊 **Avances por cliente** y progreso general  
- 🏷️ **Tipos de certificación** configurados
- 📈 **Porcentaje de completitud** global
- 🕒 **Última actualización** de datos

Acceder desde: **Configuración → Ver Estadísticas**

---

## 🎯 **Conclusión**

Este sistema te da **control total** sobre tus datos sin depender de servicios externos. Es perfecto para:

- ✅ **Proyectos internos** que requieren control de datos
- ✅ **Hosting limitado** que no permite bases de datos
- ✅ **Cumplimiento de privacidad** estricto
- ✅ **Prototipos y demos** que no requieren infraestructura compleja

**¿Necesitas ayuda?** Revisa los logs de consola del navegador o verifica los archivos generados en tu carpeta de Descargas.
