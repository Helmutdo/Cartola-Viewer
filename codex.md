# Diagnostico y Proyeccion del Proyecto

## Objetivo del producto

Construir una herramienta local y visual que ayude al usuario a entender su cartola bancaria sin tener que revisar manualmente cada movimiento. El primer banco soportado sera Banco Falabella Chile.

La herramienta debe permitir:

- Subir cartolas PDF.
- Extraer movimientos.
- Separar cargos y abonos.
- Categorizar gastos.
- Visualizar patrones de consumo.
- Detectar alertas o gastos inusuales.
- Ayudar al usuario a corregir y mejorar la clasificacion con el tiempo.

## Estado actual

El proyecto ya tiene una base funcional para un MVP local:

- Frontend en React, TypeScript y Vite.
- Parser inicial para cartolas de Banco Falabella.
- Extraccion de texto desde PDF con `pdfjs-dist`.
- Estado global con Zustand.
- Persistencia en `localStorage`.
- Componentes para carga de PDF, metricas, graficos, alertas, presupuestos, reglas, categorias y tabla de movimientos.
- Categorizacion automatica basica por reglas y palabras clave.
- Correccion manual de categorias.
- Exportacion CSV.

El flujo principal ya esta definido:

```txt
PDF
-> extraccion de texto
-> parser Banco Falabella
-> transacciones
-> categorizacion
-> visualizacion
-> persistencia local
```

## Problemas detectados

### 1. Build roto

Actualmente `npm run build` falla porque `src/lib/parseFalabella.ts` importa un tipo `Category` que no existe en `src/types/index.ts`.

Probablemente debe reemplazarse por `SubCategory`.

### 2. Lint roto por dependencias

`npm run lint` falla por un problema en `node_modules/eslint`, donde falta el modulo `../linter.js`.

Esto parece un problema de instalacion de dependencias. Probablemente se corrige reinstalando:

```bash
npm install
```

o limpiando `node_modules` y reinstalando.

### 3. Falta de tests

No existe suite de pruebas.

Para este proyecto, los tests son importantes especialmente en:

- Parser de Banco Falabella.
- Deteccion de cargos vs abonos.
- Agrupacion por mes.
- Categorizacion.
- Reglas del usuario.
- Persistencia local.

Se recomienda crear fixtures anonimizados de cartolas reales o fragmentos de texto extraido desde PDF.

### 4. README sin contexto del producto

El README actual sigue siendo el template de Vite. Falta documentar:

- Que problema resuelve la app.
- Bancos soportados.
- Como usarla.
- Como se protege la privacidad.
- Limitaciones conocidas.
- Flujo tecnico de parsing y categorizacion.

### 5. Categorizacion todavia pesada para el usuario

Aunque el usuario puede categorizar manualmente, este proceso puede ser tedioso porque las cartolas no siempre muestran el nombre comercial que el usuario reconoce.

Ejemplo:

```txt
Nombre conocido por el usuario: Unicar
Nombre en cartola: SOCIEDAD DE HERMANOS Y VENTAS DE VEHICULOS MULTICAR SPA
```

El usuario normalmente conoce nombres de fantasia, nombres cortos o nombres "de pila", no razones sociales legales.

## Propuesta: normalizacion de comercios

La mejora mas importante para reducir friccion es agregar una capa intermedia entre la descripcion bancaria y la categoria.

Hoy el flujo es:

```txt
descripcion de cartola -> categoria
```

Se recomienda cambiarlo a:

```txt
descripcion de cartola
-> comercio detectado
-> nombre amigable
-> categoria sugerida
```

Ejemplo:

```txt
descripcion_cartola: "SOCIEDAD DE HERMANOS Y VENTAS DE VEHICULOS MULTICAR SPA"
comercio_detectado: "Unicar"
categoria: "Automovil / Mantencion"
```

## Nueva entidad sugerida: MerchantAlias

Agregar una entidad para representar comercios conocidos, alias y patrones de deteccion.

```ts
interface MerchantAlias {
  id: string
  displayName: string
  patterns: string[]
  defaultCategory?: string
  createdAt: string
  updatedAt: string
}
```

Ejemplo:

