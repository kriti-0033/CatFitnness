class DarkModeSync {
  constructor() {
    this.toggles = this.getToggles();

    if (document.readyState === "complete") {
      this.init();
    } else {
      document.addEventListener("DOMContentLoaded", () => this.init());
    }
  }

  getToggles() {
    const toggles = [
      document.getElementById("dark-mode-toggle"),
      document.getElementById("settings-darkmode-toggle"),
    ];

    return toggles.filter((toggle) => {
      if (!toggle) {
        return false;
      }
      return true;
    });
  }

  init() {
    this.isDark = this.loadDarkModeState();
    document.documentElement.classList.toggle("dark-mode", this.isDark);

    this.updateToggles();

    this.toggles.forEach((toggle) => {
      toggle.removeEventListener("change", this.handleToggle);
      toggle.addEventListener("change", (e) => this.handleToggle(e));
    });

    // console.log("Initialization completed, current mode:", this.isDark ? "Dark mode" : "Light mode");
  }

  loadDarkModeState() {
    try {
      return localStorage.getItem("darkMode") === "true";
    } catch (e) {
      console.error("Failed to read local storage:", e);
      return false;
    }
  }

  handleToggle = (e) => {
    if (this.isUpdating) return;
    this.isUpdating = true;

    this.isDark = e.target.checked;

    requestAnimationFrame(() => {
      this.updateToggles();
      this.saveDarkModeState();
      this.updateDarkModeClass();
      this.isUpdating = false;
    });
  };

  updateToggles() {
    this.toggles.forEach((toggle) => {
      if (toggle.checked !== this.isDark) {
        toggle.checked = this.isDark;
        console.log(`Sync ${toggle.id}: ${this.isDark}`);
      }
    });
  }

  saveDarkModeState() {
    try {
      localStorage.setItem("darkMode", this.isDark);
    } catch (e) {
      console.error("Failed to save to local storage:", e);
    }
  }

  updateDarkModeClass() {
    document.documentElement.classList.toggle("dark-mode", this.isDark);
    document.body.style.transition = "background-color 0.3s ease";
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('.setting-item[href="#"]').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('updateModal').style.display = 'block';
  });

  document.querySelectorAll('.close-modal, .cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('updateModal').style.display = 'none';
    });
  });

  document.getElementById('updateForm').addEventListener('submit', function (e) {
    e.preventDefault();
    console.log('Form data:', new FormData(this));
    alert('Changes saved!');
    document.getElementById('updateModal').style.display = 'none';
  });
});

if (!window.darkModeSyncInstance) {
  window.darkModeSyncInstance = new DarkModeSync();
}

class LogoutToggle {
  constructor() {
    this.logoutProfile = document.getElementById("logout-profile");
    this.logoutSettings = document.getElementById("logout-settings");
    this.logoutModal = document.getElementById("logout-modal");
    this.cancelLogoutBtn = document.getElementById("cancel-logout");
    this.confirmLogoutBtn = document.getElementById("confirm-logout");
    this.isSyncing = false;
    this.init();
  }

  init() {
    if (this.logoutProfile) {
      this.logoutProfile.addEventListener("click", () => this.showLogoutModal());
    }
    if (this.logoutSettings) {
      this.logoutSettings.addEventListener("click", () => this.showLogoutModal());
    }
    if (this.cancelLogoutBtn) {
      this.cancelLogoutBtn.addEventListener("click", () => this.hideLogoutModal());
    }
    if (this.confirmLogoutBtn) {
      this.confirmLogoutBtn.addEventListener("click", () => this.processLogout());
    }

    window.addEventListener("click", (event) => {
      if (event.target === this.logoutModal) {
        this.hideLogoutModal();
      }
    });
  }

  showLogoutModal() {
    if (this.logoutModal) {
      this.logoutModal.style.display = "flex";
    } else {
      console.error("Logout modal not found!");
    }
  }

  hideLogoutModal() {
    if (this.logoutModal) {
      this.logoutModal.style.display = "none";
    }
  }

  processLogout() {
    window.location.href = "logout.php";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new LogoutToggle();
});

