import * as Phaser from 'phaser';

export default class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        this.load.image('fondo', 'assets/fondo.jpg');
        this.load.image('dron', 'assets/dron.png');
        this.load.image('propulsor', 'assets/propulsor.png');
        this.load.image('oruga', 'assets/oruga.png');
        this.load.image('averia_suelo', 'assets/averia_suelo.png');

        this.load.spritesheet('fuego', 'assets/fuego_sheet.png', { frameWidth: 67, frameHeight: 80 });
        this.load.spritesheet('fuego_azul', 'assets/jetpack_sheet.png', { frameWidth: 40, frameHeight: 50 });
        this.load.spritesheet('chispas', 'assets/chispas_sheet.png', { frameWidth: 78, frameHeight: 60 });

        this.load.audio('bgm', 'assets/musica.wav'); // O .wav si lo cambiaste
        this.load.audio('sfx_equipar', 'assets/equipar.wav');
        this.load.audio('sfx_exito', 'assets/exito.wav');
        this.load.audio('sfx_alarma', 'assets/alarma.wav');
    }

    create() {
        this.anims.create({ key: 'arder', frames: this.anims.generateFrameNumbers('fuego'), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'volar_azul', frames: this.anims.generateFrameNumbers('fuego_azul'), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'chispear', frames: this.anims.generateFrameNumbers('chispas'), frameRate: 12, repeat: -1 });

        // Generar textura de Humo
        const gfx = this.make.graphics();
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(8, 8, 8);
        gfx.generateTexture('humo', 16, 16);
        gfx.destroy();

        // --- NUEVO: Generar textura de Plataforma Visible ---
        const pGfx = this.make.graphics();
        pGfx.fillStyle(0x2c3e50, 0.9); // Color metal oscuro
        pGfx.fillRect(0, 0, 140, 15);
        pGfx.lineStyle(2, 0x00ffff, 1); // Borde de neón cyan
        pGfx.strokeRect(0, 0, 140, 15);
        pGfx.generateTexture('plataforma_neon', 140, 15);
        pGfx.destroy();

        this.scene.start('MainMenu');
    }
}
