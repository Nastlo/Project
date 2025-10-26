function initializeAuth() {
  updateUserUI();
  loadCartCount();
}

function updateUserUI() {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const userIcon = document.querySelector(".user-icon");
  const usernameText = document.querySelector(".username-text");
  const signupBtn = document.querySelector(".signup-btn");

  if (loggedInUser && userIcon) {
    usernameText.textContent = loggedInUser.username;
    userIcon.href = "account.html";
    userIcon.style.display = "flex";

    if (signupBtn) {
      signupBtn.textContent = "Log Out";
      signupBtn.onclick = logoutUser;
    }
  } else {
    if (userIcon) {
      userIcon.style.display = "none";
    }
    if (signupBtn) {
      signupBtn.textContent = "Log In";
      signupBtn.onclick = () => (window.location.href = "Login.html");
    }
  }
}

function logoutUser() {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("cart");
    alert("Successfully logged out!");
    window.location.href = "index.html";
  }
}

function checkLogin() {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
    alert("Please log in first!");
    window.location.href = "Login.html";
    return false;
  }
  return true;
}

function addToCartUI(productId, productName, price, imageUrl) {
  if (!checkLogin()) return;

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: productName,
      price: parseFloat(price),
      quantity: 1,
      imageUrl: imageUrl || "https://via.placeholder.com/100",
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  loadCartCount();
  alert(`${productName} added to cart!`);
}

function loadCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartBtn = document.querySelector(".cart-btn");

  if (cartBtn) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
      cartBtn.textContent = `🛒 (${totalItems})`;
    } else {
      cartBtn.textContent = "🛒";
    }
    cartBtn.onclick = () => {
      if (checkLogin()) {
        window.location.href = "cart.html";
      }
    };
  }
}

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function updateCart(updatedCart) {
  localStorage.setItem("cart", JSON.stringify(updatedCart));
  loadCartCount();
}

function clearCart() {
  localStorage.removeItem("cart");
  loadCartCount();
}

function registerUser(name, surname, email, username, password) {
  const users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.find((u) => u.email === email)) {
    return { success: false, message: "This email is already registered!" };
  }

  if (users.find((u) => u.username === username)) {
    return { success: false, message: "This username is already taken!" };
  }

  const newUser = {
    id: Date.now(),
    name,
    surname,
    email,
    username,
    password,
  };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  return { success: true, message: "Registration successful!" };
}

function loginUser(username, password) {
  const users = JSON.parse(localStorage.getItem("users")) || [];

  const user = users.find(
    (u) =>
      (u.username === username || u.email === username) &&
      u.password === password
  );

  if (user) {
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    localStorage.setItem("loggedInUser", JSON.stringify(userWithoutPassword));
    return { success: true, message: "Login successful!" };
  }

  return { success: false, message: "Username or password is incorrect!" };
}

document.addEventListener("DOMContentLoaded", initializeAuth);
