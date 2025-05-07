class ListItem {
  constructor(id) {
    this.id = id;
    this.displayText = `Item ${id}`;
    this.selected = false;
    this.order = id; // Добавляем поле order для сохранения порядка
  }
}
 
module.exports = ListItem;
