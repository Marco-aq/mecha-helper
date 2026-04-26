import * as Phaser from 'phaser';
import Drone from '../entities/Drone.js';

export default class Play extends Phaser.Scene {
    constructor() { super('Play'); }

    create() {
        this.score = 0; this.nivel = 1; this.caos = 0; this.isGameOver = false;
        this.add.image(400, 300, 'fondo').setDisplaySize(800, 600).setDepth(0);
        this.platforms = this.physics.add.staticGroup();
        this.platforms.add(this.add.rectangle(400, 580, 800, 40).setAlpha(0)); 
        
        // Plataformas One-Way Aleatorias
        this.randomPlatforms = [];
        for (let i = 0; i < 4; i++) {
            const rx = Phaser.Math.Between(150, 650);
            const ry = 180 + (i * 100);
            const p = this.add.sprite(rx, ry, 'plataforma_neon').setDepth(2);
            this.platforms.add(p);
            p.body.checkCollision.down = false; p.body.checkCollision.left = false; p.body.checkCollision.right = false;
            this.randomPlatforms.push(p);
        }

        this.player = new Drone(this, 400, 500);
        this.physics.add.collider(this.player, this.platforms);
        this.averias = this.physics.add.group({ allowGravity: false });
        this.spawnDelay = 3500; 
        this.physics.add.overlap(this.player, this.averias, this.repararAveria, null, this);

        this.crearInterfaz();
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-ONE', () => this.player.equip('NONE'));
        this.input.keyboard.on('keydown-TWO', () => this.player.equip('PROPULSOR'));
        this.input.keyboard.on('keydown-THREE', () => this.player.equip('ORUGA'));

        this.darkOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0).setDepth(80);
        this.redOverlay = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0.3).setDepth(90).setVisible(false);

        // --- ESCUDO CONTRA CRASH DE AUDIO ---
        try {
            if (this.cache.audio.exists('sfx_alarma')) this.alarmSound = this.sound.add('sfx_alarma', { loop: true, volume: 0.3 });
            if (this.cache.audio.exists('bgm')) {
                this.bgm = this.sound.add('bgm', { volume: 0.3, loop: true });
                this.bgm.play();
            }
        } catch (e) { console.error("Error cargando audios, el juego seguirá en silencio."); }

        this.programarProximaAveria();
        this.eventoTimer = this.time.addEvent({ delay: 12000, callback: this.lanzarEventoAleatorio, callbackScope: this, loop: true });
    }
