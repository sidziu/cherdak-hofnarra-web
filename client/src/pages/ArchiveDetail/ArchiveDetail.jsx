import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./ArchiveDetail.css";

import errorImage from "../../assets/logotypes/logo-meow-red-withbg.webp";
import { API } from '../../api';

function ArchiveDetail() {
    const { id } = useParams();

    const [performance, setPerformance] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Стейт для индекса открытой фотографии (null- просмотр закрыт)
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
    
    // Стейт для развертывания и сворачивания текст на мобилах
    const [isTextExpanded, setIsTextExpanded] = useState(false); 

    // Для скоролла карусели на мобильных устройствах
    const [itsMobileWindow, setItsMobileWindow] = useState(() =>
    //typeof - возвращает тип переменной | Если мобила => то true, нет false
        typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
    );

    useEffect(() => {
        const controller = new AbortController();

        async function loadDetailData() {
            try {
                setLoading(true);
                setError("");

                const [archivesData, perfsData] = await Promise.all([
                    API.getArchive(controller.signal),
                    API.getPerformances(controller.signal)
                ]);

                const archiveData = archivesData.find(p => String(p.id) === String(id));
                if (!archiveData) {
                    throw new Error("Спектакль не найден в архиве");
                }

                const foundPerf = perfsData.find(p => String(p.id) === String(id));
                const eventsData = foundPerf && Array.isArray(foundPerf.performances)
                    ? foundPerf.performances
                    : [];

                setPerformance(archiveData);
                setEvents(eventsData);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }

        loadDetailData();

        return () => {
            controller.abort();
        };
    }, [id]);

    // Логика клавиш для фото (Esc для закрытия, стрелки для навигации)
    useEffect(() => {
        if (selectedPhotoIndex === null) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setSelectedPhotoIndex(null);
            } else if (event.key === "ArrowRight") {
                handleNextPhoto();
            } else if (event.key === "ArrowLeft") {
                handlePrevPhoto();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedPhotoIndex]);

    const handleNextPhoto = () => {
        setSelectedPhotoIndex((prev) => 
            prev === performance.photoUrls.length - 1 ? 0 : prev + 1
        );
    };

    const handlePrevPhoto = () => {
        setSelectedPhotoIndex((prev) => 
            prev === 0 ? performance.photoUrls.length - 1 : prev - 1
        );
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) return <div className="detail-status">Загрузка информации...</div>;
    if (error) return <div className="detail-status error">{error} <br /><br /><Link to="/archive" className="back-link">Вернуться в архив</Link></div>;
    if (!performance) return null;

    return (
        <div className="archive-detail-section">
            
            <Link to="/archive" className="back-link">← Вернуться в архив</Link>

            <div className="detail-performance-container">
                <div className="detail-image-container">
                    <img 
                        src={performance.imageUrl} 
                        alt={performance.title} 
                        className="detail-poster"
                        onError={(e) => { e.target.src = errorImage; }}
                    />
                </div>

                <div className="detail-performance-info-container">
                    <div className="detail-header">
                        <span className="detail-genre">{performance.genre}</span>
                        <span className="detail-rating">{performance.rating}</span>
                    </div>

                    <h1 className="detail-title">{performance.title}</h1>
                    <p className="detail-director"><strong>Режиссёр:</strong> {performance.director}</p>
                    <p className="detail-duration"><strong>Продолжительность:</strong> {performance.duration} мин.</p>
                    <h1 className="line-divider"></h1>
                    <p className="detail-description">
                        {itsMobileWindow && !isTextExpanded && performance.description.length > 150
                        ? `${performance.description.slice(0, 150)}`
                        : performance.description}
    
                        {itsMobileWindow && performance.description.length > 150 && (
                        <span 
                            className="detail-description-read-more" 
                            onClick={() => setIsTextExpanded(!isTextExpanded)}
                        >
                            {isTextExpanded ? " ...свернуть" : " ...развернуть"}
                        </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Прошедшие показы */}
            <div className="detail-events-section">
                <h2 className="detail-events-title">Прошедшие показы</h2>
                <h1 className="line-divider"></h1>
                {events.length === 0 ? (
                    <p className="no-data">Информация о датах показов в архиве уточняется.</p>
                ) : (
                    <ul className="detail-events-list">
                        {events.map(event => (
                            <li key={event.eventID} className="past-event">
                                <span className="past-event-date"> {formatDate(event.date)}</span>
                                <span className="past-event-scene">{event.scene}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Видео */}
            <div className="detail-videos-section">
                <h2 className="detail-events-title">Видеозаписи выступления</h2>
                <h1 className="line-divider"></h1>
                {performance.videos && performance.videos.length > 0 ? (
                    <div className="detail-videos-container">
                        {performance.videos.map((videoUrl, index) => (
                            <div key={index} className="archive-video-player-container">
                                <iframe 
                                    src={videoUrl} 
                                    title={`Видеозапись спектакля ${performance.title} - Часть ${index + 1}`}
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                                ></iframe>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="archive-video-placeholder">
                        <p>Видеозапись данного спектакля остутствует или будет добавлена позже.</p>
                    </div>
                )}
            </div>

            {/* Фотогалерея */}
            <div className="detail-videos-section">
                <h2 className="detail-events-title">Фотогалерея</h2>
                <h1 className="line-divider"></h1>
                {performance.photoUrls && performance.photoUrls.length > 0 ? (
                    <div className="archive-photos-container">
                        {performance.photoUrls.map((url, index) => (
                            <div 
                                key={index} 
                                className="photo-item" 
                                onClick={() => setSelectedPhotoIndex(index)}
                            >
                                <img src={url} alt={`Кадр из спектакля ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="archive-photos-placeholder">
                        <p className="no-data">Кадры с данного спектакля остутствуют или будут добавлены позже</p>
                    </div>
                )}
            </div>

            {/* Просмотр фото bigscreen */}
            {/* Метод e.stopPropagation - для того чтоб не работа onClick оверлэя  */}
            {selectedPhotoIndex !== null && (
                <div className="view-photo-overlay" onClick={() => setSelectedPhotoIndex(null)}>
                    <button className="view-photo-close" onClick={() => setSelectedPhotoIndex(null)}>&times;</button>
                    
                    <button className="view-photo-nav prev" onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }}>&#10094;</button>
                    
                    <div className="view-photo-content" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={performance.photoUrls[selectedPhotoIndex]} 
                            alt="Просмотр фото" 
                            className="view-photo-image"
                        />
                    </div>

                    <button className="view-photo-nav next" onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }}>&#10095;</button>
                </div>
            )}

        </div>
    );
}

export default ArchiveDetail;