import { useState, useEffect } from "react"; 
import "./Header.css"; 
import { NavLink, useLocation } from "react-router-dom";


import logoDefault from "../../assets/logotypes/new-logo-withouttext.webp"; // Обычный
import logoHover from "../../assets/logotypes/new-logo.webp"; // При наведении

import Sidebar from "../Sidebar/Sidebar.jsx";

function Header() { 
    const location = useLocation(); 
    const [isMenuOpen, setIsMenuOpen] = useState(false); 

    // Инициализируем состояние скролла
    const [isScrolled, setIsScrolled] = useState(() => {
        //                современный вид         для старых бразуеров
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        return scrollTop > 50;
    });

    // Состояние для анимации логотипа
    const [isLogoHovered, setIsLogoHovered] = useState(false);

    // Состояние для показа шапки при наведении у верхней части страницы (home)
    const [hoverHeader, setHoverHeader] = useState(false);

    const [itsMobileWindow, setItsMobileWindow] = useState(() =>
    //typeof - возвращает тип переменной | Если мобила => то true, нет false
        typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
    );
    

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

    // Для главной, анимация выдвижения и скрытия плашки при скролле
    useEffect(() => {
        if (location.pathname !== "/") {
            setHoverHeader(false);
            return;
        }

        const handleMouseMove = (event) => {
            setHoverHeader(event.clientY < 100);
        };

        const handleMouseLeave = () => {
            setHoverHeader(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [location.pathname]);

    const isHomePage = location.pathname === "/";
    // Плашку видно если это...
    const isVisible = !isHomePage || isScrolled || hoverHeader;


    // навигацияв
    let pathItems = [];


    if (isHomePage) {
        pathItems = [
            { path: "/archive", label: "Архив", isCurrent: false },
            { path: "/", label: "Главная", isCurrent: true },
            { path: "/about", label: "О нас", isCurrent: false }
        ];
    } else {
        pathItems = [
            { path: "/", label: "Главная", isCurrent: false }
        ];
        if (location.pathname === "/about") {
            pathItems.push({ path: "/about", label: "О нас", isCurrent: true });
        } else if (location.pathname === "/playbill") {
            pathItems.push({ path: "/playbill", label: "Афиша", isCurrent: true });
        } else if (location.pathname === "/archive") {
            pathItems.push({ path: "/archive", label: "Архив", isCurrent: true });
        } else if (location.pathname.startsWith("/archive/")) {
            pathItems.push({ path: "/archive", label: "Архив", isCurrent: false });
            const displayLabel = itsMobileWindow 
            ? "Спектакль" 
            : (location.state?.title || "Спектакль");

        pathItems.push({ 
            path: location.pathname, 
            label: displayLabel, 
            isCurrent: true
        })}
    }

    return (
        <>
            <div className={`header-container ${isVisible ? "visible" : "hidden"}`}>
                <div className="left-container">
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

                    <h1 className="header-title">Чердак<br/>&nbsp;Хофнарра</h1>
                </div>
                
                
                <div className="path-navigation-container">
                    {pathItems.map((item, index) => {
                        const isActive = item.isCurrent;
                        const isGray = index < pathItems.length - 1;
                        const isLink = !isActive || item.path === "/";
                        
                        // Определяем, кликаем ли мы по ссылке "Главная", находясь на Главной
                        const isHomeLinkOnHomePage = item.path === "/" && isHomePage;

                        return (
                            
                            <div key={`${item.path}-${item.label}`} 
                                className={`path-item ${isActive ? "mobile-visible" : "mobile-hidden"}`}
                            
                            >
                                {index > 0 && <p className="path-separator gray">•</p>}
                                
                                {isHomeLinkOnHomePage ? (
                                    <a
                                        href="/"
                                        className="path-link active reload-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.location.reload(); // Перезапуск страницы
                                        }}
                                    >
                                        {item.label}
                                    </a>
                                ) : isLink ? (
                                    /* Обычные переходы между страницами */
                                    <NavLink
                                        to={item.path}
                                        className={`path-link${isGray ? " gray" : ""}`}
                                        end={item.path === "/"}
                                    >
                                        {item.label}
                                    </NavLink>
                                ) : (
                                    <span className="path-link active">{item.label}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="right-container" >
                    <NavLink 
                        to='/playbill'
                        className="playbill-button"
                    >
                        Афиша
                    </NavLink>
                    <NavLink className="button-menu" onClick={() => setIsMenuOpen(true)}>☰</NavLink>
                </div>
                

            
            </div>
            <Sidebar 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
            />
        </>
    );
}

export default Header;