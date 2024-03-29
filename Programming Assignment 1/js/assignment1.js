'use strict';
/* Antonis Zisis */

var gl;
var program;
var points = [];
var numDivisions = 4;
var _gasket = false;
var _initialRotation = 60;
var _fill = 'solid';

var originalTriangle = [
  vec2(-(Math.sqrt(3)/2), -0.5),   // bottom left
  vec2(0, 1),                      // top middle
  vec2((Math.sqrt(3)/2), -0.5)     // bottom right
];

var originalSquare = [
  vec2(-0.5, -0.5),
  vec2(0.5, -0.5),
  vec2(0.5, 0.5),
  vec2(0.5, 0.5),
  vec2(-0.5, 0.5),
  vec2(-0.5, -0.5)
];

var resetPoints = function() {
  points = [];
};

var addTriangle = function(bottomLeft, topMiddle, bottomRight) {
  points.push(bottomLeft, topMiddle, bottomRight);
};

var calculateMidPoint = function(vec2PointA, vec2PointB) {
  return mix(vec2PointA, vec2PointB, 0.5);
};

var calculateDistance = function(vec2Point) {
  var xSquared = Math.pow(vec2Point[0], 2);
  var ySquared = Math.pow(vec2Point[1], 2);
  return Math.sqrt(xSquared + ySquared);
};

var divideTriangle = function(a, b, c, count) {
  var ab,
    ac,
    bc;

  if (count === 0) {
      addTriangle(a, b, c);
  } else {
    ab = calculateMidPoint(a, b);
    ac = calculateMidPoint(a, c);
    bc = calculateMidPoint(b, c);

    divideTriangle(a, ab, ac, count-1);
    divideTriangle(c, ac, bc, count-1);
    divideTriangle(b, bc, ab, count-1);

    if (!_gasket) {
      divideTriangle(ac, ab, bc, count-1);
    }
  }
};

var addSquare = function(a, b, c, e) {
  points.push(a, b, c);
  points.push(c, e, a);
};

var divideSquare = function(a, b, c, e, count) {
  var ae,
    aebc,
    ab,
    bc,
    ce;

  if (count === 0) {
    addSquare(a, b, c, e);
  } else {
    ae = calculateMidPoint(a, e);
    ab = calculateMidPoint(a, b);
    bc = calculateMidPoint(b, c);
    ce = calculateMidPoint(c, e);
    aebc = calculateMidPoint(ae, bc);

    divideSquare(ab, b, bc, aebc, count-1);   // bottom right
    divideSquare(ae, aebc, ce, e, count-1);   // top left
    divideSquare(aebc, bc, c, ce, count-1);   // top right
    divideSquare(a, ab, aebc, ae, count-1);   // bottom left
  }
};

var render = function() {
  gl.clear( gl.COLOR_BUFFER_BIT );
  if (_fill === 'solid') {
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
  }
  if (_fill === 'mesh') {
    for (var i=0; i<points.length; i+=3) {
      gl.drawArrays( gl.LINE_LOOP, i, 3);
    }
  }
};

var loadBuffer = function(data) {
  var bufferId = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW );

  var vPosition = gl.getAttribLocation( program, 'vPosition' );
  gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );
};

var calculateRotation = function(vec2Point, theta) {
  var distance = calculateDistance(vec2Point);
  var originalX = vec2Point[0];
  var originalY = vec2Point[1];
  var newX = (originalX * Math.cos(distance * theta)) - (originalY * Math.sin(distance * theta));
  var newY = (originalX * Math.sin(distance * theta)) + (originalY * Math.cos(distance * theta));
  return vec2(newX, newY);
};

var doRotate = function(theta) {
    var radians = (Math.PI / 180) * theta;

    var rotatedPoints = points.map(function(vertex) {
      return calculateRotation(vertex, radians);
    });

    loadBuffer(rotatedPoints);
    render();
};

var doDivide = function(numDivisions) {
  resetPoints();
  divideTriangle(originalTriangle[0], originalTriangle[1], originalTriangle[2], numDivisions);
};

var doDivideSquare = function(numDivisions) {
  resetPoints();
  divideSquare(originalSquare[0], originalSquare[1], originalSquare[2], originalSquare[4], numDivisions);
  loadBuffer(points);
  render();
};

var updateTriangle = function(evt) {
  evt.preventDefault();
  if (evt.target.id === 'gasket') {
    if (document.getElementById('gasket').checked) {
      _gasket = true;
    } else {
      _gasket = false;
    }
  }
  if (document.getElementById('squareShape').checked) {
    document.getElementById('gasketGroup').style.visibility = 'hidden';
    doDivideSquare(document.getElementById('numDivisions').valueAsNumber);
  }
  if (document.getElementById('triangleShape').checked) {
    document.getElementById('gasketGroup').style.visibility = '';
    doDivide(document.getElementById('numDivisions').valueAsNumber);
  }
  var fills = document.getElementsByName('fill');
  for (var i = 0; i < fills.length; i++) {
    if (fills[i].checked) {
        _fill = fills[i].value;
        break;
    }
  }
  doRotate(document.getElementById('theta').valueAsNumber);
};

var doReset = function(evt) {
  evt.preventDefault();
  resetPoints();
  _gasket = false;
  _fill = 'solid';
  divideTriangle(originalTriangle[0], originalTriangle[1], originalTriangle[2], numDivisions);
  doRotate(_initialRotation);
  document.getElementById('theta').value = _initialRotation;
  document.getElementById('thetaValue').value = _initialRotation;
  document.getElementById('numDivisions').value = 4;
  document.getElementById('numDivisionsValue').value = 4;
  document.getElementById('gasket').checked = false;
  document.getElementById('gasketGroup').style.visibility = '';
  document.getElementById('triangleShape').checked = true;
  document.getElementById('fillSolid').checked = true;
  document.getElementById('gasketGroup').style.display = '';
};

window.onload = function init() {
  document.getElementById('settings').addEventListener('change', updateTriangle);
  document.getElementById('reset').addEventListener('click', doReset);

  var canvas = document.getElementById( 'gl-canvas' );
  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( 'WebGL isn\'t available' ); }

  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 0.350, 0.0, 0.0, 1.0 );

  program = initShaders( gl, 'vertex-shader', 'fragment-shader' );
  gl.useProgram( program );

  divideTriangle(originalTriangle[0], originalTriangle[1], originalTriangle[2], numDivisions);

  doRotate(_initialRotation);
};
