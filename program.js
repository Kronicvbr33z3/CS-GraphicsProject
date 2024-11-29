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

                const float light_attenuation_k = 0.01;
                const float light_attenuation_l = 0.1;
                const float light_attenuation_q = 0.00; /* no quadratic term for now */

                uniform float mat_ambient;
                uniform float mat_diffuse;
                uniform float mat_specular;
                uniform float mat_shininess;

                in vec3 coordinates;
                in vec4 color;
                in vec2 uv;
                in vec3 surf_normal;

                out vec4 v_color;
                out vec2 v_uv;

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
                    float mat_shiniess
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
                    vec3 normal_tx = normalize( mat3( model ) * surf_normal );
                    vec3 coords_tx = ( model * vec4( coordinates, 1.0 ) ).xyz;

                    gl_Position = projection * modelview * vec4( coordinates, 1.0 );
                    vec3 eye_dir = normalize( viewer_loc - coords_tx );

                    vec4 ambient_color = vec4( mat_ambient, mat_ambient, mat_ambient, 1.0 );

                    // vec3 sun_dir_tx = 
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

                    /* multiply color by 0 to remove it. try changing the 0 to a small number like .2
                    and the 1 to the complement of that number (1 - .2 = .8) to see how color blending works.*/
                    v_color = 
                        ( 0.0 * color ) + 
                        ( 1.0 * (
                            ambient_color +
                            color_from_sun +
                            color_from_light1
                        ) );
                    v_uv = uv;
                }
            `;

            const GOURAUD_FRAGMENT_SHADER = 
            `   #version 300 es
                precision mediump float;

                in vec4 v_color;
                in vec2 v_uv;

                out vec4 f_color;

                uniform sampler2D tex_0;

                void main( void ) {
                    f_color = v_color * texture( tex_0, v_uv ); 

                    /* we can test depth values with this.
                    f_color = vec4(vec3(gl_FragCoord.z), 1.0); */
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

            const FLY_SPEED = 2;    // units per second
            const FLY_SPEED_PER_FRAME = FLY_SPEED / DESIRED_TICK_RATE;

            let keys = Keys.start_listening();
            let cam = new Camera();
            cam.translate( 0, 0, -4.5 );

            
            let metal = 
                new LitMaterial( gl, 'tex/metal.png', gl.LINEAR, 0.25, 1, 2, 5 );
            let grass = 
                new LitMaterial( gl, 
                'tex/grass_lawn_seamless.png', gl.LINEAR, 0.2, 0.8, 0.05, 1.0 );
            let scale = 
                new LitMaterial( gl, 'tex/metal_scale.png', gl.LINEAR, 0.25, 1, 2, 4 );

            let sun_dir = ( new Vec4( 1.0, 0.0, 0.0, 0.0 ) ).norm();
            let sun = new Light( sun_dir.x, sun_dir.y, sun_dir.z, 1.0, 0.95, 0.85, 0 );
            let light1 = new Light( -9, -9, 0.0, 1.0, 0.2, 0.2, 1 );

            let scene_root = new Node();

            let platform_mesh = NormalMesh.platform(gl, lit_program, 5, 5, 0, 4, grass);
            let platform_node = new Node(platform_mesh);
            scene_root.addChild(platform_node);

            let center_pillar_mesh = NormalMesh.box(gl, lit_program, 0.5, 2, 0.5, metal);
            let center_pillar_node = new Node(center_pillar_mesh);
            center_pillar_node.position.y = 1;
            platform_node.addChild(center_pillar_node);

            let arm_mesh = NormalMesh.box(gl, lit_program, 2, 0.3, 0.3, scale);
            let arm_node = new Node(arm_mesh);
            arm_node.position.y = 1;
            center_pillar_node.addChild(arm_node);

            let left_box_mesh = NormalMesh.box(gl, lit_program, 0.5, 0.5, 0.5, metal);
            let left_box_node = new Node(left_box_mesh);
            left_box_node.position.x = -1;
            arm_node.addChild(left_box_node);

            let right_box_mesh = NormalMesh.box(gl, lit_program, 0.5, 0.5, 0.5, metal);
            let right_box_node = new Node(right_box_mesh);
            right_box_node.position.x = 1;
            arm_node.addChild(right_box_node);

            let sphere_mesh = NormalMesh.uv_sphere(gl, lit_program, 0.2, 12, scale);
            let left_sphere_node = new Node(sphere_mesh);
            let right_sphere_node = new Node(sphere_mesh);
            left_box_node.addChild(left_sphere_node);
            right_box_node.addChild(right_sphere_node);

            let projection = Mat4.perspective_fovx(0.125, 4 / 3, 0.125, 1024);
            let current_program = lit_program;

            let arm_rotation = 0;
            let sphere_rotation = 0;
            const ARM_ROTATION_SPEED = 0.5 / DESIRED_TICK_RATE;
            const SPHERE_ROTATION_SPEED = 2 / DESIRED_TICK_RATE;
            const SPHERE_ORBIT_RADIUS = 0.8;

            let terrain_material = 
                new LitMaterial(gl, 'tex/grass_lawn_seamless.png', gl.LINEAR, 0.2, 0.8, 0.05, 1.0);
            let track_material = 
                new LitMaterial(gl, 'tex/pebbles_seamless.png', gl.LINEAR, 0.2, 0.8, 0.05, 1.0);

            let terrainGen = new TerrainGenerator(gl, lit_program, 100, 128, [terrain_material, track_material]);
            let terrain_node = terrainGen.createTerrainNode();
            terrain_node.position.y = -2;
            scene_root.addChild(terrain_node);

            cam.translate(0, 5, -10);

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

                    job.mesh.render( gl );
                }
            }

            const KEYMAP = {
                'KeyW': function() { cam.move_in_direction( 0, 0, FLY_SPEED_PER_FRAME ); },
                'KeyS': function() { cam.move_in_direction( 0, 0, -FLY_SPEED_PER_FRAME ); },
                'KeyA': function() { cam.move_in_direction( -FLY_SPEED_PER_FRAME, 0, 0 ); },
                'KeyD': function() { cam.move_in_direction( FLY_SPEED_PER_FRAME, 0, 0 ); },
                'Space': function() { cam.translate( 0, FLY_SPEED_PER_FRAME, 0 ); },
                'KeyC': function() { cam.translate( 0, -FLY_SPEED_PER_FRAME, 0 ); },
                'KeyQ': function() { cam.add_roll( -ROTATION_SPEED_PER_FRAME ); },
                'KeyE': function() { cam.add_roll( ROTATION_SPEED_PER_FRAME ); },
                'ArrowLeft': function() { cam.add_yaw( -ROTATION_SPEED_PER_FRAME ); },
                'ArrowRight': function() { cam.add_yaw( ROTATION_SPEED_PER_FRAME ); },
                'ArrowUp': function() { cam.add_pitch( -ROTATION_SPEED_PER_FRAME ); },
                'ArrowDown': function() { cam.add_pitch( ROTATION_SPEED_PER_FRAME ); },
                'KeyT': function() { 
                    let camPos = new Vec4(cam.x, cam.y, cam.z, 1);
                    terrainGen.updateTerrain(camPos);
                },
            };

            function update() {
                let keys_down = keys.keys_down_list();

                for( const key of keys_down ) {
                   let bound_function = KEYMAP[ key ];

                   if( bound_function ) {
                       bound_function();
                   }
                }

                arm_rotation += ARM_ROTATION_SPEED;
                sphere_rotation += SPHERE_ROTATION_SPEED;

                arm_node.rotation.yaw = arm_rotation;

                left_sphere_node.position = {
                    x: Math.cos(sphere_rotation) * SPHERE_ORBIT_RADIUS,
                    y: Math.sin(sphere_rotation) * SPHERE_ORBIT_RADIUS,
                    z: 0
                };
                right_sphere_node.position = {
                    x: Math.cos(sphere_rotation + Math.PI) * SPHERE_ORBIT_RADIUS,
                    y: Math.sin(sphere_rotation + Math.PI) * SPHERE_ORBIT_RADIUS,
                    z: 0
                };

                left_box_node.rotation.roll += 0.02;
                right_box_node.rotation.pitch += 0.02;

                return;
            }
            
            requestAnimationFrame( render );
            setInterval( update, DESIRED_MSPT );