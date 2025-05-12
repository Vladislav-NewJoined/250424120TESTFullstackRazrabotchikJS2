// Имитация базы данных с элементами
const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    displayText: `Item ${i + 1}`,
    selected: false
}));

// Хранение выбранных элементов
let selectedItems = [];

// Хранение порядка элементов
let itemsOrder = [];

// Получение элементов с пагинацией и поиском
function getItems(page, size, search = '') {
    // Фильтрация по поисковому запросу
    const filteredItems = items.filter(item =>
        item.displayText.toLowerCase().includes(search.toLowerCase())
    );
    
    // Применение пагинации
    const startIndex = page * size;
    const endIndex = startIndex + size;
    
    // Если есть сохраненный порядок, применяем его
    if (itemsOrder.length > 0) {
        // Создаем карту для быстрого доступа к элементам
        const itemsMap = new Map();
        filteredItems.forEach(item => {
            itemsMap.set(item.id, item);
        });
        
        // Получаем элементы в указанном порядке
        const orderedItems = [];
        
        // Сначала добавляем элементы из сохраненного порядка
        itemsOrder.forEach(id => {
            const item = itemsMap.get(id);
            if (item && filteredItems.includes(item)) {
                orderedItems.push(item);
            }
        });
        
        // Затем добавляем элементы, которых нет в сохраненном порядке
        filteredItems.forEach(item => {
            if (!itemsOrder.includes(item.id)) {
                orderedItems.push(item);
            }
        });
        
        // Применяем пагинацию к упорядоченным элементам
        return orderedItems.slice(startIndex, endIndex);
    }
    
    // Если нет сохраненного порядка, просто применяем пагинацию
    return filteredItems.slice(startIndex, endIndex);
}

// Получение общего количества элементов
function getTotalCount(search = '') {
    if (!search) {
        return items.length;
    }
    
    return items.filter(item =>
        item.displayText.toLowerCase().includes(search.toLowerCase())
    ).length;
}

// Получение выбранных элементов
function getSelectedItems() {
    // Обновляем список выбранных элементов
    selectedItems = items.filter(item => item.selected);
    return selectedItems;
}

// Проверка наличия выбранных элементов
function hasSelectedItems() {
    // Обновляем список выбранных элементов перед проверкой
    selectedItems = items.filter(item => item.selected);
    return selectedItems.length > 0;
}

// Переключение выбора элемента
function toggleSelection(id) {
    const item = items.find(item => item.id === id);
    
    if (!item) {
        return false;
    }
    
    item.selected = !item.selected;
    
    // Обновляем список выбранных элементов
    selectedItems = items.filter(item => item.selected);
    
    return true;
}

// Обновление порядка элементов
function updateOrder(newOrder) {
    if (!Array.isArray(newOrder)) {
        return false;
    }
    
    // Проверяем, что все ID в newOrder существуют
    const validIds = newOrder.every(id => items.some(item => item.id === id));
    
    if (!validIds) {
        return false;
    }
    
    itemsOrder = newOrder;
    return true;
}

// Получение текущего порядка элементов
function getCurrentOrder() {
    return itemsOrder;
}

// Сброс порядка элементов
function resetOrder() {
    itemsOrder = [];
    return true;
}

module.exports = {
    getItems,
    getTotalCount,
    getSelectedItems,
    hasSelectedItems,
    toggleSelection,
    updateOrder,
    getCurrentOrder,
    resetOrder
};
