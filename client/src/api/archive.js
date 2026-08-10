const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const getArchive = async (signal) => {

    const response = await fetch(`${API_URL}/api/archive`, { signal });

    if (!response.ok) throw new Error("Не удалось загрузить архив");

    const data = await response.json();

    return(data);
}