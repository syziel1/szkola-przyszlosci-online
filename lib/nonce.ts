/**
 * CSP Nonce Utility for Next.js
 * 
 * This module provides utilities to apply CSP nonces to scripts and styles
 * in Next.js applications. The nonce is generated in middleware.ts and passed
 * through the application via React context.
 * 
 * ## Current Implementation (Next.js 13.x)
 * 
 * The nonce infrastructure is in place and can be used for custom inline scripts.
 * However, Next.js 13.x does not automatically apply nonces to framework scripts,
 * so the CSP includes 'unsafe-inline' for compatibility.
 * 
 * ## Usage for Custom Scripts
 * 
 * 1. In Server Components (like layout.tsx), the nonce is retrieved from headers
 * 2. It's passed to client components via NonceProvider
 * 3. Use the `useNonce()` hook in client components to get the nonce
 * 4. Apply the nonce to any custom Script or style tags
 * 
 * Example:
 * ```tsx
 * 'use client';
 * import Script from 'next/script';
 * import { useNonce } from '@/lib/nonce';
 * 
 * export function MyComponent() {
 *   const nonce = useNonce();
 *   
 *   return (
 *     <Script id="my-script" nonce={nonce}>
 *       {`console.log('This script has a nonce!')`}
 *     </Script>
 *   );
 * }
 * ```
 * 
 * ## Future Improvement
 * 
 * For full CSP nonce support without 'unsafe-inline', consider upgrading to
 * Next.js 14.1+ which has built-in CSP nonce support. See:
 * https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 * 
 * When upgrading, you can:
 * 1. Remove 'unsafe-inline' from the CSP in middleware.ts
 * 2. Use Next.js's built-in nonce handling
 * 3. Keep this utility for backward compatibility or remove it if not needed
 */

export { NonceProvider, useNonce } from './nonce-provider';
