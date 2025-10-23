<?php
/**
 * Plugin Name:   RadioBiz Floating Player
 * Plugin URI:    https://pragmaticsolutions.com.ar/radiobiz-player
 * Description:   Añade un reproductor de radio flotante, plegable y arrastrable con una interfaz pulida y controles inteligentes. Totalmente personalizable, con memoria de estado y compatible con dispositivos móviles.
 * Version:       2.9
 * Author:        Cristian Farfan
 * Author URI:    https://cristianfarfan.com.ar
 * Requires at least: 5.0
 * Requires PHP:  7.2
 * License:       GPLv2 or later
 * License URI:   https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:   radiobiz-floating-player
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// Añade el menú de configuración al panel lateral de WordPress
add_action( 'admin_menu', 'radiobiz_floating_player_options_page' );
function radiobiz_floating_player_options_page() {
    $icon_svg = '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path fill="currentColor" d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z"/></svg>';
    $icon_url = 'data:image/svg+xml;base64,' . base64_encode( $icon_svg );

    add_menu_page(
        'RadioBiz Player',
        'RadioBiz Player',
        'manage_options',
        'radiobiz-floating-player-settings',
        'radiobiz_floating_player_options_page_html',
        $icon_url,
        80
    );
}

// Registra las opciones y campos del plugin
add_action( 'admin_init', 'radiobiz_floating_player_settings_init' );
function radiobiz_floating_player_settings_init() {
    register_setting( 'radiobiz_player_options', 'radiobiz_player_options' );

    add_settings_section(
        'radiobiz_player_main_section',
        'Configuración Principal',
        null,
        'radiobiz-floating-player-settings'
    );

    add_settings_field( 'player_width', 'Ancho del Reproductor (px)', 'radiobiz_player_width_render', 'radiobiz-floating-player-settings', 'radiobiz_player_main_section' );
    add_settings_field( 'initial_top', 'Posición Superior por Defecto (px)', 'radiobiz_player_initial_top_render', 'radiobiz-floating-player-settings', 'radiobiz_player_main_section' );
    add_settings_field( 'initial_left', 'Posición Izquierda por Defecto (px)', 'radiobiz_player_initial_left_render', 'radiobiz-floating-player-settings', 'radiobiz_player_main_section' );
    add_settings_field( 'button_color', 'Color de los Controles', 'radiobiz_player_button_color_render', 'radiobiz-floating-player-settings', 'radiobiz_player_main_section' );
    add_settings_field( 'start_collapsed_mobile', 'Comportamiento en Móviles', 'radiobiz_player_start_collapsed_render', 'radiobiz-floating-player-settings', 'radiobiz_player_main_section' );
}

function radiobiz_player_width_render() {
    $options = get_option( 'radiobiz_player_options' );
    echo '<input type="number" name="radiobiz_player_options[player_width]" value="' . esc_attr( isset($options['player_width']) ? $options['player_width'] : '320' ) . '" placeholder="320">';
}

function radiobiz_player_initial_top_render() {
    $options = get_option( 'radiobiz_player_options' );
    echo '<input type="number" name="radiobiz_player_options[initial_top]" value="' . esc_attr( isset($options['initial_top']) ? $options['initial_top'] : '' ) . '" placeholder="auto">';
}

function radiobiz_player_initial_left_render() {
    $options = get_option( 'radiobiz_player_options' );
    echo '<input type="number" name="radiobiz_player_options[initial_left]" value="' . esc_attr( isset($options['initial_left']) ? $options['initial_left'] : '' ) . '" placeholder="auto">';
}

function radiobiz_player_button_color_render() {
    $options = get_option( 'radiobiz_player_options' );
    echo '<input type="color" name="radiobiz_player_options[button_color]" value="' . esc_attr( isset($options['button_color']) ? $options['button_color'] : '#ff007a' ) . '">';
}

function radiobiz_player_start_collapsed_render() {
    $options = get_option( 'radiobiz_player_options' );
    $checked = isset($options['start_collapsed_mobile']) && $options['start_collapsed_mobile'] === 'on';
    echo '<input type="checkbox" name="radiobiz_player_options[start_collapsed_mobile]" ' . checked( $checked, true, false ) . '> Iniciar plegado en dispositivos móviles';
}

function radiobiz_floating_player_options_page_html() {
    ?>
    <div class="wrap">
        <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
        <p>Configura la apariencia y comportamiento del reproductor de radio.</p>
        <form action="options.php" method="post">
            <?php
            settings_fields( 'radiobiz_player_options' );
            do_settings_sections( 'radiobiz-floating-player-settings' );
            submit_button( 'Guardar Cambios' );
            ?>
        </form>
    </div>
    <?php
}

function radiobiz_floating_player_enqueue_scripts() {
    // Registra y encola Pusher.js desde su CDN, cumpliendo con las directrices de WordPress.
    wp_enqueue_script( 
        'pusher-js', 
        'https://js.pusher.com/8.4.0-rc2/pusher.min.js', 
        array(), // Sin dependencias para Pusher.
        '8.4.0-rc2', // Versión del script.
        true // Cargar en el footer.
    );

    // Encola nuestro script del reproductor, declarando 'pusher-js' como una dependencia.
    wp_enqueue_script( 
        'radiobiz-floating-player-script', 
        plugin_dir_url( __FILE__ ) . 'js/player.js', 
        array( 'pusher-js' ), // <- Asegura que Pusher se cargue ANTES que nuestro script.
        '2.9', // Versión del plugin actualizada.
        true // Cargar en el footer.
    );
}
add_action( 'wp_enqueue_scripts', 'radiobiz_floating_player_enqueue_scripts' );

function radiobiz_floating_player_add_to_footer() {
    $options = get_option( 'radiobiz_player_options' );
    $player_width = !empty($options['player_width']) ? $options['player_width'] : '320';
    $button_color = !empty($options['button_color']) ? $options['button_color'] : '#ff007a';
    $initial_top = !empty($options['initial_top']) ? $options['initial_top'] . 'px' : 'auto';
    $initial_left = !empty($options['initial_left']) ? $options['initial_left'] . 'px' : 'auto';
    $start_collapsed = isset($options['start_collapsed_mobile']) && $options['start_collapsed_mobile'] === 'on';

    // La etiqueta de script de Pusher ha sido eliminada de aquí para cumplir con las normas.
    echo '<!-- WordPress RadioBiz Player -->
    <radio-player 
        player-width="' . esc_attr($player_width) . '" 
        button-color="' . esc_attr($button_color) . '" 
        initial-top="' . esc_attr($initial_top) . '" 
        initial-left="' . esc_attr($initial_left) . '"
        start-collapsed-mobile="' . ( $start_collapsed ? 'true' : 'false' ) . '" >
    </radio-player>';
}
add_action( 'wp_footer', 'radiobiz_floating_player_add_to_footer' );
