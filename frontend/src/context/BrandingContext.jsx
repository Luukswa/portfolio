import { createContext, useContext, useEffect, useState } from 'react'

const BrandingContext = createContext({ appName: 'Portfolio', primaryColor: '#0d4c92', logoUrl: '/logo.png' })

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({
    appName: 'Portfolio',
    primaryColor: '#0d4c92',
    logoUrl: '/logo.png',
  })

  useEffect(() => {
    fetch('/api/config/branding')
      .then(r => r.json())
      .then(data => {
        document.title = data.appName
        setBranding(data)
      })
      .catch(() => {})
  }, [])

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>
}

export const useBranding = () => useContext(BrandingContext)
