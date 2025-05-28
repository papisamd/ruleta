'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import RouletteWheel from './RouletteWheel'
import BettingTable from './BettingTable'
import ChipSelection from './ChipSelection'
import GameStats from './GameStats'
import { toast } from 'sonner'
import { cn, formatCurrency } from "@/lib/utils"

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
  // Estado del juego
  const [gameState, setGameState] = useState<GameState>({
    balance: INITIAL_BALANCE,
    currentBets: [],
    lastNumbers: [],
    isSpinning: false,
    winningNumber: null,
    totalBetAmount: 0
  });

  const [selectedChip, setSelectedChip] = useState(INITIAL_CHIP);
  const [bettingTime, setBettingTime] = useState(BETTING_TIME);
  const [canBet, setCanBet] = useState(true);

  // Referencias para audio
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const ambientSoundRef = useRef<HTMLAudioElement | null>(null);

  // Referencias para timeouts
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bettingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup de recursos
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (bettingTimeoutRef.current) clearTimeout(bettingTimeoutRef.current);
      
      // Limpiar audio
      const audioElements = [spinSoundRef.current, winSoundRef.current, ambientSoundRef.current];
      audioElements.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);

  // Timer para las apuestas mejorado
  useEffect(() => {
    if (bettingTime > 0 && canBet && !gameState.isSpinning) {
      bettingTimeoutRef.current = setTimeout(() => setBettingTime(prev => prev - 1), 1000);
      return () => {
        if (bettingTimeoutRef.current) clearTimeout(bettingTimeoutRef.current);
      };
    }
    if (bettingTime === 0 && canBet) {
      setCanBet(false);
      toast.warning("¡No más apuestas!");
    }
  }, [bettingTime, canBet, gameState.isSpinning]);

  // Cálculo de ganancias mejorado con useMemo
  const calculateWinnings = useMemo(() => (bets: Bet[], winningNumber: number): number => {
    return bets.reduce((total, bet) => {
      if (bet.numbers.includes(winningNumber)) {
        const multiplier = PAYOUT_MULTIPLIERS[bet.type] || 2;
        return total + (bet.amount * multiplier);
      }
      return total;
    }, 0);
  }, []);

  // Función mejorada para colocar apuesta
  const placeBet = useCallback((bet: Omit<Bet, 'amount'>) => {
    if (!canBet || gameState.isSpinning || selectedChip > gameState.balance) {
      toast.error("No puedes apostar en este momento");
      return;
    }

    const newBet: Bet = { ...bet, amount: selectedChip } as Bet;

    setGameState(prev => ({
      ...prev,
      currentBets: [...prev.currentBets, newBet],
      balance: prev.balance - selectedChip,
      totalBetAmount: prev.totalBetAmount + selectedChip
    }));

    toast.success(`Apuesta de ${formatCurrency(selectedChip)} en ${bet.type}`);
  }, [canBet, gameState.isSpinning, gameState.balance, selectedChip]);

  // Función mejorada para girar la ruleta
  const spinRoulette = useCallback(() => {
    if (gameState.currentBets.length === 0) {
      toast.error("Debes hacer al menos una apuesta");
      return;
    }

    setGameState(prev => ({ ...prev, isSpinning: true }));
    setCanBet(false);

    // Iniciar sonido de giro
    if (spinSoundRef.current) {
      spinSoundRef.current.currentTime = 0;
      spinSoundRef.current.play().catch(() => {});
    }

    // Calcular tiempo aleatorio de giro
    const spinTime = Math.random() * (MAX_SPIN_TIME - MIN_SPIN_TIME) + MIN_SPIN_TIME;
    
    spinTimeoutRef.current = setTimeout(() => {
      const winningNumber = Math.floor(Math.random() * 37);
      const totalWinnings = calculateWinnings(gameState.currentBets, winningNumber);

      setGameState(prev => ({
        ...prev,
        isSpinning: false,
        winningNumber,
        lastNumbers: [winningNumber, ...prev.lastNumbers.slice(0, 9)],
        balance: prev.balance + totalWinnings,
        currentBets: [],
        totalBetAmount: 0
      }));

      // Reproducir sonido de victoria si hay ganancias
      if (totalWinnings > 0) {
        if (winSoundRef.current) {
          winSoundRef.current.currentTime = 0;
          winSoundRef.current.play().catch(() => {});
        }
        toast.success(`¡Ganaste ${formatCurrency(totalWinnings)}! Número: ${winningNumber}`);
      } else {
        toast.error(`Perdiste. Número ganador: ${winningNumber}`);
      }

      // Nuevo round
      setTimeout(() => {
        setBettingTime(BETTING_TIME);
        setCanBet(true);
      }, SPIN_COMPLETE_DELAY);
    }, spinTime);
  }, [gameState.currentBets, calculateWinnings]);

  // Función mejorada para limpiar apuestas
  const clearBets = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentBets: [],
      balance: prev.balance + prev.totalBetAmount,
      totalBetAmount: 0
    }));
    toast.info("Apuestas eliminadas");
  }, []);

  // Función mejorada para reiniciar saldo
  const resetBalance = useCallback(() => {
    setGameState({
      balance: INITIAL_BALANCE,
      currentBets: [],
      lastNumbers: [],
      isSpinning: false,
      winningNumber: null,
      totalBetAmount: 0
    });
    setCanBet(true);
    setBettingTime(BETTING_TIME);
    toast.info(`Saldo recargado a ${formatCurrency(INITIAL_BALANCE)}`);
  }, []);

  return (
    <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
      {/* Audio elements */}
      <audio ref={spinSoundRef} src="/casino-ambiente.mp3" preload="auto" />
      <audio ref={winSoundRef} src="/ganador.mp3" preload="auto" />
      <audio ref={ambientSoundRef} src="/relaxing.mp3" preload="auto" loop />

      {/* Panel izquierdo - Stats y controles */}
      <div className="xl:col-span-1 space-y-4 order-2 xl:order-1">
        <Card className="p-4 md:p-6 bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <div className="text-center space-y-4">
            {/* Balance */}
            <div className="flex flex-col items-center">
              <p className="text-gray-400 text-sm">Saldo</p>
              <p className="text-3xl font-bold text-green-400">{formatCurrency(gameState.balance)}</p>
            </div>

            {/* Sin saldo */}
            {gameState.balance === 0 && (
              <div className="flex flex-col items-center space-y-2 mt-4">
                <p className="text-red-400 font-bold text-lg">Sin saldo disponible</p>
                <Button onClick={resetBalance} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Recargar saldo
                </Button>
              </div>
            )}

            {/* Tiempo de apuesta */}
            {canBet && !gameState.isSpinning && gameState.balance > 0 && (
              <div className="flex flex-col items-center">
                <p className="text-gray-400 text-sm">Tiempo de apuesta</p>
                <p className="text-2xl font-bold text-yellow-400">{bettingTime}s</p>
              </div>
            )}

            {/* Controles */}
            <div className="space-y-2">
              <Button
                onClick={spinRoulette}
                disabled={gameState.isSpinning || gameState.currentBets.length === 0 || gameState.balance === 0}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3"
              >
                {gameState.isSpinning ? 'GIRANDO...' : 'GIRAR RULETA'}
              </Button>

              <Button
                onClick={clearBets}
                disabled={gameState.isSpinning || gameState.currentBets.length === 0}
                variant="outline"
                className="w-full"
              >
                Limpiar Apuestas
              </Button>
            </div>

            {/* Total apostado */}
            {gameState.totalBetAmount > 0 && (
              <div>
                <p className="text-gray-400 text-sm">Total Apostado</p>
                <p className="text-xl font-bold text-blue-400">
                  {formatCurrency(gameState.totalBetAmount)}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Selección de fichas */}
        <Card className="p-4 md:p-6 bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <ChipSelection 
            selectedChip={selectedChip} 
            onSelectChip={setSelectedChip}
            maxChip={gameState.balance}
          />
        </Card>

        {/* Estadísticas */}
        <Card className="p-4 md:p-6 bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <GameStats lastNumbers={gameState.lastNumbers} />
        </Card>
      </div>

      {/* Panel central - Ruleta y mesa */}
      <div className="xl:col-span-3 space-y-4 md:space-y-6 order-1 xl:order-2">
        <div className="flex justify-center items-center">
          <div className="w-full max-w-3xl">
            <RouletteWheel
              isSpinning={gameState.isSpinning}
              winningNumber={gameState.winningNumber}
              onSpinComplete={() => {
                if (spinSoundRef.current) {
                  spinSoundRef.current.pause();
                  spinSoundRef.current.currentTime = 0;
                }
              }}
            />
          </div>
        </div>

        <div className="flex justify-center items-center">
          <div className="w-full max-w-4xl bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <BettingTable
              onPlaceBet={placeBet}
              currentBets={gameState.currentBets}
              selectedChip={selectedChip}
              canBet={canBet && !gameState.isSpinning && gameState.balance > 0}
              winningNumber={gameState.winningNumber}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
