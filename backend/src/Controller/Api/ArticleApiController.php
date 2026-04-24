<?php

namespace App\Controller\Api;

use App\Service\ArticleService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ArticleApiController extends AbstractController{

    #[Route('/api/articles', methods: ['GET'])]
    public function getArticles(ArticleService $service): JsonResponse{
        return $this->json($service->getArticles());
    }

    // Get all departments for use in dropdowns.
    #[Route('/api/departments', methods: ['GET'])]
    public function getDepartments(ArticleService $service): JsonResponse{
        return $this->json($service->getAllDepartments());
    }

    // Create a new article with a name and department.
    #[Route('/api/articles', methods: ['POST'])]
    public function createArticle(Request $request, ArticleService $service): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Validate that name and department_id are provided.
        if (!$data || !isset($data['name'], $data['department_id'])) {
            return $this->json([
                'error' => 'Invalid request body. Required fields: name, department_id'
            ], 400);
        }

        $name = $data['name'];
        $departmentId = (int) $data['department_id'];

        $article = $service->createArticle($name, $departmentId);

        return $this->json([
            'message' => 'Article created',
            'id' => $article['id'],
            'name' => $article['name'],
            'department_id' => $article['department_id']
        ], 201);
    }

}
