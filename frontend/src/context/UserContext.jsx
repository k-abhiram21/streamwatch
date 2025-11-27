import { createContext, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'streamwatch-user'

const UserContext = createContext()

const readUserFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => readUserFromStorage())

  const persistUser = (nextUser) => {
    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setUser(nextUser)
    window.dispatchEvent(new Event('user-auth-changed'))
  }

  const value = useMemo(
    () => ({
      user,
      login: persistUser,
      setUser: persistUser,
      logout: () => persistUser(null)
    }),
    [user]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => useContext(UserContext)


