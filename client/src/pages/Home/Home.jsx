import { useState, useEffect } from "react";
import "./Home.css"; 

// Импорты компонентов и ресурсов (сохранены из твоего файла)
import logo from "../../assets/new_logo_withouttext.png";
import heroBg from "../../assets/bg1.jpeg";
import BookingMenu from "../../components/BookingMenu/BookingMenu.jsx";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function Home() {
    const [isVisible, setIsVisible] = useState(false);

    // Состояния для работы с меню бронирования
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuParams, setMenuParams] = useState({ performanceId: null, eventId: null });

    // Храним только один массив данных
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Состояния для работы автоматического слайдера
    const [currentIndex, setCurrentIndex] = useState(0); // Индекс активного слайда
    const [isPaused, setIsPaused] = useState(false);     // Пауза прокрутки при наведении


    // Один запрос для загрузки спектаклей со вложенными сеансами
    useEffect(() => {
        const controller = new AbortController();

        async function loadHomeData() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(`${API_URL}/api/performances`, { 
                    signal: controller.signal 
                });

                if (!response.ok) {
                    throw new Error("Не удалось загрузить данные о спектаклях");
                }

                const data = await response.json();
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


    useEffect(() => {
        if (performances.length <= 1 || isPaused || isMenuOpen) return;

        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % performances.length);
        }, 4000);

        return () => clearInterval(timer);
    }, [performances, isPaused, isMenuOpen]);

    // Ручное перелистывание кнопками
    const handleNextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % performances.length);
    };

    const handlePrevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + performances.length) % performances.length);
    };

    // Расчет 3D-вращения карточки за курсором мыши
    const handleMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((centerY - y) / centerY) * 15; 
        const rotateY = ((x - centerX) / centerX) * -15; 
        
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    };

    // Возврат карточки в плоское состояние
    const handleMouseLeave = (e) => {
        const card = e.currentTarget;
        card.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    };

    

    // При клике на карточку открываем меню с выбранным спектаклем (perfId), но БЕЗ даты (eventId = null)
    const openBookingMenu = (perfId = null, evId = null) => {
        console.log("Кнопка нажата! Открываем меню с параметрами:", { perfId, evId });
        setMenuParams({ performanceId: perfId, eventId: evId });
        setIsMenuOpen(true);
    };

    return (
        <div className="home-container">
            
            {/* ТЕАТРАЛЬНЫЙ ЗАНАВЕС */}
            <div className="curtain-container">
                <div className="curtain left-curtain"></div>
                <div className="curtain right-curtain"></div>
            </div>



            <div 
                className="section-container" 
                style={{ backgroundImage: `url(${heroBg})` }} 
            >
                <div className="overlay-container">
                    <div className="content-container">
                        <h1 className="title">Чердак Хофнарра</h1>
                        <p className="subtitle">Театральная студия</p>
                        <h1 className="title-spbgasu">СПБГАСУ</h1>

                        {error && <p className="error-text">Ошибка загрузки: {error}</p>}
                    </div>
                </div>
            </div>

            {/* УРКАДЕННОЕ С САТИРИКОНА */}
            <section className="playbill-3d-section" id="playbill">
                <div className="playbill-content-wrapper">
                    
                    {/* ======================================
                    НОВОЕ: делаем заголовок Афиша ссылкой на страницу афиши
                    ====================================== */}
                    <a href="/playbill" className="playbill-head-link">
                        <h2 className="playbill-head">Афиша</h2>
                    </a>
                    <hr className="playbill-divider" />

                    {loading && <p className="loading-text">Загрузка репертуара...</p>}
                    {error && <p className="error-text">Ошибка загрузки: {error}</p>}

                    {!loading && !error && performances.length === 0 && (
                        <p className="no-events-text">Спектаклей не найдено.</p>
                    )}

                    <div 
                        className="playbill-carousel-viewport"
                        onMouseEnter={() => setIsPaused(true)}  
                        onMouseLeave={() => setIsPaused(false)} 
                    >
                        
                        <div 
                            className="playbill-carousel-track"
                            style={{ 
                                transform: `translateX(calc(50% - 160px - ${currentIndex * 360}px))` 
                            }}
                        >
                            {performances.map((perf, index) => {
                                const imageFilename = perf.imageUrl ? perf.imageUrl.split("/").pop() : "";
                                const isActive = index === currentIndex;

                                return (
                                    <div 
                                        key={perf.id} 
                                        className={`atropos-card-container ${isActive ? "active-slide" : "inactive-slide"}`}
                                    >
                                        <div 
                                            className="atropos-card"
                                            onMouseMove={isActive ? handleMouseMove : null} 
                                            onMouseLeave={isActive ? handleMouseLeave : null}
                                            onClick={isActive ? () => openBookingMenu(perf.id, null) : () => setCurrentIndex(index)} 
                                        >
                                            <img 
                                                className="atropos-fg-image"
                                                src={`${API_URL}/images/events/${imageFilename}`} 
                                                alt={perf.title} 
                                                onError={(e) => {
                                                    e.target.src = "https://images.unsplash.com/photo-1516307365426-bea591f05011?q=80&w=600";
                                                }}
                                            />
                                            
                                            <div className="atropos-content">
                                                <div className="atropos-header-info">
                                                    <span className="atropos-badge">{perf.genre}</span>
                                                    <span className="atropos-rating-badge">{perf.rating}</span>
                                                </div>
                                                <h3 className="atropos-title">{perf.title}</h3>
                                                <p className="atropos-director">Режиссёр: {perf.director}</p>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Кнопки ручной навигации */}
                        {performances.length > 1 && (
                            <>
                                <button className="carousel-nav-btn prev-btn" onClick={handlePrevSlide}>&#10094;</button>
                                <button className="carousel-nav-btn next-btn" onClick={handleNextSlide}>&#10095;</button>
                            </>
                        )}

                    </div>
                    {/* УРКАДЕННОЕ С САТИРИКОНА */}

                    {/* Кнопка "Записаться на спектакль" */}
                    <div className="playbill-bottom-actions">
                        <button 
                            className="booking-btn"
                            onClick={() => openBookingMenu(null, null)}
                            disabled={loading}
                        >
                            {loading ? "Загрузка..." : "Записаться на спектакль"}
                        </button>
                    </div>

                </div>
            </section>

            {/*  мяу */}
            <div className="dummy-scroll-section">
                <h2>мяу</h2>
                <p>====================================</p>
            </div>

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