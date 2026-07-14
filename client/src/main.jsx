import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Admin from './pages/admin.jsx'; 
import About from './pages/about.jsx'; 
import Home from './pages/home.jsx'; 
import Playbill from './pages/playbill.jsx'; 

import Header from './components/header.jsx'; 
import Footer from './components/footer.jsx';

import Archive from './pages/archive.jsx';
import ArchiveDetail from './pages/archive-detail.jsx';

import './index.css';
import './components-css/footer.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <Header />
    <main className="page"></main>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/about" element={<About />} />
        <Route path="/" element={<Home />} />
        <Route path="/playbill" element={<Playbill />} />

        <Route path="/archive" element={<Archive />} />
        <Route path="/archive/:id" element={<ArchiveDetail />} /> {/* Двоеточие указывает на динамический параметр */}
      </Routes>
      <Footer />
    </BrowserRouter>
  </StrictMode>
);