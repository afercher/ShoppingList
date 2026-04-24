<?php

namespace App\Controller\Api;

use Doctrine\DBAL\Connection;
use App\Service\ShoppingListService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;

class ShoppingListApiController extends AbstractController
{
    // Support both required routes (/lists) and existing frontend routes (/api/lists).
    #[Route('/lists', methods: ['GET'])]
    #[Route('/api/shoppingLists', methods: ['GET'])]
    #[Route('/api/lists', methods: ['GET'])]
    public function getShoppingLists(ShoppingListService $service): JsonResponse{
        return $this->json($service->getAllLists());
    }

    #[Route('/lists', methods: ['POST'])]
    #[Route('/api/lists', methods: ['POST'])]
    public function createList(Request $request, ShoppingListService $service): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Reject malformed payloads before creating a list.
        if (!$data || !isset($data['name'])) {
            return $this->json([
                'error' => 'Invalid request body'
            ], 400);
        }

        $name = $data['name'];
        $articles = $data['articles'] ?? [];

        $id = $service->createNewList($name, $articles);

        return $this->json([
            'id' => $id,
            'name' => $name,
            'articles' => $articles
        ], 201);
    }

    #[Route('/lists/{id}/item', methods: ['POST'])]
    #[Route('/lists/{id}/items', methods: ['POST'])]
    #[Route('/api/lists/{id}/item', methods: ['POST'])]
    #[Route('/api/lists/{id}/items', methods: ['POST'])]
    public function addItem(int $id, Request $request, Connection $connection): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data || !isset($data['article_id'])) {
            return $this->json(['error' => 'Invalid request body. Required field: article_id'], 400);
        }

        $articleId = (int) $data['article_id'];
        $quantity = max(1, (int) ($data['quantity'] ?? 1));

        $existing = $connection->fetchAssociative(
            'SELECT id, quantity FROM shopping_list_article WHERE shopping_list_id = ? AND article_id = ?',
            [$id, $articleId]
        );

        if ($existing) {
            $connection->update(
                'shopping_list_article',
                ['quantity' => ((int) $existing['quantity']) + $quantity],
                ['id' => (int) $existing['id'], 'shopping_list_id' => $id]
            );
        } else {
            $connection->insert('shopping_list_article', [
                'shopping_list_id' => $id,
                'article_id' => $articleId,
                'quantity' => $quantity
            ]);
        }

        // Requirement: return the updated shopping list after adding an item.
        return $this->json($this->fetchListWithItems($connection, $id));
    }

    #[Route('/lists/{id}/items', methods: ['GET'])]
    #[Route('/api/lists/{id}/items', methods: ['GET'])]
    public function getItems(int $id, Connection $connection): JsonResponse
    {
        // Return items with article_id so we can edit the list properly.
        $sql = "
        SELECT
            sla.id as item_id,
            sla.article_id,
            a.name,
            sla.quantity,
            d.name as department_name
        FROM shopping_list_article sla
        JOIN article a ON sla.article_id = a.id
        JOIN department d ON a.department_id = d.department_id
        WHERE sla.shopping_list_id = ?
        ORDER BY d.name ASC, a.name ASC
    ";

        $items = $connection->fetchAllAssociative($sql, [$id]);

        return $this->json($items);
    }

    #[Route('/lists/{id}/items/{itemId}', methods: ['GET'])]
    #[Route('/api/lists/{id}/items/{itemId}', methods: ['GET'])]
    public function getItem(int $id, int $itemId, Connection $connection): JsonResponse
    {
        $item = $connection->fetchAssociative(
            "
                SELECT
                    sla.id AS item_id,
                    sla.shopping_list_id,
                    sla.article_id,
                    a.name,
                    sla.quantity,
                    d.name AS department_name
                FROM shopping_list_article sla
                JOIN article a ON sla.article_id = a.id
                JOIN department d ON a.department_id = d.department_id
                WHERE sla.id = ? AND sla.shopping_list_id = ?
            ",
            [$itemId, $id]
        );

        if (!$item) {
            return $this->json(['error' => 'Item not found'], 404);
        }

        return $this->json($item);
    }

    #[Route('/lists/{id}/items/{itemId}', methods: ['PUT'])]
    #[Route('/api/lists/{id}/items/{itemId}', methods: ['PUT'])]
    public function updateItem(int $id, int $itemId, Request $request, Connection $connection): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data || !isset($data['quantity'])) {
            return $this->json(['error' => 'Invalid request body. Required field: quantity'], 400);
        }

        $quantity = $data['quantity'];

        $connection->update(
            'shopping_list_article',
            ['quantity' => $quantity],
            ['id' => $itemId, 'shopping_list_id' => $id]
        );

        return $this->json(['message' => 'Updated']);
    }

    // Update a shopping list by replacing its articles.
    #[Route('/lists/{id}', methods: ['PUT'])]
    #[Route('/api/lists/{id}', methods: ['PUT'])]
    public function updateList(int $id, Request $request, ShoppingListService $service): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Validate input.
        if (!$data || !isset($data['name'], $data['articles'])) {
            return $this->json([
                'error' => 'Invalid request body. Required fields: name, articles'
            ], 400);
        }

        $name = $data['name'];
        $articles = $data['articles'];

        $service->updateList($id, $name, $articles);

        return $this->json([
            'message' => 'List updated',
            'id' => $id,
            'name' => $name,
            'articles' => $articles
        ], 200);
    }

    #[Route('/lists/{id}', methods: ['DELETE'])]
    #[Route('/api/lists/{id}', methods: ['DELETE'])]
    public function deleteList(int $id, Connection $connection): JsonResponse
    {
        // Delete dependent rows first to avoid orphaned join-table entries.
        $connection->delete('shopping_list_article', [
            'shopping_list_id' => $id
        ]);

        $connection->delete('shopping_list', [
            'id' => $id
        ]);

        return $this->json(['message' => 'List deleted']);
    }

    #[Route('/lists/{id}/items/{itemId}', methods: ['DELETE'])]
    #[Route('/api/lists/{id}/items/{itemId}', methods: ['DELETE'])]
    public function deleteItem(int $id, int $itemId, Connection $connection): JsonResponse
    {
        $connection->delete('shopping_list_article', [
            'id' => $itemId,
            'shopping_list_id' => $id
        ]);

        return $this->json(['message' => 'Item deleted']);
    }

    private function fetchListWithItems(Connection $connection, int $listId): array
    {
        $list = $connection->fetchAssociative('SELECT id, name FROM shopping_list WHERE id = ?', [$listId]);

        if (!$list) {
            return ['id' => $listId, 'name' => null, 'items' => []];
        }

        $items = $connection->fetchAllAssociative(
            "
                SELECT
                    sla.id AS item_id,
                    sla.article_id,
                    a.name,
                    sla.quantity,
                    d.name AS department_name
                FROM shopping_list_article sla
                JOIN article a ON sla.article_id = a.id
                JOIN department d ON a.department_id = d.department_id
                WHERE sla.shopping_list_id = ?
                ORDER BY d.name ASC, a.name ASC
            ",
            [$listId]
        );

        return [
            'id' => (int) $list['id'],
            'name' => $list['name'],
            'items' => $items
        ];
    }

}
