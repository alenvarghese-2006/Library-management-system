// Students Page Javascript Controller

function initStudents() {
    const searchInput = document.getElementById("student-search-input");
    const studentsTableBody = document.getElementById("students-table-body");

    // Add Student Form
    const addStudentForm = document.getElementById("add-student-form");
    const addStudentModalElement = document.getElementById("add-student-modal");
    let addStudentModalObj = null;
    if (addStudentModalElement) {
        addStudentModalObj = new bootstrap.Modal(addStudentModalElement);
    }

    // Edit Student Form
    const editStudentForm = document.getElementById("edit-student-form");
    const editStudentModalElement = document.getElementById("edit-student-modal");
    let editStudentModalObj = null;
    if (editStudentModalElement) {
        editStudentModalObj = new bootstrap.Modal(editStudentModalElement);
    }

    // History Modal
    const historyModalElement = document.getElementById("history-modal");
    let historyModalObj = null;
    if (historyModalElement) {
        historyModalObj = new bootstrap.Modal(historyModalElement);
    }

    // 1. Search input event listener
    if (searchInput) {
        searchInput.addEventListener("input", debounce(() => filterStudents(), 300));
    }

    // 2. Fetch and Render Students
    async function filterStudents() {
        const query = searchInput ? searchInput.value.trim() : "";
        let url = `/api/students`;
        if (query) {
            url += `?search=${encodeURIComponent(query)}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to search students.");
            const students = await response.json();
            renderStudentsTable(students);
        } catch (error) {
            showToast(error.message, "error");
        }
    }

    function renderStudentsTable(students) {
        if (!studentsTableBody) return;

        if (students.length === 0) {
            studentsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">No students matched your search criteria.</td>
                </tr>
            `;
            return;
        }

        studentsTableBody.innerHTML = students.map(student => {
            return `
                <tr id="student-row-${student.id}">
                    <td class="font-monospace">${student.id}</td>
                    <td class="fw-semibold text-primary-theme">${student.name}</td>
                    <td>${student.email}</td>
                    <td>${student.phone}</td>
                    <td>${student.department}</td>
                    <td><span class="badge badge-info">${student.year}</span></td>
                    <td>
                        <div class="d-flex gap-2">
                            <button class="btn btn-secondary btn-sm p-1 px-2 view-history-btn" data-id="${student.id}" data-name="${student.name}" title="View Borrow History">
                                <i class="bi bi-clock-history"></i>
                            </button>
                            <button class="btn btn-secondary btn-sm p-1 px-2 edit-student-btn" data-id="${student.id}" title="Edit student">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn btn-secondary btn-sm p-1 px-2 text-danger delete-student-btn" data-id="${student.id}" title="Delete student">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        bindActionButtons();
    }

    // 3. Create Student
    if (addStudentForm) {
        addStudentForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("add-stud-name").value.trim();
            const email = document.getElementById("add-stud-email").value.trim();
            const phone = document.getElementById("add-stud-phone").value.trim();
            const department = document.getElementById("add-stud-dept").value.trim();
            const year = document.getElementById("add-stud-year").value;

            try {
                const response = await fetch("/api/students", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, phone, department, year })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to register student.");

                showToast("Student profile successfully created!");
                addStudentForm.reset();
                if (addStudentModalObj) addStudentModalObj.hide();
                filterStudents();
            } catch (error) {
                showToast(error.message, "error");
            }
        });
    }

    // 4. Bind Action Buttons (Edit, Delete, History Log)
    function bindActionButtons() {
        // Edit button triggers
        document.querySelectorAll(".edit-student-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                try {
                    const response = await fetch(`/api/students/${id}`);
                    if (!response.ok) throw new Error("Failed to load student profile.");
                    const student = await response.json();

                    document.getElementById("edit-student-id").value = student.id;
                    document.getElementById("edit-stud-name").value = student.name;
                    document.getElementById("edit-stud-email").value = student.email;
                    document.getElementById("edit-stud-phone").value = student.phone;
                    document.getElementById("edit-stud-dept").value = student.department;
                    document.getElementById("edit-stud-year").value = student.year;

                    if (editStudentModalObj) editStudentModalObj.show();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });

        // Delete button triggers
        document.querySelectorAll(".delete-student-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                if (confirm("Are you sure you want to delete this student profile?")) {
                    try {
                        const response = await fetch(`/api/students/${id}`, { method: "DELETE" });
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.error || "Failed to delete student profile.");

                        showToast("Student profile removed successfully.");
                        filterStudents();
                    } catch (error) {
                        showToast(error.message, "error");
                    }
                }
            });
        });

        // History Log modal loader
        document.querySelectorAll(".view-history-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                const name = btn.getAttribute("data-name");
                
                document.getElementById("history-student-name").textContent = name;
                const historyTableBody = document.getElementById("history-table-body");
                historyTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted py-3">Loading history data...</td>
                    </tr>
                `;

                if (historyModalObj) historyModalObj.show();

                try {
                    const response = await fetch(`/api/history/student/${id}`);
                    if (!response.ok) throw new Error("Failed to load borrowing logs.");
                    const history = await response.json();

                    if (history.length === 0) {
                        historyTableBody.innerHTML = `
                            <tr>
                                <td colspan="5" class="text-center text-muted py-3">This student has no borrowing logs.</td>
                            </tr>
                        `;
                        return;
                    }

                    historyTableBody.innerHTML = history.map(item => {
                        const returnedText = item.returnDate ? item.returnDate : `<span class="text-secondary">-</span>`;
                        
                        let fineText = `<span class="badge badge-success">None</span>`;
                        if (item.returnDate == null && item.dueDate < new Date().toISOString().split('T')[0]) {
                            fineText = `<span class="badge badge-danger">Uncalculated / Active Overdue</span>`;
                        }
                        
                        return `
                            <tr>
                                <td class="fw-semibold">${item.book.title}</td>
                                <td>${item.issueDate}</td>
                                <td>${item.dueDate}</td>
                                <td>${returnedText}</td>
                                <td>${fineText}</td>
                            </tr>
                        `;
                    }).join("");
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });
    }

    if (editStudentForm) {
        editStudentForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const id = document.getElementById("edit-student-id").value;
            const name = document.getElementById("edit-stud-name").value.trim();
            const email = document.getElementById("edit-stud-email").value.trim();
            const phone = document.getElementById("edit-stud-phone").value.trim();
            const department = document.getElementById("edit-stud-dept").value.trim();
            const year = document.getElementById("edit-stud-year").value;

            try {
                const response = await fetch(`/api/students/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, phone, department, year })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to update profile.");

                showToast("Student profile updated!");
                if (editStudentModalObj) editStudentModalObj.hide();
                filterStudents();
            } catch (error) {
                showToast(error.message, "error");
            }
        });
    }

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

    // Initial binding
    bindActionButtons();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStudents);
} else {
    initStudents();
}
