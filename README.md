# Cartola Viewer

Herramienta web para analizar estados de cuenta bancarios (cartolas) en formato PDF. Permite categorizar automáticamente gastos, visualizar estadísticas y gestionar presupuestos, funcionando 100% en tu navegador.

### Características
- Procesamiento de PDF local (sin servidor ni red).
- Categorización inteligente automática.
- Gráficos de gasto mensuales y por categoría.
- Panel de revisión rápida y gestión de presupuestos.
- Personalización de categorías y reglas.

### Privacidad
Tu seguridad es primero. Todos los datos se almacenan exclusivamente en `localStorage` de tu navegador. Ninguna información sale de tu equipo. Puedes borrar toda la información en cualquier momento desde la configuración.

### Bancos soportados
| Banco | Estado |
| :--- | :--- |
| Falabella Chile | Soportado |
| Otros | Próximamente |

### Cómo usar
1. **Subir PDF**: Carga tu estado de cuenta desde la zona de subida.
2. **Revisar**: Clasifica y gestiona las transacciones detectadas.
3. **Analizar**: Visualiza tus hábitos de gasto en el panel de control.

### Comandos
- `npm run dev`: Inicia el servidor de desarrollo en `http://localhost:5173`.
- `npm run build`: Compila el proyecto para producción.
- `npm run lint`: Ejecuta el linter del código.

### Limitaciones
- El parser está diseñado específicamente para el formato PDF de Falabella.
- Las transacciones vía "TRANSBANK/WEBPAY" pueden no ser identificables automáticamente debido a la falta de detalle en la cartola.