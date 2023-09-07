import { MDCDialog } from "@material/dialog";
import { initializeApp } from "firebase/app";
import { 
  Timestamp,
  addDoc, 
  collection, 
  collectionGroup, 
  deleteDoc, 
  doc, 
  getDoc, 
  getFirestore, 
  limit, 
  onSnapshot, 
  orderBy, 
  query, 
  serverTimestamp,
  setDoc, 
  updateDoc, 
  where,} from "firebase/firestore";

  import {
    getAuth,
    signInWithRedirect,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    linkWithRedirect,
  } from "firebase/auth";  

const firebaseConfig = {
  apiKey: "AIzaSyCW3FifVTG8MOxDUkWrTjj_trIjOG6iBbw",
  authDomain: "practice-firebase-58d8a.firebaseapp.com",
  projectId: "practice-firebase-58d8a",
  storageBucket: "practice-firebase-58d8a.appspot.com",
  messagingSenderId: "111386963890",
  appId: "1:111386963890:web:574d07771caa5da0977eab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// initialisation de services Firebase
const db = getFirestore(app);
const auth = getAuth(app);

// Référence de la collection
const citiesRef = collectionGroup(db, "villes");
const citiesQuery = query(citiesRef, orderBy("dateDajout", "desc"));

//Enregistrement des données de l'utilisateur
const newUser = ({ email, uid }) => {
  const userRef = doc(db, "utilisateurs", uid);
  setDoc(userRef, { email, uid }, { merge: true });
};

const addCityForm = document.querySelector(".set-city");
const setCityForm = async (docCityID, dialog) => {
  //Ajouter document "ville" dans une sous-collection de la collection "utilisateurs"
  addCityForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newDocID = String(addCityForm.ville.value)
      .toLocaleLowerCase() 
      .replace(/\s+/g, "");
    const cityID = docCityID === "nouvelle-ville" ? newDocID : docCityID;
    const user = auth.currentUser;
    const usersCityRef = `utilisateurs/${user.uid}/villes`;
    const userCityDocRef = doc(db, usersCityRef, cityID);

    const pays = addCityForm.pays.value;
    const ville = addCityForm.ville.value;
    const population = Number(addCityForm.population.value);
    const capital = addCityForm.capital.value === "true" ? true : false;

    setDoc(userCityDocRef, {
      cityID,
      pays,
      ville,
      population,
      capital,
      dateDajout: serverTimestamp(),
      user: {
        email: user.email,
        uid: user.uid,
      },
    });

    addCityForm.reset();

    if (docCityID === "nouvelle-ville") dialog.close();
  });
};

const getFormatedDate = (timestamp) => {
  const formatedDate = new Intl.DateTimeFormat('fr').format(timestamp ? timestamp.toDate() : new Date());
  return formatedDate
}

//Effacer un document
const deleteCityDoc = (userID) => {
  const cityIdInStore = window.localStorage.getItem("cityID");
  if (cityIdInStore) {
    const usersCityRef = `utilisateurs/${userID}/villes`;
    deleteDoc(doc(db, usersCityRef, cityIdInStore));
    window.localStorage.removeItem("cityID");
  }
};

//Observer les données en temps réel
const cityItemContainer = document.querySelector(".city-item-container");
let villes = [];

onSnapshot(citiesQuery, (snapshot) => {
  villes = snapshot.docs.map((d) => d.data());
  let city = "";

  villes.forEach((ville) => {
    city += `
    <a class="city-card mdc-card mdc-card--outlined" href="detail.html?data=${
      ville.cityID
    }" style="opacity: ${ville.isOffLine === true ? "0.5" : "1"}">
    
    <h1 class="city-title">${ville.ville}</h1>
          <h4 class="city-country">${
           ville.capital === true ? "La capitale de " : "Pays: "
          } ${ville.pays}</h4>
          <p class="city-population">Population: ${ville.population}</p>
          <p class="city-publisher">Postée par ${
            ville.user?.uid === auth.currentUser.uid
              ? "vous"
              : ville.user?.email
          }
          </p>
          <p class="city-population">Ajoutée le : ${getFormatedDate(
            ville.dateDajout
          )}</p>
    </a>
   `;
  });
    cityItemContainer.innerHTML = city;

});

