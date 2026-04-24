const apiBaseUrl = 'http://localhost:8000';

// Keep the page state in one place so rendering stays predictable.
const state = {
    lists: [],
    selectedListId: null,
    articlesByDepartment: {}
};

// Cache frequently used DOM elements once after the script loads.
const elements = {
    createListButton: document.getElementById('createListButton'),
    feedback: document.getElementById('feedback'),
    lists: document.getElementById('lists'),
    detailTitle: document.getElementById('detailTitle'),
    addItemForm: document.getElementById('addItemForm'),
    articleSelect: document.getElementById('articleSelect'),
    quantityInput: document.getElementById('quantityInput'),
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

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => handleDeleteList(list.id));

        row.appendChild(openButton);
        row.appendChild(deleteButton);
        elements.lists.appendChild(row);
    });
}

// Load article choices for the add-item form.
async function loadArticles() {
    state.articlesByDepartment = await requestJson(`${apiBaseUrl}/api/articles`);
    renderArticleSelect();
}

// Group article options by department to match the backend response shape.
function renderArticleSelect() {
    elements.articleSelect.innerHTML = '';

    Object.entries(state.articlesByDepartment).forEach(([department, articles]) => {
        const group = document.createElement('optgroup');
        group.label = department;

        articles.forEach((article) => {
            const option = document.createElement('option');
            option.value = article.article_id;
            option.textContent = article.article_name;
            group.appendChild(option);
        });

        elements.articleSelect.appendChild(group);
    });
}

// Update the detail panel when a list is selected.
async function selectList(listId, listName) {
    state.selectedListId = listId;
    elements.detailTitle.textContent = `List: ${listName}`;
    elements.addItemForm.classList.remove('hidden');
    showFeedback('');
    await loadItems();
}

// Return the detail area to its empty state when no list is active.
function resetDetailPanel() {
    state.selectedListId = null;
    elements.detailTitle.textContent = 'Select a list';
    elements.addItemForm.classList.add('hidden');
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

// Submit a new item for the selected list.
async function handleAddItem(event) {
    event.preventDefault();

    if (!state.selectedListId) {
        showFeedback('Please select a list first.', true);
        return;
    }

    const articleId = Number(elements.articleSelect.value);
    const quantity = Number(elements.quantityInput.value);

    if (!articleId || quantity < 1) {
        showFeedback('Please provide valid values.', true);
        return;
    }

    await requestJson(`${apiBaseUrl}/api/lists/${state.selectedListId}/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ article_id: articleId, quantity })
    });

    elements.quantityInput.value = '1';
    showFeedback('Item added.');
    await loadItems();
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

// Wire up DOM events and load the initial data for the page.
async function init() {
    elements.createListButton.addEventListener('click', openCreateListPage);
    elements.addItemForm.addEventListener('submit', async (event) => {
        try {
            await handleAddItem(event);
        } catch (error) {
            showFeedback(error.message || 'Failed to add item.', true);
        }
    });

    try {
        await Promise.all([loadLists(), loadArticles()]);
    } catch (error) {
        showFeedback(error.message || 'Failed to load data.', true);
    }
}

init();
