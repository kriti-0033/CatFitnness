const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    console.log(entry);
    if (entry.isIntersecting) {
      entry.target.classList.add("scroll-shown");
    } else {
      entry.target.classList.remove("scroll-shown");
    }
  });
});

const hidden_elements = document.querySelectorAll(".scroll-hidden");
hidden_elements.forEach((el) => observer.observe(el));
