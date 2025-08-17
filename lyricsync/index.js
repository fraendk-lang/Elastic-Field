import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenerativeAI } from "@google/genai";
const App = () => {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [file, setFile] = useState(null);
    const [lyrics, setLyrics] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [render, setRender] = useState(null);
    const audioRef = useRef(null);
    const [time, setTime] = useState(0);
    const raf = useRef(0);
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio)
            return;
        const tick = () => {
            setTime(audio.currentTime);
            raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => raf.current && cancelAnimationFrame(raf.current);
    }, []);
    const activeIndex = (() => {
        const idx = lyrics.findIndex((l) => time >= l.startTime && time < l.endTime);
        if (idx !== -1)
            return idx;
        if (time >= (lyrics[lyrics.length - 1]?.endTime || 0))
            return lyrics.length - 1;
        return 0;
    })();
    useEffect(() => {
        const el = document.querySelector(`.line[data-index="${activeIndex}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [activeIndex]);
    async function handleGenerate() {
        if (!file)
            return;
        setError(null);
        setLoading(true);
        try {
            const b64 = await fileToBase64(file);
            const genAI = new GoogleGenerativeAI(window.GOOGLE_API_KEY || "");
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                responseSchema: {
                    type: "object",
                    properties: {
                        lines: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    text: { type: "string" },
                                    startTime: { type: "number" },
                                    endTime: { type: "number" },
                                    words: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                word: { type: "string" },
                                                startTime: { type: "number" },
                                                endTime: { type: "number" }
                                            },
                                            required: ["word", "startTime", "endTime"]
                                        }
                                    }
                                },
                                required: ["text", "startTime", "endTime", "words"]
                            }
                        }
                    },
                    required: ["lines"]
                }
            });
            const prompt = `Transkribiere den Song als JSON mit Zeilen und Wort-Timings. Songtitel: ${title}. Interpret: ${artist}. Gebe ausschließlich JSON aus.`;
            const audioPart = { inlineData: { data: b64, mimeType: file.type || "audio/mpeg" } };
            const result = await model.generateContent([audioPart, { text: prompt }]);
            const text = result.response?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
            const json = JSON.parse(text);
            if (!validate(json.lines))
                throw new Error("Ungültige Daten von KI");
            setLyrics(json.lines);
        }
        catch (e) {
            console.error(e);
            setError(e.message || "Fehler bei der Analyse");
            setLyrics([]);
        }
        finally {
            setLoading(false);
        }
    }
    function validate(lines) {
        return lines.every(line => line.startTime < line.endTime &&
            line.words && line.words.length &&
            line.words.every(w => w.startTime >= line.startTime && w.endTime <= line.endTime && w.startTime < w.endTime));
    }
    function getWordProgress(w) {
        if (time <= w.startTime)
            return 0;
        if (time >= w.endTime)
            return 1;
        return (time - w.startTime) / (w.endTime - w.startTime);
    }
    function fileToBase64(f) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const res = reader.result.split(",")[1] || "";
                resolve(res);
            };
            reader.onerror = reject;
            reader.readAsDataURL(f);
        });
    }
    function exportLRC() {
        if (!lyrics.length)
            return;
        const header = `[ti:${title}]\n[ar:${artist}]\n`;
        const body = lyrics.map((l) => {
            const mm = String(Math.floor(l.startTime / 60)).padStart(2, "0");
            const ss = (l.startTime % 60).toFixed(2).padStart(5, "0");
            return `[${mm}:${ss}]${l.text}`;
        }).join("\n");
        const blob = new Blob([header + body], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title || "song"}.lrc`;
        a.click();
        URL.revokeObjectURL(url);
    }
    async function exportVideo() {
        if (!file || !lyrics.length)
            return;
        setRender({ progress: 0, message: "Video wird gerendert..." });
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");
        const fps = 30;
        const array = await file.arrayBuffer();
        const audioCtx = new AudioContext();
        const audioBuf = await audioCtx.decodeAudioData(array);
        const total = Math.ceil(audioBuf.duration * fps);
        const stream = canvas.captureStream(fps);
        const audioStream = audioRef.current?.captureStream();
        let mime = "video/mp4";
        if (!MediaRecorder.isTypeSupported(mime))
            mime = "video/webm";
        const tracks = audioStream ? [...stream.getVideoTracks(), ...audioStream.getAudioTracks()] : stream.getTracks();
        const recStream = new MediaStream(tracks);
        const rec = new MediaRecorder(recStream, { mimeType: mime });
        const chunks = [];
        rec.ondataavailable = e => e.data.size && chunks.push(e.data);
        rec.start();
        for (let i = 0; i < total; i++) {
            const t = i / fps;
            drawFrame(ctx, t);
            setRender({ progress: i / total, message: "Video wird gerendert..." });
            await new Promise(r => setTimeout(r, 0));
        }
        rec.stop();
        await new Promise(r => rec.onstop = r);
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = mime === "video/mp4" ? "lyricsync.mp4" : "lyricsync.webm";
        a.click();
        URL.revokeObjectURL(url);
        setRender({ progress: 1, message: "Video wird fertiggestellt..." });
    }
    function drawFrame(ctx, t) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.font = "32px sans-serif";
        ctx.fillText(`${title} – ${artist}`, 640, 80);
        const idx = lyrics.findIndex((l) => t >= l.startTime && t < l.endTime);
        const current = idx !== -1 ? idx : lyrics.length - 1;
        const prev = lyrics[current - 1];
        const curr = lyrics[current];
        const next = lyrics[current + 1];
        if (prev)
            drawLine(ctx, prev.text, 320, false);
        if (curr)
            drawLine(ctx, curr.text, 370, true, curr, t);
        if (next)
            drawLine(ctx, next.text, 420, false);
    }
    function drawLine(ctx, text, y, active, line, t) {
        let size = active ? 60 : 40;
        ctx.font = `${size}px sans-serif`;
        while (ctx.measureText(text).width > 1180 && size > 10) {
            size -= 2;
            ctx.font = `${size}px sans-serif`;
        }
        ctx.fillStyle = active ? "#777" : "#444";
        ctx.fillText(text, 640, y);
        if (active && line && typeof t === "number") {
            const width = ctx.measureText(text).width;
            const progress = lineProgress(line, t, ctx);
            ctx.save();
            ctx.beginPath();
            ctx.rect(640 - width / 2, y - size, width * progress, size * 1.2);
            ctx.clip();
            ctx.fillStyle = "#00aaff";
            ctx.fillText(text, 640, y);
            ctx.restore();
        }
    }
    function lineProgress(line, t, ctx) {
        let used = 0;
        const total = ctx.measureText(line.text).width;
        for (const w of line.words) {
            const wWidth = ctx.measureText(w.word + " ").width;
            if (t >= w.endTime)
                used += wWidth;
            else if (t > w.startTime) {
                const part = (t - w.startTime) / (w.endTime - w.startTime);
                used += wWidth * Math.min(Math.max(part, 0), 1);
                break;
            }
            else
                break;
        }
        return used / total;
    }
    return (_jsxs("div", { className: "app", children: [_jsx("h1", { children: "LyricSync AI" }), _jsxs("div", { className: "form", style: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }, children: [_jsx("input", { type: "text", placeholder: "Songtitel", value: title, onChange: (e) => setTitle(e.target.value) }), _jsx("input", { type: "text", placeholder: "Interpret", value: artist, onChange: (e) => setArtist(e.target.value) }), _jsx("input", { type: "file", accept: "audio/*", onChange: (e) => {
                            const f = e.target.files?.[0] || null;
                            setFile(f);
                            if (f && audioRef.current)
                                audioRef.current.src = URL.createObjectURL(f);
                        } }), _jsx("button", { onClick: handleGenerate, disabled: !file || loading, children: "Analyse starten" })] }), loading && _jsx("p", { children: "Analyse l\u00E4uft\u2026" }), error && _jsx("p", { className: "error", children: error }), _jsx("audio", { ref: audioRef, controls: true, style: { width: '100%' } }), lyrics.length > 0 && (_jsx("div", { className: "lyrics-container", children: lyrics.map((line, i) => (_jsx("div", { "data-index": i, className: `line${i === activeIndex ? " active" : ""}`, children: line.words.map((w, j) => (_jsxs("span", { className: "word", children: [_jsx("span", { className: "fill", style: { clipPath: `inset(0 ${100 - getWordProgress(w) * 100}% 0 0)` }, children: w.word }), w.word, j < line.words.length - 1 && ' '] }, j))) }, i))) })), render && (_jsx("div", { className: "progress", children: _jsx("div", { style: { width: `${(render.progress * 100).toFixed(1)}%` } }) })), render && _jsx("p", { children: render.message }), lyrics.length > 0 && (_jsxs("div", { className: "actions", children: [_jsx("button", { onClick: exportVideo, children: "Video exportieren" }), _jsx("button", { onClick: exportLRC, children: "LRC exportieren" })] }))] }));
};
createRoot(document.getElementById("root")).render(_jsx(App, {}));
