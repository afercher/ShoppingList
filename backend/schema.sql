CREATE TABLE IF NOT EXISTS department (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS article (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    CONSTRAINT fk_article_department FOREIGN KEY (department_id)
        REFERENCES department(department_id) ON DELETE CASCADE,
    UNIQUE KEY uniq_article_name_department (name, department_id)
);

CREATE TABLE IF NOT EXISTS shopping_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS shopping_list_article (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shopping_list_id INT NOT NULL,
    article_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_sla_list FOREIGN KEY (shopping_list_id)
        REFERENCES shopping_list(id) ON DELETE CASCADE,
    CONSTRAINT fk_sla_article FOREIGN KEY (article_id)
        REFERENCES article(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_shopping_list_article (shopping_list_id, article_id)
);

