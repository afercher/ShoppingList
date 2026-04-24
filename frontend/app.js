const apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:8000`;

// Keep the page state in one place so rendering stays predictable.
const state = {
    lists: [],
    selectedListId: null,
    selectedListName: '',
    selectedListItems: []
};

// Cache frequently used DOM elements once after the script loads.
const elements = {
    createListButton: document.getElementById('createListButton'),
    createArticleButton: document.getElementById('createArticleButton'),
    goShoppingButton: document.getElementById('goShoppingButton'),
    generatePdfButton: document.getElementById('generatePdfButton'),
    feedback: document.getElementById('feedback'),
    lists: document.getElementById('lists'),
    detailTitle: document.getElementById('detailTitle'),
    items: document.getElementById('items')
};

// Show success or error feedback without duplicating DOM logic everywhere.
function showFeedback(message, isError = false) {
    elements.feedback.textContent = message;
    elements.feedback.classList.toggle('error', isError);
}

// Wrap fetch so every request shares the same JSON/error handling.
async function requestJson(url, options = {}) {
    let response;
    try {
        response = await fetch(url, options);
    } catch (error) {
        const message = String(error.message || '');
        const isNetworkError = message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('ERR_CONNECTION_REFUSED');

        if (isNetworkError) {
            throw new Error('Cannot connect to backend. Please start backend and try again.');
        }

        throw error;
    }

    if (!response.ok) {
        const rawMessage = await response.text();
        const isHtmlError = rawMessage && rawMessage.toLowerCase().includes('<html');

        if (isHtmlError || response.status >= 500) {
            throw new Error('Backend error. Please check if the backend is running.');
        }

        throw new Error(rawMessage || `Request failed (${response.status})`);
    }

    return response.json();
}

function createMessage(text) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
}

// Load the available shopping lists from the backend.
async function loadLists() {
    state.lists = await requestJson(`${apiBaseUrl}/api/lists`);
    renderLists();
}

// Render the left column with open and delete actions for each list.
function renderLists() {
    elements.lists.innerHTML = '';

    if (!state.lists.length) {
        elements.lists.appendChild(createMessage('No lists found yet.'));
        resetDetailPanel();
        return;
    }

    state.lists.forEach((list) => {
        const row = document.createElement('div');
        row.className = 'list-row';

        const openButton = document.createElement('button');
        openButton.className = 'list-button';
        openButton.textContent = list.name;
        openButton.addEventListener('click', () => selectList(list.id, list.name));

        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => openEditListPage(list.id));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => handleDeleteList(list.id));

        row.appendChild(openButton);
        row.appendChild(editButton);
        row.appendChild(deleteButton);
        elements.lists.appendChild(row);
    });
}

// Update the detail panel when a list is selected.
async function selectList(listId, listName) {
    state.selectedListId = listId;
    state.selectedListName = listName;
    elements.detailTitle.textContent = `List: ${listName}`;
    showFeedback('');
    await loadItems();

    if (elements.generatePdfButton) {
        elements.generatePdfButton.classList.remove('hidden');
    }

    if (elements.goShoppingButton) {
        elements.goShoppingButton.classList.remove('hidden');
    }
}

// Return the detail area to its empty state when no list is active.
function resetDetailPanel() {
    state.selectedListId = null;
    state.selectedListName = '';
    state.selectedListItems = [];
    elements.detailTitle.textContent = 'Select a list';
    elements.items.innerHTML = '';

    if (elements.generatePdfButton) {
        elements.generatePdfButton.classList.add('hidden');
    }

    if (elements.goShoppingButton) {
        elements.goShoppingButton.classList.add('hidden');
    }
}

function groupItemsByDepartment(items) {
    return items.reduce((groups, item) => {
        const departmentName = item.department_name || 'Uncategorized';

        if (!groups[departmentName]) {
            groups[departmentName] = [];
        }

        groups[departmentName].push(item);
        return groups;
    }, {});
}

function renderGroupedItems(items) {
    elements.items.innerHTML = '';

    if (!items.length) {
        elements.items.appendChild(createMessage('No items in this list yet.'));
        return;
    }

    const groupedItems = groupItemsByDepartment(items);

    Object.entries(groupedItems).forEach(([departmentName, departmentItems]) => {
        const departmentTitle = document.createElement('h3');
        departmentTitle.className = 'department-title';
        departmentTitle.textContent = departmentName;
        elements.items.appendChild(departmentTitle);

        departmentItems.forEach((item) => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.textContent = item.quantity > 1 ? `${item.name} (x${item.quantity})` : item.name;
            elements.items.appendChild(row);
        });
    });
}

// Load and render the items that belong to the currently selected list.
async function loadItems() {
    if (!state.selectedListId) {
        return;
    }

    state.selectedListItems = await requestJson(`${apiBaseUrl}/api/lists/${state.selectedListId}/items`);
    renderGroupedItems(state.selectedListItems);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function generateListPdf() {
    if (!state.selectedListId) {
        showFeedback('Please select a list first.', true);
        return;
    }

    const groupedItems = groupItemsByDepartment(state.selectedListItems);
    const categorySections = Object.entries(groupedItems)
        .map(([departmentName, departmentItems]) => {
            const rows = departmentItems
                .map((item) => `<li>${escapeHtml(item.name)}${item.quantity > 1 ? ` (x${escapeHtml(item.quantity)})` : ''}</li>`)
                .join('');

            return `<h2>${escapeHtml(departmentName)}</h2><ul>${rows}</ul>`;
        })
        .join('');

    const content = categorySections || '<p>No items in this list yet.</p>';
    const popup = window.open('', '_blank');

    if (!popup) {
        showFeedback('Popup blocked. Please allow popups to generate the PDF.', true);
        return;
    }

    popup.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(state.selectedListName || 'Shopping List')}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 24px; }
        h1 { margin-bottom: 6px; }
        h2 { margin-top: 18px; margin-bottom: 6px; }
        ul { margin-top: 0; }
        li { margin: 4px 0; }
    </style>
</head>
<body>
    <h1>${escapeHtml(state.selectedListName || 'Shopping List')}</h1>
    ${content}
</body>
</html>
`);

    popup.document.close();
    popup.focus();
    popup.print();
}

