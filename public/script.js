let currentPage = 0;
const pageSize = 20;
let isLoading = false;
let hasMoreItems = true;
let searchTimeout;
let searchQuery = '';
let itemsOrder = [];
let initialLoadComplete = false;
let totalItems = 0;

const container = document.getElementById('list-container');
const searchInput = document.getElementById('search-input');
const resetButton = document.getElementById('reset-button');
const loadingIndicator = document.getElementById('loading');
const statusMessage = document.getElementById('status-message');
const searchInfo = document.getElementById('search-info');

// Функция для сохранения порядка элементов в localStorage
function saveOrderToLocalStorage() {
    const newOrder = Array.from(container.querySelectorAll('.item'))
        .map(item => parseInt(item.getAttribute('data-id')));
    localStorage.setItem('itemsOrder', JSON.stringify(newOrder));
}

// Функция для сохранения выбранных элементов в localStorage
function saveSelectedToLocalStorage() {
    const selectedIds = Array.from(container.querySelectorAll('.item.selected'))
        .map(item => parseInt(item.getAttribute('data-id')));
    localStorage.setItem('selectedItems', JSON.stringify(selectedIds));
}

// Функция для загрузки порядка элементов из localStorage
function loadOrderFromLocalStorage() {
    const savedOrder = localStorage.getItem('itemsOrder');
    return savedOrder ? JSON.parse(savedOrder) : [];
}

// Функция для загрузки выбранных элементов из localStorage
function loadSelectedFromLocalStorage() {
    const savedSelected = localStorage.getItem('selectedItems');
    return savedSelected ? JSON.parse(savedSelected) : [];
}

// Функция для отображения статусного сообщения
function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.backgroundColor = isError ? '#f44336' : '#333';
    statusMessage.classList.add('show');
    
    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, 3000);
}

// Функция для обновления информации о поиске
function updateSearchInfo() {
    if (searchQuery) {
        searchInfo.textContent = `Showing results for "${searchQuery}" (${totalItems} items found)`;
        searchInfo.style.display = 'block';
    } else {
        searchInfo.style.display = 'none';
    }
}

// Функция для загрузки выбранных элементов при первой загрузке
async function loadSelectedItems() {
    try {
        const response = await fetch('/api/items/selected');
        if (!response.ok) {
            throw new Error('Failed to load selected items');
        }
        
        const selectedItems = await response.json();
        
        // Изменение: Не загружаем только выбранные элементы, а загружаем все
        // Возвращаем false, чтобы продолжить загрузку всех элементов
        return false;
        
        /* Закомментированный старый код:
        if (selectedItems.length > 0) {
            container.innerHTML = '';
            itemsOrder = [];
            
            // Отображаем только первые 20 выбранных элементов
            const itemsToShow = selectedItems.slice(0, pageSize);
            
            itemsToShow.forEach(item => {
                const itemId = item.id;
                itemsOrder.push(itemId);
                
                const div = document.createElement('div');
                div.className = `item ${item.selected ? 'selected' : ''}`;
                div.setAttribute('data-id', itemId);
                div.draggable = true;
                
                div.innerHTML = `
                    <div class="drag-handle">☰</div>
                    <div class="item-content">
                        <input type="checkbox" class="checkbox" ${item.selected ? 'checked' : ''}>
                        <span>${item.displayText || 'Item ' + itemId}</span>
                    </div>
                `;
                
                // Добавляем обработчик для чекбокса
                const checkbox = div.querySelector('.checkbox');
                checkbox.addEventListener('click', function() {
                    toggleItem(itemId, this);
                });
                
                // Добавляем обработчики для Drag&Drop
                div.addEventListener('dragstart', handleDragStart);
                div.addEventListener('dragover', handleDragOver);
                div.addEventListener('drop', handleDrop);
                div.addEventListener('dragend', handleDragEnd);
                
                container.appendChild(div);
            });
            
            // Если выбранных элементов больше 20, устанавливаем флаг для подгрузки остальных
            hasMoreItems = selectedItems.length > pageSize;
            currentPage = 1; // Начинаем с 1, так как уже загрузили первую страницу
            totalItems = selectedItems.length;
            
            // Сохраняем выбранные элементы в localStorage
            saveSelectedToLocalStorage();
            
            return true; // Возвращаем true, если загрузили выбранные элементы
        }
        */
        
        return false; // Возвращаем false, если нет выбранных элементов
    } catch (error) {
        console.error('Error loading selected items:', error);
        showStatus('Error loading selected items', true);
        return false;
    }
}

