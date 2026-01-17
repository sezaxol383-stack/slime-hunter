let gameState = {
    kills: 0,
    gold: 0,
    inventory: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
    unlockedCollectibles: [],
    clickPower: 1
};

let currentSlime = { maxHp: 10, currentHp: 10 };

// --- ЗАПУСК ---
function loadGame() {
    const saved = localStorage.getItem('slimeHunterMobile_v1');
    if (saved) {
        gameState = { ...gameState, ...JSON.parse(saved) };
    }
    currentSlime.maxHp = Math.floor(10 * Math.pow(1.05, gameState.kills));
    currentSlime.currentHp = currentSlime.maxHp;
    updateAllUI();
}

function saveGame() {
    localStorage.setItem('slimeHunterMobile_v1', JSON.stringify(gameState));
}

// --- НАВИГАЦИЯ ---
function switchTab(tabName) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active')); // Убираем active
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    // Включаем нужный экран с помощью CSS класса
    if (tabName === 'game') document.getElementById('gameScreen').classList.add('active');
    if (tabName === 'shop') document.getElementById('shopScreen').classList.add('active');
    if (tabName === 'collection') document.getElementById('collectionScreen').classList.add('active');

    // Кнопки (индекс 0, 1, 2)
    const btns = document.querySelectorAll('.nav-btn');
    if(tabName === 'game') btns[0].classList.add('active');
    if(tabName === 'shop') btns[1].classList.add('active');
    if(tabName === 'collection') btns[2].classList.add('active');
}

// --- БОЙ ---
function clickSlime(event) {
    currentSlime.currentHp -= gameState.clickPower;
    if (currentSlime.currentHp < 0) currentSlime.currentHp = 0;
    
    // Если на телефоне (тач), event может быть неточным, ставим по центру
    let x = event.clientX;
    let y = event.clientY;
    spawnDamageNumber(x, y);
    
    updateGameUI();

    if (currentSlime.currentHp <= 0) onSlimeDeath();
}

function onSlimeDeath() {
    gameState.kills++;
    rollLoot();
    currentSlime.maxHp = Math.floor(10 * Math.pow(1.05, gameState.kills));
    currentSlime.currentHp = currentSlime.maxHp;
    saveGame();
    updateGameUI();
}

function rollLoot() {
    for (let item of rarities) {
        if (Math.random() < item.chance) {
            gameState.inventory[item.id]++;
            logEvent(`Выпало: ${item.name}!`, item.class);
            // Если игрок на телефоне, он не видит лог, можно добавить вибрацию
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
            alert(`🎉 НОВЫЙ ПРЕДМЕТ: ${item.name} ${item.emoji}!`);
        } else {
            gameState.gold += 50;
            alert(`Повторка ${item.name}. Вернули 50 монет.`);
        }
        saveGame();
        updateAllUI();
    } else {
        alert("Не хватает золота!");
    }
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

    // Обновляем инвентарь (для десктопа)
    const list = document.getElementById('inventoryList');
    if(list) {
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
    list.innerHTML = '';
    rarities.forEach(r => {
        const count = gameState.inventory[r.id];
        const div = document.createElement('div');
        div.className = 'sell-row';
        div.innerHTML = `
            <span class="${r.class}" style="font-weight:bold;">${r.name} (x${count})</span>
            <button class="btn-sell" onclick="sellEgg('${r.id}')" ${count === 0 ? 'disabled' : ''}>
                +${r.price} 🪙
            </button>
        `;
        list.appendChild(div);
    });
}

function updateCollectionUI() {
    const grid = document.getElementById('collectionGrid');
    grid.innerHTML = '';
    collectionItems.forEach(item => {
        const isUnlocked = gameState.unlockedCollectibles.includes(item.id);
        const div = document.createElement('div');
        div.className = `collection-item ${isUnlocked ? 'unlocked' : ''}`;
        div.innerHTML = `
            <div style="font-size: 30px; margin-bottom: 5px;">
                ${isUnlocked ? item.emoji : '🔒'}
            </div>
            <div style="font-size: 10px; color: ${isUnlocked ? '#fff' : '#777'}">${item.name}</div>
        `;
        grid.appendChild(div);
    });
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

function spawnDamageNumber(x, y) {
    const el = document.createElement('div');
    el.className = 'damage-number';
    el.innerText = `-${gameState.clickPower}`;
    el.style.left = `${x}px`;
    el.style.top = `${y - 50}px`; 
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// Старт
loadGame();