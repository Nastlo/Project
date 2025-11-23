let page = 0;
let size = 10;
let totalPages = 0;

let prevBtn = document.getElementById('prev-btn');
let nextBtn = document.getElementById('next-btn');
let pageInfo = document.getElementById('page-info');
let sizeSelect = document.getElementById('size-select');

// Token kontrolü - auth.js-dən istifadə edirik
const token = getAuthToken();
if (!token) {
    alert('Please login first!');
    window.location.href = 'Login.html';
}

// API_BASE_URL artıq auth.js-də təyin olunub, ona görə yenidən təyin etmirik
let categoryMap = {};

async function fetchCategoriesForProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        categoryMap = {};
        data.forEach(category => {
            categoryMap[category.id] = category.name;
        });
        console.log('Categories loaded:', categoryMap);
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function fetchProducts() {
    let tableBody = document.getElementById('productTableBody');
    
    console.log(`Fetching products: page=${page}, size=${size}`);
    console.log('Token:', token ? 'Token exists' : 'Token missing');
    
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align:center; padding:40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #007bff;"></i>
                <p style="margin-top: 10px;">Loading products...</p>
            </td>
        </tr>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/products/myProducts?page=${page}&size=${size}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Session expired. Please login again.');
                removeAuthToken();
                window.location.href = 'Login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Products data:', data);

        tableBody.innerHTML = '';

        if (!data.content || data.content.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>No products yet</h3>
                        <p>Create your first product to get started!</p>
                    </td>
                </tr>
            `;
            totalPages = 1;
            pageInfo.textContent = `Page 1 of 1`;
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        data.content.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.brand || 'N/A'}</td>
                <td>${product.model || 'N/A'}</td>
                <td>${categoryMap[product.categoryId] || 'N/A'}</td>
                <td>
                    <img src="${product.imageUrl || 'https://via.placeholder.com/100'}" 
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/100/e8f4f8/333333?text=No+Image'">
                </td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>${product.averageRating ? product.averageRating.toFixed(1) + '/5' : 'No rating'}</td>
                <td>
                    <div class="actions">
                        <button type="button" class="btn-edit" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button type="button" class="btn-delete" onclick="deleteProductById(${product.id}, '${(product.brand || '') + ' ' + (product.model || '')}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });

        totalPages = data.totalPages || 1;
        pageInfo.textContent = `Page ${page + 1} of ${totalPages}`;

        prevBtn.disabled = (page === 0);
        nextBtn.disabled = (page + 1 >= totalPages);

    } catch (error) {
        console.error('Error loading products:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:40px; color:#e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 10px;"></i>
                    <p>Failed to load products: ${error.message}</p>
                    <p style="margin-top: 10px; font-size: 12px;">Please check your connection and try again.</p>
                </td>
            </tr>
        `;
    }
}

prevBtn.addEventListener('click', () => {
    if (page > 0) {
        page--;
        fetchProducts();
    }
});

nextBtn.addEventListener('click', () => {
    if (page + 1 < totalPages) {
        page++;
        fetchProducts();
    }
});

// Saved page size yüklənməsi
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
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, initializing...');
    await fetchCategoriesForProducts();
    await fetchProducts();
});

function editProduct(productId) {
    window.location.href = `Createproduct.html?id=${productId}`;
}

async function deleteProductById(productId, productName) {
    if (confirm(`Are you sure you want to delete ${productName}?`)) {
        const result = await deleteProduct(productId);

        if (result.success) {
            showNotification("Product deleted successfully!");
            
            // Əgər səhifədə başqa məhsul yoxdursa və cari səhifə 0-dan böyükdürsə
            const currentPageProducts = document.querySelectorAll('#productTableBody tr').length;
            if (currentPageProducts === 1 && page > 0) {
                page--;
            }
            
            await fetchProducts();
        } else {
            alert(result.message || "Failed to delete product");
        }
    }
}

async function deleteProduct(productId) {
    try {
        if (!token) {
            return { success: false, message: "Please login first" };
        }

        const response = await fetch(`${API_BASE_URL}/products/delete/${productId}`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { 
                success: false, 
                message: errorData.message || "Failed to delete product" 
            };
        }

        return { success: true };
    } catch (error) {
        console.error("Delete product error:", error);
        return { success: false, message: "Network error" };
    }
}

function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}