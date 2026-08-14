
import React from "react";
import { NavLink } from "react-router-dom"; // Для переходов по страницам
import "./Sidebar.css"; 
import gasuLogo from "../../assets/logotypes/gasu-logo-chb.png";
import { useState, useEffect } from "react";


function Sidebar({ isOpen, onClose }) {
    useEffect(() => {
            if (isOpen) {
    
                // При открытом окне, кнопка escape закрывает sidebar
                const handleKeyDown = (event) => {
                if (event.key === "Escape") {
                    onClose();
                }};
                window.addEventListener("keydown", handleKeyDown);
                return () => window.removeEventListener("keydown", handleKeyDown);
            }
            
        }, [isOpen]);

    return (
        <>
            <div 
                className={`sidebar-background ${isOpen ? "open" : ""}`} 
                onClick={onClose}
            ></div>


            <div className={`sidebar-container ${isOpen ? "open" : ""}`}>
                
                <div className="sidebar-header">
                    <h1 className="sidebar-big-title">Меню</h1>
                    <button className="sidebar-close-btn" onClick={onClose}>
                       ➔
                    </button>
                </div>

                <h1 className="line-divider"></h1>

                <nav className="sidebar-navigation-container">
                    <NavLink to="/" className="sidebar-link" onClick={onClose}>Главная</NavLink>
                    <NavLink to="/about" className="sidebar-link" onClick={onClose}>О нас</NavLink>
                    <NavLink to="/playbill" className="sidebar-link" onClick={onClose}>Афиша</NavLink>
                    <NavLink to="/archive" className="sidebar-link" onClick={onClose}>Архив</NavLink>
                </nav>

                <h1 className="line-divider"></h1>

                <h1 className="sidebar-title">Связь с нами</h1> 
                <div className="sidebar-contact-us">
                    <p className="sidebar-contact-h1">Почта:</p>
                    <p className="sidebar-contact-h3">sidziu418may@gmail.com</p>
                    <p className="sidebar-contact-h1">Telegram:</p>
                    <p className="sidebar-contact-h3">@sidziu<br/>@dadzc</p>
                </div>

                <h1 className="line-divider"></h1>
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