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
    { name: 'Jiménez',   lat: 28.8500, lon: -101.3500 },
    { name: 'Nava',      lat: 28.4219, lon: -100.7678 },
    { name: 'Guerrero',  lat: 27.8500, lon: -100.1500 },
    { name: 'Sabinas',   lat: 27.8486, lon: -101.1197 },
];

const TEXAS_CITIES = [
    { name: 'Laredo',       lat: 27.3500, lon: -99.5076 },
    { name: 'Uvalde',       lat: 29.4500, lon: -100.5500 },
    { name: 'San Antonio',  lat: 29.4241, lon: -98.4936 },
    { name: 'Carrizo Springs', lat: 28.5217, lon: -99.8607 },
];

// --- METEOCONS ICON SYSTEM ---
// Animated SVG icons from Basmilius Meteocons
const ICON_BASE = 'icons';

function iconUrl(name) {
    return `${ICON_BASE}/${name}.svg`;
}

// --- RESPONSIVE SCALING ---
function getScale() {
    const base = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    // Boost scale on large screens for better readability
    if (window.innerWidth >= 2200) return Math.max(base, 1.3);
    if (window.innerWidth >= 1600) return Math.max(base, 1.1);
    return base;
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
    if (!summary) return 'backgrounds/default.webm';
    const s = summary.toLowerCase();
    const hour = new Date().getHours();
    const isNight = hour < 5 || hour >= 20;

    if (s.includes('tornado')) {
        return 'backgrounds/Tornado.webm';
    }
    if (s.includes('thunder') || s.includes('tstms') || s.includes('storm')) {
        return 'backgrounds/thunderstorm.webm';
    }
    if (s.includes('rain') || s.includes('showers') || s.includes('drizzle')) {
        return 'backgrounds/rain.webm';
    }
    if (s.includes('snow') || s.includes('blizzard') || s.includes('ice') || s.includes('sleet') || s.includes('freezing')) {
        return 'backgrounds/snow.webm';
    }
    if (s.includes('fog') || s.includes('mist') || s.includes('haze')) {
        return 'backgrounds/fog.webm';
    }
    if (s.includes('wind') || s.includes('breezy')) {
        return 'backgrounds/wind.webm';
    }
    if (s.includes('overcast') || s.includes('cloudy') && !s.includes('partly')) {
        return 'backgrounds/overcast.webm';
    }
    if (s.includes('partly') || s.includes('mostly cloudy')) {
        if (isNight) return 'backgrounds/partly-cloudy-night.webm';
        return 'backgrounds/partly-cloudy-day.webm';
    }
    if (s.includes('hot')) {
        return 'backgrounds/hot.webm';
    }
    // Clear / Sunny / Fair
    if (isNight) {
        return 'backgrounds/clear-night.webm';
    }
    return 'backgrounds/clear-day.webm';
}

// Show sunrise only from 00:00 until sunrise, sunset only from 00:00 until sunset
function updateSunVisibility() {
    const now = new Date();
    const sunriseItem = document.querySelector('.sun-item:first-child');
    const sunsetItem = document.querySelector('.sun-item:last-child');
    const divider = document.querySelector('.sun-divider');
    if (!sunriseItem) return;

    const showSunrise = window._sunriseTime && now < window._sunriseTime;
    const showSunset = window._sunsetTime && now < window._sunsetTime;

    sunriseItem.style.display = showSunrise ? '' : 'none';
    sunsetItem.style.display = showSunset ? '' : 'none';
    divider.style.display = (showSunrise && showSunset) ? '' : 'none';

    // Hide entire sun card if both are hidden
    const sunCard = document.querySelector('.sun-card');
    if (sunCard) sunCard.style.display = (!showSunrise && !showSunset) ? 'none' : '';
}

// Check sun visibility every minute
setInterval(updateSunVisibility, 60000);

function setCurrentBackground(summary) {
    const bg = document.getElementById('current-bg');
    const video = document.getElementById('bg-video');
    const url = getWeatherBackground(summary);

    // Hide old image bg
    bg.classList.remove('visible');
    bg.style.backgroundImage = '';

    // Set weather condition video
    if (video.getAttribute('src') !== url) {
        video.src = url;
    }
    video.play().catch(() => {});
    video.classList.add('visible');
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
    const dtEl = document.getElementById('datetime-display');
    if (dtEl) dtEl.textContent = `${dia} ${dd} ${mes} ${yyyy}`;
}
updateDateTime();

