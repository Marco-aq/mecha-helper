import * as Phaser from 'phaser';

export default class Drone extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'dron');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Ajustes visuales del Dron
        this.setDepth(10); // Siempre al frente
        this.setScale(0.8); // Lo hacemos un poco más pequeño
        this.setCrop(3, 3, this.width - 6, this.height - 6);
        this.body.setSize(48, 48); // Ajustamos la colisión para ignorar el borde cuadrado de la imagen
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0.1);

        this.currentModule = 'NONE';
        this.isKnockedBack = false;

        // Sub-Sprites (Los módulos que acompañan al dron)
        this.moduleSprite = scene.add.sprite(x, y, 'propulsor').setVisible(false).setDepth(9); // Detrás del dron
        this.fireSprite = scene.add.sprite(x, y, 'fuego_azul').setVisible(false).setDepth(8); // Detrás del propulsor
        this.fireSprite.setFlipY(true);
        this.fireSprite.play('volar_azul');
    }

    equip(moduleName) {
        if (this.currentModule === moduleName) return;
        this.currentModule = moduleName;
        
        // Saltito de Game Feel
        this.body.setVelocityY(-150);

        if (moduleName === 'NONE') {
            this.moduleSprite.setVisible(false);
        } else if (moduleName === 'PROPULSOR') {
            this.moduleSprite.setTexture('propulsor');
            this.moduleSprite.setCrop(2, 2, this.moduleSprite.width - 4, this.moduleSprite.height - 4);
            this.moduleSprite.setVisible(true);
            this.moduleSprite.setScale(0.7); // Ajustamos el tamaño del propulsor
        } else if (moduleName === 'ORUGA') {
            this.moduleSprite.setTexture('oruga');
            this.moduleSprite.setCrop(2, 2, this.moduleSprite.width - 4, this.moduleSprite.height - 4);
            this.moduleSprite.setVisible(true);
            this.moduleSprite.setScale(0.7); // Ajustamos la oruga 
        }
    }

    update(cursors) {
        if (this.isKnockedBack) return;

        // Acomodar los módulos para que sigan al dron
        this.moduleSprite.x = this.x;
        // Si es oruga, va abajo. Si es propulsor, va en el centro
        this.moduleSprite.y = this.currentModule === 'ORUGA' ? this.y + 20 : this.y;

        this.fireSprite.x = this.x;
        this.fireSprite.y = this.y + 40; // El fuego sale por debajo
        this.fireSprite.setVisible(false); // Apagado por defecto

        // Velocidad según módulo
        let speed = this.currentModule === 'ORUGA' ? 350 : 200;

        // Movimiento Horizontal
        if (cursors.left.isDown) {
            this.body.setVelocityX(-speed);
            this.setFlipX(true);
            this.moduleSprite.setFlipX(true);
        } else if (cursors.right.isDown) {
            this.body.setVelocityX(speed);
            this.setFlipX(false);
            this.moduleSprite.setFlipX(false);
        } else {
            this.body.setVelocityX(0);
        }

        // Vuelo y Salto
        if (cursors.up.isDown) {
            if (this.body.blocked.down) {
                let jumpPower = this.currentModule === 'ORUGA' ? -300 : -450;
                this.body.setVelocityY(jumpPower);
            } else if (this.currentModule === 'PROPULSOR') {
                this.body.setVelocityY(-150);
                this.fireSprite.setVisible(true); // Encendemos el fuego
            }
        }
    }
}
