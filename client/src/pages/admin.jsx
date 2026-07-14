import { useState, useEffect, useRef } from 'react';
import '../pages-css/admin.css';

const API_URL = `${import.meta.env.VITE_API_URL}/api` || "http://localhost:3001";

const isTokenValid = (token) => {
    if (!token) return false;
    try {
        // Расшифровываем payload из JWT
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    } catch (e) {
        return false;
    }
};

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState('about');
    const [token, setToken] = useState(() => {
        const storedToken = localStorage.getItem('adminToken');
        return isTokenValid(storedToken) ? storedToken : null;
    });

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setToken(null);
    };

    const authFetch = async (endpoint, options = {}) => {
        if (!isTokenValid(token)) {
            alert("Время сессии истекло. Пожалуйста, авторизуйтесь заново.");
            handleLogout();
            return Promise.reject(new Error("Token expired"));
        }

        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.status === 401 || res.status === 403) {
            alert("Нет доступа или сессия недействительна. Пожалуйста, авторизуйтесь заново.");
            handleLogout();
            return Promise.reject(new Error("Unauthorized"));
        }

        return res;
    };

    if (!token) {
        return <LoginSection setToken={setToken} />;
    }

    return (
        <div className="admin-container">
            {/* Верхнее синее меню */}
            <div className="admin-top-nav">
                <a href="#" className={activeTab === 'about' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('about'); }}>О нас</a>
                <a href="#" className={activeTab === 'supervisors' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('supervisors'); }}>Руководство</a>
                <a href="#" className={activeTab === 'persons' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('persons'); }}>Рабочий состав</a>
                <a href="#" className={activeTab === 'events' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('events'); }}>События и спектакли</a>
                <a href="#" className={activeTab === 'archive' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('archive'); }}>Архив</a>
                {/* Кнопка выхода */}
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} style={{ marginLeft: 'auto', color: '#ffb3b3' }}>Выйти</a>
            </div>

            {/* Серая полоса (Sub-nav) */}
            <div className="admin-sub-nav">
                <span>PACKAGE: <strong>/api/{activeTab}</strong></span>
            </div>

            {/* Основной контент */}
            <div className="admin-content">
                <h1 className="admin-page-title">Management: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                
                {activeTab === 'about' && <AboutSection authFetch={authFetch} />}
                {activeTab === 'supervisors' && <SupervisorsSection authFetch={authFetch} />}
                {activeTab === 'persons' && <PersonsSection authFetch={authFetch} />}
                {activeTab === 'events' && <EventsSection authFetch={authFetch} />}
                {activeTab === 'archive' && <ArchiveSection authFetch={authFetch} />}
            </div>
        </div>
    );
}

/* =====================================================================
   СЕКЦИЯ: ABOUT
   ===================================================================== */

function AboutSection({ authFetch }) {
    const [text, setText] = useState("");

    useEffect(() => {
        authFetch(`/about`)
            .then(res => res.json())
            .then(data => setText(data.text || ""))
            .catch(err => console.error("Ошибка загрузки about:", err));
    }, []);

    const handleSave = async () => {
        try {
            const res = await authFetch(`/about`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });
            if (res.ok) alert("Информация успешно обновлена!");
            else alert("Ошибка при сохранении.");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="admin-form-section">
            <div className="admin-form-group">
                <label>Описание студии на странице "О нас"</label>
                <textarea
                    className="admin-textarea"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows="8" 
                />
            </div>
            <button className="admin-btn admin-btn-primary" onClick={handleSave}>Сохранить текст</button>
        </div>
    );
}

/* =====================================================================
   СЕКЦИЯ: SUPERVISORS
   ===================================================================== */
