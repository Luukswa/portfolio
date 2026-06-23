import { createContext, useContext, useEffect, useState } from 'react'

const DarkModeContext = createContext({ dark: false, toggleDark: () => {} })

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === '1')

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute('data-dark', '')
    } else {
      document.documentElement.removeAttribute('data-dark')
    }
    localStorage.setItem('darkMode', dark ? '1' : '0')
  }, [dark])

  return (
    <DarkModeContext.Provider value={{ dark, toggleDark: () => setDark(d => !d) }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export const useDarkMode = () => useContext(DarkModeContext)
