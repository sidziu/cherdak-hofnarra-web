// ИЗМЕНЕНО ДЕЯТЕЛЬНОСТЬЮ ПУТЁМ ДЕЯТЕЛЬНОСТИ НЕЙРОСЕТИ
import { useState, useEffect } from "react"; 
import "./Header.css"; 
import { NavLink, useLocation } from "react-router-dom";

// Импорт логотипов
// * Импорт с точками запомнить.
import logoDefault from "../../assets/logotypes/new-logo-withouttext.png"; // Обычный
import logoHover from "../../assets/logotypes/new-logo.png"; // При наведении

import Sidebar from "../Sidebar/Sidebar.jsx";

function Header() { 
    const location = useLocation(); 
    const [isMenuOpen, setIsMenuOpen] = useState(false); 

    // Инициализируем состояние скролла динамически при монтировании
    const [isScrolled, setIsScrolled] = useState(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        return scrollTop > 50;
    });

    // Состояние для анимации логотипа
    const [isLogoHovered, setIsLogoHovered] = useState(false);

    // НОВОЕ: состояние для показа шапки при наведении у верхней части страницы
    const [isHoveringTop, setIsHoveringTop] = useState(false);

    // Отслеживание скролла
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            if (scrollTop > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        handleScroll(); // Запускаем проверку сразу при монтировании и смене роута

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [location.pathname]);

    if (location.pathname === "/admin") {
        return null;
    }

    // НОВОЕ: на главной странице шапка показывается при прокрутке или при наведении у верхней границы
    useEffect(() => {
        if (location.pathname !== "/") {
            setIsHoveringTop(false);
            return;
        }

        const handleMouseMove = (event) => {
            setIsHoveringTop(event.clientY < 100);
        };

        const handleMouseLeave = () => {
            setIsHoveringTop(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [location.pathname]);

    const isHomePage = location.pathname === "/";
    const isVisible = isHomePage ? isScrolled || isHoveringTop : true;

    // Сборка хлебных крошек
    const breadcrumbItems = [
        { path: "/", label: "Главная", isCurrent: location.pathname === "/" }
    ];

    if (location.pathname === "/about") {
        breadcrumbItems.push({ path: "/about", label: "О нас", isCurrent: true });
    } else if (location.pathname === "/playbill") {
        breadcrumbItems.push({ path: "/playbill", label: "Афиша", isCurrent: true });
    } else if (location.pathname === "/archive") {
        breadcrumbItems.push({ path: "/archive", label: "Архив", isCurrent: true });
    } else if (location.pathname.startsWith("/archive/")) {
        breadcrumbItems.push({ path: "/archive", label: "Архив", isCurrent: false });
        breadcrumbItems.push({ path: location.pathname, label: location.state?.title || "Спектакль", isCurrent: true });
    }

    return (
        <>
            <div className={`header-container ${isVisible ? "visible" : "hidden"}`}>
                
                {/* ОБЕРНУЛИ ЛОГОТИП В ССЫЛКУ */}
                <NavLink 
                    to="/" 
                    className="logo-link"
                >
                    <img 
                        src={isLogoHovered ? logoHover : logoDefault} 
                        alt="Логотип" 
                        className="logo" 
                        onMouseEnter={() => setIsLogoHovered(true)}
                        onMouseLeave={() => setIsLogoHovered(false)}
                    />
                </NavLink>
                
                <div className="breadcrumb-container">
                    {breadcrumbItems.map((item, index) => {
                        const isActive = item.isCurrent;
                        const isGray = index < breadcrumbItems.length - 1;
                        const shouldRenderLink = !isActive || item.path === "/";
                        
                        // Определяем, кликаем ли мы по ссылке "Главная", находясь на Главной
                        const isHomeLinkOnHomePage = item.path === "/" && isHomePage;

                        return (
                            <div key={`${item.path}-${item.label}`} className="breadcrumb-item">
                                {index > 0 && <span className="breadcrumb-separator">.</span>}
                                
                                {isHomeLinkOnHomePage ? (
                                    /* ИСПРАВЛЕНО: Добавили класс reload-link */
                                    <a
                                        href="/"
                                        className="breadcrumb-link active reload-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.location.reload(); // Перезапуск страницы
                                        }}
                                    >
                                        {item.label}
                                    </a>
                                ) : shouldRenderLink ? (
                                    /* Обычные переходы между страницами */
                                    <NavLink
                                        to={item.path}
                                        className={`breadcrumb-link${isGray ? " gray" : ""}`}
                                        end={item.path === "/"}
                                    >
                                        {item.label}
                                    </NavLink>
                                ) : (
                                    <span className="breadcrumb-link active">{item.label}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                <h1 className="three-palki" onClick={() => setIsMenuOpen(true)}>☰</h1>
            </div>

            <Sidebar 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
            />
        </>
    );
}

export default Header;
//Подгрзука при открытии сайта
    // useEffect(() => {
    //     const handleScroll = () => {

    //         // Получение высоты прокрутки
    //         const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
        

    //         // Если прокрутка больше чем 50px — плашка выезжает
    //         if (scrollTop > 50) {
    //             setIsVisible(true);
    //         } else {
    //             setIsVisible(false);
    //         }
    //     };

    //     window.addEventListener("scroll", handleScroll);

    //     return () => {
    //         window.removeEventListener("scroll", handleScroll);
    //     };
    // }, []);