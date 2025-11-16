const API_BASE_URL = "http://195.26.245.5:9505/api";

function getAuthToken() {
  const body = JSON.parse(localStorage.getItem("body"));
  const token = body.token;
  return token;
}

function setAuthToken(body) {
  localStorage.setItem("body", JSON.stringify(body));
}

function removeAuthToken() {
  localStorage.removeItem("body");
}

function initializeAuth() {
  updateUserUI();
  loadCartCount();
}

function updateUserUI() {
  const body = JSON.parse(localStorage.getItem("body"));
  const userIcon = document.querySelector(".user-icon");
  const usernameText = document.querySelector(".username-text");
  const signupBtn = document.querySelector(".signup-btn");
  localStorage.removeItem("loggedInUser");

  if (body && userIcon && usernameText) {
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
    alert("Successfully logged out!");
    window.location.href = "index.html";
  }
}

function checkLogin() {
  const loggedInUser = JSON.parse(localStorage.getItem("body"));
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
    console.log(data);
    if (!response.ok) {
      return { success: false, message: data.message || "Login failed!" };
    }

    if (data) {
      setAuthToken(data.body);
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

async function updateProduct(productId) {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: "Please login first" };
    }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: productId,
        brand: document.getElementById("brand").value,
        model: document.getElementById("model").value,
        categoryId: parseInt(document.getElementById("category").value),
        description: document.getElementById("description").value,
        price: parseFloat(document.getElementById("price").value),
        imageUrl: document.getElementById("imageURL").value,
      }),
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



// async function fetchMyProducts() {
//   try {
//     const token = getAuthToken();
//     if (!token) {
//       return [];
//     }

//     const response = await fetch(`${API_BASE_URL}/products/myProducts`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     const tbody = document.getElementById("productTableBody");

//     if (!checkLogin()) return;

//     tbody.innerHTML =
//       '<tr><td colspan="8" style="text-align:center; padding:40px;">Loading...</td></tr>';

//       const products = await fetchMyProducts();

//       tbody.innerHTML = "";

//       if (products.length === 0) {
//         tbody.innerHTML = `
//     <tr>
//       <td colspan="8" class="empty-state">
//         <i class="fas fa-box-open"></i>
//         <h3>No products yet</h3>
//         <p>Create your first product to get started!</p>
//       </td>
//     </tr>
//   `;
//         return;
//       }

//       for (const product of products) {
//         const productRating = product.rating || 0;

//         const row = document.createElement("tr");
//         row.setAttribute("data-product-id", product.id);

//         row.innerHTML = `
//     <td>${product.id}</td>
//     <td>${product.brand}</td>
//     <td>${product.model}</td>
//     <td>${product.category ? product.category.name : "N/A"}</td>
//     <td>
//       <img src="${
//         product.imageUrl || "https://via.placeholder.com/120x80"
//       }"
//            alt="${product.brand}"
//            class="product-image"
//            onerror="this.src='https://via.placeholder.com/120x80/e8f4f8/333333?text=No+Image'">
//     </td>
//     <td>$${product.price.toFixed(2)}</td>
//     <td>${
//       productRating > 0 ? productRating.toFixed(1) + "/5" : "No rating"
//     }</td>
//     <td>
//       <div class="actions">
//         <button class="btn-edit" onclick="editProduct(${
//           product.id
//         })">Edit</button>
//         <button class="btn-delete" onclick="deleteProductById(${
//           product.id
//         }, '${product.brand} ${product.model}')">Delete</button>
//       </div>
//     </td>
//   `;
//         tbody.appendChild(row);
//       }

//       console.error("Failed to load products:", error);
//       tbody.innerHTML = `
//   <tr>
//     <td colspan="8" style="text-align:center; padding:40px; color:#e74c3c;">
//       <i class="fas fa-exclamation-triangle"></i>
//       <p>Failed to load products. Please try again.</p>
//     </td>
//   </tr>
// `;

//     if (!response.ok) throw new Error("Failed to fetch my products");

//     return await response.json();
//   } catch (error) {
//     console.error("Fetch my products error:", error);
//     return [];
//   }
// }

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
    const response = await fetch(`${API_BASE_URL}/categories`);

    if (!response.ok) throw new Error("Failed to fetch categories");

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Fetch categories error:", error);
    return [];
  }
}

async function fetchClientDetails() {
  try {
    const token = getAuthToken();
    if (!token) {
      console.error("No authentication token found");
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/clients/get-details`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    const userCard = document.getElementById("userCard");
    if (userCard) {
      userCard.innerHTML = `
        <h1>User Details</h1>
        <div class="detail-row">
          <span class="label">Name:</span>
          <span class="value">${data.name || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Surname:</span>
          <span class="value">${data.surname || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Email:</span>
          <span class="value">${data.email || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Username:</span>
          <span class="value">${data.username || "N/A"}</span>
        </div>
      `;
    }

    return data;
  } catch (error) {
    console.error("Fetch client details error:", error);
    return null;
  }
}

function loadUsername() {
  const bodyData = localStorage.getItem("body");
  if (bodyData) {
    try {
      const body = JSON.parse(bodyData);
      const usernameElement = document.querySelector(".username-text");
      if (usernameElement && body.username) {
        usernameElement.innerHTML = body.username;
      }
    } catch (error) {
      console.error("Error parsing localStorage data:", error);
    }
  }
}



function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideIn 0.3s ease reverse";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

document.querySelector(".search-bar").addEventListener("input", function (e) {
  const searchTerm = e.target.value.toLowerCase();
  const rows = document.querySelectorAll("#productTableBody tr");

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? "" : "none";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  initializeAuth();
  loadUsername();
  fetchClientDetails();
  // loadProducts();
});
