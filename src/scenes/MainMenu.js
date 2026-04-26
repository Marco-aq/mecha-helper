import * as Phaser from 'phaser';

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        // Fondo oscuro
        this.add.image(400, 300, 'fondo').setDisplaySize(800, 600).setTint(0x555555);

        // Título del juego
        this.add.text(400, 100, 'NÚCLEO EN PELIGRO', { 
            fontSize: '54px', fill: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 
        }).setOrigin(0.5);

        // Caja de Tutorial
        this.add.rectangle(400, 320, 600, 280, 0x000000, 0.7);
        this.add.text(400, 210, 'CÓMO JUGAR', { fontSize: '28px', fill: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
        
        const tutorialText = 
            "La máquina está fallando. ¡Evita que la presión llegue al 100%!\n\n" +
            "▶ FLECHAS: Moverse y Saltar\n" +
            "▶ TECLA 1: Módulo Base (Normal)\n" +
            "▶ TECLA 2: Propulsor -> Manten [ARRIBA] para volar y apagar fuegos.\n" +
            "▶ TECLA 3: Oruga -> Vas rápido en el piso, repara engranajes.";

        this.add.text(400, 320, tutorialText, { 
            fontSize: '18px', fill: '#ffffff', align: 'center', wordWrap: { width: 550 }, lineSpacing: 10 
        }).setOrigin(0.5);

        // Botón de Jugar
        const btnJugar = this.add.rectangle(400, 500, 250, 60, 0x3498db)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('Play')) // Va al juego
            .on('pointerover', () => btnJugar.fillColor = 0x2980b9)
            .on('pointerout', () => btnJugar.fillColor = 0x3498db);

        this.add.text(400, 500, 'INICIAR JUEGO', { fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    }
}