// ============================================================
// NAVIGATION
// ============================================================

const navBtns = document.querySelectorAll('.nav-btn');
const panels = document.querySelectorAll('.panel');
const panelOrder = ['inicio', 'current', 'radar', 'forecast', 'coahuila', 'texas', 'alerts'];

function invalidateActiveMap(target) {
    if (target === 'radar') return;
    const map = { coahuila: coahuilaMap, texas: texasMap, alerts: alertsMap }[target];
    if (!map) return;
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 300);
    setTimeout(() => map.invalidateSize(), 600);
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.panel;
        // Sync both sidebars
        navBtns.forEach(b => {
            if (b.dataset.panel === target) b.classList.add('active');
            else b.classList.remove('active');
        });
        panels.forEach(p => {
            p.classList.remove('active');
            if (p.id === `panel-${target}`) p.classList.add('active');
        });
        // Show full-screen weather background on all panels
        document.getElementById('current-bg').classList.add('visible');
        // Hide header on inicio panel
        const banner = document.querySelector('.top-banner');
        if (banner) banner.style.display = target === 'inicio' ? 'none' : '';
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
        // Fetch NWS and Open-Meteo data in parallel
        const [xml, omData] = await Promise.all([
            fetchNwsDwml(lat, lon).catch(() => null),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=wind_speed_10m_max,precipitation_probability_max,sunrise,sunset&timezone=America%2FChicago&forecast_days=7`)
                .then(r => r.json()).catch(() => null)
        ]);
        const current = xml ? parseNwsCurrent(xml) : null;
        const forecast = xml ? parseNwsForecast(xml) : null;
        const dailyWind = omData && omData.daily ? omData.daily.wind_speed_10m_max : null;
        const dailyPrecip = omData && omData.daily ? omData.daily.precipitation_probability_max : null;
        const sunrise = omData && omData.daily ? omData.daily.sunrise[0] : null;
        const sunset = omData && omData.daily ? omData.daily.sunset[0] : null;

        // If NWS returned valid data, use it
        if (current && forecast && forecast.periods.length > 0) {
            renderCurrentWeather(current, forecast, sunrise, sunset);
            renderForecast(forecast, dailyWind, dailyPrecip);
        } else {
            // NWS data incomplete — fallback to Open-Meteo
            console.warn('NWS data incomplete, falling back to Open-Meteo');
            await fetchMainWeatherFallback();
        }
    } catch (err) {
        console.error('NWS main weather error:', err);
        await fetchMainWeatherFallback();
    }
}

async function fetchMainWeatherFallback() {
    const { lat, lon } = MAIN_CITY;
    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,` +
            `wind_speed_10m,wind_gusts_10m,surface_pressure,uv_index` +
            `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset` +
            `&timezone=America%2FChicago&forecast_days=6`
        );
        const data = await res.json();
        if (data && data.current) {
            renderCurrentWeatherOM(data);
        }
        if (data && data.daily) {
            renderForecastOM(data);
        }
    } catch (e) {
        console.error('Fallback also failed:', e);
    }
}

