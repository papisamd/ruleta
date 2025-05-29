'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import RouletteWheel from './RouletteWheel'
import BettingTable from './BettingTable'
import ChipSelection from './ChipSelection'
import GameStats from './GameStats'
import { toast } from 'sonner'
import { cn, formatCurrency } from "@/lib/utils"
import { useGameController } from './useGameController'

// Constantes del juego
const INITIAL_BALANCE = 10000;
const BETTING_TIME = 30;
const MIN_BET = 100;
const SPIN_DURATION = 3000;
const MIN_SPIN_TIME = 2000;
const MAX_SPIN_TIME = 4000;
const SPIN_COMPLETE_DELAY = 3000;
const INITIAL_CHIP = 100;

// Tipos mejorados
export type BetType = 'straight' | 'split' | 'street' | 'corner' | 'line' | 'column' | 'dozen' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high';

export interface Bet {
  type: BetType;
  numbers: number[];
  amount: number;
  position: string;
}

export interface GameState {
  balance: number;
  currentBets: Bet[];
  lastNumbers: number[];
  isSpinning: boolean;
  winningNumber: number | null;
  totalBetAmount: number;
}

// Multiplicadores de pago
const PAYOUT_MULTIPLIERS: Record<BetType, number> = {
  'straight': 36,
  'split': 18,
  'street': 12,
  'corner': 9,
  'line': 6,
  'column': 3,
  'dozen': 3,
  'red': 2,
  'black': 2,
  'odd': 2,
  'even': 2,
  'low': 2,
  'high': 2
};

export default function RouletteGame() {
  const {
    state,
    selectChip,
    placeBet,
    spin,
    resetRound,
    resetBalance
  } = useGameController();

  return (
    <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
      {/* Panel izquierdo - Stats y controles */}
      <div className="xl:col-span-1 space-y-4 order-2 xl:order-1">
        <Card className="p-4 md:p-6 bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <div className="text-center space-y-4">
            {/* Balance */}
            <div className="flex flex-col items-center">
              <p className="text-gray-400 text-sm">Saldo</p>
              <p className="text-3xl font-bold text-green-400">{formatCurrency(state.balance)}</p>
            </div>

            {/* Sin saldo */}
            {state.balance === 0 && (
              <div className="flex flex-col items-center space-y-2 mt-4">
                <p className="text-red-400 font-bold text-lg">Sin saldo disponible</p>
                <Button onClick={resetBalance} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Recargar saldo
                </Button>
              </div>
            )}

            {/* Controles */}
            <div className="space-y-2">
              <Button
                onClick={spin}
                disabled={state.isSpinning || state.bets.length === 0 || state.balance === 0}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3"
              >
                {state.isSpinning ? 'GIRANDO...' : 'GIRAR RULETA'}
              </Button>

              <Button
                onClick={resetRound}
                disabled={state.isSpinning || state.bets.length === 0}
                variant="outline"
                className="w-full"
              >
                Limpiar Apuestas
              </Button>
            </div>
          </div>
        </Card>

        {/* Selección de fichas */}
        <Card className="p-4 md:p-6 bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <ChipSelection 
            selectedChip={state.selectedChip} 
            onSelectChip={selectChip}
            maxChip={state.balance}
          />
        </Card>

        {/* Estadísticas */}
        <Card className="p-4 md:p-6 bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <GameStats lastNumbers={state.lastNumbers} />
        </Card>
      </div>

      {/* Panel central - Ruleta y mesa */}
      <div className="xl:col-span-3 space-y-4 md:space-y-6 order-1 xl:order-2">
        <div className="flex justify-center items-center">
          <div className="w-full max-w-3xl">
            <RouletteWheel
              isSpinning={state.isSpinning}
              winningNumber={state.winningNumber}
              onSpinComplete={resetRound}
            />
          </div>
        </div>

        <div className="flex justify-center items-center">
          <div className="w-full max-w-4xl bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <BettingTable
              onPlaceBet={placeBet}
              currentBets={state.bets}
              selectedChip={state.selectedChip}
              canBet={state.canBet && !state.isSpinning && state.balance > 0}
              winningNumber={state.winningNumber}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