crearInterfaz() {
        this.add.rectangle(400, 30, 800, 60, 0x000000, 0.7).setDepth(100);
        this.uiScore = this.add.text(16, 10, `Puntos: 0`, { fontSize: '20px', fill: '#ffffff', fontStyle: 'bold' }).setDepth(101);
        this.add.text(16, 35, '1: Base | 2: Aire | 3: Suelo', { fontSize: '14px', fill: '#f1c40f' }).setDepth(101);
        this.add.text(480, 10, 'PRESIÓN:', { fontSize: '14px', fill: '#fff' }).setDepth(101);
        this.caosBg = this.add.rectangle(550, 40, 200, 15, 0x555555).setOrigin(0, 0.5).setDepth(101);
        this.caosBar = this.add.rectangle(550, 40, 0, 15, 0xe74c3c).setOrigin(0, 0.5).setDepth(102);
    }

    lanzarEventoAleatorio() {
        if (this.isGameOver || this.score < 500) return;
        const r = Phaser.Math.Between(1, 2);
        if (r === 1) {
            this.mostrarTextoFlotante("¡APAGÓN!", '#e74c3c');
            this.tweens.add({ targets: this.darkOverlay, fillAlpha: 0.9, duration: 500 });
            this.time.delayedCall(4000, () => { this.tweens.add({ targets: this.darkOverlay, fillAlpha: 0, duration: 1000 }); });
        } else {
            this.mostrarTextoFlotante("¡SOBRECARGA!", '#f1c40f');
            this.spawnAveria(); this.spawnAveria();
        }
    }

    mostrarTextoFlotante(t, c) {
        const txt = this.add.text(400, 250, t, { fontSize: '32px', fill: c, fontStyle: 'bold' }).setOrigin(0.5).setDepth(200);
        this.tweens.add({ targets: txt, y: 150, alpha: 0, duration: 2500, onComplete: () => txt.destroy() });
    }

    programarProximaAveria() {
        if (this.isGameOver) return;
        this.spawnerEvent = this.time.delayedCall(this.spawnDelay, () => {
            this.spawnAveria();
            this.spawnDelay = Math.max(800, this.spawnDelay - 100); 
            this.programarProximaAveria(); 
        });
    }

    spawnAveria() {
        if (this.isGameOver) return;
        const esA = Phaser.Math.Between(0, 1) === 1;
        let x, y;
        if (esA) { const p = Phaser.Utils.Array.GetRandom(this.randomPlatforms); x = p.x; y = p.y - 45; }
        else { x = Phaser.Math.Between(50, 750); y = 540; }
        const averia = this.physics.add.sprite(x, y, esA ? 'fuego' : 'averia_suelo').setDepth(5);
        averia.body.setAllowGravity(false);
        averia.moduloRequerido = esA ? 'PROPULSOR' : 'ORUGA';
        averia.isBeingFixed = false;
        if (!esA) averia.setCrop(3, 3, averia.width - 6, averia.height - 6);
        if (esA) averia.play('arder');
        this.averias.add(averia);
        averia.setScale(0);
        this.tweens.add({ targets: averia, scale: 1, duration: 400, ease: 'Back.easeOut' });
    }

    repararAveria(player, averia) {
        if (averia.isBeingFixed) return;
        if (player.currentModule === averia.moduloRequerido) {
            averia.isBeingFixed = true; this.score += 100; this.caos = Math.max(0, this.caos - 15);
            this.uiScore.setText(`Puntos: ${this.score}`); this.cameras.main.shake(100, 0.005);
            if (this.cache.audio.exists('sfx_exito')) this.sound.play('sfx_exito', { volume: 0.6 });
            averia.disableBody(true, false); 
            if (averia.moduloRequerido === 'PROPULSOR') {
                this.tweens.add({ targets: averia, scale: 0, alpha: 0, duration: 300, onComplete: () => averia.destroy() });
            } else {
                averia.setVisible(false);
                const c = this.add.sprite(averia.x, averia.y, 'chispas').setDepth(11);
                try { c.play('chispear'); } catch(e){}
                this.time.delayedCall(500, () => { c.destroy(); averia.destroy(); });
            }
        } else {
            if (player.isKnockedBack) return; 
            player.isKnockedBack = true; player.setTint(0xff0000); this.cameras.main.shake(250, 0.015); 
            const emp = player.x < averia.x ? -1 : 1;
            player.body.setVelocityX(emp * 350); player.body.setVelocityY(-200);
            this.time.delayedCall(200, () => { player.clearTint(); player.isKnockedBack = false; });
        }
    }

    update() {
        if (this.isGameOver) return;
        if (this.bgm && !this.bgm.isPlaying) this.bgm.play();
        this.player.update(this.cursors);
        const aCount = this.averias.getChildren().length;
        if (aCount > 0) this.caos += (aCount * 0.05);
        this.caosBar.width = (this.caos / 100) * 200;
        if (this.caos > 75) {
            this.redOverlay.setVisible(Math.floor(this.time.now / 200) % 2 === 0);
            if (this.alarmSound && !this.alarmSound.isPlaying) this.alarmSound.play(); 
        } else {
            this.redOverlay.setVisible(false);
            if (this.alarmSound && this.alarmSound.isPlaying) this.alarmSound.stop(); 
        }
        if (this.caos >= 100) this.triggerGameOver();
    }

    triggerGameOver() {
        this.isGameOver = true; this.physics.pause(); this.sound.stopAll();
        this.player.setTint(0x555555); this.cameras.main.shake(500, 0.02);
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(200);
        this.add.text(400, 200, '¡NÚCLEO DESTRUIDO!', { fontSize: '48px', fill: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5).setDepth(201);
        const b = this.add.rectangle(400, 380, 250, 60, 0x3498db).setDepth(201).setInteractive({ useHandCursor: true });
        b.on('pointerdown', () => { this.sound.stopAll(); this.scene.start('MainMenu'); });
        this.add.text(400, 380, 'VOLVER AL MENÚ', { fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5).setDepth(202);
    }
}
