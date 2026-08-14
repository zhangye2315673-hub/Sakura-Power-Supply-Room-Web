export const SOFT_CAGE_UNIFORM_GLSL = /* glsl */ `
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
    vec3 boundsCenter = (uSoftBoundsMin + uSoftBoundsMax) * 0.5;
    vec3 cageNormal = normalize(uSoftSurfaceNormalLocal);
    float axisExtent = max(dot(abs(cageNormal), boundsSize), 0.0001);
    float halfExtent = axisExtent * 0.5;
    float layer = clamp(
      dot(localPosition - boundsCenter, cageNormal) / halfExtent * 0.5 + 0.5,
      0.0,
      1.0
    );
    float layerEase = layer * layer * (3.0 - 2.0 * layer);
    float cageWeight = mix(uSoftWholeCoupling, uSoftLocalGain, layerEase);
    vec3 radial = localPosition - boundsCenter;
    radial -= cageNormal * dot(radial, cageNormal);

    localPosition += uSoftPullLocal * cageWeight;
    float squeezeRatio = min(
      length(uSoftPullLocal) * uSoftIndentStrength / axisExtent,
      0.34
    );
    localPosition -= cageNormal * dot(localPosition - boundsCenter, cageNormal) * squeezeRatio;
    localPosition += radial * (squeezeRatio * 0.85 + uSoftPullRatio * 0.055);
    return (uSoftRootLocalToWorld * vec4(localPosition, 1.0)).xyz;
  }
`;
