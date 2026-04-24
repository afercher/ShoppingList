<?php

declare(strict_types=1);

$pdo = new PDO('mysql:host=database;dbname=app;charset=utf8mb4', 'app', '!ChangeMe!');
$sql = file_get_contents(__DIR__ . '/../schema.sql');

if ($sql === false) {
    fwrite(STDERR, "Could not read schema.sql\n");
    exit(1);
}

$pdo->exec($sql);
echo "schema ok\n";

