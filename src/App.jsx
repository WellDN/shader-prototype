import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import glsl from 'babel-plugin-glsl/macro'

// This shader is from Bruno Simons Threejs-Journey: https://threejs-journey.xyz
const WaveMaterial = shaderMaterial(
  {
    time: 0,
    colorStart: new THREE.Color('#FF0000'),
    colorMedium: new THREE.Color('#white'),
    colorEnd: new THREE.Color('red'),
  },
  glsl`
      varying vec2 vUv;
      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectionPosition = projectionMatrix * viewPosition;
        gl_Position = projectionPosition;
        vUv = uv;
      }`,
  glsl`
      #pragma glslify: cnoise3 = require(glsl-noise/classic/3d.glsl) 
      uniform float time;
      uniform vec3 colorStart;
      uniform vec3 colorMedium;
      uniform vec3 colorEnd;
      varying vec2 vUv;
      void main() {
        vec2 displacedUv = vUv + cnoise3(vec3(vUv * 1.0, time * 0.05));
        float strength = cnoise3(vec3(displacedUv * 10.0, time * 0.2));
        float outerGlow = distance(vUv, vec2(0.5)) * 2.0 - 0.5;
        strength += outerGlow;
        strength += step(-0.2, strength) * 0.6;
        strength = clamp(strength, 0.0, 1.0);
        vec3 color = mix(colorStart,  colorEnd, strength);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
)

extend({ WaveMaterial })

export { WaveMaterial }


function ShaderPlane() {
  const ref = useRef()
  const { width, height } = useThree((state) => state.viewport)
  useFrame((state, delta) => (ref.current.time += delta))
  return (
    <mesh scale={[width, height, 1]}>
      <planeGeometry />
      <waveMaterial ref={ref} key={WaveMaterial.key} toneMapped={true} colorStart={'#FF0000'} colorMedium={'white'} colorEnd={'black'} />
    </mesh>
  )
}

export default function App() {
  return (
    <Canvas>
      <ShaderPlane />
    </Canvas>
  )
}
