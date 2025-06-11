// ✅ Custom Bootstrap validation
(function () {
  "use strict";

  window.addEventListener("load", function () {
    const forms = document.querySelectorAll(".needs-validation");

    Array.from(forms).forEach(function (form) {
      form.addEventListener(
        "submit",
        function (event) {
          if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
          }
          form.classList.add("was-validated");
        },
        false
      );
    });
  });
})();

// main.js

// Loader control
function showLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "flex";
}
function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "none";
}

// Barba init
barba.init({
  transitions: [
    {
      name: "page-transition",
      async leave(data) {
        showLoader();
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay if needed
        data.current.container.remove();
      },
      async enter() {
        hideLoader();
      },
    },
  ],
});
