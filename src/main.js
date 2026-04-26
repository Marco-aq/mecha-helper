import * as Phaser from 'phaser';
import Preloader from './scenes/Preloader.js';
import MainMenu from './scenes/MainMenu.js';
import Play from './scenes/Play.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false // Ponlo en true solo si necesitas ver las hitboxes
        }
    },
    // Añadimos las dos escenas (Arranca por Preloader y luego pasa a Play)
    scene: [Preloader, MainMenu, Play]
};

new Phaser.Game(config);
