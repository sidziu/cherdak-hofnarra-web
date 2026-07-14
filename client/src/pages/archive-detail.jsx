import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../pages-css/archive-detail.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function ArchiveDetail() {
    const { id } = useParams(); // Извлекаем динамический ID из URL страницы

    const [performance, setPerformance] = useState(null);
    const [pastEvents, setPastEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadDetailData() {
            try {
                setLoading(true);
                setError("");

                // Параллельно запрашиваем архивные спектакли и общие спектакли (где лежат сеансы)
                const [archiveRes, perfRes] = await Promise.all([
                    fetch(`${API_URL}/api/archive`, { signal: controller.signal }),
                    fetch(`${API_URL}/api/performances`, { signal: controller.signal })
                ]);

                if (!archiveRes.ok) throw new Error("Не удалось загрузить информацию о спектакле");
                if (!perfRes.ok) throw new Error("Не удалось загрузить сеансы из пути performances");
                
                const [archiveData, perfData] = await Promise.all([
                    archiveRes.json(),
                    perfRes.json()
                ]);

                // Ищем описание спектакля в архиве
                const foundPerf = archiveData.find(p => String(p.id) === String(id));
                if (!foundPerf) {
                    throw new Error("Спектакль не найден в архиве");
                }

                // Ищем этот же спектакль в массиве performances, чтобы забрать оттуда его сеансы
                const matchedPerf = perfData.find(p => String(p.id) === String(id));
                const filteredEvents = matchedPerf && Array.isArray(matchedPerf.performances)
                    ? matchedPerf.performances
                    : [];

                setPerformance(foundPerf);
                setPastEvents(filteredEvents);
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

    // Перевод времнни
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

    const imageFilename = performance.image || (performance.imageUrl ? performance.imageUrl.split("/").pop() : "");

    return (
        <div className="archive-detail-container">
            
            <Link to="/archive" className="back-link">← Вернуться в архив</Link>

            <div className="detail-main-grid">
                
                <div className="detail-image-wrapper">
                    <img 
                        src={`${API_URL}/images/events/${imageFilename}`} 
                        alt={performance.title} 
                        className="detail-poster"
                        onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1516307365426-bea591f05011?q=80&w=600";
                        }}
                    />
                </div>

                <div className="detail-info-wrapper">
                    <div className="detail-header-row">
                        <span className="detail-genre">{performance.genre}</span>
                        <span className="detail-rating">{performance.rating}</span>
                    </div>

                    <h1 className="detail-title">{performance.title}</h1>
                    <p className="detail-director"><strong>Режиссёр-постановщик:</strong> {performance.director}</p>
                    <p className="detail-duration"><strong>Продолжительность:</strong> {performance.duration} мин.</p>
                    
                    <p className="detail-description">{performance.description}</p>
                </div>

            </div>

            {/* БЛОК 2: АРХИВНЫЕ ПОКАЗЫ (ИЗВЛЕЧЕННЫЕ ИЗ ПУТИ PERFORMANCES) */}
            <div className="detail-block-section">
                <h2 className="section-subtitle">Прошедшие показы</h2>
                {pastEvents.length === 0 ? (
                    <p className="no-data">Информация о датах показов в архиве уточняется.</p>
                ) : (
                    <ul className="past-events-list">
                        {pastEvents.map(event => (
                            <li key={event.eventID} className="past-event-item">
                                <span className="event-date"> {formatDate(event.date)}</span>
                                <span className="event-scene">{event.scene}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="detail-block-section">
                <h2 className="section-subtitle">Видеозапись выступления</h2>
                {performance.videos && performance.videos.length > 0 ? (
                    <div className="videos-grid" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {performance.videos.map((vidUrl, index) => (
                            <div key={index} className="video-player-container" style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
                                <iframe 
                                    src={vidUrl} 
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
                    <div className="video-placeholder">
                        <p>Видеозапись данного спектакля готовится к публикации и будет добавлена позже.</p>
                    </div>
                )}
            </div>

            <div className="detail-block-section">
                <h2 className="section-subtitle">Фотогалерея</h2>
                {performance.photoUrls && performance.photoUrls.length > 0 ? (
                    <div className="photos-grid">
                        {performance.photoUrls.map((url, index) => (
                            <div key={index} className="photo-item">
                                <img src={url} alt={`Кадр из спектакля ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="photos-placeholder">
                        <p className="no-data">Кадры с показов будут опубликованы в ближайшее время.</p>
                    </div>
                )}
            </div>

        </div>
    );
}

export default ArchiveDetail;