function renderCurrentWeather(current, forecast, sunrise, sunset) {
    const hour = new Date().getHours();
    const isEvening = hour >= 18; // 6pm - 11:59pm

    const cardDay = document.getElementById('card-day');
    const cardNight = document.getElementById('card-night');

    // Get today's max/min from forecast
    let todayMaxF = null, todayMinF = null, nightIcon = null, nightWindF = null;
    let dayIcon = current.icon, dayPrecip = null, nightPrecip = null;

    if (forecast && forecast.periods.length > 0) {
        const todayStr = new Date().toLocaleDateString('en-CA');
        for (const p of forecast.periods) {
            const pDate = new Date(p.time).toLocaleDateString('en-CA');
            if (pDate !== todayStr) continue;
            const isNightP = p.name.toLowerCase().includes('night') || p.name.toLowerCase().includes('tonight');
            if (!isNightP) {
                if (p.temp != null) todayMaxF = p.temp;
                if (p.precip != null && dayPrecip === null) dayPrecip = p.precip;
                if (p.summary) dayIcon = nwsSummaryIcon(p.summary);
            }
            if (isNightP) {
                if (p.temp != null) todayMinF = p.temp;
                if (p.precip != null && nightPrecip === null) nightPrecip = p.precip;
                nightIcon = nwsSummaryIcon(p.summary || '');
                if (p.windSustained != null) nightWindF = p.windSustained;
            }
        }
        // Fallback to first max/min if today's periods not found
        if (todayMaxF == null && forecast.maxTemps.length > 0) todayMaxF = forecast.maxTemps[0];
        if (todayMinF == null && forecast.minTemps.length > 0) todayMinF = forecast.minTemps[0];
    }

    if (isEvening) {
        // After 6pm: hide DÍA, show only NOCHE
        cardDay.style.display = 'none';
        cardNight.style.display = '';

        if (nightIcon) {
            document.getElementById('night-icon').innerHTML = iconImg(nightIcon, 170);
        } else {
            document.getElementById('night-icon').innerHTML = iconImg('clear-night', 170);
        }
        if (todayMinF != null) {
            document.getElementById('current-temp-night').innerHTML = `<span class="temp-label temp-label-min">MÍN</span><span class="temp-stacked"><span class="temp-line">${fToC(todayMinF)}°<span class="temp-unit">C</span></span><span class="temp-line">${Math.round(todayMinF)}°<span class="temp-unit">F</span></span></span>`;
        }
        document.getElementById('d-precip-night').textContent = nightPrecip != null ? `${Math.round(nightPrecip)}%` : '0%';
        if (nightWindF != null) {
            document.getElementById('d-wind-night').textContent = `${Math.round(nightWindF * 1.60934)}`;
        }
    } else {
        // Before 6pm: show both DÍA and NOCHE
        cardDay.style.display = '';
        cardNight.style.display = '';

        // DÍA card: show today's MAX from forecast
        document.getElementById('current-icon-big').innerHTML = iconImg(dayIcon, 170);
        if (todayMaxF != null) {
            document.getElementById('current-temp-big').innerHTML = `<span class="temp-label temp-label-max">MÁX</span><span class="temp-stacked"><span class="temp-line">${fToC(todayMaxF)}°<span class="temp-unit">C</span></span><span class="temp-line">${Math.round(todayMaxF)}°<span class="temp-unit">F</span></span></span>`;
        }
        document.getElementById('d-precip-day').textContent = dayPrecip != null ? `${Math.round(dayPrecip)}%` : '0%';
        document.getElementById('d-wind').textContent = current.windSustained != null ? `${Math.round(current.windSustained * 1.60934)} km/h` : '-- km/h';

        // NOCHE card
        if (nightIcon) {
            document.getElementById('night-icon').innerHTML = iconImg(nightIcon, 170);
        } else {
            document.getElementById('night-icon').innerHTML = iconImg('clear-night', 170);
        }
        if (todayMinF != null) {
            document.getElementById('current-temp-night').innerHTML = `<span class="temp-label temp-label-min">MÍN</span><span class="temp-stacked"><span class="temp-line">${fToC(todayMinF)}°<span class="temp-unit">C</span></span><span class="temp-line">${Math.round(todayMinF)}°<span class="temp-unit">F</span></span></span>`;
        }
        document.getElementById('d-precip-night').textContent = nightPrecip != null ? `${Math.round(nightPrecip)}%` : '0%';
        if (nightWindF != null) {
            document.getElementById('d-wind-night').textContent = `${Math.round(nightWindF * 1.60934)}`;
        }
    }

    // Hidden data
    document.getElementById('current-desc').textContent = current.descEs;
    if (todayMaxF != null) document.getElementById('current-hi').innerHTML = `${fToC(todayMaxF)}°C / ${Math.round(todayMaxF)}°F`;
    if (todayMinF != null) document.getElementById('current-lo').innerHTML = `${fToC(todayMinF)}°C / ${Math.round(todayMinF)}°F`;

    // Details card (always current observations)
    const tempF = Math.round(current.temperature);
    document.getElementById('d-feels').textContent = current.temperature != null ? `${fToC(current.temperature)}°C / ${tempF}°F` : '--°';
    document.getElementById('d-humidity').textContent = current.humidity != null ? `${Math.round(current.humidity)}%` : '--%';
    document.getElementById('d-gusts').textContent = current.windGusts != null ? `${Math.round(current.windGusts * 1.60934)} km/h` : '-- km/h';
    document.getElementById('d-dewpoint').textContent = current.dewPoint != null ? `${fToC(current.dewPoint)}°` : '--°';
    document.getElementById('d-pressure').textContent = current.pressure != null ? `${Math.round(current.pressure * 33.8639)} hPa` : '-- hPa';

    // Sunrise / Sunset
    if (sunrise) {
        const sr = new Date(sunrise);
        document.getElementById('d-sunrise').textContent = sr.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        window._sunriseTime = sr;
    }
    if (sunset) {
        const ss = new Date(sunset);
        document.getElementById('d-sunset').textContent = ss.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        window._sunsetTime = ss;
    }
    updateSunVisibility();

    // Set background
    setCurrentBackground(current.summary);
}

