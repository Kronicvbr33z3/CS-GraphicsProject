let canvas = document.getElementById( 'the-canvas' );
            /** @type {WebGLRenderingContext} */
            let gl = canvas.getContext( 'webgl2' );

            const GOURAUD_VERTEX_SHADER = 
            `   #version 300 es
                precision mediump float;

                uniform mat4 projection;
                uniform mat4 modelview;
                uniform mat4 model;
                uniform mat4 view;
                uniform vec3 viewer_loc;

                uniform vec3 sun_dir;
                uniform vec3 sun_color;
                
                uniform vec3 light1_loc;
                uniform vec3 light1_color;

                uniform vec3 light2_loc;
                uniform vec3 light2_color;

                uniform vec3 light3_loc;
                uniform vec3 light3_color;

                uniform vec3 light4_loc;
                uniform vec3 light4_color;

                const float light_attenuation_k = 1.0;
                const float light_attenuation_l = 0.3;
                const float light_attenuation_q = 0.2;

                uniform float mat_0_ambient, mat_1_ambient, mat_2_ambient;
                uniform float mat_0_diffuse, mat_1_diffuse, mat_2_diffuse;
                uniform float mat_0_specular, mat_1_specular, mat_2_specular;
                uniform float mat_0_shininess, mat_1_shininess, mat_2_shininess;

                in vec3 coordinates;
                in vec4 color;
                in vec2 uv;
                in vec3 surf_normal;
                in float material_index;

                out vec4 v_color;
                out vec2 v_uv;
                out float v_material_index;

                vec3 diff_color( 
                    vec3 normal, 
                    vec3 light_dir,
                    vec3 light_color, 
                    float mat_diffuse 
                ) {
                    return mat_diffuse * light_color * max( dot( normal, light_dir ), 0.0 );
                }

                vec3 spec_color( 
                    vec3 normal, 
                    vec3 light_dir,
                    vec3 eye_dir, 
                    vec3 light_color, 
                    float mat_specular,
                    float mat_shininess
                ) {
                    float cos_light_surf_normal = dot( normal, light_dir );

                    if( cos_light_surf_normal <= 0.0 ) {
                        return vec3( 0.0, 0.0, 0.0 );
                    }

                    vec3 light_reflection = 
                        2.0 * cos_light_surf_normal * normal - light_dir;

                    return 
                        pow( 
                            max( dot( light_reflection, normalize( eye_dir ) ), 0.0  ),
                            mat_shininess 
                        ) * light_color * mat_specular;
                }

                float attenuation( vec3 vector_to_light ) {
                    float light1_dist = length( vector_to_light );
                    float light1_atten = 1.0 / ( 
                        light_attenuation_k + 
                        light_attenuation_l * light1_dist +
                        light_attenuation_q * light1_dist * light1_dist
                    );

                    return light1_atten;
                }

                void main( void ) {
                    float mat_ambient = material_index < 0.5 ? mat_0_ambient : 
                                      material_index < 1.5 ? mat_1_ambient : mat_2_ambient;
                    float mat_diffuse = material_index < 0.5 ? mat_0_diffuse :
                                      material_index < 1.5 ? mat_1_diffuse : mat_2_diffuse;
                    float mat_specular = material_index < 0.5 ? mat_0_specular :
                                       material_index < 1.5 ? mat_1_specular : mat_2_specular;
                    float mat_shininess = material_index < 0.5 ? mat_0_shininess :
                                        material_index < 1.5 ? mat_1_shininess : mat_2_shininess;
                            
                    vec3 normal_tx = normalize( mat3( model ) * surf_normal );
                    vec3 coords_tx = ( model * vec4( coordinates, 1.0 ) ).xyz;

                    gl_Position = projection * modelview * vec4( coordinates, 1.0 );
                    vec3 eye_dir = normalize( viewer_loc - coords_tx );

                    vec4 ambient_color = vec4(
                        mat_ambient * 2.2, 
                        mat_ambient * 1.8, 
                        mat_ambient * 2.4, 
                        1.0
                    );

                    float cos_sun_dir_surf_normal = dot( sun_dir, normal_tx );
                    vec3 sun_diffuse_color = diff_color( normal_tx, sun_dir, sun_color, mat_diffuse );
                    
                    vec3 sun_spec_color =
                        spec_color( normal_tx, sun_dir, eye_dir, sun_color, mat_specular, mat_shininess );

                    vec4 color_from_sun = vec4( sun_diffuse_color + sun_spec_color, 1.0 );

                    vec3 vector_to_light1 = light1_loc - coords_tx;
                    vec3 light1_dir = normalize( vector_to_light1 );
                    float light1_atten = attenuation( vector_to_light1 );
                
                    vec3 light1_diffuse_color = diff_color( 
                        normal_tx, light1_dir, light1_color, mat_diffuse);
                    vec3 light1_spec_color = spec_color( 
                        normal_tx, light1_dir, eye_dir, light1_color, mat_specular, mat_shininess );
                    vec4 color_from_light1 = vec4(
                            ( light1_diffuse_color + light1_spec_color ) * light1_atten, 1.0 );

                    // Add spotlight (light2) calculations
                    vec3 vector_to_light2 = light2_loc - coords_tx;
                    vec3 light2_dir = normalize( vector_to_light2 );
                    float light2_atten = attenuation( vector_to_light2 );
                
                    vec3 light2_diffuse_color = diff_color( 
                        normal_tx, light2_dir, light2_color, mat_diffuse);
                    vec3 light2_spec_color = spec_color( 
                        normal_tx, light2_dir, eye_dir, light2_color, mat_specular, mat_shininess );
                    vec4 color_from_light2 = vec4(
                            ( light2_diffuse_color + light2_spec_color ) * light2_atten, 1.0 );

                    // Add headlight (light3) calculations
                    vec3 vector_to_light3 = light3_loc - coords_tx;
                    vec3 light3_dir = normalize( vector_to_light3 );
                    float light3_atten = attenuation( vector_to_light3 );
                
                    vec3 light3_diffuse_color = diff_color( 
                        normal_tx, light3_dir, light3_color, mat_diffuse);
                    vec3 light3_spec_color = spec_color( 
                        normal_tx, light3_dir, eye_dir, light3_color, mat_specular, mat_shininess );
                    vec4 color_from_light3 = vec4(
                            ( light3_diffuse_color + light3_spec_color ) * light3_atten, 1.0 );

                    // Add headlight (light4) calculations
                    vec3 vector_to_light4 = light4_loc - coords_tx;
                    vec3 light4_dir = normalize( vector_to_light4 );
                    float light4_atten = attenuation( vector_to_light4 );
                
                    vec3 light4_diffuse_color = diff_color( 
                        normal_tx, light4_dir, light4_color, mat_diffuse);
                    vec3 light4_spec_color = spec_color( 
                        normal_tx, light4_dir, eye_dir, light4_color, mat_specular, mat_shininess );
                    vec4 color_from_light4 = vec4(
                            ( light4_diffuse_color + light4_spec_color ) * light4_atten, 1.0 );

                    v_color = 
                        (0.0 * color) + 
                        (1.4 * (
                            ambient_color +
                            color_from_sun +
                            color_from_light1 +
                            color_from_light2 +
                            color_from_light3 +
                            color_from_light4
                        ));
                    v_uv = uv;
                    v_material_index = material_index;
                }
            `;

            const GOURAUD_FRAGMENT_SHADER = 
            `   #version 300 es
                precision mediump float;

                in vec4 v_color;
                in vec2 v_uv;
                in float v_material_index;

                out vec4 f_color;

                uniform sampler2D tex_0;
                uniform sampler2D tex_1;
                uniform sampler2D tex_2;
                uniform int num_materials;

                void main( void ) {
                    vec4 tex_color;
                    if (v_material_index < 0.5) {
                        tex_color = texture(tex_0, v_uv);
                    } else if (v_material_index < 1.5) {
                        tex_color = texture(tex_1, v_uv);
                    } else {
                        tex_color = texture(tex_2, v_uv);
                    }
                    f_color = v_color * tex_color;
                }
            `;

            let lit_program = 
                create_compile_and_link_program( 
                    gl, 
                    /*PHONG_VERTEX_SHADER,*/ GOURAUD_VERTEX_SHADER,
                    /*PHONG_FRAGMENT_SHADER,*/ GOURAUD_FRAGMENT_SHADER
                );

            gl.useProgram( lit_program );

            set_render_params( gl );

            let last_update = performance.now();

            const DESIRED_TICK_RATE = 60;
            const DESIRED_MSPT = 1000.0 / DESIRED_TICK_RATE;

            const ROTATION_SPEED = 0.2; // eighth turn per second
            const ROTATION_SPEED_PER_FRAME = ROTATION_SPEED / DESIRED_TICK_RATE;

            const FLY_SPEED = 10;    // units per second
            const FLY_SPEED_PER_FRAME = FLY_SPEED / DESIRED_TICK_RATE;

            const CAR_SPEED = 5.0;  // units per second
            const CAR_SPEED_PER_FRAME = CAR_SPEED / DESIRED_TICK_RATE;

            let keys = Keys.start_listening();
            let cam = new Camera();
            cam.translate( 0, 0, -7.5 );
    
            

            let metal = new LitMaterial( gl, 'tex/metal.png', gl.LINEAR, 0.5, 1.0, 0.9, 20 );
            let sand = new LitMaterial(gl, 'tex/sand.png', gl.LINEAR, 0.4, 0.9, 0.2, 1.0);
            let ground = new LitMaterial(gl, 'tex/ground.png', gl.LINEAR, 0.4, 0.9, 0.2, 1.0);
            let snow = new LitMaterial(gl, 'tex/snow.png', gl.LINEAR, 0.5, 1.0, 0.3, 1.0);

            let sun_dir = (new Vec4(0.2, 0.3, 0.5, 0.0)).norm();
            let sun = new Light(sun_dir.x, sun_dir.y, sun_dir.z, 1.0, 0.4, 0.6, 0);
            let light1 = new Light(0, 4, 4, 0.6, 0.2, 0.8, 1);
            let carSpotlight = new Light(0, 4, 4, 0.8, 0.2, 1.0, 2);
            let leftHeadlight = new Light(-0.4, -1.2, -15, 0.8, 0.7, 0.2, 3);   // Raised height from -1.7 to -1.2
            let rightHeadlight = new Light(0.4, -1.2, -15, 0.8, 0.7, 0.2, 4);   // Raised height from -1.7 to -1.2

            let scene_root = new Node();

            let carNode = null;  // Reference to the car node
            let carPosition = { x: 0, y: -1.8, z: 0 };  // Initial car position

            async function loadCarModel() {
                try {
                    const mtlResponse = await fetch('model/CarritoVaporwave.mtl');
                    const mtlData = await mtlResponse.text();
                    
                    const objResponse = await fetch('model/CarritoVaporwave.obj');
                    const objData = await objResponse.text();
                    
                    const defaultMaterialProps = {
                        ambient: 0.3,
                        diffuse: 0.1,
                        specular: 0.3,
                        shininess: 16
                    };
                    
                    const carMesh = await NormalMesh.from_obj_with_mtl(
                        gl,
                        lit_program,
                        objData,
                        mtlData,
                        'model',
                        defaultMaterialProps
                    );
                    
                    carNode = new Node(carMesh);
                    carNode.position = carPosition;
                    carNode.scale = { x: 0.3, y: 0.3, z: 0.3 };
                    carNode.rotation.yaw = Math.PI / 3.15;
                    
                    scene_root.addChild(carNode);
                    
                } catch (error) {
                    console.error('Error loading car model:', error);
                }
            }

            let terrainGen = new TerrainGenerator(gl, lit_program, 20, 128, [sand, ground, snow]);
            let terrain_root = new Node();
            scene_root.addChild(terrain_root);

            let initialSegments = terrainGen.updateTerrain({x: 0, y: 0, z: 0});
            initialSegments.forEach(segment => terrain_root.addChild(segment));

            loadCarModel();

            let projection = Mat4.perspective_fovx(0.125, 4 / 3, 0.125, 1024);
            let current_program = lit_program;

            let arm_rotation = 0;
            let sphere_rotation = 0;
            const ARM_ROTATION_SPEED = 0.5 / DESIRED_TICK_RATE;
            const SPHERE_ROTATION_SPEED = 2 / DESIRED_TICK_RATE;
            const SPHERE_ORBIT_RADIUS = 0.8;

            function render( now ) {
                last_update = now;

                requestAnimationFrame( render );
                
                gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

                let view = cam.get_view_matrix();

                let render_jobs = generateRenderJobs( Mat4.identity(), scene_root );

                for( let job of render_jobs ) {
                    let modelview = view.mul( job.matrix );
                    
                    gl.useProgram( current_program );
                    
                    set_uniform_matrix4( gl, current_program, 'projection', projection.data );
                    set_uniform_matrix4( gl, current_program, 'modelview', modelview.data );
                    set_uniform_matrix4( gl, current_program, 'model', job.matrix.data );
                    set_uniform_matrix4( gl, current_program, 'view', view.data );
                    set_uniform_vec3( gl, current_program, 'viewer_loc', cam.x, cam.y, cam.z );

                    sun.bind( gl, current_program, modelview );
                    light1.bind( gl, current_program, modelview );
                    carSpotlight.bind( gl, current_program, modelview );
                    leftHeadlight.bind( gl, current_program, modelview );
                    rightHeadlight.bind( gl, current_program, modelview );

                    job.mesh.render( gl );
                }
            }

            const KEYMAP = {
                'KeyQ': function() { cam.add_roll( -ROTATION_SPEED_PER_FRAME ); },
                'KeyE': function() { cam.add_roll( ROTATION_SPEED_PER_FRAME ); },
                'KeyT': function() { 
                    let camPos = new Vec4(cam.x, cam.y, cam.z, 1);
                    terrainGen.updateTerrain(camPos);
                },
            };

            function update() {
                let keys_down = keys.keys_down_list();

                // Update car position - move forward in the direction it's facing
                if (carNode) {
                    // Move car forward
                    carPosition.z += CAR_SPEED_PER_FRAME;
                    carNode.position = carPosition;
                    
                    // Update headlight positions relative to car position
                    leftHeadlight.x = carPosition.x - 0.4;
                    leftHeadlight.y = carPosition.y - 1.2;     // Raised from -1.4 to -1.2
                    leftHeadlight.z = carPosition.z + 6.0;     // Increased forward distance from 4.0 to 6.0

                    rightHeadlight.x = carPosition.x + 0.4;
                    rightHeadlight.y = carPosition.y - 1.2;    // Raised from -1.4 to -1.2
                    rightHeadlight.z = carPosition.z + 6.0;    // Increased forward distance from 4.0 to 6.0
                    
                    // Update camera position to follow car
                    cam.warp(
                        carPosition.x,      // Same X as car
                        carPosition.y + 2,  // Slightly above car
                        carPosition.z - 7.5 // Behind car
                    );
                }

                // Process other key inputs
                for (const key of keys_down) {
                    let bound_function = KEYMAP[key];
                    if (bound_function) {
                        bound_function();
                    }
                }

                let camPos = {x: cam.x, y: cam.y, z: cam.z};
                let newSegments = terrainGen.updateTerrain(camPos);
                
                while(terrain_root.children.length > 0) {
                    terrain_root.removeChild(terrain_root.children[0]);
                }
                
                newSegments.forEach(segment => terrain_root.addChild(segment));

                return;
            }
            
            requestAnimationFrame( render );
            setInterval( update, DESIRED_MSPT );