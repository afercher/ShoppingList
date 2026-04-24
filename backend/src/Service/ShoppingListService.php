<?php

namespace App\Service;

use Doctrine\DBAL\Connection;

class ShoppingListService
{
    public function __construct(private Connection $connection) {}

    // Return the stored shopping lists with the fields needed by the frontend.
    public function getAllLists(): array
    {
        return $this->connection->fetchAllAssociative(
            "SELECT id, name FROM shopping_list"
        );
    }

    // Create the list row first and return its database ID.
    private function createList(string $name): int
    {
        $this->connection->insert('shopping_list', [
            'name' => $name
        ]);

        return $this->connection->lastInsertId();
    }

    // Link one article to the shopping list in the join table.
    private function addArticleToList(int $listId, int $articleId): void{

        $this->connection->insert('shopping_list_article', ['shopping_list_id' => $listId, 'article_id' => $articleId]);
    }

    // Create the list and attach the selected articles in one workflow.
    public function createNewList(string $name, array $articles): void{
        $id = $this->createList($name);

        foreach ($articles as $articleId) {
            $this->addArticleToList($id, (int) $articleId);
        }
    }
}
