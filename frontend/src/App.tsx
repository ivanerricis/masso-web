import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { MainLayout } from "@/pages/MainLayout"
import DashboardPage from "@/pages/dashboard/DashboardPage"
import CustomersPage from "@/pages/customers/CustomersPage"
import TechnicianPage from "@/pages/technicians/TechniciansPage"
import DevicesPage from "@/pages/devices/DevicesPage"
import CollaboratorsPage from "@/pages/collaborators/CollaboratorsPage"
import IssuesPage from "@/pages/issues/IssuesPage"
import ReportsPage from "@/pages/reports/ReportsPage"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="clients" element={<CustomersPage />} />
            <Route path="collaborators" element={<CollaboratorsPage />} />
            <Route path="technicians" element={<TechnicianPage />} />
            <Route path="devices" element={<DevicesPage />} />
            <Route path="issues" element={<IssuesPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        closeButton={true}
        position='top-center'
        richColors
        swipeDirections={['left', 'right', 'top']}
        toastOptions={{
          classNames: {
            title: "text-base",
            description: "text-sm",
            closeButton: "[&>svg]:h-4 [&>svg]:w-4 w-6! h-6!",
          }
        }} />
    </ThemeProvider>
  )
}

export default App
