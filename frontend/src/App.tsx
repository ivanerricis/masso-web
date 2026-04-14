import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { MainLayout } from "@/pages/MainLayout"
import DashboardPage from "@/pages/dashboard/DashboardPage"
import CustomersPage from "@/pages/customers/CustomersPage"
import CustomerPage from "./pages/customers/CustomerPage"
import TechnicianPage from "@/pages/technicians/TechniciansPage"
import SingleTechnicianPage from "./pages/technicians/TechnicianPage"
import DevicesPage from "@/pages/devices/DevicesPage"
import DevicePage from "./pages/devices/DevicePage"
import CollaboratorsPage from "@/pages/collaborators/CollaboratorsPage"
import CollaboratorPage from "./pages/collaborators/CollaboratorPage"
import IssuesPage from "@/pages/issues/IssuesPage"
import IssuePage from "./pages/issues/IssuePage"
import ReportsPage from "@/pages/reports/ReportsPage"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"
import { TooltipProvider } from "./components/ui/tooltip"
import ReportPage from "./pages/reports/ReportPage"

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/:id" element={<ReportPage />} />
              <Route path="clients" element={<CustomersPage />} />
              <Route path="clients/:id" element={<CustomerPage />} />
              <Route path="collaborators" element={<CollaboratorsPage />} />
              <Route path="collaborators/:id" element={<CollaboratorPage />} />
              <Route path="technicians" element={<TechnicianPage />} />
              <Route path="technicians/:id" element={<SingleTechnicianPage />} />
              <Route path="devices" element={<DevicesPage />} />
              <Route path="devices/:id" element={<DevicePage />} />
              <Route path="issues" element={<IssuesPage />} />
              <Route path="issues/:id" element={<IssuePage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
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
