# RadioBiz Floating Player para WordPress

Un reproductor de radio flotante, moderno y rico en funciones para WordPress. Diseñado para ofrecer una experiencia de usuario impecable, es arrastrable, plegable y recuerda las preferencias del usuario, todo dentro de una interfaz elegante y personalizable.

![Versión 2.6](https://img.shields.io/badge/Versión-2.6-blue.svg)
![Licencia GPLv2](https://img.shields.io/badge/Licencia-GPLv2-brightgreen.svg)
![WordPress 5.0+](https://img.shields.io/badge/WordPress-5.0+-orange.svg)

## Descripción

**RadioBiz Floating Player** no es solo otro reproductor de radio. Es un componente de interfaz de usuario meticulosamente diseñado para integrarse en cualquier sitio de WordPress y ofrecer una experiencia auditiva continua sin interrumpir la navegación del usuario.

El reproductor permanece visible y accesible mientras los visitantes exploran el sitio. Su diseño está enfocado en la usabilidad, la personalización y la robustez, resolviendo problemas comunes como la inconsistencia entre dispositivos y la pérdida de estado.

### Características Principales

*   **Interfaz Flotante y Arrastrable:** Los usuarios pueden mover el reproductor a cualquier lugar de la pantalla para una comodidad óptima.
*   **Diseño Plegable Inteligente:** Con un solo clic, el reproductor se minimiza a un ícono circular, liberando espacio en pantalla sin detener la música.
*   **Memoria Persistente:**
    *   **Posición:** Recuerda dónde lo dejó el usuario en su última visita.
    *   **Estado:** Mantiene el estado de reproducción (Play/Pausa) y el estado plegado/desplegado.
    *   **Volumen:** Guarda y restaura el último nivel de volumen establecido.
*   **Sincronización de Volumen Infalible:** Un "vigilante" interno comprueba y sincroniza activamente el volumen, asegurando que los cambios realizados con los **botones físicos del móvil** se reflejen instantáneamente en la interfaz.
*   **Posicionamiento Inteligente (Multi-dispositivo):** Valida la posición guardada al cargar. Si un usuario pasa de una pantalla de escritorio a una móvil, el reproductor se reubica automáticamente para **garantizar que siempre sea visible**, evitando el problema de quedar "fuera de pantalla".
*   **Metadatos en Tiempo Real:** Se conecta a través de **Pusher** para mostrar la información de la canción (título y artista) y la carátula del álbum en tiempo real.
*   **Efecto Marquee Automático:** Los títulos de canciones o artistas que son demasiado largos se desplazan automáticamente para asegurar una legibilidad completa.
*   **Panel de Configuración en WordPress:**
    *   Un menú de administración integrado con un **ícono personalizado** para una apariencia profesional.
    *   Opciones para personalizar el ancho del reproductor, el color de los controles y el comportamiento inicial en móviles.
*   **Construcción Robusta y Aislada:** Creado como un **Web Component** nativo, el reproductor funciona en su propio "universo" (Shadow DOM), lo que **evita conflictos de estilo y de scripts** con el tema de WordPress o con otros plugins.

## Stack Tecnológico

Este plugin combina tecnologías de backend de WordPress con un frontend moderno para lograr su funcionalidad y diseño.

#### **Frontend (El Reproductor)**

*   **JavaScript Nativo (ES6+):** Todo el comportamiento interactivo, la lógica de estado y las actualizaciones de la interfaz están escritos en JavaScript moderno y puro, sin dependencias de frameworks externos.
*   **Web Components (Custom Elements & Shadow DOM):** Es el corazón de la arquitectura del reproductor.
    *   **Custom Elements:** Permite crear nuestro propio elemento HTML (`<radio-player>`), haciendo que el código sea semántico y reutilizable.
    *   **Shadow DOM:** Encapsula todo el HTML, CSS y JavaScript del reproductor. Esto es crucial en el ecosistema de WordPress, ya que garantiza que los estilos del tema no "rompan" el reproductor, y que los estilos del reproductor no afecten al resto del sitio.
*   **CSS3:** Utilizado para el diseño, las animaciones fluidas (`@keyframes` para el giro del disco y el efecto marquee), los filtros de desenfoque (`backdrop-filter`) y el diseño responsivo.
*   **HTML5:** Se utiliza el elemento `<audio>` para la funcionalidad de streaming de audio.

#### **Backend (Integración con WordPress)**

*   **PHP:** Utilizado para la lógica del lado del servidor que cumple con los estándares del ecosistema de WordPress.
*   **WordPress Plugin API:** Se utilizan los hooks y funciones nativas de WordPress (`add_action`, `add_menu_page`, `register_setting`, `get_option`, etc.) para crear el panel de administración, registrar las opciones y cargar los scripts correctamente en el frontend.

#### **Servicios y APIs Externas**

*   **Pusher (Pusher.js):** Se integra con el cliente de Pusher para suscribirse a un canal y recibir eventos en tiempo real que actualizan los metadatos de la canción.
*   **Browser localStorage API:** Utilizada para la memoria persistente del reproductor, guardando el estado, la posición y el volumen directamente en el navegador del usuario.

#### **Desarrollo y Versionado**

*   **Git:** Para el control de versiones del código fuente.
*   **GitHub:** Para alojar el repositorio de código y gestionar el historial de cambios.
