class StatueColumn {
    static columnMesh = null;
    static statueMesh = null;
    static sphereMesh = null;
    static sphereMaterial = null;
    static loadPromise = null;

    static async initializeResources(gl, program) {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = (async () => {
            // Only load OBJ files if meshes don't exist
            if (!this.columnMesh || !this.statueMesh) {
                try {
                    console.log('Loading models...');
                    const [columnData, statueMtlData, statueObjData] = await Promise.all([
                        fetch('model/column.obj').then(r => {
                            if (!r.ok) throw new Error(`Failed to load column.obj: ${r.status}`);
                            return r.text();
                        }),
                        fetch('model/heliosbust.mtl').then(r => {
                            if (!r.ok) throw new Error(`Failed to load heliosbust.mtl: ${r.status}`);
                            return r.text();
                        }),
                        fetch('model/heliosbust.obj').then(r => {
                            if (!r.ok) throw new Error(`Failed to load heliosbust.obj: ${r.status}`);
                            return r.text();
                        })
                    ]);

                    // Initialize sphere material if not already created
                    if (!this.sphereMaterial) {
                        this.sphereMaterial = new LitMaterial(
                            gl, 
                            'tex/grid.png', 
                            gl.LINEAR, 
                            0.6,    // increased ambient
                            0.8,    // reduced diffuse
                            1.0,    // max specular
                            64.0    // much higher shininess for a more metallic look
                        );
                    }

                    // Initialize sphere mesh if not already created
                    if (!this.sphereMesh) {
                        this.sphereMesh = NormalMesh.uv_sphere(
                            gl, 
                            program, 
                            0.15,  // radius
                            24,    // subdivisions
                            this.sphereMaterial
                        );
                    }

                    // Create a simple material for the column
                    let columnMaterial = new LitMaterial(
                        gl, 
                        'tex/snow.png',
                        gl.LINEAR,
                        0.3,  // ambient
                        0.8,  // diffuse
                        0.4,  // specular
                        16.0  // shininess
                    );

                    console.log('Creating column mesh...');
                    this.columnMesh = await NormalMesh.from_obj(
                        gl, 
                        program,
                        columnData, 
                        [columnMaterial]
                    );

                    // Default material properties for the statue
                    const defaultMaterialProps = {
                        ambient: 0.3,
                        diffuse: 0.8,
                        specular: 0.4,
                        shininess: 16.0
                    };

                    console.log('Creating statue mesh...');
                    this.statueMesh = await NormalMesh.from_obj_with_mtl(
                        gl,
                        program,
                        statueObjData,
                        statueMtlData,
                        'model',
                        defaultMaterialProps
                    );

                    if (!this.statueMesh || !this.columnMesh) {
                        throw new Error('Failed to create meshes');
                    }

                    console.log('Models loaded successfully');

                } catch (error) {
                    console.error('Error loading models:', error);
                    // Fallback to simple geometries if loading fails
                    let material = new LitMaterial(
                        gl, 
                        'tex/snow.png',
                        gl.LINEAR,
                        0.3,
                        0.8,
                        0.4,
                        16.0
                    );
                    this.columnMesh = NormalMesh.box(gl, program, 1, 4, 1, [material]);
                    this.statueMesh = NormalMesh.box(gl, program, 0.5, 1, 0.5, [material]);
                }
            }
        })();

        return this.loadPromise;
    }

    constructor(gl, program) {
        if (!StatueColumn.columnMesh) {
            StatueColumn.initializeResources(gl, program);
        }
        
        this.root = new Node();
        this.columnNode = new Node(StatueColumn.columnMesh);
        this.statueNode = new Node(StatueColumn.statueMesh);

        // Create orbiting spheres - smaller radius and closer orbit
        this.orbitRadius = 1.2;
        this.orbitSpeed = 4.0;    // Much faster speed
        this.sphereNodes = [];
        
        // Create two orbiting spheres using the cached mesh
        for (let i = 0; i < 2; i++) {
            const sphereNode = new Node(StatueColumn.sphereMesh);
            this.sphereNodes.push(sphereNode);
            this.root.addChild(sphereNode);
        }

        this.root.addChild(this.columnNode);
        this.columnNode.addChild(this.statueNode);

        this.columnNode.scale = { x: 0.003, y: 0.005, z: 0.003 };
        this.columnNode.position = { x: 0, y: -2.2, z: 0 }; 
        
        this.statueNode.scale = { x: 25, y: 25, z: 25  };
        this.statueNode.position = { x: 0, y: 1000, z: 0 };
        
        this.statueNode.rotation = {
            pitch: Math.PI / 2,
            yaw: 0,
            roll: 0
        };

        // Set initial sphere positions
        this.sphereTime = 0;
        this.updateSpherePositions(0);
    }
    
    updateSpherePositions(deltaTime) {
        this.sphereTime += deltaTime * this.orbitSpeed;
        
        // Update positions for each sphere, with opposite directions
        this.sphereNodes.forEach((sphereNode, index) => {
            // Multiply by -1 for first sphere to go in opposite direction
            const direction = index === 0 ? -1 : 1;
            const angle = this.sphereTime * direction + (index * Math.PI);
            
            sphereNode.position = {
                x: Math.cos(angle) * this.orbitRadius,
                y: 1.5,
                z: Math.sin(angle) * this.orbitRadius
            };
        });
    }
    
    update(deltaTime) {
        this.statueNode.rotation.pitch = (this.statueNode.rotation.pitch || -Math.PI / 2) - deltaTime * 0.3;
        this.updateSpherePositions(deltaTime);
    }
    
    setPosition(x, y, z) {
        this.root.position = { x, y, z };
    }
} 