const apiBaseUrl = 'http://localhost:8000';

// Manage form state for article creation.
const state = {
    departments: []
};

// Cache frequently used DOM elements.
const elements = {
    articleName: document.getElementById('articleName'),
    departmentSelect: document.getElementById('departmentSelect'),
    addDepartmentButton: document.getElementById('addDepartmentButton'),
    addDepartmentForm: document.getElementById('addDepartmentForm'),
    newDepartmentName: document.getElementById('newDepartmentName'),
    submitDepartmentButton: document.getElementById('submitDepartmentButton'),
    cancelDepartmentButton: document.getElementById('cancelDepartmentButton'),
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

// Show the add department form and hide the add button.
function showAddDepartmentForm() {
    elements.addDepartmentForm.classList.remove('hidden');
    elements.addDepartmentButton.style.display = 'none';
    elements.newDepartmentName.focus();
}

// Hide the add department form and show the add button.
function hideAddDepartmentForm() {
    elements.addDepartmentForm.classList.add('hidden');
    elements.addDepartmentButton.style.display = 'inline-block';
    elements.newDepartmentName.value = '';
}

// Submit the new department to the backend.
async function handleCreateDepartment() {
    const name = elements.newDepartmentName.value.trim();

    if (!name) {
        showFeedback('Please enter a department name.', true);
        return;
    }

    try {
        const result = await requestJson(`${apiBaseUrl}/api/departments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name
            })
        });

        // Add the new department to the state and rerender the dropdown.
        state.departments.push({
            id: result.id,
            name: result.name
        });

        renderDepartmentSelect();

        // Select the new department automatically.
        elements.departmentSelect.value = result.id;

        hideAddDepartmentForm();
        showFeedback('Department created successfully!');

        // Clear feedback after 2 seconds.
        setTimeout(() => {
            showFeedback('');
        }, 2000);
    } catch (error) {
        showFeedback(error.message || 'Failed to create the department.', true);
    }
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

    // Department management buttons.
    if (!elements.addDepartmentButton) {
        console.warn('Add department button not found in the DOM. Skipping event registration.');
    } else {
        elements.addDepartmentButton.addEventListener('click', (event) => {
            event.preventDefault();
            showAddDepartmentForm();
        });
    }

    if (!elements.submitDepartmentButton) {
        console.warn('Submit department button not found in the DOM. Skipping event registration.');
    } else {
        elements.submitDepartmentButton.addEventListener('click', async (event) => {
            event.preventDefault();
            await handleCreateDepartment();
        });
    }

    if (!elements.cancelDepartmentButton) {
        console.warn('Cancel department button not found in the DOM. Skipping event registration.');
    } else {
        elements.cancelDepartmentButton.addEventListener('click', (event) => {
            event.preventDefault();
            hideAddDepartmentForm();
        });
    }

    try {
        await loadDepartments();
    } catch (error) {
        showFeedback(error.message || 'Failed to load departments.', true);
    }
}

init();
