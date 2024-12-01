class Skybox {
    constructor(gl, image_url) {
        // Create vertex data for a cube
        this.vertices = new Float32Array([
            -1.0,  1.0, -1.0,
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
        ]);

        this.indices = new Uint16Array([
            0, 1, 2, 0, 2, 3,  // front
            3, 2, 6, 3, 6, 7,  // right
            7, 6, 5, 7, 5, 4,  // back
            4, 5, 1, 4, 1, 0,  // left
            4, 0, 3, 4, 3, 7,  // top
            1, 5, 6, 1, 6, 2   // bottom
        ]);

        // Create and bind vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        // Create and bind index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // Create the shader program
        this.program = create_compile_and_link_program(gl, 
            // Vertex shader
            `#version 300 es
            precision highp float;
            
            in vec3 position;
            uniform mat4 projection;
            uniform mat4 view;
            
            out vec3 texCoords;
            
            void main() {
                texCoords = position;
                // Remove translation from view matrix by using only the rotation part
                mat4 rotView = mat4(mat3(view));
                // Increase scale for better coverage
                vec4 pos = projection * rotView * vec4(position * 2000.0, 1.0);
                gl_Position = pos.xyww;
            }`,
            // Fragment shader
            `#version 300 es
            precision highp float;
            
            in vec3 texCoords;
            uniform samplerCube skybox;
            
            out vec4 fragColor;
            
            void main() {
                fragColor = texture(skybox, texCoords);
            }`
        );

        // Create and setup the cubemap texture
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);

        // Load a placeholder color while we wait for the image
        const placeholder = new Uint8Array([128, 128, 128, 255]);
        for (let i = 0; i < 6; i++) {
            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                0, gl.RGBA, 1, 1, 0, gl.RGBA,
                gl.UNSIGNED_BYTE, placeholder
            );
        }

        // Load the actual skybox image
        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
            
            // Create a canvas to process the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            // Calculate face dimensions (assuming 4096x3072 image)
            const faceWidth = Math.floor(image.width / 4);   // 1024 for 4096 width
            const faceHeight = Math.floor(image.height / 3); // 1024 for 3072 height
            
            canvas.width = faceWidth;
            canvas.height = faceHeight;

            // Disable image smoothing to maintain sharpness
            ctx.imageSmoothingEnabled = false;

            // Define the faces and their positions in the image
            // Middle row (row 2): LFRB
            // Column 2: Top (row 1), Bottom (row 3)
            const faces = [
                // Right face (POSITIVE_X) - third in middle row
                { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, x: faceWidth * 2, y: faceHeight },
                // Left face (NEGATIVE_X) - first in middle row
                { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, x: 0, y: faceHeight },
                // Top face (POSITIVE_Y) - second column, first row
                { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, x: faceWidth, y: 0 },
                // Bottom face (NEGATIVE_Y) - second column, third row
                { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, x: faceWidth, y: faceHeight * 2 },
                // Front face (POSITIVE_Z) - second in middle row
                { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, x: faceWidth, y: faceHeight },
                // Back face (NEGATIVE_Z) - fourth in middle row
                { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, x: faceWidth * 3, y: faceHeight }
            ];

            faces.forEach(face => {
                ctx.clearRect(0, 0, faceWidth, faceHeight);
                
                // Draw the face at exact dimensions without scaling
                ctx.drawImage(image, 
                    face.x, face.y, faceWidth, faceHeight,  // Source rectangle
                    0, 0, faceWidth, faceHeight             // Destination rectangle (same size)
                );
                
                const faceData = ctx.getImageData(0, 0, faceWidth, faceHeight);
                
                // Upload texture with no scaling
                gl.texImage2D(
                    face.target,
                    0, gl.RGBA, faceWidth, faceHeight,
                    0, gl.RGBA, gl.UNSIGNED_BYTE,
                    faceData
                );
            });

            // Set texture parameters for maximum quality
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

            // Try to enable anisotropic filtering
            const ext = gl.getExtension('EXT_texture_filter_anisotropic');
            if (ext) {
                const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                gl.texParameterf(gl.TEXTURE_CUBE_MAP, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
            }
        };
        image.src = image_url;
    }

    render(gl, projectionMatrix, viewMatrix) {
        const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(this.program);
        set_uniform_matrix4(gl, this.program, 'projection', projectionMatrix);
        set_uniform_matrix4(gl, this.program, 'view', viewMatrix);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        const positionLoc = gl.getAttribLocation(this.program, 'position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        const skyboxLoc = gl.getUniformLocation(this.program, 'skybox');
        gl.uniform1i(skyboxLoc, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

        gl.useProgram(currentProgram);
    }
} 