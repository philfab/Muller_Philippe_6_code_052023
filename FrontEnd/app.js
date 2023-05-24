"use strict";


const API = "http://localhost:5678/api/";
const API_WORKS = API + "works/";
const API_CATEGORIES = API + "categories";
const MAX_FILE_SIZE = 4 * 1024 * 1024;

const galleryElt = document.getElementById("galleryMain");
const galleryEditElt = document.getElementById("galleryEdit");
const loginNavElt = document.querySelector("ul li:nth-child(3)");
const filterElt = document.querySelector(".filtres");
const modalElt = document.querySelector(".modal");
const showModal = document.querySelector(".showModal");
const hideModal = document.querySelector(".hide-modal");
const publishModifs = document.querySelector(".button-edit");
const addWorkButtonElt = document.querySelector("#addWork");

let galleryWorks = null;
let buttonSelectedElt = document.querySelector(".button-selected");

buttonSelectedElt.addEventListener("click", filterClick);
loginNavElt.addEventListener("click", logInOut);
document.querySelector("#formFile").addEventListener("change", loadFile);

function loadFile(e){
  const file = e.target.files[0];
  
  if (file.size > MAX_FILE_SIZE) {
    alert("La taille du fichier dépasse 4mo !");
    e.target.value = "";
  }
}

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

function createFigure (work) {
  let figure = document.createElement("figure");
  figure.style.position = "relative";
  figure.setAttribute("data-categoryId", work.categoryId);
  figure.setAttribute("data-id", work.id);
  let img = document.createElement("img");
  img.src = work.imageUrl;
  img.alt = work.title;

  let figcaption = document.createElement("figcaption");
  figcaption.textContent = work.title;
  figure.appendChild(img);
  figure.appendChild(figcaption);
  return figure;
}

function createButton(classesBtn,classesIcon) {
  const button = document.createElement("button");
  const icon = document.createElement("i");
  button.classList.add(...classesBtn.split(' '));
  icon.classList.add(...classesIcon.split(' '));
  button.appendChild(icon);
  return button;
}

async function fillWorks() {
  const arrayWorks = await getData(API_WORKS);

  for (const work of arrayWorks) {
    const figure =  createFigure(work);
    const nav = document.createElement("nav");

    nav.classList.add("fa-container");

    const buttonExpand = createButton("icon-button","fas fa-arrows-up-down-left-right");
    const buttonTrash = createButton ("icon-button icon-trash","fas fa-trash-can");

    nav.appendChild(buttonExpand);
    nav.appendChild(buttonTrash);
    figure.appendChild(nav);
    galleryElt.appendChild(figure);
  }
  //on push les works dans un tableau pour ne pas faire des appels API inutiles
  galleryWorks = Array.from(galleryElt.children);
  fillEditWithAllWorks();
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
  let textImg = event.target.closest("figure").querySelector("img").alt;
  let response = confirm(`Supprimer le projet : ${textImg} ?`);
    if (response) 
      removeWorkFromColl(galleryEditElt,dataId);
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


async function updateWorks (worksDel, worksAdd)
{
  const token = localStorage.getItem("token");

  if (worksDel.size > 0)
  await deleteBDDWork(token, worksDel);

  if (worksAdd.size > 0)
  await addBDDWork(token, worksAdd);

  alert("Modifications enregistrées !");
  clearElt (galleryElt);
  fillWorks();
}

async function deleteBDDWork(token, worksDel) {

  for (let id of worksDel) 
    try {
      const response = await fetch(API_WORKS + id, {
        method: "DELETE",
        headers: {'Authorization': `Bearer ${token}`}
      });

      if (!response.ok) 
        throw new Error(response.status);

      } catch (error) {
        console.log("Erreur lors de la suppression : " + error) ;
      }
}

async function addBDDWork (token, worksAdd) {

  for (let id of worksAdd) 
    try {
      let formData = new FormData();
      formData.append("image", votreImage); 
      formData.append("title", votreTitre); 
      formData.append("category", votreCategorie); 

      const response = await fetch(API_WORKS, {
        method: "POST",
        headers: {'Authorization': `Bearer ${token}`},
        body: formData,
      });

      if (!response.ok) 
        throw new Error(response.status);

      } catch (error) {
        console.log("Erreur lors de l'ajout : " + error) ;
      }
}

function showHideGallery (event)
{
  if (event === null || event.currentTarget.id === "backButton") {
    addWorkButtonElt.style.display = "block";
    document.querySelector(".back-modal").style.display  = "none";
    document.querySelector(".modal-wrapper a").style.display = "block";
    document.querySelector("#galleryEdit").style.display = "grid";
    document.querySelector("#addForm").style.display = "none";
    document.querySelector(".modal-wrapper h2").textContent = "Galerie photo";
    document.querySelector(".modal-wrapper > .line").style.display = "block";
    document.querySelector(".button-validate").disabled = false;
  }
  else {
    addWorkButtonElt.style.display = "none";
    document.querySelector(".back-modal").style.display = "inline-block";
    document.querySelector(".modal-wrapper a").style.display = "none";
    document.querySelector("#galleryEdit").style.display = "none";
    document.querySelector("#addForm").style.display = "flex";
    document.querySelector(".modal-wrapper h2").textContent = "Ajout photo";
    document.querySelector(".modal-wrapper > .line").style.display = "none";
    document.querySelector(".button-validate").disabled = true;
  }
}

showModal.onclick = ()=> {
  showHideGallery (null);
  modalElt.style.display = "flex";
  showModal.setAttribute("aria-expanded", "true");//contenu accéssibilité associé au bouton visible (aria)
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

publishModifs.onclick = ()=> {
  let setNew = new Set(Array.from(galleryEditElt.children).map(e => e.getAttribute("data-id")));
  let setOld = new Set(galleryWorks.map(e => e.getAttribute("data-id")));
  let worksDel = new Set([...setOld].filter(x => !setNew.has(x)));
  let worksAdd = new Set([...setNew].filter(x => !setOld.has(x)));
  
  if (worksDel.size + worksAdd.size === 0 )
  {
   alert ("Pas de modifications !");
   return;
  }

  let response = confirm("Publier les changements effectués ?");
  if (response)
  updateWorks (worksDel,worksAdd);
}

  fillWorks();
  createFilterButtons();

  if (localStorage.getItem("token"))
    hideShowEdition(true);


