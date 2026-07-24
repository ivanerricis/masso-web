import { createContext } from "react"
import type { UserDto } from "@/lib/api"

export type AuthProviderState = {
  user: UserDto | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<UserDto>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const initialAuthProviderState: AuthProviderState = {
  user: null,
  isLoading: true,
  login: async () => {
    throw new Error("AuthProvider non inizializzato")
  },
  logout: async () => {},
  refresh: async () => {},
}

export const AuthProviderContext = createContext<AuthProviderState>(initialAuthProviderState)
