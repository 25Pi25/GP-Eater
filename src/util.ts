export function clamp(min: number, main: number, max: number) {
    return Math.min(Math.max(min, main), max);
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));