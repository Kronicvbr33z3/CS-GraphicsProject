const VERTEX_STRIDE = 52;


class NormalMesh {
    /** 
     * Creates a new mesh and loads it into video memory.
     * 
     * @param {WebGLRenderingContext} gl  
     * @param {number} program
     * @param {number[]} vertices
     * @param {number[]} indices
    */
    constructor(gl, program, vertices, indices, materials, use_color) {
        this.verts = create_and_load_vertex_buffer(gl, vertices, gl.STATIC_DRAW);
        this.indis = create_and_load_elements_buffer(gl, indices, gl.STATIC_DRAW);

        this.n_verts = vertices.length / VERTEX_STRIDE * 4;
        this.n_indis = indices.length;
        this.program = program;
        this.materials = Array.isArray(materials) ? materials : [materials];
        this.use_color = use_color ?? false;
    }

    set_vertex_attributes() {
        set_vertex_attrib_to_buffer(
            gl, this.program,
            "coordinates",
            this.verts, 3,
            gl.FLOAT, false, VERTEX_STRIDE, 0
        );

        set_vertex_attrib_to_buffer(
            gl, this.program,
            "color",
            this.verts, 4,
            gl.FLOAT, false, VERTEX_STRIDE, 12
        );

        set_vertex_attrib_to_buffer(
            gl, this.program,
            "uv",
            this.verts, 2,
            gl.FLOAT, false, VERTEX_STRIDE, 28
        );

        set_vertex_attrib_to_buffer(
            gl, this.program,
            "surf_normal",
            this.verts, 3,
            gl.FLOAT, false, VERTEX_STRIDE, 36
        )

        set_vertex_attrib_to_buffer(
            gl, this.program,
            "material_index",
            this.verts, 1,
            gl.FLOAT, false, VERTEX_STRIDE, 48
        );
    }


    /**
     * Create a box mesh with the given dimensions and colors. Creates normals.
     * @param {WebGLRenderingContext} gl 
     */

