// forget_password.js
const open_modal_buttons = document.querySelectorAll("[data-modal-target]");
const close_modal_buttons = document.querySelectorAll("[data-close-button]");
const overlay = document.getElementById("overlay");

open_modal_buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const modal = document.querySelector(button.dataset.modalTarget);
    open_modal(modal);
  });
});

close_modal_buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const modal = button.closest(".forget-password-modal");
    close_modal(modal);
  });
});

overlay.addEventListener("click", () => {
  const modals = document.querySelectorAll(".forget-password-modal.active");
  modals.forEach((modal) => {
    close_modal(modal);
  });
});

function open_modal(modal) {
  if (modal == null) return;
  modal.classList.add("active");
  overlay.classList.add("active");
}

function close_modal(modal) {
  if (modal == null) return;
  modal.classList.remove("active");
  overlay.classList.remove("active");
}

async function checkEmail(inputValue) {
  let email = document.getElementById(inputValue).value;

  if (email.trim() === "") {
    return false;
  }

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email)) {
    return false;
  }

  try {
    let response = await fetch(
      "check_email.php?email=" + encodeURIComponent(email)
    );
    let data = await response.text();

    if (data.includes("already in use")) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

// email-otp.js
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.querySelector(".forget-password-modal");
  const overlay = document.getElementById("overlay");
  const emailInput = document.getElementById("email-verify");
  const otpInput = document.getElementById("email-otp");
  const otpWrapper = document.querySelector(".otp-wrapper");
  const modalButtons = document.querySelector(".modal-buttons");
  const verifyButton = modalButtons.querySelector(".otp-verify");
  const otpButton = modalButtons.querySelector(".otp-button");
  const modalBody = document.querySelector(".modal-body");
  const resetBtnContainer = document.querySelector(".reset-vertification-btn");
  const passwordResetTemplate = document.querySelector(
    ".password-reset-form-template"
  );

  let otpValue = ""; // Store OTP value
  let countdownInterval; // Store countdown interval
  let timeLeft = 60; // Countdown time in seconds

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async function sendOTP() {
    const email = emailInput.value.trim();

    if (!isValidEmail(email)) {
      showNotification("Please enter a valid email", "error");
      return;
    } else if (await checkEmail("email-verify")) {
      showNotification("Email is not registered", "error");
      return;
    }

    otpValue = generateOTP();
    console.log("Generated OTP:", otpValue); // For testing purposes

    emailInput.disabled = true;
    otpWrapper.style.display = "block";

    verifyButton.style.display = "none";
    otpButton.textContent = "Verify";
    otpButton.style.display = "block";
    otpButton.classList.remove("otp-button");

    const templateParams = {
      to_email: email,
      verification_code: otpValue,
    };

    // Send email using Email.js
    emailjs
      .send("service_8umn0df", "template_ulh1kc4", templateParams)
      .then(function (response) {
        console.log("Email successfully sent!", response);
        showNotification("Verification code sent to your email", "success");
        startCountdown();
      })
      .catch(function (error) {
        console.error("Error sending email:", error);
        showNotification(
          "Failed to send verification code. Please try again.",
          "error"
        );
        resetForm();
      });
  }

  function startCountdown() {
    const countdownElement = document.querySelector(".countdown");
    if (!countdownElement) {
      console.error("Countdown element not found");
      return;
    }

    let timeLeft = 60;
    updateCountdown();

    const countdownInterval = setInterval(function () {
      timeLeft--;
      updateCountdown();

      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        countdownElement.textContent = "";

        // Create resend button
        const resendButton = document.createElement("button");
        resendButton.textContent = "Resend verification code";
        resendButton.className = "resend-button";

        resendButton.addEventListener("click", function () {
          countdownElement.textContent = "";
          resendButton.remove();
          sendOTP();
        });

        resetBtnContainer.innerHTML = "";
        resetBtnContainer.appendChild(resendButton);
      }
    }, 1000);

    function updateCountdown() {
      countdownElement.textContent = `Reset vertification code in ${timeLeft} seconds`;
    }
  }

  // Function to verify OTP
  function verifyOTP() {
    const userInputOTP = otpInput.value.trim();

    if (userInputOTP === otpValue) {
      showNotification("Verification successful", "success");
      showPasswordResetForm();
    } else {
      showNotification("Invalid verification code. Please try again.", "error");
    }
  }

  // Function to show password reset form
  function showPasswordResetForm() {
    // Clear the existing form
    const formContainer = document.querySelector(".otp-input-wrapper");
    formContainer.style.display = "none";

    // Create password reset form
    const passwordResetForm = document.createElement("div");
    passwordResetForm.className = "password-reset-form";

    // Clone the template
    const clonedForm = passwordResetTemplate.cloneNode(true);
    clonedForm.style.display = "block";
    passwordResetForm.appendChild(clonedForm);

    // Set the email value
    const emailDisplay = clonedForm.querySelector("#email-display-value");
    emailDisplay.value = emailInput.value;

    // Add event listener to the reset button
    const resetButton = clonedForm.querySelector("#reset-password-button");
    resetButton.addEventListener("click", function () {
      const email = document.getElementById("email-display-value").value;
      const newPassword = clonedForm.querySelector("#new-password").value;
      const confirmPassword =
        clonedForm.querySelector("#confirm-password").value;

      console.log(email);
      if (newPassword === "" || confirmPassword === "") {
        showNotification("Please fill in all fields", "error");
        return;
      } else if (newPassword !== confirmPassword) {
        showNotification("Passwords do not match", "error");
        return;
      }

      let updateData = new FormData();
      updateData.append("email", email);
      updateData.append("newPass", newPassword);

      fetch("update_password.php", {
        method: "POST",
        body: updateData,
      })
        .then((response) => response.json())
        .then((data) => alert(data.message))
        .catch((error) => console.error("Error:", error));

      // Password reset logic would go here (API call, etc.)
      // For demo, just show success message
      showSuccessMessage();
    });

    modalBody.appendChild(passwordResetForm);
  }

  // Function to show success message with animation
  function showSuccessMessage() {
    // Create success message
    const successMessage = document.createElement("div");
    successMessage.className = "success-message";
    successMessage.textContent = "Password changed successfully!";
    document.body.appendChild(successMessage);

    setTimeout(function () {
      successMessage.classList.add("active");
    }, 100);

    setTimeout(function () {
      successMessage.classList.remove("active");

      setTimeout(function () {
        successMessage.remove();
        close_modal(modal);
        resetFormCompletely();
      }, 500);
    }, 3000);
  }

  // Function to show notification
  function showNotification(message, type) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((note) => note.remove());

    // Create notification
    const notification = document.createElement("div");
    notification.className =
      type === "error" ? "notification error" : "notification success";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function () {
      notification.classList.add("active");
    }, 100);

    setTimeout(function () {
      notification.classList.remove("active");

      setTimeout(function () {
        notification.remove();
      }, 500);
    }, 3000);
  }

  function resetForm() {
    emailInput.disabled = false;
    otpWrapper.style.display = "none";
    otpInput.value = "";
    verifyButton.style.display = "block";
    otpButton.style.display = "none";
    otpButton.textContent = "Send OTP";
    otpButton.classList.add("otp-button");

    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    const countdownElement = document.querySelector(".countdown");
    if (countdownElement) {
      countdownElement.textContent = "";
    }

    resetBtnContainer.innerHTML = "";
  }

  // Function to completely reset the form (when reopening modal)
  function resetFormCompletely() {
    resetForm();
    emailInput.value = "";
    otpValue = "";
    timeLeft = 60;

    // Remove password reset form if it exists
    const passwordResetForm = document.querySelector(".password-reset-form");
    if (passwordResetForm) {
      passwordResetForm.remove();
    }

    // Show the original form
    const formContainer = document.querySelector(".otp-input-wrapper");
    formContainer.style.display = "block";
  }

  // Event listeners
  otpButton.addEventListener("click", function () {
    if (otpButton.textContent === "Send OTP") {
      sendOTP();
    } else {
      verifyOTP();
    }
  });

  verifyButton.addEventListener("click", function () {
    sendOTP();
  });

  document.querySelectorAll("[data-close-button]").forEach((button) => {
    button.addEventListener("click", function () {
      const modal = button.closest(".forget-password-modal");
      resetFormCompletely();
    });
  });

  // Reset form when overlay is clicked (modal closed)
  overlay.addEventListener("click", function () {
    resetFormCompletely();
  });
});
