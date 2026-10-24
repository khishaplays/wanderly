import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import DestinationDetails from "./pages/DestinationDetails";
import Counties from "./pages/Counties";
import CountyDetails from "./pages/CountyDetails";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/destinations/:id" element={<DestinationDetails />} />
        <Route path="/counties" element={<Counties />} />
        <Route path="/counties/:county_slug" element={<CountyDetails />} />
      </Route>
    </Routes>
  );
}

export default App;
