const slide_page = document.querySelector(".slide_page");
const next_button = document.querySelector(".next_button");
const prev_button = document.querySelector(".previous");

const error_popup = document.querySelector(".error-popup");
const close_error = document.querySelector(".close-error");

next_button.addEventListener("click", function () {
  slide_page.style.marginLeft = "-100%";
});

prev_button.addEventListener("click", function () {
  if (slide_page.style.marginLeft == "0%") {
    window.location.href = "login_page.php";
  } else {
    slide_page.style.marginLeft = "0%";
  }
});

close_error.addEventListener("click", function () {
  error_popup.classList.toggle("active");
});
