'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
// Utility function to combine class names
const cn = (...classes: (string | undefined | null | boolean | Record<string, boolean>)[]) => {
  return classes
    .flatMap(cls => {
      if (!cls) return []
      if (typeof cls === 'object' && !Array.isArray(cls)) {
        return Object.entries(cls)
          .filter(([_, value]) => value)
          .map(([key]) => key)
      }
      return [cls]
    })
    .filter(Boolean)
    .join(' ')
}

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
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'bouncing' | 'settled'>('idle')
  const [bounceCount, setBounceCount] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [finalWheelPosition, setFinalWheelPosition] = useState(0)
  
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const wheelSpeedRef = useRef(0)
  const ballSpeedRef = useRef(0)

  // Inicialización del componente
  useEffect(() => {
    setIsClient(true)
    const randomStart = Math.random() * 360
    setBallAngle(randomStart)
  }, [])

  const getNumberPosition = useCallback((index: number) => {
    const angle = (index * (360 / 37))
    const radius = 170
    const radians = (angle - 90) * (Math.PI / 180)
    const x = radius * Math.cos(radians)
    const y = radius * Math.sin(radians)
    const rotationAngle = angle - 90
    return { angle: rotationAngle, x, y, baseAngle: angle }
  }, [])

  const calculateWinningPosition = useCallback(() => {
    if (winningNumber === null) return { wheelPos: 0, ballPos: 0 }
    
    const numberIndex = rouletteNumbers.indexOf(winningNumber)
    if (numberIndex === -1) return { wheelPos: 0, ballPos: 0 }
    
    // Posición del número en la rueda (0-360 grados)
    const numberAngleOnWheel = numberIndex * (360 / 37)
    
    // Queremos que el número esté arriba (posición 0 grados desde la perspectiva del jugador)
    // La bola debe estar en la posición opuesta al número en la rueda
    const targetWheelPosition = -numberAngleOnWheel
    
    // La bola debe estar exactamente opuesta al número
    const targetBallPosition = 0 // La bola estará arriba cuando el número esté arriba
    
    return {
      wheelPos: targetWheelPosition,
      ballPos: targetBallPosition
    }
  }, [winningNumber])

  const settleOnWinningNumber = useCallback(() => {
    if (winningNumber !== null) {
      const { wheelPos, ballPos } = calculateWinningPosition()
      
      // Normalizar las posiciones finales
      const normalizedWheelPos = wheelPos % 360
      const normalizedBallPos = ballPos % 360
      
      // Calcular la rotación más suave hacia la posición final
      const currentWheelNormalized = wheelRotation % 360
      let wheelDiff = normalizedWheelPos - currentWheelNormalized
      
      // Elegir el camino más corto
      if (wheelDiff > 180) wheelDiff -= 360
      if (wheelDiff < -180) wheelDiff += 360
      
      const finalWheelRotation = wheelRotation + wheelDiff
      
      setFinalWheelPosition(finalWheelRotation)
      setWheelRotation(finalWheelRotation)
      setBallAngle(normalizedBallPos)
      setBallRadius(170) // Mismo radio que los números
      
      setTimeout(() => {
        if (onSpinComplete) onSpinComplete()
      }, 800)
    }
  }, [winningNumber, onSpinComplete, calculateWinningPosition, wheelRotation])

  // Simular giro con número ganador aleatorio
  const startTestSpin = () => {
    if (!isSpinning) {
      const randomWinner = rouletteNumbers[Math.floor(Math.random() * rouletteNumbers.length)]
      // Simular el props que vendría del componente padre
      console.log('Número ganador simulado:', randomWinner)
      // En tu implementación real, esto se haría desde el componente padre
    }
  }

  // Lógica principal de animación
  useEffect(() => {
    if (isSpinning && phase === 'idle') {
      setPhase('spinning')
      startTimeRef.current = Date.now()
      wheelSpeedRef.current = 8
      ballSpeedRef.current = 15
      setBallRadius(240)
      setBounceCount(0)
    }

    if (!isSpinning && phase !== 'idle') {
      // Reset cuando se detiene el giro
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
        const wheelDeceleration = Math.max(0.1, 1 - elapsed / 4)
        wheelSpeedRef.current = 8 * wheelDeceleration
        setWheelRotation(prev => prev + wheelSpeedRef.current)

        // Animación de la bola (en sentido contrario)
        const ballProgress = Math.min(1, elapsed / 4)
        const ballDeceleration = 1 - Math.pow(ballProgress, 1.5)
        ballSpeedRef.current = -12 * ballDeceleration // Negativo para ir en sentido contrario
        
        setBallAngle(prev => prev + ballSpeedRef.current)
        
        // Radio de la bola disminuye gradualmente
        const radiusProgress = Math.pow(ballProgress, 1.2)
        const currentRadius = 240 - (50 * radiusProgress)
        setBallRadius(currentRadius)

        // Transición a bouncing después de 4 segundos
        if (elapsed >= 4) {
          setPhase('bouncing')
          setBounceCount(0)
        }
      } else if (phase === 'bouncing') {
        const bounceElapsed = elapsed - 4
        const bounceProgress = Math.min(1, bounceElapsed / 1.5)
        
        // Continuar rotación de rueda más lenta
        const wheelDeceleration = Math.max(0.02, 1 - bounceElapsed / 3)
        setWheelRotation(prev => prev + wheelDeceleration * 1.5)
        
        // Efecto de rebote de la bola
        const bounceFreq = 6
        const dampening = Math.exp(-4 * bounceProgress)
        const bounceEffect = Math.sin(bounceProgress * Math.PI * bounceFreq) * dampening
        
        // Movimiento de la bola durante rebote (más lento)
        const baseSpeed = -1.5 * (1 - bounceProgress)
        setBallAngle(prev => prev + baseSpeed + bounceEffect * 1.5)
        
        // Radio con efecto de rebote
        const baseRadius = 180
        const radiusBounce = bounceEffect * 15
        setBallRadius(baseRadius + radiusBounce)
        
        // Contar rebotes
        const bounceThreshold = 0.3
        if (Math.abs(bounceEffect) > bounceThreshold && bounceCount < 5) {
          setBounceCount(prev => prev + 1)
        }

        // Transición a settled después de 1.5 segundos de rebote
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

  const handleReset = () => {
    setPhase('idle')
    setWheelRotation(0)
    setBallAngle(Math.random() * 360)
    setBallRadius(240)
    setBounceCount(0)
    setFinalWheelPosition(0)
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
            <p className="text-2xl font-bold text-yellow-400">Número Ganador</p>
            <div className={cn(
                'w-48 h-48 rounded-full flex items-center justify-center text-9xl font-bold text-white shadow-2xl relative overflow-hidden',
                'winner-container bg-gradient-to-br ring-8',
                getNumberColor(winningNumber) === 'red'
                  ? 'from-red-500 via-red-600 to-red-700 ring-red-300/50'
                  : getNumberColor(winningNumber) === 'black'
                    ? 'from-gray-700 via-gray-800 to-gray-900 ring-gray-400/50'
                    : 'from-green-500 via-green-600 to-green-700 ring-green-300/50',
                'transform transition-all duration-1000',
                phase === 'settled' && 'scale-110',
                phase === 'settled' && 'winner-number-glow'
              )}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <span className={cn(
                  'relative z-10 winner-number',
                  'transition-all duration-1000',
                  phase === 'settled' && 'animate-pulse drop-shadow-[0_0_30px_#ffe066]'
                )}>{winningNumber}</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent animate-pulse"
                     style={{ animationDuration: '2s' }} />
              </div>
            <p className="mt-4 text-2xl font-bold">
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

      {/* Botón de prueba para iniciar giro */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
        <button
          onClick={startTestSpin}
          disabled={isSpinning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded shadow transition-all"
        >
          {isSpinning ? 'Girando...' : 'Girar Ruleta'}
        </button>
        
        {/* Selector de número ganador para pruebas */}
        <select 
          onChange={(e) => console.log('Número seleccionado:', parseInt(e.target.value))}
          className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
          disabled={isSpinning}
        >
          <option value="">Seleccionar número</option>
          {rouletteNumbers.map(num => (
            <option key={num} value={num}>{num} - {getColorName(getNumberColor(num))}</option>
          ))}
        </select>
      </div>

      <div className="relative w-full max-w-[700px] mx-auto">
        <div className="relative bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 p-8 md:p-12 rounded-full shadow-2xl border-0 aspect-square flex items-center justify-center">
          
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Indicador de posición (arriba) */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-40">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg" />
            </div>
            
            {/* Rueda principal */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 shadow-2xl transition-transform duration-75 ease-linear"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                boxShadow: 'inset 0 0 60px 20px rgba(0,0,0,0.5)',
                transitionDuration: phase === 'settled' ? '800ms' : '75ms'
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
                        width: '48px',
                        height: '24px',
                        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle}deg)`,
                        zIndex: isWinning ? 20 : 10
                      }}
                    >
                      <div 
                        className={`w-full h-full flex items-center justify-center text-white font-bold transition-all duration-500 ${
                          isWinning ? 'text-2xl scale-150' : 'text-lg'
                        } ${
                          color === 'red' 
                            ? 'bg-gradient-to-b from-red-500 via-red-600 to-red-800' 
                            : color === 'black' 
                              ? 'bg-gradient-to-b from-gray-600 via-gray-800 to-black' 
                              : 'bg-gradient-to-b from-green-500 via-green-600 to-green-800'
                        }`}
                        style={{
                          transform: `rotate(90deg) scale(${isWinning ? 1.4 : 1})`,
                          borderRadius: '3px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: isWinning 
                            ? '0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.6), inset 0 1px 2px rgba(255,255,255,0.1)' 
                            : '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.3)'
                        }}
                      >
                        {number}
                        {isWinning && (
                          <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" style={{ borderRadius: '3px' }} />
                        )}
                      </div>
                    </div>
                )
              })}
              
              {/* Centro de la rueda con manija realista estilo casino */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 shadow-2xl ring-8 ring-amber-600/30">
                {/* Anillo exterior decorativo */}
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 shadow-inner">
                  {/* Separadores radiales en el borde */}
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={`separator-${i}`}
                      className="absolute top-0 left-1/2 origin-bottom"
                      style={{
                        transform: `translate(-50%, 0) rotate(${i * 15}deg)`,
                        width: '2px',
                        height: '12px',
                        background: 'linear-gradient(to bottom, #8b4513, #654321)',
                        borderRadius: '1px'
                      }}
                    />
                  ))}
                  
                  {/* Base del hub central */}
                  <div className="absolute inset-3 rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl">
                    
                    {/* Manija principal estilo Las Vegas */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
                      {/* Brazo de la manija - horizontal */}
                      <div 
                        className="absolute top-1/2 left-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 shadow-lg"
                        style={{
                          width: '120px',
                          height: '8px',
                          transform: 'translate(-50%, -50%)',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
                        }}
                      />
                      
                      {/* Extremos de la manija */}
                      <div 
                        className="absolute top-1/2 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-full shadow-lg"
                        style={{
                          left: 'calc(50% - 60px)',
                          width: '16px',
                          height: '16px',
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.2)'
                        }}
                      />
                      <div 
                        className="absolute top-1/2 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-full shadow-lg"
                        style={{
                          left: 'calc(50% + 60px)',
                          width: '16px',
                          height: '16px',
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.2)'
                        }}
                      />
                    </div>
                    
                    {/* Hub central elevado */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 shadow-2xl border-4 border-amber-500/60">
                      {/* Anillo interior del hub */}
                      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 shadow-inner">
                        {/* Centro con tornillo decorativo */}
                        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-amber-700 to-amber-800 flex items-center justify-center">
                          {/* Tornillo central */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg relative">
                            {/* Ranura del tornillo */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-1 bg-gradient-to-r from-amber-800 to-amber-900 rounded-full" />
                            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-inner" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bola de la ruleta */}
            <div
              className={cn(
                "absolute left-1/2 top-1/2 z-30 transition-all",
                phase === 'settled' ? 'duration-800 ease-out' : 'duration-100',
              )}
              style={{
                transform: `rotate(${ballAngle}deg) translate(-50%, calc(-50% - ${ballRadius}px))`,
                opacity: phase === 'settled' ? 0.9 : 1,
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'
              }}
            >
              <div className={cn(
                "rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-400 shadow-xl relative overflow-hidden",
                phase === 'settled' ? 'w-8 h-8' : 'w-6 h-6 md:w-7 md:h-7'
              )}>
                <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white opacity-90" />
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-black/30" />
                {phase === 'settled' && (
                  <div className="absolute inset-0 rounded-full bg-yellow-200/50 animate-pulse" />
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
        </div>
      </div>
    </div>
  )
}