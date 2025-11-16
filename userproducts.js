let page = 0;
let size = 10;
let totalPages = 0;

let prevBtn = document.getElementById('prev-btn');
let nextBtn = document.getElementById('next-btn');
let pageInfo = document.getElementById('page-info');
let sizeSelect = document.getElementById('size-select');

let data = JSON.parse(localStorage.getItem('body'));
const token = data.token;

let categoryMap = {};

async function fetchCategories() {
    const response = await fetch('http://195.26.245.5:9505/api/categories');
    const data = await response.json();
    categoryMap = {};
    data.forEach(category => {
        categoryMap[category.id] = category.name;
    });
    console.log(categoryMap);
}

function fetchProducts() {
    let tableBody = document.getElementById('productTableBody');
    fetch(`http://195.26.245.5:9505/api/products/myProducts?page=${page}&size=${size}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            return response.json()
        })
        .then(data => {
            console.log(data);

            tableBody.innerHTML = '';

            data.content.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.id}</td>
                    <td>${product.brand}</td>
                    <td>${product.model}</td>
                    <td>${categoryMap[product.categoryId]}</td>
                    <td>
                        <img src="${product.imageUrl}" style="width: 100px; height:100px;">
                    </td>
                    <td>${product.price} AZN</td>
                    <td>${product.averageRating}/5</td>
                    <td>
                        <button type="button" class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                        <button type="button" class="delete-btn" onclick="deleteProductById(${product.id}>Delete</button>
                    </td>

                `;

                tableBody.appendChild(row);

            });

            totalPages = data.totalPages;
            pageInfo.textContent = `${page + 1} / ${totalPages}`;

            if (page == 0) {
                prevBtn.disabled = true;
            } else {
                prevBtn.disabled = false;
            }

            if (page + 1 >= totalPages) {
                nextBtn.disabled = true;
            } else {
                nextBtn.disabled = false;
            }

        })
}


prevBtn.addEventListener('click', () => {
    if (page > 0) {
        page--;
        fetchProducts()
    }
})

nextBtn.addEventListener('click', () => {
    if (page + 1 < totalPages) {
        page++;
        fetchProducts()
    }
})

const savedSize = localStorage.getItem('pageSize');
if (savedSize) {
    size = Number(savedSize);
    sizeSelect.value = savedSize;
}

sizeSelect.addEventListener('change', () => {
    size = Number(sizeSelect.value);
    localStorage.setItem('pageSize', size);
    page = 0;
    fetchProducts();
})


fetchCategories().then(fetchProducts);

async function editProduct(productId) {
    window.location.href = `Createproduct.html?id=${productId}`;
}

async function deleteProductById(productId, productName) {
  if (confirm(`Are you sure you want to delete ${productName}?`)) {
    const result = await deleteProduct(productId);

    if (result.success) {
      showNotification("Product deleted successfully!");
      // loadProducts();
    } else {
      alert(result.message || "Failed to delete product");
    }
  }
}


async function deleteProduct(productId) {
  try {
    // const token = getAuthToken();
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