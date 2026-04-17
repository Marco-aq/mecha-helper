import * as Phaser from 'phaser';

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        // 1. Definimos los estados de los módulos
        this.MODULES = {
            NONE: 'Ninguno (Base)',
            PROPULSOR: 'Propulsor (Vuelo)',
            ORUGA: 'Oruga (Velocidad)'
        };
        this.currentModule = this.MODULES.NONE; // Empiezas sin módulos
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c3e50');

        // Suelo
        this.platforms = this.physics.add.staticGroup();
        const ground = this.add.rectangle(400, 580, 800, 40, 0x7f8c8d);
        this.platforms.add(ground);

        // Jugador (Empieza Rojo)
        const playerRect = this.add.rectangle(100, 450, 32, 32, 0xe74c3c);
        this.player = this.physics.add.existing(playerRect);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setBounce(0.1);

        this.physics.add.collider(this.player, this.platforms);

        // Controles de movimiento
        this.cursors = this.input.keyboard.createCursorKeys();

        // 2. Teclas para cambiar módulos (1, 2 y 3)
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

        // 3. UI: Texto en pantalla para saber qué tienes equipado
        this.uiText = this.add.text(16, 16, `Módulo actual: ${this.currentModule}`, { 
            fontSize: '22px', 
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        
        this.add.text(16, 50, 'Presiona 1 (Base), 2 (Propulsor) o 3 (Oruga)', { 
            fontSize: '16px', 
            fill: '#f1c40f' 
        });
    }

    // Función para equipar un módulo y cambiar el color del jugador
    equipModule(moduleName, color) {
        if (this.currentModule !== moduleName) {
            this.currentModule = moduleName;
            this.player.fillColor = color; // Cambia el color del cuadrado
            this.uiText.setText(`Módulo actual: ${this.currentModule}`);
            
            // "Juiciness": Un pequeño saltito visual al cambiar de pieza
            this.player.body.setVelocityY(-150);
        }
    }

    update() {
        const body = this.player.body;

        // --- SISTEMA DE CAMBIO DE MÓDULOS ---
        if (Phaser.Input.Keyboard.JustDown(this.key1)) {
            this.equipModule(this.MODULES.NONE, 0xe74c3c); // Rojo
        } else if (Phaser.Input.Keyboard.JustDown(this.key2)) {
            this.equipModule(this.MODULES.PROPULSOR, 0x3498db); // Azul
        } else if (Phaser.Input.Keyboard.JustDown(this.key3)) {
            this.equipModule(this.MODULES.ORUGA, 0x2ecc71); // Verde
        }

        // --- LÓGICA DE MOVIMIENTO HORIZONTAL ---
        let speed = 200; // Velocidad base
        if (this.currentModule === this.MODULES.ORUGA) {
            speed = 450; // La Oruga va mucho más rápido
        }

        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
        } else {
            body.setVelocityX(0);
        }

        // --- LÓGICA DE SALTO Y VUELO ---
        if (this.cursors.up.isDown) {
            if (body.blocked.down) {
                // 1. Salto desde el suelo
                let jumpPower = -450; 
                if (this.currentModule === this.MODULES.ORUGA) {
                    jumpPower = -300; // La oruga es pesada, salta muy poco
                }
                body.setVelocityY(jumpPower);
            } 
            else if (this.currentModule === this.MODULES.PROPULSOR) {
                // 2. Jetpack: Si está en el aire y tiene propulsor
                // Mantenemos una velocidad negativa suave para flotar
                body.setVelocityY(-150); 
            }
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
            debug: true // Líneas moradas activadas para ver hitbox
        }
    },
    scene: MainScene
};

new Phaser.Game(config);
