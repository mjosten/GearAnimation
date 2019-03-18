//  build the object, including geometry (triangle vertices)
//  and possibly colors and normals for each vertex

function createSurface() {
	const vertices = [];
    const colors = [];
    const normals = [];
    const point_vertices = [];

    var i,j,r,c,d, row;


    var control_pts = [];
    for (r = 0; r < 4; r++) {
        row = [];
    	for (c = 0; c < 4; c++) {
    		 row.push([r/2-1,2*Math.random()-1,c/2-1]);
    		 point_vertices.push(r/2-1, 2*Math.random()-1, c/2-1);
    	}
    	control_pts.push(row);
    }


    var factorial =  [1, 1, 2, 6, 24, 120, 720, 5040];

    function bincoeff(n, i) {
        var b = factorial[n] / (factorial[i]*factorial[(n-i)]);
        return b;
    }

    function B(n,i,u) {
        var b =  bincoeff(n,i)*Math.pow(u,i)*Math.pow(1-u,n-i);
        return b;
    }

    function point(u,v) {
        var pt = [0,0,0];
        var i,j;

        for (d = 0; d < 3; d++) {
        	for (i = 0; i <= 3; i++) {
        		for (j = 0; j <= 3; j++) {
        			pt[d] += B(3,i,u)*B(3,j,v)*control_pts[i][j][d];
        		}
        	}
        }

        return pt;
    }

    var s,t;
    for (s = 0; s < 1; s += 0.01) {
         for (t = 0; t < 1; t += 0.01) {

         	  
         	  var pt1 = point(s,t);
         	  var pt2 = point(s+0.01,t);
         	  var pt3 = point(s+0.01,t+0.01);

         	  var norm = calcNormal(pt1[0],pt1[1],pt1[2],
         	                        pt2[0],pt2[1],pt2[2],
         	                        pt3[0],pt3[1],pt3[2]); 
         
              	    
              vertices.push(pt1[0], pt1[1], pt1[2], pt2[0], pt2[1], pt2[2],pt3[0], pt3[1], pt3[2])  ;
              colors.push(1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0  );
              normals.push(norm[0],norm[1],norm[2], 
                           norm[0],norm[1],norm[2],
                           norm[0],norm[1],norm[2]);

         	  pt1 = point(s,t);
              pt2 = point(s+0.01,t+0.01); 
         	  pt3 = point(s,t+0.01);         	  
     	           	    
              vertices.push(pt1[0], pt1[1], pt1[2], pt2[0], pt2[1], pt2[2],pt3[0], pt3[1], pt3[2])  ;
              colors.push(1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0  );
              normals.push(norm[0],norm[1],norm[2], 
                           norm[0],norm[1],norm[2],
                           norm[0],norm[1],norm[2] );
         }
    }  
    

    return [vertices,colors,normals,point_vertices];
}


function calcNormal(x1, y1,  z1,
                    x2,  y2,  z2,
                    x3,  y3,  z3) {
              
    var ux = x2-x1, uy = y2-y1, uz = z2-z1;
    var vx = x3-x1, vy = y3-y1, vz = z3-z1;

    return [ uy * vz - uz * vy,
             uz * vx - ux * vz,
             ux * vy - uy * vx];
}