import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import glsl from 'babel-plugin-glsl/macro'


const WaveMaterial = shaderMaterial(
  {
    time: 0,
    colorOne: new THREE.Color(),
    colorTwo: new THREE.Color(),
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
      #pragma glslify: snoise4 = require(glsl-noise/simplex/4d.glsl) 
      uniform float time;
      uniform vec3 colorOne;
      uniform vec3 colorTwo;
      varying vec2 vUv;
      void main() {
        vec2 displacedUv = vUv + snoise4(vec4(vUv *     9.0, 4.0,    time * 0.05));
        float strength = snoise4(vec4(displacedUv *   1.0   , 1.0, time * 0.1));
        float outerGlow = distance(vUv, vec2(0.0)) *    0.5      - 1.0;
        strength += outerGlow *    strength;
        strength += step(-0.1, strength) *          1.5;
        strength = clamp(strength, 0.1, 1.0       );
        
        vec3 color = mix(colorOne,  colorTwo, strength);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
)

extend({ WaveMaterial })


function ShaderPlane() {
  const ref = useRef()
  const { width, height } = useThree((state) => state.viewport)
  useFrame((state, delta) => (ref.current.time += delta))
  return (
    <mesh scale={[width, height, 1]}>
      <planeGeometry />
      <waveMaterial ref={ref} key={WaveMaterial.key} toneMapped={true} colorOne={'#AA2929'} colorTwo={'#000000'} />
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
