import {useEffect, useState} from "react";
import "./About.css";

import { API } from '../../api'; // Импортируем обьект API с функциями для запросов на сервер

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


                const { personsData, supervisorsData, aboutData } = await API.getAbout(controller.signal);

                setPersons(personsData || []);
                setSupervisors(supervisorsData || []);
                setAbout(aboutData?.text || aboutData || ""); 
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

    const renderCard = (person) => (
        <div key={person.id} className="person-card">
            <div className="person-photo-container">
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
    );

    return(
        <div className="about-container">

            <h1 className="about-us">О нас</h1>

            {loading && <p className="about-status">Загрузка информации...</p>}
            {error && <p className="about-error">{error}</p>}

            {!loading && !error && (
                <>
                    {/* Блок описания студии */}
                    <div className="about-description-container">
                        <p className="cherdak-opisanie">{about}</p>
                    </div>
                    
                    {/* Секция руководителей */}
                    <div className="team-container">
                        <h2 className="team-title">Руководство</h2>
                        <div className="persons-grid">
                            {supervisors.map((supervisor) => renderCard(supervisor))}
                        </div>
                    </div>

                    {/* Секция персоналий */}
                    <div className="team-container">
                        <h2 className="team-title">Актерский состав</h2>
                        <div className="persons-grid">
                            {persons.map((actor) => renderCard(actor))}
                        </div>
                    </div>

                    {/* Секция неактивных персоналий */}
                    <div className="team-container">
                        <h2 className="team-title">Бывшие участники</h2>
                        <div className="persons-grid">
                            {persons.map((actor) => renderCard(actor))}
                            {/* {nonActivePersons.map((person) => renderCard(person))} */}
                        </div>
                    </div>
                </>
            )}
            
        </div>
    );
}

export default About;