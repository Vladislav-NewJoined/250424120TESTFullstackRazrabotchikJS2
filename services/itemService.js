const ListItem = require('../models/listItem');
const fs = require('fs');
const path = require('path');

class ItemService {
  constructor() {
    this.items = [];
    this.customOrder = [];
    this.hasCustomOrder = false;
    this.orderFile = path.join(__dirname, '../data/order.json');
    this.selectedFile = path.join(__dirname, '../data/selected.json');
    
    // Создаем директорию data, если она не существует
    if (!fs.existsSync(path.join(__dirname, '../data'))) {
      fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
    }
    
    // Инициализация миллиона элементов
    for (let i = 1; i <= 1000000; i++) {
      this.items.push(new ListItem(i));
    }
    
    // Загружаем сохраненный порядок и выбранные элементы
    this.loadSavedState();
  }
  
  // Загрузка сохраненного состояния
  loadSavedState() {
    try {
      // Загружаем сохраненный порядок
      if (fs.existsSync(this.orderFile)) {
        this.customOrder = JSON.parse(fs.readFileSync(this.orderFile, 'utf8'));
        this.hasCustomOrder = this.customOrder.length > 0;
      }
      
      // Загружаем выбранные элементы
      if (fs.existsSync(this.selectedFile)) {
        const selectedIds = JSON.parse(fs.readFileSync(this.selectedFile, 'utf8'));
        selectedIds.forEach(id => {
          const item = this.items.find(item => item.id === id);
          if (item) {
            item.selected = true;
          }
        });
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }
  
  // Сохранение текущего порядка
  saveOrder() {
    try {
      fs.writeFileSync(this.orderFile, JSON.stringify(this.customOrder));
    } catch (error) {
      console.error('Error saving order:', error);
    }
  }
  
  // Сохранение выбранных элементов
  saveSelected() {
    try {
      const selectedIds = this.items
        .filter(item => item.selected)
        .map(item => item.id);
      fs.writeFileSync(this.selectedFile, JSON.stringify(selectedIds));
    } catch (error) {
      console.error('Error saving selected items:', error);
    }
  }

  getItems(page, size, searchQuery) {
    // Применяем фильтрацию, если есть поисковый запрос
    let filteredItems = this.items;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredItems = this.items.filter(item =>
        item.displayText.toLowerCase().includes(query)
      );
    }
    
    // Применяем пользовательскую сортировку, если она есть
    if (this.hasCustomOrder && this.customOrder.length > 0) {
      filteredItems = [...filteredItems].sort((a, b) => {
        const indexA = this.customOrder.indexOf(a.id);
        const indexB = this.customOrder.indexOf(b.id);
        
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
      });
    }
    
    // Применяем пагинацию
    const start = page * size;
    const end = Math.min(start + size, filteredItems.length);
    
    if (start >= filteredItems.length) {
      return [];
    }
    
    return filteredItems.slice(start, end);
  }
  
  getTotalCount(searchQuery) {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return this.items.filter(item =>
        item.displayText.toLowerCase().includes(query)
      ).length;
    }
    return this.items.length;
  }
  
  toggleSelection(id) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      item.selected = !item.selected;
      this.saveSelected(); // Сохраняем выбранные элементы
      return true;
    }
    return false;
  }
  
  updateOrder(newOrder) {
    if (newOrder && newOrder.length > 0) {
      this.customOrder = [...newOrder];
      this.hasCustomOrder = true;
      this.saveOrder(); // Сохраняем новый порядок
      return true;
    }
    return false;
  }
  
  getSelectedItems() {
    let selectedItems = this.items.filter(item => item.selected);
    
    // Применяем пользовательскую сортировку, если она есть
    if (this.hasCustomOrder && this.customOrder.length > 0) {
      selectedItems = [...selectedItems].sort((a, b) => {
        const indexA = this.customOrder.indexOf(a.id);
        const indexB = this.customOrder.indexOf(b.id);
        
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
      });
    }
    
    return selectedItems;
  }
  
  hasSelectedItems() {
    return this.items.some(item => item.selected);
  }
  
  getCurrentOrder() {
    return [...this.customOrder];
  }
  
  resetOrder() {
    this.customOrder = [];
    this.hasCustomOrder = false;
    this.saveOrder(); // Сохраняем сброшенный порядок
    return true;
  }
}

// Создаем и экспортируем единственный экземпляр сервиса
module.exports = new ItemService();
