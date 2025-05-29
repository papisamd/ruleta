import { useState, useCallback, useRef, useEffect } from 'react'
import type { BetType } from './RouletteGame'
import { toast } from 'sonner'

export type GamePhase = 'select-chip' | 'betting' | 'spinning' | 'settled' | 'resetting'

export interface Bet {
  type: BetType;
  numbers: number[];
  amount: number;
  position: string;
}

export interface GameControllerState {
  phase: GamePhase;
  selectedChip: number;
  bets: Bet[];
  canBet: boolean;
  isSpinning: boolean;
  winningNumber: number | null;
  lastNumbers: number[];
  balance: number;
  totalBetAmount: number;
}

const INITIAL_BALANCE = 10000;
const BETTING_TIME = 20;

const PAYOUT_MULTIPLIERS: Record<BetType, number> = {
  'straight': 35,
  'split': 17,
  'street': 11,
  'corner': 8,
  'line': 5,
  'column': 2,
  'dozen': 2,
  'red': 1,
  'black': 1,
  'odd': 1,
  'even': 1,
  'low': 1,
  'high': 1
};

export function useGameController() {
  const [state, setState] = useState<GameControllerState>({
    phase: 'betting',
    selectedChip: 100,
    bets: [],
    canBet: true,
    isSpinning: false,
    winningNumber: null,
    lastNumbers: [],
    balance: INITIAL_BALANCE,
    totalBetAmount: 0,
  });

  const bettingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Inicializar audio
    audioRef.current = new Audio('/casino-ambiente.mp3');
    audioRef.current.loop = true;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Selección de ficha
  const selectChip = useCallback((value: number) => {
    if (state.phase === 'select-chip' || state.phase === 'betting') {
      setState(prev => ({ ...prev, selectedChip: value, phase: 'betting' }));
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [state.phase]);

  // Validar apuesta
  const validateBet = useCallback((betAmount: number) => {
    if (!state.canBet) {
      toast.error('No se pueden realizar apuestas en este momento');
      return false;
    }
    if (state.isSpinning) {
      toast.error('La ruleta está girando');
      return false;
    }
    if (betAmount > state.balance) {
      toast.error('Saldo insuficiente para esta apuesta');
      return false;
    }
    if (state.totalBetAmount + betAmount > state.balance) {
      toast.error('El total de apuestas excede tu saldo');
      return false;
    }
    return true;
  }, [state.balance, state.totalBetAmount, state.canBet, state.isSpinning]);

  // Colocar apuesta
  const placeBet = useCallback((bet: Omit<Bet, 'amount'>) => {
    if (!validateBet(state.selectedChip)) return;

    const newBet: Bet = { ...bet, amount: state.selectedChip };
    setState(prev => ({
      ...prev,
      bets: [...prev.bets, newBet],
      balance: prev.balance - state.selectedChip,
      totalBetAmount: prev.totalBetAmount + state.selectedChip,
      phase: 'betting',
    }));

    // Reiniciar timeout de apuestas
    if (bettingTimeoutRef.current) {
      clearTimeout(bettingTimeoutRef.current);
    }
    bettingTimeoutRef.current = setTimeout(() => {
      if (!state.isSpinning) {
        toast.info('¡Último momento para apostar!');
      }
    }, (BETTING_TIME - 5) * 1000);
  }, [state.selectedChip, validateBet, state.isSpinning]);

  // Calcular ganancias
  const calculateWinnings = useCallback((winningNum: number, bets: Bet[]): number => {
    return bets.reduce((total, bet) => {
      if (bet.numbers.includes(winningNum)) {
        const winAmount = bet.amount * (PAYOUT_MULTIPLIERS[bet.type] + 1);
        return total + winAmount;
      }
      return total;
    }, 0);
  }, []);

  // Iniciar giro
  const spin = useCallback(() => {
    if (state.bets.length === 0 || state.isSpinning || state.balance < 0) return;
    
    if (bettingTimeoutRef.current) {
      clearTimeout(bettingTimeoutRef.current);
    }

    setState(prev => ({ 
      ...prev, 
      isSpinning: true, 
      canBet: false, 
      phase: 'spinning' 
    }));

    // Reproducir sonido de giro
    if (audioRef.current) {
      audioRef.current.pause();
      const spinSound = new Audio('/spinning.mp3');
      spinSound.play().catch(() => {});
    }

    // Simular giro y calcular resultado
    setTimeout(() => {
      const winningNumber = Math.floor(Math.random() * 37);
      const winnings = calculateWinnings(winningNumber, state.bets);

      setState(prev => ({
        ...prev,
        isSpinning: false,
        winningNumber,
        lastNumbers: [winningNumber, ...prev.lastNumbers.slice(0, 9)],
        phase: 'settled',
        balance: prev.balance + winnings,
        bets: [],
        totalBetAmount: 0,
      }));

      // Mostrar resultado y preparar para siguiente ronda
      if (winnings > 0) {
        toast.success(`¡Ganaste ${winnings}!`, {
          duration: 4000 // Aumentar duración del toast
        });
        const winSound = new Audio('/ganador.mp3');
        winSound.play().catch(() => {});
      } else {
        toast.error('¡Mejor suerte la próxima!', {
          duration: 4000 // Aumentar duración del toast
        });
      }

      // Permitir nuevas apuestas después de un delay más largo
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          canBet: true,
          phase: 'betting',
          winningNumber: null,
        }));
      }, 4000); // Aumentado de 2000 a 4000ms
    }, 4000);
  }, [state.bets, state.isSpinning, state.balance, calculateWinnings]);

  // Reiniciar ronda
  const resetRound = useCallback(() => {
    if (state.isSpinning) return; // No permitir reset mientras gira
    setState(prev => ({
      ...prev,
      canBet: true,
      isSpinning: false,
      winningNumber: null,
      phase: 'betting',
      bets: [],
      totalBetAmount: 0,
    }));
  }, [state.isSpinning]);

  // Reiniciar saldo
  const resetBalance = useCallback(() => {
    setState(prev => ({
      ...prev,
      balance: INITIAL_BALANCE,
      bets: [],
      totalBetAmount: 0,
      lastNumbers: [],
      phase: 'betting', // Cambiado de 'select-chip' a 'betting'
      winningNumber: null,
      isSpinning: false,
      canBet: true,
    }));
  }, []);

  return {
    state,
    selectChip,
    placeBet,
    spin,
    resetRound,
    resetBalance,
  };
}
