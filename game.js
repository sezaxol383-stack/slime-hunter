let gameState = {
    kills: 0,
    gold: 0,
    inventory: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
    unlockedCollectibles: [],
    artifacts: [], // <--- ВАЖНО: Это поле должно остаться!
    clickPower: 1
};

// ВТОРОЙ gameState Я УДАЛИЛ ОТСЮДА

let currentSlime = { maxHp: 10, currentHp: 10 };

// --- ЗВУКИ ---
const audioFiles = {
    hit: new Audio('sounds/hit.mp3'),
    coin: new Audio('sounds/coin.mp3'),
    drop: new Audio('sounds/drop.mp3')
};

function playSound(name) {
    const sound = audioFiles[name];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(err => console.log("Браузер пока не разрешил звук"));
    }
}

// --- ЗАПУСК ---
function loadGame() {
    const saved = localStorage.getItem('slimeHunterMobile_v1');
    if (saved) {
        gameState = { ...gameState, ...JSON.parse(saved) };
    }
    // Если в сохранении еще нет массива артефактов (старое сохранение), добавляем его
    if (!gameState.artifacts) {
        gameState.artifacts = [];
    }

    currentSlime.maxHp = Math.floor(10 * Math.pow(1.05, gameState.kills));
    currentSlime.currentHp = currentSlime.maxHp;
    changeSlimeSkin();
    updateAllUI();

    // --- НОВЫЙ КОД: АВТО-ЗОЛОТО (Чаша Вечности) ---
    setInterval(() => {
        if (gameState.artifacts.includes('a1')) { // Если есть Чаша
            gameState.gold += 5; // Даем 5 монет
            updateAllUI();       // Обновляем экран
        }
    }, 1000); // Каждые 1000 мс (1 секунда)
}

function saveGame() {
    localStorage.setItem('slimeHunterMobile_v1', JSON.stringify(gameState));
}

// --- НАВИГАЦИЯ ---
function switchTab(tabName) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    if (tabName === 'game') document.getElementById('gameScreen').classList.add('active');
    if (tabName === 'shop') document.getElementById('shopScreen').classList.add('active');
    if (tabName === 'collection') document.getElementById('collectionScreen').classList.add('active');

    const btns = document.querySelectorAll('.nav-btn');
    if (tabName === 'game') btns[0].classList.add('active');
    if (tabName === 'shop') btns[1].classList.add('active');
    if (tabName === 'collection') btns[2].classList.add('active');
}

// --- БОЙ ---
function clickSlime(event) {
    playSound('hit');

    // 1. Считаем урон (с учетом Амулета)
    let damage = gameState.clickPower;
    if (gameState.artifacts.includes('a3')) {
        damage *= 2;
    }

    // 2. Отнимаем здоровье
    currentSlime.currentHp -= damage;
    // (УДАЛИЛ ЛИШНЮЮ СТРОКУ, которая была здесь)

    if (currentSlime.currentHp < 0) currentSlime.currentHp = 0;

    // 3. Рисуем правильную цифру урона
    let x = event.clientX;
    let y = event.clientY;
    // ВАЖНО: передаем переменную damage третьим аргументом!
    spawnDamageNumber(x, y, damage);

    updateGameUI();

    if (currentSlime.currentHp <= 0) onSlimeDeath();
}

function onSlimeDeath() {
    gameState.kills++;
    rollLoot();
    changeSlimeSkin();
    currentSlime.maxHp = Math.floor(10 * Math.pow(1.05, gameState.kills));
    currentSlime.currentHp = currentSlime.maxHp;
    saveGame();
    updateGameUI();
}

function rollLoot() {
    // --- НОВЫЙ РАСЧЕТ ШАНСА (Книга Тайн) ---
    let chanceMultiplier = 1;
    if (gameState.artifacts.includes('a2')) { // Если есть Книга
        chanceMultiplier = 2; // Шансы x2
    }

    for (let item of rarities) {
        // Умножаем шанс предмета на наш множитель
        if (Math.random() < (item.chance * chanceMultiplier)) {
            gameState.inventory[item.id]++;
            playSound('drop');
            logEvent(`Выпало: ${item.name}!`, item.class);
            if (navigator.vibrate) navigator.vibrate(50);
            updateAllUI();
            return;
        }
    }
    logEvent("Пусто...", "");
}

