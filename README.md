# ShoppingList

Symfony-basierte Einkaufslisten-App mit REST-API, MySQL und einer nutzerfreundlichen Weboberflaeche.

## Features

- Mehrere Einkaufslisten erstellen, bearbeiten und loeschen
- Artikel in Kategorien (Departments) verwalten
- Shopping-Ansicht mit Abhaken von Artikeln
- PDF-Export pro Liste (kategorisiert)
- Wenn alle Artikel abgehakt sind: Liste wird geloescht
- Wenn nur ein Teil abgehakt ist: nur diese Artikel werden entfernt

## Tech Stack

- Backend: Symfony + Doctrine DBAL
- Datenbank: MySQL 8
- Frontend: Vanilla JavaScript + HTML/CSS
- Container: Docker Compose

## Projektstruktur

- `backend/` Symfony API + DB-Skripte
- `frontend/` statische Weboberflaeche

## Setup

### 1) Backend starten

```powershell
cd C:\dev\ShoppingList\ShoppingList\backend
docker compose up -d --build
```

### 2) Datenbankschema anlegen

```powershell
cd C:\dev\ShoppingList\ShoppingList\backend
docker compose exec app php bin/init_schema.php
```

### 3) Optional: Beispieldaten importieren

```powershell
cd C:\dev\ShoppingList\ShoppingList\backend
Get-Content .\seed_data.sql | docker compose exec -T database mysql -uapp -p!ChangeMe! app
```

### 4) Frontend starten

```powershell
cd C:\dev\ShoppingList\ShoppingList\frontend
python -m http.server 3000
```

Dann im Browser:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`

## API Endpoints (Anforderungsabdeckung)

Die geforderten Endpoints sind unter `/lists` verfuegbar.
Zusaetzlich existieren kompatible `/api/lists`-Aliase fuer das bestehende Frontend.

1. `POST /lists`
   - Erstellt eine Einkaufsliste mit X Eintraegen
2. `POST /lists/{id}/item`
   - Erstellt neues Item in der Liste
   - Antwort: aktualisierte Einkaufsliste
3. `GET /lists/{id}/items`
   - Gibt die komplette Einkaufsliste (Items) zurueck
4. `GET /lists/{id}/items/{itemId}`
   - Gibt ein konkretes Item zurueck
5. `PUT /lists/{id}/items/{itemId}`
   - Aktualisiert ein Item
6. `DELETE /lists/{id}`
   - Loescht eine Einkaufsliste
7. `DELETE /lists/{id}/items/{itemId}`
   - Loescht ein Item

## Beispiel-Requests

```http
POST /lists
Content-Type: application/json

{
  "name": "Wocheneinkauf",
  "articles": [1, 2, 3]
}
```

```http
POST /lists/1/item
Content-Type: application/json

{
  "article_id": 5,
  "quantity": 2
}
```

## Hinweise

- Die API-Controller sind Symfony-typisch mit Attribute-Routing umgesetzt.
- Das Frontend ist bewusst ohne Framework gehalten, um Setup und Review einfach zu halten.
