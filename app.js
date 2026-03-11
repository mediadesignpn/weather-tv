// ============================================================
// WEATHER BORDER - App Principal
// Texas data: NWS DWML XML
// Coahuila data: Open-Meteo
// Radar: RainViewer + Leaflet
// Alertas: NWS API (Maverick County, TX)
// ============================================================

// --- CONFIGURACIÓN ---
const MAIN_CITY = {
    name: 'PIEDRAS NEGRAS / EAGLE PASS',
    lat: 28.709,
    lon: -100.4724,
};

const NWS_ZONE = 'TXZ218';
const NWS_COUNTY = 'TXC323';

// NWS DWML URL builder
function nwsDwmlUrl(lat, lon) {
    return `https://forecast.weather.gov/MapClick.php?lat=${lat}&lon=${lon}&unit=0&lg=english&FcstType=dwml`;
}

// --- CITIES ---
const COAHUILA_CITIES = [
    { name: 'Acuña',     lat: 29.3241, lon: -100.9319 },
    { name: 'Jiménez',   lat: 29.0722, lon: -100.6961 },
    { name: 'Nava',      lat: 28.4219, lon: -100.7678 },
    { name: 'Guerrero',  lat: 28.3064, lon: -100.3239 },
    { name: 'Sabinas',   lat: 27.8486, lon: -101.1197 },
];

const TEXAS_CITIES = [
    { name: 'Laredo',       lat: 27.5036, lon: -99.5076 },
    { name: 'Del Rio',      lat: 29.3627, lon: -100.8968 },
    { name: 'Uvalde',       lat: 29.2097, lon: -99.7862 },
    { name: 'San Antonio',  lat: 29.4241, lon: -98.4936 },
    { name: 'Cotulla',      lat: 28.4369, lon: -99.2351 },
];

// --- METEOCONS ICON SYSTEM ---
// Animated SVG icons from Basmilius Meteocons
const ICON_BASE = 'icons';

function iconUrl(name) {
    return `${ICON_BASE}/${name}.svg`;
}

// --- RESPONSIVE SCALING ---
function getScale() {
    return Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
}

function rs(baseSize) {
    return Math.max(Math.round(baseSize * getScale()), Math.round(baseSize * 0.35));
}

function responsiveZoom(baseZoom) {
    const w = window.innerWidth;
    if (w >= 1600) return baseZoom;
    if (w >= 1200) return baseZoom - 0.5;
    if (w >= 800) return baseZoom - 1;
    return baseZoom - 1.5;
}

function iconImg(name, size) {
    const s = rs(size);
    return `<img src="${iconUrl(name)}" width="${s}" height="${s}" alt="" style="display:block;">`;
}

// Check if it's nighttime
function isNight() {
    const h = new Date().getHours();
    return h < 6 || h >= 20;
}

function dayNight(dayName, nightName) {
    return isNight() ? nightName : dayName;
}

// --- WMO Weather Codes (for Open-Meteo / Coahuila) ---
const WMO_CODES = {
    0:  { icon: () => dayNight('clear-day', 'clear-night'),                desc: 'Despejado' },
    1:  { icon: () => dayNight('partly-cloudy-day', 'partly-cloudy-night'), desc: 'Mayormente despejado' },
    2:  { icon: () => dayNight('partly-cloudy-day', 'partly-cloudy-night'), desc: 'Parcialmente nublado' },
    3:  { icon: () => 'overcast',                                           desc: 'Nublado' },
    45: { icon: () => dayNight('fog-day', 'fog-night'),                     desc: 'Neblina' },
    48: { icon: () => dayNight('fog-day', 'fog-night'),                     desc: 'Neblina helada' },
    51: { icon: () => 'drizzle',                                            desc: 'Llovizna ligera' },
    53: { icon: () => 'drizzle',                                            desc: 'Llovizna moderada' },
    55: { icon: () => 'drizzle',                                            desc: 'Llovizna densa' },
    56: { icon: () => 'sleet',                                              desc: 'Llovizna helada' },
    57: { icon: () => 'sleet',                                              desc: 'Llovizna helada densa' },
    61: { icon: () => dayNight('partly-cloudy-day-rain', 'partly-cloudy-night-rain'), desc: 'Lluvia ligera' },
    63: { icon: () => 'rain',                                               desc: 'Lluvia moderada' },
    65: { icon: () => 'rain',                                               desc: 'Lluvia fuerte' },
    66: { icon: () => 'sleet',                                              desc: 'Lluvia helada ligera' },
    67: { icon: () => 'sleet',                                              desc: 'Lluvia helada fuerte' },
    71: { icon: () => dayNight('partly-cloudy-day-snow', 'partly-cloudy-night-snow'), desc: 'Nevada ligera' },
    73: { icon: () => 'snow',                                               desc: 'Nevada moderada' },
    75: { icon: () => 'snow',                                               desc: 'Nevada fuerte' },
    77: { icon: () => 'hail',                                               desc: 'Granizo fino' },
    80: { icon: () => dayNight('partly-cloudy-day-rain', 'partly-cloudy-night-rain'), desc: 'Chubascos ligeros' },
    81: { icon: () => 'rain',                                               desc: 'Chubascos moderados' },
    82: { icon: () => 'thunderstorms-rain',                                 desc: 'Chubascos fuertes' },
    85: { icon: () => 'snow',                                               desc: 'Chubascos de nieve' },
    86: { icon: () => 'snow',                                               desc: 'Chubascos de nieve fuertes' },
    95: { icon: () => 'thunderstorms',                                      desc: 'Tormenta eléctrica' },
    96: { icon: () => 'thunderstorms-rain',                                 desc: 'Tormenta con granizo' },
    99: { icon: () => 'thunderstorms-rain',                                 desc: 'Tormenta con granizo fuerte' },
};

function getWeatherInfo(code) {
    const entry = WMO_CODES[code] || { icon: () => 'thermometer', desc: '' };
    return { icon: entry.icon(), desc: entry.desc };
}

