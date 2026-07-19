const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

//Объект API, в котором будут все функции для запросов к серверу
export const API = {
    getPlaybill: async (signal) => {

        // Функкия для конвертанции даты в удобный формат
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

        //*Прописать в конспект конструкцию fetch, есть открытая вкладка гугл (да и в целом конструкция с асинхронным запросом)
        //*Также рядом прописать конструкцию с вызовом фунции на стороне React
        const response = await fetch(`${API_URL}/api/performances`, { signal });
        //*Уточнить у backend разработчика. Мы не запрашиваем файл events.json, так сервер сам склеивает perf.и events, найти events можно по forEach

        if (!response.ok) throw new Error("Не удалось загрузить спектакли");

        const data = await response.json();
        // response.json() - превращет ответ в текст (json), пишем await так как превращение в json может занять время :\

        // ---- //
        const flatPlaybill = []; // Создаем пустой массив, куда будем складывать переработанные данные performancr под афишу
        // flat -  плоский, "выпрямляем" предыдущий массив с массивами в один список обьектов, то есть чтобы на каждую дату был отдельный обьект
        // то есть был спектакль и в нем: все даты,... | теперь будет - карточка 1: название, дата, ....
        data.forEach((perf) => {
            const eventsList = perf.performances;
            // perf - переменная, которую только что создали, туда кладем временно один мпссив данных !спектакля!
            if (eventsList && Array.isArray(eventsList)) { //&& - "и", если оба условия верны | Проверяем есть ли вообще performances и является ли он массивом | Чтобы если кривые данные на сервере, сайт не упал, хотя вряд ли кнчн
                eventsList.forEach((event) => {
                    flatPlaybill.push({
                        id: event.eventID, // id - !события!
                        title: perf.title,
                        genre: perf.genre,
                        director: perf.director,
                        description: perf.description, 
                        duration: perf.duration,
                        rating: perf.rating,
                        image: perf.imageUrl || "", //? perf.imageUrl.split("/").pop() : "", //so strang, уточняем с backend разработчиком
                        // Написать в конспект, рядом как работать с изоображениями в react
                        scene: event.scene,
                        activestate: event.activestate,
                        date: formatPlaybillDate(event.date), // Вызываем функцию для конвертации даты в удобный формат
                        rawDate: event.date, // Сохраняем исходную дату для сортировки событий ( ниже )
                    });
                });
            }
        });

        //*Записать как работает
        flatPlaybill.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

        return {
            playbill: flatPlaybill, // Сами отсортированные данные афиши
            rawPerformances: data, // Сырые данные performances, (например, для bookingMenu или для настроек фильтра)

        };
    }
}