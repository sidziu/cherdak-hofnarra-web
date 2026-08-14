import { useEffect, useState } from "react";
import "./Playbill.css";
import { API } from '../../api'; // Импортируем обьект API с функциями для запросов на сервер

import BookingMenu from "../../components/BookingMenu/BookingMenu.jsx"; 
import { useNavigate, NavLink } from "react-router-dom"; // роутинг

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

    // Разделяем афишу на актуальные и прошедшие показы
    const activeEvents = playbill.filter(p => p.activestate);
    const pastEvents = playbill.filter(p => !p.activestate);

    // Функция для рендера карточки спектакля
    const renderEventCard = (event) => (
        <div key={event.eventId} className="event-card">

            <div className="event-img-bg-container">
                <img 
                    src={event.image} 
                    className="event-img-bg"
                    alt="" 
                />
                <div className="event-img-container">
                    <img 
                        src={event.image} 
                        alt={event.title} 
                        className="event-img" 
                    />
                </div>
            </div>

            <div className="event-info">
                <div className="event-title-rating">
                    <h2 className="event-card-title">{event.title}</h2>
                    <p className="event-rating">{event.rating}</p>
                </div>

                <p className="event-genre"> <strong>Жанр:</strong> {event.genre}</p>
                <p className="event-director"> <strong>Режиссёр:</strong> {event.director}</p>
                <p className="event-description">{event.description}</p>

                <div className="event-details-info">
                    <span> {event.scene} </span>
                    <span>⏱ {event.duration} мин. </span>
                    <span className="play-date"> {event.date}</span>
                </div>

                {event.activestate ? (
                    <button 
                        className="booking-btn" 
                        onClick={() => openBooking(event.eventId, event.performanceId)}
                    >
                        Записаться на показ
                    </button>
                ) : (
                    <NavLink
                        to={`../archive/${event.performanceId}`}
                        state={{ title: event.title }}
                        className="booking-btn disabled" disabled
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;Перейти в архив&nbsp;&nbsp;&nbsp;&nbsp;
                    </NavLink>
                )}
            </div>
        </div>
    );


    return (
        <div className="playbill-container">
            <h1 className="playbill-title">Афиша</h1>
            <h1 className="line-divider" ></h1>

            {/* Логика c &&: Если loading = true => Показать "...." | Если = false => То ничего не показывать */}
            {loading && <p className="playbill-status">Загрузка актуальных спектаклей...</p>}
            {error && <p className="playbill-error">{error}</p>}

            <div className="playbill-list">
                {playbill.length === 0 && !loading && !error && (
                    <p className="playbill-status">В данный момент нет запланированных показов.</p>
                )}

                {activeEvents.map((event) => renderEventCard(event))}

                {pastEvents.length > 0 && (
                    <div className="events-divider-line-container">
                        <hr className="events-divider-line" />
                        <h3 className="events-divider-line-title">Недавно прошедшие</h3>
                    </div>
                )}

                {pastEvents.map((event) => renderEventCard(event))}
            </div>

            <BookingMenu
            // Стейты сверху
            isOpen={isBookingOpen}                      // Передаем текущее состояние (открыто/закрыто)
            onClose={closeBooking}                            // Передаем функцию закрытия внутрь формы
            rawPerformances={rawPerformances}                     // Даем форме все данные о спектаклях
            initialEventId={bookingEventId}               // Говорим форме, какой ID события мы выбрали
            initialPerformanceId={bookingPerformanceId} // Говорим форме, какой ID спектакля мы выбрали
            />

        </div>
    );
}

export default Playbill;
