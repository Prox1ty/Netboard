import React from 'react'
import ColorPalette from './sidebar_components/ColorPalette'

function SideBar() {
  return (
    <div className="flex 
        flex-row 
        justify-evenly 
        items-center 
        list-none 
        py-3  
        px-5 
        gap-5 
        bg-bg 
        rounded-2xl 
        shadow-black 
        shadow-xs 
        m-4 
        z-10"
    >
        <ul className='list-none gap-5 '>
            <ColorPalette />
        </ul>
    </div>
  )
}

export default SideBar