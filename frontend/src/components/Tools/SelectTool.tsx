import React from 'react'
import { LuHand } from 'react-icons/lu'
import { useTool } from '../../context/ToolContext'

function SelectTool() {
    const {selected, setSelected} = useTool();

    const isCurrentlySelected = selected === 'select';

    const handleClick = () => {
      setSelected('select'); 
    }
    
  return (
    <li onClick={handleClick} className={`cursor-pointer ${isCurrentlySelected ? 'bg-selected' : ''} rounded-xl transition-all duration-300 ease-in-out`}>
      <span 
        className={`inline-block transition-transform duration-300 ease-in-out ${
          isCurrentlySelected ? 'scale-125' : 'scale-100'
        }`}
      >
        <LuHand size={isCurrentlySelected ? 30 : 24} />
    </span>
    </li>
  )
}

export default SelectTool