// --- МАГАЗИН ---
function sellEgg(rarityId) {
    if (gameState.inventory[rarityId] > 0) {
        playSound('coin');
        gameState.inventory[rarityId]--;
        const price = rarities.find(r => r.id === rarityId).price;
        gameState.gold += price;
        saveGame();
        updateAllUI();
    }
}

function buyLootbox() {
    const cost = 100;
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        const item = collectionItems[Math.floor(Math.random() * collectionItems.length)];

        if (!gameState.unlockedCollectibles.includes(item.id)) {
            gameState.unlockedCollectibles.push(item.id);
            alert(`🎉 НОВЫЙ ПРЕДМЕТ: ${item.name}!`);
        } else {
            gameState.gold += 50;
            alert(`⚠️ Повторка: ${item.name}. Вернули 50 монет.`);
        }
        saveGame();
        updateAllUI();
    } else {
        alert("Не хватает золота!");
    }
}

// --- РИТУАЛ (НОВОЕ) ---
function performRitual() {
    // 1. Проверяем коллекцию
    if (gameState.unlockedCollectibles.length < 5) {
        alert("Соберите полную коллекцию (5 предметов), чтобы провести Ритуал!");
        return;
    }

    // 2. Проверяем доступные артефакты
    const availableArtifacts = artifacts.filter(art => !gameState.artifacts.includes(art.id));

    if (availableArtifacts.length === 0) {
        alert("Вы уже собрали все Древние Артефакты! Вы — легенда!");
        return;
    }

    // 3. Подтверждение
    if (!confirm("Вы готовы пожертвовать всей коллекцией ради получения Древнего Артефакта? Предметы исчезнут!")) {
        return;
    }

    // 4. МАГИЯ
    gameState.unlockedCollectibles = [];
    const newArtifact = availableArtifacts[Math.floor(Math.random() * availableArtifacts.length)];
    gameState.artifacts.push(newArtifact.id);

    // 5. Финал
    playSound('drop'); // Звук успеха
    alert(`⚡ РИТУАЛ ЗАВЕРШЕН! Получен артефакт: ${newArtifact.name}!`);
    saveGame();
    updateAllUI();
}

// --- UI ---
function updateAllUI() {
    document.getElementById('goldCount').innerText = gameState.gold;
    updateGameUI();
    updateShopUI();
    updateCollectionUI();
}

function updateGameUI() {
    const percent = (currentSlime.currentHp / currentSlime.maxHp) * 100;
    document.getElementById('hpFill').style.width = `${percent}%`;
    document.getElementById('currentHp').innerText = currentSlime.currentHp;
    document.getElementById('maxHp').innerText = currentSlime.maxHp;
    document.getElementById('killCount').innerText = gameState.kills;

    // Инвентарь
    const list = document.getElementById('inventoryList');
    if (list) {
        list.innerHTML = '';
        rarities.forEach(r => {
            if (gameState.inventory[r.id] > 0 || r.id === 'common') {
                const div = document.createElement('div');
                div.style.display = "flex";
                div.style.justifyContent = "space-between";
                div.style.marginBottom = "5px";
                div.className = r.class;
                div.innerHTML = `<span>${r.name}</span> <span>x${gameState.inventory[r.id]}</span>`;
                list.appendChild(div);
            }
        });
    }
}

