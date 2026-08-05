const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const getAboutText = async (signal) => {
    const aboutRes = await fetch(`${API_URL}/api/about`, { signal });

    if (!aboutRes.ok) {
        throw new Error("Не удалось загрузить информацию о студии");
    }

    const aboutData = await aboutRes.json();
    return aboutData?.text || "";
};

export const getAbout = async (signal) => {
    const [personsRes, supervisorsRes, aboutRes] = await Promise.all([
        fetch(`${API_URL}/api/persons`, { signal }),
        fetch(`${API_URL}/api/supervisors`, { signal }),
        fetch(`${API_URL}/api/about`, { signal })
    ]);

    if (!personsRes.ok) throw new Error("Не удалось загрузить актеров");
    if (!supervisorsRes.ok) throw new Error("Не удалось загрузить руководителей");
    if (!aboutRes.ok) throw new Error("Не удалось загрузить информацию о студии");

    const [personsData, supervisorsData, aboutData] = await Promise.all([
        personsRes.json(),
        supervisorsRes.json(),
        aboutRes.json()
    ]);

    return {
        personsData,
        supervisorsData,
        aboutData,
    };
};