document.addEventListener("DOMContentLoaded", () => {
  const avatarUpload = document.getElementById("avatar-upload");
  const profileImages = [
    document.getElementById("profile-pic"),
    document.querySelector(".profile-photo"),
  ];

  document.querySelector(".change-photo").addEventListener("click", () => {
    avatarUpload.click();
  });

  avatarUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      alert("Only image files are allowed");
      return;
    }

    // Validate file size before upload (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    // Preview the image
    const reader = new FileReader();
    reader.onload = (event) => {
      profileImages.forEach((img) => {
        if (img) img.src = event.target.result;
      });

      // Upload the file to the server
      uploadToServer(file);
    };
    reader.readAsDataURL(file);
  });

  async function uploadToServer(file) {
    try {
      const formData = new FormData();
      formData.append("profile_pic", file);

      // Add a check for the endpoint before making the request
      const uploadEndpoint = "update_profile_pic.php";
      console.log(`Attempting to upload to: ${uploadEndpoint}`);

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      // Check if the response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Try to parse the JSON response
      const result = await response.json();

      if (result.success) {
        alert("Profile picture updated successfully!");
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      // More detailed error message
      if (error.message.includes("404")) {
        alert("Upload failed: The upload handler (update_profile_pic.php) was not found on the server. Please contact the administrator.");
      } else {
        alert("Upload failed: " + (error.message || "Please try again."));
      }
    }
  }
});