function updateShopUI() {
    const list = document.getElementById('sellList');
    if (!list) return;

    list.innerHTML = '';
    rarities.forEach(r => {
        const count = gameState.inventory[r.id];
        const div = document.createElement('div');
        div.className = 'sell-row';

        const coinImg = '<img src="images/coin.png" style="width:18px; vertical-align:middle;">'; // Поправил размер на 18px чтобы влезало в кнопку

        div.innerHTML = `
            <span class="${r.class}" style="font-weight:bold;">${r.name} (x${count})</span>
            <button class="btn-sell" onclick="sellEgg('${r.id}')" ${count === 0 ? 'disabled' : ''}>
                +${r.price} ${coinImg}
            </button>
        `;
        list.appendChild(div);
    });
}

function updateCollectionUI() {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;

    // --- ГЛАВНАЯ НАСТРОЙКА: Всё ставим в один столбик по центру ---
    grid.style.display = 'flex';
    grid.style.flexDirection = 'column';
    grid.style.alignItems = 'center';
    grid.style.gap = '20px'; // Расстояние между этажами
    grid.innerHTML = ''; // Очистка старого

    // ============================================
    // ЭТАЖ 1: ОБЫЧНАЯ КОЛЛЕКЦИЯ
    // ============================================
    const collectionSection = document.createElement('div');
    collectionSection.style.textAlign = 'center';
    collectionSection.style.width = '100%';

    const title1 = document.createElement('h3');
    title1.innerText = "Коллекция Слаймов";
    title1.style.color = "#aaddff";
    title1.style.textShadow = "0 0 10px #0055ff";
    title1.style.marginBottom = "15px";
    collectionSection.appendChild(title1);

    const standardContainer = document.createElement('div');
    // Выстраиваем предметы в ряд (горизонтально)
    standardContainer.style.display = 'flex';
    standardContainer.style.justifyContent = 'center';
    standardContainer.style.flexWrap = 'wrap'; // Если не влезут, перенос на след. строку
    standardContainer.style.gap = '10px';

    collectionItems.forEach(item => {
        const isUnlocked = gameState.unlockedCollectibles.includes(item.id);
        const div = document.createElement('div');
        div.className = `collection-item ${isUnlocked ? 'unlocked' : ''}`;

        // Красивая рамка: зеленая если есть, серая если нет
        div.style.border = isUnlocked ? "2px solid #00ffcc" : "2px solid #333";
        div.style.background = isUnlocked ? "rgba(0, 255, 204, 0.1)" : "rgba(0,0,0,0.3)";
        div.style.width = "80px"; // Фиксированная ширина
        div.style.padding = "10px";
        div.style.borderRadius = "10px";

        const iconHtml = isUnlocked
            ? `<img src="${item.image}" style="width: 50px; height: 50px; object-fit: contain; filter: drop-shadow(0 0 5px #00ffcc);">`
            : '<span style="font-size: 30px; opacity: 0.3;">🔒</span>';

        div.innerHTML = `
            <div style="height: 50px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
                ${iconHtml}
            </div>
            <div style="font-size: 10px; text-align: center; color: ${isUnlocked ? '#fff' : '#777'}">
                ${item.name}
            </div>
        `;
        standardContainer.appendChild(div);
    });
    collectionSection.appendChild(standardContainer);
    grid.appendChild(collectionSection);


    // ============================================
    // ЭТАЖ 2: КНОПКА РИТУАЛА
    // ============================================
    const ritualSection = document.createElement('div');
    ritualSection.style.margin = "20px 0"; // Отступ сверху и снизу
    ritualSection.style.textAlign = "center";

    // Проверка: можно ли нажать (есть ли 5 предметов)
    const canRitual = gameState.unlockedCollectibles.length >= 5;

    ritualSection.innerHTML = `
        <button onclick="performRitual()" style="
            background: linear-gradient(45deg, #ff0055, #ff00cc);
            border: 3px solid #fff;
            color: white;
            padding: 15px 40px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 0 20px ${canRitual ? '#ff00cc' : 'rgba(255,0,204,0.2)'};
            transition: transform 0.2s;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: ${canRitual ? '1' : '0.5'};
            filter: ${canRitual ? 'none' : 'grayscale(1)'};
        "
        ${canRitual ? "onmouseover=\"this.style.transform='scale(1.05)'\" onmouseout=\"this.style.transform='scale(1)'\"" : ""}
        >🔮 Провести Ритуал 🔮</button>
        <div style="font-size: 12px; color: #aaa; margin-top: 10px;">
            (Нужно собрать 5 предметов)
        </div>
    `;
    grid.appendChild(ritualSection);


    // ============================================
    // ЭТАЖ 3: ДРЕВНИЕ АРТЕФАКТЫ
    // ============================================
    const artifactSection = document.createElement('div');
    artifactSection.style.textAlign = 'center';
    artifactSection.style.width = '100%';

    const title2 = document.createElement('h3');
    title2.innerText = "Древние Артефакты";
    title2.style.color = "#ffcc00";
    title2.style.textShadow = "0 0 10px #ff6600";
    title2.style.marginBottom = "15px";
    artifactSection.appendChild(title2);

    const artContainer = document.createElement('div');
    artContainer.style.display = 'flex';
    artContainer.style.justifyContent = 'center';
    artContainer.style.flexWrap = 'wrap';
    artContainer.style.gap = '15px';

    artifacts.forEach(art => {
        const hasArt = gameState.artifacts.includes(art.id);
        const artDiv = document.createElement('div');
        artDiv.className = `collection-item ${hasArt ? 'unlocked' : ''}`;

        // Золотая рамка
        artDiv.style.border = hasArt ? "2px solid #ffcc00" : "2px dashed #664400";
        artDiv.style.background = hasArt ? "rgba(255, 204, 0, 0.15)" : "rgba(0,0,0,0.2)";
        artDiv.style.width = "90px";
        artDiv.style.padding = "10px";
        artDiv.style.borderRadius = "10px";

        const artIcon = hasArt
            ? `<img src="${art.image}" style="width: 60px; height: 60px; object-fit: contain; filter: drop-shadow(0 0 10px gold);">`
            : '<span style="font-size: 40px; opacity: 0.2;">❓</span>';

        artDiv.innerHTML = `
            <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
                ${artIcon}
            </div>
            <div style="font-size: 10px; color: ${hasArt ? '#ffcc00' : '#665544'}; font-weight: bold;">
                ${art.name}
            </div>
            <div style="font-size: 9px; color: #00ff00; margin-top: 2px;">
                ${hasArt ? art.buff : ''}
            </div>
         `;
        artContainer.appendChild(artDiv);
    });
    artifactSection.appendChild(artContainer);
    grid.appendChild(artifactSection);
}

