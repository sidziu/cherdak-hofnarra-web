


// ДЕЯТЕЛЬНОСТЬ НЕЙРОСЕТИ

import './Footer.css';

import React, { useState } from "react";
import { NavLink } from "react-router-dom";

// Импортируем твой логотип-кота
import meowLogo from "../../assets/logo-myau-darkred.png"; 
import brick from "../../assets/brick-logo-1.png";
import newLogo from "../../assets/new_logo_footer.png"; 

function Footer() {
    // ==========================================
    // ЛОГИКА НАШЕЙ СЕКРЕТНОЙ ПАСХАЛКИ
    // ==========================================
    const [clickCount, setClickCount] = useState(0); // Счетчик кликов по коту
    const [catMood, setCatMood] = useState(""); // Настроение кота

    // Функция клика по коту
    const handleCatClick = () => {
        const nextCount = clickCount + 1;
        setClickCount(nextCount);

        // Первые 4 клика — ПОЛНАЯ ТИШИНА
        if (nextCount < 5) {
            return; 
        }

        // На ровно 5-й клик кот "просыпается"
        if (nextCount === 5) {
            setCatMood("😺 (Мяу! Вы разбудили кота!)");
        } 
        // Все последующие клики меняют кошачье настроение
        else {
            if (nextCount % 20 === 0) {
                setCatMood("😼 (Котику надоело гладиться)");
            } else if (nextCount % 10 === 0) {
                setCatMood("😸 (Кот громко мурчит!)");
            } else if (nextCount % 5 === 0) {
                setCatMood("😻 (Котик вас обожает!)");
            } else {
                setCatMood("😺");
            }
        }
    };

    return (
        <footer className="footer-container">
            <div className="footer-content">
                
                {/* Колонка 1: О студии */}
                <div className="footer-column">
                    <h3>Студия</h3>
                    <p>
                        «Чердак — это место, где хранят старое, чтобы создать новое». 
                        Наша театральная мастерская СПбГАСУ ведёт свою историю с 2006 года. 
                        А «Хофнарр» в переводе с немецкого означает «придворный шут»: ведь настоящий актёр — всегда немного философ и озорник.
                    </p>
                </div>

                {/* Колонка 2: Навигация */}
                <div className="footer-column">
                    <h3>Разделы</h3>
                    <ul>
                        <li><NavLink to="/" className="footer-link">Главная</NavLink></li>
                        <li><NavLink to="/playbill" className="footer-link">Афиша</NavLink></li>
                        <li><NavLink to="/archive" className="footer-link">Архив</NavLink></li>
                        <li><NavLink to="/about" className="footer-link">О нас</NavLink></li>
                    </ul>
                </div>

                {/* Колонка 3: Контакты */}
                <div className="footer-column">
                    <h3>Где мы?</h3>
                    <p>г. Санкт-Петербург,<br />Набережная реки Фонтанки, д. 123/5</p>
                    <img 
                        src={brick} 
                        alt=" Медиа студиа Кирпич "
                        className="brick-logo" 
                    />
                </div>

                {/* Колонка 4: Мы в соцсетях */}
                <div className="footer-column">
                    <h3>Мы в соцсетях</h3>
                    <div className="footer-socials">
                        <a href="https://vk.com/cherdak_hofnarra" target="_blank" rel="noopener noreferrer" className="social-link vk">
                            ✦ ВКонтакте
                        </a>
                        <img 
                            src={newLogo} 
                            alt="Логотип студии" 
                            className="social-logo" 
                        />
                    </div>
                </div>

                {/* Колонка 5: Разработка (Команда «Мяу») */}
                <div className="footer-column footer-logo-column">
                    <h3>Разработка</h3>
                    <p style={{ marginBottom: "15px" }}>Разработано командой «Мяу».</p>
                    <img 
                        src={meowLogo} 
                        alt="Мяу Sidziu" 
                        className="footer-meow-logo" 
                        onClick={handleClick => handleCatClick()}
                    />
                    <div className="cat-message-box">
                        {clickCount >= 5 && (
                            <>
                                <span className="cat-mood-text">{catMood}</span>
                                <span className="pet-counter">Кота погладили: <strong>{clickCount}</strong> раз</span>
                            </>
                        )}
                    </div>
                </div>

            </div>

            {/* Копирайт */}
            <div className="footer-bottom">
                <p>© 2006-2026 Театральная студия «Чердак Хофнарра». Все права защищены.</p>
            </div>
        </footer>
    );
}

export default Footer;