// NWS summary -> Meteocon icon name
function nwsSummaryIcon(summary) {
    if (!summary) return 'thermometer';
    const s = summary.toLowerCase();
    if (s.includes('tornado'))                                      return 'tornado';
    if (s.includes('hurricane'))                                    return 'hurricane';
    if (s.includes('thunder') || s.includes('tstms'))               return 'thunderstorms-rain';
    if (s.includes('rain') || s.includes('showers'))                return 'rain';
    if (s.includes('drizzle'))                                      return 'drizzle';
    if (s.includes('snow') || s.includes('blizzard'))               return 'snow';
    if (s.includes('ice') || s.includes('freezing') || s.includes('sleet')) return 'sleet';
    if (s.includes('fog') || s.includes('mist'))                    return dayNight('fog-day', 'fog-night');
    if (s.includes('haze'))                                         return dayNight('haze-day', 'haze-night');
    if (s.includes('dust'))                                         return 'dust-wind';
    if (s.includes('wind') || s.includes('breezy'))                 return 'wind';
    if (s.includes('overcast'))                                     return 'overcast';
    if (s.includes('mostly cloudy'))                                return dayNight('overcast-day', 'overcast-night');
    if (s.includes('partly cloudy') || s.includes('partly sunny'))  return dayNight('partly-cloudy-day', 'partly-cloudy-night');
    if (s.includes('mostly sunny') || s.includes('mostly clear'))   return dayNight('partly-cloudy-day', 'partly-cloudy-night');
    if (s.includes('sunny') || s.includes('clear') || s.includes('fair')) return dayNight('clear-day', 'clear-night');
    if (s.includes('hot'))                                          return 'thermometer-warmer';
    if (s.includes('cold'))                                         return 'thermometer-colder';
    return dayNight('partly-cloudy-day', 'partly-cloudy-night');
}

// NWS summary -> Background image URL (Unsplash)
function getWeatherBackground(summary) {
    if (!summary) return 'backgrounds/default.jpg';
    const s = summary.toLowerCase();
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 20;

    if (s.includes('tornado')) {
        return 'backgrounds/tornado.jpg';
    }
    if (s.includes('thunder') || s.includes('tstms') || s.includes('storm')) {
        return 'backgrounds/thunderstorm.jpg';
    }
    if (s.includes('rain') || s.includes('showers') || s.includes('drizzle')) {
        return 'backgrounds/rain.jpg';
    }
    if (s.includes('snow') || s.includes('blizzard') || s.includes('ice') || s.includes('sleet') || s.includes('freezing')) {
        return 'backgrounds/snow.jpg';
    }
    if (s.includes('fog') || s.includes('mist') || s.includes('haze')) {
        return 'backgrounds/fog.jpg';
    }
    if (s.includes('wind') || s.includes('breezy')) {
        return 'backgrounds/wind.jpg';
    }
    if (s.includes('overcast') || s.includes('cloudy') && !s.includes('partly')) {
        return 'backgrounds/overcast.jpg';
    }
    if (s.includes('partly') || s.includes('mostly cloudy')) {
        if (isNight) return 'backgrounds/partly-cloudy-night.jpg';
        return 'backgrounds/partly-cloudy-day.jpg';
    }
    if (s.includes('hot')) {
        return 'backgrounds/hot.jpg';
    }
    // Clear / Sunny / Fair
    if (isNight) {
        return 'backgrounds/clear-night.jpg';
    }
    return 'backgrounds/clear-day.jpg';
}

function setCurrentBackground(summary) {
    const bg = document.getElementById('current-bg');
    const url = getWeatherBackground(summary);
    const img = new Image();
    img.onload = () => {
        bg.style.backgroundImage = `url(${url})`;
        // Show if current panel is active
        const currentPanel = document.getElementById('panel-current');
        if (currentPanel.classList.contains('active')) {
            bg.classList.add('visible');
        }
    };
    img.src = url;
}

// NWS summary -> Spanish
function nwsSummarySpanish(summary) {
    if (!summary) return '';
    const map = {
        'Sunny': 'Soleado', 'Mostly Sunny': 'Mayormente soleado',
        'Partly Sunny': 'Parcialmente soleado', 'Mostly Cloudy': 'Mayormente nublado',
        'Cloudy': 'Nublado', 'Overcast': 'Cubierto',
        'Clear': 'Despejado', 'Mostly Clear': 'Mayormente despejado',
        'Partly Cloudy': 'Parcialmente nublado', 'Fair': 'Buen tiempo',
        'Hot': 'Caluroso', 'Cold': 'Frío', 'Windy': 'Ventoso',
        'Breezy': 'Con brisa', 'Foggy': 'Neblina', 'Haze': 'Bruma',
        'Rain': 'Lluvia', 'Showers': 'Chubascos', 'Thunderstorms': 'Tormentas',
        'Snow': 'Nieve', 'Sleet': 'Aguanieve',
        'Chance Rain': 'Prob. lluvia', 'Chance Showers': 'Prob. chubascos',
        'Slight Chance Rain': 'Poca prob. lluvia',
        'Chance T-storms': 'Prob. tormentas',
    };
    for (const [en, es] of Object.entries(map)) {
        if (summary.toLowerCase().includes(en.toLowerCase())) return es;
    }
    return summary;
}

// Fahrenheit to Celsius
function fToC(f) {
    return Math.round((f - 32) * 5 / 9);
}
function cToF(c) {
    return Math.round(c * 9 / 5 + 32);
}

const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const DIAS_CORTO = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// --- DATE/TIME ---
function updateDateTime() {
    const now = new Date();
    const dia = DIAS[now.getDay()];
    const dd = now.getDate();
    const mes = MESES[now.getMonth()];
    const yyyy = now.getFullYear();
    document.getElementById('datetime-display').textContent =
        `${dia} ${dd} ${mes} ${yyyy}`;
}
updateDateTime();

// ============================================================
// NAVIGATION
// ============================================================

const navBtns = document.querySelectorAll('.nav-btn');
const panels = document.querySelectorAll('.panel');
const panelOrder = ['current', 'radar', 'forecast', 'coahuila', 'texas', 'alerts'];

