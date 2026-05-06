import { useContext } from 'react'
import { AuthContext } from './AuthContext.context'

export const useAuth = () => useContext(AuthContext)