export const SOFT_CAGE_UNIFORM_GLSL = /* glsl */ `
  uniform vec3 uSoftLattice[27];
  uniform vec3 uSoftGrabLocal;
  uniform vec3 uSoftPinchLocal;
  uniform float uSoftGrabRadius;
  uniform mat4 uSoftRootWorldToLocal;
  uniform mat4 uSoftRootLocalToWorld;
  uniform vec3 uSoftBoundsMin;
  uniform vec3 uSoftBoundsMax;
  uniform vec3 uSoftPullLocal;
  uniform vec3 uSoftSurfaceNormalLocal;
  uniform float uSoftPullRatio;
  uniform float uSoftWholeCoupling;
  uniform float uSoftLocalGain;
  uniform float uSoftIndentStrength;
`;

export const SOFT_CAGE_FUNCTION_GLSL = /* glsl */ `
  vec3 softApplyCage(vec3 worldPosition) {
    vec3 localPosition = (uSoftRootWorldToLocal * vec4(worldPosition, 1.0)).xyz;
    vec3 boundsSize = max(uSoftBoundsMax - uSoftBoundsMin, vec3(0.0001));
    vec3 uv = clamp((localPosition - uSoftBoundsMin) / boundsSize, 0.0, 1.0);
    vec3 bx = vec3((1.0-uv.x)*(1.0-uv.x), 2.0*uv.x*(1.0-uv.x), uv.x*uv.x);
    vec3 by = vec3((1.0-uv.y)*(1.0-uv.y), 2.0*uv.y*(1.0-uv.y), uv.y*uv.y);
    vec3 bz = vec3((1.0-uv.z)*(1.0-uv.z), 2.0*uv.z*(1.0-uv.z), uv.z*uv.z);
    vec3 displacement = vec3(0.0);
    for (int z=0; z<3; z++) for (int y=0; y<3; y++) for (int x=0; x<3; x++) {
      displacement += uSoftLattice[x + y*3 + z*9] * bx[x] * by[y] * bz[z];
    }
    vec3 grabDelta = localPosition - uSoftGrabLocal;
    float pinchWeight = exp(-dot(grabDelta, grabDelta) / max(0.00001,uSoftGrabRadius*uSoftGrabRadius));
    localPosition += displacement + uSoftPinchLocal * pinchWeight;
    return (uSoftRootLocalToWorld * vec4(localPosition, 1.0)).xyz;
  }
`;
