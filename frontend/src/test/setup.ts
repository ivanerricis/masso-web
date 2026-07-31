// Aggiunge i matcher DOM (toBeInTheDocument, toHaveTextContent, ...) a `expect` di
// vitest, con i relativi tipi.
import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

// Smonta i componenti montati fra un test e l'altro: senza, il DOM si accumula e le
// query di testing-library trovano più elementi del previsto.
afterEach(() => {
  cleanup()
})

// jsdom non implementa matchMedia, che next-themes e l'hook use-mobile interrogano al
// montaggio: senza questo stub qualunque test che monti un componente reale esplode.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}
