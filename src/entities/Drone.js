import * as Phaser from 'phaser';

export default class Drone extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'dron');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(10); 
        this.setScale(0.8); 
        
        // --- RECUPERADO: RECORTE DE BORDES DEL DRON ---
        this.setCrop(3, 3, this.width - 6, this.height - 6);
        
        this.body.setSize(48, 48); 
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0.1);

        this.currentModule = 'NONE';
        this.isKnockedBack = false;

        this.moduleSprite = scene.add.sprite(x, y, 'propulsor').setVisible(false).setDepth(9); 
        this.fireSprite = scene.add.sprite(x, y, 'fuego_azul').setVisible(false).setDepth(8); 
        this.fireSprite.setFlipY(true); 
        
        try { this.fireSprite.play('volar_azul'); } catch(e) {}

        // --- SISTEMA DE PARTÍCULAS (HUMO MEJORADO) ---
        this.smokeEmitter = scene.add.particles(0, 0, 'humo', {
            speed: { min: 40, max: 100 },
            angle: { min: 80, max: 100 },
            scale: { start: 0.5, end: 1.5 }, // El humo se expande al subir
            alpha: { start: 0.4, end: 0 },   // Se desvanece
            lifespan: 600,
            tint: 0xcccccc, // Color grisáceo
            emitting: false 
        }).setDepth(7);
    }

    equip(moduleName) {
        if (this.currentModule === moduleName) return;
        this.currentModule = moduleName;
        
        this.body.setVelocityY(-150);

        if (moduleName === 'NONE') {
            this.moduleSprite.setVisible(false);
        } else {
            this.moduleSprite.setVisible(true);
            this.moduleSprite.setScale(0.7);
            
            if (moduleName === 'PROPULSOR') {
                this.moduleSprite.setTexture('propulsor');
            } else if (moduleName === 'ORUGA') {
                this.moduleSprite.setTexture('oruga');
            }
            
            // --- RECUPERADO: RECORTE DE BORDES DEL MÓDULO ---
            this.moduleSprite.setCrop(2, 2, this.moduleSprite.width - 4, this.moduleSprite.height - 4);
        }
    }

    update(cursors) {
        if (this.isKnockedBack) return;

        this.moduleSprite.x = this.x;
        let baseModuleY = this.currentModule === 'ORUGA' ? this.y + 20 : this.y;
        this.moduleSprite.y = baseModuleY;

        this.fireSprite.x = this.x;
        this.fireSprite.y = this.y + 35;
        this.fireSprite.setVisible(false);
        
        this.smokeEmitter.setPosition(this.x, this.y + 35);
        this.smokeEmitter.emitting = false;

        let speed = this.currentModule === 'ORUGA' ? 350 : 200;
        let isMovingHorizontally = false;

        if (cursors.left.isDown) {
            this.body.setVelocityX(-speed);
            this.setFlipX(true);
            this.moduleSprite.setFlipX(true);
            isMovingHorizontally = true;
        } else if (cursors.right.isDown) {
            this.body.setVelocityX(speed);
            this.setFlipX(false);
            this.moduleSprite.setFlipX(false);
            isMovingHorizontally = true;
        } else {
            this.body.setVelocityX(0);
        }

        // Animación de traqueteo de oruga
        if (this.currentModule === 'ORUGA' && isMovingHorizontally && this.body.blocked.down) {
            this.moduleSprite.y = baseModuleY + (Math.random() * 4 - 2);
        }

        if (cursors.up.isDown) {
            if (this.body.blocked.down) {
                let jumpPower = this.currentModule === 'ORUGA' ? -300 : -450;
                this.body.setVelocityY(jumpPower);
            } else if (this.currentModule === 'PROPULSOR') {
                this.body.setVelocityY(-150);
                this.fireSprite.setVisible(true); 
                this.smokeEmitter.emitting = true; 
            }
        }
    }
}
