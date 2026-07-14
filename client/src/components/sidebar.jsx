

// ДЕЯТЕЛЬНОСТЬ НЕЙРОСЕТИ


import React from "react";
import { NavLink } from "react-router-dom"; // Для переходов по страницам
import "../components-css/sidebar.css"; // Подключаем стили, которые создадим на следующем шаге
import gasuLogo from "../assets/gasu-logo-chb.png";

// В скобках мы принимаем два "пропса" (настройки) от родителя (шапки):
// isOpen - открыто меню сейчас или нет (true/false)
// onClose - функция, которая закроет меню при клике на крестик или мимо меню
function Sidebar({ isOpen, onClose }) {
    return (
        <>
            {/* 1. БЭКДРОП (ТЕМНЫЙ ФОН) 
                Если isOpen = true, добавляем класс "open" и фон появляется.
                onClick={onClose} означает, что если кликнуть по темному фону мимо меню, оно закроется. 
            */}
            <div 
                className={`sidebar-backdrop ${isOpen ? "open" : ""}`} 
                onClick={onClose}
            ></div>

            {/* 2. САМА ВЫЕЗЖАЮЩАЯ ПАНЕЛЬ
                Опять же, если isOpen = true, панель выезжает (добавляется класс "open")
            */}
            <div className={`sidebar-container ${isOpen ? "open" : ""}`}>
                
                {/* Кнопка-крестик для закрытия */}
                <button className="sidebar-close-btn" onClick={onClose}>
                    &times; {/* Спецсимвол красивого крестика в HTML */}
                </button>
                
                {/* Навигация с вашими ссылками */}
                <nav className="sidebar-nav">
                    {/* При клике на любую ссылку мы вызываем onClose, чтобы меню само закрылось после перехода */}
                    <NavLink to="/" className="sidebar-link" onClick={onClose}>Главная</NavLink>
                    <NavLink to="/about" className="sidebar-link" onClick={onClose}>О нас</NavLink>
                    <NavLink to="/playbill" className="sidebar-link" onClick={onClose}>Афиша</NavLink>
                    <NavLink to="/archive" className="sidebar-link" onClick={onClose}>Архив</NavLink>
                </nav>

                <div className="sidebar-footer-link">
                    <a
                        href="https://www.spbgasu.ru/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sidebar-logo-link"
                        onClick={onClose}
                    >
                        <img src={gasuLogo} alt="Gasu logo" className="sidebar-logo" />
                    </a>
                </div>
            </div>
        </>
    );
}

export default Sidebar;