import { useState, useEffect } from "react";
import "./BookingMenu.css"; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

function BookingMenu({ 
    // Передаем пропсы для работы с родительским компонентом
    isOpen, 
    onClose, 
    rawPerformances = [],
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
        // Сбрасываем форму и устанавливаем начальные ID при открытии окна
        if (isOpen) {
            setName("");
            setPhone("");
            setEmail("");
            setStatusMessage("");
            setIsSuccess(false);
            setSelectedPerformanceId(initialPerformanceId ? String(initialPerformanceId) : "");
            setSelectedEventId(initialEventId ? String(initialEventId) : "");


            // При открытом окне, кнопка escape закрывает форму
            const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }};
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
        
    }, [isOpen, initialPerformanceId, initialEventId]);
    // Пропсы в [] - условие чтобы useEffect срабатывал при их изменении, то есть если пользователь откроет форму, закроет, потом снова откроет, то данные будут сбрасываться и устанавливаться заново

    
    if (!isOpen) return null; // то есть если окно закрыто, то и код ничего не возвращает.

    // Находим выбранный спектакль в массиве
    // Сделано в виде "цикла", с неивестной "x"
    const selectedPerf = rawPerformances.find(x => String(x.id) === String(selectedPerformanceId));

    // Получаем список событий для выбранного спектакля, (да, они почему то по пути performances, мб я не так понял)
    const rawEvents = selectedPerf && Array.isArray(selectedPerf.performances) 
        ? selectedPerf.performances 
        : [];

    // Фильтруем события, оставляя только активные. Вообще оно не нужно, так как кнопка записи на неактивные события не отображается
    // И выбрать другое невозможно, но пущай будет
    const availableEvents = rawEvents.filter(event => event.activestate === true);
    const availablePerformances = rawPerformances.filter(perf => perf.performances.some(event => event.activestate === true)
    );



    // Функкия для конвертанции даты в удобный формат
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
                                //disabled={initialPerformanceId !== null} 
                                required
                            >
                                <option value="">-- Выберите спектакль --</option>
                                {availablePerformances.map(perf => (
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
                                //disabled={initialEventId !== null} 
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
