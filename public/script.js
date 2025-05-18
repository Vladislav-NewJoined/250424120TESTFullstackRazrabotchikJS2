
// Глобальные переменные
let currentPage = 0;
const pageSize = 20;
let isLoading = false;
let hasMoreItems = true;
let searchTimeout;
let searchQuery = localStorage.getItem('searchQuery') || '';
let itemsOrder = [];
let initialLoadComplete = false;
let totalItems = 0;

const container = document.getElementById('list-container');
const searchInput = document.getElementById('search-input');
const resetButton = document.getElementById('reset-button');
const loadingIndicator = document.getElementById('loading');
const statusMessage = document.getElementById('status-message');
const searchInfo = document.getElementById('search-info');

// Вспомогательные функции для работы с localStorage
function saveOrderToLocalStorage() {
    const newOrder = Array.from(container.querySelectorAll('.item'))
        .map(item => parseInt(item.getAttribute('data-id')));
    localStorage.setItem('itemsOrder', JSON.stringify(newOrder));
}

function saveSelectedToLocalStorage() {
    const selectedIds = Array.from(container.querySelectorAll('.item.selected'))
        .map(item => parseInt(item.getAttribute('data-id')));
    localStorage.setItem('selectedItems', JSON.stringify(selectedIds));
}

function loadOrderFromLocalStorage() {
    const savedOrder = localStorage.getItem('itemsOrder');
    return savedOrder ? JSON.parse(savedOrder) : [];
}

function loadSelectedFromLocalStorage() {
    const savedSelected = localStorage.getItem('selectedItems');
    return savedSelected ? JSON.parse(savedSelected) : [];
}

// UI функции
function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.backgroundColor = isError ? '#f44336' : '#333';
    statusMessage.classList.add('show');
    setTimeout(() => statusMessage.classList.remove('show'), 3000);
}

function updateSearchInfo() {
    if (searchQuery) {
        searchInfo.textContent = `Showing results for "${searchQuery}" (${totalItems} items found)`;
        searchInfo.style.display = 'block';
    } else {
        searchInfo.style.display = 'none';
    }
}

// Основные функции для работы с элементами
async function loadItems(page, append = true) {
    if (isLoading || (!hasMoreItems && append)) return;

    isLoading = true;
    loadingIndicator.style.display = 'block';

    try {
        const url = `/api/items?page=${page}&size=${pageSize}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to load items');

        const data = await response.json();
        totalItems = data.totalCount || 0;
        hasMoreItems = data.hasMore || false;

        updateSearchInfo();

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

            const checkbox = div.querySelector('.checkbox');
            checkbox.addEventListener('click', () => toggleItem(itemId, checkbox));

            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('dragover', handleDragOver);
            div.addEventListener('drop', handleDrop);
            div.addEventListener('dragend', handleDragEnd);

            container.appendChild(div);
        });

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

async function toggleItem(id, checkbox) {
    try {
        const response = await fetch(`/api/items/${id}/toggle`, { method: 'POST' });

        if (!response.ok) throw new Error('Failed to toggle item');

        checkbox.closest('.item').classList.toggle('selected');
        saveSelectedToLocalStorage();
    } catch (error) {
        console.error('Error toggling item:', error);
        showStatus('Error toggling item selection', true);
        checkbox.checked = !checkbox.checked;
    }
}

async function resetOrder() {
    try {
        localStorage.removeItem('itemsOrder');
        localStorage.removeItem('searchQuery');

        const response = await fetch('/api/items/reset-order', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to reset order');

        showStatus('Order has been reset');
        searchQuery = '';
        searchInput.value = '';
        currentPage = 0;
        await loadItems(currentPage, false);
    } catch (error) {
        console.error('Error resetting order:', error);
        showStatus('Error resetting order', true);
    }
}

// Drag & Drop функционал
let draggedItem = null;
let dragStartIndex = -1;

function handleDragStart(e) {
    draggedItem = this;
    dragStartIndex = Array.from(container.querySelectorAll('.item')).indexOf(draggedItem);
    draggedItem.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    container.querySelectorAll('.placeholder').forEach(p => p.remove());

    if (!draggedItem || this === draggedItem) return false;

    const rect = this.getBoundingClientRect();
    const isBelow = e.clientY - rect.top > rect.height / 2;

    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';

    this.parentNode.insertBefore(placeholder, isBelow ? this.nextSibling : this);

    return false;
}

function handleDrop(e) {
    e.stopPropagation();

    container.querySelectorAll('.placeholder').forEach(p => p.remove());

    if (!draggedItem || this === draggedItem) return false;

    const isBelow = e.clientY - this.getBoundingClientRect().top > this.offsetHeight / 2;
    const allItems = Array.from(container.querySelectorAll('.item'));
    const targetIndex = allItems.indexOf(this);
    let insertIndex = isBelow ? targetIndex + 1 : targetIndex;

    if (dragStartIndex < targetIndex) insertIndex--;

    draggedItem.remove();
    const remainingItems = Array.from(container.querySelectorAll('.item'));
    const insertBeforeElement = remainingItems[insertIndex] || null;

    container.insertBefore(draggedItem, insertBeforeElement);
    updateItemsOrder();

    return false;
}

function handleDragEnd() {
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
    }

    container.querySelectorAll('.placeholder').forEach(p => p.remove());

    draggedItem = null;
    dragStartIndex = -1;

    saveOrderToLocalStorage();
}

async function updateItemsOrder() {
    const newOrder = Array.from(container.querySelectorAll('.item'))
        .map(item => parseInt(item.getAttribute('data-id')));

    try {
        const response = await fetch('/api/items/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrder)
        });

        if (!response.ok) throw new Error('Failed to update order');

        itemsOrder = newOrder;
        saveOrderToLocalStorage();
    } catch (error) {
        console.error('Error updating order:', error);
        showStatus('Error updating item order', true);
    }
}

// Инициализация приложения
async function initApp() {
    if (searchQuery) {
        searchInput.value = searchQuery;
    }

    const savedOrder = loadOrderFromLocalStorage();
    await loadItems(0, false);

    if (savedOrder && savedOrder.length > 0) {
        const items = Array.from(container.querySelectorAll('.item'));
        const itemsMap = new Map(items.map(item => [
            parseInt(item.getAttribute('data-id')),
            item
        ]));

        container.innerHTML = '';
        savedOrder.forEach(id => {
            const item = itemsMap.get(id);
            if (item) container.appendChild(item);
        });
    }

    initialLoadComplete = true;
}

// Обработчики событий
window.addEventListener('scroll', () => {
    if (!initialLoadComplete) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoading && hasMoreItems) {
        currentPage++;
        loadItems(currentPage, true);
    }
});

searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchQuery = e.target.value.trim();
        localStorage.setItem('searchQuery', searchQuery);
        currentPage = 0;
        loadItems(currentPage, false);
    }, 300);
});

resetButton.addEventListener('click', resetOrder);

// Запуск приложения
initApp();