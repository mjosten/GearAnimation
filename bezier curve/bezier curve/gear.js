main();


function main() {

  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl', {antialias: true}  );

  // If we don't have a GL context, give up now
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  
  var angle_x = 0;
  var angle_y = 0;

  var t = 0;


  // Vertex shader program, runs on GPU, once per vertex

  const vsSource = `
    precision mediump int;
    precision mediump float;

    attribute vec3 a_vertex;
    attribute vec3 a_color;   
    attribute vec3 a_normal; 
  
    uniform mat4 u_VM_transform; 
    uniform mat4 u_PVM_transform;     
    uniform vec3 u_light_dir;
  
    varying vec4 v_color;

    void main() {
      float cos;
      vec3 light_dir;
      vec3 normal;

      light_dir = normalize(u_light_dir);
      normal = normalize(  vec3(u_VM_transform *   vec4(a_normal,0.0))  );
     // normal = normalize(u_transform.xyz * a_normal);


      gl_Position = u_PVM_transform * vec4(a_vertex, 1.0);

      cos = dot(normal,light_dir);
      cos = clamp(cos, 0.0, 1.0);
      v_color = vec4(( (0.5+0.5*cos) * a_color), 1.0);
    }
  `;

  // Fragment shader program, runs on GPU, once per potential pixel

  const fsSource = `
    precision mediump int;
    precision mediump float;

    varying vec4 v_color;
    
    void main() {
      gl_FragColor = v_color;
    }
  `;

  // Initialize a shader program; this is where all 
  // the lighting for the objects, if any, is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Tell WebGL to use our program when drawing
  gl.useProgram(shaderProgram);

  // Collect all the info needed to use the shader program.
  // Look up locations of attributes and uniforms used by
  // our shader program  
  const programInfo = {
    program: shaderProgram,
    locations: {
      a_vertex: gl.getAttribLocation(shaderProgram, 'a_vertex'),
      a_color: gl.getAttribLocation(shaderProgram, 'a_color'),
      a_normal: gl.getAttribLocation(shaderProgram, 'a_normal'),      
      u_PVM_transform: gl.getUniformLocation(shaderProgram, 'u_PVM_transform'),
      u_VM_transform: gl.getUniformLocation(shaderProgram, 'u_VM_transform'),      
      u_light_dir: gl.getUniformLocation(shaderProgram, 'u_light_dir'),      
    },
  };

  // add an event handler so we can interactively rotate the model
  document.addEventListener('keydown', 

      function key_event(event) {

         if(event.keyCode == 37) {   //left
             angle_y -= 3;
         } else if(event.keyCode == 38) {  //top
             angle_x -= 3;
         } else if(event.keyCode == 39) {  //right
             angle_y += 3;
         } else if(event.keyCode == 40) {  //bottom
             angle_x += 3;
         }
    
         drawScene(gl, programInfo, buffers, angle_x, angle_y);
         return false;
      })


  // build the object(s) we'll be drawing, put the data in buffers
  const buffers = initBuffers(gl,programInfo);

  enableAttributes(gl,buffers,programInfo)



  self.animate = function () {

     // Draw the scene
     t++;

   if (t >  100)
       t = 0;    
                 
     drawScene(gl, programInfo, buffers, t);

     requestAnimationFrame(self.animate);
    
  };


  animate();


  
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple two-dimensional square.
//
function initBuffers(gl,programInfo) {

  gearData = createGear();
  vertices = gearData[0];
  colors = gearData[1]; 
  normals = gearData[2]; 

  // Create  buffers for the object's vertex positions
  const vertexBuffer = gl.createBuffer();
  
  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  // Now pass the list of vertices to the GPU to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(vertices),
                gl.STATIC_DRAW);


  // do likewise for colors
  const colorBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);  

  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(colors),
                gl.STATIC_DRAW); 


const normalBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);  

  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(normals),
                gl.STATIC_DRAW);                               

  return {
    // each vertex in buffer has 3 floats
    num_vertices: vertices.length / 3,
    vertex: vertexBuffer,
    color: colorBuffer,
    normal: normalBuffer
  };

}