// Open-Meteo fallback render
function renderCurrentWeatherOM(data) {
    const c = data.current;
    const d = data.daily;
    const info = getWeatherInfo(c.weather_code);
    const hour = new Date().getHours();
    const isEvening = hour >= 18;

    const cardDay = document.getElementById('card-day');
    const cardNight = document.getElementById('card-night');

    const maxC = Math.round(d.temperature_2m_max[0]);
    const maxF = cToF(d.temperature_2m_max[0]);
    const minC = Math.round(d.temperature_2m_min[0]);
    const minF = cToF(d.temperature_2m_min[0]);

    if (isEvening) {
        cardDay.style.display = 'none';
        cardNight.style.display = '';
        document.getElementById('night-icon').innerHTML = iconImg('clear-night', 170);
        document.getElementById('current-temp-night').innerHTML = `<span class="temp-label temp-label-min">MÍN</span><span class="temp-stacked"><span class="temp-line">${minC}°<span class="temp-unit">C</span></span><span class="temp-line">${minF}°<span class="temp-unit">F</span></span></span>`;
    } else {
        cardDay.style.display = '';
        cardNight.style.display = '';
        document.getElementById('current-icon-big').innerHTML = iconImg(info.icon, 170);
        document.getElementById('current-temp-big').innerHTML = `<span class="temp-label temp-label-max">MÁX</span><span class="temp-stacked"><span class="temp-line">${maxC}°<span class="temp-unit">C</span></span><span class="temp-line">${maxF}°<span class="temp-unit">F</span></span></span>`;
        document.getElementById('night-icon').innerHTML = iconImg('clear-night', 170);
        document.getElementById('current-temp-night').innerHTML = `<span class="temp-label temp-label-min">MÍN</span><span class="temp-stacked"><span class="temp-line">${minC}°<span class="temp-unit">C</span></span><span class="temp-line">${minF}°<span class="temp-unit">F</span></span></span>`;
        document.getElementById('d-wind').textContent = `${Math.round(c.wind_speed_10m)} km/h`;
    }

    document.getElementById('current-desc').textContent = info.desc;
    document.getElementById('current-hi').innerHTML = `${maxC}°C / ${maxF}°F`;
    document.getElementById('current-lo').innerHTML = `${minC}°C / ${minF}°F`;
    document.getElementById('d-feels').textContent = `${Math.round(c.apparent_temperature)}°C / ${cToF(c.apparent_temperature)}°F`;
    document.getElementById('d-humidity').textContent = `${c.relative_humidity_2m}%`;
    document.getElementById('d-gusts').textContent = `${Math.round(c.wind_gusts_10m)} km/h`;
    document.getElementById('d-pressure').textContent = `${Math.round(c.surface_pressure)} hPa`;
    const uvEl = document.getElementById('d-uv');
    if (uvEl) uvEl.textContent = `${Math.round(c.uv_index)}`;

    // Sunrise / Sunset
    if (d.sunrise && d.sunrise[0]) {
        const sr = new Date(d.sunrise[0]);
        document.getElementById('d-sunrise').textContent = sr.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        window._sunriseTime = sr;
    }
    if (d.sunset && d.sunset[0]) {
        const ss = new Date(d.sunset[0]);
        document.getElementById('d-sunset').textContent = ss.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        window._sunsetTime = ss;
    }
    updateSunVisibility();

    setCurrentBackground(info.desc);
}

