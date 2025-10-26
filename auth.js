const API_BASE_URL = 'http://195.26.245.5:9505/api';

function initializeAuth() {
  updateUserUI();
  loadCartCount();
}

function getAuthToken() {
  return localStorage.getItem('authToken');
}

function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

function removeAuthToken() {
  localStorage.removeItem('authToken');
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
    removeAuthToken();
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

async function registerUser(name, surname, email, username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        surname: surname,
        email: email,
        username: username,
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || "Registration failed!" };
    }

    return { success: true, message: "Registration successful!" };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, message: "Network error. Please try again." };
  }
}

async function loginUser(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || "Login failed!" };
    }

    if (data.token) {
      setAuthToken(data.token);
    }

    const userInfo = {
      id: data.id,
      name: data.name,
      surname: data.surname,
      email: data.email,
      username: data.username
    };
    
    localStorage.setItem('loggedInUser', JSON.stringify(userInfo));

    return { success: true, message: "Login successful!" };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: "Network error. Please try again." };
  }
}

document.addEventListener("DOMContentLoaded", initializeAuth);