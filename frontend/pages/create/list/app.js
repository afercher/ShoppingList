const apiBaseUrl = 'http://localhost:8000';

// Keep the article selection state in one object to simplify rendering.
const state = {
    articlesByDepartment: {},
    selectedArticles: []
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

// Submit the new list name and the selected article IDs to the backend.
async function handleCreateList() {
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
        await requestJson(`${apiBaseUrl}/api/lists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shoppingList)
        });
    } catch (error) {
        showFeedback(error.message || 'Failed to create the list.', true);
        return;
    }

    showFeedback('List created. Redirecting...');
    window.location.href = '../../../index.html';
}

function goBackToOverview() {
    window.location.href = '../../../index.html';
}

// Navigate to the article creation page.
function openCreateArticlePage() {
    window.location.href = '../article/index.html';
}

// Register the page events and load the initial article data.
async function init() {
    // Safely register event listeners only if the elements were found.
    if (!elements.submitListButton) {
        console.warn('Submit list button not found in the DOM. Skipping event registration.');
    } else {
        elements.submitListButton.addEventListener('click', async (event) => {
            event.preventDefault();
            await handleCreateList();
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

    try {
        await loadArticles();
    } catch (error) {
        showFeedback(error.message || 'Failed to load the articles.', true);
    }
}

init();
