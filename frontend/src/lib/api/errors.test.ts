import { AxiosError, AxiosHeaders } from "axios"
import { describe, expect, it } from "vitest"
import { getApiErrorMessage } from "./errors"

const buildAxiosError = (data: unknown, status = 400) => {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, {
    data,
    status,
    statusText: "Bad Request",
    headers: {},
    config,
  })
}

describe("getApiErrorMessage", () => {
  /**
   * È il caso che conta davvero: il backend risponde con { message } e quel testo è già
   * scritto in italiano per l'utente, quindi deve avere la precedenza sul fallback.
   */
  it("preferisce il messaggio restituito dal backend", () => {
    const error = buildAxiosError({ message: "Cliente già esistente" })

    expect(getApiErrorMessage(error, "Fallback")).toBe("Cliente già esistente")
  })

  it("ricade sul messaggio di axios se la risposta non ne contiene uno", () => {
    const error = buildAxiosError({})

    expect(getApiErrorMessage(error, "Fallback")).toBe("Request failed")
  })

  it("usa il messaggio di un Error generico", () => {
    expect(getApiErrorMessage(new Error("rete non raggiungibile"), "Fallback")).toBe("rete non raggiungibile")
  })

  it("usa il fallback per valori lanciati che non sono errori", () => {
    expect(getApiErrorMessage("stringa qualsiasi", "Fallback")).toBe("Fallback")
    expect(getApiErrorMessage(null, "Fallback")).toBe("Fallback")
    expect(getApiErrorMessage(undefined, "Fallback")).toBe("Fallback")
  })

  it("ha un fallback predefinito quando non viene passato", () => {
    expect(getApiErrorMessage(null)).toBe("Operazione non riuscita")
  })
})
