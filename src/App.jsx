import { BrowserRouter, Routes, Route } from "react-router-dom";

import Welcome from "./Welcome";
import Dashboard from "./Dashboard";
import Upload from "./Upload";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Welcome />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/upload" element={<Upload />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;