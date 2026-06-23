// Books Page Javascript Controller

function initBooks() {
    const searchInput = document.getElementById("book-search-input");
    const categoryFilter = document.getElementById("book-category-filter");
    const booksTableBody = document.getElementById("books-table-body");

    // Add Book Form
    const addBookForm = document.getElementById("add-book-form");
    const addBookModalElement = document.getElementById("add-book-modal");
    let addBookModalObj = null;
    if (addBookModalElement) {
        addBookModalObj = new bootstrap.Modal(addBookModalElement);
    }

    // Edit Book Form
    const editBookForm = document.getElementById("edit-book-form");
    const editBookModalElement = document.getElementById("edit-book-modal");
    let editBookModalObj = null;
    if (editBookModalElement) {
        editBookModalObj = new bootstrap.Modal(editBookModalElement);
    }

    // 1. Search and Filtering Event Listeners
    if (searchInput) {
        searchInput.addEventListener("input", debounce(() => filterBooks(), 300));
    }
    if (categoryFilter) {
        categoryFilter.addEventListener("change", () => filterBooks());
    }

    // 2. Fetch and Filter Books via API
    async function filterBooks() {
        const query = searchInput ? searchInput.value.trim() : "";
        const category = categoryFilter ? categoryFilter.value : "";
        
        let url = `/api/books`;
        if (query) {
            url += `?search=${encodeURIComponent(query)}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to search books.");
            let books = await response.json();

            // Client-side category filtering
            if (category) {
                books = books.filter(b => b.category.toLowerCase() === category.toLowerCase());
            }

            renderBooksTable(books);
        } catch (error) {
            showToast(error.message, "error");
        }
    }

    // Render table rows dynamically
    function renderBooksTable(books) {
        if (!booksTableBody) return;
        
        // Check user permission (hasActions check by checking header column existence)
        const hasActions = document.querySelector("#books-table th:last-child").textContent.trim() === "Actions";

        if (books.length === 0) {
            booksTableBody.innerHTML = `
                <tr>
                    <td colspan="${hasActions ? 8 : 7}" class="text-center text-muted py-4">No books matched your criteria.</td>
                </tr>
            `;
            return;
        }

        booksTableBody.innerHTML = books.map(book => {
            let actionsHtml = "";
            if (hasActions) {
                actionsHtml = `
                    <td>
                        <div class="d-flex gap-2">
                            <button class="btn btn-secondary btn-sm p-1 px-2 edit-book-btn" data-id="${book.id}" title="Edit book">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn btn-secondary btn-sm p-1 px-2 text-danger delete-book-btn" data-id="${book.id}" title="Delete book">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </td>
                `;
            }

            return `
                <tr id="book-row-${book.id}">
                    <td class="font-monospace">${book.isbn}</td>
                    <td class="fw-semibold text-primary-theme">${book.title}</td>
                    <td>${book.author}</td>
                    <td>${book.publisher}</td>
                    <td><span class="badge badge-brand">${book.category}</span></td>
                    <td>${book.quantity}</td>
                    <td>
                        <span class="badge ${book.availableQuantity > 0 ? 'badge-success' : 'badge-danger'}">
                            ${book.availableQuantity}
                        </span>
                    </td>
                    ${actionsHtml}
                </tr>
            `;
        }).join("");

        bindActionButtons();
    }

    // 3. Create Book
    if (addBookForm) {
        addBookForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const isbn = document.getElementById("add-isbn").value.trim();
            const title = document.getElementById("add-title").value.trim();
            const author = document.getElementById("add-author").value.trim();
            const publisher = document.getElementById("add-publisher").value.trim();
            const category = document.getElementById("add-category").value.trim();
            const quantity = parseInt(document.getElementById("add-quantity").value);

            try {
                const response = await fetch("/api/books", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isbn, title, author, publisher, category, quantity })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to create book.");

                showToast("Book successfully added!");
                addBookForm.reset();
                if (addBookModalObj) addBookModalObj.hide();
                filterBooks(); // reload table
            } catch (error) {
                showToast(error.message, "error");
            }
        });
    }

    // 4. Edit Book (Load data & Update)
    function bindActionButtons() {
        document.querySelectorAll(".edit-book-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                try {
                    const response = await fetch(`/api/books/${id}`);
                    if (!response.ok) throw new Error("Failed to load book data.");
                    const book = await response.json();

                    document.getElementById("edit-book-id").value = book.id;
                    document.getElementById("edit-isbn").value = book.isbn;
                    document.getElementById("edit-title").value = book.title;
                    document.getElementById("edit-author").value = book.author;
                    document.getElementById("edit-publisher").value = book.publisher;
                    document.getElementById("edit-category").value = book.category;
                    document.getElementById("edit-quantity").value = book.quantity;

                    if (editBookModalObj) editBookModalObj.show();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });

        document.querySelectorAll(".delete-book-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                if (confirm("Are you sure you want to delete this book? This action cannot be undone.")) {
                    try {
                        const response = await fetch(`/api/books/${id}`, { method: "DELETE" });
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.error || "Failed to delete book.");

                        showToast("Book deleted successfully!");
                        filterBooks();
                    } catch (error) {
                        showToast(error.message, "error");
                    }
                }
            });
        });
    }

    if (editBookForm) {
        editBookForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const id = document.getElementById("edit-book-id").value;
            const isbn = document.getElementById("edit-isbn").value.trim();
            const title = document.getElementById("edit-title").value.trim();
            const author = document.getElementById("edit-author").value.trim();
            const publisher = document.getElementById("edit-publisher").value.trim();
            const category = document.getElementById("edit-category").value.trim();
            const quantity = parseInt(document.getElementById("edit-quantity").value);

            try {
                const response = await fetch(`/api/books/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isbn, title, author, publisher, category, quantity })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to update book.");

                showToast("Book updated successfully!");
                if (editBookModalObj) editBookModalObj.hide();
                filterBooks();
            } catch (error) {
                showToast(error.message, "error");
            }
        });
    }

    // Debounce function for search typing lag mitigation
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initial binding on static rendering
    bindActionButtons();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBooks);
} else {
    initBooks();
}
