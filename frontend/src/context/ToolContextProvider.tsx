import React, { useState, type ReactNode } from 'react'
import ToolContext from './ToolContext'
import { type Tool } from '../../../engine/src/types/tool';

interface ToolContextProviderProps {
  children: ReactNode;
}

function ToolContextProvider({children}: ToolContextProviderProps) {
    const [selected, setSelected] = useState<Tool>('brush');
    const [color, setColor] = useState('rgb(255, 0, 0)');
  return (
    <ToolContext.Provider
        value= {{
            selected,
            setSelected,

            color,
            setColor
        }}
    >
        {children}
    </ToolContext.Provider> 
  )
}

export default ToolContextProvider