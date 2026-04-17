import * as Phaser from 'phaser';

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.MODULES = { NONE: 'Ninguno', PROPULSOR: 'Propulsor', ORUGA: 'Oruga' };
    }

    create() {
        // --- INICIALIZACIÓN DE VARIABLES (Importante para el reinicio) ---
        this.currentModule = this.MODULES.NONE;
        this.score = 0;
        this.currentPressure = 0;
        this.maxPressure = 100;
        this.isGameOver = false;

        this.cameras.main.setBackgroundColor('#2c3e50');

        // --- ENTORNO ---
        this.platforms = this.physics.add.staticGroup();
        this.platforms.add(this.add.rectangle(400, 580, 800, 40, 0x7f8c8d)); 
        this.platforms.add(this.add.rectangle(150, 400, 200, 20, 0x7f8c8d)); 
        this.platforms.add(this.add.rectangle(650, 280, 200, 20, 0x7f8c8d)); 
        this.platforms.add(this.add.rectangle(400, 150, 150, 20, 0x7f8c8d)); 

        // --- JUGADOR ---
        this.player = this.physics.add.existing(this.add.rectangle(400, 500, 32, 32, 0xe74c3c));
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setBounce(0.1);
        this.player.currentColor = 0xe74c3c;
        this.physics.add.collider(this.player, this.platforms);

        // --- ENEMIGOS (Averías) ---
        this.averias = this.physics.add.group({ allowGravity: false });
        
        this.spawnerEvent = this.time.addEvent({
            delay: 3000,
            callback: this.spawnAveria,
            callbackScope: this,
            loop: true
        });

        this.physics.add.overlap(this.player, this.averias, this.repararAveria, null, this);

        // --- CONTROLES ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

        // --- INTERFAZ (UI) ---
        this.uiText = this.add.text(16, 16, '', { fontSize: '20px', fill: '#ffffff', fontStyle: 'bold' });
        this.add.text(16, 45, '1: Base | 2: Propulsor (Naranja) | 3: Oruga (Morado)', { fontSize: '14px', fill: '#f1c40f' });
        this.updateUI();

        // Crear Barra de Presión
        this.add.text(500, 16, 'PRESIÓN DEL NÚCLEO', { fontSize: '16px', fill: '#ffffff', fontStyle: 'bold' });
        this.pressureBarBg = this.add.rectangle(650, 45, 200, 20, 0x000000).setStrokeStyle(2, 0xffffff); // Borde
        this.pressureBarFill = this.add.rectangle(550, 45, 0, 20, 0x2ecc71).setOrigin(0, 0.5); // Relleno (empieza en 0)

        // Efecto de Alarma visual (Pantalla roja intermitente)
        this.alarmOverlay = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0.2);
        this.alarmOverlay.setVisible(false);
        this.alarmTween = this.tweens.add({
            targets: this.alarmOverlay,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1,
            paused: true
        });
    }

    // --- LÓGICA DE UI Y PRESIÓN ---
    updateUI() {
        this.uiText.setText(`Módulo: ${this.currentModule} | Puntos: ${this.score}`);
    }

    updatePressureBar() {
        // Calcula el porcentaje
        let percentage = this.currentPressure / this.maxPressure;
        
        // Actualiza el ancho de la barra
        this.pressureBarFill.width = 200 * percentage;

        // Cambia el color de la barra según la presión
        if (percentage < 0.5) this.pressureBarFill.fillColor = 0x2ecc71; // Verde
        else if (percentage < 0.75) this.pressureBarFill.fillColor = 0xf1c40f; // Amarillo
        else this.pressureBarFill.fillColor = 0xe74c3c; // Rojo

        // Activar alarma visual si pasa el 75%
        if (percentage >= 0.75 && !this.alarmOverlay.visible) {
            this.alarmOverlay.setVisible(true);
            this.alarmOverlay.setAlpha(0.2);
            this.alarmTween.play();
        } else if (percentage < 0.75 && this.alarmOverlay.visible) {
            this.alarmOverlay.setVisible(false);
            this.alarmTween.pause();
        }
    }

    // --- ACCIONES DE JUEGO ---
    equipModule(moduleName, color) {
        if (this.currentModule !== moduleName && !this.isGameOver) {
            this.currentModule = moduleName;
            this.player.currentColor = color;
            this.player.fillColor = color;
            this.updateUI();
            this.player.body.setVelocityY(-150); 
        }
    }

    spawnAveria() {
        if (this.isGameOver) return;

        const esAerea = Phaser.Math.Between(0, 1) === 1;
        const x = Phaser.Math.Between(50, 750);
        const y = esAerea ? Phaser.Math.Between(100, 350) : 540; 
        
        const color = esAerea ? 0xe67e22 : 0x8e44ad; 
        const moduloRequerido = esAerea ? this.MODULES.PROPULSOR : this.MODULES.ORUGA;

        const averia = this.add.rectangle(x, y, 40, 40, color);
        this.physics.add.existing(averia);
        averia.body.setAllowGravity(false);
        averia.moduloRequerido = moduloRequerido;
        averia.isBeingFixed = false; 

        this.averias.add(averia);

        averia.setScale(0);
        this.tweens.add({ targets: averia, scale: 1, duration: 500, ease: 'Back.easeOut' });
        this.tweens.add({ targets: averia, alpha: 0.6, duration: 300, yoyo: true, repeat: -1 });
    }

    repararAveria(player, averia) {
        if (averia.isBeingFixed || this.isGameOver) return; 

        if (this.currentModule === averia.moduloRequerido) {
            averia.isBeingFixed = true;
            this.score += 100;
            
            // REDUCIR PRESIÓN COMO RECOMPENSA (Evita que baje de 0)
            this.currentPressure = Math.max(0, this.currentPressure - 15);
            
            this.updateUI();
            this.updatePressureBar();

            this.cameras.main.shake(100, 0.005);
            this.crearTextoFlotante(averia.x, averia.y - 20, "+100 (Presión baja)", '#2ecc71');

            this.tweens.add({
                targets: averia, scale: 0, angle: 180, duration: 250,
                onComplete: () => averia.destroy() 
            });

        } else {
            if (player.isKnockedBack) return; 
            player.isKnockedBack = true;
            player.fillColor = 0xffffff; 
            this.crearTextoFlotante(averia.x, averia.y - 20, "¡Módulo Error!", '#e74c3c');

            const direccionEmpuje = player.x < averia.x ? -1 : 1;
            player.body.setVelocityX(direccionEmpuje * 350);
            player.body.setVelocityY(-200);

            this.time.delayedCall(200, () => {
                player.fillColor = player.currentColor;
                player.isKnockedBack = false;
            });
        }
    }

    crearTextoFlotante(x, y, mensaje, colorHex) {
        const txt = this.add.text(x, y, mensaje, { fontSize: '18px', fill: colorHex, fontStyle: 'bold' }).setOrigin(0.5);
        this.tweens.add({
            targets: txt, y: y - 50, alpha: 0, duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    // --- GAME OVER ---
    triggerGameOver() {
        this.isGameOver = true;
        
        // Detener físicas y spawner
        this.physics.pause();
        this.spawnerEvent.remove();
        
        // CORRECCIÓN AQUÍ: Usamos fillColor en lugar de setTint para los rectángulos
        this.player.fillColor = 0x555555; // Oscurece al jugador (Gris)
        
        this.alarmOverlay.setVisible(false); // Quitar alarma

        // Explosión de cámara
        this.cameras.main.shake(500, 0.03);
        
        // Fondo semi-transparente para la UI final
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

        // Textos
        this.add.text(400, 200, '¡NÚCLEO DESTRUIDO!', { fontSize: '48px', fill: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 270, `Puntuación Final: ${this.score}`, { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);

        // Botón de Volver a Jugar
        const restartBtn = this.add.rectangle(400, 380, 250, 60, 0x3498db)
            .setInteractive({ useHandCursor: true }) // Añade el cursor de manito
            .on('pointerdown', () => this.scene.restart()) // REINICIO RÁPIDO
            .on('pointerover', () => restartBtn.fillColor = 0x2980b9) // Hover
            .on('pointerout', () => restartBtn.fillColor = 0x3498db); // Quitar Hover

        this.add.text(400, 380, 'VOLVER A JUGAR', { fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    }

    // --- UPDATE LOOP ---
    update() {
        if (this.isGameOver) return; // Si es Game Over, no ejecutar nada de abajo

        // 1. GESTIONAR PRESIÓN
        const averiasActivas = this.averias.getChildren().length;
        // Por cada avería en pantalla, la presión sube 0.03 por frame
        this.currentPressure += averiasActivas * 0.03; 
        
        if (this.currentPressure >= this.maxPressure) {
            this.currentPressure = this.maxPressure;
            this.triggerGameOver();
        }
        this.updatePressureBar();

        // 2. CONTROLES Y MOVIMIENTO
        const body = this.player.body;

        if (Phaser.Input.Keyboard.JustDown(this.key1)) this.equipModule(this.MODULES.NONE, 0xe74c3c);
        if (Phaser.Input.Keyboard.JustDown(this.key2)) this.equipModule(this.MODULES.PROPULSOR, 0x3498db);
        if (Phaser.Input.Keyboard.JustDown(this.key3)) this.equipModule(this.MODULES.ORUGA, 0x2ecc71);

        if (!this.player.isKnockedBack) {
            let speed = this.currentModule === this.MODULES.ORUGA ? 450 : 200;
            if (this.cursors.left.isDown) body.setVelocityX(-speed);
            else if (this.cursors.right.isDown) body.setVelocityX(speed);
            else body.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            if (body.blocked.down) {
                let jumpPower = this.currentModule === this.MODULES.ORUGA ? -300 : -450;
                body.setVelocityY(jumpPower);
            } else if (this.currentModule === this.MODULES.PROPULSOR) {
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
    backgroundColor: '#1a1a1a',
    physics: { default: 'arcade', arcade: { gravity: { y: 800 }, debug: false } },
    scene: MainScene
};

new Phaser.Game(config);
