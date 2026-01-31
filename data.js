// Настройки редкости (Шансы и цены)
const rarities = [
    { id: 'mythic', name: 'Мифическое', chance: 0.001, class: 'rarity-mythic', price: 1000, image: 'images/items/egg_mythic.png' },
    { id: 'legendary', name: 'Легендарное', chance: 0.01, class: 'rarity-legendary', price: 500, image: 'images/items/egg_legendary.png' },
    { id: 'epic', name: 'Эпическое', chance: 0.10, class: 'rarity-epic', price: 150, image: 'images/items/egg_epic.png' },
    { id: 'rare', name: 'Редкое', chance: 0.25, class: 'rarity-rare', price: 50, image: 'images/items/egg_rare.png' },
    { id: 'common', name: 'Обычное', chance: 0.50, class: 'rarity-common', price: 10, image: 'images/items/egg_common.png' }
];

// Коллекционные предметы
const collectionItems = [
    // Вместо emoji: '🗡️' пишем путь к картинке:
    { id: 'c1', name: 'Ржавый Меч', image: 'images/items/item_sword.png' },
    { id: 'c2', name: 'Щит Новичка', image: 'images/items/item_shield.png' },
    { id: 'c3', name: 'Кольцо Силы', image: 'images/items/item_ring.png' },
    { id: 'c4', name: 'Корона Слайма', image: 'images/items/item_crown.png' },
    { id: 'c5', name: 'Алмаз Души', image: 'images/items/item_diamond.png' }
];
// Список картинок слаймов (используем ваши названия файлов)
/* --- СИСТЕМА ЛОКАЦИЙ И СЛАЙМОВ --- */
const locations = [
    {
        id: 'forest',
        name: 'Тихий Лес',
        minKills: 0,      // С 0 убийств
        cssClass: 'loc-forest',
        slimes: [
            // Сюда впишешь свои 5 зеленых слаймов:
            'images/slimes/slime_green_1.png',
            'images/slimes/slime_green_2.png', // Замени на green_2.png
            'images/slimes/slime_green_3.png', // Замени на green_3.png
            'images/slimes/slime_green_4.png',
            'images/slimes/slime_green_5.png'
        ]
    },
    {
        id: 'fire',
        name: 'Лавовая Пещера',
        minKills: 20,     // С 20 убийств
        cssClass: 'loc-fire',
        slimes: [
            'images/slimes/slime_fire_1.png',
            'images/slimes/slime_fire_2.png', // Замени на fire_2.png
            'images/slimes/slime_fire_3.png',
            'images/slimes/slime_fire_4.png',
            'images/slimes/slime_fire_5.png'
        ]
    },
    {
        id: 'ice',
        name: 'Ледяной Пик',
        minKills: 50,     // С 50 убийств
        cssClass: 'loc-ice',
        slimes: [
            'images/slimes/ice_1.png', // Тут видимо опечатка в названии, но используем твой файл
            'images/slimes/ice_2.png',
            'images/slimes/ice_3.png',
            'images/slimes/ice_4.png',
            'images/slimes/ice_5.png'
        ]
    },
    {
        id: 'dark',
        name: 'Цитадель Тьмы',
        minKills: 100,    // С 100 убийств
        cssClass: 'loc-dark',
        slimes: [
            'images/slimes/darc_1.png',
            'images/slimes/darc_2.png',
            'images/slimes/darc_3.png',
            'images/slimes/darc_4.png',
            'images/slimes/darc_5.png'
        ]
    }
];
    // Новые Древние Артефакты
const artifacts = [
    {
        id: 'a1',
        name: 'Чаша Вечности',
        image: 'images/items/art_chalice.png',
        desc: 'Древний сосуд силы.',
        buff: '💰 +5 монет/сек',
        lore: '"Говорят, эта чаша наполняется сама собой, если владелец достаточно жаден. Слаймы боятся к ней прикасаться."'
    },
    {
        id: 'a2',
        name: 'Книга Тайн',
        image: 'images/items/art_book.png',
        desc: 'Знания запретных миров.',
        buff: '🍀 Шанс лута x2',
        lore: '"Страницы этой книги сделаны из кожи древних драконов. Прочитавший её узнает, где спрятаны самые редкие яйца."'
    },
    {
        id: 'a3',
        name: 'Амулет Дракона',
        image: 'images/items/art_amulet.png',
        desc: 'Пылающая ярость.',
        buff: '⚔️ Урон x2',
        lore: '"Он горячий на ощупь. Внутри пульсирует сердце настоящего вулкана. Наделяет владельца сокрушительной мощью."'
    }
];

// Трофеи с Боссов (по порядку локаций: Лес, Огонь, Лед, Тьма)
const bossDrops = [
    { id: 'b_forest', name: 'Сердце Леса', image: 'images/items/boss_drop_forest.png', desc: 'Живая энергия природы.' },
    { id: 'b_fire', name: 'Ядро Магмы', image: 'images/items/boss_drop_fire.png', desc: 'Обжигает руки.' },
    { id: 'b_ice', name: 'Вечный Лед', image: 'images/items/boss_drop_ice.png', desc: 'Никогда не тает.' },
    { id: 'b_dark', name: 'Череп Тьмы', image: 'images/items/boss_drop_dark.png', desc: 'Шепчет во тьме...' }
];


