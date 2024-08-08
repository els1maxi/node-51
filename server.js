import express from 'express';
import { randomUUID } from 'crypto';
import { products, users, carts, orders } from './storage.js';

const app = express();
const PORT = 3000;

app.use(express.json());

//регистрация 
app.post('/api/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email и пароль обязательны." });

    const userId = randomUUID();
    const newUser = { id: userId, email, password };
    users.push(newUser);

    res.json({ id: userId, email });
});

//все продукты
app.get('/api/products', (req, res) => res.json(products));

//продукт по ID
app.get('/api/products/:productId', (req, res) => {
    const product = products.find(p => p.id == req.params.productId);
    product ? res.json(product) : res.status(404).json({ message: "Продукт не найден." });
});

//проверка ID пользователя
app.use((req, res, next) => {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ message: "Неавторизован. Неверный x-user-id." });

    req.userId = userId;
    next();
});

//добавить продукт в корзину
app.put('/api/cart/:productId', (req, res) => {
    const { productId } = req.params;
    const product = products.find(p => p.id == productId);
    if (!product) return res.status(404).json({ message: "Продукт не найден." });

    let cart = carts.find(c => c.userId === req.userId);
    if (!cart) {
        cart = { id: randomUUID(), userId: req.userId, products: [] };
        carts.push(cart);
    }

    cart.products.push(product);
    res.json(cart);
});

//удалить продукт из корзины
app.delete('/api/cart/:productId', (req, res) => {
    const { productId } = req.params;
    const cart = carts.find(c => c.userId === req.userId);
    if (!cart) return res.status(404).json({ message: "Корзина не найдена." });

    cart.products = cart.products.filter(p => p.id != productId);
    res.json(cart);
});

//оформить 
app.post('/api/cart/checkout', (req, res) => {
    const cart = carts.find(c => c.userId === req.userId);
    if (!cart || cart.products.length === 0) return res.status(400).json({ message: "Корзина пуста или не найдена." });

    const order = {
        id: randomUUID(),
        userId: req.userId,
        products: cart.products,
        totalPrice: cart.products.reduce((sum, product) => sum + product.price, 0),
    };

    orders.push(order);
    cart.products = []; //очистить корзину

    res.json(order);
});

app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
