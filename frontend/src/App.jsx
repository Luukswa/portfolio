import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BrandingProvider } from './context/BrandingContext'
import { DarkModeProvider } from './context/DarkModeContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import OverMij from './pages/OverMij'
import Beheer from './pages/Beheer'
import Cijfers from './pages/Cijfers'
import Doelen from './pages/Doelen'
import CV from './pages/CV'

export default function App() {
  return (
    <DarkModeProvider>
      <BrandingProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/over-mij" element={<OverMij />} />
              <Route path="/beheer" element={<Beheer />} />
              <Route path="/mijn-cijfers" element={<Cijfers />} />
              <Route path="/doelen" element={<Doelen />} />
              <Route path="/mijn-cv" element={<CV />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrandingProvider>
    </DarkModeProvider>
  )
}
