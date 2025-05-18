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

    // Если есть сохраненный порядок, применяем его к отфильтрованным элементам
    if (itemsOrder.length > 0) {
        // Создаем карту для быстрого доступа к элементам
        const itemsMap = new Map(filteredItems.map(item => [item.id, item]));

        // Получаем элементы в указанном порядке
        const orderedItems = itemsOrder
            .filter(id => itemsMap.has(id)) // Только существующие в фильтрованном списке
            .map(id => itemsMap.get(id));

        // Добавляем элементы, которых нет в сохраненном порядке
        filteredItems.forEach(item => {
            if (!itemsOrder.includes(item.id)) {
                orderedItems.push(item);
            }
        });

        // Применяем пагинацию к упорядоченным элементам и обновляем статус выбора
        return orderedItems.slice(startIndex, endIndex).map(item => ({
            ...item,
            selected: selectedItems.some(selected => selected.id === item.id)
        }));
    }

    // Если нет сохраненного порядка, применяем пагинацию и обновляем статус выбора
    return filteredItems.slice(startIndex, endIndex).map(item => ({
        ...item,
        selected: selectedItems.some(selected => selected.id === item.id)
    }));
}

// Получение общего количества элементов с учетом поиска
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
    // Обновляем список выбранных элементов с учетом порядка
    selectedItems = items.filter(item => item.selected);

    if (itemsOrder.length > 0) {
        // Сортируем выбранные элементы согласно сохраненному порядку
        const selectedMap = new Map(selectedItems.map(item => [item.id, item]));
        const orderedSelected = itemsOrder
            .filter(id => selectedMap.has(id))
            .map(id => selectedMap.get(id));

        // Добавляем выбранные элементы, которых нет в сохраненном порядке
        selectedItems.forEach(item => {
            if (!itemsOrder.includes(item.id)) {
                orderedSelected.push(item);
            }
        });

        return orderedSelected;
    }

    return selectedItems;
}

// Проверка наличия выбранных элементов
function hasSelectedItems() {
    return items.some(item => item.selected);
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

    // Сохраняем новый порядок
    itemsOrder = newOrder;

    return true;
}

// Получение текущего порядка элементов
function getCurrentOrder() {
    // Если есть сохраненный порядок, возвращаем его
    if (itemsOrder.length > 0) {
        return itemsOrder;
    }

    // Иначе возвращаем порядок по умолчанию
    return items.map(item => item.id);
}

// Сброс порядка элементов
function resetOrder() {
    try {
        itemsOrder = [];
        return true;
    } catch (error) {
        console.error('Error resetting order:', error);
        return false;
    }
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