import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Tool } from "../../../engine/src/types/tool";


interface ToolContextType {
    selected: Tool;
    setSelected: Dispatch<SetStateAction<Tool>>;

    color: string;
    setColor: Dispatch<SetStateAction<string>>;
}

const ToolContext = createContext<ToolContextType | undefined>(undefined);
export default ToolContext;

export function useTool() {
    const context = useContext(ToolContext);

    if (context === undefined) {
        throw new Error('useTool must be used within ToolContextProvider');
    }

    return context;
}