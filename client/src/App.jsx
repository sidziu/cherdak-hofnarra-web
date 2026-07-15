import { Routes, Route } from 'react-router-dom';

// Импорты страниц
import Admin from './pages/Admin/Admin.jsx'; 
import About from './pages/About/About.jsx'; 
import Home from './pages/Home/Home.jsx'; 
import Playbill from './pages/Playbill/Playbill.jsx'; 
import Archive from './pages/Archive/Archive.jsx';
import ArchiveDetail from './pages/ArchiveDetail/ArchiveDetail.jsx';

// Импорты компонентов
import Header from './components/Header/Header.jsx'; 
import Footer from './components/Footer/Footer.jsx';

function App() {
  return (
    <>
      <Header />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/about" element={<About />} />
          <Route path="/playbill" element={<Playbill />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/archive/:id" element={<ArchiveDetail />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;