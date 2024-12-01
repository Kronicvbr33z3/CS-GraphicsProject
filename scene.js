class Node {
    constructor(data = null) {

        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { roll: 0, pitch: 0, yaw: 0 };
        this.scale = { x: 1, y: 1, z: 1 };


        this.data = data;
        this.children = [];
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

    getMatrix() {
        let matrix = new Mat4();
        matrix = matrix.mul(Mat4.translation(this.position.x, this.position.y, this.position.z));
        matrix = matrix.mul(Mat4.rotation_xy(this.rotation.roll));  // roll is rotation around x
        matrix = matrix.mul(Mat4.rotation_xz(this.rotation.pitch)); // pitch is rotation around y
        matrix = matrix.mul(Mat4.rotation_yz(this.rotation.yaw));   // yaw is rotation around z
        matrix = matrix.mul(Mat4.scale(this.scale.x, this.scale.y, this.scale.z));
        return matrix;
    }
}


function generateRenderJobs(parentMatrix, node, jobs = []) {
    const currentMatrix = parentMatrix.mul(node.getMatrix());

    if (node.data) {
        jobs.push({ matrix: currentMatrix, mesh: node.data });
    }

    for (let child of node.children) {
        generateRenderJobs(currentMatrix, child, jobs);
    }

    return jobs;
}
