import { Navigate, Outlet, useLocation } from "react-router-dom"
import LoadingPage from "@/components/loadingPage"
import { useAuth } from "@/components/use-auth"
import ForcePasswordChangePage from "@/pages/auth/ForcePasswordChangePage"

const RequireAuth = () => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingPage className="h-svh" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (user.mustChangePassword) {
    return <ForcePasswordChangePage />
  }

  return <Outlet />
}

export default RequireAuth
