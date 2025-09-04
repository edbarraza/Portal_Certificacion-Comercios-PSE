# Configuración de Firebase para Portal de Certificación PSE

## 🔧 Configuración Requerida

Para habilitar la persistencia real en la nube, necesitas configurar Firebase:

### 1. Crear Proyecto Firebase (GRATIS)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Clic en "Agregar proyecto"
3. Nombre: `certificacion-pse` (o el que prefieras)
4. Habilitar Google Analytics: NO (opcional)
5. Crear proyecto

### 2. Configurar Firestore Database

1. En el menú lateral: **Firestore Database**
2. Clic "Crear base de datos"
3. Modo: **Producción** 
4. Ubicación: **us-central** (o más cercana)

### 3. Obtener Configuración

1. En el menú lateral: **Configuración del proyecto** (⚙️)
2. Desplázate hasta "Tus apps"
3. Clic en "Web" (</>)
4. Nombre de la app: `portal-certificacion-pse`
5. Copiar la configuración que aparece

### 4. Actualizar Código

Edita el archivo `js/firebase-persistence-manager.js` y reemplaza:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "certificacion-pse.firebaseapp.com", 
  projectId: "certificacion-pse",
  storageBucket: "certificacion-pse.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

Con tu configuración real de Firebase.

## 📊 Límites Gratuitos Firebase

- **Firestore**: 1 GB de almacenamiento
- **Operaciones**: 50,000 lecturas/día, 20,000 escrituras/día
- **Ancho de banda**: 10 GB/mes

Para un portal de certificación, esto es **más que suficiente**.

## 🎯 Ventajas de esta Implementación

✅ **Persistencia real** - Los datos nunca se pierden  
✅ **Funciona en hosting básico** - No necesita backend  
✅ **Sincronización automática** - Entre dispositivos/navegadores  
✅ **Modo offline** - Sigue funcionando sin conexión  
✅ **Respaldos automáticos** - Firebase maneja redundancia  
✅ **Escalable** - Crece con tus necesidades  

## 🔒 Reglas de Seguridad Recomendadas

En Firebase Console → Firestore → Reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura para todos (temporal)
    // En producción, implementar autenticación
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 🚀 Alternativas si no quieres Firebase

1. **Supabase** - PostgreSQL gratis con API REST
2. **PlanetScale** - MySQL serverless gratuito  
3. **MongoDB Atlas** - 512MB gratis
4. **JSONBin.io** - API simple para JSON
5. **GitHub como DB** - Usar repositorio como almacén

¿Necesitas ayuda configurando alguna de estas opciones?
