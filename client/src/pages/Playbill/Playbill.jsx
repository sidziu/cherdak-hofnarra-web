import { useEffect, useState } from "react";
import "./Playbill.css";
import { API } from '../../api'; 

import BookingMenu from "../../components/BookingMenu/BookingMenu.jsx"; 
import { useNavigate, NavLink } from "react-router-dom"; 

function Playbill() {
    const [playbill, setPlaybill] = useState([]);
    const [rawPerformances, setRawPerformances] = useState([]); 
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingEventId, setBookingEventId] = useState(null);
    const [bookingPerformanceId, setBookingPerformanceId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Стейт для развертывания и сворачивания текст на мобилах 
    const [expandedText, setExpandedText] = useState({}); 

    const [itsMobileWindow, setItsMobileWindow] = useState(() =>
        typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
    );

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
                if (err.name !== "AbortError") setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
        return () => controller.abort();
    }, []);


    const expendText = (eventId) => {
        setExpandedText(prev => ({
            ...prev,
            [eventId]: !prev[eventId]
        }));
    };

    const openBooking = (evId=null, perfId=null) => {
        setBookingEventId(evId);
        setBookingPerformanceId(perfId);
        setIsBookingOpen(true);
    };

    const closeBooking = () => {
        setIsBookingOpen(false);
        setBookingPerformanceId(null);
        setBookingEventId(null);
    };

    const activeEvents = playbill.filter(p => p.activestate);
    const pastEvents = playbill.filter(p => !p.activestate);

    const renderEventCard = (event) => {
        const isExpanded = !!expandedText[event.eventId];

        return (
            <div key={event.eventId} className="event-card">
                <div className="event-img-bg-container">
                    <img src={event.image} className="event-img-bg" alt="" />
                    <div className="event-img-container">
                        <img src={event.image} alt={event.title} className="event-img" />
                    </div>
                </div>

                <div className="event-info">
                    <div className="event-title-rating">
                        <h2 className="event-card-title">{event.title}</h2>
                        <p className="event-rating">{event.rating}</p>
                    </div>

                    <p className="event-genre"> <strong>Жанр:</strong> {event.genre}</p>
                    <p className="event-director"> <strong>Режиссёр:</strong> {event.director}</p>
                    
                    <p className="event-description">
                        {itsMobileWindow && !isExpanded && event.description.length > 150
                            ? `${event.description.slice(0, 100)}`
                            : event.description}

                        {itsMobileWindow && event.description.length > 150 && (
                            <span 
                                className="event-description-read-more" 
                                onClick={() => expendText(event.eventId)}
                            >
                                {isExpanded ? " ...свернуть" : " ...развернуть"}
                            </span>
                        )}
                    </p>

                    <div className="event-details-info">
                        <span> {event.scene} </span>
                        <span>⏱ {event.duration} мин. </span>
                        <span className="play-date"> {event.date}</span>
                    </div>

                    {event.activestate ? (
                        <button className="booking-btn" onClick={() => openBooking(event.eventId, event.performanceId)}>
                            Записаться на показ
                        </button>
                    ) : (
                        <NavLink to={`../archive/${event.performanceId}`} state={{ title: event.title }} className="booking-btn disabled">
                            &nbsp;&nbsp;&nbsp;&nbsp;Перейти в архив&nbsp;&nbsp;&nbsp;&nbsp;
                        </NavLink>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="playbill-container">
            <h1 className="playbill-title">Афиша</h1>
            <h1 className="line-divider"></h1>

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
                isOpen={isBookingOpen}
                onClose={closeBooking}
                rawPerformances={rawPerformances}
                initialEventId={bookingEventId}
                initialPerformanceId={bookingPerformanceId}
            />
        </div>
    );
}

export default Playbill;