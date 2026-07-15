import { useEffect, useState } from "react";
import "./Playbill.css";

import BookingMenu from "../../components/BookingMenu/BookingMenu.jsx"; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function Playbill() {
    const [playbill, setPlaybill] = useState([]);
    
    const [rawPerformances, setRawPerformances] = useState([]); // Сохраняем сырые данные для меню
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingEventId, setBookingEventId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function fetchPlaybill() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(`${API_URL}/api/performances`, { 
                    signal: controller.signal 
                });

                if (!response.ok) {
                    throw new Error("Не удалось загрузить афишу спектаклей");
                }

                const data = await response.json();
                
                setRawPerformances(data);

                const flatPlaybill = [];
                data.forEach((perf) => {
                    const eventsList = perf.performances;

                    if (eventsList && Array.isArray(eventsList)) {
                        eventsList.forEach((event) => {
                                flatPlaybill.push({
                                    id: event.eventID, 
                                    title: perf.title,
                                    genre: perf.genre,
                                    director: perf.director,
                                    description: perf.description,
                                    duration: perf.duration,
                                    rating: perf.rating,
                                    image: perf.imageUrl ? perf.imageUrl.split("/").pop() : "",
                                    scene: event.scene,
                                    activestate: event.activestate,
                                    date: Array.isArray(event.date) ? event.date[0] : event.date
                                });
                        });
                    }
                });

                // Сортируем показы по дате (от ближайших к поздним), чтобы афиша выглядела логично
                flatPlaybill.sort((a, b) => new Date(a.date) - new Date(b.date));

                setPlaybill(flatPlaybill);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchPlaybill();

        return () => {
            controller.abort();
        };
    }, []);

    const formatPlaybillDate = (isoString) => {
        if (!isoString) return "";
        const dateObj = new Date(isoString);
        return dateObj.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleOpenBooking = (eventId) => {
        setBookingEventId(eventId);
        setIsBookingOpen(true);
    };

    const handleCloseBooking = () => {
        setIsBookingOpen(false);
        setBookingEventId(null); // Сбрасываем выбранный ID
    };

    return (
        <div className="playbill-container">
            <h1 className="playbill-title">Афиша</h1>

            {loading && <p className="playbill-status">Загрузка актуальных спектаклей...</p>}
            {error && <p className="playbill-error">{error}</p>}

            <div className="playbill-list">
                {playbill.length === 0 && !loading && !error && (
                    <p className="playbill-status">В данный момент нет запланированных показов.</p>
                )}
                
                {playbill.map((play) => (
                    <div key={play.id} className="play-card">
                        
                        <div className="play-img-bg-container">
                            <img 
                                src={`${API_URL}/images/events/${play.image}`} 
                                className="play-img-bg"
                                alt="" 
                            />
                            <div className="play-img-container">
                                <img 
                                    src={`${API_URL}/images/events/${play.image}`} 
                                    alt={play.title} 
                                    className="play-img" 
                                />
                            </div>
                        </div>

                        <div className="play-info">
                             <div className="play-title-rating">
                                <h2 className="play-card-title">{play.title}</h2>
                                <p className="play-rating">{play.rating}</p>
                            </div>
                            <p className="play-genre"> <strong>Жанр:</strong> {play.genre}</p>
                            <p className="play-director"> <strong>Режиссёр:</strong> {play.director}</p>
                            <p className="play-description">{play.description}</p>
                            
                            <div className="play-event-info">
                                <span>📍 {play.scene} </span>
                                <span>⏱ {play.duration} мин. </span>
                                <span className="play-date"> {formatPlaybillDate(play.date)}</span>
                            </div>

                            {play.activestate ? (
                                <button 
                                    className="booking-btn" 
                                    onClick={() => handleOpenBooking(play.id)}
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
                isOpen={isBookingOpen} 
                onClose={handleCloseBooking} 
                performances={rawPerformances}
                initialEventId={bookingEventId}
            />

        </div>
    );
}

export default Playbill;
