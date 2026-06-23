// Global Library Management UI Helper

function initApp() {
    // 1. Initialize Theme (Classic OS Blue vs DEC Amber OS)
    const currentTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeToggleIcon(currentTheme);

    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            let theme = document.documentElement.getAttribute("data-theme");
            let newTheme = theme === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            updateThemeToggleIcon(newTheme);
        });
    }

    // 2. Mobile Sidebar Explorer toggle
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const sidebar = document.getElementById("sidebar");
    
    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("show");
        });

        // Click outside to close sidebar on mobile
        document.addEventListener("click", (e) => {
            if (sidebar.classList.contains("show") && !sidebar.contains(e.target) && e.target !== hamburgerBtn) {
                sidebar.classList.remove("show");
            }
        });
    }

    // 3. Setup toast container
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        toastContainer.style.position = "fixed";
        toastContainer.style.bottom = "20px";
        toastContainer.style.right = "20px";
        toastContainer.style.zIndex = "9999";
        toastContainer.style.display = "flex";
        toastContainer.style.flexDirection = "column";
        toastContainer.style.gap = "10px";
        document.body.appendChild(toastContainer);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

// Update theme toggle icon representation
function updateThemeToggleIcon(theme) {
    const icon = document.querySelector("#theme-toggle-btn i");
    if (icon) {
        if (theme === "dark") {
            icon.className = "bi bi-sun-fill";
        } else {
            icon.className = "bi bi-moon-stars-fill";
        }
    }
}

// Global Toast dialog popups helper
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `custom-toast ${type}`;
    
    const iconClass = type === "success" ? "bi bi-check-circle-fill text-success" : "bi bi-exclamation-triangle-fill text-danger";
    
    toast.innerHTML = `
        <i class="${iconClass}"></i>
        <div class="message" style="font-weight: bold;">${message}</div>
    `;

    container.appendChild(toast);

    // Auto-dismiss dialog after 4 seconds
    setTimeout(() => {
        toast.classList.add("slide-out");
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 4000);
}
