<?php

namespace App\Service;

use Doctrine\DBAL\Connection;

class ShoppingListService
{
    public function __construct(private Connection $connection) {}

    // Get all shopping lists with their id and name
    public function getAllLists(): array
    {
        return $this->connection->fetchAllAssociative(
            "SELECT id, name FROM shopping_list"
        );
    }

    // Get all items of a shopping list grouped by department
    public function getItemsByList(int $listId): array
    {
        $sql = "
            SELECT
                a.name AS article,
                d.name AS department
            FROM shopping_list sl
            JOIN shopping_list_article sla ON sl.id = sla.shopping_list_id
            JOIN article a ON sla.article_id = a.id
            JOIN department d ON a.department_id = d.department_id
            WHERE sl.id = ?
        ";

        $rows = $this->connection->fetchAllAssociative($sql, [$listId]);

        // group items
        $departments = [];

        foreach ($rows as $row) {
            $departments[$row['department']][] = $row['article'];
        }

        return $departments;
    }

    // Create a new shopping list and return its id
    private function createList(string $name): int
    {
        $this->connection->insert('shopping_list', [
            'name' => $name
        ]);

        return $this->connection->lastInsertId();
    }

    // Add an article to a shopping list
    private function addArticleToList(int $listId, int $articleId): void{

        $this->connection->insert('shopping_list_article', ['shopping_list_id' => $listId, 'article_id' => $articleId]);
    }

    public function createNewList(string $name, array $articles): void{
        $id = $this->createList($name);

        foreach ($articles as $articleId) {
            $this->addArticleToList($id, (int) $articleId);
        }
    }
}