// Delete a list and reset the detail panel if it was open.
async function handleDeleteList(listId) {
    await requestJson(`${apiBaseUrl}/api/lists/${listId}`, { method: 'DELETE' });
    showFeedback('List deleted.');

    if (state.selectedListId === listId) {
        resetDetailPanel();
    }

    await loadLists();
}

function openCreateListPage() {
    window.location.href = 'pages/create/list/index.html';
}

// Navigate to the edit list page.
function openEditListPage(listId) {
    window.location.href = `pages/edit/list/index.html?id=${listId}`;
}


// Navigate to the article creation page.
function openCreateArticlePage() {
    window.location.href = 'pages/create/article/index.html';
}

// Navigate to the shopping page to mark items as done.
function openShoppingPage() {
    if (state.selectedListId) {
        window.location.href = `pages/shopping/index.html?id=${state.selectedListId}`;
    }
}

// Wire up DOM events and load the initial data for the page.
async function init() {
    // Verify elements exist before registering event listeners.
    if (!elements.createListButton) {
        console.warn('Create list button not found in the DOM. Skipping event registration.');
    } else {
        elements.createListButton.addEventListener('click', openCreateListPage);
    }

    if (!elements.createArticleButton) {
        console.warn('Create article button not found in the DOM. Skipping event registration.');
    } else {
        elements.createArticleButton.addEventListener('click', openCreateArticlePage);
    }

    if (!elements.generatePdfButton) {
        console.warn('Generate PDF button not found in the DOM. Skipping event registration.');
    } else {
        elements.generatePdfButton.addEventListener('click', generateListPdf);
    }

    if (!elements.goShoppingButton) {
        console.warn('Go shopping button not found in the DOM. Skipping event registration.');
    } else {
        elements.goShoppingButton.addEventListener('click', openShoppingPage);
    }

    try {
        await loadLists();
    } catch (error) {
        showFeedback(error.message || 'Failed to load data.', true);
    }
}

init();
