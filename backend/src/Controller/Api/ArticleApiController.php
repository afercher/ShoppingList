<?php

namespace App\Controller\Api;

use App\Service\ArticleService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;

class ArticleApiController extends AbstractController{

    #[Route('/api/articles', methods: ['GET'])]
    public function getArticles(ArticleService $service): JsonResponse{
        return $this->json($service->getArticles());
    }

}
