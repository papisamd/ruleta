'use client'

import React from 'react'

interface SpinEffectProps {
  visible: boolean
}

export const SpinEffect: React.FC<SpinEffectProps> = ({ visible }) => {
  if (!visible) return null
  
  return (
    <>
      <div className="absolute inset-8 rounded-full border-2 border-yellow-400/40 animate-pulse" />
      <div className="absolute inset-12 rounded-full border border-yellow-300/30 animate-ping" />
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent animate-spin"
        style={{ animationDuration: '3s' }}
      />
    </>
  )
}

export const SettleEffect: React.FC<SpinEffectProps> = ({ visible }) => {
  if (!visible) return null
  
  return (
    <>
      <div className="absolute inset-4 rounded-full border-4 border-yellow-400/60 animate-pulse" />
      <div className="absolute inset-8 rounded-full border-2 border-yellow-300/40 animate-ping" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/20 via-transparent to-yellow-600/20 animate-pulse" />
    </>
  )
}

interface BallEffectProps {
  phase: 'spinning' | 'bouncing' | 'settled'
}

export const BallEffect: React.FC<BallEffectProps> = ({ phase }) => {
  if (phase === 'spinning') {
    return (
      <>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-spin" />
        <div className="absolute inset-0 rounded-full shadow-lg" style={{ 
          boxShadow: '0 0 15px rgba(255,255,255,0.3), 0 0 30px rgba(255,255,255,0.2)' 
        }} />
      </>
    )
  }
  
  if (phase === 'bouncing') {
    return (
      <>
        <div className="absolute -inset-2 rounded-full bg-white/30 animate-ping" />
        <div className="absolute -inset-1 rounded-full border-2 border-white/50 animate-pulse" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-white/10 animate-spin"
          style={{ animationDuration: '0.5s' }} />
      </>
    )
  }
  
  if (phase === 'settled') {
    return (
      <>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200/40 via-transparent to-transparent animate-pulse" />
        <div className="absolute inset-0 rounded-full shadow-xl" style={{ 
          boxShadow: '0 0 30px rgba(255,215,0,0.4), 0 0 60px rgba(255,215,0,0.3), inset 0 0 20px rgba(255,255,255,0.3)' 
        }} />
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent animate-spin"
          style={{ animationDuration: '3s' }} />
      </>
    )
  }
  
  return null
}