function SupervisorsSection({ authFetch }) {
    const [items, setItems] = useState([]);
    const fileRef = useRef();

    const loadItems = () => {
        authFetch(`/supervisors`)
            .then(res => res.json())
            .then(data => setItems(data))
            .catch(err => console.error(err));
    };

    useEffect(() => { loadItems(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const res = await authFetch(`/supervisors`, { method: "POST", body: formData });
            if (res.ok) {
                e.target.reset();
                if (fileRef.current) fileRef.current.value = "";
                loadItems();
                alert("Руководитель добавлен!");
            } else {
                const data = await res.json();
                alert(data.message || "Ошибка");
            }
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Удалить руководителя?")) return;
        await authFetch(`/supervisors/${id}`, { method: "DELETE" });
        loadItems();
    };

    const handleSwap = async (id1, id2) => {
        await authFetch(`/supervisors/swap`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id1, id2 })
        });
        loadItems();
    };

    return (
        <div>
            <div className="admin-tabs">
                <div className="admin-tab active">Добавить руководителя</div>
            </div>
            <form className="admin-form-section" onSubmit={handleAdd}>
                <div className="admin-form-group">
                    <label>Имя</label>
                    <input name="name" type="text" className="admin-input" required />
                </div>
                <div className="admin-form-group">
                    <label>Должность</label>
                    <input name="role" type="text" className="admin-input" required />
                </div>
                <div className="admin-form-group">
                    <label>Контактная информация</label>
                    <input name="contact_info" type="text" className="admin-input" required />
                </div>
                <div className="admin-form-group">
                    <label>Портрет</label>
                    <input name="image" type="file" className="admin-input" ref={fileRef} accept=".png,.jpg,.jpeg,.webp" required />
                </div>
                <button type="submit" className="admin-btn admin-btn-primary">Добавить руководителя</button>
            </form>

            <div className="admin-tabs"><div className="admin-tab active">Текущее руководство</div></div>
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead><tr><th>Портрет</th><th>Имя</th><th>Роль</th><th>Контакты</th><th>Порядок</th><th>Действия</th></tr></thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id}>
                                <td><img src={item.imageUrl} alt={item.name} /></td>
                                <td className="highlight-text">{item.name}</td>
                                <td>{item.role}</td>
                                <td>{item.contact_info}</td>
                                <td>
                                    <button className="admin-btn admin-btn-action" disabled={index === 0} onClick={() => handleSwap(item.id, items[index - 1].id)}>▲</button>
                                    <button className="admin-btn admin-btn-action" disabled={index === items.length - 1} onClick={() => handleSwap(item.id, items[index + 1].id)}>▼</button>
                                </td>
                                <td><button className="admin-btn admin-btn-danger" onClick={() => handleDelete(item.id)}>Удалить</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* =====================================================================
   СЕКЦИЯ: PERSONS
   ===================================================================== */
function PersonsSection({ authFetch }) {
    const [items, setItems] = useState([]);
    const fileRef = useRef();

    const loadItems = () => {
        authFetch(`/persons`)
            .then(res => res.json())
            .then(data => setItems(data))
            .catch(err => console.error(err));
    };

    useEffect(() => { loadItems(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const res = await authFetch(`/persons`, { method: "POST", body: formData });
            if (res.ok) {
                e.target.reset();
                if (fileRef.current) fileRef.current.value = "";
                loadItems();
                alert("Актер добавлен!");
            } else {
                const data = await res.json();
                alert(data.message || "Ошибка");
            }
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Удалить актера?")) return;
        await authFetch(`/persons/${id}`, { method: "DELETE" });
        loadItems();
    };

    const handleSwap = async (id1, id2) => {
        await authFetch(`/persons/swap`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id1, id2 })
        });
        loadItems();
    };

    return (
        <div>
            <div className="admin-tabs"><div className="admin-tab active">Добавить сотрудника</div></div>
            <form className="admin-form-section" onSubmit={handleAdd}>
                <div className="admin-form-group">
                    <label>Имя</label>
                    <input name="name" type="text" className="admin-input" required />
                </div>
                <div className="admin-form-group">
                    <label>Роль</label>
                    <input name="role" type="text" className="admin-input" required />
                </div>
                <div className="admin-form-group">
                    <label>Контактная информация (Телефон / Email)</label>
                    <input name="contact_info" type="text" className="admin-input" placeholder="+7 (999) 000-00-00 (необязательно)" />
                </div>
                <div className="admin-form-group">
                    <label>Портрет</label>
                    <input name="image" type="file" className="admin-input" ref={fileRef} accept=".png,.jpg,.jpeg,.webp" required />
                </div>
                <button type="submit" className="admin-btn admin-btn-primary">Добавить</button>
            </form>

            <div className="admin-tabs"><div className="admin-tab active">Текущий состав</div></div>
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead><tr><th>Портрет</th><th>Имя</th><th>Роль</th><th>Контакты</th><th>Порядок</th><th>Действия</th></tr></thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id}>
                                <td><img src={item.imageUrl} alt={item.name} /></td>
                                <td className="highlight-text">{item.name}</td>
                                <td>{item.role}</td>
                                <td>{item.contact_info || "—"}</td>
                                <td>
                                    <button className="admin-btn admin-btn-action" disabled={index === 0} onClick={() => handleSwap(item.id, items[index - 1].id)}>▲</button>
                                    <button className="admin-btn admin-btn-action" disabled={index === items.length - 1} onClick={() => handleSwap(item.id, items[index + 1].id)}>▼</button>
                                </td>
                                <td><button className="admin-btn admin-btn-danger" onClick={() => handleDelete(item.id)}>Удалить</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* =====================================================================
   СЕКЦИЯ: EVENTS / PERFORMANCES
   ===================================================================== */
