import { LuCircle } from 'react-icons/lu'
import { useTool } from '../../context/ToolContext'

function CircleTool() {
  const { selected, setSelected } = useTool();

  const isCurrentlySelected = selected === 'circle';

  const handleClick = () => {
    setSelected('circle');
  }

  return (
    <li onClick={handleClick} className={`cursor-pointer ${isCurrentlySelected ? 'bg-selected' : ''} rounded-xl transition-all duration-300 ease-in-out`}>
      <span
        className={`inline-block transition-transform duration-300 ease-in-out ${
          isCurrentlySelected ? 'scale-125' : 'scale-100'
        }`}
      >
        <LuCircle size={isCurrentlySelected ? 30 : 24} />
      </span>
    </li>
  )
}

export default CircleTool;