```ts
{
  id: "merchant_unicar",
  displayName: "Unicar",
  patterns: [
    "SOCIEDAD DE HERMANOS Y VENTAS DE VEHICULOS MULTICAR",
    "MULTICAR SPA",
    "UNICAR"
  ],
  defaultCategory: "Automovil"
}
```

## Flujo de usuario recomendado

Cuando la app encuentre una descripcion desconocida, no deberia preguntar solo:

```txt
En que categoria va este movimiento?
```

Deberia preguntar primero:

```txt
Que comercio es este?
```

Luego:

```txt
En que categoria va normalmente?
```

La app deberia guardar ambas respuestas.

Asi, la siguiente vez que aparezca una razon social parecida, se puede mostrar directamente:

```txt
Unicar - Automovil
```

en lugar de:

```txt
SOCIEDAD DE HERMANOS Y VENTAS DE VEHICULOS MULTICAR SPA - Sin categorizar
```

## Agrupacion por similitud

Para evitar que el usuario clasifique movimientos uno por uno, la app deberia agrupar descripciones parecidas antes de pedir revision.

Ejemplo:

```txt
SOCIEDAD DE HERMANOS Y VENTAS DE VEHICULOS MULTICAR SPA
SOC HNOS VENTA VEHICULOS MULTICAR
MULTICAR SPA
```

La app podria mostrar:

```txt
Encontramos 6 movimientos que parecen ser del mismo comercio.
Como reconoces este comercio?
```

Respuesta del usuario:

```txt
Unicar
```

Luego la app aplica ese alias a todos los movimientos similares.

## Aprendizaje incremental

Cada correccion del usuario deberia alimentar reglas internas:

- Si contiene `MULTICAR`, mostrar `Unicar`.
- Si contiene `SOCIEDAD DE HERMANOS`, mostrar `Unicar`.
- Si el comercio es `Unicar`, sugerir categoria `Automovil`.

Esto convierte la categorizacion manual en un proceso de entrenamiento progresivo.

Mientras mas cartolas cargue el usuario, menos trabajo manual deberia tener.

## Base inicial de comercios chilenos

A futuro se puede incluir una base local y editable de comercios comunes en Chile:

- `COMERCIAL ECCSA` -> `Ripley`
- `CENCOSUD RETAIL` -> `Paris / Jumbo / Santa Isabel`, segun contexto.
- `WALMART CHILE` -> `Lider`
- `SMU` -> `Unimarc`
- `FALABELLA RETAIL` -> `Falabella`
- `TRANSBANK` / `WEBPAY` -> requiere revision, porque puede representar muchos comercios distintos.

Esta base deberia ser solo una sugerencia inicial. El usuario debe poder corregirla.

## Proyeccion de desarrollo

### MVP usable: 1 a 2 semanas

Prioridades:

- Corregir build.
- Corregir entorno de lint.
- Documentar el proyecto.
- Agregar fixtures anonimizados.
- Agregar tests para el parser Banco Falabella.
- Mejorar errores de carga de PDF.
- Pulir flujo de revision de movimientos sin categoria.

### Producto solido para Banco Falabella: 3 a 5 semanas

Prioridades:

- Validar con multiples cartolas reales anonimizadas.
- Agregar normalizacion de comercios.
- Agregar alias editables por usuario.
- Mejorar agrupacion de movimientos similares.
- Detectar gastos recurrentes.
- Comparar meses.
- Mejorar insights visuales.
- Mejorar experiencia movil.

### Producto extensible a otros bancos: 6 a 10 semanas

Prioridades:

- Separar parsers por banco.
- Definir una interfaz comun de parser.
- Agregar importadores para nuevos bancos.
- Agregar validacion de calidad por parser.
- Evaluar almacenamiento local mas robusto que `localStorage`.
- Evaluar backend opcional si se requiere sincronizacion entre dispositivos.

## Recomendacion tecnica inmediata

El siguiente cambio de mayor impacto es implementar la capa de comercios:

```txt
descripcion bancaria
-> detectar comercio conocido
-> mostrar nombre amigable
-> aplicar categoria sugerida
-> permitir correccion
-> guardar alias y reglas
```

Esto haria que la app deje de ser solo un categorizador manual con graficos y pase a ser una herramienta que aprende como el usuario entiende sus gastos.
