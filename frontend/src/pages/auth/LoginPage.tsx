import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getApiErrorMessage } from "@/lib/api"
import { useAuth } from "@/components/use-auth"

const LoginPage = () => {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (isSubmitting) {
            return
        }

        if (!username.trim() || !password) {
            toast.error("Inserisci nome utente e password")
            return
        }

        try {
            setIsSubmitting(true)
            await login(username.trim(), password)

            const state = location.state as { from?: { pathname: string } } | null
            navigate(state?.from?.pathname ?? "/dashboard", { replace: true })
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Accesso non riuscito"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex h-svh w-full items-center justify-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Accedi</CardTitle>
                    <CardDescription>Inserisci le tue credenziali per accedere a Masso.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        className="grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void handleSubmit()
                        }}
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="loginUsername">Nome utente</Label>
                            <Input
                                id="loginUsername"
                                autoComplete="username"
                                autoFocus
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="loginPassword">Password</Label>
                            <div className="relative">
                                <Input
                                    id="loginPassword"
                                    type={isPasswordVisible ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="pr-9"
                                />
                                <div className="absolute inset-y-0 right-1.5 flex items-center">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                                        aria-label={isPasswordVisible ? "Nascondi password" : "Mostra password"}
                                    >
                                        {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
                            <LogIn className="size-4" />
                            {isSubmitting ? "Accesso in corso..." : "Accedi"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default LoginPage
