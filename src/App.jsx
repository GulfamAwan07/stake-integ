import React from 'react'
import { Route, Routes } from 'react-router';
import Home from "./pages/Home.jsx";
import { TonConnectUIProvider } from '@tonconnect/ui-react';

const App = () => {
  return (
    <TonConnectUIProvider manifestUrl='http://localhost:5173/tonconnect-manifest.json'>
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
    </TonConnectUIProvider>
  )
}

export default App;