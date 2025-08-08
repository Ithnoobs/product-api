require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mssql = require('mssql');
const dbConfig = require('./dbConfig');

const app = express();
app.use(cors());
app.use(express.json());

const poolPromise = new mssql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to Database');
        return pool;
    })
    .catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });

function validateProduct({ PRODUCTNAME, PRICE, STOCK }, maxLength = 100) {
    if (!PRODUCTNAME || PRODUCTNAME.trim() === '' || PRICE <= 0 || STOCK < 0) {
        return { valid: false, message: 'Invalid product data' };
    }

    if (typeof PRODUCTNAME !== 'string') {
        return { valid: false, message: 'Product name must be a string' };
    }
    if (typeof PRICE !== 'number' || isNaN(PRICE)) {
        return { valid: false, message: 'Price must be a valid number' };
    }
    if (!Number.isInteger(STOCK)) {
        return { valid: false, message: 'Stock must be an integer' };
    }
    if (PRODUCTNAME.length > maxLength) {
        return { valid: false, message: `Product name must not exceed ${maxLength} characters` };
    }
    return null;
}

// Get Products
        app.get('/products', async (req, res) => {
            try {
                const pool = await poolPromise;
                const { id } = req.query;
                let result;

                if (id) {
                    result = await pool.request()
                        .input('id', mssql.Int, id)
                        .query('SELECT * FROM Products WHERE PRODUCTID = @id');
                    if(result.recordset.length === 0) {
                        return res.status(404).json({ message: 'Product not found' });
                    }
                    return res.json(result.recordset[0]);
                } else {
                    result = await pool.request().query('SELECT * FROM Products');
                    return res.json(result.recordset);
                }
            } catch (err){
                res.status(500).json({ error: err.message });
            }
        })        

        // Add Product
        app.post('/products', async (req, res) => {
            const error = validateProduct(req.body);
            if (error) {
                return res.status(400).json({ message: error.message });
            }
            const { PRODUCTNAME, PRICE, STOCK } = req.body;

            
            try {
                const pool = await poolPromise;

                const existingProduct = await pool.request()
                    .input('PRODUCTNAME', mssql.NVarChar, PRODUCTNAME)
                    .query('SELECT * FROM Products WHERE PRODUCTNAME = @PRODUCTNAME');
                if(existingProduct.recordset.length > 0){
                    return res.status(400).json({ message: 'Product with this name already exists' });
                }

                const result = await pool.request()
                    .input('PRODUCTNAME', mssql.NVarChar, PRODUCTNAME)
                    .input('PRICE', mssql.Decimal(10, 2), PRICE)
                    .input('STOCK', mssql.Int, STOCK)
                    .query(`
                            INSERT INTO Products (PRODUCTNAME, PRICE, STOCK)
                            OUTPUT inserted.*
                            VALUES (@PRODUCTNAME, @PRICE, @STOCK)
                        `);
                    res.status(201).json(result.recordset[0]);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        })

        // Update Product
        app.put('/products', async (req, res) => {
            const { id } = req.query;
            if (!id) return res.status(400).json({ message: 'Product ID is required' });

            const error = validateProduct(req.body);
            if (error) return res.status(400).json({ message: error.message });

            const { PRODUCTNAME, PRICE, STOCK } = req.body;

            try {
                const pool = await poolPromise;
                const existingProduct = await pool.request()
                    .input('PRODUCTNAME', mssql.NVarChar, PRODUCTNAME)
                    .input('id', mssql.Int, id)
                    .query('SELECT * FROM Products WHERE PRODUCTNAME = @PRODUCTNAME AND PRODUCTID != @id');
                if(existingProduct.recordset.length > 0){
                    return res.status(400).json({ message: 'Product with this name already exists' });
                }

                const result = await pool.request()
                    .input('id', mssql.Int, id)
                    .input('PRODUCTNAME', mssql.NVarChar, PRODUCTNAME)
                    .input('PRICE', mssql.Decimal(10, 2), PRICE)
                    .input('STOCK', mssql.Int, STOCK)
                    .query(`
                        UPDATE Products
                        SET PRODUCTNAME = @PRODUCTNAME, PRICE = @PRICE, STOCK = @STOCK
                        OUTPUT inserted.*
                        WHERE PRODUCTID = @id
                    `);
                if (!result.recordset.length) {
                    return res.status(404).json({ message: 'Product not found' });
                }
                res.json(result.recordset[0]);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // Delete Product
        app.delete('/products', async (req, res) => {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ message: 'Product ID is required' });
            } 

            try {
                const pool = await poolPromise;
                const result = await pool.request()
                    .input('id', mssql.Int, id)
                    .query('DELETE FROM Products WHERE PRODUCTID = @id');
                if (result.rowsAffected[0] === 0) {
                    return res.status(404).json({ message: 'Product not found' });
                }
                res.json({ message: 'Product deleted successfully' });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        })

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

