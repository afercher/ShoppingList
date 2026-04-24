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

    // Get all departments for the article creation form.
    public function getAllDepartments(): array
    {
        return $this->connection->fetchAllAssociative('
            SELECT
                department_id as id,
                name
            FROM department
            ORDER BY name ASC');
    }

    // Create a new article and return the created record.
    public function createArticle(string $name, int $departmentId): array
    {
        $this->connection->insert('article', [
            'name' => $name,
            'department_id' => $departmentId
        ]);

        $articleId = $this->connection->lastInsertId();

        return [
            'id' => $articleId,
            'name' => $name,
            'department_id' => $departmentId
        ];
    }

    // Create a new department and return the created record.
    public function createDepartment(string $name): array
    {
        $this->connection->insert('department', [
            'name' => $name
        ]);

        // Get the last inserted ID from the PostgreSQL sequence
        $result = $this->connection->executeQuery('SELECT lastval() as id')->fetchAssociative();
        $departmentId = $result['id'];

        return [
            'id' => $departmentId,
            'name' => $name
        ];
    }

}
