// Настройки редкости (Шансы и цены)
const rarities = [
    { id: 'mythic', name: 'Мифическое', chance: 0.001, class: 'rarity-mythic', price: 1000 },
    { id: 'legendary', name: 'Легендарное', chance: 0.01, class: 'rarity-legendary', price: 500 },
    { id: 'epic', name: 'Эпическое', chance: 0.10, class: 'rarity-epic', price: 150 },
    { id: 'rare', name: 'Редкое', chance: 0.25, class: 'rarity-rare', price: 50 },
    { id: 'common', name: 'Обычное', chance: 0.50, class: 'rarity-common', price: 10 }
];

// Коллекционные предметы
const collectionItems = [
    // Вместо emoji: '🗡️' пишем путь к картинке:
    { id: 'c1', name: 'Ржавый Меч', image: 'images/item_sword.png' },
    { id: 'c2', name: 'Щит Новичка', image: 'images/item_shield.png' },
    { id: 'c3', name: 'Кольцо Силы', image: 'images/item_ring.png' },
    { id: 'c4', name: 'Корона Слайма', image: 'images/item_crown.png' },
    { id: 'c5', name: 'Алмаз Души', image: 'images/item_diamond.png' }
];
// Список картинок слаймов (используем ваши названия файлов)
const slimeVariants = [
    'images/slime_green.png',
    'images/slime_fire.png',
    'images/ice_fire.png',
    'images/darc_fire.png'
];
    // Новые Древние Артефакты
// В файле data.js
const artifacts = [
    {
        id: 'a1',
        name: 'Чаша Вечности',
        image: 'images/art_chalice.png',
        desc: 'Древний сосуд силы.',
        buff: '💰 +5 монет/сек'  // <--- ДОБАВИТЬ ЭТО
    },
    {
        id: 'a2',
        name: 'Книга Тайн',
        image: 'images/art_book.png',
        desc: 'Знания запретных миров.',
        buff: '🍀 Шанс лута x2' // <--- ДОБАВИТЬ ЭТО
    },
    {
        id: 'a3',
        name: 'Амулет Дракона',
        image: 'images/art_amulet.png',
        desc: 'Пылающая ярость.',
        buff: '⚔️ Урон x2'      // <--- ДОБАВИТЬ ЭТО
    }
];