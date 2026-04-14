interface Props {
  radius?: number
  modelUrl?: string
}

export function Floor({ radius = 20 }: Props) {
  return (
    <group>
      {/* Main carpet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color="#1a3a7a" roughness={0.9} />
      </mesh>
      {/* Outer bronze ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[radius - 1.5, radius - 1.3, 64]} />
        <meshStandardMaterial color="#CD7F32" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Centre crest ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[1.8, 2.2, 64]} />
        <meshStandardMaterial color="#CD7F32" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Crest centre disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[1.8, 48]} />
        <meshStandardMaterial color="#0E1A40" />
      </mesh>
    </group>
  )
}