function enableAttributes(gl,buffers,programInfo) {

    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

  // Tell WebGL how to pull vertex positions from the vertex
  // buffer. These positions will be fed into the shader program's
  // "a_vertex" attribute.

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
    gl.vertexAttribPointer(
        programInfo.locations.a_vertex,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.locations.a_vertex);


    // likewise connect the colors buffer to the "a_color" attribute
    // in the shader program
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.locations.a_color,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.locations.a_color);  

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
        programInfo.locations.a_normal,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.locations.a_normal);          

}


//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, t) {
  gl.clearColor(1.0, 1.0, 1.0, 1.0);  // Clear to white, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  //make transform to implement interactive rotation

  var matrix = new Learn_webgl_matrix();


  var lookat = matrix.create();


  
  var camera_location = [0,0,0];

  var control_points = [
                         [7, 7,  7],
                         [3, 6,   3],
                         [0, 4.5, -3],
                         [-3,3,  -6],                                                                           
                       ];

   // t/100.0
   var cp;

  //y = (1 − t)3, green: y= 3(1 − t)2 t, red: y= 3(1 − t) t2, and cyan: y = t3

   function weight(t) {
       return [  Math.pow(1-t,3), 3*Math.pow(1-t,2)*t, 3*(1-t)*Math.pow(t,2), Math.pow(t,3) ];
   }

   weights = weight(t/100);
   
   for (cp = 0; cp < 4; cp++ ) {
         
         camera_location[0] += weights[cp] * control_points[cp][0];
         camera_location[1] += weights[cp] * control_points[cp][1];
         camera_location[2] += weights[cp] * control_points[cp][2];

   }          

  


  //y = (1 − t)3, green: y= 3(1 − t)2 t, red: y= 3(1 − t) t2, and cyan: y = t3

  //matrix.lookAt(lookat,0,0,5, 0,0,0, 0,1,0);
  matrix.lookAt(lookat,
               // 5*Math.cos( t*Math.PI/180),0,5*Math.sin( t*Math.PI/180), 
                camera_location[0], camera_location[1], camera_location[2],
                0,0,0, 
                0,1,0);

  var proj = matrix.createFrustum(-1,1,-1,1,3,1000);  

  var rotate_x_matrix = matrix.create();
  var rotate_y_matrix = matrix.create();
  var transform = matrix.create(); 
  var scale = matrix.create();
  matrix.scale(scale,0.8,0.8,0.8);

  //matrix.rotate(rotate_x_matrix, angle_x, 1, 0, 0);
  //matrix.rotate(rotate_y_matrix, angle_y, 0, 1, 0);
    
  // Combine the two rotations into a single transformation
  matrix.multiplySeries(transform, proj, lookat,
        scale);

  // Set the shader program's uniform
  gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, 
                        false, transform);



  matrix.multiplySeries(transform, lookat,
        scale);

  // Set the shader program's uniform
  gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, 
                        false, transform);






  gl.uniform3f(programInfo.locations.u_light_dir, 1.0, 1.0, 1.0);


  { // now tell the shader (GPU program) to draw some triangles
    const offset = 0;
    gl.drawArrays(gl.TRIANGLES, offset, buffers.num_vertices);
  }
}

//
// Initialize a shader program, so WebGL knows how to draw our data
// BOILERPLATE CODE, COPY AND PASTE
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.  BOILERPLATE CODE, COPY AND PASTE
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}



/*
//  build the object, including geometry (triangle vertices)
//  and possibly colors and normals for each vertex
function createGear() {
    const vertices = [];
    const colors = [];
    var i;
    var x = -0.5, y = 0, z = 0;
    var r = 0.1, g = 0.5, b = 0.9;

     
    for (i = 0; i < 10; i++) {

         vertices.push(x,y,z)
         vertices.push(x+0.2,y,z)
         vertices.push(x+0.1,y+0.3,z)     

         colors.push(r,g,b);
         colors.push(r,g,b); 
         colors.push(r,g,b);
         
         r += 0.2
         g += 0.2
         b += 0.2
         if (r > 1)
             r -= 1
         if (g > 1)
             g -= 1
         if (b > 1)
             b -= 1                          
                                    
                     
         x += 0.1   
         z += -0.05
    }
    return [vertices,colors]
}
*/