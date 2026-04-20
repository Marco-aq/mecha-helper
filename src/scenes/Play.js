import * as Phaser from 'phaser';
import Drone from '../entities/Drone.js';

export default class Play extends Phaser.Scene {
    constructor() {
        super('Play');
    }

    create() {
        this.score = 0;
        this.caos = 0;
        this.isGameOver = false;

        this.add.image(400, 300, 'fondo').setDisplaySize(800, 600).setDepth(0);

        this.platforms = this.physics.add.staticGroup();
        this.platforms.add(this.add.rectangle(400, 580, 800, 40).setAlpha(0)); 

        this.player = new Drone(this, 400, 500);
        this.physics.add.collider(this.player, this.platforms);

        this.averias = this.physics.add.group({ allowGravity: false });
        this.spawnerEvent = this.time.addEvent({ delay: 3500, callback: this.spawnAveria, callbackScope: this, loop: true });
        this.physics.add.overlap(this.player, this.averias, this.repararAveria, null, this);

        this.crearInterfaz();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-ONE', () => this.player.equip('NONE'));
        this.input.keyboard.on('keydown-TWO', () => this.player.equip('PROPULSOR'));
        this.input.keyboard.on('keydown-THREE', () => this.player.equip('ORUGA'));

        this.redOverlay = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0.3).setDepth(90).setVisible(false);
    }

    crearInterfaz() {
        this.add.rectangle(400, 30, 800, 60, 0x000000, 0.7).setDepth(100);
        this.uiScore = this.add.text(16, 10, `Puntos: 0`, { fontSize: '20px', fill: '#ffffff', fontStyle: 'bold' }).setDepth(101);
        this.add.text(16, 35, '1: Base | 2: Aire | 3: Suelo', { fontSize: '14px', fill: '#f1c40f' }).setDepth(101);

        this.add.text(400, 10, 'PRESIÓN DE LA MÁQUINA:', { fontSize: '14px', fill: '#fff' }).setDepth(101);
        this.caosBg = this.add.rectangle(550, 40, 200, 15, 0x555555).setOrigin(0, 0.5).setDepth(101);
        this.caosBar = this.add.rectangle(450, 40, 0, 15, 0xe74c3c).setOrigin(0, 0.5).setDepth(102);
    }

    spawnAveria() {
        if (this.isGameOver) return;

        const esAerea = Phaser.Math.Between(0, 1) === 1;
        const x = Phaser.Math.Between(100, 700);
        const y = esAerea ? Phaser.Math.Between(150, 350) : 540; 

        const spriteName = esAerea ? 'fuego' : 'averia_suelo';
        const averia = this.physics.add.sprite(x, y, spriteName).setDepth(5);
        if (!esAerea) {
          averia.setCrop(3, 3, averia.width - 6, averia.height - 6);
        }
        averia.body.setAllowGravity(false);
        averia.moduloRequerido = esAerea ? 'PROPULSOR' : 'ORUGA';
        averia.isBeingFixed = false;

        if (esAerea) averia.play('arder');

        this.averias.add(averia);
        averia.setScale(0);
        this.tweens.add({ targets: averia, scale: 1, duration: 400, ease: 'Back.easeOut' });
    }

    repararAveria(player, averia) {
        if (averia.isBeingFixed) return;

        if (player.currentModule === averia.moduloRequerido) {
            averia.isBeingFixed = true;
            this.score += 100;
            this.caos = Math.max(0, this.caos - 15);
            this.uiScore.setText(`Puntos: ${this.score}`);
            this.cameras.main.shake(100, 0.005);
            
            averia.disableBody(true, false); 

            if (averia.moduloRequerido === 'PROPULSOR') {
                this.tweens.add({
                    targets: averia,
                    scale: 0,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => averia.destroy()
                });
            } else {
                averia.setVisible(false);
                try {
                    const chispa = this.add.sprite(averia.x, averia.y, 'chispas').setDepth(11);
                    chispa.play('chispear');
                    this.time.delayedCall(500, () => {
                        if (chispa) chispa.destroy();
                        if (averia) averia.destroy();
                    });
                } catch (error) {
                    averia.destroy();
                }
            }
        } else {
            if (player.isKnockedBack) return; 

            player.isKnockedBack = true;
            player.setTint(0xff0000); 

            const empuje = player.x < averia.x ? -1 : 1;
            player.body.setVelocityX(empuje * 350);
            player.body.setVelocityY(-200);

            this.time.delayedCall(200, () => {
                player.clearTint();
                player.isKnockedBack = false;
            });
        }
    }

    update() {
        if (this.isGameOver) return;

        this.player.update(this.cursors);

        const averiasActivas = this.averias.getChildren().length;
        if (averiasActivas > 0) {
            this.caos += (averiasActivas * 0.05);
        }
        
        this.caosBar.width = (this.caos / 100) * 200;

        if (this.caos > 75) {
            this.redOverlay.setVisible(Math.floor(this.time.now / 200) % 2 === 0);
        } else {
            this.redOverlay.setVisible(false);
        }

        if (this.caos >= 100) {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.physics.pause();
        this.spawnerEvent.remove();
        this.redOverlay.setVisible(false);

        this.player.setTint(0x555555); 
        this.cameras.main.shake(500, 0.02);

        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(200);
        this.add.text(400, 200, '¡NÚCLEO DESTRUIDO!', { fontSize: '48px', fill: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5).setDepth(201);
        this.add.text(400, 270, `Puntuación: ${this.score}`, { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5).setDepth(201);

        const btn = this.add.rectangle(400, 380, 250, 60, 0x3498db).setDepth(201).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => this.scene.restart());
        this.add.text(400, 380, 'VOLVER A JUGAR', { fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(202);
    }
}
