import { useState, useEffect } from "react";
import "../components-css/booking-menu.css"; 

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

function BookingMenu({ 
    isOpen, 
    onClose, 
    performances = [], // Пропсы по умолчанию
    initialPerformanceId = null, 
    initialEventId = null 
}) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState(""); 
    

    const [selectedPerformanceId, setSelectedPerformanceId] = useState("");
    const [selectedEventId, setSelectedEventId] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    // Сбрасываем форму и устанавливаем начальные ID при открытии окна
    // Делаем это. с помощью пропса isOpen (хватит use Effect, тут не нужно обновление при каждом рендере)
    useEffect(() => {
        if (isOpen) {
            setName("");
            setPhone("");
            setEmail("");
            setStatusMessage("");
            setIsSuccess(false);
            setSelectedPerformanceId(initialPerformanceId ? String(initialPerformanceId) : "");
            setSelectedEventId(initialEventId ? String(initialEventId) : "");
        }
    }, [isOpen, initialPerformanceId, initialEventId]);

    // Атоматический поиск спектакля, если передан только ID сеанса 
    useEffect(() => {
        if (isOpen && initialEventId && !initialPerformanceId) {
            const foundPerf = performances.find(perf => 
                perf.performances?.some(event => String(event.eventID) === String(initialEventId))
            );
            if (foundPerf) {
                setSelectedPerformanceId(String(foundPerf.id));
            }
        }
    }, [isOpen, initialEventId, initialPerformanceId, performances]);

    if (!isOpen) return null; // то есть если окно закрыто, ничего не выводим

    // Находим выбранный спектакль в массиве
    // Сделано в виде "цикла", с неивестной p
    const selectedPerf = performances.find(p => String(p.id) === String(selectedPerformanceId));


    const rawEvents = selectedPerf && Array.isArray(selectedPerf.performances) 
        ? selectedPerf.performances 
        : [];

    // ТЕСТОВЫЙ РЕЖИМ: Отображаем все сеансы (даже если у них "activestate": false)
    // const availableEvents = rawEvents;
    const availableEvents = rawEvents.filter(event => event.activestate === true);


    // Форматирование даты для адекватного вывода
    const formatEventDate = (dateVal) => {
        const actualDate = Array.isArray(dateVal) ? dateVal[0] : dateVal;
        const date = new Date(actualDate);
        return date.toLocaleString("ru-RU", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Отправка формы на сервер
    const handleSubmit = async (e) => {
        e.preventDefault(); // Нужно чтоб выполнение дождалось следующих условий, 
        // чтоб форму не отправить раньше времени и не вызвать тем перзеашрузку старницы 
        
        if (!selectedPerformanceId || !selectedEventId) {
            setStatusMessage("Пожалуйста, выберите спектакль и дату.");
            return;
        }

        try {
            setLoading(true);
            setStatusMessage("");

            // Если ФИО состоит менее чем из 3 частей, выводии ошибку
            const fioParts = name.trim().split(/\s+/).filter(Boolean);
            if (fioParts.length < 3) {
                setStatusMessage("Введите ФИО полностью.");
                return;
            }

            const response = await fetch(`${API_URL}/api/guests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    boundEventID: Number(selectedEventId),
                    surname: fioParts[0],
                    firstName: fioParts[1],
                    lastName: fioParts.slice(2).join(" "),
                    phoneNumber: phone.trim(),
                    email: email.trim()
                })
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setStatusMessage("Запись успешно оформлена! Ждем вас на спектакле.");
            } else {
                throw new Error(data.message || "Ошибка при отправке запроса");
            }
        } catch (err) {
            setIsSuccess(false);
            setStatusMessage(err.message || "Не удалось связаться с сервером");
        } finally {
            setLoading(false);
        }
    };



    
    return (
        <div className="booking-menu-overlay" onClick={onClose}>
            <div className="booking-menu-content" onClick={(e) => e.stopPropagation()}>
                
                <button className="menu-close-btn" onClick={onClose}>&times;</button>
                
                <h2>Запись на спектакль</h2>

                {isSuccess ? (
                    <div className="success-container">
                        <p className="status-success">{statusMessage}</p>
                        <button className="submit-btn" onClick={onClose}>Закрыть</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="booking-form">
                        
                        <div className="form-group">
                            <label>Ваше ФИО:</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Пушкин Александр Сергеевич"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Номер телефона:</label>
                            <input 
                                type="tel" 
                                required 
                                placeholder="+7 (812) 999-99-99"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        {/*ПОЧТА */}
                        <div className="form-group">
                            <label>Электронная почта (Email):</label>
                            <input 
                                type="email" 
                                required 
                                placeholder="example@mail.ru"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* ВЫБОР СПЕКТАКЛЯ */}
                        <div className="form-group">
                            <label>Спектакль:</label>
                            <select 
                                value={selectedPerformanceId}
                                onChange={(e) => {
                                    setSelectedPerformanceId(e.target.value);
                                    setSelectedEventId(""); 
                                }}
                                disabled={initialPerformanceId !== null} 
                                required
                            >
                                <option value="">-- Выберите спектакль --</option>
                                {performances.map(perf => (
                                    <option key={perf.id} value={perf.id}>
                                        {perf.title} ({perf.genre})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ВЫБОР СЕАНСА */}
                        <div className="form-group">
                            <label>Дата и время:</label>
                            <select 
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                disabled={initialEventId !== null} 
                                required
                            >
                                <option value="">
                                    {selectedPerformanceId ? "-- Выберите сеанс --" : "-- Сначала выберите спектакль --"}
                                </option>
                                {availableEvents.map(event => (
                                    <option key={event.eventID} value={event.eventID}>
                                        {formatEventDate(event.date)} — {event.scene}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {statusMessage && (
                            <p className="status-error">{statusMessage}</p>
                        )}

                        <button 
                            type="submit" 
                            className="submit-btn" 
                            disabled={loading}
                        >
                            {loading ? "Отправка..." : "Записаться"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default BookingMenu;
