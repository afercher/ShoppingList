const apiBaseUrl = 'http://localhost:8000';

// Manage form state for article creation.
const state = {
    departments: []
};

// Cache frequently used DOM elements.
const elements = {
    articleName: document.getElementById('articleName'),
    departmentSelect: document.getElementById('departmentSelect'),
    submitArticleButton: document.getElementById('submitArticleButton'),
    backButton: document.getElementById('backButton'),
    feedback: document.getElementById('feedback')
};

// Show success or error messages.
function showFeedback(message, isError = false) {
    elements.feedback.textContent = message;
    elements.feedback.classList.toggle('error', isError);
}

// Reuse the same request handling pattern as the main app.
async function requestJson(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Request failed');
    }

    return response.json();
}

// Load all departments from the backend.
async function loadDepartments() {
    state.departments = await requestJson(`${apiBaseUrl}/api/departments`);
    renderDepartmentSelect();
}

// Populate the department dropdown with all available options.
function renderDepartmentSelect() {
    elements.departmentSelect.innerHTML = '<option value="">-- Select a department --</option>';

    state.departments.forEach((dept) => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        elements.departmentSelect.appendChild(option);
    });
}

// Submit the new article to the backend.
async function handleCreateArticle() {
    const name = elements.articleName.value.trim();
    const departmentId = Number(elements.departmentSelect.value);

    if (!name) {
        showFeedback('Please enter an article name.', true);
        return;
    }

    if (!departmentId) {
        showFeedback('Please select a department.', true);
        return;
    }

    try {
        const result = await requestJson(`${apiBaseUrl}/api/articles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                department_id: departmentId
            })
        });

        showFeedback('Article created successfully. Redirecting...');
        setTimeout(() => {
            window.location.href = '../../../index.html';
        }, 1000);
    } catch (error) {
        showFeedback(error.message || 'Failed to create the article.', true);
    }
}

// Navigate back to the main page.
function goBackToOverview() {
    window.location.href = '../../../index.html';
}

// Register events and load initial data.
async function init() {
    // Safely register event listeners only if the elements were found.
    if (!elements.submitArticleButton) {
        console.warn('Submit article button not found in the DOM. Skipping event registration.');
    } else {
        elements.submitArticleButton.addEventListener('click', async (event) => {
            event.preventDefault();
            await handleCreateArticle();
        });
    }

    if (!elements.backButton) {
        console.warn('Back button not found in the DOM. Skipping event registration.');
    } else {
        elements.backButton.addEventListener('click', (event) => {
            event.preventDefault();
            goBackToOverview();
        });
    }

    try {
        await loadDepartments();
    } catch (error) {
        showFeedback(error.message || 'Failed to load departments.', true);
    }
}

init();

