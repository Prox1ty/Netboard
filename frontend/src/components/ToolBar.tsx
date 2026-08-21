import React from "react";
import { BrushTool, SelectTool } from "./Tools";

function ToolBar() {
  return (
    <li className="flex 
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
      <SelectTool />
      <BrushTool />
    </li>
  );
}

export default ToolBar;
