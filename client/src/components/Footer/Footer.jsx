import './Footer.css';
import React from "react";
import { NavLink, useLocation } from "react-router-dom"; // добавил useLocation для корректной проверки

import meowLogo from "../../assets/logotypes/logo-myau-darkred-white.webp"; 
import brickLogo from "../../assets/logotypes/brick-logo-white.webp";
import cherdakLogo from "../../assets/logotypes/logo-white.webp"; 

function Footer() {
    const location = useLocation();

    if (location.pathname === "/admin") {
        return null;
    }

    return (
        <footer className="footer-container">
            <div className="footer-columns-container">
                
                {/* 1. О нас */}
                <div className="footer-column">
                    <h3>Студия</h3>
                    <p>
                        «Чердак — это место, где хранят старое, чтобы создать новое». 
                        Наша театральная мастерская СПбГАСУ ведёт свою историю с 2006 года. 
                        А «Хофнарр» в переводе с немецкого означает «придворный шут».
                    </p>
                </div>

                {/* 2. Навигация */}
                <div className="footer-column">
                    <h3>Разделы</h3>
                    <ul>
                        <li><NavLink to="/" className="footer-link">Главная</NavLink></li>
                        <li><NavLink to="/playbill" className="footer-link">Афиша</NavLink></li>
                        <li><NavLink to="/archive" className="footer-link">Архив</NavLink></li>
                        <li><NavLink to="/about" className="footer-link">О нас</NavLink></li>
                    </ul>
                </div>

                {/* 3. Где мы? */}
                <div className="footer-column">
                    <h3>Где мы?</h3>
                    <p>г. Санкт-Петербург,<br />Набережная реки Фонтанки, д. 123/5</p>
                    <img 
                        src={brickLogo} 
                        alt="Медиастудия Кирпич"
                        className="brick-logo" 
                    />
                </div>

                {/* 4. Соц.сети */}
                <div className="footer-column">
                    <h3>Мы в соцсетях</h3>
                    <div className="footer-socials">
                        <a href="https://vk.com/cherdak_hofnarra" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="social-link vk">
                            ✦ ВКонтакте
                        </a>
                    </div>
                    <img 
                        src={cherdakLogo} 
                        alt="Логотип студии" 
                        className="social-logo" 
                    />
                </div>

                {/* 5. Разработано */}
                <div className="footer-column">
                    <h3>Разработано</h3>
                    <p>Тян Дмитрий<br/>Бычков Дмитрий </p>
                    <img 
                        src={meowLogo} 
                        alt="Мяу Sidziu" 
                        className="footer-meow-logo" 
                    />
                </div>

            </div>

            <div className="footer-bottom">
                <p>2006-2026 Театральная студия «Чердак Хофнарра».</p>
            </div>
        </footer>
    );
};

export default Footer;