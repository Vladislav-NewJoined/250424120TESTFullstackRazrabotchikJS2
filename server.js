const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Импортируем маршруты
const itemsRoutes = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Маршруты
app.use('/api/items', itemsRoutes);

// // Обработка корневого маршрута
app.use((req, res, next) => {
  // Проверяем, не является ли запрос API-запросом
  if (!req.path.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// Обработка всех остальных маршрутов (для SPA)
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`My project has started on port ${PORT}`);
  
  // Выводим локальные URL только при локальном запуске
  if (!process.env.RENDER) {
    console.log(`Здесь смотрим результаты: http://localhost:${PORT}/`);
    console.log(`Вы можете просто ввести URL в адресную строку браузера для GET-запросов:`);
    console.log(`http://localhost:${PORT}/api/items?page=0&size=20`);
    console.log(`http://localhost:${PORT}/api/items?page=0&size=20&search=Item%2010`);
    console.log(`После запуска сервера переходим сюда:`);
    console.log(`http://localhost:${PORT}/`);
  }
});
