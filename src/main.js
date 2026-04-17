import * as Phaser from 'phaser';

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.MODULES = {
            NONE: 'Ninguno',
            PROPULSOR: 'Propulsor (Vuelo)',
            ORUGA: 'Oruga (Suelo)'
        };
        this.currentModule = this.MODULES.NONE;
        this.score = 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c3e50');

        // --- 1. ENTORNO (Suelo y Plataformas flotantes) ---
        this.platforms = this.physics.add.staticGroup();
        this.platforms.add(this.add.rectangle(400, 580, 800, 40, 0x7f8c8d)); // Suelo
        // Añadimos plataformas flotantes para usar el propulsor
        this.platforms.add(this.add.rectangle(150, 400, 200, 20, 0x7f8c8d)); 
        this.platforms.add(this.add.rectangle(650, 280, 200, 20, 0x7f8c8d)); 
        this.platforms.add(this.add.rectangle(400, 150, 150, 20, 0x7f8c8d)); 

        // --- 2. JUGADOR ---
        this.player = this.physics.add.existing(this.add.rectangle(400, 500, 32, 32, 0xe74c3c));
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setBounce(0.1);
        this.player.currentColor = 0xe74c3c; // Guardamos su color actual

        this.physics.add.collider(this.player, this.platforms);

        // --- 3. ENEMIGOS (Averías de la máquina) ---
        // Usamos un grupo sin gravedad, para que las averías se queden flotando en su lugar
        this.averias = this.physics.add.group({ allowGravity: false });

        // Evento: Spawnea una avería cada 3 segundos
        this.time.addEvent({
            delay: 3000,
            callback: this.spawnAveria,
            callbackScope: this,
            loop: true
        });

        // Colisión: Detecta cuando el jugador TOCA (overlap) una avería
        this.physics.add.overlap(this.player, this.averias, this.repararAveria, null, this);

        // --- 4. CONTROLES Y UI ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

        this.uiText = this.add.text(16, 16, `Módulo: ${this.currentModule} | Puntos: ${this.score}`, { 
            fontSize: '20px', fill: '#ffffff', fontStyle: 'bold'
        });
        this.add.text(16, 45, '1: Base | 2: Propulsor (Usa Fuego) | 3: Oruga (Usa Engranajes)', { 
            fontSize: '14px', fill: '#f1c40f' 
        });
    }

    // Lógica para equipar módulos
    equipModule(moduleName, color) {
        if (this.currentModule !== moduleName) {
            this.currentModule = moduleName;
            this.player.currentColor = color;
            this.player.fillColor = color;
            this.updateUI();
            this.player.body.setVelocityY(-150); // Saltito de Game Feel
        }
    }

    updateUI() {
        this.uiText.setText(`Módulo: ${this.currentModule} | Puntos: ${this.score}`);
    }

    // --- CREADOR DE AVERÍAS (SPAWNER) ---
    spawnAveria() {
        // Decide aleatoriamente si es una falla en el aire o en el suelo
        const esAerea = Phaser.Math.Between(0, 1) === 1;
        
        const x = Phaser.Math.Between(50, 750);
        // Si es aérea, aparece alto. Si es de suelo, aparece abajo.
        const y = esAerea ? Phaser.Math.Between(100, 350) : 540; 
        
        // Fuego Naranja (Aire) requiere Propulsor. Engranaje Morado (Suelo) requiere Oruga.
        const color = esAerea ? 0xe67e22 : 0x8e44ad; 
        const moduloRequerido = esAerea ? this.MODULES.PROPULSOR : this.MODULES.ORUGA;

        const averia = this.add.rectangle(x, y, 40, 40, color);
        this.physics.add.existing(averia);
        averia.body.setAllowGravity(false); // Flota
        
        // Le inyectamos variables personalizadas para la lógica de colisión
        averia.moduloRequerido = moduloRequerido;
        averia.isBeingFixed = false; 

        this.averias.add(averia);

        // JUICINESS: Animación de aparición (Escala de 0 a 1)
        averia.setScale(0);
        this.tweens.add({
            targets: averia,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut' // Hace un pequeño rebote al final
        });

        // JUICINESS: Animación de "Peligro" (Parpadeo)
        this.tweens.add({
            targets: averia,
            alpha: 0.6,
            duration: 300,
            yoyo: true,
            repeat: -1
        });
    }

    // --- LÓGICA DE COLISIÓN (REPARACIÓN) ---
    repararAveria(player, averia) {
        if (averia.isBeingFixed) return; // Evita que el código corra dos veces por error

        if (this.currentModule === averia.moduloRequerido) {
            // ¡ÉXITO!
            averia.isBeingFixed = true;
            this.score += 100;
            this.updateUI();

            // JUICINESS: Temblor de cámara sutil
            this.cameras.main.shake(100, 0.005);
            this.crearTextoFlotante(averia.x, averia.y - 20, "+100", '#2ecc71');

            // JUICINESS: Animación de desaparición (Gira y se encoge)
            this.tweens.add({
                targets: averia,
                scale: 0,
                angle: 180, // Gira media vuelta
                duration: 250,
                onComplete: () => averia.destroy() // Se elimina al terminar
            });

        } else {
            // ¡FRACASO! (Módulo incorrecto)
            // Si el jugador ya está sufriendo knockback, no hacer nada
            if (player.isKnockedBack) return; 

            player.isKnockedBack = true;
            player.fillColor = 0xffffff; // Destello blanco de daño
            this.crearTextoFlotante(averia.x, averia.y - 20, "¡Módulo Error!", '#e74c3c');

            // Empuje hacia atrás (Knockback) dependiendo de qué lado chocó
            const direccionEmpuje = player.x < averia.x ? -1 : 1;
            player.body.setVelocityX(direccionEmpuje * 350);
            player.body.setVelocityY(-200);

            // Devolverle su color normal después de 200 milisegundos
            this.time.delayedCall(200, () => {
                player.fillColor = player.currentColor;
                player.isKnockedBack = false;
            });
        }
    }

    // Utilidad: Crea un texto que flota hacia arriba y desaparece
    crearTextoFlotante(x, y, mensaje, colorHex) {
        const txt = this.add.text(x, y, mensaje, { fontSize: '18px', fill: colorHex, fontStyle: 'bold' }).setOrigin(0.5);
        this.tweens.add({
            targets: txt,
            y: y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    update() {
        const body = this.player.body;

        // Cambio de módulos
        if (Phaser.Input.Keyboard.JustDown(this.key1)) this.equipModule(this.MODULES.NONE, 0xe74c3c);
        if (Phaser.Input.Keyboard.JustDown(this.key2)) this.equipModule(this.MODULES.PROPULSOR, 0x3498db);
        if (Phaser.Input.Keyboard.JustDown(this.key3)) this.equipModule(this.MODULES.ORUGA, 0x2ecc71);

        // Movimiento (Evitamos que el jugador cambie de dirección SI está sufriendo knockback)
        if (!this.player.isKnockedBack) {
            let speed = this.currentModule === this.MODULES.ORUGA ? 450 : 200;

            if (this.cursors.left.isDown) body.setVelocityX(-speed);
            else if (this.cursors.right.isDown) body.setVelocityX(speed);
            else body.setVelocityX(0);
        }

        // Saltos y Vuelo
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
    backgroundColor: '#1a1a1a', // Fondo un poco más oscuro
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false // Apagamos el debug para que se vea más limpio el juego
        }
    },
    scene: MainScene
};

new Phaser.Game(config);