if (!window.location.search.replace("?data=", "")){
  //page acceuil
  const dialog = new MDCDialog(document.querySelector('.mdc-dialog'));
  const addBtn = document.querySelector(".addBtn");
  addBtn.addEventListener("click", () => dialog.open());

  setCityForm ("nouvelle-ville", dialog);

//Authentification sans password (avec le lien email)
const passwordLessForm = document.querySelector(".passwordless");
passwordLessForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = passwordLessForm.email.value;

  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };

  sendSignInLinkToEmail(auth, email, actionCodeSettings)
    .then(() => {
      passwordLessForm.reset();
    })
    .catch((error) => console.log(error.message));

});

if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = window.localStorage.getItem("emailForSign");

  if (!email) {
    email = window.prompt("Veillez entrer votre email pour la confirmation");
  }

  signInWithEmailLink(auth, email, window.location.href)
    .then(() => {
      console.log("Connectez avec succès");
      window.localStorage.removeItem("emailForSign");

      //Lier le compte avec un compte Google
      linkWithRedirect(auth.currentUser, new GoogleAuthProvider());

    })
    .catch((error) => console.log(error.message));
}

// Se connecter avec un compte Google
const signInGoogleBtn = document.querySelector(".googleLogin");
signInGoogleBtn.addEventListener("click", () => {
  signInWithRedirect(auth, new GoogleAuthProvider())
});

} else {
  // page detail
  const cityID = window.location.search.replace("?data=", "");
  const queryDoc = query(citiesRef, where("cityID", "==", cityID));

  onSnapshot(queryDoc, (snapshot) => {
    const villes = snapshot.docs.map((d) => d.data());
    const cityItemContainer = document.querySelector(".city-card");

    cityItemContainer.innerHTML = `
        <h1 class="city-title">${villes[0].ville}</h1>
        <h4 class="city-country">${
          villes[0].capital === true ? "La capitale de " : "Pays: "
        } ${villes[0].pays}</h4>
        <p class="city-population">Poupulation: ${villes[0].population}</p>
        <p class="city-publisher">Postée par ${
          villes[0].user?.uid === auth.currentUser.uid
            ? "vous"
            : villes[0].user?.email
        }
        </p>
        <p class="city-population">Ajoutée le: ${getFormatedDate(
          villes[0].dateDajout
        )}
        </p>
        <a class="delete-btn mdc-button mdc-button--raised">
          <span class="mdc-button__label">Supprimer cette ville</span>
        <a/>
       `;
    const deleteBtn = document.querySelector(".delete-btn");
    const editBtn = document.querySelector(".edit-btn");
    const addCityForm = document.querySelector(".set-city");
    const isUserOwner = villes[0].user?.uid === auth.currentUser.uid;
    deleteBtn.style.display = isUserOwner ? "" : "none";
    addCityForm.style.display = isUserOwner ? "" : "none";

    deleteBtn.addEventListener("click", () => {
      window.localStorage.setItem("cityID", cityID);
      location.assign(`${location.origin}/dist/index.html`);
    });

    //Modification de la ville
    editBtn.addEventListener("click", () => {
      setCityForm(cityID);
    });
  })

}

//Le changement d'etat de l'interface (connexion/deconnexion)
const isLogInToolBar = document.querySelector(".isLogIn-toolbar");
const isLogInHome = document.querySelector(".isLogIn-home");
const isLogOut = document.querySelector(".isLogOut");
isLogInToolBar.style.display = "none";
isLogInHome.style.display = "none";
isLogOut.style.display = "none";

const userEmail = document.querySelector(".current-user");

// subscription à l'état de la connexion utilisateur
onAuthStateChanged(auth, async (user) => {
  if (user) {
    //state
    isLogInToolBar.style.display = "";
    isLogInHome.style.display = "";
    isLogOut.style.display = "none";
    userEmail.innerHTML = `${user.email}`;

    //ajout de nouveau utilisateur dans la bdd
    const userDocRef = doc(db, "utilisateurs", `${user.uid}`);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) newUser(user);

   deleteCityDoc(user.uid);
  } else {
    isLogInToolBar.style.display = "none";
    isLogInHome.style.display = "none";
    isLogOut.style.display = "";
  }
  });

  //Deconnexion de l'utilisateur
const logoutBtn = document.querySelector(".logoutBtn");
logoutBtn.addEventListener("click", () => signOut(auth));