    static box(gl, program, width, height, depth, material) {
        let hwidth = width / 2.0;
        let hheight = height / 2.0;
        let hdepth = depth / 2.0;

        let verts = [];

        // Helper function to add vertex data with material index
        function addVert(x, y, z, r, g, b, a, u, v, nx, ny, nz) {
            verts.push(
                x, y, z,           // position
                r, g, b, a,        // color
                u, v,              // uv
                nx, ny, nz,        // normal
                0                  // material index (always 0 for non-heightmap meshes)
            );
        }

        // Front face
        addVert(hwidth, -hheight, -hdepth, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0);
        addVert(-hwidth, -hheight, -hdepth, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0);
        addVert(-hwidth, hheight, -hdepth, 0.5, 0.5, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -1.0);
        addVert(hwidth, hheight, -hdepth, 1.0, 1.0, 0.5, 1.0, 1.0, 0.0, 0.0, 0.0, -1.0);

        // Right face
        addVert(hwidth, -hheight, hdepth, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0);
        addVert(hwidth, -hheight, -hdepth, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0);
        addVert(hwidth, hheight, -hdepth, 0.5, 0.5, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
        addVert(hwidth, hheight, hdepth, 1.0, 1.0, 0.5, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0);

        // Back face
        addVert(-hwidth, -hheight, hdepth, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0);
        addVert(hwidth, -hheight, hdepth, 1.0, 1.0, 0.5, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0);
        addVert(hwidth, hheight, hdepth, 0.5, 0.5, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
        addVert(-hwidth, hheight, hdepth, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0);

        // Left face
        addVert(-hwidth, -hheight, hdepth, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, -1.0, 0.0, 0.0);
        addVert(-hwidth, -hheight, -hdepth, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 0.0, 0.0);
        addVert(-hwidth, hheight, -hdepth, 0.5, 0.5, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0, 0.0);
        addVert(-hwidth, hheight, hdepth, 1.0, 1.0, 0.5, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0);

        // Top face
        addVert(-hwidth, hheight, -hdepth, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0);
        addVert(hwidth, hheight, -hdepth, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0);
        addVert(hwidth, hheight, hdepth, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0);
        addVert(-hwidth, hheight, hdepth, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0);

        // Bottom face
        addVert(-hwidth, -hheight, -hdepth, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, -1.0, 0.0);
        addVert(hwidth, -hheight, -hdepth, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0);
        addVert(hwidth, -hheight, hdepth, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0);
        addVert(-hwidth, -hheight, hdepth, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, -1.0, 0.0);

        let indis = [
            // counter-clockwise winding
            2, 1, 0, 2, 0, 3,    // front
            6, 5, 4, 4, 7, 6,    // right
            10, 9, 8, 8, 11, 10, // back
            12, 13, 14, 14, 15, 12, // left
            16, 17, 18, 18, 19, 16, // top
            22, 21, 20, 20, 23, 22  // bottom
        ];

        return new NormalMesh(gl, program, verts, indis, material, false);
    }

    /**
     * Create a flat platform in the xz plane.
     * @param {WebGLRenderingContext} gl 
     */
    static platform(gl, program, width, depth, uv_min, uv_max, material) {
        let hwidth = width / 2;
        let hdepth = depth / 2;

        let verts = [];

        // Helper function to add vertex data with material index
        function addVert(x, y, z, r, g, b, a, u, v, nx, ny, nz) {
            verts.push(
                x, y, z,           // position
                r, g, b, a,        // color
                u, v,              // uv
                nx, ny, nz,        // normal
                0                  // material index (always 0 for non-heightmap meshes)
            );
        }

        // Add the four corners of the platform
        addVert(-hwidth, 0, -hdepth, 1.0, 1.0, 1.0, 1.0, uv_min, uv_max, 0.0, 1.0, 0.0);
        addVert(hwidth, 0, -hdepth, 1.0, 1.0, 1.0, 1.0, uv_max, uv_max, 0.0, 1.0, 0.0);
        addVert(hwidth, 0, hdepth, 1.0, 1.0, 1.0, 1.0, uv_max, uv_min, 0.0, 1.0, 0.0);
        addVert(-hwidth, 0, hdepth, 1.0, 1.0, 1.0, 1.0, uv_min, uv_min, 0.0, 1.0, 0.0);

        let indis = [0, 1, 2, 2, 3, 0];

        return new NormalMesh(gl, program, verts, indis, material, false);
    }

    /**
     * Load a mesh from a heightmap.
     * @param {WebGLRenderingContext} gl 
     * @param {WebGLProgram} program
     * @param {number][][]} map
     * @param {number} min 
     * @param {number} max
     */
    static from_heightmap(gl, program, map, min, max, materials, materialIndices) {
        let rows = map.length;
        let cols = map[0].length;
        const MIN_HEIGHT_COLOR = 0.2;

        let off_x = cols / 2;
        let off_z = rows / 2;

        let verts = [];
        let indis = [];

        function color(height) {
            let normed_height = height / (max - min);
            return MIN_HEIGHT_COLOR + normed_height * (1 - MIN_HEIGHT_COLOR);
        }

        function push_vert(verts, vert, u, v, normal, materialIndex) {
            verts.push(vert.x, vert.y, vert.z);
            let vert_bright = color(vert.y);
            verts.push(vert_bright, vert_bright, vert_bright, 1.0);
            verts.push(u, v);
            verts.push(normal.x, normal.y, normal.z);
            verts.push(materialIndex);
        }

        for (let row = 1; row < rows; row++) {
            for (let col = 1; col < cols; col++) {
                let indi_start = indis.length;

                let pos_tl = map[row - 1][col - 1];
                let pos_tr = map[row - 1][col];
                let pos_bl = map[row][col - 1];
                let pos_br = map[row][col];

                let mat_tl = materialIndices[row - 1][col - 1];
                let mat_tr = materialIndices[row - 1][col];
                let mat_bl = materialIndices[row][col - 1];
                let mat_br = materialIndices[row][col];

                let v_tl = new Vec4(-1, pos_tl, -1);
                let v_tr = new Vec4(0, pos_tr, -1);
                let v_bl = new Vec4(-1, pos_bl, 0);
                let v_br = new Vec4(0, pos_br, 0);

                let normal_t1 = Vec4.normal_of_triangle(v_tl, v_tr, v_bl);
                let normal_t2 = Vec4.normal_of_triangle(v_br, v_bl, v_tr);

                v_tl.x += col - off_x;
                v_tl.z += row - off_z;
                v_tr.x += col - off_x;
                v_tr.z += row - off_z;
                v_bl.x += col - off_x;
                v_bl.z += row - off_z;
                v_br.x += col - off_x;
                v_br.z += row - off_z;

                push_vert(verts, v_tl, 0, 1, normal_t1, mat_tl);
                push_vert(verts, v_tr, 1, 1, normal_t1, mat_tr);
                push_vert(verts, v_bl, 0, 0, normal_t1, mat_bl);

                push_vert(verts, v_br, 1, 0, normal_t2, mat_br);
                push_vert(verts, v_bl, 0, 0, normal_t2, mat_bl);
                push_vert(verts, v_tr, 1, 1, normal_t2, mat_tr);

                indis.push(
                    indi_start,
                    indi_start + 1,
                    indi_start + 2,
                    indi_start + 3,
                    indi_start + 4,
                    indi_start + 5
                );
            }
        }

        return new NormalMesh(gl, program, verts, indis, materials, true);
    }

    /**
     * Render the mesh. Does NOT preserve array/index buffer, program, or texture bindings! 
     * 
     * @param {WebGLRenderingContext} gl 
     */
    render(gl) {
        gl.useProgram(this.program);
        this.set_vertex_attributes();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verts);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indis);

        this.materials.forEach((material, index) => {
            gl.activeTexture(gl.TEXTURE0 + index);
            material.bind(gl, this.program, index);
        });

        set_uniform_int(gl, this.program, 'use_color', this.use_color);
        set_uniform_int(gl, this.program, 'num_materials', this.materials.length);

        gl.drawElements(gl.TRIANGLES, this.n_indis, gl.UNSIGNED_SHORT, 0);
    }

