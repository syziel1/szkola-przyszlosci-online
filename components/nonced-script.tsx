'use client'

import Script, { type ScriptProps } from 'next/script'

import { useNonce } from '@/lib/nonce-context'

export function NoncedScript(props: ScriptProps) {
  const contextNonce = useNonce()
  const { nonce, ...rest } = props

  return <Script {...rest} nonce={nonce ?? contextNonce ?? undefined} />
}