function logEvent(text, cssClass) {
    const logPanel = document.getElementById('logList');
    if (!logPanel) return;
    const entry = document.createElement('div');
    entry.style.marginBottom = "5px";
    entry.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
    entry.style.padding = "2px";
    entry.className = cssClass;
    entry.innerText = text;
    logPanel.insertBefore(entry, logPanel.firstChild);
    if (logPanel.children.length > 15) logPanel.removeChild(logPanel.lastChild);
}

function spawnDamageNumber(x, y, amount) { // <-- Добавили аргумент amount
    const el = document.createElement('div');
    el.className = 'damage-number';

    // Если amount не передан (старый вызов), берем clickPower, иначе amount
    const dmg = amount ? amount : gameState.clickPower;

    el.innerText = `-${dmg}`; // Показываем реальный урон
    el.style.left = `${x}px`;
    el.style.top = `${y - 50}px`;

    // Если урон усилен (больше обычного), сделаем цифру красной и большой
    if (dmg > gameState.clickPower) {
        el.style.color = "#ff3300";
        el.style.fontSize = "30px";
        el.style.fontWeight = "bold";
    }

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function changeSlimeSkin() {
    const randomSkin = slimeVariants[Math.floor(Math.random() * slimeVariants.length)];
    const slimeImg = document.querySelector('.slime-img');
    if (slimeImg) {
        slimeImg.src = randomSkin;
    }
}

// Старт
loadGame();