class TerrainGenerator {
    constructor(gl, program, size, resolution, materials) {
        this.gl = gl;
        this.program = program;
        this.size = size;
        this.resolution = resolution;
        this.materials = materials;
        this.noise = noise; // from perlin.js
        this.noise.seed(Math.random());
    }

    generateHeightmap() {
        const heightmap = new Array(this.resolution);
        const scale = 2.5;
        const heightScale = 4.0;

        for (let z = 0; z < this.resolution; z++) {
            heightmap[z] = new Array(this.resolution);
            for (let x = 0; x < this.resolution; x++) {
                // Convert coordinates to noise space
                let nx = x / this.resolution * scale;
                let nz = z / this.resolution * scale;
                
                // Generate height using multiple octaves of noise
                let height = 0;
                height += this.noise.perlin2(nx, nz);
                height += this.noise.perlin2(nx * 2, nz * 2) * 0.5;
                height += this.noise.perlin2(nx * 4, nz * 4) * 0.25;
                
                heightmap[z][x] = height * heightScale;
            }
        }
        return heightmap;
    }

    createTerrainNode() {
        // Generate heightmap
        const heightmap = this.generateHeightmap();
        
        // Find min and max heights for normalization
        let minHeight = Infinity;
        let maxHeight = -Infinity;
        for (let row of heightmap) {
            for (let height of row) {
                minHeight = Math.min(minHeight, height);
                maxHeight = Math.max(maxHeight, height);
            }
        }

        // Create mesh using the heightmap
        const terrainMesh = NormalMesh.from_heightmap(
            this.gl,
            this.program,
            heightmap,
            minHeight,
            maxHeight,
            this.materials[0] // Use first material as default
        );

        // Create and return terrain node
        const terrainNode = new Node(terrainMesh);
        return terrainNode;
    }

    updateTerrain(camPos) {
        // Optional: Implement terrain updating based on camera position
        // This could be used for continuous terrain generation or LOD
    }
}