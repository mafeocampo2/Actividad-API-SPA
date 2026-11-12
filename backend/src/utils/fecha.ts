export const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const dos = (n: number) => String(n).padStart(2, "0");

/** "HH:mm" → minutos desde la medianoche */
export const aMinutos = (hora: string): number => {
    const [h, m] = hora.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
};

/** minutos desde la medianoche → "HH:mm" */
export const aHora = (minutos: number): string => `${dos(Math.floor(minutos / 60))}:${dos(minutos % 60)}`;

/** Día de la semana de "YYYY-MM-DD" (0 = domingo), sin desfase por zona horaria */
export const diaSemana = (fecha: string): number => {
    const [y, m, d] = fecha.split("-").map(Number);
    return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getDay();
};

/** true si "YYYY-MM-DD" es una fecha real (descarta 2026-02-31) */
export const esFechaValida = (fecha: string): boolean => {
    if (!FECHA_REGEX.test(fecha)) return false;
    const [y, m, d] = fecha.split("-").map(Number);
    const date = new Date(y!, m! - 1, d!);
    return date.getFullYear() === y && date.getMonth() === m! - 1 && date.getDate() === d;
};

/** "YYYY-MM-DD" con la fecha LOCAL (no toISOString, que usa UTC) */
export const fechaLocal = (d: Date): string => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;

/** Fecha y hora LOCAL del servidor */
export const ahoraLocal = () => {
    const d = new Date();
    return {
        fecha: fechaLocal(d),
        hora: `${dos(d.getHours())}:${dos(d.getMinutes())}`
    };
};