function invalidateActiveMap(target) {
    const map = { radar: radarMap, coahuila: coahuilaMap, texas: texasMap, alerts: alertsMap }[target];
    if (!map) return;
    // Multiple invalidateSize calls to ensure tiles load after CSS transition
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 300);
    setTimeout(() => map.invalidateSize(), 600);
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.panel;
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        panels.forEach(p => {
            p.classList.remove('active');
            if (p.id === `panel-${target}`) p.classList.add('active');
        });
        // Show full-screen weather background on current & forecast panels
        const bg = document.getElementById('current-bg');
        if (target === 'current' || target === 'forecast') {
            bg.classList.add('visible');
        } else {
            bg.classList.remove('visible');
        }
        invalidateActiveMap(target);
    });
});

// Swipe
let touchStartX = 0, touchStartY = 0;
const contentArea = document.querySelector('.content-area');

contentArea.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

contentArea.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    const activeBtn = document.querySelector('.nav-btn.active');
    const currentIdx = panelOrder.indexOf(activeBtn.dataset.panel);
    let nextIdx = dx < 0
        ? Math.min(currentIdx + 1, panelOrder.length - 1)
        : Math.max(currentIdx - 1, 0);
    if (nextIdx !== currentIdx) {
        document.querySelector(`.nav-btn[data-panel="${panelOrder[nextIdx]}"]`).click();
    }
}, { passive: true });

// ============================================================
// NWS DWML XML PARSER
// ============================================================

async function fetchNwsDwml(lat, lon) {
    const url = nwsDwmlUrl(lat, lon);
    const res = await fetch(url);
    const text = await res.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, 'text/xml');
}

function parseNwsCurrent(xml) {
    const obs = xml.querySelector('data[type="current observations"]');
    if (!obs) return null;

    const getVal = (tag, type) => {
        const el = obs.querySelector(`${tag}[type="${type}"] value`);
        return el ? parseFloat(el.textContent) : null;
    };

    const tempApparent = getVal('temperature', 'apparent');
    const dewPoint = getVal('temperature', 'dew point');
    const humidity = getVal('humidity', 'relative');
    const windSustained = getVal('wind-speed', 'sustained');
    const windGusts = getVal('wind-speed', 'gust');
    const pressure = getVal('pressure', 'barometer');

    const weatherEl = obs.querySelector('weather-conditions');
    const summary = weatherEl ? weatherEl.getAttribute('weather-summary') : '';

    return {
        temperature: tempApparent,
        dewPoint,
        humidity,
        windSustained,
        windGusts,
        pressure,
        summary,
        icon: nwsSummaryIcon(summary),
        descEs: nwsSummarySpanish(summary),
    };
}

function parseNwsForecast(xml) {
    const forecast = xml.querySelector('data[type="forecast"]');
    if (!forecast) return [];

    // Get max temps
    const maxTemps = [];
    const maxEl = forecast.querySelector('temperature[type="maximum"]');
    if (maxEl) {
        maxEl.querySelectorAll('value').forEach(v => maxTemps.push(parseFloat(v.textContent)));
    }

    // Get min temps
    const minTemps = [];
    const minEl = forecast.querySelector('temperature[type="minimum"]');
    if (minEl) {
        minEl.querySelectorAll('value').forEach(v => minTemps.push(parseFloat(v.textContent)));
    }

    // Get precipitation probability per period
    const precipProbs = [];
    const precipEl = forecast.querySelector('probability-of-precipitation');
    if (precipEl) {
        precipEl.querySelectorAll('value').forEach(v => {
            const val = v.getAttribute('xsi:nil') === 'true' ? null : parseFloat(v.textContent);
            precipProbs.push(val);
        });
    }

    // Get weather summaries for each period
    const summaries = [];
    const weatherEl = forecast.querySelector('weather');
    if (weatherEl) {
        weatherEl.querySelectorAll('weather-conditions').forEach(wc => {
            summaries.push(wc.getAttribute('weather-summary') || '');
        });
    }

    // Get time period names
    const periods = [];
    const timeLayouts = forecast.querySelectorAll('time-layout');
    // Find the layout that has period-name attributes
    let maxI = 0, minI = 0, sumI = 0, precipI = 0;
    timeLayouts.forEach(tl => {
        const starts = tl.querySelectorAll('start-valid-time');
        starts.forEach(s => {
            const pName = s.getAttribute('period-name');
            if (pName) {
                const isNight = pName.toLowerCase().includes('night') || pName.toLowerCase().includes('tonight');
                const p = {
                    name: pName,
                    time: s.textContent,
                    summary: summaries[sumI] || '',
                    precip: precipI < precipProbs.length ? precipProbs[precipI] : null,
                };
                if (isNight) {
                    p.temp = minI < minTemps.length ? minTemps[minI] : null;
                    minI++;
                } else {
                    p.temp = maxI < maxTemps.length ? maxTemps[maxI] : null;
                    maxI++;
                }
                sumI++;
                precipI++;
                periods.push(p);
            }
        });
    });

    return { maxTemps, minTemps, summaries, periods };
}

// Parse current temp for city markers (simpler)
function parseNwsCityData(xml) {
    const current = parseNwsCurrent(xml);
    const forecast = xml.querySelector('data[type="forecast"]');

    let hi = null, lo = null;
    if (forecast) {
        const maxEl = forecast.querySelector('temperature[type="maximum"] value');
        const minEl = forecast.querySelector('temperature[type="minimum"] value');
        if (maxEl) hi = parseFloat(maxEl.textContent);
        if (minEl) lo = parseFloat(minEl.textContent);
    }

    return {
        temp: current ? current.temperature : null,
        summary: current ? current.summary : '',
        icon: current ? current.icon : 'thermometer',
        hi,
        lo,
    };
}

// ============================================================
// FETCH & RENDER MAIN WEATHER (NWS for Eagle Pass)
// ============================================================

