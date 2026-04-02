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

    #[Route('/api/shoppingLists', methods: ['GET'])]
    public function getShoppingLists(ShoppingListService $service): JsonResponse{
        return $this->json($service->getAllLists());
    }

    #[Route('/api/lists', methods: ['POST'])]
    public function createList(Request $request, ShoppingListService $service): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data || !isset($data['name'])) {
            return $this->json([
                'error' => 'Invalid request body'
            ], 400);
        }

        $name = $data['name'];
        $articles = $data['articles'] ?? [];

        $service->createNewList($name, $articles);

        return $this->json([
            'name' => $name,
            'articles' => $articles
        ], 201);
    }

    #[Route('/api/lists/{id}/items', methods: ['POST'])]
    public function addItem(int $id, Request $request, Connection $connection): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $articleId = $data['article_id'];
        $quantity = $data['quantity'] ?? 1;

        $connection->insert('shopping_list_article', [
            'shopping_list_id' => $id,
            'article_id' => $articleId,
            'quantity' => $quantity
        ]);

        return $this->json([
            'message' => 'Item hinzugefügt'
        ]);
    }

    #[Route('/api/lists/{id}/items', methods: ['GET'])]
    public function getItems(int $id, Connection $connection): JsonResponse
    {
        $sql = "
        SELECT
            a.name
        FROM shopping_list_article sla
        JOIN article a ON sla.article_id = a.id
        WHERE sla.shopping_list_id = ?
    ";

        $items = $connection->fetchAllAssociative($sql, [$id]);

        return $this->json($items);
    }

    #[Route('/api/lists/{id}/items/{itemId}', methods: ['GET'])]
    public function getItem(int $id, int $itemId, Connection $connection): JsonResponse
    {
        $item = $connection->fetchAssociative(
            "SELECT * FROM shopping_list_article WHERE id = ? AND shopping_list_id = ?",
            [$itemId, $id]
        );

        return $this->json($item);
    }

    #[Route('/api/lists/{id}/items/{itemId}', methods: ['PUT'])]
    public function updateItem(int $id, int $itemId, Request $request, Connection $connection): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $quantity = $data['quantity'];

        $connection->update(
            'shopping_list_article',
            ['quantity' => $quantity],
            ['id' => $itemId, 'shopping_list_id' => $id]
        );

        return $this->json(['message' => 'Updated']);
    }

    #[Route('/api/lists/{id}', methods: ['DELETE'])]
    public function deleteList(int $id, Connection $connection): JsonResponse
    {
        $connection->delete('shopping_list_article', [
            'shopping_list_id' => $id
        ]);

        $connection->delete('shopping_list', [
            'id' => $id
        ]);

        return $this->json(['message' => 'Liste gelöscht']);
    }

    #[Route('/api/lists/{id}/items/{itemId}', methods: ['DELETE'])]
    public function deleteItem(int $id, int $itemId, Connection $connection): JsonResponse
    {
        $connection->delete('shopping_list_article', [
            'id' => $itemId,
            'shopping_list_id' => $id
        ]);

        return $this->json(['message' => 'Item gelöscht']);
    }

}

