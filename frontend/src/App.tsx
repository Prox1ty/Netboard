import WhiteBoard from './WhiteBoard/WhiteBoard';

import ToolContextProvider from './context/ToolContextProvider';

function App() {

  return (
    <>
    <ToolContextProvider>
        <WhiteBoard  />
    </ToolContextProvider>
    </>
  )
}

export default App
