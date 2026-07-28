import { useState, useEffect, useRef } from "react";
import "./Home.css"; 
import { API } from '../../api'; 

import logo from "../../assets/logotypes/new-logo-withouttext.png"; // Лого (пока не используется в JSX)
import startBg from "../../assets/backgrounds-home/bg1.jpeg"; // Фон первого экрана
import BookingMenu from "../../components/BookingMenu/BookingMenu.jsx"; // Компонент модалки записи

function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Состояние меню бронирования
    const [menuParams, setMenuParams] = useState({ performanceId: null, eventId: null }); // Параметры длч заполнения формы записи

    const [performances, setPerformances] = useState([]); // Данные о спектаклях с сервера
    const [loading, setLoading] = useState(false); // Состояние загрузки
    const [error, setError] = useState(""); // Состояние ошибки


    useEffect(() => {
        const controller = new AbortController(); 
        async function loadHomeData() {
            try {
                setLoading(true);
                setError("");
                const data = await API.getPerformances(controller.signal);
                setPerformances(data);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }

        loadHomeData();


        return () => {
            controller.abort();
        };
    }, []);


    return (
        <div className="home-container">
            
            {/* "Занавес" */}
            <div className="curtain-container">
                <div className="curtain left-curtain"></div>
                <div className="curtain right-curtain"></div>
            </div>

            {/* Стартовый экран */}
            <div 
                className="start-container" 
                style={{ backgroundImage: `url(${startBg})` }} 
            >
                <div className="overlay-container">
                    <div className="content-container">
                        <h1 className="title">Чердак Хофнарра</h1>
                        <p className="subtitle">Театральная студия</p>
                        <h1 className="title-spbgasu">СПбГАСУ</h1>

                        {error && <h1 className="error-text">Ошибка загрузки: {error}</h1>}

                    </div>
                </div>
            </div>

            {/* Меню бронирования */}
            <BookingMenu 
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                performances={performances}
                initialPerformanceId={menuParams.performanceId}
                initialEventId={menuParams.eventId}
            />
        </div>
    );
}

export default Home;