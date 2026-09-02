import { OFFICE_LAYOUT_CONFIG } from '../../config/officeLayout';
import { CoffeeStation } from './CoffeeStation';
import { CutawayWalls } from './CutawayWalls';
import { DioramaBase } from './DioramaBase';
import { LoungeArea } from './LoungeArea';
import { LowPolyChair } from './LowPolyChair';
import { LowPolyComputer } from './LowPolyComputer';
import { LowPolyDesk } from './LowPolyDesk';
import { LowPolyPlant } from './LowPolyPlant';
import { MeetingTable } from './MeetingTable';

export function OfficeEnvironment() {
  const { desks, plants, meeting } = OFFICE_LAYOUT_CONFIG;

  return (
    <group name="office-environment-root">
      {/* 1. Base e Piso recortado do diorama */}
      <DioramaBase />

      {/* 2. Paredes Norte e Oeste (Cutaway: Sul e Leste abertos) */}
      <CutawayWalls />

      {/* 3. Estações de Trabalho (4 Mesas, Monitores/Laptops e Cadeiras) */}
      <group name="workstations-group">
        {desks.map((desk) => {
          // Posição da cadeira calculada a partir do offset
          const chairPos: [number, number, number] = [
            desk.position[0] + desk.chairOffset[0],
            desk.position[1] + desk.chairOffset[1],
            desk.position[2] + desk.chairOffset[2],
          ];

          return (
            <group key={desk.id} name={`workstation-${desk.id}`}>
              {/* Mesa de Trabalho */}
              <group position={desk.position} rotation={[0, desk.rotationY, 0]}>
                <LowPolyDesk accentColor={desk.accentColor} />
                <LowPolyComputer isLaptop={desk.hasLaptop} />
              </group>

              {/* Cadeira de Escritório ergonômica */}
              <group position={chairPos}>
                <LowPolyChair color={desk.accentColor} rotationY={desk.rotationY} />
              </group>
            </group>
          );
        })}
      </group>

      {/* 4. Sala de Reunião com Mesa e 4 Cadeiras */}
      <group position={meeting.tablePosition}>
        <MeetingTable />
      </group>

      {/* 5. Área de Café (Balcão, Cafeteira Express, Mesinha Bistrô e Banquetas) */}
      <CoffeeStation />

      {/* 6. Lounge de Convivência (Sofá, Mesinha de Centro, Luminária e Tapete) */}
      <LoungeArea />

      {/* 7. Plantas Low-Poly distribuídas nas zonas */}
      <group name="office-plants-group">
        {plants.map((plant) => (
          <group key={plant.id} position={plant.position}>
            <LowPolyPlant scale={plant.scale} potType={plant.potType} />
          </group>
        ))}
      </group>
    </group>
  );
}
