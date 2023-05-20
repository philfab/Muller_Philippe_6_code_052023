"use strict";
debugger;

const API = "http://localhost:5678/api/";
const API_WORKS = API + "works";
const API_CATEGORIES = API + "categories";

const galleryElt = document.getElementById("galleryMain");
const galleryEditElt = document.getElementById("galleryEdit");
const loginNavElt = document.querySelector("ul li:nth-child(3)");
const filterElt = document.querySelector(".filtres");
const modalElt = document.querySelector(".modal");
const showModal = document.querySelector(".showModal");
const hideModal = document.querySelector(".hide-modal");

let galleryWorks = null;
let buttonSelectedElt = document.querySelector(".button-selected");

buttonSelectedElt.addEventListener("click", filterClick);
loginNavElt.addEventListener("click", logInOut);

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
    figure.style.position = "relative";

    figure.setAttribute("data-categoryId", work.categoryId);
    figure.setAttribute("data-id", work.id);
    const img = document.createElement("img");
    img.src = work.imageUrl;
    const figcaption = document.createElement("figcaption");
    figcaption.textContent = work.title;
    figure.appendChild(img);
    figure.appendChild(figcaption);

    const nav = document.createElement("nav");
    nav.classList.add("fa-container");

    const buttonExpand = document.createElement("button");
    buttonExpand.classList.add("icon-button");
    const iconExpand = document.createElement("i");
    iconExpand.classList.add("fas", "fa-arrows-up-down-left-right");
    buttonExpand.appendChild(iconExpand);
    
    const buttonTrash = document.createElement("button");
    buttonTrash.classList.add("icon-button" , "icon-trash");
    const iconTrash = document.createElement("i");
    iconTrash.classList.add("fas", "fa-trash-can");
    
    buttonTrash.appendChild(iconTrash);

    nav.appendChild(buttonExpand);
    nav.appendChild(buttonTrash);
    figure.appendChild(nav);
    galleryElt.appendChild(figure);
  }
  //on push les works dans un tableau pour ne pas faire des appels API inutiles
  galleryWorks = Array.from(galleryElt.children);
}

function fillWithAllWorks() {

clearElt (galleryElt);

  for (const work of galleryWorks) {
    galleryElt.appendChild(work);
  }
}

function removeWorkFromColl(collection, dataId) {
  Array.from(collection.children).forEach(e => e.dataset.id === dataId && e.parentNode.removeChild(e));
}

function removeWorkFromArray(array, dataId) {
  array.splice(array.findIndex(e => e.dataset.id === dataId), 1);
}

function deleteWork(event) {
  let dataId = event.target.closest("figure").dataset.id;
  let response = confirm(`Supprimer la photo avec l'ID : ${dataId} ?`);
    if (response) {
      removeWorkFromArray(galleryWorks,dataId);
      removeWorkFromColl(galleryElt,dataId);
      removeWorkFromColl(galleryEditElt,dataId);
    }
}

function fillEditWithAllWorks() {
  
  clearElt (galleryEditElt);

  galleryWorks.forEach(figure => {
  let clone = figure.cloneNode(true);
  galleryEditElt.append(clone);
  clone.querySelector("figcaption").textContent = "éditer";
  clone.querySelector(".icon-trash").onclick = deleteWork;
});
}

function clearElt (list) {
  while (list.firstChild) 
    list.removeChild(list.firstChild);
}

function updateButtonStyle(buttonFilter) {
  buttonSelectedElt.classList.remove("button-selected");
  buttonFilter.classList.add("button-selected");
  buttonSelectedElt = buttonFilter;
}

function updateWorksUI(filters) {
  for (const work of galleryWorks) {
    const workFilter = work.getAttribute("data-categoryId");

    if (filters.has(workFilter) && !galleryElt.contains(work)) {
      galleryElt.appendChild(work); //si le filtre le contient mais pas la galerie : on l'ajoute
    } else if (!filters.has(workFilter) && galleryElt.contains(work)) {
      galleryElt.removeChild(work); //si le filtre ne le contient pas mais la galerie oui : on le retire
    }
  }
}

async function filterClick(event) {
  if (buttonSelectedElt === event.target) return; //même bouton, on quitte

  const buttonFilter = event.target;
  updateButtonStyle(buttonFilter);

  if (buttonFilter.getAttribute("data-categoryId") === "0") {
    fillWithAllWorks();
    return;
  }

  const filters = new Set([buttonFilter.getAttribute("data-categoryId")]);
  updateWorksUI(filters);
}

function logInOut() {
  if (localStorage.getItem("token"))
  {
    let response = confirm("Vous souhaitez vous déconnecter ?");
    if (response) {
      localStorage.removeItem("token");
      hideShowEdition(false);
    }
    return;
  } 
  window.location.href = "login.html";
}

async function createFilterButtons() {
  
  const arrayCategories = await getData(API_CATEGORIES);
  for (const categoryId of arrayCategories) {
    const button = document.createElement("button");
    button.classList.add("button");
    button.textContent = categoryId.name;
    button.setAttribute("data-categoryId", categoryId.id);
    button.addEventListener("click", filterClick);
    filterElt.appendChild(button);
  }
}

function hideShowEdition (action) {
  if (action)
  {
    loginNavElt.textContent = "logout";
    filterElt.style.visibility = "hidden";
    filterElt.style.marginBottom = 0;
  }
  else
  {
    loginNavElt.textContent = "login";
    filterElt.style.visibility = "visible";
    filterElt.style.marginBottom = "50px";
  }
  document.querySelectorAll(".edit").forEach(e => e.style.display = (action) ? "inline-block" : "none");
} 

showModal.onclick = ()=> {
  modalElt.style.display = "flex";
  showModal.setAttribute("aria-expanded", "true");//contenu accéssibilité associé au bouton visible (aria)
  fillEditWithAllWorks();
}

hideModal.onclick = ()=> {
  modalElt.style.display = "none";
  showModal.setAttribute("aria-expanded", "false");//hidden
}

window.onclick = (event)=> {
  if (event.target === modalElt) {
    modalElt.style.display = "none";
    showModal.setAttribute("aria-expanded", "false");
  }
}

  fillWorks();
  createFilterButtons();

  if (localStorage.getItem("token"))
    hideShowEdition(true);