function EventsSection({ authFetch }) {
    const [items, setItems] = useState([]);
    const [subTab, setSubTab] = useState('add-perf'); 
    const fileRef = useRef();

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [guests, setGuests] = useState([]);

    const loadGuests = async (eventID) => {
        try {
            const res = await authFetch(`/events/${eventID}/guests`);
            const data = await res.json();
            setGuests(data);
        } catch (err) { console.error(err); }
    };

    const openGuestManager = (event, perfTitle) => {
        setSelectedEvent({ ...event, perfTitle });
        loadGuests(event.eventID);
    };

    const closeGuestManager = () => {
        setSelectedEvent(null);
        setGuests([]);
    };

    const handleAddGuest = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());
        payload.boundEventID = selectedEvent.eventID;

        try {
            const res = await authFetch(`/guests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                e.target.reset();
                loadGuests(selectedEvent.eventID);
                alert("Гость успешно записан!");
            } else {
                const data = await res.json();
                alert(data.message || "Ошибка регистрации");
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteGuest = async (individual_ID) => {
        if (!window.confirm("Удалить этого гостя?")) return;
        try {
            await authFetch(`/guests/${individual_ID}`, { method: "DELETE" });
            loadGuests(selectedEvent.eventID);
        } catch (err) { console.error(err); }
    };

    const handleDeleteAllGuests = async () => {
        if (!window.confirm("ВНИМАНИЕ! Вы уверены, что хотите удалить ВСЕХ гостей, записанных на этот показ?")) return;
        try {
            await authFetch(`/events/${selectedEvent.eventID}/guests`, { method: "DELETE" });
            loadGuests(selectedEvent.eventID);
            alert("Список гостей очищен.");
        } catch (err) { console.error(err); }
    };

    const handleCopyGuests = () => {
        if (guests.length === 0) {
            alert("Список гостей пуст.");
            return;
        }
        // Формируем текст для рукописного списка
        const textToCopy = guests.map((g, i) => `${i + 1}. ${g.surname} ${g.firstName} ${g.lastName}`).join('\n');
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => alert("Список гостей скопирован в буфер обмена!"))
            .catch(err => console.error("Ошибка копирования: ", err));
    };

    const loadItems = () => {
        authFetch(`/performances`)
            .then(res => res.json())
            .then(data => setItems(data))
            .catch(err => console.error(err));
    };

    useEffect(() => { loadItems(); }, []);

    const handleAddPerformance = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const res = await authFetch(`/performances`, { method: "POST", body: formData });
            if (res.ok) {
                e.target.reset();
                if (fileRef.current) fileRef.current.value = "";
                loadItems();
                alert("Спектакль успешно создан!");
            } else {
                const data = await res.json();
                alert(data.message || "Ошибка при создании спектакля");
            }
        } catch (error) { console.error(error); }
    };

    // Добавление новой даты показа
    const handleAddEvent = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const rawDate = formData.get("date");

        const payload = {
            performanceReferenceID: formData.get("performanceReferenceID"),
            scene: formData.get("scene"),
            date: rawDate ? new Date(rawDate).toISOString() : "",
            activestate: formData.get("activestate")
        };

        try {
            const res = await authFetch(`/events`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                e.target.reset();
                loadItems();
                alert("Показ добавлен в расписание!");
            } else {
                const data = await res.json();
                alert(data.message || "Ошибка при добавлении показа");
            }
        } catch (error) { console.error(error); }
    };

    // Удаление ВСЕГО спектакля
    const handleDeletePerformance = async (id) => {
        if (
            !window.confirm("ВНИМАНИЕ! Это действие удалит этот спектакль и ВСЕ его показы. Продолжить?") 
            ||
            !window.confirm("ВНИМАНИЕ! Это действие удалит этот спектакль и ВСЕ его показы. Подтвердите удаление.")
        ) return;
        
        await authFetch(`/performances/${id}`, { method: "DELETE" });
        loadItems();
    };

    // Удаление конкретной даты показа
    const handleDeleteEvent = async (eventID) => {
        if (!window.confirm("Удалить этот конкретный показ?")) return;
        await authFetch(`/events/${eventID}`, { method: "DELETE" });
        loadItems();
    };

    // Переключение активности у конкретного показа
    const handleToggleActive = async (eventID) => {
        try {
            const res = await authFetch(`/events/${eventID}/toggle-active`, { method: "PATCH" });
            if (res.ok) loadItems();
            else alert("Ошибка при переключении статуса");
        } catch (error) { console.error(error); }
    };

    return (
        <div>
            <div className="admin-tabs" style={{ marginBottom: "15px" }}>
                <button className={`admin-tab ${subTab === 'add-perf' ? 'active' : ''}`} onClick={() => setSubTab('add-perf')}>Создать спектакль</button>
                <button className={`admin-tab ${subTab === 'add-event' ? 'active' : ''}`} onClick={() => setSubTab('add-event')}>Добавить показ в афишу</button>
            </div>

            {subTab === 'add-perf' && (
                <form className="admin-form-section" onSubmit={handleAddPerformance}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                        <div>
                            <div className="admin-form-group"><label>Название спектакля</label><input name="title" type="text" className="admin-input" required /></div>
                            <div className="admin-form-group"><label>Жанр</label><input name="genre" type="text" className="admin-input" required /></div>
                            <div className="admin-form-group"><label>Режиссёр</label><input name="director" type="text" className="admin-input" required /></div>
                        </div>
                        <div>
                            <div className="admin-form-group"><label>Длительность (минут)</label><input name="duration" type="number" className="admin-input" required /></div>
                            <div className="admin-form-group"><label>Рейтинг (напр. PEGI 16 / 0+)</label><input name="rating" type="text" className="admin-input" required /></div>
                            <div className="admin-form-group"><label>Афишный постер</label><input name="image" type="file" className="admin-input" ref={fileRef} accept=".png,.jpg,.jpeg,.webp" required /></div>
                        </div>
                    </div>
                    <div className="admin-form-group" style={{ marginTop: "10px" }}><label>Описание</label><textarea name="description" className="admin-textarea" required></textarea></div>
                    <button type="submit" className="admin-btn admin-btn-primary">Создать Спектакль</button>
                </form>
            )}

            {/* Форма 2 - Создание даты показа */}
            {subTab === 'add-event' && (
                <form className="admin-form-section" onSubmit={handleAddEvent}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                        <div>
                            <div className="admin-form-group">
                                <label>Выберите спектакль</label>
                                <select name="performanceReferenceID" className="admin-input" required>
                                    <option value="">-- Выберите из списка --</option>
                                    {items.map(perf => (
                                        <option key={perf.id} value={perf.id}>{perf.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="admin-form-group"><label>Зал / Сцена</label><input name="scene" type="text" className="admin-input" required placeholder="Зал №1" /></div>
                        </div>
                        <div>
                            <div className="admin-form-group"><label>Дата и время показа</label><input name="date" type="datetime-local" className="admin-input" required /></div>
                            <div className="admin-form-group">
                                <label>Статус публикации</label>
                                <select name="activestate" className="admin-input">
                                    <option value="true">Активен (Отображается)</option>
                                    <option value="false">Скрыт</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary">Опубликовать Дату в Афишу</button>
                </form>
            )}

            {/* ТАБЛИЦА С ВЛОЖЕННОЙ СТРУКТУРОЙ */}
            <div className="admin-tabs" style={{ marginTop: "30px" }}><div className="admin-tab active">Спектакли и Расписание</div></div>
            <div className="admin-table-wrapper" style={{ overflowX: "auto" }}>
                <table className="admin-table">
                    <thead><tr><th style={{ width: "10%" }}>Постер</th><th style={{ width: "25%" }}>Информация о Спектакле</th><th style={{ width: "50%" }}>Показы в афише (Дата | Зал | Статус)</th><th style={{ width: "15%" }}>Действия</th></tr></thead>
                    <tbody>
                        {items.length === 0 && <tr><td colSpan="4" style={{ textAlign: "center" }}>Нет добавленных спектаклей.</td></tr>}
                        {items.map((item) => (
                            <tr key={item.id} style={{ verticalAlign: "top" }}>
                                <td><img src={item.imageUrl} alt={item.title} /></td>
                                <td>
                                    <div className="highlight-text">{item.title}</div>
                                    <div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>{item.genre}</div>
                                    <div style={{ fontSize: "12px" }}><strong>Режиссер:</strong> {item.director}</div>
                                    <div style={{ fontSize: "12px" }}><strong>Время:</strong> {item.duration} мин</div>
                                    <div style={{ fontSize: "12px" }}><strong>Возраст:</strong> {item.rating}</div>
                                </td>
                                <td>
                                    {item.performances.length === 0 ? (
                                        <span style={{ color: "#aaa", fontSize: "12px" }}>Показов не запланировано</span>
                                    ) : (
                                        <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                                            <tbody>
                                                {item.performances.map((perf) => {
                                                    const formattedDate = new Date(perf.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                                    return (
                                                        <tr key={perf.eventID} style={{ borderBottom: "1px dashed #eee" }}>
                                                            <td style={{ padding: "4px 0", fontWeight: "bold" }}>{formattedDate}</td>
                                                            <td style={{ padding: "4px 0" }}>{perf.scene}</td>
                                                            <td style={{ padding: "4px 0" }}>
                                                                <span style={{ color: perf.activestate ? "#2ca02c" : "#d62728", fontWeight: "bold" }}>{perf.activestate ? "Активен" : "Скрыт"}</span>
                                                            </td>
                                                            <td style={{ padding: "4px 0", textAlign: "right" }}>
                                                                <button className="admin-btn admin-btn-action" onClick={() => openGuestManager(perf, item.title)} style={{ marginRight: "5px" }}>👥 Гости</button>
                                                                <button className="admin-btn admin-btn-action" onClick={() => handleToggleActive(perf.eventID)}>{perf.activestate ? "Скрыть" : "Показать"}</button>
                                                                <button className="admin-btn admin-btn-action admin-btn-danger" onClick={() => handleDeleteEvent(perf.eventID)}>&times;</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </td>
                                <td>
                                     {/* Удаление всей карточки спектакля */}
                                     <button className="admin-btn admin-btn-danger" onClick={() => handleDeletePerformance(item.id)} style={{ width: "100%" }}>Удалить Спектакль</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedEvent && (
                <div style={{ marginTop: "40px", border: "2px solid #4A779D", padding: "20px", backgroundColor: "#f9f9f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc", paddingBottom: "10px", marginBottom: "15px" }}>
                        <h2 style={{ margin: 0, fontSize: "18px", color: "#2c4a5e" }}>Список гостей: {selectedEvent.perfTitle}</h2>
                        <button className="admin-btn admin-btn-danger" onClick={closeGuestManager}>Закрыть ✕</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
                        {/* Форма добавления гостя вручную */}
                        <div>
                            <div className="admin-tabs"><div className="admin-tab active">Записать гостя</div></div>
                            <form className="admin-form-section" onSubmit={handleAddGuest} style={{ marginBottom: 0 }}>
                                <div className="admin-form-group"><label>Фамилия</label><input name="surname" type="text" className="admin-input" required /></div>
                                <div className="admin-form-group"><label>Имя</label><input name="firstName" type="text" className="admin-input" required /></div>
                                <div className="admin-form-group"><label>Отчество</label><input name="lastName" type="text" className="admin-input" required /></div>
                                <div className="admin-form-group"><label>Email</label><input name="email" type="email" className="admin-input" /></div>
                                <div className="admin-form-group"><label>Телефон</label><input name="phoneNumber" type="text" className="admin-input" /></div>
                                <button type="submit" className="admin-btn admin-btn-primary" style={{ width: "100%" }}>Добавить гостя</button>
                            </form>
                        </div>
                        {/* Список гостей */}
                        <div>
                            <div className="admin-tabs" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <div className="admin-tab active">Зарегистрировано: {guests.length}</div>
                                <div style={{ marginBottom: "5px" }}>
                                    <button className="admin-btn admin-btn-action" onClick={handleCopyGuests} style={{ marginRight: "10px" }}>📋 Копировать список</button>
                                    <button className="admin-btn admin-btn-danger admin-btn-action" onClick={handleDeleteAllGuests}>Очистить весь список</button>
                                </div>
                            </div>
                            <div className="admin-table-wrapper" style={{ maxHeight: "400px", overflowY: "auto" }}>
                                <table className="admin-table">
                                    <thead><tr><th>№</th><th>ФИО</th><th>Контакты</th><th>Удалить</th></tr></thead>
                                    <tbody>
                                        {guests.length === 0 && <tr><td colSpan="4" style={{ textAlign: "center" }}>На этот показ пока никто не записался.</td></tr>}
                                        {guests.map((guest, idx) => (
                                            <tr key={guest.individual_ID}>
                                                <td>{idx + 1}</td>
                                                <td className="highlight-text">{guest.surname} {guest.firstName} {guest.lastName}</td>
                                                <td style={{ fontSize: "12px" }}><div>{guest.phoneNumber || "—"}</div><div style={{ color: "#666" }}>{guest.email || "—"}</div></td>
                                                <td><button className="admin-btn admin-btn-danger admin-btn-action" onClick={() => handleDeleteGuest(guest.individual_ID)}>✕</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* =====================================================================
   СЕКЦИЯ: ARCHIVE
   ===================================================================== */
function ArchiveSection({ authFetch }) {
    const [archiveItems, setArchiveItems] = useState([]);
    const [performances, setPerformances] = useState([]);
    const [persons, setPersons] = useState([]);

    // Загружаем и архив, и афишу
    const loadData = () => {
        authFetch(`/archive`).then(res => res.json()).then(setArchiveItems).catch(console.error);
        authFetch(`/performances`).then(res => res.json()).then(setPerformances).catch(console.error);
        authFetch(`/persons`).then(res => res.json()).then(setPersons).catch(console.error);
    };

    useEffect(() => { loadData(); }, []);

    const pendingPerformances = performances.filter(perf => 
        perf.performances.length === 0 || perf.performances.every(event => event.activestate === false)
    );

    const handleArchivePerformance = async (id) => {
        if (!window.confirm("Скопировать этот спектакль в архив?")) return;
        try {
            const res = await authFetch(`/performances/${id}/archive`, { method: "POST" });
            if (res.ok) {
                alert("Спектакль успешно скопирован в архив!");
                loadData();
            } else {
                const data = await res.json();
                alert(data.message || "Ошибка при архивации");
            }
        } catch (error) { console.error(error); }
    };

    // Удаление архива
    const handleDeleteArchive = async (id) => {
        if (!window.confirm("Полностью удалить этот архив и все его медиа-файлы?")) return;
        await authFetch(`/archive/${id}`, { method: "DELETE" });
        loadData();
    };

    // Добавление видео (ссылки)
    const handleAddVideo = async (e, id) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const videoUrl = formData.get("videoUrl");
        if (!videoUrl) return;

        try {
            const res = await authFetch(`/archive/${id}/videos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoUrl })
            });
            if (res.ok) {
                e.target.reset();
                loadData();
            } else alert("Ошибка добавления видео");
        } catch (error) { console.error(error); }
    };

    // Добавление фотографий (файлов)
    const handleAddPhotos = async (e, id) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const res = await authFetch(`/archive/${id}/photos`, { method: "POST", body: formData });
            if (res.ok) {
                e.target.reset();
                loadData();
            } else alert("Ошибка загрузки фото");
        } catch (error) { console.error(error); }
    };

    // Добавление актера в состав спектакля (по его ID)
    const handleAddActor = async (e, id) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const actorId = formData.get("actorId");
        if (!actorId) return;

        try {
            const res = await authFetch(`/archive/${id}/actors`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ actorId })
            });
            if (res.ok) {
                e.target.reset();
                loadData();
            } else {
                const data = await res.json();
                alert(data.message || "Ошибка добавления актера");
            }
        } catch (error) { console.error(error); }
    };

    // Удаление видео
    const handleDeleteVideo = async (id, videoUrl) => {
        if (!window.confirm("Удалить это видео?")) return;
        await authFetch(`/archive/${id}/videos`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoUrl })
        });
        loadData();
    };

    // Удаление фото
    const handleDeletePhoto = async (id, photoName) => {
        if (!window.confirm("Удалить это фото?")) return;
        await authFetch(`/archive/${id}/photos`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoName })
        });
        loadData();
    };

    // Удаление актера из архивного состава
    const handleDeleteActor = async (id, actorId) => {
        if (!window.confirm("Удалить актера из состава участников этого спектакля?")) return;
        try {
            await authFetch(`/archive/${id}/actors`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ actorId })
            });
            loadData();
        } catch (error) { console.error(error); }
    };

    return (
        <div>
            {/* ТАБЛИЦА ГОТОВЫХ К АРХИВАЦИИ СПЕКТАКЛЕЙ */}
            <div className="admin-tabs"><div className="admin-tab active">Готовы к архивации</div></div>
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead><tr><th>Постер</th><th>Заголовок и жанр</th><th>Режиссёр</th><th>Действия</th></tr></thead>
                    <tbody>
                        {pendingPerformances.length === 0 && <tr><td colSpan="4" style={{ textAlign: "center" }}>Нет спектаклей, готовых к отправке в архив.</td></tr>}
                        {pendingPerformances.map(perf => (
                            <tr key={perf.id}>
                                <td><img src={perf.imageUrl} alt={perf.title} /></td>
                                <td><div className="highlight-text">{perf.title}</div><div style={{ fontSize: "11px", color: "#666" }}>{perf.genre}</div></td>
                                <td>{perf.director}</td>
                                <td><button className="admin-btn admin-btn-primary" onClick={() => handleArchivePerformance(perf.id)}>Отправить в архив</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="admin-tabs" style={{ marginTop: "30px" }}><div className="admin-tab active">Управление архивными записями</div></div>
            <div className="admin-table-wrapper" style={{ overflowX: "auto" }}>
                <table className="admin-table">
                    <thead><tr><th style={{ width: "20%" }}>Информация</th><th style={{ width: "22%" }}>Видео</th><th style={{ width: "24%" }}>Фотогалерея</th><th style={{ width: "24%" }}>Актёры</th><th style={{ width: "10%" }}>Действия</th></tr></thead>
                    <tbody>
                        {archiveItems.map(item => (
                            <tr key={item.id} style={{ verticalAlign: "top" }}>
                                {/* ИНФОРМАЦИЯ */}
                                <td>
                                    <img src={item.imageUrl} alt={item.title} style={{ marginBottom: "10px" }} />
                                    <div className="highlight-text">{item.title}</div>
                                    <div style={{ fontSize: "12px", color: "#333" }}>{item.director}</div>
                                    <div style={{ fontSize: "11px", color: "#666" }}>{item.duration} минут | {item.rating}</div>
                                </td>
                                {/* ВИДЕО */}
                                <td>
                                    <ul style={{ margin: "0 0 10px 0", paddingLeft: "15px", fontSize: "12px", wordBreak: "break-all" }}>
                                        {item.videos?.map((vid, idx) => (
                                            <li key={idx} style={{ marginBottom: "5px" }}>
                                                <a href={vid} target="_blank" rel="noreferrer" style={{ color: "#4A6782" }}>Ссылка {idx + 1}</a>
                                                <button className="admin-btn admin-btn-action" style={{ color: "red", marginLeft: "5px", border: "none", background: "none", padding: "0" }} onClick={() => handleDeleteVideo(item.id, vid)}>✕</button>
                                            </li>
                                        ))}
                                    </ul>
                                    {/* Форма добавления видео */}
                                    <form onSubmit={(e) => handleAddVideo(e, item.id)} style={{ display: "flex", gap: "5px" }}>
                                        <input type="url" name="videoUrl" placeholder="URL..." className="admin-input" required style={{ padding: "4px" }} />
                                        <button type="submit" className="admin-btn">Добавить</button>
                                    </form>
                                </td>
                                {/* ФОТОГРАФИИ */}
                                <td>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                                        {item.photoUrls?.map((url, idx) => (
                                            <div key={idx} style={{ position: "relative" }}>
                                                <img src={url} alt={`gallery-${idx}`} style={{ height: "40px", width: "40px", objectFit: "cover" }} />
                                                <button onClick={() => handleDeletePhoto(item.id, item.photos[idx])} style={{ position: "absolute", top: "-5px", right: "-5px", background: "red", color: "white", border: "none", borderRadius: "50%", width: "15px", height: "15px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Форма добавления фото */}
                                    <form onSubmit={(e) => handleAddPhotos(e, item.id)} style={{ display: "flex", gap: "5px" }}>
                                        <input type="file" name="photos" multiple accept=".png,.jpg,.jpeg,.webp" className="admin-input" required style={{ padding: "2px" }} />
                                        <button type="submit" className="admin-btn">Загрузить</button>
                                    </form>
                                </td>
                                <td>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                                        {item.actors?.map((actor) => (
                                            <div key={actor.id} style={{ position: "relative", textAlign: "center", width: "45px" }}>
                                                <img src={actor.imageUrl} alt={actor.name} style={{ height: "35px", width: "35px", borderRadius: "50%", objectFit: "cover", border: "1px solid #ccc" }} title={`${actor.name} (${actor.role})`} />
                                                <div style={{ fontSize: "9px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={actor.name}>{actor.name.split(' ')[0]}</div>
                                                <button onClick={() => handleDeleteActor(item.id, actor.id)} style={{ position: "absolute", top: "-3px", right: "-3px", background: "red", color: "white", border: "none", borderRadius: "50%", width: "13px", height: "13px", fontSize: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Селектор для выбора актера */}
                                    <form onSubmit={(e) => handleAddActor(e, item.id)} style={{ display: "flex", gap: "5px" }}>
                                        <select name="actorId" className="admin-input" required style={{ padding: "4px", fontSize: "11px" }}>
                                            <option value="">Добавить актёра</option>
                                            {persons.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.role})</option>))}
                                        </select>
                                        <button type="submit" className="admin-btn">Добавить</button>
                                    </form>
                                </td>
                                {/* ДЕЙСТВИЯ */}
                                <td><button className="admin-btn admin-btn-danger" onClick={() => handleDeleteArchive(item.id)}>Удалить запись</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* =====================================================================
   СЕКЦИЯ: LOGIN
   ===================================================================== */
function LoginSection({ setToken }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        
        try {
            // Здесь используем обычный fetch, так как токена у нас еще нет
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                // Сохраняем токен в память браузера
                localStorage.setItem('adminToken', data.token);
                setToken(data.token);
            } else {
                setError(data.message || "Ошибка входа");
            }
        } catch (err) {
            console.error(err);
            setError("Ошибка подключения к серверу");
        }
    };

    return (
        <div className="admin-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <form className="admin-form-section" onSubmit={handleLogin} style={{ width: '400px', margin: 0, padding: '30px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c4a5e' }}>Вход в панель управления</h2>
                {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center', fontSize: '14px' }}>{error}</div>}
                
                <div className="admin-form-group">
                    <label>Логин</label>
                    <input type="text" className="admin-input" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="admin-form-group">
                    <label>Пароль</label>
                    <input type="password" className="admin-input" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%' }}>Войти</button>
            </form>
        </div>
    );
}
