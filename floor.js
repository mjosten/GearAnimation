
/*
* Function that will create a floor object for webgl to draw.
*/
function createFloor() {
    const vertices = [];
    const colors = [];
    const normals = [];

    var r, c;

    for (r = -20; r < 20; r++) {
        for (c = -20; c < 20; c++) {
            vertices.push(r,-1.2,c, r+1,-1.2,c, r,-1.2,c+1);

            colors.push(1,0,0, 1,0,0, 1,0,0);

            normals.push(0,1,0, 0,1,0, 0,1,0);

        }
    }


    return [vertices, colors, normals];
}