async function fetchMainWeather() {
    try {
        const { lat, lon } = MAIN_CITY;
        // Fetch NWS and Open-Meteo wind data in parallel
        const [xml, windData] = await Promise.all([
            fetchNwsDwml(lat, lon),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=wind_speed_10m_max&timezone=America%2FChicago&forecast_days=7`)
                .then(r => r.json()).catch(() => null)
        ]);
        const current = parseNwsCurrent(xml);
        const forecast = parseNwsForecast(xml);
        const dailyWind = windData && windData.daily ? windData.daily.wind_speed_10m_max : null;

        if (current) renderCurrentWeather(current, forecast);
        if (forecast) renderForecast(forecast, dailyWind);
    } catch (err) {
        console.error('NWS main weather error:', err);
        // Fallback to Open-Meteo
        fetchMainWeatherFallback();
    }
}

async function fetchMainWeatherFallback() {
    const { lat, lon } = MAIN_CITY;
    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,` +
            `wind_speed_10m,wind_gusts_10m,surface_pressure,uv_index` +
            `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max` +
            `&timezone=America%2FChicago&forecast_days=6`
        );
        const data = await res.json();
        renderCurrentWeatherOM(data);
        renderForecastOM(data);
    } catch (e) {
        console.error('Fallback also failed:', e);
    }
}

function renderCurrentWeather(current, forecast) {
    document.getElementById('current-icon-big').innerHTML = iconImg(current.icon, 130);
    const tempF = Math.round(current.temperature);
    const tempC = fToC(current.temperature);
    document.getElementById('current-temp-big').innerHTML = `${tempC}°<span class="temp-unit">C</span> <span class="temp-separator">/</span> ${tempF}°<span class="temp-unit">F</span>`;
    document.getElementById('current-desc').textContent = current.descEs;

    // Get today's max/min from forecast periods matching today's date
    if (forecast && forecast.periods.length > 0) {
        const todayStr = new Date().toLocaleDateString('en-CA');
        let todayMax = null, todayMin = null;
        for (const p of forecast.periods) {
            const pDate = new Date(p.time).toLocaleDateString('en-CA');
            if (pDate !== todayStr) continue;
            const isNight = p.name.toLowerCase().includes('night') || p.name.toLowerCase().includes('tonight');
            if (!isNight && p.temp != null) todayMax = p.temp;
            if (isNight && p.temp != null) todayMin = p.temp;
        }
        if (todayMax != null) {
            document.getElementById('current-hi').innerHTML = `${fToC(todayMax)}°C / ${Math.round(todayMax)}°F`;
        } else if (forecast.maxTemps.length > 0) {
            document.getElementById('current-hi').innerHTML = `${fToC(forecast.maxTemps[0])}°C / ${Math.round(forecast.maxTemps[0])}°F`;
        }
        if (todayMin != null) {
            document.getElementById('current-lo').innerHTML = `${fToC(todayMin)}°C / ${Math.round(todayMin)}°F`;
        } else if (forecast.minTemps.length > 0) {
            document.getElementById('current-lo').innerHTML = `${fToC(forecast.minTemps[0])}°C / ${Math.round(forecast.minTemps[0])}°F`;
        }
    }

    document.getElementById('d-feels').textContent = current.temperature != null ? `${fToC(current.temperature)}°C / ${tempF}°F` : '--°';
    document.getElementById('d-humidity').textContent = current.humidity != null ? `${Math.round(current.humidity)}%` : '--%';
    document.getElementById('d-wind').textContent = current.windSustained != null ? `${Math.round(current.windSustained * 1.60934)} km/h` : '-- km/h';
    document.getElementById('d-gusts').textContent = current.windGusts != null ? `${Math.round(current.windGusts * 1.60934)} km/h` : '-- km/h';
    document.getElementById('d-dewpoint').textContent = current.dewPoint != null ? `${fToC(current.dewPoint)}°` : '--°';
    document.getElementById('d-pressure').textContent = current.pressure != null ? `${Math.round(current.pressure * 33.8639)} hPa` : '-- hPa';

    // Precipitation probability from forecast periods (today day & tonight)
    if (forecast && forecast.periods.length > 0) {
        let dayPrecip = null, nightPrecip = null;
        const todayStr = new Date().toLocaleDateString('en-CA');
        for (const p of forecast.periods) {
            const pDate = new Date(p.time).toLocaleDateString('en-CA');
            if (pDate !== todayStr) continue;
            const isNight = p.name.toLowerCase().includes('night') || p.name.toLowerCase().includes('tonight');
            if (isNight && nightPrecip === null) nightPrecip = p.precip;
            if (!isNight && dayPrecip === null) dayPrecip = p.precip;
        }
        document.getElementById('d-precip-day').textContent = dayPrecip != null ? `${Math.round(dayPrecip)}%` : '0%';
        document.getElementById('d-precip-night').textContent = nightPrecip != null ? `${Math.round(nightPrecip)}%` : '0%';
    }

    // Set background image based on weather
    setCurrentBackground(current.summary);
}

// Open-Meteo fallback render
function renderCurrentWeatherOM(data) {
    const c = data.current;
    const d = data.daily;
    const info = getWeatherInfo(c.weather_code);
    const tempC = Math.round(c.temperature_2m);
    const tempF = cToF(c.temperature_2m);
    document.getElementById('current-icon-big').innerHTML = iconImg(info.icon, 130);
    document.getElementById('current-temp-big').innerHTML = `${tempC}°<span class="temp-unit">C</span> <span class="temp-separator">/</span> ${tempF}°<span class="temp-unit">F</span>`;
    document.getElementById('current-desc').textContent = info.desc;
    document.getElementById('current-hi').innerHTML = `${Math.round(d.temperature_2m_max[0])}°C / ${cToF(d.temperature_2m_max[0])}°F`;
    document.getElementById('current-lo').innerHTML = `${Math.round(d.temperature_2m_min[0])}°C / ${cToF(d.temperature_2m_min[0])}°F`;
    document.getElementById('d-feels').textContent = `${Math.round(c.apparent_temperature)}°C / ${cToF(c.apparent_temperature)}°F`;
    document.getElementById('d-humidity').textContent = `${c.relative_humidity_2m}%`;
    document.getElementById('d-wind').textContent = `${Math.round(c.wind_speed_10m)} km/h`;
    document.getElementById('d-gusts').textContent = `${Math.round(c.wind_gusts_10m)} km/h`;
    document.getElementById('d-pressure').textContent = `${Math.round(c.surface_pressure)} hPa`;
    document.getElementById('d-uv').textContent = `${Math.round(c.uv_index)}`;

    // Fallback background based on WMO desc
    setCurrentBackground(info.desc);
}

// ============================================================
// 5-DAY FORECAST (NWS)
// ============================================================

function renderForecast(forecast, dailyWind) {
    const grid = document.getElementById('forecast-grid');
    grid.innerHTML = '';

    const { maxTemps, minTemps, summaries, periods } = forecast;

    // Build day-based forecast: pair max/min per day, skipping today entirely
    // Compare each period's date against today's date to reliably exclude current day
    const days = [];
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    for (let i = 0; i < periods.length && days.length < 5; i++) {
        const p = periods[i];
        const pName = p.name.toLowerCase();
        const isNightPeriod = pName.includes('night') || pName.includes('tonight');

        // Skip any period that belongs to today
        const periodDate = new Date(p.time).toLocaleDateString('en-CA');
        if (periodDate === todayStr) continue;

        // Only start a new day card on daytime periods
        if (!isNightPeriod) {
            const day = {
                name: p.name,
                time: p.time,
                max: p.temp,
                min: null,
                summary: p.summary || '',
                precip: p.precip,
            };
            // Look for the matching night period right after
            if (i + 1 < periods.length) {
                const nextP = periods[i + 1];
                const nextIsNight = nextP.name.toLowerCase().includes('night');
                if (nextIsNight) {
                    day.min = nextP.temp;
                    // Use the highest precip between day and night
                    if (nextP.precip != null) {
                        day.precip = Math.max(day.precip || 0, nextP.precip);
                    }
                    i++; // skip night period
                }
            }
            days.push(day);
        }
    }

    // Fallback if parsing gave too few
    if (days.length < 3) {
        days.length = 0;
        for (let i = 0; i < Math.min(5, maxTemps.length); i++) {
            const date = new Date();
            date.setDate(date.getDate() + i + 1);
            days.push({
                name: DIAS_CORTO[date.getDay()],
                time: date.toISOString(),
                max: maxTemps[i],
                min: i < minTemps.length ? minTemps[i] : null,
                summary: summaries[i * 2] || summaries[i] || '',
            });
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    days.forEach((day) => {
        const date = new Date(day.time);
        const dayName = DIAS_CORTO[date.getDay()] || day.name.toUpperCase().substring(0, 3);
        const iconName = nwsSummaryIcon(day.summary);
        const descEs = nwsSummarySpanish(day.summary);

        // Get wind from Open-Meteo dailyWind array (index 0 = today)
        let windKmh = null;
        if (dailyWind) {
            const dayDate = new Date(day.time);
            dayDate.setHours(0, 0, 0, 0);
            const diffDays = Math.round((dayDate - today) / 86400000);
            if (diffDays >= 0 && diffDays < dailyWind.length) {
                windKmh = Math.round(dailyWind[diffDays]);
            }
        }

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="fc-day">${dayName}</div>
            <div class="fc-date">${date.getDate()} ${MESES[date.getMonth()]}</div>
            <div class="fc-icon">${iconImg(iconName, 90)}</div>
            <div class="fc-temps">
                <span class="fc-max">${fToC(day.max)}°<span class="fc-temp-unit">C</span></span>
                <span class="fc-max-alt">${Math.round(day.max)}°<span class="fc-temp-unit">F</span></span>
            </div>
            ${day.min != null ? `<div class="fc-temps fc-temps-min">
                <span class="fc-min">${fToC(day.min)}°<span class="fc-temp-unit">C</span></span>
                <span class="fc-min-alt">${Math.round(day.min)}°<span class="fc-temp-unit">F</span></span>
            </div>` : ''}
            <div class="fc-desc">${descEs}</div>
            <div class="fc-extras">
                ${windKmh != null ? `<span class="fc-wind">💨 ${windKmh} km/h</span>` : ''}
                ${day.precip != null && day.precip > 0 ? `<span class="fc-precip">🌧 ${Math.round(day.precip)}%</span>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

// Open-Meteo fallback
function renderForecastOM(data) {
    const d = data.daily;
    const grid = document.getElementById('forecast-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const date = new Date(d.time[i] + 'T12:00:00');
        const info = getWeatherInfo(d.weather_code[i]);
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="fc-day">${DIAS_CORTO[date.getDay()]}</div>
            <div class="fc-date">${date.getDate()} ${MESES[date.getMonth()]}</div>
            <div class="fc-icon">${iconImg(info.icon, 90)}</div>
            <div class="fc-temps">
                <span class="fc-max">${Math.round(d.temperature_2m_max[i])}°<span class="fc-temp-unit">C</span></span>
                <span class="fc-max-alt">${cToF(d.temperature_2m_max[i])}°<span class="fc-temp-unit">F</span></span>
            </div>
            <div class="fc-temps fc-temps-min">
                <span class="fc-min">${Math.round(d.temperature_2m_min[i])}°<span class="fc-temp-unit">C</span></span>
                <span class="fc-min-alt">${cToF(d.temperature_2m_min[i])}°<span class="fc-temp-unit">F</span></span>
            </div>
            <div class="fc-desc">${info.desc}</div>
            ${d.wind_speed_10m_max ? `<div class="fc-wind">💨 ${Math.round(d.wind_speed_10m_max[i])} km/h</div>` : ''}
        `;
        grid.appendChild(card);
    }
}

// ============================================================
// RADAR - Leaflet + RainViewer
// ============================================================

let radarMap, radarLayer;

function initRadar() {

    radarMap = L.map('radar-map', {
        center: [29.014, -100.617],
        zoom: responsiveZoom(8),
        zoomSnap: 0.5,
        zoomControl: true,
        attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 18, subdomains: 'abcd',
    }).addTo(radarMap);

    // City markers on radar
    [...COAHUILA_CITIES, ...TEXAS_CITIES].forEach(city => {
        L.circleMarker([city.lat, city.lon], {
            radius: 5, color: '#00a8ff', fillColor: '#00a8ff', fillOpacity: 0.8, weight: 1,
        }).bindTooltip(city.name, {
            permanent: true, direction: 'top', className: 'radar-city-label', offset: [0, -8],
        }).addTo(radarMap);
    });

    // Eagle Pass / Piedras Negras main marker
    L.circleMarker([28.709, -100.4724], {
        radius: 8, color: '#ff4444', fillColor: '#ff4444', fillOpacity: 0.9, weight: 2,
    }).bindTooltip('Piedras Negras / Eagle Pass', {
        permanent: true, direction: 'top', className: 'radar-city-label', offset: [0, -10],
    }).addTo(radarMap);

    loadRainViewerRadar();
}

let radarFrames = [];
let radarHost = '';
let radarAnimIdx = 0;
let radarAnimTimer = null;

async function loadRainViewerRadar() {
    try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        radarHost = data.host;
        radarFrames = data.radar.past.slice(-12); // Last 12 frames (~2 hrs)

        // Start animation loop
        startRadarAnimation();

        // Reload frames every 5 min
        setInterval(async () => {
            try {
                const r = await fetch('https://api.rainviewer.com/public/weather-maps.json');
                const d = await r.json();
                radarHost = d.host;
                radarFrames = d.radar.past.slice(-12);
            } catch (e) {}
        }, 300000);
    } catch (err) {
        console.error('RainViewer error:', err);
    }
}

function startRadarAnimation() {
    if (radarAnimTimer) clearInterval(radarAnimTimer);
    radarAnimIdx = 0;

    radarAnimTimer = setInterval(() => {
        if (!radarFrames.length || !radarMap) return;

        if (radarLayer) radarMap.removeLayer(radarLayer);

        const frame = radarFrames[radarAnimIdx];
        radarLayer = L.tileLayer(
            `${radarHost}${frame.path}/512/{z}/{x}/{y}/6/1_1.png`,
            { opacity: 0.7, maxZoom: 12, tileSize: 512, zoomOffset: -1 }
        ).addTo(radarMap);

        radarAnimIdx = (radarAnimIdx + 1) % radarFrames.length;
    }, 800); // 800ms per frame
}

// ============================================================
// REGIONAL MAPS
// ============================================================
let coahuilaMap, texasMap;

function createCityMarkerHTML(name, temp, iconName, hi, lo) {
    const iconSize = rs(32);
    return `
        <div class="city-marker">
            <div class="cm-name">${name}</div>
            <div class="cm-temp-row">
                <img src="${iconUrl(iconName)}" width="${iconSize}" height="${iconSize}" alt="" class="cm-icon-img">
                <span class="cm-temp">${temp}°</span>
            </div>
            <div class="cm-hilo">
                <span class="cm-hi">▲${hi}°</span>
                <span class="cm-lo">▼${lo}°</span>
            </div>
        </div>
    `;
}

function addMarkerToMap(map, lat, lon, html) {
    const w = rs(150);
    const h = rs(85);
    return L.marker([lat, lon], {
        icon: L.divIcon({
            className: 'city-marker-wrapper',
            html: html,
            iconSize: [w, h],
            iconAnchor: [w / 2, h / 2],
        }),
    }).addTo(map);
}

// Coahuila uses Open-Meteo (NWS doesn't cover Mexico)
async function initCoahuilaMap() {
    coahuilaMap = L.map('map-coahuila', {
        center: [28.6, -100.7],
        zoom: responsiveZoom(9),
        zoomSnap: 0.5,
        zoomControl: true,
        attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 18, subdomains: 'abcd',
    }).addTo(coahuilaMap);

    try {
        const lats = COAHUILA_CITIES.map(c => c.lat).join(',');
        const lons = COAHUILA_CITIES.map(c => c.lon).join(',');
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
            `&current=temperature_2m,weather_code` +
            `&daily=temperature_2m_max,temperature_2m_min` +
            `&timezone=America%2FChicago&forecast_days=1`
        );
        const data = await res.json();
        const results = Array.isArray(data) ? data : [data];

        COAHUILA_CITIES.forEach((city, i) => {
            const r = results[i];
            const temp = r && r.current ? Math.round(r.current.temperature_2m) : '--';
            const icon = r && r.current ? getWeatherInfo(r.current.weather_code).icon : 'thermometer';
            const hi = r && r.daily ? Math.round(r.daily.temperature_2m_max[0]) : '--';
            const lo = r && r.daily ? Math.round(r.daily.temperature_2m_min[0]) : '--';
            addMarkerToMap(coahuilaMap, city.lat, city.lon, createCityMarkerHTML(city.name, temp, icon, hi, lo));
        });
    } catch (err) {
        console.error('Coahuila weather error:', err);
        COAHUILA_CITIES.forEach(city => {
            addMarkerToMap(coahuilaMap, city.lat, city.lon, createCityMarkerHTML(city.name, '--', 'thermometer', '--', '--'));
        });
    }

}

// Texas uses NWS DWML XML
async function initTexasMap() {
    texasMap = L.map('map-texas', {
        center: [28.9, -99.7],
        zoom: responsiveZoom(8),
        zoomSnap: 0.5,
        zoomControl: true,
        attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 18, subdomains: 'abcd',
    }).addTo(texasMap);

    // Fetch NWS data for each Texas city
    const promises = TEXAS_CITIES.map(async (city) => {
        try {
            const xml = await fetchNwsDwml(city.lat, city.lon);
            return parseNwsCityData(xml);
        } catch (e) {
            console.error(`NWS error for ${city.name}:`, e);
            return null;
        }
    });

    const results = await Promise.all(promises);

    TEXAS_CITIES.forEach((city, i) => {
        const r = results[i];
        const temp = r && r.temp != null ? Math.round(r.temp) : '--';
        const icon = r ? r.icon : 'thermometer';
        const hi = r && r.hi != null ? Math.round(r.hi) : '--';
        const lo = r && r.lo != null ? Math.round(r.lo) : '--';
        addMarkerToMap(texasMap, city.lat, city.lon, createCityMarkerHTML(city.name, temp, icon, hi, lo));
    });

}

// ============================================================
// NWS ALERTS - MAVERICK COUNTY TX
// ============================================================

let alertsMap;

const SEVERITY_COLORS = {
    'Extreme':  { bg: '#8b0000', border: '#ff2020', badge: '#ff2020', label: 'EXTREMO' },
    'Severe':   { bg: '#b22222', border: '#ff4444', badge: '#ff4444', label: 'SEVERO' },
    'Moderate': { bg: '#8b6914', border: '#ffa500', badge: '#ffa500', label: 'MODERADO' },
    'Minor':    { bg: '#2d5016', border: '#44aa44', badge: '#44aa44', label: 'MENOR' },
    'Unknown':  { bg: '#1a3050', border: '#5ba3d9', badge: '#5ba3d9', label: 'DESCONOCIDO' },
};

function getSeverityStyle(sev) {
    return SEVERITY_COLORS[sev] || SEVERITY_COLORS['Unknown'];
}

const EVENT_TRANSLATIONS = {
    'Tornado Warning': 'AVISO DE TORNADO',
    'Tornado Watch': 'VIGILANCIA DE TORNADO',
    'Severe Thunderstorm Warning': 'AVISO DE TORMENTA SEVERA',
    'Severe Thunderstorm Watch': 'VIGILANCIA DE TORMENTA SEVERA',
    'Flash Flood Warning': 'AVISO DE INUNDACIÓN REPENTINA',
    'Flash Flood Watch': 'VIGILANCIA DE INUNDACIÓN REPENTINA',
    'Flood Warning': 'AVISO DE INUNDACIÓN',
    'Flood Watch': 'VIGILANCIA DE INUNDACIÓN',
    'Flood Advisory': 'ADVERTENCIA DE INUNDACIÓN',
    'Winter Storm Warning': 'AVISO DE TORMENTA INVERNAL',
    'Winter Storm Watch': 'VIGILANCIA DE TORMENTA INVERNAL',
    'Winter Weather Advisory': 'ADVERTENCIA DE CLIMA INVERNAL',
    'Ice Storm Warning': 'AVISO DE TORMENTA DE HIELO',
    'Freeze Warning': 'AVISO DE HELADA',
    'Freeze Watch': 'VIGILANCIA DE HELADA',
    'Frost Advisory': 'ADVERTENCIA DE ESCARCHA',
    'Wind Advisory': 'ADVERTENCIA DE VIENTO',
    'High Wind Warning': 'AVISO DE VIENTO FUERTE',
    'High Wind Watch': 'VIGILANCIA DE VIENTO FUERTE',
    'Heat Advisory': 'ADVERTENCIA DE CALOR',
    'Excessive Heat Warning': 'AVISO DE CALOR EXCESIVO',
    'Excessive Heat Watch': 'VIGILANCIA DE CALOR EXCESIVO',
    'Dense Fog Advisory': 'ADVERTENCIA DE NEBLINA DENSA',
    'Special Weather Statement': 'BOLETÍN METEOROLÓGICO ESPECIAL',
    'Hazardous Weather Outlook': 'PERSPECTIVA DE CLIMA PELIGROSO',
    'Red Flag Warning': 'AVISO DE BANDERA ROJA (INCENDIO)',
    'Fire Weather Watch': 'VIGILANCIA DE CLIMA DE INCENDIO',
    'Dust Storm Warning': 'AVISO DE TORMENTA DE POLVO',
    'Blowing Dust Advisory': 'ADVERTENCIA DE POLVO',
};

function translateEvent(event) {
    return EVENT_TRANSLATIONS[event] || event.toUpperCase();
}

function getEventTypeIcon(event) {
    const e = event.toLowerCase();
    if (e.includes('tornado')) return '🌪️';
    if (e.includes('thunderstorm')) return '⛈️';
    if (e.includes('flood') || e.includes('flash')) return '🌊';
    if (e.includes('winter') || e.includes('ice') || e.includes('freeze') || e.includes('frost')) return '❄️';
    if (e.includes('wind')) return '💨';
    if (e.includes('heat')) return '🔥';
    if (e.includes('fog')) return '🌫️';
    if (e.includes('fire') || e.includes('red flag')) return '🔥';
    if (e.includes('dust')) return '🌪️';
    return '⚠️';
}

async function fetchNWSAlerts() {
    const alertsList = document.getElementById('alerts-list');
    const alertsCount = document.getElementById('alerts-count');
    const alertsBadge = document.getElementById('alerts-badge');

    try {
        const [zoneRes, countyRes] = await Promise.all([
            fetch(`https://api.weather.gov/alerts/active?zone=${NWS_ZONE}`, {
                headers: { 'User-Agent': 'WeatherBorder/1.0' }
            }),
            fetch(`https://api.weather.gov/alerts/active?zone=${NWS_COUNTY}`, {
                headers: { 'User-Agent': 'WeatherBorder/1.0' }
            }),
        ]);

        const zoneData = await zoneRes.json();
        const countyData = await countyRes.json();

        const allAlerts = [...(zoneData.features || []), ...(countyData.features || [])];
        const seen = new Set();
        const alerts = allAlerts.filter(a => {
            if (seen.has(a.id)) return false;
            seen.add(a.id);
            return true;
        });

        const sevOrder = { 'Extreme': 0, 'Severe': 1, 'Moderate': 2, 'Minor': 3, 'Unknown': 4 };
        alerts.sort((a, b) => (sevOrder[a.properties.severity] || 4) - (sevOrder[b.properties.severity] || 4));

        alertsBadge.textContent = alerts.length;
        alertsBadge.style.display = alerts.length > 0 ? 'flex' : 'none';
        alertsCount.textContent = `${alerts.length} alerta${alerts.length !== 1 ? 's' : ''} activa${alerts.length !== 1 ? 's' : ''}`;

        if (alerts.length === 0) {
            alertsList.innerHTML = `
                <div class="no-alerts">
                    <div class="no-alerts-icon">✅</div>
                    <div class="no-alerts-text">NO HAY ALERTAS ACTIVAS</div>
                    <div class="no-alerts-sub">Maverick County, TX — Sin advertencias ni avisos vigentes</div>
                </div>`;
            return;
        }

        alertsList.innerHTML = alerts.map(alert => {
            const p = alert.properties;
            const style = getSeverityStyle(p.severity);
            const icon = getEventTypeIcon(p.event);
            const translated = translateEvent(p.event);
            const sevLabel = style.label || (p.severity || '').toUpperCase();
            const onset = p.onset ? new Date(p.onset) : null;
            const ends = p.ends || p.expires ? new Date(p.ends || p.expires) : null;
            const timeStr = onset ? `${onset.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} ${onset.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : '';
            const endsStr = ends ? `${ends.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} ${ends.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : '';
            const desc = (p.description || '').substring(0, 600);

            return `
                <div class="alert-card" style="border-left: 5px solid ${style.border}; background: linear-gradient(135deg, ${style.bg}44, ${style.bg}22);">
                    <div class="alert-header">
                        <span class="alert-icon">${icon}</span>
                        <div class="alert-title-group">
                            <div class="alert-event" style="color: ${style.badge};">${translated}</div>
                        </div>
                        <div class="alert-severity" style="background: ${style.badge};">${sevLabel}</div>
                    </div>
                    ${p.headline ? `<div class="alert-headline">${p.headline}</div>` : ''}
                    <div class="alert-times">
                        ${timeStr ? `<span>Inicio: ${timeStr}</span>` : ''}
                        ${endsStr ? `<span>Finaliza: ${endsStr}</span>` : ''}
                    </div>
                    <div class="alert-description">${desc}${desc.length >= 600 ? '...' : ''}</div>
                </div>`;
        }).join('');
    } catch (err) {
        console.error('NWS alerts error:', err);
        alertsList.innerHTML = `
            <div class="no-alerts">
                <div class="no-alerts-icon">⚠️</div>
                <div class="no-alerts-text">ERROR AL CARGAR ALERTAS</div>
                <div class="no-alerts-sub">No se pudo conectar con el NWS</div>
            </div>`;
    }
}

function initAlertsMap() {
    alertsMap = L.map('alerts-map', {
        center: [28.75, -100.45],
        zoom: responsiveZoom(9),
        zoomSnap: 0.5,
        zoomControl: true,
        attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 18, subdomains: 'abcd',
    }).addTo(alertsMap);

    // Maverick County approximate boundary
    L.polygon([
        [29.08, -100.75], [29.08, -100.11],
        [28.65, -100.11], [28.19, -100.11],
        [28.19, -100.65], [28.65, -100.75],
    ], {
        color: '#ff4444', fillColor: '#ff4444', fillOpacity: 0.06,
        weight: 2, dashArray: '8, 4',
    }).addTo(alertsMap);

    L.circleMarker([28.7091, -100.4995], {
        radius: 7, color: '#00a8ff', fillColor: '#00a8ff', fillOpacity: 0.9, weight: 2,
    }).bindTooltip('Eagle Pass / Piedras Negras', {
        permanent: true, direction: 'top', className: 'radar-city-label', offset: [0, -10],
    }).addTo(alertsMap);
}

// ============================================================
// TICKER
// ============================================================


// ============================================================
// AUTO CYCLE
// ============================================================

let autoCycleEnabled = false;
let autoCycleTimer;
let autoCycleSeconds = 15;

function startAutoCycle(seconds) {
    autoCycleSeconds = seconds || autoCycleSeconds;
    autoCycleEnabled = true;
    if (autoCycleTimer) clearInterval(autoCycleTimer);
    autoCycleTimer = setInterval(() => {
        if (!autoCycleEnabled) return;
        const activeBtn = document.querySelector('.nav-btn.active');
        const currentIdx = panelOrder.indexOf(activeBtn.dataset.panel);
        const nextIdx = (currentIdx + 1) % panelOrder.length;
        document.querySelector(`.nav-btn[data-panel="${panelOrder[nextIdx]}"]`).click();
    }, autoCycleSeconds * 1000);
    updateAutoCycleBtn();
}

function stopAutoCycle() {
    autoCycleEnabled = false;
    if (autoCycleTimer) { clearInterval(autoCycleTimer); autoCycleTimer = null; }
    updateAutoCycleBtn();
}

function toggleAutoCycle() {
    if (autoCycleEnabled) {
        stopAutoCycle();
    } else {
        const input = prompt('Segundos entre cada sección:', autoCycleSeconds);
        if (input === null) return;
        const secs = parseInt(input, 10);
        if (isNaN(secs) || secs < 3) { alert('Mínimo 3 segundos'); return; }
        startAutoCycle(secs);
    }
}

function updateAutoCycleBtn() {
    const btn = document.getElementById('autocycle-btn');
    if (!btn) return;
    if (autoCycleEnabled) {
        btn.classList.add('active');
        btn.title = `Auto-ciclo ON (${autoCycleSeconds}s) — Click para detener`;
    } else {
        btn.classList.remove('active');
        btn.title = 'Auto-ciclo OFF — Click para activar';
    }
}

// ============================================================
// INIT
// ============================================================

async function init() {
    // Initialize all maps immediately so they are ready when switching panels
    initRadar();
    initCoahuilaMap();
    initTexasMap();
    initAlertsMap();

    await Promise.all([
        fetchMainWeather(),
        fetchNWSAlerts(),
    ]);

    // Refresh intervals
    setInterval(fetchMainWeather, 600000);   // 10 min
    setInterval(fetchNWSAlerts, 300000);      // 5 min

    // Handle window resize - update map zoom levels
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (radarMap) radarMap.setZoom(responsiveZoom(8));
            if (coahuilaMap) coahuilaMap.setZoom(responsiveZoom(9));
            if (texasMap) texasMap.setZoom(responsiveZoom(8));
            if (alertsMap) alertsMap.setZoom(responsiveZoom(9));
        }, 250);
    });
}

// Fullscreen toggle
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

init();
