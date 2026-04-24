const apiBaseUrl = 'http://localhost:8000';

// Keep the shopping state.
const state = {
    listId: null,
    listName: '',
    items: [],
    checkedItems: new Set()
};

// Cache frequently used DOM elements.
const elements = {
    listTitle: document.getElementById('listTitle'),
    feedback: document.getElementById('feedback'),
    items: document.getElementById('items'),
    finishButton: document.getElementById('finishButton'),
    backButton: document.getElementById('backButton')
};

// Show success or error feedback.
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

// Extract list ID from URL parameters.
function getListIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load the list details and items.
async function loadListData() {
    const listId = getListIdFromUrl();

    if (!listId) {
        showFeedback('Invalid list ID.', true);
        return;
    }

    state.listId = parseInt(listId);

    try {
        // Load items for this list
        state.items = await requestJson(`${apiBaseUrl}/api/lists/${state.listId}/items`);

        // Load list name
        const lists = await requestJson(`${apiBaseUrl}/api/lists`);
        const currentList = lists.find(l => l.id === state.listId);
        if (currentList) {
            state.listName = currentList.name;
            elements.listTitle.textContent = state.listName;
        }
    } catch (error) {
        showFeedback('Failed to load list data: ' + error.message, true);
    }
}

// Group items by department.
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

// Render items with checkboxes grouped by department.
function renderItems() {
    elements.items.innerHTML = '';

    if (!state.items.length) {
        elements.items.appendChild(document.createTextNode('No items in this list.'));
        return;
    }

    const groupedItems = groupItemsByDepartment(state.items);

    Object.entries(groupedItems).forEach(([departmentName, departmentItems]) => {
        const departmentTitle = document.createElement('h3');
        departmentTitle.className = 'department-title';
        departmentTitle.textContent = departmentName;
        elements.items.appendChild(departmentTitle);

        departmentItems.forEach((item) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.padding = '10px';
            row.style.background = '#white';
            row.style.borderRadius = '6px';
            row.style.marginBottom = '8px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `item-${item.item_id}`;
            checkbox.checked = state.checkedItems.has(item.item_id);
            checkbox.style.marginRight = '10px';
            checkbox.style.width = '18px';
            checkbox.style.height = '18px';
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    state.checkedItems.add(item.item_id);
                } else {
                    state.checkedItems.delete(item.item_id);
                }
            });

            const label = document.createElement('label');
            label.htmlFor = `item-${item.item_id}`;
            label.textContent = item.name + (item.quantity > 1 ? ` (x${item.quantity})` : '');
            label.style.cursor = 'pointer';
            label.style.flex = '1';

            row.appendChild(checkbox);
            row.appendChild(label);
            elements.items.appendChild(row);
        });
    });
}

// Delete specific items from the list.
async function deleteItems(itemIds) {
    for (const itemId of itemIds) {
        await requestJson(`${apiBaseUrl}/api/lists/${state.listId}/items/${itemId}`, {
            method: 'DELETE'
        });
    }
}

// Delete the entire list.
async function deleteList() {
    await requestJson(`${apiBaseUrl}/api/lists/${state.listId}`, {
        method: 'DELETE'
    });
}

// Handle finish shopping.
async function handleFinish() {
    const checkedItemIds = Array.from(state.checkedItems);
    const allItemIds = state.items.map(item => item.item_id);

    try {
        if (checkedItemIds.length === allItemIds.length) {
            // All items checked - delete entire list
            showFeedback('Deleting completed list...');
            await deleteList();
            showFeedback('List completed and deleted!');
        } else if (checkedItemIds.length > 0) {
            // Some items checked - delete only those
            showFeedback('Removing purchased items...');
            await deleteItems(checkedItemIds);
            showFeedback('Purchased items removed!');
        } else {
            // No items checked
            showFeedback('Please check at least one item.');
            return;
        }

        setTimeout(() => {
            window.location.href = '../../../index.html';
        }, 1000);
    } catch (error) {
        showFeedback(error.message || 'Failed to finish shopping.', true);
    }
}

// Go back to main page.
function goBack() {
    window.location.href = '../../../index.html';
}

// Register events and load initial data.
async function init() {
    if (!elements.finishButton) {
        console.warn('Finish button not found in the DOM. Skipping event registration.');
    } else {
        elements.finishButton.addEventListener('click', handleFinish);
    }

    if (!elements.backButton) {
        console.warn('Back button not found in the DOM. Skipping event registration.');
    } else {
        elements.backButton.addEventListener('click', goBack);
    }

    try {
        await loadListData();
        renderItems();
    } catch (error) {
        showFeedback(error.message || 'Failed to load data.', true);
    }
}

init();

