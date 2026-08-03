import { useState, useEffect } from "react";
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

function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Состояние меню бронирования
  const [menuParams, setMenuParams] = useState({
    performanceId: null,
    eventId: null,
  }); // Параметры для заполнения формы записи

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

  // Данные для карусели
  // let - потому что мы будем изменять массив
  let carouselItems = [...performances];

  // Склеиваем массив сам с собой, чтоб корректно работал loop при малом количестве спектаклей
  if (carouselItems.length > 0 && carouselItems.length < 5) {
    while (carouselItems.length < 8) {
      carouselItems = carouselItems.concat(performances);
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

        <Swiper
          // key заставляет Swiper переинициализироваться при изменении количества данных
          key={carouselItems.length}
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView="auto"
          spaceBetween={300}
          centeredSlides={true}
          loop={true}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
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
            const activestateEvent = Array.isArray(item.performances)
              ? item.performances.some((event) => event.activestate === true)
              : false;

            return (
              // Так как мы дублируем массив, то ключи могут повторяться, поэтому приклеиваем "-" и индекс
              <SwiperSlide key={`${item.id}-${index}`} className="posters-swiper-slide">
                <Atropos
                  className="atropos-card"
                  activeOffset={50} // Сила наклона
                  highlight={false}
                  shadow={false}
                >
                  <a
                    href={`/archive/${item.id}`}
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
                        {activestateEvent ? (
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
      </section>

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