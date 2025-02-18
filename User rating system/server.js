const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());

// File paths
const PRODUCTS_FILE = "products.json";
const REVIEWS_FILE = "reviews.json";

// Load data from JSON files
const loadData = (file) => {
    if (!fs.existsSync(file)) return [];
    const data = fs.readFileSync(file);
    return JSON.parse(data);
};

// Save data to JSON files
const saveData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Load initial data
let products = loadData(PRODUCTS_FILE);
let reviews = loadData(REVIEWS_FILE);

// Ensure counters are properly initialized
let productCounter = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
let reviewCounter = reviews.length > 0 ? Math.max(...reviews.map(r => r.id)) : 0;

// POST /products - Add a new product
app.post("/products", (req, res) => {
    const { name, description } = req.body;
    if (!name || !description) {
        return res.status(400).json({ error: "Name and description are required." });
    }
    productCounter += 1; // Increment counter correctly
    const newProduct = {
        id: productCounter,
        name,
        description,
        averageRating: 0,
    };
    products.push(newProduct);
    saveData(PRODUCTS_FILE, products);
    res.status(201).json(newProduct);
});

// GET /products - Retrieve all products
app.get("/products", (req, res) => {
    const { sortBy } = req.query;
    let sortedProducts = [...products];
    if (sortBy === "rating") {
        sortedProducts.sort((a, b) => b.averageRating - a.averageRating);
    }
    res.json(sortedProducts);
});

// GET /products/:id - Retrieve specific product with reviews
app.get("/products/:id", (req, res) => {
    const product = products.find((p) => p.id == req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    const productReviews = reviews.filter((review) => review.productId == product.id);
    res.json({ ...product, reviews: productReviews });
});

// POST /reviews - Submit a review
app.post("/reviews", (req, res) => {
    const { productId, rating, message } = req.body;
    if (!productId || typeof rating !== "number" || !message) {
        return res.status(400).json({ error: "Invalid input." });
    }
    if (!products.some((p) => p.id == productId)) {
        return res.status(404).json({ error: "Product not found." });
    }
    reviewCounter += 1; // Increment counter correctly
    const newReview = {
        id: reviewCounter,
        productId,
        timestamp: new Date().toISOString(),
        rating,
        message,
    };
    reviews.push(newReview);
    saveData(REVIEWS_FILE, reviews);
    res.status(201).json(newReview);
});

// GET /reviews - Retrieve recent reviews
app.get("/reviews", (req, res) => {
    const { sortBy } = req.query;
    let sortedReviews = [...reviews];
    if (sortBy === "rating") {
        sortedReviews.sort((a, b) => b.rating - a.rating);
    } else {
        sortedReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    res.json(sortedReviews);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
