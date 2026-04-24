const apiBaseUrl = 'http://localhost:8000';

// Keep the page state in one place so rendering stays predictable.
const state = {
    lists: [],
    selectedListId: null
};

// Cache frequently used DOM elements once after the script loads.
const elements = {
    createListButton: document.getElementById('createListButton'),
    createArticleButton: document.getElementById('createArticleButton'),
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
    const response = await fetch(url, options);

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Request failed');
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
    elements.detailTitle.textContent = `List: ${listName}`;
    showFeedback('');
    await loadItems();
}

// Return the detail area to its empty state when no list is active.
function resetDetailPanel() {
    state.selectedListId = null;
    elements.detailTitle.textContent = 'Select a list';
    elements.items.innerHTML = '';
}

// Load and render the items that belong to the currently selected list.
async function loadItems() {
    if (!state.selectedListId) {
        return;
    }

    const items = await requestJson(`${apiBaseUrl}/api/lists/${state.selectedListId}/items`);
    elements.items.innerHTML = '';

    if (!items.length) {
        elements.items.appendChild(createMessage('No items in this list yet.'));
        return;
    }

    items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.textContent = item.name;
        elements.items.appendChild(row);
    });
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

    try {
        await loadLists();
    } catch (error) {
        showFeedback(error.message || 'Failed to load data.', true);
    }
}

init();