// Функция для загрузки элементов
async function loadItems(page, append = true) {
    if (isLoading || (!hasMoreItems && append)) return;
    
    isLoading = true;
    loadingIndicator.style.display = 'block';
    
    try {
        const url = `/api/items?page=${page}&size=${pageSize}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to load items');
        }
        
        const data = await response.json();
        
        // Обновляем информацию о пагинации
        totalItems = data.totalCount || 0;
        hasMoreItems = data.hasMore || false;
        
        // Обновляем информацию о поиске
        updateSearchInfo();
        
        // Проверяем, есть ли в ответе массив items
        const items = data.items || [];
        
        if (!append) {
            container.innerHTML = '';
            itemsOrder = [];
        }
        
        if (items.length === 0 && page === 0) {
            container.innerHTML = '<div class="loading">No items found</div>';
            return;
        }
        
        items.forEach(item => {
            const itemId = item.id;
            itemsOrder.push(itemId);
            
            const div = document.createElement('div');
            div.className = `item ${item.selected ? 'selected' : ''}`;
            div.setAttribute('data-id', itemId);
            div.draggable = true;
            
            div.innerHTML = `
                <div class="drag-handle">☰</div>
                <div class="item-content">
                    <input type="checkbox" class="checkbox" ${item.selected ? 'checked' : ''}>
                    <span>${item.displayText || 'Item ' + itemId}</span>
                </div>
            `;
            
            // Добавляем обработчик для чекбокса
            const checkbox = div.querySelector('.checkbox');
            checkbox.addEventListener('click', function() {
                toggleItem(itemId, this);
            });
            
            // Добавляем обработчики для Drag&Drop
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('dragover', handleDragOver);
            div.addEventListener('drop', handleDrop);
            div.addEventListener('dragend', handleDragEnd);
            
            container.appendChild(div);
        });
        
        // Сохраняем порядок в localStorage, если это первая загрузка
        if (page === 0 && !append) {
            saveOrderToLocalStorage();
        }
    } catch (error) {
        console.error('Error loading items:', error);
        showStatus('Error loading items', true);
    } finally {
        isLoading = false;
        loadingIndicator.style.display = 'none';
    }
}

// Функция для переключения выбора элемента
async function toggleItem(id, checkbox) {
    try {
        const response = await fetch(`/api/items/${id}/toggle`, { method: 'POST' });
        
        if (!response.ok) {
            throw new Error('Failed to toggle item');
        }
        
        checkbox.closest('.item').classList.toggle('selected');
        saveSelectedToLocalStorage(); // Сохраняем выбранные элементы в localStorage
    } catch (error) {
        console.error('Error toggling item:', error);
        showStatus('Error toggling item selection', true);
        checkbox.checked = !checkbox.checked; // Возвращаем предыдущее состояние
    }
}

// Функция для сброса порядка элементов
async function resetOrder() {
    // Удаляем сохраненный порядок из localStorage
    localStorage.removeItem('itemsOrder');
    
    try {
        const response = await fetch('/api/items/reset-order', { method: 'POST' });
        
        if (!response.ok) {
            throw new Error('Failed to reset order');
        }
        
        showStatus('Order has been reset');
        
        // Перезагружаем элементы
        currentPage = 0;
        loadItems(currentPage, false);
    } catch (error) {
        console.error('Error resetting order:', error);
        showStatus('Error resetting order', true);
    }
}

// Функция для получения всех выбранных элементов
function getSelectedItems() {
    return Array.from(container.querySelectorAll('.item.selected'));
}

// Обработчики для Drag&Drop
let draggedItem = null;
let dragStartIndex = -1;

function handleDragStart(e) {
    draggedItem = this;
    dragStartIndex = Array.from(container.querySelectorAll('.item')).indexOf(draggedItem);
    
    // Добавляем класс dragging только к перетаскиваемому элементу
    draggedItem.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    // Удаляем все плейсхолдеры
    const placeholders = container.querySelectorAll('.placeholder');
    placeholders.forEach(p => p.remove());
    
    // Если элемент не перетаскивается или это тот же элемент, выходим
    if (!draggedItem || this === draggedItem) {
        return false;
    }
    
    // Определяем, куда вставлять плейсхолдер (до или после текущего элемента)
    const rect = this.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const isBelow = y > rect.height / 2;
    
    // Создаем плейсхолдер
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    
    // Вставляем плейсхолдер до или после текущего элемента
    if (isBelow) {
        this.parentNode.insertBefore(placeholder, this.nextSibling);
    } else {
        this.parentNode.insertBefore(placeholder, this);
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Удаляем все плейсхолдеры
    const placeholders = container.querySelectorAll('.placeholder');
    placeholders.forEach(p => p.remove());
    
    // Если элемент не перетаскивается или это тот же элемент, выходим
    if (!draggedItem || this === draggedItem) {
        return false;
    }
    
    // Определяем, куда вставлять элемент (до или после текущего элемента)
    const rect = this.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const isBelow = y > rect.height / 2;
    
    // Получаем все элементы
    const allItems = Array.from(container.querySelectorAll('.item'));
    
    // Определяем индекс целевого элемента
    const targetIndex = allItems.indexOf(this);
    
    // Определяем, куда вставлять элемент
    let insertIndex = isBelow ? targetIndex + 1 : targetIndex;
    
    // Удаляем перетаскиваемый элемент из DOM
    draggedItem.remove();
    
    // Корректируем insertIndex, если удаленный элемент был перед целевой позицией
    if (dragStartIndex < targetIndex) {
        insertIndex--;
    }
    
    // Определяем элемент, перед которым будем вставлять
    const remainingItems = Array.from(container.querySelectorAll('.item'));
    const insertBeforeElement = remainingItems[insertIndex] || null;
    
    // Вставляем перетаскиваемый элемент в новую позицию
    if (insertBeforeElement) {
        container.insertBefore(draggedItem, insertBeforeElement);
    } else {
        container.appendChild(draggedItem);
    }
    
    // Обновляем порядок элементов на сервере
    updateItemsOrder();
    
    return false;
}

function handleDragEnd() {
    // Удаляем класс dragging с перетаскиваемого элемента
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
    }
    
    // Удаляем все плейсхолдеры
    const placeholders = container.querySelectorAll('.placeholder');
    placeholders.forEach(p => p.remove());
    
    // Сбрасываем переменные
    draggedItem = null;
    dragStartIndex = -1;
    
    // Сохраняем порядок в localStorage
    saveOrderToLocalStorage();
}

// Функция для обновления порядка элементов на сервере
async function updateItemsOrder() {
    const newOrder = Array.from(container.querySelectorAll('.item'))
        .map(item => parseInt(item.getAttribute('data-id')));
    
    try {
        const response = await fetch('/api/items/reorder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newOrder)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update order');
        }
        
        itemsOrder = newOrder;
        saveOrderToLocalStorage();
    } catch (error) {
        console.error('Error updating order:', error);
        showStatus('Error updating item order', true);
    }
}

// Функция для загрузки порядка элементов с сервера
async function loadItemsOrder() {
    try {
        const response = await fetch('/api/items/order');
        
        if (!response.ok) {
            throw new Error('Failed to load order');
        }
        
        const orderData = await response.json();
        
        // Если есть сохраненный порядок, применяем его
        if (orderData && orderData.length > 0) {
            // Сохраняем порядок в localStorage
            localStorage.setItem('itemsOrder', JSON.stringify(orderData));
            return orderData;
        }
        
        return [];
    } catch (error) {
        console.error('Error loading order:', error);
        showStatus('Error loading item order', true);
        return [];
    }
}

// Функция для применения порядка элементов
function applyItemsOrder(order) {
    if (!order || order.length === 0) return;
    
    const itemsMap = new Map();
    const items = container.querySelectorAll('.item');
    
    // Создаем карту элементов по их ID
    items.forEach(item => {
        const id = parseInt(item.getAttribute('data-id'));
        itemsMap.set(id, item);
    });
    
    // Временный контейнер для хранения элементов в новом порядке
    const fragment = document.createDocumentFragment();
    
    // Добавляем элементы в порядке, указанном в order
    order.forEach(id => {
        const item = itemsMap.get(id);
        if (item) {
            fragment.appendChild(item);
        }
    });
    
    // Добавляем элементы, которых нет в order (если такие есть)
    items.forEach(item => {
        const id = parseInt(item.getAttribute('data-id'));
        if (!order.includes(id)) {
            fragment.appendChild(item);
        }
    });
    
    // Очищаем контейнер и добавляем элементы в новом порядке
    container.innerHTML = '';
    container.appendChild(fragment);
}

// Функция для инициализации приложения
async function initApp() {
    // Загружаем порядок элементов из localStorage или с сервера
    let savedOrder = loadOrderFromLocalStorage();
    
    if (!savedOrder || savedOrder.length === 0) {
        savedOrder = await loadItemsOrder();
    } else {
        // Если есть порядок в localStorage, отправляем его на сервер
        try {
            await fetch('/api/items/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(savedOrder)
            });
        } catch (error) {
            console.error('Error syncing order with server:', error);
        }
    }
    
    // Изменение: Всегда загружаем все элементы, а не только выбранные
    // Загружаем обычный список элементов
    await loadItems(0, false);
    
    // Применяем сохраненный порядок
    if (savedOrder && savedOrder.length > 0) {
        applyItemsOrder(savedOrder);
    }
    
    initialLoadComplete = true;
    
    /* Закомментированный старый код:
    // Проверяем, есть ли выбранные элементы
    const hasSelected = await loadSelectedItems();
    
    if (!hasSelected) {
        // Если нет выбранных элементов, загружаем обычный список
        await loadItems(0, false);
        
        // Применяем сохраненный порядок
        if (savedOrder && savedOrder.length > 0) {
            applyItemsOrder(savedOrder);
        }
    }
    */
}

// Обработчик прокрутки для подгрузки элементов
window.addEventListener('scroll', () => {
    if (!initialLoadComplete) return;
    
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoading && hasMoreItems) {
        currentPage++;
        loadItems(currentPage, true);
    }
});

// Обработчик для поиска
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        searchQuery = e.target.value.trim();
        currentPage = 0;
        loadItems(currentPage, false);
    }, 300);
});

// Обработчик для кнопки сброса
resetButton.addEventListener('click', resetOrder);

// Инициализация приложения
initApp();