    /**
     * Create a UV sphere.
     * @param {*} gl 
     * @param {*} program 
     * @param {*} radius 
     * @param {*} subdivs the number of subdivisions, both vertically and radially
     * @param {*} material 
     * @returns 
     */
    static uv_sphere(gl, program, radius, subdivs, material) {
        if (subdivs < 3) {
            throw new Error("subdivs must be at least 3. value: " + subdivs);
        }

        let verts = [];
        let indis = [];

        // Helper function to add vertex data with material index
        function addVert(x, y, z, r, g, b, a, u, v, nx, ny, nz) {
            verts.push(
                x, y, z,           // position
                r, g, b, a,        // color
                u, v,              // uv
                nx, ny, nz,        // normal
                0                  // material index (always 0 for non-heightmap meshes)
            );
        }

        for (let layer = 0; layer <= subdivs; layer++) {
            let y_turns = layer / subdivs / 2;
            let y = Math.cos(2 * Math.PI * y_turns) / 2;
            let radius_scale_for_layer = Math.sin(2 * Math.PI * y_turns);

            for (let subdiv = 0; subdiv <= subdivs; subdiv++) {
                let turns = subdiv / subdivs;
                let rads = 2 * Math.PI * turns;

                let x = Math.cos(rads) / 2 * radius_scale_for_layer;
                let z = Math.sin(rads) / 2 * radius_scale_for_layer;

                let point_norm = new Vec4(x, y, z, 0.0).norm();
                let scaled_point = point_norm.scaled(radius);

                // Add vertex using our helper function
                addVert(
                    scaled_point.x, scaled_point.y, scaled_point.z,  // position
                    1, 1, 1, 1,                                      // color (white)
                    subdiv / subdivs, layer / subdivs,               // uv
                    point_norm.x, point_norm.y, point_norm.z         // normal
                );
            }
        }

        function get_indi_no_from_layer_and_subdiv_no(layer, subdiv) {
            let layer_start = layer * (subdivs + 1);
            return layer_start + subdiv % (subdivs + 1);
        }

        for (let layer = 1; layer <= subdivs; layer++) {
            for (let subdiv = 0; subdiv < subdivs; subdiv++) {
                let i0 = get_indi_no_from_layer_and_subdiv_no(layer - 1, subdiv);
                let i1 = get_indi_no_from_layer_and_subdiv_no(layer - 1, subdiv + 1);
                let i2 = get_indi_no_from_layer_and_subdiv_no(layer, subdiv);
                let i3 = get_indi_no_from_layer_and_subdiv_no(layer, subdiv + 1);

                indis.push(i0, i2, i3, i3, i1, i0);
            }
        }

        return new NormalMesh(gl, program, verts, indis, material, false);
    }

