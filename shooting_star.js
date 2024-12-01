class ShootingStar {
    constructor(gl, program) {
        // Increase trail size significantly
        const trailLength = 32.0;  // 4x larger
        const trailWidth = 2.4;    // 4x larger
        
        const vertices = [
            // Position            // Color (more subtle colors)          // UV    // Normal   // Material
            0, 0, 0,              0.8, 0.4, 0.8, 0.7,                    0, 0,    0, 1, 0,    0,  // Front point
            -trailLength, -trailWidth/2, 0,    0.2, 0.6, 0.8, 0.0,      1, 0,    0, 1, 0,    0,  // Back left
            -trailLength, trailWidth/2, 0,     0.6, 0.2, 0.8, 0.0,      1, 1,    0, 1, 0,    0   // Back right
        ];
        
        const indices = [0, 1, 2];
        
        // Restore some material properties for visibility
        this.material = new LitMaterial(
            gl, 
            'tex/glow.png',
            gl.LINEAR,
            1.0,  // Restore ambient for visibility
            0.5,  // Some diffuse for basic lighting
            0.0,  // No specular needed
            1.0   // Shininess doesn't matter
        );
        
        this.mesh = new NormalMesh(gl, program, vertices, indices, this.material, true);
        this.node = new Node(this.mesh);
        
        // Initialize with default position if carPosition is not provided
        this.reset({ x: 0, y: 0, z: 0 });
    }
    
    reset(carPosition = { x: 0, y: 0, z: 0 }) {
        // Calculate spawn position relative to car with increased spread
        const spawnDistanceAhead = 300; // Increased from 200
        const spawnWidth = 200;         // Increased from 100
        const spawnHeight = 120;        // Increased from 80
        const spawnDepthVariation = 100; // New parameter for depth variation
        
        this.position = {
            x: carPosition.x + (Math.random() - 0.5) * spawnWidth,
            y: carPosition.y + spawnHeight + Math.random() * 40,
            z: carPosition.z + spawnDistanceAhead + Math.random() * spawnDepthVariation
        };
        
        // Adjust velocity to always move towards car's path
        const speed = 15 + Math.random() * 15; // Slightly reduced speed range
        this.velocity = {
            x: (carPosition.x - this.position.x) * 0.015, // Reduced curve factor
            y: -speed * 0.4,                              // Downward movement
            z: -speed                                     // Always moving backward relative to car
        };
        
        // Reset node position
        this.node.position = this.position;
        
        // Slightly longer lifespan for wider spread
        this.lifespan = 2.5 + Math.random() * 2.5;
        this.age = 0;
        this.active = true;
    }
    
    update(deltaTime, carPosition) {
        if (!this.active) return;

        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        
        // Update node position and rotation
        this.node.position = this.position;
        this.node.rotation.yaw = Math.atan2(this.velocity.x, this.velocity.z);
        this.node.rotation.pitch = Math.atan2(this.velocity.y, 
            Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z));
        
        // Scale based on age for fade in/out effect
        const fadeInTime = 0.3;
        const fadeOutTime = 0.7;
        let scale = 1.0;
        
        if (this.age < fadeInTime) {
            scale = this.age / fadeInTime;
        } else if (this.age > this.lifespan - fadeOutTime) {
            scale = (this.lifespan - this.age) / fadeOutTime;
        }
        
        this.node.scale = { x: scale, y: scale, z: scale };
        
        // Update age
        this.age += deltaTime;
        
        // Reset if too old or too far behind car
        if (this.age > this.lifespan || this.position.z < carPosition.z - 50) {
            this.reset(carPosition);
        }
    }
} 