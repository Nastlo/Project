const API_BASE_URL = "http://195.26.245.5:9505/api";

function getAuthToken() {
  return localStorage.getItem("authToken");
}

function setAuthToken(token) {
  localStorage.setItem("authToken", token);
}

function removeAuthToken() {
  localStorage.removeItem("authToken");
}

function initializeAuth() {
  updateUserUI();
  loadCartCount();
}

function updateUserUI() {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const userIcon = document.querySelector(".user-icon");
  const usernameText = document.querySelector(".username-text");
  const signupBtn = document.querySelector(".signup-btn");

  if (loggedInUser && userIcon && usernameText) {
    usernameText.textContent = loggedInUser.username || loggedInUser.name || "User";
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
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        surname: surname,
        email: email,
        username: username,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Registration failed!",
      };
    }

    return { success: true, message: "Registration successful!" };
  } catch (error) {
    console.error("Register error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
}

async function loginUser(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
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
      username: data.username,
    };

    localStorage.setItem("loggedInUser", JSON.stringify(userInfo));

    return { success: true, message: "Login successful!" };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
}

async function fetchProducts(filters = {}) {
  try {
    let url = `${API_BASE_URL}/products`;
    const params = new URLSearchParams();

    if (filters.category) params.append("category", filters.category);
    if (filters.minRating) params.append("minRating", filters.minRating);
    if (filters.search) params.append("search", filters.search);

    if (params.toString()) {
      url += `/filter?${params.toString()}`;
    }

    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) throw new Error("Failed to fetch products");

    return await response.json();
  } catch (error) {
    console.error("Fetch products error:", error);
    return [];
  }
}

async function fetchProductById(productId) {
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      headers: headers,
    });

    if (!response.ok) throw new Error("Product not found");

    return await response.json();
  } catch (error) {
    console.error("Fetch product error:", error);
    return null;
  }
}

async function createProduct(productData) {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: "Please login first" };
    }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        message: data.message || "Failed to create product",
      };
    }

    const data = await response.json();
    return { success: true, data: data };
  } catch (error) {
    console.error("Create product error:", error);
    return { success: false, message: "Network error" };
  }
}

async function updateProduct(productId, productData) {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: "Please login first" };
    }

    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        message: data.message || "Failed to update product",
      };
    }

    const data = await response.json();
    return { success: true, data: data };
  } catch (error) {
    console.error("Update product error:", error);
    return { success: false, message: "Network error" };
  }
}

async function deleteProduct(productId) {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: "Please login first" };
    }

    const response = await fetch(
      `${API_BASE_URL}/products/delete/${productId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return { success: false, message: "Failed to delete product" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete product error:", error);
    return { success: false, message: "Network error" };
  }
}

async function fetchMyProducts() {
  try {
    const token = getAuthToken();
    if (!token) {
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/products/myProducts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch my products");

    return await response.json();
  } catch (error) {
    console.error("Fetch my products error:", error);
    return [];
  }
}

async function submitProductRating(productId, rating) {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: "Please login first" };
    }

    const response = await fetch(`${API_BASE_URL}/ratings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId: productId,
        rating: rating,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        message: data.message || "Failed to submit rating",
      };
    }

    const data = await response.json();
    return { success: true, data: data };
  } catch (error) {
    console.error("Submit rating error:", error);
    return { success: false, message: "Network error" };
  }
}

async function fetchProductRatings(productId) {
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/ratings/${productId}`, {
      headers: headers,
    });

    if (!response.ok) throw new Error("Failed to fetch ratings");

    return await response.json();
  } catch (error) {
    console.error("Fetch ratings error:", error);
    return { averageRating: 0, totalRatings: 0 };
  }
}

async function fetchCategories() {
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: headers,
    });

    if (!response.ok) throw new Error("Failed to fetch categories");

    return await response.json();
  } catch (error) {
    console.error("Fetch categories error:", error);
    return [];
  }
}

async function fetchClientDetails() {
  try {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/clients/get-details`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error("Failed to fetch client details");

    return await response.json();
  } catch (error) {
    console.error("Fetch client details error:", error);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", initializeAuth);