    /**
     * Load a mesh from an OBJ file with MTL materials
     * @param {WebGLRenderingContext} gl 
     * @param {WebGLProgram} program
     * @param {string} objData - The OBJ file contents
     * @param {string} mtlData - The MTL file contents
     * @param {string} basePath - Base path for texture loading
     */
    static async from_obj_with_mtl(gl, program, objData, mtlData, basePath, defaultMaterialProps = null) {
        let materials = new Map();
        let currentMaterial = null;

        // Parse MTL file
        const mtlLines = mtlData.split('\n');
        for (let i = 0; i < mtlLines.length; i++) {
            const line = mtlLines[i].trim();
            if (!line || line.startsWith('#')) continue;

            const parts = line.split(/\s+/);

            if (line.startsWith('newmtl ')) {
                const materialName = parts[1];
                currentMaterial = {
                    name: materialName,
                    ambient: [0.2, 0.2, 0.2],
                    diffuse: [0.8, 0.8, 0.8],
                    specular: [0.5, 0.5, 0.5],
                    shininess: 32.0,
                    diffuseMap: null
                };
                materials.set(materialName, currentMaterial);
            } else if (line.startsWith('Ka ') && currentMaterial) {
                currentMaterial.ambient = [
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ];
            } else if (line.startsWith('Kd ') && currentMaterial) {
                currentMaterial.diffuse = [
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ];
            } else if (line.startsWith('Ks ') && currentMaterial) {
                currentMaterial.specular = [
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ];
            } else if (line.startsWith('Ns ') && currentMaterial) {
                currentMaterial.shininess = parseFloat(parts[1]);
            } else if (line.startsWith('map_Kd ') && currentMaterial) {
                const texturePath = parts[1];
                const fullPath = `${basePath}/${texturePath}`;

                currentMaterial.diffuseMap = new LitMaterial(
                    gl,
                    fullPath,
                    gl.LINEAR,
                    defaultMaterialProps ? defaultMaterialProps.ambient :
                        (currentMaterial.ambient[0] + currentMaterial.ambient[1] + currentMaterial.ambient[2]) / 3,
                    defaultMaterialProps ? defaultMaterialProps.diffuse :
                        (currentMaterial.diffuse[0] + currentMaterial.diffuse[1] + currentMaterial.diffuse[2]) / 3,
                    defaultMaterialProps ? defaultMaterialProps.specular :
                        (currentMaterial.specular[0] + currentMaterial.specular[1] + currentMaterial.specular[2]) / 3,
                    defaultMaterialProps ? defaultMaterialProps.shininess : currentMaterial.shininess
                );
            }
        }

        // Parse OBJ file
        const positions = [];
        const texCoords = [];
        const normals = [];
        const vertices = [];
        const indices = [];
        let vertexMap = new Map();
        let currentMaterialName = null;
        let vertexCount = 0;

        const objLines = objData.split('\n');
        for (let i = 0; i < objLines.length; i++) {
            const line = objLines[i].trim();
            if (!line || line.startsWith('#')) continue;

            const parts = line.split(/\s+/);

            if (line.startsWith('v ')) {
                positions.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ]);
            } else if (line.startsWith('vt ')) {
                texCoords.push([
                    parseFloat(parts[1]),
                    1.0 - parseFloat(parts[2])
                ]);
            } else if (line.startsWith('vn ')) {
                normals.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ]);
            } else if (line.startsWith('usemtl ')) {
                currentMaterialName = parts[1];
            } else if (line.startsWith('f ')) {
                // Process face indices
                const faceIndices = [];
                for (let j = 1; j < parts.length; j++) {
                    const indices = parts[j].split('/');
                    const vertexKey = parts[j];

                    if (!vertexMap.has(vertexKey)) {
                        const posIndex = parseInt(indices[0]) - 1;
                        const texIndex = indices[1] ? parseInt(indices[1]) - 1 : 0;
                        const normIndex = indices[2] ? parseInt(indices[2]) - 1 : 0;

                        const pos = positions[posIndex];
                        const tex = texCoords[texIndex] || [0, 0];
                        const norm = normals[normIndex] || [0, 1, 0];

                        vertices.push(
                            pos[0], pos[1], pos[2],           // position
                            1.0, 1.0, 1.0, 1.0,              // color (white)
                            tex[0], tex[1],                   // uv
                            norm[0], norm[1], norm[2],        // normal
                            materials.has(currentMaterialName) ? Array.from(materials.keys()).indexOf(currentMaterialName) : 0  // material index
                        );

                        vertexMap.set(vertexKey, vertexCount);
                        faceIndices.push(vertexCount);
                        vertexCount++;
                    } else {
                        faceIndices.push(vertexMap.get(vertexKey));
                    }
                }

                // Triangulate face (assuming convex polygon)
                for (let j = 1; j < faceIndices.length - 1; j++) {
                    indices.push(
                        faceIndices[0],
                        faceIndices[j],
                        faceIndices[j + 1]
                    );
                }
            }
        }

        // Convert materials map to array
        const materialArray = Array.from(materials.values()).map(m => m.diffuseMap);

        return new NormalMesh(gl, program, vertices, indices, materialArray, false);
    }

    /**
     * Load a mesh from a simple OBJ file
     * @param {WebGLRenderingContext} gl 
     * @param {WebGLProgram} program
     * @param {string} objData - The OBJ file contents
     * @param {LitMaterial[]} materials - Array of materials to use
     */
    static async from_obj(gl, program, objData, materials) {
        const positions = [];
        const normals = [];
        const texCoords = [];
        const vertices = [];
        const indices = [];
        let vertexMap = new Map();
        let vertexCount = 0;

        const lines = objData.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) continue;

            const parts = line.split(/\s+/);
            const command = parts[0];

            switch (command) {
                case 'v': // Position
                    positions.push([
                        parseFloat(parts[1]),
                        parseFloat(parts[2]),
                        parseFloat(parts[3])
                    ]);
                    break;

                case 'vt': // Texture coordinate
                    texCoords.push([
                        parseFloat(parts[1]),
                        1.0 - parseFloat(parts[2])
                    ]);
                    break;

                case 'vn': // Normal
                    normals.push([
                        parseFloat(parts[1]),
                        parseFloat(parts[2]),
                        parseFloat(parts[3])
                    ]);
                    break;

                case 'f': // Face
                    // Convert polygon to triangles
                    for (let i = 1; i < parts.length - 1; i++) {
                        const v1 = parts[1].split('/');
                        const v2 = parts[i].split('/');
                        const v3 = parts[i + 1].split('/');

                        // Process each vertex of the triangle
                        [v1, v2, v3].forEach(vertex => {
                            const vertexKey = vertex.join('/');
                            
                            if (!vertexMap.has(vertexKey)) {
                                // Handle negative indices (relative to end of array)
                                const pi = parseInt(vertex[0]);
                                const ti = vertex[1] ? parseInt(vertex[1]) : undefined;
                                const ni = vertex[2] ? parseInt(vertex[2]) : undefined;

                                // Convert negative indices to positive
                                const posIndex = pi > 0 ? pi - 1 : positions.length + pi;
                                const texIndex = ti ? (ti > 0 ? ti - 1 : texCoords.length + ti) : 0;
                                const normIndex = ni ? (ni > 0 ? ni - 1 : normals.length + ni) : 0;

                                const pos = positions[posIndex];
                                const tex = texCoords[texIndex] || [0, 0];
                                const norm = normals[normIndex] || [0, 1, 0];

                                if (!pos) {
                                    console.error('Invalid position index:', posIndex);
                                    return;
                                }

                                vertices.push(
                                    pos[0], pos[1], pos[2],           // position
                                    1.0, 1.0, 1.0, 1.0,              // color (white)
                                    tex[0], tex[1],                   // uv
                                    norm[0], norm[1], norm[2],        // normal
                                    0                                 // material index
                                );

                                vertexMap.set(vertexKey, vertexCount);
                                vertexCount++;
                            }
                            indices.push(vertexMap.get(vertexKey));
                        });
                    }
                    break;
            }
        }

        return new NormalMesh(gl, program, vertices, indices, materials, false);
    }
}
