import { useState, useEffect, useRef } from "react";
import "./Home-css/Home.css";
import { API } from "../../api/index.js";

import logo from "../../assets/logotypes/new-logo-withouttext.png"; // Лого (пока не используется в JSX)
import startBg from "../../assets/backgrounds-home/bg1.jpeg"; // Фон первого экрана
import BookingMenu from "../../components/BookingMenu/BookingMenu.jsx"; // Компонент модалки записи

// Swiper и Atropos для карусели
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, FreeMode, Mousewheel } from "swiper/modules";
import Atropos from "atropos/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "atropos/css"


import "./Home-css/Carousel.css";
import "./Home-css/HomeAbout.css";
import "./Home-css/HomeArchive.css";

import { useNavigate, NavLink } from "react-router-dom"; // роутинг

function Home() {

    const navigate = useNavigate();
    // Ссылка на Swiper, чтобы управлять его поведением (остановка автопрокрутки при наведении)
    const swiperRef = useRef(null);

    // Стейты для управления менб бронирования
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingEventId, setBookingEventId] = useState(null);
    const [bookingPerformanceId, setBookingPerformanceId] = useState(null);

    const [archive, setArchive] = useState([]);
    const [performances, setPerformances] = useState([]); // Данные о спектаклях с сервера
    const [about, setAbout] = useState(""); // Текст About
    const [loading, setLoading] = useState(false); // Состояние загрузки
    const [error, setError] = useState(""); // Состояние ошибки

    // Для скоролла карусели на мобильных устройствах
    const [itsMobileWindow, setItsMobileWindow] = useState(() =>
    //typeof - возвращает тип переменной | Если мобила => то true, нет false
        typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
    );

  useEffect(() => {
    const controller = new AbortController();

    // Проверка, на случай по типу "пользователь перевернул телефон", поэтому в useEffect
    const windowModeStatus = window.matchMedia("(max-width: 768px)"); 

    const updateItsMobileWindow = () => setItsMobileWindow(windowModeStatus.matches); // обновление стейта, чтоб не перезагрудать старинцу

    updateItsMobileWindow();

    // Сам слушатель для переменных, вызовет функцию при изменении разрешения эерана
    if (typeof windowModeStatus.addEventListener === "function") {
      windowModeStatus.addEventListener("change", updateItsMobileWindow); // addEventLiistener для современных бразуеров
    } else {
      windowModeStatus.addListener(updateItsMobileWindow); // addListener для старых бразуеров
    } 


    async function loadHomeData() {
      try {
        setLoading(true);
        setError("");

        const [carouselData, aboutText, archiveData] = await Promise.all([
          API.getPerformances(controller.signal),
          API.getAboutText(controller.signal),
          API.getArchive(controller.signal)
        ]);

        setPerformances(carouselData);
        setAbout(aboutText);
        setArchive(archiveData);

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

      // Для отмена слушателя, на случай если пользователь быстро уйдет на другую старницу
      // Кароче логика как у аборт контроллера
      if (typeof windowModeStatus.removeEventListener === "function") {
        windowModeStatus.removeEventListener("change", updateItsMobileWindow);
      } else {
        windowModeStatus.removeListener(updateItsMobileWindow);
      }

    };
  }, []);
  
  
    // Функция для перключения состояни панели бронирования, то есть при срабатвыание панель открроется/покажется
    // +Стейт с eventId поможет октрыть панель с правильно выбранным событием, например, если пользователь тыкнет по карточке со спектаклем
    const openBooking = (perfId=null) => { // null - дефолтное значние, на случай если ничего не передано
        setBookingPerformanceId(perfId);
        setIsBookingOpen(true);
    };
    // Функция для закрытия панели и сброса id для последующих открытий 
    const closeBooking = () => {
        setIsBookingOpen(false);
        setBookingPerformanceId(null);
    };




    // Данные для карусели

    // Разделяем афишу на актуальные и прошедшие показы
    const activePerformances = performances.filter(p => p.performances.some((event) => event.activestate === true));
    const pastPerformances = performances.filter(p => p.performances.some((event) => event.activestate === false));
    // let - потому что мы будем изменять массив
    let carouselItems = [...activePerformances, ...pastPerformances];


  // Склеиваем массив сам с собой, чтоб корректно работал loop при малом количестве спектаклей
  if (carouselItems.length > 0 && carouselItems.length < 5) {
    while (carouselItems.length < 8) {
      carouselItems = carouselItems.concat(carouselItems);
    }
  }

  return (
    <div className="home-container">
      {/* "Занавес" */}
      <div className="curtain-container">
        <div className="curtain left-curtain"></div>
        <div className="curtain right-curtain"></div>
      </div>

      {/* Стартовый экран */}
      <div className="start-container" style={{ backgroundImage: `url(${startBg})` }}>
        <div className="overlay-container">
          <div className="overlay-content-container">
            <h1 className="start-title">Чердак Хофнарра</h1>
            <p className="start-subtitle">Театральная студия</p>
            <h1 className="title-spbgasu">СПбГАСУ</h1>

            {error && <h1 className="error-text">Ошибка загрузки: {error}</h1>}
          </div>
        </div>
      </div>

      {/* Карусель */}
      <section className="carousel-container py-5 lg-pt-20">
        {loading && <div className="carousel-status">Загрузка репертуара...</div>}
        {error && <div className="carousel-status error">Ошибка: {error}</div>}


        {/* <h1 className="carousel-title">Афиша</h1>\ */}
        <NavLink to="/playbill" className="carousel-title-link">Афиша</NavLink>

        <div className="line-divider-container">
          <h1 className="line-divider"></h1>
        </div>

        <div
        // Из-за конфлитка Atropos и Swiper, требуется ручная настройка остановки карусели при наведении
          className="carousel-swiper-wrapper"
          onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
          onMouseLeave={() => swiperRef.current?.autoplay?.start()}
        >
          <Swiper
            // key заставляет Swiper переинициализироваться при изменении количества данных
            key={carouselItems.length}
            modules={[Navigation, Pagination, Autoplay, FreeMode, Mousewheel]}
            slidesPerView="auto"
            spaceBetween={100}
            centeredSlides={true}
            loop={true}
            //-
            freeMode={{ // свободный скролл карусели
              enabled: true,
              sticky: true, // доводчик до следующего слайда
              momentum: true, // "инерция"
              momentumRatio: itsMobileWindow ? 0.1 : 0.5, // коэффициент силы инерции, для телефона и декстопа разная
              momentumBounce: false, // отключает "отскок" в конце списка
            }}
            mousewheel={{ // реакция на колесико/скролл на тачпаде
              forceToAxis: true,  // карусель будет реагировать только на горизонтальную прокрутнку
              sensitivity: itsMobileWindow ? 0.25 : 1, // разная скорость прокрутки для мобил и декстопа
              releaseOnEdges: true, // если карусель закончилась, страница начнет скроллиться дальше (она не кончится)))
            }}
            grabCursor={true} // меняет вид курсора при наведении
            speed={500} // время до доводчика

            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            autoplay={{ 
              delay: 4000, 
              disableOnInteraction: false,
              pauseOnMouseEnter: false,
            }}
            pagination={{
              // Модуль пагинации, ну типа точек снизу карусели (один из вариантов)
              clickable: true,
              dynamicBullets: true,
              // Тип точек-индикаторов снизу карусели
              el: ".swiper-pagination",
            }}
            navigation={{
              nextEl: ".swiper-next",
              prevEl: ".swiper-prev",
            }}
            className="posters-swiper"
          >
            {carouselItems.map((item, index) => {
              const hasActivePerformance = item.performances.some((event) => event.activestate === true)

              const handleCardClick = (event) => {
                if (hasActivePerformance) {
                  openBooking(item.id);
                } else {
                  navigate(`/archive/${item.id}`);
                }
              };

              return (
                // Так как мы дублируем массив, то ключи могут повторяться, поэтому приклеиваем "-" и индекс
                <SwiperSlide key={`${item.id}-${index}`} className="performances-swiper-slide">
                  <Atropos
                    className="atropos-performance"
                    activeOffset={50} // Сила наклона
                    // highlight={false} // Подсветка карточки при наведении (тень)
                    shadow={false}
                    onClick={handleCardClick}


                  >
                    <a
                      className="performance-swiper-card"
                      // target="_blank" // Открывать в новой вкладке.
                      // rel="noopener noreferrer" // Это для безопасноти (читать подробнее в инете), использовать в связке с _blank
                    >
                      {/* Постер */}
                      <div className="performance-card-container" data-atropos-offset="0">
                        <div className="performance-img-container" data-atropos-offset="0">
                          <img src={item.imageUrl} alt={item.title} className="performance-img"/>
                        </div>
                      {/* Содержимое карточки */}
                      <div className="performance-content">
                        <div className="text-line-1">
                        {hasActivePerformance ? (
                          <span className="performance-activestate-true" data-atropos-offset="2">
                            Премьера
                          </span>
                        ) : (
                          <span className="performance-activestate-false" data-atropos-offset="2">
                            Прошёл
                          </span>
                        )}

                        <span className="performance-rate" data-atropos-offset="2">
                          {item.rating}
                        </span>
                        </div>

                        <span className="performance-title" data-atropos-offset="6">
                          {item.title}
                        </span>
                        
                        <span className="performance-director" data-atropos-offset="0">
                          Режиссёр: {item.director}
                        </span>

                        <span className="performance-genre" data-atropos-offset="0">
                          Жанр: {item.genre}
                        </span>
                        </div>

                      </div>
                    </a>
                  </Atropos>
                </SwiperSlide>
              );
            })}

            {/* Навигация */}
            <div className="swiper-controls-container">
              <button className="swiper-prev custom-nav-btn">←</button>
              <div className="swiper-pagination"></div>
              <button className="swiper-next custom-nav-btn">→</button>
            </div>
          </Swiper>
        </div>
      </section>

      <div className="home-about-container">

      <NavLink to="/about" className="about-title-link">О нас</NavLink>

      <h1 className="line-divider"></h1>

      {loading && <p className="home-about-status">Загрузка информации...</p>}
      {error && <p className="home-about-error">{error}</p>}

      {!loading && !error && (
        <>
          {/* Блок описания студии */}
          <div className="home-about-description-container">
          <p className="home-cherdak-opisanie">{about}</p>
          </div>
        </>)}
      <NavLink  to="about" className="to-about-btn">
        &nbsp;&nbsp;Актерский состав&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;Подробнее о нас&nbsp;&nbsp;
      </NavLink>
      </div>

      {/* Секция Архива */}
      <section className="home-archive-section"> 
        <NavLink to="/archive" className="home-archive-title">Архив спектаклей</NavLink>
        <div className="line-divider-container">
          <h1 className="line-divider"></h1>
        </div>

        {loading && <p className="home-about-status">Загрузка информации...</p>}
        {error && <p className="home-about-error">{error}</p>}

        {!loading && !error && (
          <div className="home-archive-3d-container">
            {archive.slice(0, 3).map((card, index) => (
              <div 
                key={card.id} 
                className={`home-archive-card-container card-position-${index}`}
                onClick={!itsMobileWindow ? () => navigate(`/archive/${card.id}`,{state: { title: card.title }}) : () => navigate(`/archive`)}
              >
                <div className="home-photo-container">
                    <img 
                      src={card.photoUrls[0]}  
                      className="home-archive-photo" 
                    />
                  </div>
                <div className="home-archive-card-content">
                  <h3 className="home-archive-card-title">{card.title}</h3>
                  {/* <p className="home-archive-card-subtitle"></p> */}
                </div>
              </div>
            ))}
          </div>
        )}
        <NavLink  to="archive" className="to-archive-btn">
          &nbsp;&nbsp; &nbsp;&nbsp;&nbsp; Перейти в архив спектаклей &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;
        </NavLink>
      </section>

      {/* Меню бронирования */}
      <BookingMenu
        // Стейты сверху
        isOpen={isBookingOpen}                      // Передаем текущее состояние (открыто/закрыто)
        onClose={closeBooking}                            // Передаем функцию закрытия внутрь формы
        initialPerformanceId={bookingPerformanceId} // Говорим форме, какой ID спектакля мы выбрали
        rawPerformances={performances}                    // Даем форме все данные о спектаклях
        />

    </div>
  );
}

export default Home;