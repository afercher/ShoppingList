const host = 'http://localhost:8000';

let allDepartments = {};
let selectedArticles = [];

// Load all articles from the backend and initialize the UI
async function loadArticles() {
    const response = await fetch(host + '/api/articles');

    if (!response.ok) {
        console.error('Failed to load articles');
        return;
    }

    allDepartments = await response.json();

    renderSelectedArticles();
    renderAvailableArticles();
}

// Render the list of selected articles with a remove button for each
function renderSelectedArticles() {
    const selectedDiv = document.getElementById('selectedArticles');
    selectedDiv.innerHTML = '';

    if (selectedArticles.length === 0) {
        const emptyText = document.createElement('p');
        emptyText.textContent = 'No articles selected yet.';
        selectedDiv.appendChild(emptyText);
        return;
    }

    selectedArticles.forEach(article => {
        const row = document.createElement('div');
        row.classList.add('selected-article-row');

        const articleName = document.createElement('span');
        articleName.textContent = article.article_name;
        articleName.classList.add('selected-article-name');

        const removeButton = document.createElement('button');
        removeButton.textContent = '🗑️';
        removeButton.classList.add('remove-button');
        removeButton.addEventListener('click', () => {
            removeArticle(article.article_id);
        });

        row.appendChild(articleName);
        row.appendChild(removeButton);
        selectedDiv.appendChild(row);
    });
}

// Render available articles grouped by department, excluding already selected ones
function renderAvailableArticles() {
    const div = document.getElementById('articles');
    div.innerHTML = '';

    for (const departmentName in allDepartments) {
        const availableArticles = allDepartments[departmentName].filter(article => {
            return !selectedArticles.some(selected => selected.article_id === article.article_id);
        });

        // Wenn in einer Kategorie nichts mehr übrig ist, gar nicht anzeigen
        if (availableArticles.length === 0) {
            continue;
        }

        const departmentTitle = document.createElement('h3');
        departmentTitle.textContent = departmentName;
        departmentTitle.classList.add('department-title');
        div.appendChild(departmentTitle);

        availableArticles.forEach(article => {
            const articleButton = document.createElement('button');
            articleButton.textContent = article.article_name;
            articleButton.classList.add('article-button');

            articleButton.addEventListener('click', () => {
                addArticle(article);
            });

            div.appendChild(articleButton);
        });
    }
}

// Add an article to the selected list and update the UI
function addArticle(article) {
    const alreadySelected = selectedArticles.some(selected => selected.article_id === article.article_id);

    if (alreadySelected) {
        return;
    }

    selectedArticles.push(article);

    renderSelectedArticles();
    renderAvailableArticles();
}

// Remove an article from the selected list and update the UI
function removeArticle(articleId) {
    selectedArticles = selectedArticles.filter(article => article.article_id !== articleId);

    renderSelectedArticles();
    renderAvailableArticles();
}

// Create a new shopping list with the selected articles
async function createList() {
    const listName = document.getElementById('listName').value.trim();

    if (!listName) {
        alert('Please enter a list name.');
        return;
    }

    const shoppingList = {
        name: listName,
        articles: selectedArticles.map(article => article.article_id)
    };

    // Send the shopping list to the backend
    const response = await fetch(host + '/api/lists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(shoppingList)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create list:', errorText);
        alert('Failed to create list');
        return;
    }

    // redirect to list overview page
    window.location.href = '/index.html';
}

loadArticles();