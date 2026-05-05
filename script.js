const imagenes = document.querySelectorAll(".grid-galeria img");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const cerrar = document.querySelector(".cerrar");
const izquierda = document.querySelector(".izquierda");
const derecha = document.querySelector(".derecha");
const contador = document.getElementById("contador");

let indexActual = 0;

// Mostrar imagen + contador
function mostrarImagen(){
    lightboxImg.src = imagenes[indexActual].src;
    contador.textContent = (indexActual + 1) + " / " + imagenes.length;
}

// Abrir lightbox
imagenes.forEach((img, index) => {
    img.addEventListener("click", () => {
        indexActual = index;
        mostrarImagen();
        lightbox.style.display = "flex";
    });
});

// Flechas
derecha.addEventListener("click", () => {
    indexActual = (indexActual + 1) % imagenes.length;
    mostrarImagen();
});

izquierda.addEventListener("click", () => {
    indexActual = (indexActual - 1 + imagenes.length) % imagenes.length;
    mostrarImagen();
});

// Cerrar
cerrar.addEventListener("click", () => {
    lightbox.style.display = "none";
});

// Cerrar tocando afuera
lightbox.addEventListener("click", (e) => {
    if(e.target !== lightboxImg){
        lightbox.style.display = "none";
    }
});


// ⌨️ NAVEGACIÓN CON TECLADO
document.addEventListener("keydown", (e) => {
    if(lightbox.style.display === "flex"){
        if(e.key === "ArrowRight"){
            indexActual = (indexActual + 1) % imagenes.length;
            mostrarImagen();
        }
        if(e.key === "ArrowLeft"){
            indexActual = (indexActual - 1 + imagenes.length) % imagenes.length;
            mostrarImagen();
        }
        if(e.key === "Escape"){
            lightbox.style.display = "none";
        }
    }
});


// 📱 DESLIZAR EN CELULAR
let startX = 0;

lightbox.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
});

lightbox.addEventListener("touchend", (e) => {
    let endX = e.changedTouches[0].clientX;

    if(startX - endX > 50){
        // swipe izquierda
        indexActual = (indexActual + 1) % imagenes.length;
        mostrarImagen();
    }

    if(endX - startX > 50){
        // swipe derecha
        indexActual = (indexActual - 1 + imagenes.length) % imagenes.length;
        mostrarImagen();
    }
});

window.addEventListener("scroll", () => {
    const nav = document.querySelector("nav");

    if(window.scrollY > 50){
        nav.classList.add("scrolled");
    } else {
        nav.classList.remove("scrolled");
    }
});