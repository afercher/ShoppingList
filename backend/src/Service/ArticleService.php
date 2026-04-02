<?php

namespace App\Service;

use Doctrine\DBAL\Connection;

class ArticleService{

    public function __construct(private Connection $connection) {}

    public function getArticles(): array
    {
        $articleList = $this->connection->fetchAllAssociative('
            SELECT
                a.id as article_id,
                a.name as article_name,
                d.name as department_name
            FROM article a
            JOIN department d ON a.department_id = d.department_id');

        $departments = [];

        foreach($articleList as $article)
        {
            $department = $article['department_name'];
            unset($article['department_name']);

            $departments[$department][] = $article;
        }

        return $departments;
    }

}
