// Borrowing Page Javascript Controller

function initBorrowing() {
    const activeBorrowsBody = document.getElementById("active-borrows-body");
    const historyBorrowsBody = document.getElementById("history-borrows-body");
    const issueForm = document.getElementById("issue-book-form");
    const issueModalElement = document.getElementById("issue-book-modal");
    let issueModalObj = null;

    if (issueModalElement) {
        issueModalObj = new bootstrap.Modal(issueModalElement);
    }

    // Tab pane adjustments
    const tabEl = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabEl.forEach(tab => {
        tab.addEventListener('shown.bs.tab', (event) => {
            // Remove active style classes from other tabs and apply to this one
            tabEl.forEach(t => {
                t.classList.remove('text-primary-theme', 'border-bottom', 'border-brand', 'border-2');
                t.classList.add('text-secondary');
            });
            event.target.classList.add('text-primary-theme', 'border-bottom', 'border-brand', 'border-2');
            event.target.classList.remove('text-secondary');

            if (event.target.id === "borrow-history-tab") {
                loadHistoryTable();
            } else if (event.target.id === "active-borrows-tab") {
                loadActiveTable();
            }
        });
    });

    // 1. Load Active Borrows
    async function loadActiveTable() {
        try {
            const response = await fetch("/api/borrow/active");
            if (!response.ok) throw new Error("Failed to load active borrowings.");
            const data = await response.json();
            renderActiveTable(data);
        } catch (error) {
            showToast(error.message, "error");
        }
    }

    function renderActiveTable(records) {
        if (!activeBorrowsBody) return;

        if (records.length === 0) {
            activeBorrowsBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">No active borrowings found.</td>
                </tr>
            `;
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];

        activeBorrowsBody.innerHTML = records.map(br => {
            const isOverdue = br.dueDate < todayStr;
            const statusBadge = isOverdue ? 
                `<span class="badge badge-danger">Overdue</span>` : 
                `<span class="badge badge-success">Active</span>`;

            return `
                <tr id="borrow-row-${br.id}">
                    <td class="font-monospace">${br.id}</td>
                    <td class="fw-semibold">${br.student.name}</td>
                    <td>${br.book.title}</td>
                    <td>${br.issueDate}</td>
                    <td>${br.dueDate}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary btn-sm return-btn" data-id="${br.id}">
                                <i class="bi bi-journal-arrow-down"></i> Return
                            </button>
                            <button class="btn btn-secondary btn-sm renew-btn" data-id="${br.id}">
                                <i class="bi bi-arrow-repeat"></i> Renew
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        bindActiveActions();
    }

    // 2. Load Return History
    async function loadHistoryTable() {
        try {
            const response = await fetch("/api/history");
            if (!response.ok) throw new Error("Failed to load history.");
            const data = await response.json();
            
            // Filter completed borrows (returnDate is not null)
            const completed = data.filter(br => br.returnDate != null);
            renderHistoryTable(completed);
        } catch (error) {
            showToast(error.message, "error");
        }
    }

    function renderHistoryTable(records) {
        if (!historyBorrowsBody) return;

        if (records.length === 0) {
            historyBorrowsBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">No completed borrowing records found.</td>
                </tr>
            `;
            return;
        }

        historyBorrowsBody.innerHTML = records.map(br => {
            let fineHtml = `<span class="badge badge-success">No Fine</span>`;
            
            if (br.fine) {
                const amount = parseFloat(br.fine.amount).toFixed(2);
                if (br.fine.paymentStatus === "UNPAID") {
                    fineHtml = `
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge badge-danger">Unpaid: $${amount}</span>
                            <button class="btn btn-primary btn-sm py-0 px-2 pay-fine-btn" data-fine-id="${br.fine.id}">Pay</button>
                        </div>
                    `;
                } else {
                    fineHtml = `<span class="badge badge-success">Paid: $${amount}</span>`;
                }
            }

            return `
                <tr>
                    <td class="font-monospace">${br.id}</td>
                    <td class="fw-semibold">${br.student.name}</td>
                    <td>${br.book.title}</td>
                    <td>${br.issueDate}</td>
                    <td>${br.dueDate}</td>
                    <td>${br.returnDate}</td>
                    <td>${fineHtml}</td>
                </tr>
            `;
        }).join("");

        bindHistoryActions();
    }

    // 3. Issue Book Form Submission
    if (issueForm) {
        issueForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const studentId = document.getElementById("issue-student").value;
            const bookId = document.getElementById("issue-book").value;
            const borrowDays = parseInt(document.getElementById("issue-days").value);

            try {
                const response = await fetch("/api/borrow", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ studentId, bookId, borrowDays })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to issue book.");

                showToast("Book successfully issued!");
                issueForm.reset();
                if (issueModalObj) issueModalObj.hide();
                
                // Refresh list and update dropdown details
                loadActiveTable();
                refreshBookDropdown();
            } catch (error) {
                showToast(error.message, "error");
            }
        });
    }

    // Reload book details for dropdown dynamic values
    async function refreshBookDropdown() {
        const bookDropdown = document.getElementById("issue-book");
        if (!bookDropdown) return;

        try {
            const response = await fetch("/api/books");
            if (!response.ok) return;
            const books = await response.json();

            let html = `<option value="" disabled selected>Choose a book...</option>`;
            books.forEach(book => {
                const isDisabled = book.availableQuantity <= 0 ? "disabled" : "";
                html += `<option value="${book.id}" ${isDisabled}>
                    ${book.title} (Available: ${book.availableQuantity} / ${book.quantity})
                </option>`;
            });
            bookDropdown.innerHTML = html;
        } catch (error) {
            console.error("Error refreshing book dropdown", error);
        }
    }

    // 4. Bind return & renew buttons
    function bindActiveActions() {
        document.querySelectorAll(".return-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                
                try {
                    const response = await fetch("/api/return", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ borrowRecordId: id })
                    });

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || "Failed to process return.");

                    showToast("Book returned successfully!");
                    loadActiveTable();
                    refreshBookDropdown();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });

        document.querySelectorAll(".renew-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                
                try {
                    const response = await fetch("/api/borrow/renew", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ borrowRecordId: id, renewDays: 7 })
                    });

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || "Failed to renew borrow record.");

                    showToast("Borrow record renewed for 7 additional days!");
                    loadActiveTable();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });
    }

    // 5. Bind Fine payment button
    function bindHistoryActions() {
        document.querySelectorAll(".pay-fine-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const fineId = btn.getAttribute("data-fine-id");
                
                try {
                    const response = await fetch(`/api/borrow/pay-fine/${fineId}`, {
                        method: "POST"
                    });

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || "Failed to process fine payment.");

                    showToast("Fine paid successfully!");
                    loadHistoryTable();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });
    }

    // Trigger initial fine cell resolution for static load on history tab
    // Since we'll let client AJAX load tables, let's load active tables initially.
    loadActiveTable();
    
    // Resolve fine cells for static rows if they are present on page load
    (async () => {
        const rows = document.querySelectorAll("#history-borrows-body tr");
        if (rows.length > 0 && rows[0].id !== "no-history-row") {
            // If they are static rows, let's fetch history to resolve fine values
            try {
                const response = await fetch("/api/history");
                if (response.ok) {
                    const historyData = await response.json();
                    historyData.forEach(item => {
                        const cell = document.getElementById(`fine-cell-${item.id}`);
                        if (cell) {
                            let fineHtml = `<span class="badge badge-success">No Fine</span>`;
                            if (item.fine) {
                                const amount = parseFloat(item.fine.amount).toFixed(2);
                                if (item.fine.paymentStatus === "UNPAID") {
                                    fineHtml = `
                                        <div class="d-flex align-items-center gap-2">
                                            <span class="badge badge-danger">Unpaid: $${amount}</span>
                                            <button class="btn btn-primary btn-sm py-0 px-2 pay-fine-btn" data-fine-id="${item.fine.id}">Pay</button>
                                        </div>
                                    `;
                                } else {
                                    fineHtml = `<span class="badge badge-success">Paid: $${amount}</span>`;
                                }
                            }
                            cell.innerHTML = fineHtml;
                        }
                    });
                    bindHistoryActions();
                }
            } catch (e) {
                console.error("Static rows fine resolution failed", e);
            }
        }
    })();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBorrowing);
} else {
    initBorrowing();
}
