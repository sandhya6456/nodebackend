const express=require('express');
const {Client}=require('pg');
const cors=require('cors');
require('dotenv').config(); // ✅ load .env variables

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ PostgreSQL Client Setup using env
const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

//GET products
app.get('/products', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM product');
        res.json(result.rows); 
    } catch (err) {
        console.error('Query error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// DELETE product by ID
app.delete('/products/:id', async (req, res) => {
    console.log(`Deleting product with ID: ${req.params.id}`);
    const { id } = req.params;
    try {
        const result = await client.query('DELETE FROM product WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully', deletedProduct: result.rows[0] });
    } catch (err) {
        console.error('Query error:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// ✅ POST NEW PRODUCT
app.post('/products', async (req, res) => {
    const { product_name, price } = req.body;
    if (!product_name || !price) {
        return res.status(400).json({ error: 'product_name and price are required' });
    }
    try {
        const result = await client.query(
            'INSERT INTO product (product_name, price) VALUES ($1, $2) RETURNING *',
            [product_name, price]
        );
        res.status(201).json({ message: 'Product added', product: result.rows[0] });
    } catch (err) {
        console.error('Insert error:', err);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// ✅ UPDATE product by ID
app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { product_name, price } = req.body;

    if (!product_name || !price) {
        return res.status(400).json({ error: 'product_name and price are required' });
    }

    try {
        const result = await client.query(
            'UPDATE product SET product_name = $1, price = $2 WHERE id = $3 RETURNING *',
            [product_name, price, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product updated successfully', updatedProduct: result.rows[0] });
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

app.listen(PORT,()=>{
    console.log(`Server running at http://localhost:${PORT}`);

});