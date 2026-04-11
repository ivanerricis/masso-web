import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { MainLayout } from "@/pages/MainLayout"
import DashboardPage from "@/pages/dashboard/DashboardPage"
import CustomersPage from "@/pages/customers/CustomersPage"
import TechnicianPage from "@/pages/technicians/TechniciansPage"
import DevicesPage from "@/pages/devices/DevicesPage"
import BugsPage from "@/pages/bugs/BugsPage"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="clienti" element={<CustomersPage />} />
          <Route path="tecnici" element={<TechnicianPage />} />
          <Route path="dispositivi" element={<DevicesPage />} />
          <Route path="difetti" element={<BugsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
