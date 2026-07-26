import { useState } from 'react'
import type { WorldId } from './types'
import { GameProvider } from './game/store'
import SoundToggle from './components/SoundToggle'
import Title from './screens/Title'
import WorldSelect from './screens/WorldSelect'
import Field2D from './field2d/Field2D'
import Battle from './screens/Battle'
import Equip from './screens/Equip'

export type Screen =
  | { name: 'title' }
  | { name: 'worlds' }
  | { name: 'map'; worldId: WorldId }
  | { name: 'battle'; stageId: string; mode: 'practice' | 'boss' }
  | { name: 'equip'; from: Screen }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'title' })

  return (
    <GameProvider>
      <div className="game-bg min-h-screen">
        {screen.name === 'title' && <Title onStart={() => setScreen({ name: 'worlds' })} />}
        {screen.name === 'worlds' && (
          <WorldSelect
            onSelectWorld={(worldId) => setScreen({ name: 'map', worldId })}
            onEquip={() => setScreen({ name: 'equip', from: { name: 'worlds' } })}
            onTitle={() => setScreen({ name: 'title' })}
          />
        )}
        {screen.name === 'map' && (
          <Field2D
            key={screen.worldId}
            worldId={screen.worldId}
            onBack={() => setScreen({ name: 'worlds' })}
            onEquip={() => setScreen({ name: 'equip', from: screen })}
            onBattle={(stageId, mode) => setScreen({ name: 'battle', stageId, mode })}
          />
        )}
        {screen.name === 'battle' && (
          <Battle
            key={`${screen.stageId}-${screen.mode}`}
            stageId={screen.stageId}
            mode={screen.mode}
            onExit={() => {
              const worldId = screen.stageId.split('-')[0] as WorldId
              setScreen({ name: 'map', worldId })
            }}
            onBoss={() => setScreen({ name: 'battle', stageId: screen.stageId, mode: 'boss' })}
          />
        )}
        {screen.name === 'equip' && <Equip onBack={() => setScreen(screen.from)} />}
        {/* 音のオン・オフ（どの画面でも 右下に つねに ある） */}
        <SoundToggle fixed />
      </div>
    </GameProvider>
  )
}
