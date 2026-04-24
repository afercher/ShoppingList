const apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:8000`;

// Keep the article selection state in one object to simplify rendering.
const state = {
    listId: null,
    listName: '',
    articlesByDepartment: {},
    selectedArticles: [],
    isLoading: true
};

// Cache the page elements that are used multiple times.
const elements = {
    listNameInput: document.getElementById('listName'),
    submitListButton: document.getElementById('submitListButton'),
    createArticleButton: document.getElementById('createArticleButton'),
    backButton: document.getElementById('backButton'),
    feedback: document.getElementById('feedback'),
    selectedArticles: document.getElementById('selectedArticles'),
    articles: document.getElementById('articles')
};

function showFeedback(message, isError = false) {
    elements.feedback.textContent = message;
    elements.feedback.classList.toggle('error', isError);
}

// Reuse the same request handling pattern as the overview page.
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

// Extract list ID from URL parameters.
function getListIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load the list details and current items.
async function loadListData() {
    const listId = getListIdFromUrl();

    if (!listId) {
        showFeedback('Invalid list ID.', true);
        return;
    }

    state.listId = parseInt(listId);

    try {
        // Load the current items for this list
        const items = await requestJson(`${apiBaseUrl}/api/lists/${state.listId}/items`);

        // Convert items to article format for the UI
        state.selectedArticles = items.map(item => ({
            article_id: item.article_id,
            article_name: item.name
        }));

        // Also need to get the list name - we'll get it from the lists endpoint
        const lists = await requestJson(`${apiBaseUrl}/api/lists`);
        const currentList = lists.find(l => l.id === state.listId);
        if (currentList) {
            state.listName = currentList.name;
            elements.listNameInput.value = state.listName;
        }
    } catch (error) {
        showFeedback('Failed to load list data: ' + error.message, true);
    }
}

// Load all available articles from the backend before rendering the page.
async function loadArticles() {
    state.articlesByDepartment = await requestJson(`${apiBaseUrl}/api/articles`);
    renderSelectedArticles();
    renderAvailableArticles();
}

// Render the current selection so users can review and remove items.
function renderSelectedArticles() {
    elements.selectedArticles.innerHTML = '';

    if (!state.selectedArticles.length) {
        elements.selectedArticles.appendChild(createMessage('No articles selected yet.'));
        return;
    }

    state.selectedArticles.forEach((article) => {
        const row = document.createElement('div');
        row.classList.add('selected-article-row');

        const articleName = document.createElement('span');
        articleName.textContent = article.article_name;
        articleName.classList.add('selected-article-name');

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('remove-button');
        removeButton.addEventListener('click', () => removeArticle(article.article_id));

        row.appendChild(articleName);
        row.appendChild(removeButton);
        elements.selectedArticles.appendChild(row);
    });
}

// Only show articles that are not already part of the current selection.
function renderAvailableArticles() {
    elements.articles.innerHTML = '';

    Object.entries(state.articlesByDepartment).forEach(([departmentName, articles]) => {
        const availableArticles = articles.filter((article) => {
            return !state.selectedArticles.some((selectedArticle) => selectedArticle.article_id === article.article_id);
        });

        // Skip empty categories to keep the page compact.
        if (!availableArticles.length) {
            return;
        }

        const departmentTitle = document.createElement('h3');
        departmentTitle.textContent = departmentName;
        departmentTitle.classList.add('department-title');
        elements.articles.appendChild(departmentTitle);

        availableArticles.forEach((article) => {
            const articleButton = document.createElement('button');
            articleButton.textContent = article.article_name;
            articleButton.classList.add('article-button');
            articleButton.addEventListener('click', () => addArticle(article));
            elements.articles.appendChild(articleButton);
        });
    });
}

// Add an article once and immediately refresh both lists.
function addArticle(article) {
    const alreadySelected = state.selectedArticles.some((selectedArticle) => {
        return selectedArticle.article_id === article.article_id;
    });

    if (alreadySelected) {
        return;
    }

    state.selectedArticles.push(article);
    renderSelectedArticles();
    renderAvailableArticles();
}

// Remove the selected article and show it again in the available list.
function removeArticle(articleId) {
    state.selectedArticles = state.selectedArticles.filter((article) => article.article_id !== articleId);
    renderSelectedArticles();
    renderAvailableArticles();
}

// Submit the updated list name and selected article IDs to the backend.
async function handleUpdateList() {
    const listName = elements.listNameInput.value.trim();

    if (!listName) {
        showFeedback('Please enter a list name.', true);
        return;
    }

    const shoppingList = {
        name: listName,
        articles: state.selectedArticles.map((article) => article.article_id)
    };

    try {
        await requestJson(`${apiBaseUrl}/api/lists/${state.listId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shoppingList)
        });
    } catch (error) {
        showFeedback(error.message || 'Failed to update the list.', true);
        return;
    }

    showFeedback('List updated. Redirecting...');
    window.location.href = '../../../index.html';
}

function goBackToOverview() {
    window.location.href = '../../../index.html';
}

// Navigate to the article creation page and save current state.
function openCreateArticlePage() {
    // Save the current selected articles to localStorage so we can restore them when we come back.
    localStorage.setItem('selectedArticlesForList', JSON.stringify(state.selectedArticles));
    window.location.href = '../../create/article/index.html?returnTo=editList&listId=' + state.listId;
}

// Register the page events and load the initial article data.
async function init() {
    // Load list data first
    await loadListData();

    // Safely register event listeners only if the elements were found.
    if (!elements.submitListButton) {
        console.warn('Submit list button not found in the DOM. Skipping event registration.');
    } else {
        elements.submitListButton.addEventListener('click', async (event) => {
            event.preventDefault();
            await handleUpdateList();
        });
    }

    if (!elements.createArticleButton) {
        console.warn('Create article button not found in the DOM. Skipping event registration.');
    } else {
        elements.createArticleButton.addEventListener('click', (event) => {
            event.preventDefault();
            openCreateArticlePage();
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

    // Restore selected articles from localStorage if coming back from article creation.
    const savedArticles = localStorage.getItem('selectedArticlesForList');
    if (savedArticles) {
        state.selectedArticles = JSON.parse(savedArticles);
        localStorage.removeItem('selectedArticlesForList');
    }

    try {
        await loadArticles();
    } catch (error) {
        showFeedback(error.message || 'Failed to load the articles.', true);
    }
}

init();

