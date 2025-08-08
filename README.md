# Product API

A Node.js + Express REST API for managing products, using SQL Server as a backend.

## Related Projects

- [Product CRUD Flutter App (Frontend)](https://github.com/Ithnoobs/product_crud_app)

## Features

- CRUD operations for products (`GET`, `POST`, `PUT`, `DELETE`)
- Input validation for product data
- Prevents duplicate product names
- CORS enabled for frontend integration
- Environment-based configuration

## Endpoints

- `GET /products` — List all products or fetch by `id` (query param)
- `POST /products` — Add a new product (`PRODUCTNAME`, `PRICE`, `STOCK`)
- `PUT /products?id=...` — Update an existing product by ID
- `DELETE /products?id=...` — Delete a product by ID

## Setup

1. Clone this repo.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with:
   ```
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_SERVER=your_server
   DB_NAME=your_db
   PORT=5000
   ```
4. Start the server:
   ```bash
   node server.js
   ```
5. The API will run on `http://localhost:5000`.

## License

MIT
