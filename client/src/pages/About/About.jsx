import {useEffect, useState} from "react";
import "./About.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

function About() {
    const [supervisors, setSupervisors] = useState([]);
    const [persons, setPersons] = useState([]);
    const [about, setAbout] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        
        async function loadData() {
            try {
                setLoading(true);
                setError("");

                const [personsRes, supervisorsRes, aboutRes] = await Promise.all([
                    fetch(`${API_URL}/api/persons`, { signal: controller.signal }),
                    fetch(`${API_URL}/api/supervisors`, { signal: controller.signal }),
                    fetch(`${API_URL}/api/about`, { signal: controller.signal })
                ]);

                if (!personsRes.ok) throw new Error("Не удалось загрузить актеров");
                if (!supervisorsRes.ok) throw new Error("Не удалось загрузить руководителей");
                if (!aboutRes.ok) throw new Error("Не удалось загрузить информацию о студии");

                const [personsData, supervisorsData, aboutData] = await Promise.all([
                    personsRes.json(),
                    supervisorsRes.json(),
                    aboutRes.json()
                ]);

                setPersons(personsData);
                setSupervisors(supervisorsData);
                setAbout(aboutData.text || aboutData); 
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

    return(
        <div className="about-container">

            <h1 className="about-us">О нас</h1>

            {loading && <p className="about-status">Загрузка информации...</p>}
            {error && <p className="about-error">{error}</p>}

            {!loading && !error && (
                <>
                    {/* Блок описания студии */}
                    <div className="about-description-box">
                        <p className="cherdak-opisanie">{about}</p>
                    </div>
                    
                    {/* Секция руководителей */}
                    <div className="team-section">
                        <h2 className="team-section-title">Руководство</h2>
                        <div className="persons-grid">
                            {supervisors.map((supervisor) => (
                                <div key={supervisor.id} className="person-card">
                                    <div className="person-photo-wrapper">
                                        <img src={supervisor.imageUrl} alt={supervisor.name} className="person-photo" />
                                    </div>
                                    <div className="person-info">
                                        <h3 className="person-name">{supervisor.name}</h3>
                                        <p className="person-role">{supervisor.role}</p>
                                        {supervisor.contact_info && (
                                            <p className="person-contact">{supervisor.contact_info}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Секция персоналий */}
                    <div className="team-section">
                        <h2 className="team-section-title">Рабочий состав</h2>
                        <div className="persons-grid">
                            {persons.map((person) => (
                                <div key={person.id} className="person-card">
                                    <div className="person-photo-wrapper">
                                        <img src={person.imageUrl} alt={person.name} className="person-photo" />
                                    </div>
                                    <div className="person-info">
                                        <h3 className="person-name">{person.name}</h3>
                                        <p className="person-role">{person.role}</p>
                                        {person.contact_info && (
                                            <p className="person-contact">{person.contact_info}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
            
        </div>
    );
}

export default About;