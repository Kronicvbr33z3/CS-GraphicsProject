class Node {
    constructor(data = null) {
        // Position, rotation (roll, pitch, yaw), and scale vectors
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { roll: 0, pitch: 0, yaw: 0 };
        this.scale = { x: 1, y: 1, z: 1 };

        // Data can be a mesh, light, or other renderable object
        this.data = data;
        this.children = []; // Children nodes
    }

    // Add a child node
    addChild(child) {
        this.children.push(child);
        return child;
    }

    // Remove a child node
    removeChild(child) {
        this.children = this.children.filter(c => c !== child);
    }

    // Compute the model matrix for this node
    getMatrix() {
        let matrix = new Mat4(); // Assume Mat4 is your 4x4 matrix class
        matrix = matrix.mul(Mat4.translation(this.position.x, this.position.y, this.position.z));
        matrix = matrix.mul(Mat4.rotation_xy(this.rotation.roll));  // roll is rotation around x
        matrix = matrix.mul(Mat4.rotation_xz(this.rotation.pitch)); // pitch is rotation around y
        matrix = matrix.mul(Mat4.rotation_yz(this.rotation.yaw));   // yaw is rotation around z
        matrix = matrix.mul(Mat4.scale(this.scale.x, this.scale.y, this.scale.z));
        return matrix;
    }
}

// Generate the list of render jobs
function generateRenderJobs(parentMatrix, node, jobs = []) {
    // Compute this node's matrix
    const currentMatrix = parentMatrix.mul(node.getMatrix());

    // If this node has data (e.g., a mesh), add it to the render jobs
    if (node.data) {
        jobs.push({matrix: currentMatrix, mesh: node.data});
    }

    // Recursively process children
    for (let child of node.children) {
        generateRenderJobs(currentMatrix, child, jobs);
    }

    return jobs;
}
