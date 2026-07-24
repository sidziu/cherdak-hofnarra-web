import { useEffect, useState } from "react";
import "./Playbill.css";
import { API } from '../../api/Playbill.js'; // Импортируем обьект API с функциями для запросов на сервер

import BookingMenu from "../../components/BookingMenu/BookingMenu.jsx"; 

function Playbill() {
    const [playbill, setPlaybill] = useState([]);
    
    const [rawPerformances, setRawPerformances] = useState([]); // Сохраняем сырые данные для меню
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingEventId, setBookingEventId] = useState(null);
    const [bookingPerformanceId, setBookingPerformanceId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadData() {
            try {
                setLoading(true);
                setError("");

                const { playbill, rawPerformances } = await API.getPlaybill(controller.signal);
                
                setPlaybill(playbill);
                setRawPerformances(rawPerformances);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }

        loadData();

        return () => {
            controller.abort();
        };
    }, []);


    // Функция для перключения состояни панели бронирования, то есть при срабатвыание панель открроется/покажется
    // +Стейт с eventId поможет октрыть панель с правильно выбранным событием, например, если пользователь тыкнет по карточке со спектаклем
    const openBooking = (evId=null, perfId=null) => { // null - дефолтное значние, на случай если ничего не передано
        setBookingEventId(evId);
        setBookingPerformanceId(perfId);
        setIsBookingOpen(true);
    };
    // Функция для закрытия панели и сброса id для последующих открытий 
    const closeBooking = () => {
        setIsBookingOpen(false);
        setBookingPerformanceId(null);
        setBookingEventId(null); // Сбрасываем выбранный ID
    };


    return (
        // Написать в конспект отдельным разделом все: <div></div>, <p></p> и другие все возможные виды
        <div className="playbill-container">
            <h1 className="playbill-title">Афиша</h1>

            {/* Логика c &&: Если loading = true => Показать "...." | Если = false => То ничего не показывать */}
            {loading && <p className="playbill-status">Загрузка актуальных спектаклей...</p>}
            {error && <p className="playbill-error">{error}</p>}

            <div className="playbill-list">
                {playbill.length === 0 && !loading && !error && (
                    <p className="playbill-status">В данный момент нет запланированных показов.</p>
                )}
                
                {/* Записать в конспект логику метода .map
                Вкратце: Для каждого элемента в массиве (play в данном случая временное назвнание каждого элемента)
                Отрисуй : <div****></div>*/}
                {playbill.map((play) => (
                    // Записать отдельно key (логический обьект из React)
                    // Контейнер карточки события
                    <div key={play.eventId} className="play-card">

                        {/* Контейнер для левой части карточки с постером */}
                        <div className="play-img-bg-container">

                            {/* Заблюренный фон изображения */}
                            <img 
                                src={play.image} 
                                className="play-img-bg"
                                alt="" 
                            />
                            {/* Само изображние постера */}
                            <div className="play-img-container">
                                <img 
                                    src={play.image} 
                                    alt={play.title} 
                                    className="play-img" 
                                />
                            </div>
                        </div>

                        {/* Правая часть карточки с информацией*/}
                        <div className="play-info">

                            {/* Название и рейтинг */}
                             <div className="play-title-rating">
                                <h2 className="play-card-title">{play.title}</h2>
                                <p className="play-rating">{play.rating}</p>
                            </div>

                            {/* Данные спектакля */}
                            <p className="play-genre"> <strong>Жанр:</strong> {play.genre}</p>
                            <p className="play-director"> <strong>Режиссёр:</strong> {play.director}</p>
                            <p className="play-description">{play.description}</p>
                            
                            {/* Данные события */}
                            <div className="play-event-info">
                                <span>📍 {play.scene} </span>
                                <span>⏱ {play.duration} мин. </span>
                                <span className="play-date"> {play.date}</span>
                            </div>

                            {/* Проверка на актуальность спектакля и выбор нужного состояния кнопки */}
                            {/* {play.activestate ? "Активен" : "Прошел"} */}
                            {/*    activestate   =    true    |  false    */}
                            {play.activestate ? (
                                <button 
                                    className="booking-btn" 
                                    onClick={() => openBooking(play.eventId, play.performanceId)} // Передаём данные выбранного события
                                >
                                    Записаться на показ
                                </button>
                            ) : (
                                <button className="booking-btn disabled" disabled>Спектакль прошёл</button>
                            )}
                        </div>

                    </div>
                ))}
            </div>

            <BookingMenu
            // Стейты сверху
            isOpen={isBookingOpen}                      // Передаем текущее состояние (открыто/закрыто)
            onClose={closeBooking}                            // Передаем функцию закрытия внутрь формы
            performances={rawPerformances}                        // Даем форме все данные о спектаклях
            initialEventId={bookingEventId}               // Говорим форме, какой ID события мы выбрали
            initialPerformanceId={bookingPerformanceId} // Говорим форме, какой ID спектакля мы выбрали
            />

        </div>
    );
}

export default Playbill;
