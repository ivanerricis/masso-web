import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDebouncedValue } from "./useDebouncedValue"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useDebouncedValue", () => {
  it("restituisce subito il valore iniziale", () => {
    const { result } = renderHook(() => useDebouncedValue("mario"))

    expect(result.current).toBe("mario")
  })

  it("aggiorna il valore solo dopo il ritardo", () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebouncedValue(value, 300), {
      initialProps: { value: "m" },
    })

    rerender({ value: "mar" })
    expect(result.current).toBe("m")

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe("m")

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe("mar")
  })

  /**
   * È il comportamento che rende utile l'hook: digitando in fretta deve partire una sola
   * richiesta, con l'ultimo valore, non una per lettera.
   */
  it("scarta i valori intermedi se le modifiche sono più veloci del ritardo", () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebouncedValue(value, 300), {
      initialProps: { value: "m" },
    })

    rerender({ value: "ma" })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: "mar" })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: "mario" })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe("mario")
  })
})