// Profile Update Form Validation
document.addEventListener('DOMContentLoaded', function () {
  const updateInfoForm = document.getElementById('update-info-form');

  // Validation utility functions
  const validators = {
    username: function (value) {
      // Username must be 3-20 characters, alphanumeric and underscores
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      return {
        valid: usernameRegex.test(value),
        message: 'Username must be 3-20 characters long.'
      };
    },

    email: function (value) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        valid: emailRegex.test(value),
        message: 'Please enter a valid email address'
      };
    },

    password: function (value, confirmValue = '') {
      // If password is empty, it means no change is requested
      if (!value) return { valid: true, message: '' };

      // Validate password complexity
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      const isValid = passwordRegex.test(value);

      // Check if confirmation matches
      const confirmMatch = !confirmValue || value === confirmValue;

      return {
        valid: isValid && confirmMatch,
        message: !isValid
          ? 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character'
          : (!confirmMatch
            ? 'New passwords do not match'
            : '')
      };
    },

    weight: function (value) {
      // Weight between 20 and 300 kg
      const numValue = parseFloat(value);
      return {
        valid: !isNaN(numValue) && numValue >= 20 && numValue <= 300,
        message: 'Weight must be between 20 and 300 kg'
      };
    },

    height: function (value) {
      // Height between 50 and 250 cm
      const numValue = parseFloat(value);
      return {
        valid: !isNaN(numValue) && numValue >= 50 && numValue <= 250,
        message: 'Height must be between 50 and 250 cm'
      };
    },

    targetWeight: function (value, currentWeight) {
      const numValue = parseFloat(value);
      const currentWeightValue = parseFloat(currentWeight);

      return {
        valid: !isNaN(numValue) &&
          numValue >= 20 &&
          numValue <= 300 &&
          Math.abs(numValue - currentWeightValue) >= 1,
        message: 'Target weight must be different from current weight and between 20 and 300 kg'
      };
    }
  };

  // Display error message
  function showError(inputElement, message) {
    // Remove any existing error displays
    const existingError = inputElement.nextElementSibling;
    if (existingError && existingError.classList.contains('error-message')) {
      existingError.remove();
    }

    // Create and insert error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.color = 'red';
    errorElement.style.fontSize = '0.8rem';
    errorElement.style.marginTop = '5px';
    errorElement.textContent = message;

    inputElement.insertAdjacentElement('afterend', errorElement);
    inputElement.classList.add('invalid');
  }

  // Clear error message
  function clearError(inputElement) {
    const existingError = inputElement.nextElementSibling;
    if (existingError && existingError.classList.contains('error-message')) {
      existingError.remove();
    }
    inputElement.classList.remove('invalid');
  }

  // Validate form before submission
  function validateForm() {
    let isValid = true;

    // Validate username
    const usernameInput = document.getElementById('username');
    const usernameValidation = validators.username(usernameInput.value);
    if (!usernameValidation.valid) {
      showError(usernameInput, usernameValidation.message);
      isValid = false;
    } else {
      clearError(usernameInput);
    }

    // Validate email
    const emailInput = document.getElementById('email');
    const emailValidation = validators.email(emailInput.value);
    if (!emailValidation.valid) {
      showError(emailInput, emailValidation.message);
      isValid = false;
    } else {
      clearError(emailInput);
    }

    // Validate current password if new password is being set
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // If new password is being set
    if (newPasswordInput.value) {
      // Ensure current password is provided
      if (!currentPasswordInput.value) {
        showError(currentPasswordInput, 'Current password is required when changing password');
        isValid = false;
      } else {
        clearError(currentPasswordInput);
      }

      // Validate new password
      const passwordValidation = validators.password(
        newPasswordInput.value,
        confirmPasswordInput.value
      );

      if (!passwordValidation.valid) {
        showError(newPasswordInput, passwordValidation.message);
        isValid = false;
      } else {
        clearError(newPasswordInput);
        clearError(confirmPasswordInput);
      }
    }

    // Validate weight
    const weightInput = document.getElementById('weight');
    const weightValidation = validators.weight(weightInput.value);
    if (!weightValidation.valid) {
      showError(weightInput, weightValidation.message);
      isValid = false;
    } else {
      clearError(weightInput);
    }

    // Validate height
    const heightInput = document.getElementById('height');
    const heightValidation = validators.height(heightInput.value);
    if (!heightValidation.valid) {
      showError(heightInput, heightValidation.message);
      isValid = false;
    } else {
      clearError(heightInput);
    }

    // Validate target weight
    const targetWeightInput = document.getElementById('target_weight');
    const targetWeightValidation = validators.targetWeight(
      targetWeightInput.value,
      weightInput.value
    );
    if (!targetWeightValidation.valid) {
      showError(targetWeightInput, targetWeightValidation.message);
      isValid = false;
    } else {
      clearError(targetWeightInput);
    }

    return isValid;
  }

  // Add real-time validation to inputs
  function addRealTimeValidation(inputElement, validatorFn, additionalParam = null) {
    inputElement.addEventListener('input', function () {
      const validation = additionalParam
        ? validatorFn(this.value, additionalParam)
        : validatorFn(this.value);

      if (!validation.valid) {
        showError(this, validation.message);
      } else {
        clearError(this);
      }
    });
  }

  // Apply real-time validation
  addRealTimeValidation(document.getElementById('username'), validators.username);
  addRealTimeValidation(document.getElementById('email'), validators.email);

  // Password validation with confirmation
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');

  newPasswordInput.addEventListener('input', function () {
    const validation = validators.password(
      newPasswordInput.value,
      confirmPasswordInput.value
    );

    if (!validation.valid) {
      showError(newPasswordInput, validation.message);
    } else {
      clearError(newPasswordInput);
      clearError(confirmPasswordInput);
    }
  });

  confirmPasswordInput.addEventListener('input', function () {
    const validation = validators.password(
      newPasswordInput.value,
      confirmPasswordInput.value
    );

    if (!validation.valid) {
      showError(confirmPasswordInput, validation.message);
    } else {
      clearError(newPasswordInput);
      clearError(confirmPasswordInput);
    }
  });

  addRealTimeValidation(document.getElementById('weight'), validators.weight);
  addRealTimeValidation(document.getElementById('height'), validators.height);

  // Target weight validation with current weight context
  const targetWeightInput = document.getElementById('target_weight');
  const weightInput = document.getElementById('weight');

  targetWeightInput.addEventListener('input', function () {
    const validation = validators.targetWeight(
      targetWeightInput.value,
      weightInput.value
    );

    if (!validation.valid) {
      showError(targetWeightInput, validation.message);
    } else {
      clearError(targetWeightInput);
    }
  });

  // Prevent form submission if validation fails
  updateInfoForm.addEventListener('submit', function (e) {
    if (!validateForm()) {
      e.preventDefault();
    }
  });
});