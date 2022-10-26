import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { MeshDistortMaterial, shaderMaterial } from '@react-three/drei'
import glsl from 'babel-plugin-glsl/macro'


const FormlessMaterial = shaderMaterial(
  {
    tie: 0,
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
  #pragma glslify: pnoise4 = require(glsl-noise/classic/4d.glsl);
  uniform float tie;
  uniform vec3 colorOne;
  uniform vec3 colorTwo;
  varying vec2 vUv;
  void main() {
    vec2 displacedUv = vUv + pnoise4(vec4(vUv * 9.0, 0, tie * 0.05));
    float strength = pnoise4(vec4(displacedUv * 1.0, 0, tie * 0.2));
    float outerGlow = distance(vUv, vec2(0.5)) * 2.0 - 0.5;
    strength += outerGlow * strength;
    strength += step(-0.2, strength) * 0.6;
    strength = clamp(strength, 0.0, 1.0);
    vec3 color = mix(colorOne, colorTwo, strength);
    gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
      )
      //THE OBJECT IS STATIC, JUST THE COLOR THAT CHANGES
      extend({ FormlessMaterial })
      
      
      function ShaderPlane() {
        const ref = useRef()
        const { width, height } = useThree((state) => state.viewport)
        useFrame((state, delta) => (ref.current.tie += delta))
        return (
    <mesh scale={[width, height, 1]}>
      <torusKnotBufferGeometry args={[2, 3, 3, 6]} />
      <MeshDistortMaterial distort={1} speed={5} />
      <formlessMaterial ref={ref} key={FormlessMaterial.key} toneMapped={true} colorOne={'#AA2929'} colorTwo={'#000000'} />
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
