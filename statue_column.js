class StatueColumn {
    static columnMesh = null;
    static statueMesh = null;
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
        StatueColumn.initializeResources(gl, program);
        
        this.root = new Node();
        this.columnNode = new Node(StatueColumn.columnMesh);
        this.statueNode = new Node(StatueColumn.statueMesh);

        this.root.addChild(this.columnNode);
        this.columnNode.addChild(this.statueNode);
        
        // Reduce column scale by half and lower its position
        this.columnNode.scale = { x: 0.0025, y: 0.005, z: 0.0025 };
        this.columnNode.position = { x: 0, y: -1, z: 0 }; // Lower the column
        
        // Adjust statue scale and position to be on top of column
        this.statueNode.scale = { x: 20, y: 20, z: 20  };
        this.statueNode.position = { x: 0, y: 1000, z: 0 }; // Raise the statue
        
        // Initial rotation to face the road
        this.statueNode.rotation = {
            pitch: Math.PI / 2,
            yaw: 0,
            roll: 0
        };
    }
    
    update(deltaTime) {
        // Slower rotation for more majestic movement, reversed direction
        this.statueNode.rotation.pitch = (this.statueNode.rotation.pitch || -Math.PI / 2) - deltaTime * 0.3;
    }
    
    setPosition(x, y, z) {
        this.root.position = { x, y, z };
    }
} 