// ============================================================
// 5-DAY FORECAST (NWS)
// ============================================================

function renderForecast(forecast, dailyWind, dailyPrecip) {
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

        // Get wind and precip from Open-Meteo daily arrays (index 0 = today)
        let windKmh = null;
        let precipProb = day.precip;
        const dayDate = new Date(day.time);
        dayDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((dayDate - today) / 86400000);
        if (dailyWind && diffDays >= 0 && diffDays < dailyWind.length) {
            windKmh = Math.round(dailyWind[diffDays]);
        }
        if (dailyPrecip && diffDays >= 0 && diffDays < dailyPrecip.length) {
            precipProb = dailyPrecip[diffDays];
        }

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="fc-day">${dayName}</div>
            <div class="fc-date">${date.getDate()} ${MESES[date.getMonth()]}</div>
            <div class="fc-icon">${iconImg(iconName, 140)}</div>
            <div class="fc-temps">
                <span class="fc-temps-label fc-temps-label-max">MÁX</span>
                <span class="fc-max">${fToC(day.max)}°<span class="fc-temp-unit">C</span></span>
                <span class="fc-max-alt">${Math.round(day.max)}°<span class="fc-temp-unit">F</span></span>
            </div>
            ${day.min != null ? `<div class="fc-temps fc-temps-min">
                <span class="fc-temps-label fc-temps-label-min">MÍN</span>
                <span class="fc-min">${fToC(day.min)}°<span class="fc-temp-unit">C</span></span>
                <span class="fc-min-alt">${Math.round(day.min)}°<span class="fc-temp-unit">F</span></span>
            </div>` : ''}
            <div class="fc-desc">${descEs}</div>
            <div class="fc-bottom">
                <span><svg class="fc-inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6l-2 2"/><path d="M12 22a7 7 0 0 0 7-7c0-3-2-6-7-11C7 9 5 12 5 15a7 7 0 0 0 7 7z"/></svg> ${precipProb != null ? Math.round(precipProb) : 0}%</span>
                ${windKmh != null ? `<span><svg class="fc-inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2"/><path d="M12.59 19.41A2 2 0 1 0 14 16H2"/><path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/></svg> ${windKmh} km/h</span>` : ''}
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
            <div class="fc-icon">${iconImg(info.icon, 140)}</div>
            <div class="fc-temps">
                <span class="fc-temps-label fc-temps-label-max">MÁX</span>
                <span class="fc-max">${Math.round(d.temperature_2m_max[i])}°<span class="fc-temp-unit">C</span></span>
                <span class="fc-max-alt">${cToF(d.temperature_2m_max[i])}°<span class="fc-temp-unit">F</span></span>
            </div>
            <div class="fc-temps fc-temps-min">
                <span class="fc-temps-label fc-temps-label-min">MÍN</span>
                <span class="fc-min">${Math.round(d.temperature_2m_min[i])}°<span class="fc-temp-unit">C</span></span>
                <span class="fc-min-alt">${cToF(d.temperature_2m_min[i])}°<span class="fc-temp-unit">F</span></span>
            </div>
            <div class="fc-desc">${info.desc}</div>
            <div class="fc-bottom">
                <span><svg class="fc-inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6l-2 2"/><path d="M12 22a7 7 0 0 0 7-7c0-3-2-6-7-11C7 9 5 12 5 15a7 7 0 0 0 7 7z"/></svg> ${d.precipitation_probability_max ? Math.round(d.precipitation_probability_max[i]) : 0}%</span>
                ${d.wind_speed_10m_max ? `<span><svg class="fc-inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2"/><path d="M12.59 19.41A2 2 0 1 0 14 16H2"/><path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/></svg> ${Math.round(d.wind_speed_10m_max[i])} km/h</span>` : ''}
            </div>
        `;
        grid.appendChild(card);
    }
}

// ============================================================
// RADAR - Windy Embed
// ============================================================

function initRadar() {
    // Windy iframe, no JS init needed
}

// ============================================================
// REGIONAL MAPS
// ============================================================
let coahuilaMap, texasMap;

function createCityMarkerHTML(name, temp, iconName, hi, lo) {
    const iconSize = rs(60);
    return `
        <div class="city-marker">
            <div class="cm-name">${name}</div>
            <div class="cm-content">
                <img src="${iconUrl(iconName)}" width="${iconSize}" height="${iconSize}" alt="" class="cm-icon-img">
                <div class="cm-hilo">
                    <span class="cm-hi">▲${hi}°</span>
                    <span class="cm-lo">▼${lo}°</span>
                </div>
            </div>
            <div class="cm-actual-bar">${temp}°</div>
        </div>
    `;
}

function addMarkerToMap(map, lat, lon, html) {
    const w = rs(320);
    const h = rs(200);
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

    L.tileLayer('https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 18,
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

    L.tileLayer('https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 18,
    }).addTo(texasMap);

    // Fetch NWS data for each Texas city, fallback to Open-Meteo if NWS fails
    const nwsResults = await Promise.all(TEXAS_CITIES.map(async (city) => {
        try {
            const xml = await fetchNwsDwml(city.lat, city.lon);
            const data = parseNwsCityData(xml);
            if (data && data.temp != null && data.hi != null) return data;
            return null;
        } catch (e) {
            return null;
        }
    }));

    // Check if any city needs Open-Meteo fallback
    const needsFallback = nwsResults.some(r => r === null);
    let omResults = null;
    if (needsFallback) {
        try {
            const lats = TEXAS_CITIES.map(c => c.lat).join(',');
            const lons = TEXAS_CITIES.map(c => c.lon).join(',');
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
                `&current=temperature_2m,weather_code` +
                `&daily=temperature_2m_max,temperature_2m_min` +
                `&timezone=America%2FChicago&forecast_days=1`
            );
            const data = await res.json();
            omResults = Array.isArray(data) ? data : [data];
        } catch (e) {
            console.error('Open-Meteo fallback for Texas failed:', e);
        }
    }

    TEXAS_CITIES.forEach((city, i) => {
        let temp, icon, hi, lo;
        const r = nwsResults[i];
        if (r) {
            temp = Math.round(r.temp);
            icon = r.icon;
            hi = Math.round(r.hi);
            lo = Math.round(r.lo);
        } else if (omResults && omResults[i]) {
            const om = omResults[i];
            temp = om.current ? Math.round(om.current.temperature_2m) : '--';
            icon = om.current ? getWeatherInfo(om.current.weather_code).icon : 'thermometer';
            hi = om.daily ? Math.round(om.daily.temperature_2m_max[0]) : '--';
            lo = om.daily ? Math.round(om.daily.temperature_2m_min[0]) : '--';
        } else {
            temp = '--'; icon = 'thermometer'; hi = '--'; lo = '--';
        }
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

function fetchWithTimeout(url, options, timeout = 8000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ]);
}

async function fetchNWSAlerts() {
    const alertsList = document.getElementById('alerts-list');
    const alertsCount = document.getElementById('alerts-count');
    const alertsBadge = document.getElementById('alerts-badge');
    const alertsBadgeRight = document.getElementById('alerts-badge-right');

    try {
        const [zoneRes, countyRes] = await Promise.all([
            fetchWithTimeout(`https://api.weather.gov/alerts/active?zone=${NWS_ZONE}`, {
                headers: { 'User-Agent': 'WeatherBorder/1.0' }
            }),
            fetchWithTimeout(`https://api.weather.gov/alerts/active?zone=${NWS_COUNTY}`, {
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
        if (alertsBadgeRight) {
            alertsBadgeRight.textContent = alerts.length;
            alertsBadgeRight.style.display = alerts.length > 0 ? 'flex' : 'none';
        }
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
    // Hide header on inicio panel at startup
    const banner = document.querySelector('.top-banner');
    if (banner) banner.style.display = 'none';
    // Initialize all maps immediately so they are ready when switching panels
    try { initRadar(); } catch (e) { console.error('Radar init error:', e); }
    try { initCoahuilaMap(); } catch (e) { console.error('Coahuila map init error:', e); }
    try { initTexasMap(); } catch (e) { console.error('Texas map init error:', e); }
    try { initAlertsMap(); } catch (e) { console.error('Alerts map init error:', e); }

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
