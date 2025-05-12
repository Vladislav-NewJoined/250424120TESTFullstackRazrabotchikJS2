const express = require('express');
const router = express.Router();
const itemService = require('../services/itemService');

// Получение списка элементов с пагинацией и поиском
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 20;
  const search = req.query.search || '';
  
  const items = itemService.getItems(page, size, search);
  const totalCount = itemService.getTotalCount(search);
  
  res.json({
    items,
    totalCount,
    totalPages: Math.ceil(totalCount / size),
    currentPage: page,
    hasMore: (page + 1) * size < totalCount,
    hasSelectedItems: itemService.hasSelectedItems()
  });
});

// Получение выбранных элементов
router.get('/selected', (req, res) => {
  res.json(itemService.getSelectedItems());
});

// Переключение выбора элемента
router.post('/:id/toggle', (req, res) => {
  const id = parseInt(req.params.id);
  const success = itemService.toggleSelection(id);
  
  if (success) {
    res.status(200).send();
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Обновление порядка элементов
router.post('/reorder', (req, res) => {
  const newOrder = req.body;
  const success = itemService.updateOrder(newOrder);
  
  if (success) {
    res.status(200).send();
  } else {
    res.status(400).json({ error: 'Invalid order data' });
  }
});

// Получение текущего порядка элементов
router.get('/order', (req, res) => {
  res.json(itemService.getCurrentOrder());
});

// Сброс порядка элементов
router.post('/reset-order', (req, res) => {
  const success = itemService.resetOrder();
  
  if (success) {
    res.status(200).send();
  } else {
    res.status(500).json({ error: 'Failed to reset order' });
  }
});

module.exports = router;
