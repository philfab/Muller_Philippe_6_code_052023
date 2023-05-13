debugger;
const API = "http://localhost:5678/api/";
const API_WORKS = API + "works";
const API_CATEGORIES = API + "categories";

let galleryWorks = null;
const galleryElt = document.querySelector(".gallery");
let buttonSelected = document.querySelector(".button-selected");
buttonSelected.addEventListener("click", filterClick);

async function getData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("BackEnd Error" + response.status);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch Error", error);
  }
}

async function fillWorks() {
  const arrayWorks = await getData(API_WORKS);

  for (const work of arrayWorks) {
    const figure = document.createElement("figure");
    figure.setAttribute("data-filter", work.categoryId);
    const img = document.createElement("img");
    img.src = work.imageUrl;
    const figcaption = document.createElement("figcaption");
    figcaption.textContent = work.title;
    figure.appendChild(img);
    figure.appendChild(figcaption);
    galleryElt.appendChild(figure);
  }
  //on push les works dans un tableau pour ne pas faire des appels API inutiles
  galleryWorks = Array.from(galleryElt.children);
}

function fillWithAllWorks() {
  galleryElt.innerHTML = "";

  for (const work of galleryWorks) {
    galleryElt.appendChild(work);
  }
}

function updateButtonStyle(buttonFilter) {
  buttonSelected.classList.remove("button-selected");
  buttonFilter.classList.add("button-selected");
  buttonSelected = buttonFilter;
}

function updateWorksUI(filters) {
  for (const work of galleryWorks) {
    const workFilter = work.getAttribute("data-filter");

    if (filters.has(workFilter) && !galleryElt.contains(work)) {
      galleryElt.appendChild(work); //si le filtre le contient mais pas la galerie : on l'ajoute
    } else if (!filters.has(workFilter) && galleryElt.contains(work)) {
      galleryElt.removeChild(work); //si le filtre ne le contient pas mais la galerie oui : on le retire
    }
  }
}

async function filterClick(event) {
  if (buttonSelected === event.target) return; //même bouton, on quitte

  const buttonFilter = event.target;
  updateButtonStyle(buttonFilter);

  if (buttonFilter.getAttribute("data-filter") === "0") {
    //bouton Tous
    fillWithAllWorks();
    return;
  }

  const filters = new Set([buttonFilter.getAttribute("data-filter")]);
  updateWorksUI(filters);
}

async function createFilterButtons() {
  const filterElt = document.querySelector(".filtres");
  const arrayFilters = await getData(API_CATEGORIES);

  for (const filter of arrayFilters) {
    const button = document.createElement("button");
    button.classList.add("button");
    button.textContent = filter.name;
    button.setAttribute("data-filter", filter.id);
    button.addEventListener("click", filterClick);
    filterElt.appendChild(button);
  }
}

galleryElt.innerHTML = "";
fillWorks();
createFilterButtons();
