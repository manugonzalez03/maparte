/* =========================
   ESTILOS DEL MAPA
========================= */

const mapStyles = {
    light: "https://tiles.openfreemap.org/styles/bright",
    dark: "https://tiles.openfreemap.org/styles/dark"
};

/* =========================
   ELEMENTOS HTML
========================= */

const cityInput = document.getElementById("city");
const searchButton = document.getElementById("searchButton");
const titleInput = document.getElementById("mapTitle");

const backgroundColor = document.getElementById("backgroundColor");
const terrainColor = document.getElementById("terrainColor");
const waterColor = document.getElementById("waterColor");
const roadColor = document.getElementById("roadColor");

const showCoordinates = document.getElementById("showCoordinates");
const poster = document.getElementById("poster");
const posterTitle = document.getElementById("posterTitle");
const coordinates = document.getElementById("coordinates");
const textColor = document.getElementById("textColor");
const coordinatesColor = document.getElementById("coordinatesColor");

const squareMap = document.getElementById("squareMap");
const circleMap = document.getElementById("circleMap");
const fullMap = document.getElementById("fullMap");
const mapStyleSelect = document.getElementById("mapStyle");
const resetTextPosition = document.getElementById("resetTextPosition");

/* --- MODO ESTELAR --- */
const geographicMode = document.getElementById("geographicMode");
const starMode = document.getElementById("starMode");
const sky = document.getElementById("sky");
const geographicControls = document.getElementById("geographicControls");
const starControls = document.getElementById("starControls");

const starCityInput = document.getElementById("starCity");
const starSearchButton = document.getElementById("starSearchButton");
const starDate = document.getElementById("starDate");
const starTime = document.getElementById("starTime");
const starTitle = document.getElementById("starTitle");
const showConstellations = document.getElementById("showConstellations");
const showConstellationNames = document.getElementById("showConstellationNames");

/* =========================
   COORDENADAS Y ESTADO
========================= */

let currentLat = -43.2533;
let currentLng = -65.3094;
let skyEngineInstance = null;

/* =========================
   CREAR MAPA GEOGRÁFICO
========================= */

const map = new maplibregl.Map({
    container: "map",
    style: mapStyles.light,
    center: [currentLng, currentLat],
    zoom: 13
});

map.addControl(new maplibregl.NavigationControl(), "top-right");


/* =========================
   ESTILOS Y OCULTAR ETIQUETAS
========================= */

function hideMapLabels() {
    const layers = map.getStyle().layers;

    layers.forEach(function (layer) {
        if (
            layer.type === "symbol" &&
            layer.layout &&
            layer.layout["text-field"]
        ) {
            try {
                map.setLayoutProperty(layer.id, "visibility", "none");
            } catch (error) {
                console.log("No se pudo ocultar una etiqueta.");
            }
        }
    });
}

map.on("load", function () {
    console.log("Mapa geográfico cargado");
    hideMapLabels();
    updateBackgroundColor();
});

function updateBackgroundColor() {
    poster.style.backgroundColor = backgroundColor.value;
}

backgroundColor.addEventListener("input", updateBackgroundColor);

terrainColor.addEventListener("input", function () {
    const layers = map.getStyle().layers;
    layers.forEach(function (layer) {
        if (layer.type === "background") {
            try {
                map.setPaintProperty(layer.id, "background-color", terrainColor.value);
            } catch (error) {
                console.log("No se pudo cambiar el terreno.");
            }
        }
    });
});

waterColor.addEventListener("input", function () {
    try {
        map.setPaintProperty("water", "fill-color", waterColor.value);
    } catch (error) {
        console.log("No se pudo cambiar el color del agua.");
    }
});

roadColor.addEventListener("input", function () {
    const layers = map.getStyle().layers;
    layers.forEach(function (layer) {
        if (
            layer.type === "line" &&
            layer["source-layer"] === "transportation"
        ) {
            try {
                map.setPaintProperty(layer.id, "line-color", roadColor.value);
            } catch (error) {
                console.log("No se pudo cambiar una calle.");
            }
        }
    });
});

mapStyleSelect.addEventListener("change", function () {
    const selectedStyle = mapStyles[mapStyleSelect.value];
    if (!selectedStyle) return;

    map.setStyle(selectedStyle);
    map.once("style.load", function () {
        hideMapLabels();
    });
});

/* =========================
   BÚSQUEDA GEOGRÁFICA
========================= */

searchButton.addEventListener("click", function () {
    const city = cityInput.value.trim();
    if (!city) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data.length) {
                alert("No se encontró el lugar.");
                return;
            }

            currentLat = parseFloat(data[0].lat);
            currentLng = parseFloat(data[0].lon);

            map.jumpTo({ center: [currentLng, currentLat] });

            posterTitle.textContent = city.toUpperCase();
            titleInput.value = city.toUpperCase();
            coordinates.textContent = `\(${currentLat.toFixed(4)} ·\)${currentLng.toFixed(4)}`;
            resetTextPositions();
        })
        .catch(err => {
            console.error(err);
            alert("No se pudo buscar el lugar.");
        });
});

cityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchButton.click();
    }
});

/* =========================
   TEXTOS Y COLORES
========================= */

titleInput.addEventListener("input", function () {
    posterTitle.textContent = titleInput.value.toUpperCase();
});

starTitle.addEventListener("input", function () {
    posterTitle.textContent = starTitle.value.toUpperCase();
});

textColor.addEventListener("input", function () {
    posterTitle.style.color = textColor.value;
});

coordinatesColor.addEventListener("input", function () {
    coordinates.style.color = coordinatesColor.value;
});

showCoordinates.addEventListener("change", function () {
    coordinates.style.display = showCoordinates.checked ? "block" : "none";
});

/* =========================
   FORMAS DEL MAPA
========================= */

function updateMapShape(shapeClass) {
    poster.classList.remove("circle-map", "full-map");
    squareMap.classList.remove("active");
    circleMap.classList.remove("active");
    fullMap.classList.remove("active");

    if (shapeClass === "circle-map") {
        poster.classList.add("circle-map");
        circleMap.classList.add("active");
    } else if (shapeClass === "full-map") {
        poster.classList.add("full-map");
        fullMap.classList.add("active");
    } else {
        squareMap.classList.add("active");
    }

    setTimeout(() => {
        map.resize();
    }, 300);
}

squareMap.addEventListener("click", () => updateMapShape("square"));
circleMap.addEventListener("click", () => updateMapShape("circle-map"));
fullMap.addEventListener("click", () => updateMapShape("full-map"));

/* =========================
   ARRASTRAR Y POSICIONES
========================= */

function makeDraggable(element) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    element.addEventListener("pointerdown", function (event) {
        isDragging = true;
        element.classList.add("dragging");
        element.setPointerCapture(event.pointerId);

        const posterRect = poster.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        startX = event.clientX;
        startY = event.clientY;
        startLeft = elementRect.left - posterRect.left;
        startTop = elementRect.top - posterRect.top;

        event.preventDefault();
    });

    element.addEventListener("pointermove", function (event) {
        if (!isDragging) return;

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;

        const maxLeft = poster.clientWidth - element.offsetWidth;
        const maxTop = poster.clientHeight - element.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
        element.style.right = "auto";
        element.style.bottom = "auto";
        element.style.transform = "none";
    });

    element.addEventListener("pointerup", function (event) {
        isDragging = false;
        element.classList.remove("dragging");
        try {
            element.releasePointerCapture(event.pointerId);
        } catch (error) {}
    });
}

function resetTextPositions() {
    posterTitle.style.left = "50%";
    posterTitle.style.top = "35px";
    posterTitle.style.right = "auto";
    posterTitle.style.bottom = "auto";
    posterTitle.style.transform = "translateX(-50%)";

    coordinates.style.left = "50%";
    coordinates.style.top = "auto";
    coordinates.style.right = "auto";
    coordinates.style.bottom = "55px";
    coordinates.style.transform = "translateX(-50%)";
}

makeDraggable(posterTitle);
makeDraggable(coordinates);
resetTextPosition.addEventListener("click", resetTextPositions);

/* =========================
   MODOS DE NAVEGACIÓN
========================= */

geographicMode.addEventListener("click", function () {
    geographicMode.classList.add("active");
    starMode.classList.remove("active");

    geographicControls.style.display = "block";
    starControls.style.display = "none";

    map.getContainer().style.display = "block";
    sky.style.display = "none";

    posterTitle.textContent = titleInput.value.toUpperCase() || "TRELEW";
    map.resize();
});

starMode.addEventListener("click", function () {
    starMode.classList.add("active");
    geographicMode.classList.remove("active");

    geographicControls.style.display = "none";
    starControls.style.display = "block";

    map.getContainer().style.display = "none";
    sky.style.display = "block";

    prepareStarMode();
    iniciarMapaEstelar();
});

/* =========================
   MAPA ESTELAR
========================= */

let starEngine = null;

function iniciarMapaEstelar() {

    console.log("Iniciando SkyEngine...");

    const skyContainer = document.getElementById("sky");

    // Crear SkyEngine solamente una vez
    if (!starEngine) {

        starEngine = new SkyEngine(
            skyContainer,
            SKY,
            {
                planets: false
            }
        );

        starEngine.start();

        console.log("SkyEngine iniciado correctamente:", starEngine);
    }
}

/* =========================
   PREPARAR MODO ESTELAR
========================= */

function prepareStarMode() {

    console.log("Preparando Mapa estelar");

    if (!starCityInput.value) {
        starCityInput.value = "Trelew";
    }

    if (!starTitle.value) {
        starTitle.value = starCityInput.value.toUpperCase();
    }

}