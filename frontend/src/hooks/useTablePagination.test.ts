import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useTablePagination } from "./useTablePagination"

describe("useTablePagination", () => {
  it("parte dalla prima pagina", () => {
    const { result } = renderHook(() => useTablePagination())

    expect(result.current.currentPage).toBe(1)
  })

  /**
   * Senza questo reset si finisce a guardare la pagina 4 di un risultato che, dopo aver
   * cambiato la ricerca, di pagine ne ha una sola: la tabella appare vuota pur avendo
   * dei risultati.
   */
  it("torna alla prima pagina quando cambiano le dipendenze di reset", () => {
    const { result, rerender } = renderHook(
      ({ search }: { search: string }) => useTablePagination({ resetDependencies: [search] }),
      { initialProps: { search: "" } }
    )

    act(() => {
      result.current.setCurrentPage(4)
    })
    expect(result.current.currentPage).toBe(4)

    rerender({ search: "mario" })

    expect(result.current.currentPage).toBe(1)
  })

  it("non tocca la pagina corrente se le dipendenze non cambiano", () => {
    const { result, rerender } = renderHook(
      ({ search }: { search: string }) => useTablePagination({ resetDependencies: [search] }),
      { initialProps: { search: "mario" } }
    )

    act(() => {
      result.current.setCurrentPage(3)
    })

    rerender({ search: "mario" })

    expect(result.current.currentPage).toBe(3)
  })

  it("rileva anche un cambio di lunghezza dell'elenco di dipendenze", () => {
    const { result, rerender } = renderHook(
      ({ deps }: { deps: unknown[] }) => useTablePagination({ resetDependencies: deps }),
      { initialProps: { deps: ["a"] as unknown[] } }
    )

    act(() => {
      result.current.setCurrentPage(2)
    })

    rerender({ deps: ["a", "b"] })

    expect(result.current.currentPage).toBe(1)
  })
})
