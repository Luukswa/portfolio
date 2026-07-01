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
import Referenties from './pages/Referenties'
import Werkstukken from './pages/Werkstukken'
import Hulp from './pages/Hulp'
import Overzicht from './pages/Overzicht'
import StudentDetail from './pages/StudentDetail'

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
              <Route path="/mijn-referenties" element={<Referenties />} />
              <Route path="/mijn-werkstukken" element={<Werkstukken />} />
              <Route path="/hulp" element={<Hulp />} />
              <Route path="/overzicht" element={<Overzicht />} />
              <Route path="/overzicht/:id" element={<StudentDetail />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrandingProvider>
    </DarkModeProvider>
  )
}
