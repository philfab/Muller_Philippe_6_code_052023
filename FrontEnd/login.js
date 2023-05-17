"use strict";
debugger;
document.querySelector("ul li:nth-child(3)").style.fontWeight = "bold";

const API_LOGIN = "http://localhost:5678/api/users/login";

async function submitEmailPassword(event) {
  event.preventDefault();

  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
  };

  const emailPass = {
      email: event.target.email.value,
      password: event.target.password.value
  };

  try {
      const response = await fetch(API_LOGIN, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(emailPass)
      });

      if (!response.ok) {
          throw new Error(response.status);
      }

      const result = await response.json();

      if (result.token) {
        localStorage.setItem('token', result.token);
        window.location.href = "index.html";
      }

  } catch (error) {
    if (error.message === "401")
      alert ("Mot de passe incorrect !");
    else if (error.message === "401" || (error.message === "404"))
      alert ("E-mail et/ou mot de passe incorrect(s) !");
    else 
      alert ("Erreur serveur : " + error.message);
  }
};

document.querySelector(".form-login").addEventListener("submit", submitEmailPassword);

