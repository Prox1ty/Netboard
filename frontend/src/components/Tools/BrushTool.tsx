import React from 'react'
import { useTool } from '../../context/ToolContext';


import { LuBrush } from 'react-icons/lu'

function BrushTool() {
  const { selected, setSelected } = useTool();

  const isCurrentlySelected = selected === 'brush';

  const handleClick = () => {
      setSelected('brush'); 
  }

  return (
    <li onClick={handleClick} className={`cursor-pointer ${isCurrentlySelected ? 'bg-selected' : ''} rounded-xl transition-all duration-300 ease-in-out`}>
      <span 
        className={`inline-block transition-transform duration-300 ease-in-out ${
          isCurrentlySelected ? 'scale-125' : 'scale-100'
        }`}
      >
        <LuBrush size={isCurrentlySelected ? 30 : 24}/>
      </span>
    </li>
  )
}

export default BrushTool;