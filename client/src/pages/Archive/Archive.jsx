import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Archive.css";

import { API } from '../../api'; // Импортируем обьект API с функциями для запросов на сервер

function Archive() {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function fetchArchive() {
            try {
                setLoading(true);
                setError("");

                const response = await API.getArchive(controller.signal);

                setPerformances(response);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchArchive();

        return () => {
            controller.abort();
        };
    }, []);

    return (
        <div className="archive-container">
            <h1 className="archive-title">Архив спектаклей</h1>

            {loading && <p className="archive-status">Загрузка архивных материалов...</p>}
            {error && <p className="archive-error">{error}</p>}

            <div className="archive-grid">
                {performances.map((perf) => {
                    const imageFilename = perf.image || (perf.imageUrl ? perf.imageUrl.split("/").pop() : "");

                    return (
                        <div key={perf.id} className="archive-card">
                            
                            <div className="archive-img-container">
                                <img 
                                    src={perf.imageUrl} 
                                    alt={perf.title} 
                                    className="archive-card-img"
                                    onError={(e) => {
                                        e.target.src = "https://images.unsplash.com/photo-1516307365426-bea591f05011?q=80&w=400";
                                    }}
                                />
                            </div>

                            <div className="archive-card-info">
                                <span className="archive-card-genre">{perf.genre}</span>
                                <h2 className="archive-card-title">{perf.title}</h2>
                                <p className="archive-card-director">Режиссёр: {perf.director}</p>
                                
                                <Link 
                                    to={`/archive/${perf.id}`} 
                                    state={{ title: perf.title }}
                                    className="archive-more-btn"
                                >
                                    Подробнее: запись, фото
                                </Link>
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Archive;