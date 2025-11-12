'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

const NonceContext = createContext<string | null>(null)

interface NonceProviderProps {
  nonce?: string | null
  children: ReactNode
}

export function NonceProvider({ nonce, children }: NonceProviderProps) {
  return (
    <NonceContext.Provider value={nonce ?? null}>
      {children}
    </NonceContext.Provider>
  )
}

export function useNonce() {
  return useContext(NonceContext)
}

export { NonceContext }
