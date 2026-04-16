import { Suspense, lazy } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"
import { TooltipProvider } from "./components/ui/tooltip"
import LoadingPage from "./components/loadingPage"

const MainLayout = lazy(() => import("@/pages/MainLayout").then((module) => ({ default: module.MainLayout })))
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"))
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"))
const ReportPage = lazy(() => import("./pages/reports/ReportPage"))
const CustomersPage = lazy(() => import("@/pages/customers/CustomersPage"))
const CustomerPage = lazy(() => import("./pages/customers/CustomerPage"))
const CollaboratorsPage = lazy(() => import("@/pages/collaborators/CollaboratorsPage"))
const CollaboratorPage = lazy(() => import("./pages/collaborators/CollaboratorPage"))
const TechnicianPage = lazy(() => import("@/pages/technicians/TechniciansPage"))
const SingleTechnicianPage = lazy(() => import("./pages/technicians/TechnicianPage"))
const DevicesPage = lazy(() => import("@/pages/devices/DevicesPage"))
const DevicePage = lazy(() => import("./pages/devices/DevicePage"))
const IssuesPage = lazy(() => import("@/pages/issues/IssuesPage"))
const IssuePage = lazy(() => import("./pages/issues/IssuePage"))

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingPage />}>
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
          </Suspense>
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
