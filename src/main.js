import * as Phaser from 'phaser';

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        // Fondo azul oscuro para confirmar que la escena carga
        this.cameras.main.setBackgroundColor('#2c3e50');

        // 1. Crear el SUELO (Rectángulo sólido)
        // Creamos un rectángulo simple: x, y, ancho, alto, color
        this.add.rectangle(400, 580, 800, 40, 0x7f8c8d); 
        
        // Pero para las colisiones necesitamos física, así que:
        this.platforms = this.physics.add.staticGroup();
        const ground = this.add.rectangle(400, 580, 800, 40, 0x7f8c8d);
        this.platforms.add(ground); // Añadimos el rectángulo al grupo físico

        // 2. Crear al JUGADOR (Un cuadrado rojo para que resalte)
        const playerRect = this.add.rectangle(100, 450, 32, 32, 0xe74c3c);
        this.player = this.physics.add.existing(playerRect); // Le damos física
        
        // Configuraciones de física del jugador
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setBounce(0.1);

        // 3. Colisión entre jugador y suelo
        this.physics.add.collider(this.player, this.platforms);

        // 4. Controles
        this.cursors = this.input.keyboard.createCursorKeys();

        // Texto de confirmación
        this.add.text(400, 100, '¡SISTEMA OPERATIVO INICIADO!', { 
            fontSize: '24px', 
            fill: '#ffffff' 
        }).setOrigin(0.5);
    }

    update() {
        const body = this.player.body;

        if (this.cursors.left.isDown) {
            body.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(200);
        } else {
            body.setVelocityX(0);
        }

        // Salto: Si presionas arriba Y el jugador está tocando algo abajo
        if (this.cursors.up.isDown && body.blocked.down) {
            body.setVelocityY(-450);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: true // Esto dibujará líneas verdes/moradas para ver los golpes
        }
    },
    scene: MainScene
};

new Phaser.Game(config);
