import * as Phaser from 'phaser';

export default class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Carga visual base
        this.load.image('fondo', 'assets/fondo.jpg');
        this.load.image('dron', 'assets/dron.png');
        this.load.image('propulsor', 'assets/propulsor.png');
        this.load.image('oruga', 'assets/oruga.png');
        this.load.image('averia_suelo', 'assets/averia_suelo.png');

        // Spritesheets base (con tamaño seguro para que no crashee)
        this.load.spritesheet('fuego', 'assets/fuego_sheet.png', { frameWidth: 67, frameHeight: 80 });
        this.load.spritesheet('fuego_azul', 'assets/jetpack_sheet.png', { frameWidth: 40, frameHeight: 50 });
        this.load.spritesheet('chispas', 'assets/chispas_sheet.png', { frameWidth: 78, frameHeight: 60 });
    }

    create() {
        // Crear las animaciones
        this.anims.create({ key: 'arder', frames: this.anims.generateFrameNumbers('fuego'), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'volar_azul', frames: this.anims.generateFrameNumbers('fuego_azul'), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'chispear', frames: this.anims.generateFrameNumbers('chispas'), frameRate: 12, repeat: -1 });

        // Iniciar el juego
        this.scene.start('Play');
    }
}
