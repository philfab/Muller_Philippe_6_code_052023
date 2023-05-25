"use strict";

class TempFormData {
  constructor(imageUrl, title, categoryId) {
    this.id = Math.max(...galleryWorks.map(e => e.getAttribute("data-id"))) + 1;//on récup le data max et on ajoute 1
    this.imageUrl = imageUrl;
    this.title = title;
    this.categoryId = categoryId;
  }
}
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
const validateButton = document.querySelector(".button-validate");
const form = document.getElementById("addForm");
const imageFile = document.getElementById("imFile");
const title = document.getElementById("title");
const category = document.getElementById("category");
const elemsContainer = document.getElementById("elemsContainer");

let galleryWorks = null;
let buttonSelectedElt = document.querySelector(".button-selected");

buttonSelectedElt.addEventListener("click", filterClick);
loginNavElt.addEventListener("click", logInOut);
imageFile.addEventListener("change", loadFile);
form.addEventListener("submit", submitForm);
imageFile.addEventListener("change", validateForm);
title.addEventListener("input", validateForm);
category.addEventListener("change", validateForm);
preview.addEventListener("click", ()=> {imageFile.click();});

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

function createImage(src, alt) {
  let img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  return img;
}

function addAttributes (element, attrs) {
  for (let key in attrs) {
    element.setAttribute(key, attrs[key]);
  }
}

function createFigcaption(work) {
  let figcaption = document.createElement("figcaption");
  figcaption.textContent = (work instanceof TempFormData) ? "éditer" : work.title;
  return figcaption;
}

function createFigure (work) {
  let figure = document.createElement("figure");
  figure.style.position = "relative";
  addAttributes (figure,{ "data-categoryId": work.categoryId, "data-id": work.id })
  const img = createImage(work.imageUrl, work.title);
  const figcaption = createFigcaption(work);
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

function createNav(buttonExpand,buttonTrash) {
  const nav = document.createElement("nav");
  nav.classList.add("fa-container");
  nav.appendChild(buttonExpand);
  nav.appendChild(buttonTrash);
  return nav;
}

async function fillWorks() {
  const arrayWorks = await getData(API_WORKS);

  for (const work of arrayWorks) {
    const figure =  createFigure(work);
    const buttonExpand = createButton("icon-button","fas fa-arrows-up-down-left-right");
    const buttonTrash = createButton ("icon-button icon-trash","fas fa-trash-can");
    const nav = createNav(buttonExpand,buttonTrash);
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

function updateProperty(selector, property, value) {
  let element = document.querySelector(selector);
  if(element) {
      if (property in element.style) {
          element.style[property] = value;
      } else {
          element[property] = value;
      }
  }
}

function showHideGallery (event)
{
  if (event === null || event.currentTarget.id === "backButton") {
    updateProperty("#addWork", "display", "block");
    updateProperty(".back-modal", "display", "none");
    updateProperty(".modal-wrapper a", "display", "block");
    updateProperty("#galleryEdit", "display", "grid");
    updateProperty("#addForm", "display", "none");
    updateProperty(".modal-wrapper h2", "textContent", "Galerie photo");
    updateProperty(".modal-wrapper > .line", "display", "block");
  }
  else {
    updateProperty("#addWork", "display", "none");
    updateProperty(".back-modal", "display", "inline-block");
    updateProperty(".modal-wrapper a", "display", "none");
    updateProperty("#galleryEdit", "display", "none");
    updateProperty("#addForm", "display", "flex");
    updateProperty(".modal-wrapper h2", "textContent", "Ajout photo");
    updateProperty(".modal-wrapper > .line", "display", "none");
    updateProperty("#preview", "display", "none");
    updateProperty(".button-validate", "disabled", true);
    updateProperty("#elemsContainer", "display", "flex");
    form.reset();
  }
}

function loadFile(e){
  const file = e.target.files[0];
  
  if (file.size > MAX_FILE_SIZE) {
    alert("La taille du fichier dépasse 4mo !");
    e.target.value = "";
  }
  else {
    let reader = new FileReader();
    reader.addEventListener("load",(e)=> { //si la taille de l'image est importante
        preview.src = e.target.result;
        preview.style.display = "block";
        elemsContainer.style.display = "none";
    });
    reader.readAsDataURL(file);
}
}

function validateForm() {
  if (imageFile.files.length > 0 && title.value !==  "" && category.value !== "") 
    validateButton.disabled = false;
  else
    validateButton.disabled = true;
  }

  function submitForm(event) {//les données ont été check dans validateForm
    event.preventDefault();
    let formData = new TempFormData(preview.src, title.value, category.value);
    let figure = createFigure(formData);
    const buttonExpand = createButton("icon-button","fas fa-arrows-up-down-left-right");
    const buttonTrash = createButton ("icon-button icon-trash","fas fa-trash-can");
    buttonTrash.onclick = deleteWork;
    const nav = createNav(buttonExpand,buttonTrash);
    figure.appendChild(nav);
    galleryEditElt.appendChild(figure);
    showHideGallery (null);
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


