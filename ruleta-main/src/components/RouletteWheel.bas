'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RouletteWheelProps {
  isSpinning: boolean
  winningNumber: number | null
  onSpinComplete?: () => void
}

// Números de la ruleta europea en orden exacto del casino
const rouletteNumbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
]

const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
  if (num === 0) return 'green'
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
  return redNumbers.includes(num) ? 'red' : 'black'
}

const getColorName = (color: 'red' | 'black' | 'green'): string => {
  const colorNames = { red: 'ROJO', black: 'NEGRO', green: 'VERDE' }
  return colorNames[color]
}

export default function ProfessionalCasinoRoulette({ isSpinning, winningNumber, onSpinComplete }: RouletteWheelProps) {
  const [wheelRotation, setWheelRotation] = useState(0)
  const [ballAngle, setBallAngle] = useState(0)
  const [ballRadius, setBallRadius] = useState(240)
  const [ballSpeed, setBallSpeed] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'bouncing' | 'settled'>('idle')
  const [bounceCount, setBounceCount] = useState(0)
  const [soundEffect, setSoundEffect] = useState<'spin' | 'bounce' | 'settle' | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [jumping, setJumping] = useState(false)
  
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const lastBounceTime = useRef<number>(0)
  const phaseRef = useRef(phase)
  const ballAngleRef = useRef(0)
  const ganadorAudioRef = useRef<HTMLAudioElement>(null)
  const isFirstSpinRef = useRef(true)

  // Mantener la referencia del phase actualizada
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // Mantener la referencia del angle de la bola actualizada
  useEffect(() => {
    ballAngleRef.current = ballAngle
  }, [ballAngle])

  // Inicialización del componente
  useEffect(() => {
    setIsClient(true)
    // Inicializar con un valor aleatorio para que la primera animación sea diferente cada vez
    const randomStart = Math.random() * 360;
    setBallAngle(randomStart);
    ballAngleRef.current = randomStart;
    setBallSpeed(0);
  }, [])

  // Efecto para manejar el inicio del giro
  useEffect(() => {
    if (isSpinning && phase === 'idle') {
      // Siempre establecer una posición inicial aleatoria al comenzar un nuevo giro
      const randomStart = Math.random() * 360;
      setBallAngle(randomStart);
      ballAngleRef.current = randomStart;
      isFirstSpinRef.current = false;
      
      startTimeRef.current = Date.now();
      setPhase('spinning');
      setBallSpeed(INITIAL_BALL_SPEED);
      setSoundEffect('spin');
    }
  }, [isSpinning, phase]);

  const resetToIdle = useCallback(() => {
    setPhase('idle')
    setSoundEffect(null)
    setBallRadius(240)
    setBallSpeed(0)
    setBounceCount(0)
    setWheelRotation(prev => prev % 360)
    isFirstSpinRef.current = true // Asegurar posición aleatoria en el siguiente giro
    setWheelRotation(prev => prev % 360) // Mantener la rotación actual pero normalizada
    isFirstSpinRef.current = true // <-- Esto asegura que el primer giro tras cada reset sea aleatorio
    // No reiniciar el ángulo de la bola a 0
  }, [])

  const getNumberPosition = useCallback((index: number) => {
    // Calculamos el ángulo exacto (9.73° entre números)
    const angle = (index * (360 / 37)) // Correcto para 37 números (0-36)
    // Radio ajustado para mejor visualización
    const radius = 170 // Este es el radio donde se posicionan los números
    // Convertimos el ángulo a radianes y ajustamos el offset
    const radians = (angle - 90) * (Math.PI / 180) // El -90 es para empezar desde la parte superior
    // Calculamos las coordenadas con mayor precisión
    const x = radius * Math.cos(radians)
    const y = radius * Math.sin(radians)
    // El ángulo de rotación es el complementario para que apunte hacia afuera
    const rotationAngle = angle - 90 // Para orientar el texto del número hacia afuera
    return { angle: rotationAngle, x, y, baseAngle: angle }
  }, [])

  const getWinnerPosition = useCallback(() => {
    if (winningNumber === null) return { x: 0, y: 0, angle: 0 };
    const index = rouletteNumbers.indexOf(winningNumber);
    return getNumberPosition(index);
  }, [winningNumber, getNumberPosition]);

  const settleOnWinningNumber = useCallback(() => {
    if (winningNumber !== null) {
      const numberIndex = rouletteNumbers.indexOf(winningNumber)
      if (numberIndex !== -1) {
        const { angle } = getNumberPosition(numberIndex)
        const currentAngle = ballAngleRef.current
        
        // Calcular la ruta más corta hacia el ángulo final
        const diff = ((angle - currentAngle + 540) % 360) - 180
        
        // Primero suavizar el movimiento de la bola
        setBallAngle(prev => prev + diff * 0.8)
        setBallRadius(177) // Ligeramente por encima del radio final
        
        // Asentar suavemente en el número ganador
        setTimeout(() => {
          setBallAngle(angle)
          setBallRadius(175)
          
          // Callback después de que la animación se complete
          setTimeout(() => {
            if (onSpinComplete) onSpinComplete()
            setSoundEffect(null)
          }, 1000)
        }, 300)
      }
    }
  }, [winningNumber, onSpinComplete, getNumberPosition])

  // Velocidades y tiempos fijos para consistencia
  const INITIAL_BALL_SPEED = 12 // Velocidad inicial de la bola aumentada
  const INITIAL_WHEEL_SPEED = 4
  const SPIN_DURATION = 8 // Duración en segundos
  const BOUNCE_DURATION = 3
  const BOUNCE_COUNT = 8
  const BALL_ROTATIONS = 15 // Número de rotaciones completas de la bola

  useEffect(() => {
    if (!isSpinning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const animate = () => {
      const now = Date.now()
      const elapsed = (now - startTimeRef.current) / 1000
      const currentPhase = phaseRef.current

      // Animación de la rueda con velocidad variable
      const wheelProgress = Math.min(1, elapsed / SPIN_DURATION)
      const wheelEasing = 1 - Math.pow(1 - wheelProgress, 3) // Easing cúbico
      const currentWheelSpeed = INITIAL_WHEEL_SPEED * (1 - wheelEasing * 0.7)
      setWheelRotation(prev => prev + currentWheelSpeed * 6)

      if (currentPhase === 'spinning') {
        // Velocidad y radio de la bola durante el giro
        const spinProgress = Math.min(1, elapsed / SPIN_DURATION)
        const ballSpeedEasing = 1 - Math.pow(1 - spinProgress, 4) // Easing cuártico
        
        // La bola comienza rápido y va desacelerando
        const currentBallSpeed = INITIAL_BALL_SPEED * (1 - ballSpeedEasing * 0.8)
        
        // Radio de la bola disminuye gradualmente
        const startRadius = 240
        const endRadius = 180
        const radiusProgress = Math.pow(spinProgress, 2) // Easing cuadrático
        const currentRadius = startRadius - (startRadius - endRadius) * radiusProgress
        
        // Calcular ángulo de la bola con rotaciones adicionales
        const totalRotations = BALL_ROTATIONS * 360 // Grados totales de rotación
        const baseAngle = totalRotations * (1 - Math.pow(1 - spinProgress, 2))
        const wobble = Math.sin(spinProgress * Math.PI * 8) * (1 - spinProgress) * 10
        
        setBallAngle(prev => {
          const next = (baseAngle + wobble) % 360
          ballAngleRef.current = next
          return next
        })
        
        setBallRadius(currentRadius)
        setBallSpeed(currentBallSpeed)

        // Transición a fase de rebote
        if (spinProgress >= 1) {
          setPhase('bouncing')
          setBounceCount(0)
          setSoundEffect('bounce')
          lastBounceTime.current = now
        }
      } else if (currentPhase === 'bouncing') {
        const bounceElapsed = elapsed - SPIN_DURATION
        const bounceProgress = Math.min(1, bounceElapsed / BOUNCE_DURATION)
        
        // Funciones de easing mejoradas para un rebote más realista
        const easeOutQuart = 1 - Math.pow(1 - bounceProgress, 4)
        const easeOutCirc = Math.sqrt(1 - Math.pow(bounceProgress - 1, 2))
        
        // Ajustar frecuencia y amplitud de rebote
        const bouncePhase = (1 - easeOutCirc) * Math.PI * BOUNCE_COUNT * 2
        const dampingFactor = Math.exp(-4 * bounceProgress)
        
        // Componentes de rebote con movimiento más natural
        const verticalBounce = Math.sin(bouncePhase) * dampingFactor
        const horizontalBounce = Math.cos(bouncePhase * 0.8) * dampingFactor * 0.7
        
        // Radio de la bola durante el rebote
        const baseRadius = 180
        const radiusRange = 60 * dampingFactor
        const targetRadius = baseRadius + verticalBounce * radiusRange
        
        // Rotación de la bola durante el rebote
        const angleRange = 30 * dampingFactor
        const angleOffset = horizontalBounce * angleRange
        
        // Actualizar posición con movimiento fluido
        const rotationSpeed = 0.5 * (1 - easeOutQuart)
        const smoothRotation = (rotationSpeed + horizontalBounce) * 3

        setBallAngle(prev => {
          const next = (prev + smoothRotation + angleOffset) % 360
          ballAngleRef.current = next
          return next
        })
        setBallRadius(targetRadius)

        // Actualizar contador de rebotes
        if (bounceProgress < 0.8) { // Solo contar rebotes en el 80% inicial
          const instantaneousHeight = verticalBounce * radiusRange
          if (instantaneousHeight > 5 && now - lastBounceTime.current > 200) {
            setBounceCount(prev => {
              lastBounceTime.current = now
              return Math.min(prev + 1, BOUNCE_COUNT)
            })
          }
        }

        // Transición a settled
        if (bounceProgress >= 1) {
          setPhase('settled')
          setSoundEffect('settle')
          settleOnWinningNumber()
          return
        }
      }
      
      // Continuar animación
      if ((currentPhase === 'spinning' || currentPhase === 'bouncing') && isSpinning) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isSpinning, settleOnWinningNumber])

  const renderNumber = useCallback((number: number, index: number) => {
    const { x, y, angle } = getNumberPosition(index)
    const color = getNumberColor(number)
    const isWinning = winningNumber === number && phase === 'settled'
    const colorClasses = {
      red: 'bg-gradient-to-br from-red-600 via-red-700 to-red-800 shadow-red-900/50',
      black: 'bg-gradient-to-br from-gray-700 via-gray-800 to-black shadow-black/70',
      green: 'bg-gradient-to-br from-green-600 via-green-700 to-green-800 shadow-green-900/50'
    }
    return (
      <div
        key={number}
        className="absolute origin-center"
        style={{
          top: '50%',
          left: '50%',
          width: '40px', // Aumentado de 36px
          height: '40px', // Aumentado de 36px
          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle}deg)`,
          zIndex: isWinning ? 20 : 10
        }}
      >
        <div className="relative z-20">
          <div 
            className={`w-[40px] h-[40px] rounded-lg shadow-2xl flex items-center justify-center text-white ${isWinning ? 'text-xl' : 'text-lg'} font-bold transform-gpu transition-all duration-500
              ${colorClasses[color]}
              ${isWinning ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-amber-900 scale-150 shadow-2xl shadow-yellow-400/80 animate-pulse neon-glow' : 'hover:scale-105'}`}
            style={{
              transform: `rotate(${angle + 90}deg) scale(0.95)`,
              boxShadow: isWinning 
                ? '0 0 40px 15px rgba(255,215,0,0.4), 0 0 80px 25px rgba(255,215,0,0.3), inset 0 0 20px rgba(255,255,255,0.4)' 
                : 'inset 0 2px 4px rgba(255, 255, 255, 0.1), 0 4px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <span className="drop-shadow-lg font-extrabold tracking-tight transform-gpu">{number}</span>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
            {isWinning && (
              <>
                <div className="absolute inset-0 rounded-lg bg-amber-400/20 animate-ping" />
                <div className="absolute -inset-2 rounded-xl border-2 border-amber-400 animate-pulse opacity-50" />
                <div className="absolute inset-0 rounded-lg pointer-events-none" style={{boxShadow:'0 0 24px 8px rgba(255,215,0,0.3), 0 0 48px 16px rgba(255,215,0,0.2)'}} />
              </>
            )}
          </div>
        </div>
        {/* Bola sobre el número ganador */}
        {isWinning && phase === 'settled' && (
          <div
            className="absolute left-1/2 top-[140%] -translate-x-1/2 w-5 h-5 z-50 transform-gpu"
            style={{
              transform: 'translateX(-50%)',
              transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div className="relative w-full h-full rounded-full transition-all duration-500">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 shadow-lg relative overflow-hidden">
                <div className="absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white opacity-90 blur-[0.5px]" />
                <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white opacity-70" />
                <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-white/40" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200/30 via-transparent to-transparent animate-pulse" />
              </div>
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-1 bg-black/20 rounded-full blur-[2px] transition-all duration-300"
                style={{ opacity: 0.4 }}
              />
            </div>
          </div>
        )}
        {/* Base para la bola, debajo del número */}
        <div 
          className={`absolute top-[120%] left-1/2 -translate-x-1/2 w-8 h-3 rounded-lg shadow-inner transform-gpu transition-all duration-300 z-10
            ${isWinning ? 'bg-yellow-400/70 ring-2 ring-yellow-300 ring-offset-2 animate-pulse neon-glow' : 'bg-amber-700/30'}`}
          style={{
            transform: `translateX(-50%) rotate(-90deg)`,
            backgroundImage: `linear-gradient(to bottom, ${isWinning ? 'rgba(250, 204, 21, 0.8)' : 'rgba(217, 119, 6, 0.4)'}, transparent)`,
            boxShadow: isWinning 
              ? '0 0 16px 6px #ffe066, 0 0 32px 12px #ffd700, 0 0 8px 2px #fffbe6, inset 0 1px 2px rgba(255,255,255,0.5)' 
              : 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.2)'
          }} 
        />
      </div>
    )
  }, [getNumberPosition, winningNumber, phase])

  // Nuevo: botón de reset visual (opcional)
  const handleReset = () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload()
    }
  }

  useEffect(() => {
    if (!isClient) return;
    const handleWheel = (e: WheelEvent) => {
      // Permitir scroll vertical natural
      if (window.innerHeight < document.body.scrollHeight) return;
      // Si no hay scroll vertical, simularlo moviendo la pantalla
      window.scrollBy({
        top: e.deltaY,
        behavior: 'smooth'
      });
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isClient])

  useEffect(() => {
    if (phase === 'settled' && winningNumber !== null) {
      if (ganadorAudioRef.current) {
        ganadorAudioRef.current.currentTime = 0
        ganadorAudioRef.current.play()
      }
      // Ejecutar onSpinComplete después de un pequeño delay para permitir las animaciones
      const timer = setTimeout(() => {
        if (onSpinComplete) {
          onSpinComplete()
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, winningNumber, onSpinComplete])

  if (!isClient) return null

  return (
    <div className="relative flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4 md:p-8">
      <audio ref={ganadorAudioRef} src="/ganador.mp3" preload="auto" />
      <div className="absolute inset-0 bg-gradient-to-br from-green-800 via-green-900 to-black opacity-90 border-0" />
      
      {/* Panel del número ganador (siempre visible) */}
      <div className="fixed top-4 right-4 z-50">
        {phase === 'settled' && typeof winningNumber === 'number' && (
          <div className="flex flex-col items-center gap-2 bg-black/40 rounded-lg p-3 backdrop-blur-md 
                          border border-white/10 shadow-lg animate-in fade-in slide-in-from-right duration-300">
            <p className="text-xl font-bold text-emerald-400">Número Ganador</p>
            <div className={cn(
                'w-28 h-28 rounded-full flex items-center justify-center text-6xl font-bold text-white shadow-2xl relative overflow-hidden transform transition-all duration-1000',
                'animate-bounce-effect bg-gradient-to-br',
                {
                  'from-red-500 via-red-600 to-red-700 ring-4 ring-red-300': getNumberColor(winningNumber) === 'red',
                  'from-gray-700 via-gray-800 to-gray-900 ring-4 ring-gray-400': getNumberColor(winningNumber) === 'black',
                  'from-green-500 via-green-600 to-green-700 ring-4 ring-green-300': getNumberColor(winningNumber) === 'green'
                }
              )}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <span className="relative z-10 drop-shadow-lg transform scale-125 transition-transform duration-1000">{winningNumber}</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent animate-pulse" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            <p className="mt-4 text-2xl font-semibold">
              <span className={cn('', {
                'text-red-400': getNumberColor(winningNumber) === 'red',
                'text-gray-300': getNumberColor(winningNumber) === 'black',
                'text-green-400': getNumberColor(winningNumber) === 'green'
              })}>
                {getColorName(getNumberColor(winningNumber))}
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="relative w-full max-w-[700px] mx-auto">
        <Card className="relative bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 p-8 md:p-12 rounded-full shadow-2xl border-0 aspect-square flex items-center justify-center">
          
          {/* Indicador de sonido */}
          <div className="absolute top-6 right-6 z-40">
            {soundEffect && (
              <div className="text-white/60 text-sm font-mono bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                {soundEffect === 'spin' && '🎵 Girando...'}
                {soundEffect === 'bounce' && '🔊 Rebotando...'}
                {soundEffect === 'settle' && '✨ ¡Listo!'}
              </div>
            )}
          </div>

          <div className="relative w-full h-full flex items-center justify-center">
            {/* Rueda principal */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 shadow-2xl transition-transform duration-100 ease-linear transform-gpu"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transformOrigin: 'center center',
                boxShadow: 'inset 0 0 60px 20px rgba(0,0,0,0.5)'
              }}
            >
              {/* Números */}
              {rouletteNumbers.map((number, index) => {
                const { x, y, angle } = getNumberPosition(index)
                const color = getNumberColor(number)
                const isWinning = winningNumber === number && phase === 'settled'
                const colorClasses = {
                  red: `bg-gradient-to-br ${isWinning ? 'from-red-400 via-red-600 to-red-700' : 'from-red-600 via-red-700 to-red-800'} shadow-red-900/50`,
                  black: `bg-gradient-to-br ${isWinning ? 'from-gray-600 to-black' : 'from-gray-700 via-gray-800 to-black'} shadow-black/70`,
                  green: `bg-gradient-to-br ${isWinning ? 'from-green-400 via-green-600 to-green-700' : 'from-green-600 via-green-700 to-green-800'} shadow-green-900/50`
                }
                return (
                  <div
                    key={number}
                    className="absolute origin-center"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '36px',
                      height: '36px',
                      transform: `
                        translate(-50%, -50%)
                        translate(${x}px, ${y}px)
                        rotate(${angle}deg)
                      `,
                      transformOrigin: 'center center',
                      zIndex: isWinning ? 20 : 10
                    }}
                  >
                    <div className="relative z-20">
                      <div 
                        className={`absolute drop-shadow-lg font-black flex items-center justify-center text-white/90 transition-all duration-300 ${
                          isWinning
                            ? 'w-[48px] h-[48px] z-20 text-4xl animate-bounce'
                            : 'w-[36px] h-[36px] text-lg'
                        } rounded-full bg-opacity-90 ${getNumberColor(number) === 'red' 
                          ? 'bg-gradient-to-br from-red-600/95 via-red-700/90 to-red-800/95' 
                          : getNumberColor(number) === 'black' 
                            ? 'bg-gradient-to-br from-gray-700/95 via-gray-800/90 to-black/95' 
                            : 'bg-gradient-to-br from-green-600/95 via-green-700/90 to-green-800/95'
                        }`}
                        style={{
                          transform: `
                            rotate(${90}deg)
                            scale(${isWinning ? 1.2 : 0.95})
                          `,
                          transformOrigin: 'center center',
                          boxShadow: isWinning 
                            ? '0 0 40px 15px rgba(255,215,0,0.4), 0 0 80px 25px rgba(255,215,0,0.3), inset 0 0 20px rgba(255,255,255,0.4)' 
                            : 'inset 0 1px 2px rgba(255, 255, 255, 0.05), 0 4px 8px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        <span className={`drop-shadow-sm font-extrabold tracking-tight ${isWinning ? 'text-2xl' : 'text-lg'}`}>{number}</span>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                        {isWinning && (
                          <>
                            <div className="absolute inset-0 rounded-lg bg-yellow-400/15 animate-ping" />
                            <div className="absolute -inset-1 rounded-xl border border-yellow-400/40 animate-pulse opacity-40" />
                            <div className="absolute inset-0 rounded-lg pointer-events-none" style={{boxShadow:'0 0 24px 8px rgba(255,215,0,0.25), 0 0 48px 16px rgba(255,215,0,0.15)'}} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Centro de la rueda mejorado */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 aspect-square rounded-full bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 shadow-[0_0_60px_15px_rgba(255,165,0,0.2)] overflow-hidden ring-4 ring-amber-600/40">
                <div className="absolute inset-2 rounded-full aspect-square bg-gradient-to-br from-gray-900 via-black to-black shadow-inner overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 aspect-square h-12 rounded-full bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 shadow-2xl border-4 border-amber-600/40" />
                  {/* Efecto de brillo animado */}
                  <div className="absolute inset-0 rounded-full pointer-events-none animate-pulse bg-gradient-to-br from-amber-500/10 via-transparent to-amber-700/10" />
                  {isSpinning && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-amber-600/15 to-transparent animate-spin" />
                  )}
                </div>
              </div>
            </div>

            {/* Bola de la ruleta (visible siempre) */}
            <div
              className={cn(
                "absolute left-1/2 top-1/2 z-30 transform-gpu transition-all duration-700",
                isSpinning ? 'ball-spin ball-glow' : '',
                jumping && phase === 'settled' ? 'animate-bounce-effect scale-125' : ''
              )}
              style={{
                transform: `
                  rotate(${ballAngle}deg)
                  translate3d(-50%, calc(-50% - ${ballRadius}px), 0)
                  ${jumping && phase === 'settled' ? `translate(${getWinnerPosition().x / 2}px, ${getWinnerPosition().y / 2}px) scale(1.35)` : ''}
                `,
                opacity: isSpinning || phase === 'bouncing' || phase === 'settled' ? 1 : 0.7,
                transition: phase === 'settled' ? 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                willChange: 'transform',
                filter: phase === 'settled' 
                  ? 'drop-shadow(0 0 20px #ffe066) drop-shadow(0 0 40px #ffd700) drop-shadow(0 0 60px #ffed4a)' 
                  : isSpinning
                    ? 'drop-shadow(0 0 12px rgba(255,255,255,0.8))'
                    : 'drop-shadow(0 2px 8px #0008)'
              }}
            >
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full transform-gpu animate-bounce-effect relative">
                <div className="w-full h-full rounded-full shadow-xl relative overflow-hidden">
                  {/* Cuerpo de la bola */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-400" />
                  {/* Brillo superior */}
                  <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white opacity-90 blur-[1px] animate-pulse" />
                  {/* Reflejo lateral */}
                  <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white opacity-70" />
                  {/* Sombra inferior */}
                  <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-black/30 blur-[2px]" />
                  {/* Efecto de pulso al asentarse */}
                  {phase === 'settled' && (
                    <div className="absolute inset-0 rounded-full bg-yellow-200/30 animate-pulse" style={{ animationDuration: '1.2s' }} />
                  )}
                  {/* Efecto de rebote visual */}
                  {phase === 'bouncing' && (
                    <div className="absolute inset-0 rounded-full border-2 border-yellow-400/40 animate-ping" />
                  )}
                </div>
              </div>
              {/* Sombra de la bola */}
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 w-5 h-2 bg-black/30 rounded-full blur-[3px] transition-all duration-300"
                style={{ opacity: 0.5 }}
              />
            </div>
            
            {/* Efectos visuales adicionales */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/5 via-transparent to-amber-700/5 pointer-events-none" />
            {isSpinning && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-spin" style={{ animationDuration: '3s' }} />
            )}
            {phase === 'settled' && winningNumber !== null && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/10 via-transparent to-amber-600/10 animate-pulse" />
            )}
          </div>
          
          {/* Estados de la interfaz */}
          <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 text-center space-y-4">
            {/* Eliminado cartel de "La bola está girando..." */}
            {phase === 'bouncing' && (
              <div className="text-center">
                <p className="text-xl text-orange-400 font-semibold animate-pulse">
                  Rebotando... ({bounceCount} rebotes)
                </p>
                <div className="flex justify-center space-x-1 mt-2">
                  {Array.from({ length: Math.min(bounceCount, 10) }, (_, i) => (
                    <div key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
              </div>
            )}
            
            {phase === 'settled' && winningNumber !== null && (
              <div className="text-center space-y-4">
                <p className="text-2xl text-green-400 font-bold">🎯 ¡Número Ganador! 🎯</p>
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl font-bold text-white shadow-2xl border-4 transform animate-pulse
                  ${(() => {
                    const color = getNumberColor(winningNumber)
                    const colorClasses = {
                      red: 'bg-gradient-to-br from-red-500 to-red-700 border-red-300',
                      black: 'bg-gradient-to-br from-gray-800 to-black border-gray-400',
                      green: 'bg-gradient-to-br from-green-500 to-green-700 border-green-300'
                    }
                    return colorClasses[color]
                  })()}`}
                >
                  {winningNumber}
                </div>
                <p className="text-lg text-gray-300">
                  Color: <span className={`font-bold ${(() => {
                    const color = getNumberColor(winningNumber)
                    const textColors = {
                      red: 'text-red-400',
                      black: 'text-gray-300',
                      green: 'text-green-400'
                    }
                    return textColors[color]
                  })()}`}>
                    {getColorName(getNumberColor(winningNumber))}
                  </span>
                </p>
              </div>
            )}
            
            {phase === 'idle' && !isSpinning && (
              <>
                <p className="text-xl text-gray-400 font-medium">Esperando próxima jugada...</p>
                <button
                  onClick={handleReset}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition-all"
                >
                  Reiniciar Juego
                </button>
              </>
            )}
          </div>
          
          {/* Panel de información de debug */}
          {/* Eliminado panel de debug para ocultar velocidad, radio, fase y rebotes */}
        </Card>
      </div>
    </div>
  )
}