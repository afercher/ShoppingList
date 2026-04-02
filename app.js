const host = 'http://localhost:8000';

// Load all shopping lists and display them
async function loadLists() {
    const response = await fetch(host+'/api/shoppingLists');
    const lists = await response.json();

    const ul = document.getElementById('lists');
    ul.innerHTML = '';

    lists.forEach(list => {
        const button = document.createElement('button');
        button.innerText = list.name;
        ul.appendChild(button);
    });
}

// Redirect to the create list page when the "Create List" button is clicked
async function createList() {
    // direct to create list page
    window.location.href = 'pages/create/list/index.html';
}

loadLists();