class ShootingStar {
    constructor(gl, program) {
        const trailLength = 32.0;
        const trailWidth = 2.4;

        const vertices = [
            // Position            // Color (more subtle colors)          // UV    // Normal   // Material
            0, 0, 0, 0.8, 0.4, 0.8, 0.7, 0, 0, 0, 1, 0, 0,  // Front point
            -trailLength, -trailWidth / 2, 0, 0.2, 0.6, 0.8, 0.0, 1, 0, 0, 1, 0, 0,  // Back left
            -trailLength, trailWidth / 2, 0, 0.6, 0.2, 0.8, 0.0, 1, 1, 0, 1, 0, 0   // Back right
        ];

        const indices = [0, 1, 2];

        this.material = new LitMaterial(
            gl,
            'tex/glow.png',
            gl.LINEAR,
            1.0,
            0.5,
            0.0,
            1.0
        );

        this.mesh = new NormalMesh(gl, program, vertices, indices, this.material, true);
        this.node = new Node(this.mesh);

        this.reset({ x: 0, y: 0, z: 0 });
    }

    reset(carPosition = { x: 0, y: 0, z: 0 }) {

        const spawnDistanceAhead = 300;
        const spawnWidth = 200;
        const spawnHeight = 120;
        const spawnDepthVariation = 100;

        this.position = {
            x: carPosition.x + (Math.random() - 0.5) * spawnWidth,
            y: carPosition.y + spawnHeight + Math.random() * 40,
            z: carPosition.z + spawnDistanceAhead + Math.random() * spawnDepthVariation
        };


        const speed = 15 + Math.random() * 15;
        this.velocity = {
            x: (carPosition.x - this.position.x) * 0.015,
            y: -speed * 0.4,
            z: -speed
        };


        this.node.position = this.position;

        this.lifespan = 2.5 + Math.random() * 2.5;
        this.age = 0;
        this.active = true;
    }

    update(deltaTime, carPosition) {
        if (!this.active) return;

        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        this.node.position = this.position;
        this.node.rotation.yaw = Math.atan2(this.velocity.x, this.velocity.z);
        this.node.rotation.pitch = Math.atan2(this.velocity.y,
            Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z));

        const fadeInTime = 0.3;
        const fadeOutTime = 0.7;
        let scale = 1.0;

        if (this.age < fadeInTime) {
            scale = this.age / fadeInTime;
        } else if (this.age > this.lifespan - fadeOutTime) {
            scale = (this.lifespan - this.age) / fadeOutTime;
        }

        this.node.scale = { x: scale, y: scale, z: scale };

        this.age += deltaTime;


        if (this.age > this.lifespan || this.position.z < carPosition.z - 50) {
            this.reset(carPosition);
        }
    }
} 