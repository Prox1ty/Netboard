import { useState, type ReactNode } from 'react'
import ToolContext from './ToolContext'
import { type Tool } from '../../../engine/src/types/tool';

interface ToolContextProviderProps {
  children: ReactNode;
}

function ToolContextProvider({children}: ToolContextProviderProps) {
    const [selected, setSelected] = useState<Tool>('brush');
    const [color, setColor] = useState('rgba(255, 0, 0, 1)');
    const [thickness, setThickness] = useState(1);

  return (
    <ToolContext.Provider
        value= {{
            selected,
            setSelected,

            color,
            setColor,

            thickness,
            setThickness
        }}
    >
        {children}
    </ToolContext.Provider> 
  )
}

export default ToolContextProvider