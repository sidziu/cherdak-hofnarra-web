import { useState, useEffect, useRef } from "react";
import "./Home.css";
import { API } from "../../api";

import logo from "../../assets/logotypes/new-logo-withouttext.png"; // Лого (пока не используется в JSX)
import startBg from "../../assets/backgrounds-home/bg1.jpeg"; // Фон первого экрана
import BookingMenu from "../../components/BookingMenu/BookingMenu.jsx"; // Компонент модалки записи

// Swiper и Atropos для карусели
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import Atropos from "atropos/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "atropos/css";


import "./Carousel.css";

import { useNavigate } from "react-router-dom"; // для навигации на страницу архива при клике на карточку прошедшего спектакля

function Home() {

    const navigate = useNavigate();
    // Ссылка на Swiper, чтобы управлять его поведением (остановка автопрокрутки при наведении)
    const swiperRef = useRef(null);

    // Стейты для управления менб бронирования
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingEventId, setBookingEventId] = useState(null);
    const [bookingPerformanceId, setBookingPerformanceId] = useState(null);

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
          <div className="content-container">
            <h1 className="title">Чердак Хофнарра</h1>
            <p className="subtitle">Театральная студия</p>
            <h1 className="title-spbgasu">СПбГАСУ</h1>

            {error && <h1 className="error-text">Ошибка загрузки: {error}</h1>}
          </div>
        </div>
      </div>

      {/* Карусель */}
      <section className="carousel-container py-5 lg-pt-20">
        {loading && <div className="carousel-status">Загрузка репертуара...</div>}
        {error && <div className="carousel-status error">Ошибка: {error}</div>}

        <h1 className="carousel-title">Афиша</h1>

        <div
        // Из-за конфлитка Atropos и Swiper, требуется ручная настройка остановки карусели при наведении
          className="carousel-swiper-wrapper"
          onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
          onMouseLeave={() => swiperRef.current?.autoplay?.start()}
        >
          <Swiper
            // key заставляет Swiper переинициализироваться при изменении количества данных
            key={carouselItems.length}
            modules={[Navigation, Pagination, Autoplay]}
            slidesPerView="auto"
            spaceBetween={300}
            centeredSlides={true}
            loop={true}
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
                <SwiperSlide key={`${item.id}-${index}`} className="posters-swiper-slide">
                  <Atropos
                    className="atropos-card"
                    activeOffset={50} // Сила наклона
                    // highlight={false} // Подсветка карточки при наведении (тень)
                    shadow={false}
                    onClick={handleCardClick}
                  >
                    <a
                      className="x-card posters-swiper-card"
                      // target="_blank" // Открывать в новой вкладке.
                      // rel="noopener noreferrer" // Это для безопасноти (читать подробнее в инете), использовать в связке с _blank
                    >
                      {/* Картинка */}
                      <div className="x-card-img" data-atropos-offset="0">
                        <img src={item.imageUrl} alt={item.title} className="x-img__img" />
                      </div>

                      {/* Контент */}
                      <div className="posters-swiper-card-content">
                        <div className="content-bottom-align">
                          {hasActivePerformance ? (
                            <span className="card-activestate-true" data-atropos-offset="2">
                              Премьера
                            </span>
                          ) : (
                            <span className="card-activestate-false" data-atropos-offset="2">
                              Прошёл
                            </span>
                          )}

                          <span className="card-title" data-atropos-offset="6">
                            {item.title}
                          </span>

                          <span className="card-genre" data-atropos-offset="4">
                            {item.genre}
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