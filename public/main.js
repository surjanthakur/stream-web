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

barba.init({
  transitions: [
    {
      name: "fade",
      async leave(data) {
        await gsap.to(data.current.container, {
          opacity: 0,
          duration: 0.5,
        });
      },
      enter(data) {
        window.scrollTo(0, 0); // Optional: scroll to top on page enter
        gsap.from(data.next.container, {
          opacity: 0,
          duration: 0.5,
        });
      },
      once(data) {
        gsap.from(data.next.container, {
          opacity: 0,
          duration: 0.5,
        });
      },
    },
  ],
});
