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
  // Validar que el número ganador esté en el rango válido
  if (winningNumber !== null && !rouletteNumbers.includes(winningNumber)) {
    console.warn(`Número ganador inválido: ${winningNumber}. Debe estar entre 0 y 36.`)
    return null
  }

  const [wheelRotation, setWheelRotation] = useState(0)
  const [ballAngle, setBallAngle] = useState(0)
  const [ballRadius, setBallRadius] = useState(240)
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'bouncing' | 'settled'>('idle')
  const [bounceCount, setBounceCount] = useState(0)
  const [isClient, setIsClient] = useState(false)
  
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const wheelSpeedRef = useRef(0)
  const ballSpeedRef = useRef(0)

  // Referencias para los efectos de sonido
  const spinningAudioRef = useRef<HTMLAudioElement | null>(null)
  const winnerAudioRef = useRef<HTMLAudioElement | null>(null)

  // Inicialización del componente
  useEffect(() => {
    setIsClient(true)
    const randomStart = Math.random() * 360
    setBallAngle(randomStart)
  }, [])

  // Inicializar efectos de sonido
  useEffect(() => {
    if (typeof window !== 'undefined') {
      spinningAudioRef.current = new Audio('/casino-ambiente.mp3')
      spinningAudioRef.current.loop = true
      winnerAudioRef.current = new Audio('/ganador.mp3')
    }
  }, [])

  const getNumberPosition = useCallback((index: number) => {
    // Ajustar el ángulo para 37 números (0-36)
    const angle = (index * (360 / 37))
    // Radio ajustado para mejor visualización
    const radius = 175
    // Convertir a radianes y ajustar el offset
    const radians = (angle - 90) * (Math.PI / 180)
    const x = radius * Math.cos(radians)
    const y = radius * Math.sin(radians)
    // El ángulo de rotación necesita compensación
    const rotationAngle = angle + 90
    return { angle: rotationAngle, x, y, baseAngle: angle }
  }, [])

  const settleOnWinningNumber = useCallback(() => {
    if (winningNumber === null) {
      console.warn('No hay número ganador definido')
      return
    }

    const numberIndex = rouletteNumbers.indexOf(winningNumber)
    if (numberIndex === -1) {
      console.error(`Número ganador ${winningNumber} no encontrado en la ruleta`)
      return
    }

    // Obtener la posición del número ganador
    const { angle } = getNumberPosition(numberIndex)
    
    // Calcular el ángulo más corto hacia el número ganador
    const currentAngle = ballAngle % 360
    const targetAngle = angle % 360
    let deltaAngle = targetAngle - currentAngle
    
    // Ajustar para tomar la ruta más corta
    if (deltaAngle > 180) deltaAngle -= 360
    if (deltaAngle < -180) deltaAngle += 360
    
    // Aplicar el movimiento en dos fases
    setBallAngle(currentAngle + deltaAngle * 0.8)
    setBallRadius(177) // Ligeramente más alto para efecto visual
    
    // Ajuste final suave
    setTimeout(() => {
      setBallAngle(angle)
      setBallRadius(175)
      
      if (onSpinComplete) {
        setTimeout(onSpinComplete, 1000)
      }
    }, 300)
  }, [winningNumber, onSpinComplete, getNumberPosition, ballAngle])

  // Lógica principal de animación
  useEffect(() => {
    if (isSpinning && phase === 'idle') {
      setPhase('spinning')
      startTimeRef.current = Date.now()
      wheelSpeedRef.current = 8
      ballSpeedRef.current = 15
      setBallRadius(240)
    }

    if (!isSpinning && phase !== 'idle') {
      // Mantener la fase 'settled' por más tiempo antes de resetear
      if (phase === 'settled') {
        const timer = setTimeout(() => {
          setPhase('idle')
          setBounceCount(0)
        }, 4000) // 4 segundos de visualización
        return () => clearTimeout(timer)
      }
      setPhase('idle')
      setBounceCount(0)
      return
    }

    if (!isSpinning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const animate = () => {
      const now = Date.now()
      const elapsed = (now - startTimeRef.current) / 1000

      if (phase === 'spinning') {
        // Animación de la rueda
        const wheelDeceleration = Math.max(0.1, 1 - elapsed / 6)
        wheelSpeedRef.current = 8 * wheelDeceleration
        setWheelRotation(prev => prev + wheelSpeedRef.current)

        // Animación de la bola
        const ballProgress = Math.min(1, elapsed / 5)
        const ballDeceleration = 1 - Math.pow(ballProgress, 2)
        ballSpeedRef.current = 15 * ballDeceleration
        
        setBallAngle(prev => prev + ballSpeedRef.current)
        
        // Radio de la bola disminuye gradualmente
        const radiusProgress = Math.pow(ballProgress, 1.5)
        const currentRadius = 240 - (60 * radiusProgress)
        setBallRadius(currentRadius)

        // Transición a bouncing después de 5 segundos
        if (elapsed >= 5) {
          setPhase('bouncing')
          setBounceCount(0)
        }
      } else if (phase === 'bouncing') {
        const bounceElapsed = elapsed - 5
        const bounceProgress = Math.min(1, bounceElapsed / 2)
        
        // Continuar rotación de rueda más lenta
        const wheelDeceleration = Math.max(0.05, 1 - bounceElapsed / 4)
        setWheelRotation(prev => prev + wheelDeceleration * 2)
        
        // Efecto de rebote de la bola
        const bounceFreq = 8
        const dampening = Math.exp(-3 * bounceProgress)
        const bounceEffect = Math.sin(bounceProgress * Math.PI * bounceFreq) * dampening
        
        // Movimiento de la bola durante rebote
        const baseSpeed = 3 * (1 - bounceProgress)
        setBallAngle(prev => prev + baseSpeed + bounceEffect * 2)
        
        // Radio con efecto de rebote
        const baseRadius = 180
        const radiusBounce = bounceEffect * 20
        setBallRadius(baseRadius + radiusBounce)
        
        // Contar rebotes
        if (bounceEffect > 0.5 && bounceCount < 6) {
          setBounceCount(prev => prev + 1)
        }

        // Transición a settled después de 2 segundos de rebote
        if (bounceProgress >= 1) {
          setPhase('settled')
          settleOnWinningNumber()
          return
        }
      }
      
      if (isSpinning && (phase === 'spinning' || phase === 'bouncing')) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isSpinning, phase, settleOnWinningNumber, bounceCount])

  // Manejar efectos de sonido
  useEffect(() => {
    if (phase === 'spinning' && spinningAudioRef.current) {
      spinningAudioRef.current.currentTime = 0
      spinningAudioRef.current.play().catch(() => {
        console.log('Error reproduciendo sonido de giro')
      })
    } else if (phase === 'settled') {
      if (spinningAudioRef.current) {
        spinningAudioRef.current.pause()
        spinningAudioRef.current.currentTime = 0
      }
      if (winnerAudioRef.current) {
        winnerAudioRef.current.currentTime = 0
        winnerAudioRef.current.play().catch(() => {
          console.log('Error reproduciendo sonido ganador')
        })
      }
    }

    return () => {
      if (spinningAudioRef.current) {
        spinningAudioRef.current.pause()
        spinningAudioRef.current.currentTime = 0
      }
    }
  }, [phase])

  const handleReset = () => {
    setPhase('idle')
    setWheelRotation(0)
    setBallAngle(Math.random() * 360)
    setBallRadius(240)
    setBounceCount(0)
  }

  if (!isClient) return null

  return (
    <div className="relative flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4 md:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-green-800 via-green-900 to-black opacity-90" />
      
      {/* Panel del número ganador */}
      <div className="fixed top-4 right-4 z-50">
        {phase === 'settled' && typeof winningNumber === 'number' && (
          <div className="flex flex-col items-center gap-4 bg-black/60 rounded-xl p-6 backdrop-blur-md 
                          border-2 border-yellow-400/30 shadow-2xl animate-in fade-in slide-in-from-right duration-700
                          min-w-[320px]">
            <p className="text-3xl font-bold text-emerald-400 animate-pulse" 
               style={{ animationDuration: '2s' }}>
              Número Ganador
            </p>              <div className={cn(
                'w-48 h-48 rounded-full flex items-center justify-center text-9xl font-bold text-white shadow-2xl relative overflow-hidden',
                'transform transition-all duration-1000',
                'winner-container bg-gradient-to-br',
                {
                  'from-red-500 via-red-600 to-red-700': getNumberColor(winningNumber) === 'red',
                  'from-gray-700 via-gray-800 to-gray-900': getNumberColor(winningNumber) === 'black',
                  'from-green-500 via-green-600 to-green-700': getNumberColor(winningNumber) === 'green'
                }
              )}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <span className="relative z-10 winner-number">{winningNumber}</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent animate-pulse"
                     style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent animate-spin"
                     style={{ animationDuration: '4s' }} />
              </div>
            <p className="mt-2 text-2xl font-bold transition-all duration-1000">
              <span className={cn('transition-colors duration-1000', {
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

      {/* Botón de prueba para iniciar giro */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => {
            if (!isSpinning) {
              // Simular inicio de giro con número ganador aleatorio
              const randomWinner = rouletteNumbers[Math.floor(Math.random() * rouletteNumbers.length)]
              // Aquí normalmente llamarías a tu función de inicio de giro
              console.log('Número ganador simulado:', randomWinner)
            }
          }}
          disabled={isSpinning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded shadow transition-all"
        >
          {isSpinning ? 'Girando...' : 'Girar Ruleta'}
        </button>
      </div>

      <div className="relative w-full max-w-[700px] mx-auto">
        <Card className="relative bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 p-8 md:p-12 rounded-full shadow-2xl border-0 aspect-square flex items-center justify-center">
          
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Rueda principal */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 shadow-2xl transition-transform duration-75 ease-linear"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                boxShadow: 'inset 0 0 60px 20px rgba(0,0,0,0.5)'
              }}
            >
              {/* Números */}
              {rouletteNumbers.map((number, index) => {
                const { x, y, angle } = getNumberPosition(index)
                const color = getNumberColor(number)
                const isWinning = winningNumber === number && phase === 'settled'
                
                return (
                  <div
                    key={number}
                    className="absolute"
                    style={{
                      top: '50%',
                      left: '50%',
                      width: '36px',
                      height: '36px',
                      transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle}deg)`,
                      zIndex: isWinning ? 20 : 10
                    }}
                  >
                    <div 
                      className={`w-full h-full rounded-full flex items-center justify-center text-white font-bold transition-all duration-500 ${
                        isWinning ? 'text-2xl scale-150' : 'text-lg'
                      } ${
                        color === 'red' 
                          ? 'bg-gradient-to-br from-red-600 to-red-800' 
                          : color === 'black' 
                            ? 'bg-gradient-to-br from-gray-700 to-black' 
                            : 'bg-gradient-to-br from-green-600 to-green-800'
                      }`}
                      style={{
                        transform: `rotate(90deg) scale(${isWinning ? 1.4 : 0.95})`,
                        boxShadow: isWinning 
                          ? '0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.6)' 
                          : '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                    >
                      <span className={cn(
                        "transition-all duration-500",
                        isWinning && "winning-glow"
                      )}>
                        {number}
                      </span>
                      {isWinning && (
                        <>
                          <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping" />
                          <div className="absolute -inset-1 rounded-full border-2 border-yellow-400/40 animate-pulse" />
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {/* Centro de la rueda */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 shadow-xl ring-4 ring-amber-600/40">
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-900 to-black shadow-inner">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 shadow-2xl border-4 border-amber-600/40" />
                </div>
              </div>
            </div>

            {/* Bola de la ruleta */}
            <div
              className={cn(
                "absolute left-1/2 top-1/2 z-30",
                {
                  'ball-spin': phase === 'spinning',
                  'ball-bounce-settle': phase === 'settled'
                }
              )}
              style={{
                transform: `rotate(${ballAngle}deg) translate(-50%, calc(-50% - ${ballRadius}px))`,
                opacity: isSpinning || phase === 'bouncing' || phase === 'settled' ? 1 : 0.8,
                transition: phase === 'settled' ? 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                filter: phase === 'settled' 
                  ? 'drop-shadow(0 0 20px #ffe066) drop-shadow(0 0 40px #ffd700)'
                  : 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'
              }}
            >
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-full relative overflow-hidden transform-gpu">
                <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-300" />
                <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white opacity-90" />
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-black/30" />
                {phase === 'settled' && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200/40 via-transparent to-transparent animate-pulse" />
                    <div className="absolute inset-0 rounded-full shadow-xl" 
                         style={{ boxShadow: '0 0 30px rgba(255,215,0,0.4), 0 0 60px rgba(255,215,0,0.3)' }} />
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Estados de la interfaz */}
          <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 text-center">
            {phase === 'spinning' && (
              <p className="text-xl text-blue-400 font-semibold animate-pulse">
                🎰 La ruleta está girando...
              </p>
            )}
            
            {phase === 'bouncing' && (
              <div className="text-center">
                <p className="text-xl text-orange-400 font-semibold animate-pulse">
                  🏀 Rebotando... ({bounceCount} rebotes)
                </p>
              </div>
            )}
            
            {phase === 'settled' && winningNumber !== null && (
              <div className="text-center space-y-2">
                <p className="text-2xl text-green-400 font-bold">🎯 ¡Número Ganador! 🎯</p>
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-3xl font-bold text-white shadow-2xl border-4
                  ${(() => {
                    const color = getNumberColor(winningNumber)
                    return color === 'red' 
                      ? 'bg-gradient-to-br from-red-500 to-red-700 border-red-300'
                      : color === 'black'
                        ? 'bg-gradient-to-br from-gray-800 to-black border-gray-400'
                        : 'bg-gradient-to-br from-green-500 to-green-700 border-green-300'
                  })()}`}
                >
                  {winningNumber}
                </div>
                <p className="text-lg text-gray-300">
                  Color: <span className={`font-bold ${
                    getNumberColor(winningNumber) === 'red' ? 'text-red-400' :
                    getNumberColor(winningNumber) === 'black' ? 'text-gray-300' : 'text-green-400'
                  }`}>
                    {getColorName(getNumberColor(winningNumber))}
                  </span>
                </p>
              </div>
            )}
            
            {phase === 'idle' && (
              <div className="text-center space-y-4">
                <p className="text-xl text-gray-400 font-medium">Esperando próxima jugada...</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition-all"
                >
                  Reiniciar Posición
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}