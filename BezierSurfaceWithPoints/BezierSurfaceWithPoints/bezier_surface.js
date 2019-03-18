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
  
    uniform mat4 u_PVM_transform; 
    uniform mat4 u_VM_transform;     
    uniform vec3 u_light_dir;
  
    varying vec4 v_color;

    void main() {
      float cos;
      vec3 light_dir;
      vec3 normal;

      gl_Position = u_PVM_transform * vec4(a_vertex, 1.0);

      
      light_dir = normalize( u_light_dir);
      //light_dir = normalize( vec3(u_VM_transform *   vec4(u_light_dir,0.0))  );
      normal = normalize(  vec3(u_VM_transform *   vec4(a_normal,0.0))  );
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


////////////////  NOW the point program .......


  const vsSourcePoint = `
     uniform mat4 u_PVM_transform; 
     attribute vec3 a_vertex;

     void main(void) {
          gl_Position =  u_PVM_transform * vec4(a_vertex, 1.0);   
          gl_PointSize = 10.0;
     }
  `;

  // Fragment shader program, runs on GPU, once per potential pixel

  const fsSourcePoint = `
     void main(void) {
         gl_FragColor = vec4(1.0, 0.0, 0.0, 0.1);
     }
  `;

  // Initialize a shader program; this is where all 
  // the lighting for the objects, if any, is established.
  const shaderProgramPoint = initShaderProgram(gl, vsSourcePoint, fsSourcePoint);





  // Tell WebGL to use our program when drawing
//  gl.useProgram(shaderProgram);

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
    
         drawScene(gl, programInfo, shaderProgram, shaderProgramPoint, buffers, angle_x, angle_y);
         return false;
      })


  // build the object(s) we'll be drawing, put the data in buffers
  const buffers = initBuffers(gl,programInfo);

  

  drawScene(gl, programInfo, shaderProgram, shaderProgramPoint, buffers, angle_x, angle_y);

}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple two-dimensional square.
//
function initBuffers(gl,programInfo) {

  surfaceData = createSurface();
  vertices = surfaceData[0];
  colors = surfaceData[1]; 
  normals = surfaceData[2]; 
  points = surfaceData[3];


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


  // for normals
  const normalBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);  

  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(normals),
                gl.STATIC_DRAW);  

  // for control points
  const pointsBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);  

  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(points),
                gl.STATIC_DRAW);                                               

  return {
    // each vertex in buffer has 3 floats
    num_vertices: vertices.length / 3,
    vertex: vertexBuffer,
    color: colorBuffer,
    normal: normalBuffer,
    points: pointsBuffer
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




function enableAttributesPoints(gl,buffers,shaderProgramPoint) {

    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

  // Tell WebGL how to pull vertex positions from the vertex
  // buffer. These positions will be fed into the shader program's
  // "a_vertex" attribute.

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.points);
    gl.vertexAttribPointer(
        gl.getAttribLocation(shaderProgramPoint, 'a_vertex'),
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        gl.getAttribLocation(shaderProgramPoint, 'a_vertex'));

}


//
// Draw the scene.
//
function drawScene(gl, programInfo, 
                   shaderProgram, shaderProgramPoint,
                   buffers, angle_x, angle_y) {

  gl.useProgram(shaderProgram);

  enableAttributes(gl,buffers,programInfo);  
                     
  gl.clearColor(0.0, 0.5, 0.0, 1.0);  // Clear to white, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  //make transform to implement interactive rotation

  var matrix = new Learn_webgl_matrix();

  var rotate_x = matrix.create();
  var rotate_y = matrix.create();
  matrix.rotate(rotate_x,angle_x,1,0,0);
  matrix.rotate(rotate_y,angle_y,0,1,0);
  var transform = matrix.create(); 
  var scale = matrix.create();
  matrix.scale(scale,0.8,0.8,0.8);




  var lookat = matrix.create();
  matrix.lookAt(lookat, 0,0,5, 0,0,0, 0,1,0);

  var proj = matrix.createFrustum(-1,1,-1,1,3,40);
    
  // Combine the two rotations into a single transformation
  matrix.multiplySeries(transform, proj, lookat, rotate_y, rotate_x, scale);

  // Set the shader program's uniform
  gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, 
                        false, transform);



  matrix.multiplySeries(transform, lookat, rotate_y, rotate_x, scale);

  // Set the shader program's uniform
  gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, 
                        false, transform);


  gl.uniform3f(programInfo.locations.u_light_dir, 1.0, 1.0, 4.0);


  { // now tell the shader (GPU program) to draw some triangles
    const offset = 0;
    gl.drawArrays(gl.TRIANGLES, offset, buffers.num_vertices);
  }


  // draw the points
  gl.useProgram(shaderProgramPoint);


  enableAttributesPoints(gl,buffers,shaderProgramPoint);  

  matrix.multiplySeries(transform, proj, lookat, rotate_y, rotate_x, scale);

  gl.uniformMatrix4fv( gl.getUniformLocation(shaderProgramPoint, 'u_PVM_transform'), 
                        false, transform);

  { // now tell the shader (GPU program) to draw some triangles
    const offset = 0;
    gl.drawArrays(gl.POINTS, offset, 16); // buffers.num_vertices);
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