const petsBase = [
    {
        id: 'pet_blob',
        name: 'Слизне-кот',
        image: 'images/pets/pet_blob.png',
        cost: 500,
        dps: 2,
        // Базовые скиллы
        s1_name: 'Царапка', s1_dmg: 50, s1_cd: 10000,
        s2_name: 'Плевок', s2_dmg: 20, s2_cd: 5000,
        s3_name: 'Ярость', s3_dmg: 150, s3_cd: 20000,

        // === ЭВОЛЮЦИИ ===
        evolutions: [
            {
                id: 'evo_fire',
                name: 'Адский Кот',
                image: 'images/pets/pet_fire.png', // Нужна картинка!
                desc: 'Жжет всё вокруг.',
                dps: 5, // Увеличенный DPS
                // Новые усиленные скиллы
                s1_name: 'Огненный Коготь', s1_dmg: 100, s1_cd: 8000,
                s2_name: 'Лава', s2_dmg: 50, s2_cd: 4000,
                s3_name: 'Взрыв', s3_dmg: 400, s3_cd: 25000,
                // Цена в яйцах
                costEggs: { common: 0, rare: 5, epic: 1 }
            },
            {
                id: 'evo_ice',
                name: 'Крио-Кот',
                image: 'images/pets/pet_ice.png', // Нужна картинка!
                desc: 'Замораживает врагов.',
                dps: 4,
                // Скиллы с быстрым откатом
                s1_name: 'Сосулька', s1_dmg: 40, s1_cd: 3000,
                s2_name: 'Вьюга', s2_dmg: 30, s2_cd: 3000,
                s3_name: 'Айсберг', s3_dmg: 250, s3_cd: 15000,
                // Цена в яйцах (другая)
                costEggs: { common: 10, rare: 2, epic: 0 }
            }
        ]
    }
];

// === МАТЕРИАЛЫ ДЛЯ КРАФТА ===
const craftingMaterials = [
    // ЛЕС (Forest)
    { id: 'mat_slime', name: 'Кусок слизи', image: 'images/items/mat_slime.png', location: 'forest', chance: 0.40 }, // 40% шанс
    { id: 'mat_leaf', name: 'Магический лист', image: 'images/items/mat_leaf.png', location: 'forest', chance: 0.10 },

    // ОГОНЬ (Fire)
    { id: 'mat_ash', name: 'Вулканическое ядро', image: 'images/items/mat_ash.png', location: 'fire', chance: 0.40 },
    { id: 'mat_ember', name: 'Живой уголь', image: 'images/items/mat_ember.png', location: 'fire', chance: 0.10 },

    // ЛЕД (Ice)
    { id: 'mat_ice', name: 'Осколок льда', image: 'images/items/mat_ice.png', location: 'ice', chance: 0.40 },
    { id: 'mat_snow', name: 'Вечная снежинка', image: 'images/items/mat_snow.png', location: 'ice', chance: 0.10 },

    // ТЬМА (Dark)
    { id: 'mat_bone', name: 'Кость демона', image: 'images/items/mat_bone.png', location: 'dark', chance: 0.40 },
    { id: 'mat_shadow', name: 'Эссенция тьмы', image: 'images/items/mat_shadow.png', location: 'dark', chance: 0.10 }
];
// === РЕЦЕПТЫ ДЛЯ АЛТАРЯ ===
const recipes = [
    {
        id: 'rcp_chalice',
        name: 'Чаша Вечности',
        type: 'artifact',   // Тип создаваемого предмета
        resultId: 'a1',     // ID артефакта из списка artifacts
        desc: 'Дает +5 монет/сек',
        cost: {             // Требуемые ресурсы
            'mat_slime': 10,
            'mat_leaf': 5
        }
    },
    {
        id: 'rcp_book',
        name: 'Книга Тайн',
        type: 'artifact',
        resultId: 'a2',
        desc: 'Шанс лута x2',
        cost: {
            'mat_ash': 10,
            'mat_ember': 5
        }
    },
    {
        id: 'rcp_amulet',
        name: 'Амулет Дракона',
        type: 'artifact',
        resultId: 'a3',
        desc: 'Урон x2',
        cost: {
            'mat_bone': 20,
            'mat_shadow': 3
        }
    }
];
// === ШАБЛОНЫ ЗАДАНИЙ ГИЛЬДИИ ===
const questTemplates = [
    {
        type: 'kill',
        min: 10,
        max: 30,
        text: 'Убить {n} слаймов',
        rewardBase: 5
    },
    {
        type: 'collect',
        subtype: 'common',
        min: 3,
        max: 10,
        text: 'Найти {n} обычных яиц',
        rewardBase: 15
    },
    {
        type: 'collect',
        subtype: 'rare',
        min: 1,
        max: 5,
        text: 'Найти {n} редких яиц',
        rewardBase: 40
    },
    {
        type: 'boss',
        min: 1,
        max: 1,
        text: 'Победить Босса',
        rewardBase: 200
    }
];
// === БАЗА БОССОВ ===
const bossEnemies = [
    // ЛЕС (Forest)
    { id: 'boss_king', name: 'Король Леса', location: 'forest', image: 'images/slimes/boss_king.png' }, // Используем 5-й скин как короля
    { id: 'boss_ent', name: 'Гнилой Пень', location: 'forest', image: 'images/slimes/boss_ent.png' },

    // ОГОНЬ (Fire)
    { id: 'boss_magma', name: 'Магмовый Голем', location: 'fire', image: 'images/slimes/boss_magma.png' },
    { id: 'boss_ifrit', name: 'Ифрит', location: 'fire', image: 'images/slimes/boss_ifrit.png' },

    // ЛЕД (Ice)
    { id: 'boss_yeti', name: 'Снежный Гигант', location: 'ice', image: 'images/slimes/boss_yeti.png' },
    { id: 'boss_queen', name: 'Ледяная Королева', location: 'ice', image: 'images/slimes/boss_queen.png' },

    // ТЬМА (Dark)
    { id: 'boss_lich', name: 'Лич', location: 'dark', image: 'images/slimes/boss_lich.png' },
    { id: 'boss_void', name: 'Пустота', location: 'dark', image: 'images/slimes/boss_void.png' }
];