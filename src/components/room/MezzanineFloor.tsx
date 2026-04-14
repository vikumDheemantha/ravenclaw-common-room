import * as THREE from 'three'

export const MEZZANINE_Y       = 8     // must equal STAIR_TOP_Y
const        MEZZANINE_INNER_R = 3.2   // open atrium hole radius
const        MEZZANINE_OUTER_R = 19.2  // flush with the inner wall surface

interface Props {
  innerRadius?: number
  outerRadius?: number
  y?: number
}

/**
 * Mezzanine (second floor) ring — the floor of the upper level.
 * Rendered with DoubleSide so the underside is visible as a ceiling from
 * the ground floor.  A inner balcony railing prevents walking off the edge.
 */
export function MezzanineFloor({
  innerRadius = MEZZANINE_INNER_R,
  outerRadius = MEZZANINE_OUTER_R,
  y = MEZZANINE_Y,
}: Props) {
  const POST_COUNT    = 36
  const RAIL_Y        = y + 1.0   // top of the handrail
  const RAIL_INNER_R  = innerRadius + 0.14

  return (
    <group>
      {/* ── Floor ring ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
        <ringGeometry args={[innerRadius, outerRadius, 64]} />
        <meshStandardMaterial
          color="#2a1f14"
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Bronze trim on the inner edge ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y + 0.008, 0]}>
        <ringGeometry args={[innerRadius, innerRadius + 0.18, 64]} />
        <meshStandardMaterial color="#CD7F32" metalness={0.55} roughness={0.45} />
      </mesh>

      {/* ── Inner railing posts ── */}
      {Array.from({ length: POST_COUNT }, (_, i) => {
        const a = (i / POST_COUNT) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * RAIL_INNER_R,
              y + 0.5,
              Math.sin(a) * RAIL_INNER_R,
            ]}
          >
            <cylinderGeometry args={[0.04, 0.04, 1.0, 8]} />
            <meshStandardMaterial color="#5a3e22" roughness={0.7} />
          </mesh>
        )
      })}

      {/* ── Inner handrail (flat torus ring) ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, RAIL_Y, 0]}>
        <torusGeometry args={[RAIL_INNER_R, 0.055, 8, 64]} />
        <meshStandardMaterial color="#8b5e2e" roughness={0.55} />
      </mesh>
    </group>
  )
}
