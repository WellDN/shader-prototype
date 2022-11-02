import React, { Suspense, useRef, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useFBO, Stage, Effects } from '@react-three/drei'
import { FXAAShader } from 'three-stdlib'
import { AdditiveBlendingShader } from './shaders/AdditiveBlendingShader'
import { VolumetricLightShader } from './shaders/VolumetricLightShader'

const DEFAULT_LAYER = 0
const OCCLUSION_LAYER = 1

export function Model({ layer = DEFAULT_LAYER }) {
  const group = useRef()
  const { nodes, materials } = useGLTF("/hn.glb");

  useFrame(() => (group.current.rotation.y += 0.004))

  return (
    <group ref={group} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 3, 0]} scale={0.8}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_2.geometry}
          material={materials["null"]}
          layers={layer}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_3.geometry}
          material={materials["None.001"]}
          layers={layer}
        />
      </group>
    </group>
  );
}

function Post() {
  const { gl, camera, size } = useThree()
  const occlusionRenderTarget = useFBO()
  const occlusionComposer = useRef()
  const composer = useRef()
  useFrame(() => {
    camera.layers.set(OCCLUSION_LAYER)
    occlusionComposer.current.render()
    camera.layers.set(DEFAULT_LAYER)
    composer.current.render()
  }, 1)
  return (
    <>
      <mesh layers={OCCLUSION_LAYER} position={[0, 12, -10]}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial />
      </mesh>
      <Effects ref={occlusionComposer} disableGamma disableRender args={[gl, occlusionRenderTarget]} renderToScreen={false}>
        <shaderPass args={[VolumetricLightShader]} needsSwap={false} />
      </Effects>
      <Effects ref={composer} disableRender>
        <shaderPass args={[AdditiveBlendingShader]} uniforms-tAdd-value={occlusionRenderTarget.texture} />
        <shaderPass args={[FXAAShader]} uniforms-resolution-value={[1 / size.width, 1 / size.height]} renderToScreen />
      </Effects>
    </>
  )
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 12], fov: 35 }} gl={{ antialias: false }}>
    <color attach="background" args={['#050505']} />
      <Suspense fallback={null}>
        <Stage intensity={2}>
          <Model />
          <Model layer={OCCLUSION_LAYER} />
        </Stage>
        <Post />
      </Suspense>
    </Canvas>
  )
}
