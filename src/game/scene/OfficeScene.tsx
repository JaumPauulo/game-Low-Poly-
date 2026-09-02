import { OrthographicCamera } from '@react-three/drei';
import { SCENE_CONFIG } from '../config/sceneConfig';
import { AgentGroup } from '../entities/agents/AgentGroup';
import { OfficeEnvironment } from './office/OfficeEnvironment';

export function OfficeScene() {
  return (
    <>
      {/* Câmera ortográfica isométrica em ângulo 3/4 */}
      <OrthographicCamera
        makeDefault
        position={SCENE_CONFIG.camera.position}
        zoom={SCENE_CONFIG.camera.zoom}
        near={SCENE_CONFIG.camera.near}
        far={SCENE_CONFIG.camera.far}
      />

      {/* Iluminação suave e equilibrada sem efeitos dramáticos */}
      <ambientLight
        intensity={SCENE_CONFIG.lighting.ambientIntensity}
        color={SCENE_CONFIG.lighting.ambientColor}
      />
      <hemisphereLight
        args={[
          SCENE_CONFIG.lighting.hemisphereSkyColor,
          SCENE_CONFIG.lighting.hemisphereGroundColor,
          SCENE_CONFIG.lighting.hemisphereIntensity,
        ]}
      />
      <directionalLight
        position={SCENE_CONFIG.lighting.directionalPosition}
        intensity={SCENE_CONFIG.lighting.directionalIntensity}
        color={SCENE_CONFIG.lighting.directionalColor}
        castShadow
        shadow-mapSize-width={SCENE_CONFIG.lighting.shadowMapSize}
        shadow-mapSize-height={SCENE_CONFIG.lighting.shadowMapSize}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-bias={-0.0004}
      />

      {/* Cenário procedural do escritório */}
      <OfficeEnvironment />

      {/* Agentes autônomos procedurais chibi/minifig */}
      <AgentGroup />
    </>
  );
}
