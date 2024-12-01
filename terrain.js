class TerrainGenerator {
    constructor(gl, program, size, resolution, materials) {
        this.gl = gl;
        this.program = program;
        this.size = size;
        this.resolution = resolution;
        this.materials = materials;
        this.noise = noise;
        this.noise.seed(12345);
        this.roadWidth = 8;
        this.segments = [];
        this.segmentLength = this.size;
        this.heightmapCache = new Map();
    }

    generateHeightmap(offsetZ = 0) {
        const cacheKey = offsetZ.toString();
        if (this.heightmapCache.has(cacheKey)) {
            return this.heightmapCache.get(cacheKey);
        }

        const heightmap = new Array(this.resolution);
        const scale = 6.0;
        const heightScale = 6.0;
        const zScale = 2.5;

        const roadHalfWidth = this.roadWidth / 2;
        const centerLine = Math.floor(this.resolution / 2);

        for (let z = 0; z < this.resolution; z++) {
            heightmap[z] = new Array(this.resolution);
            for (let x = 0; x < this.resolution; x++) {
                const distanceFromCenter = Math.abs(x - centerLine);
                
                if (distanceFromCenter < roadHalfWidth) {
                    heightmap[z][x] = 0;
                    continue;
                }

                const worldX = (x - this.resolution/2) / this.resolution * this.size;
                const worldZ = (z / this.resolution * this.size) + (offsetZ * this.size);
                
                let nx = worldX / (this.size/scale);
                let nz = worldZ / (this.size/scale);
                
                let height = 0;
                height += this.noise.perlin2(nx, nz);
                height += this.noise.perlin2(nx * 2, nz * 2) * 0.5;
                height += this.noise.perlin2(nx * 4, nz * 4) * 0.25;
                height += this.noise.perlin2(nx * 8, nz * 8) * 0.125;
                
                height = Math.abs(height) * 1.5;
                
                const transitionZone = 5;
                if (distanceFromCenter < roadHalfWidth + transitionZone) {
                    const transitionFactor = (distanceFromCenter - roadHalfWidth) / transitionZone;
                    height *= transitionFactor;
                }
                
                heightmap[z][x] = height * heightScale;
            }
        }

        this.heightmapCache.set(cacheKey, heightmap);
        
        if (this.heightmapCache.size > 20) {
            const oldestKey = this.heightmapCache.keys().next().value;
            this.heightmapCache.delete(oldestKey);
        }

        return heightmap;
    }

    createTerrainSegment(offsetZ) {
        const heightmap = this.generateHeightmap(offsetZ);
        const centerLine = Math.floor(this.resolution / 2);
        const roadHalfWidth = this.roadWidth / 2;

        const terrain_node = new Node(NormalMesh.from_heightmap(
            this.gl,
            this.program,
            heightmap,
            -this.size/2,
            this.size/2,
            this.materials,
            heightmap.map((row, z) => row.map((h, x) => {
                const distanceFromCenter = Math.abs(x - centerLine);
                if (distanceFromCenter < roadHalfWidth) {
                    return 0; // Road material (metal)
                }
                return h < 2 ? 0 : h < 6 ? 1 : 2;
            }))
        ));
        
        terrain_node.position = { 
            x: 0, 
            y: -2, 
            z: offsetZ * this.size
        };
        terrain_node.scale = { x: 1, y: 1, z: 1 };
        return terrain_node;
    }

    updateTerrain(camPos) {
        const camSegment = Math.floor(camPos.z / this.size);
        
        const segmentsNeeded = new Set([
            camSegment - 3,
            camSegment - 2,
            camSegment - 1,
            camSegment,
            camSegment + 1,
            camSegment + 2,
            camSegment + 3
        ]);

        this.segments = this.segments.filter(segment => {
            if (!segmentsNeeded.has(segment.segment)) {
                segment.node.parent?.removeChild(segment.node);
                return false;
            }
            return true;
        });

        segmentsNeeded.forEach(segmentIndex => {
            if (!this.segments.some(s => s.segment === segmentIndex)) {
                const node = this.createTerrainSegment(segmentIndex);
                this.segments.push({
                    segment: segmentIndex,
                    node: node
                });
            }
        });

        return this.segments.map(s => s.node);
    }
}