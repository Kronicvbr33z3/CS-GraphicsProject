let canvas = document.getElementById('the-canvas');
/** @type {WebGLRenderingContext} */
let gl = canvas.getContext('webgl2');

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
                uniform int use_color;

                void main( void ) {
                    vec4 tex_color;
                    if (v_material_index < 0.5) {
                        tex_color = texture(tex_0, v_uv);
                    } else if (v_material_index < 1.5) {
                        tex_color = texture(tex_1, v_uv);
                    } else {
                        tex_color = texture(tex_2, v_uv);
                    }
                    
                    // Separate handling for shooting stars vs regular objects
                    if (use_color == 1) {
                        // Shooting stars: self-illuminated with controlled alpha
                        vec3 starColor = v_color.rgb * tex_color.rgb * 0.8; // Reduced brightness
                        float alpha = tex_color.a * v_color.a * 0.7; // Reduced opacity
                        f_color = vec4(starColor, alpha);
                    } else {
                        // Regular objects: normal lit rendering
                        f_color = v_color * tex_color;
                    }
                }
            `;

let lit_program =
    create_compile_and_link_program(
        gl,
                    /*PHONG_VERTEX_SHADER,*/ GOURAUD_VERTEX_SHADER,
                    /*PHONG_FRAGMENT_SHADER,*/ GOURAUD_FRAGMENT_SHADER
    );

gl.useProgram(lit_program);

set_render_params(gl);

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
cam.translate(0, -1.5, -5);
cam.add_roll(Math.PI * 2);



let metal = new LitMaterial(gl, 'tex/metal.png', gl.LINEAR, 0.5, 1.0, 0.9, 20);
let sand = new LitMaterial(gl, 'tex/sand.png', gl.LINEAR, 0.4, 0.9, 0.2, 1.0);
let ground = new LitMaterial(gl, 'tex/ground.png', gl.LINEAR, 0.4, 0.9, 0.2, 1.0);
let snow = new LitMaterial(gl, 'tex/snow.png', gl.LINEAR, 0.5, 1.0, 0.3, 1.0);

// Initialize skybox
let skybox = new Skybox(gl, 'tex/Skybox.png');

let sun_dir = (new Vec4(0.2, 0.3, 0.5, 0.0)).norm();
let sun = new Light(sun_dir.x, sun_dir.y, sun_dir.z, 1.0, 0.4, 0.6, 0);
let light1 = new Light(0, 4, 4, 0.6, 0.2, 0.8, 1);
let carSpotlight = new Light(0, 4, 4, 0.8, 0.2, 1.0, 2);
let leftHeadlight = new Light(-0.4, -1.2, -15, 0.8, 0.7, 0.2, 3);
let rightHeadlight = new Light(0.4, -1.2, -15, 0.8, 0.7, 0.2, 4);

let scene_root = new Node();

let carNode = null;
let carPosition = { x: 0, y: -1.8, z: 0 };

// Initialize statue columns
const STATUE_SPACING = 18;
const STATUE_ROAD_OFFSET = 3.5;
const VISIBLE_STATUE_DISTANCE = 30;
const STATUE_START_OFFSET = -190;
let statueColumns = [];
let statueColumnsRoot = new Node();
scene_root.addChild(statueColumnsRoot);

// Function to create and position statue columns
function createStatueColumns(zPosition) {
    // Create left column
    let leftColumn = new StatueColumn(gl, lit_program);
    leftColumn.setPosition(-STATUE_ROAD_OFFSET, 0, zPosition);
    
    // Create right column
    let rightColumn = new StatueColumn(gl, lit_program);
    rightColumn.setPosition(STATUE_ROAD_OFFSET, 0, zPosition);
    
    statueColumns.push({ 
        z: zPosition, 
        columns: [leftColumn, rightColumn],
        nodes: [leftColumn.root, rightColumn.root]
    });
    
    statueColumnsRoot.addChild(leftColumn.root);
    statueColumnsRoot.addChild(rightColumn.root);
}

// Initial statue columns setup
for (let i = 0; i < 10; i++) {
    createStatueColumns(STATUE_START_OFFSET + (i * STATUE_SPACING));
}

const NUM_SHOOTING_STARS = 3;
let shootingStars = [];
let shootingStarsRoot = new Node();
scene_root.addChild(shootingStarsRoot);


for (let i = 0; i < NUM_SHOOTING_STARS; i++) {
    const star = new ShootingStar(gl, lit_program);
    star.reset(carPosition);
    shootingStars.push(star);
    shootingStarsRoot.addChild(star.node);
}

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

let initialSegments = terrainGen.updateTerrain({ x: 0, y: 0, z: 0 });
initialSegments.forEach(segment => terrain_root.addChild(segment));

loadCarModel();

let projection = Mat4.perspective_fovx(0.125, 4 / 3, 0.125, 1024);
let current_program = lit_program;

let arm_rotation = 0;
let sphere_rotation = 0;
const ARM_ROTATION_SPEED = 0.5 / DESIRED_TICK_RATE;
const SPHERE_ROTATION_SPEED = 2 / DESIRED_TICK_RATE;
const SPHERE_ORBIT_RADIUS = 0.8;

function render(now) {
    last_update = now;

    requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let view = cam.get_view_matrix();
    let aspect = canvas.width / canvas.height;
    let projection = Mat4.perspective(Math.PI / 4, aspect, 0.1, 10000.0);

    // Draw skybox first
    gl.depthMask(false);
    skybox.render(gl, projection.data, view.data);
    gl.depthMask(true);

    let render_jobs = generateRenderJobs(Mat4.identity(), scene_root);

    // First render regular scene
    gl.disable(gl.BLEND);
    gl.depthMask(true);

    // Render regular objects
    let regular_jobs = render_jobs.filter(job =>
        !(job.mesh === shootingStars[0].mesh));

    for (let job of regular_jobs) {
        let modelview = view.mul(job.matrix);

        gl.useProgram(current_program);

        set_uniform_matrix4(gl, current_program, 'projection', projection.data);
        set_uniform_matrix4(gl, current_program, 'modelview', modelview.data);
        set_uniform_matrix4(gl, current_program, 'model', job.matrix.data);
        set_uniform_matrix4(gl, current_program, 'view', view.data);
        set_uniform_vec3(gl, current_program, 'viewer_loc', cam.x, cam.y, cam.z);

        sun.bind(gl, current_program, modelview);
        light1.bind(gl, current_program, modelview);
        carSpotlight.bind(gl, current_program, modelview);
        leftHeadlight.bind(gl, current_program, modelview);
        rightHeadlight.bind(gl, current_program, modelview);

        // Check if job.mesh is an object with mesh and material properties
        if (job.mesh.mesh && job.mesh.material) {
            job.mesh.material.bind(gl, current_program, 0);
            job.mesh.mesh.render(gl);
        } else {
            job.mesh.render(gl);
        }
    }

    // Then render shooting stars with additive blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    let star_jobs = render_jobs.filter(job =>
        job.mesh === shootingStars[0].mesh);

    for (let job of star_jobs) {
        let modelview = view.mul(job.matrix);

        gl.useProgram(current_program);

        set_uniform_matrix4(gl, current_program, 'projection', projection.data);
        set_uniform_matrix4(gl, current_program, 'modelview', modelview.data);
        set_uniform_matrix4(gl, current_program, 'model', job.matrix.data);
        set_uniform_matrix4(gl, current_program, 'view', view.data);


        set_uniform_vec3(gl, current_program, 'sun_color', 0, 0, 0);
        set_uniform_vec3(gl, current_program, 'light1_color', 0, 0, 0);
        set_uniform_vec3(gl, current_program, 'light2_color', 0, 0, 0);
        set_uniform_vec3(gl, current_program, 'light3_color', 0, 0, 0);
        set_uniform_vec3(gl, current_program, 'light4_color', 0, 0, 0);

        job.mesh.render(gl);
    }

    gl.disable(gl.BLEND);
    gl.depthMask(true);
}

const KEYMAP = {
    'KeyQ': function () { cam.add_roll(-ROTATION_SPEED_PER_FRAME); },
    'KeyE': function () { cam.add_roll(ROTATION_SPEED_PER_FRAME); },
    'KeyT': function () {
        let camPos = new Vec4(cam.x, cam.y, cam.z, 1);
        terrainGen.updateTerrain(camPos);
    },
};

const STAR_UPDATE_INTERVAL = 32;
let lastStarUpdate = 0;
function update() {
    const now = performance.now();
    
    // Only update stars periodically
    if (now - lastStarUpdate > STAR_UPDATE_INTERVAL) {
        shootingStars.forEach(star => {
            star.update(STAR_UPDATE_INTERVAL / 1000, carPosition);
        });
        lastStarUpdate = now;
    }
    
    let keys_down = keys.keys_down_list();

    if (carNode) {
        carPosition.z += CAR_SPEED_PER_FRAME;
        carNode.position = carPosition;

        // Update statue columns
        const visibleDistance = VISIBLE_STATUE_DISTANCE;
        const currentSegment = Math.floor(carPosition.z / STATUE_SPACING);
        
        // Remove far behind columns
        statueColumns = statueColumns.filter(pair => {
            if (pair.z < carPosition.z - visibleDistance) {
                pair.nodes.forEach(node => statueColumnsRoot.removeChild(node));
                return false;
            }
            return true;
        });
        
        // Add new columns ahead
        const farthestZ = Math.max(...statueColumns.map(pair => pair.z), carPosition.z);
        if (farthestZ < carPosition.z + visibleDistance) {
            createStatueColumns(farthestZ + STATUE_SPACING);
        }
        
        // Update statue rotations
        statueColumns.forEach(pair => {
            pair.columns.forEach(column => {
                column.update(1.0 / DESIRED_TICK_RATE);
            });
        });

        leftHeadlight.x = carPosition.x - 0.4;
        leftHeadlight.y = carPosition.y - 1.2;
        leftHeadlight.z = carPosition.z + 6.0;

        rightHeadlight.x = carPosition.x + 0.4;
        rightHeadlight.y = carPosition.y - 1.2;
        rightHeadlight.z = carPosition.z + 6.0;

        cam.warp(
            carPosition.x,
            carPosition.y + 3.5,
            carPosition.z - 8.5
        );




    }

    for (const key of keys_down) {
        let bound_function = KEYMAP[key];
        if (bound_function) {
            bound_function();
        }
    }

    let camPos = { x: cam.x, y: cam.y, z: cam.z };
    let newSegments = terrainGen.updateTerrain(camPos);

    while (terrain_root.children.length > 0) {
        terrain_root.removeChild(terrain_root.children[0]);
    }

    newSegments.forEach(segment => terrain_root.addChild(segment));
    const deltaTime = 1.0 / DESIRED_TICK_RATE;
    shootingStars.forEach(star => {
        star.update(deltaTime, carPosition);
    });

    return;
}
requestAnimationFrame(render);
setInterval(update, DESIRED_MSPT);
