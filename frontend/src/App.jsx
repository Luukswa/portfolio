import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BrandingProvider } from './context/BrandingContext'
import { DarkModeProvider } from './context/DarkModeContext'
import Layout from './components/Layout'
import Home from './pages/Home'

export default function App() {
  return (
    <DarkModeProvider>
      <BrandingProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrandingProvider>
    </DarkModeProvider>
  )
}
