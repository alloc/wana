import * as React from 'react'

const depth = React.createContext(0)

export const AutoDepth = depth.Provider
export const useAutoDepth = () => React.useContext(depth)
