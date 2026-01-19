let gameState = {
    kills: 0,
    gold: 0,
    inventory: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
    unlockedCollectibles: [],
    artifacts: [],

    // --- ПИТОМЦЫ ---
    pets: [],
    autoDps: 0,

    // --- ХАРАКТЕРИСТИКИ ---
    clickPower: 1,      // Урон
    critChance: 0.05,   // Шанс крита (5%)
    critMultiplier: 3,  // Сила крита (x3)

    // --- ЦЕНЫ ---
    costDamage: 50,
    costChance: 150,
    costCritPower: 200
};

let currentSlime = { maxHp: 10, currentHp: 10 };
let currentLocationIndex = 0; // Индекс текущей локации (0 - Лес)
// --- АУДИО СИСТЕМА v2.0 ---
let audioSettings = {
    musicVolume: 0.3,
    sfxVolume: 0.6,
    isMuted: false
};

if (localStorage.getItem('isMuted') === 'true') {
    audioSettings.isMuted = true;
}

const sounds = {
    hit: new Audio('sounds/hit.mp3'),
    coin: new Audio('sounds/coin.mp3'),
    drop: new Audio('sounds/drop.mp3'),
    upgrade: new Audio('sounds/coin.mp3')
};

const bgMusic = new Audio('sounds/music.mp3');
bgMusic.loop = true;
bgMusic.volume = audioSettings.musicVolume;

function playSound(name) {
    if (audioSettings.isMuted) return;
    const sound = sounds[name];
    if (sound) {
        const clone = sound.cloneNode();
        clone.volume = audioSettings.sfxVolume;
        clone.play().catch(() => { });
    }
}

function toggleSound() {
    audioSettings.isMuted = !audioSettings.isMuted;
    localStorage.setItem('isMuted', audioSettings.isMuted);
    updateSoundButton();
    manageMusic();
}

function manageMusic() {
    if (audioSettings.isMuted) {
        bgMusic.pause();
    } else {
        bgMusic.play().catch(() => {
            document.addEventListener('click', startMusicOnFirstClick, { once: true });
        });
    }
}

function startMusicOnFirstClick() {
    if (!audioSettings.isMuted) {
        bgMusic.play().catch(() => { });
    }
}

function updateSoundButton() {
    const btn = document.getElementById('btnSound');
    if (btn) {
        if (audioSettings.isMuted) {
            btn.innerText = '🔇';
            btn.classList.add('muted');
        } else {
            btn.innerText = '🔊';
            btn.classList.remove('muted');
        }
    }
}

// Новая функция: Игровой цикл (срабатывает раз в секунду)
function gameLoop() {
    // 1. Логика Артефактов (Золото)
    if (gameState.artifacts.includes('a1')) {
        gameState.gold += 5;
        updateAllUI();
    }

    // 2. Логика Питомцев (Авто-урон)
    if (gameState.autoDps > 0) {
        currentSlime.currentHp -= gameState.autoDps;
        if (currentSlime.currentHp < 0) currentSlime.currentHp = 0;

        // Показываем урон (синим цветом)
        const slime = document.querySelector('.slime-img');
        const rect = slime ? slime.getBoundingClientRect() : { left: 100, top: 200 };
        // Передаем true в конце, чтобы урон был синим
        spawnDamageNumber(rect.left + 50, rect.top + 50, gameState.autoDps, false, true);

        updateGameUI();
        if (currentSlime.currentHp <= 0) onSlimeDeath();
    }
}

// --- ЗАПУСК ---
function loadGame() {
    const saved = localStorage.getItem('slimeHunterMobile_v1');
    if (saved) {
        const parsed = JSON.parse(saved);
        gameState = { ...gameState, ...parsed };

        if (parsed.inventory) {
            gameState.inventory = { ...gameState.inventory, ...parsed.inventory };
        }
    }

    // ИСПРАВЛЕНИЕ: Заполняем нулями, если чего-то нет
    rarities.forEach(r => {
        if (typeof gameState.inventory[r.id] === 'undefined') {
            gameState.inventory[r.id] = 0;
        }
    });

    // Подготовка для питомцев
    if (!gameState.pets) gameState.pets = [];
    if (!gameState.autoDps) gameState.autoDps = 0;

    // Восстановление здоровья слайма
    currentSlime.maxHp = Math.floor(10 * Math.pow(1.05, gameState.kills));
    currentSlime.currentHp = currentSlime.maxHp;

    changeSlimeSkin();
    updateAllUI();
    updateBackground();
    updateSoundButton();
    manageMusic();

    // ЗАПУСК ЦИКЛОВ:
    setInterval(gameLoop, 1000);
    setInterval(saveGame, 10000);
}

function saveGame() {
    localStorage.setItem('slimeHunterMobile_v1', JSON.stringify(gameState));
}

// --- НАВИГАЦИЯ ---
function switchTab(tabName) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    const screenId = tabName + 'Screen';
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');

    const btns = document.querySelectorAll('.nav-btn');
    if (tabName === 'game') btns[0]?.classList.add('active');
    if (tabName === 'forge') btns[1]?.classList.add('active');
    if (tabName === 'shop') btns[2]?.classList.add('active');
    if (tabName === 'collection') btns[3]?.classList.add('active');

    if (tabName === 'forge') updateForgeUI();
}

// --- БОЙ ---
function clickSlime(event) {
    playSound('hit');
    animateSlime();
    // 1. Урон
    let damage = gameState.clickPower;
    if (gameState.artifacts.includes('a3')) {
        damage *= 2;
    }

    // 2. Крит
    let isCrit = false;
    if (Math.random() < gameState.critChance) {
        damage *= gameState.critMultiplier;
        damage = Math.floor(damage);
        isCrit = true;
    }

    // 3. HP
    currentSlime.currentHp -= damage;
    if (currentSlime.currentHp < 0) currentSlime.currentHp = 0;

    // 4. Цифра
    let x = event.clientX;
    let y = event.clientY;
    spawnDamageNumber(x, y, damage, isCrit);

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
    let chanceMultiplier = 1;
    if (gameState.artifacts.includes('a2')) chanceMultiplier = 2;

    for (let item of rarities) {
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

// --- КУЗНИЦА ---
function buyDamage() {
    if (gameState.gold >= gameState.costDamage) {
        gameState.gold -= gameState.costDamage;
        gameState.clickPower += 1;
        gameState.costDamage = Math.floor(gameState.costDamage * 1.5);
        onUpgradeSuccess();
    } else alert("Не хватает золота!");
}

function buyCritChance() {
    if (gameState.critChance >= 0.50) return;
    if (gameState.gold >= gameState.costChance) {
        gameState.gold -= gameState.costChance;
        gameState.critChance += 0.02;
        gameState.costChance = Math.floor(gameState.costChance * 1.6);
        onUpgradeSuccess();
    } else alert("Не хватает золота!");
}

function buyCritPower() {
    if (gameState.gold >= gameState.costCritPower) {
        gameState.gold -= gameState.costCritPower;
        gameState.critMultiplier += 0.5;
        gameState.costCritPower = Math.floor(gameState.costCritPower * 1.7);
        onUpgradeSuccess();
    } else alert("Не хватает золота!");
}

function buyPet(petId) {
    const petDef = petsBase.find(p => p.id === petId);
    if (!petDef) return;

    if (gameState.pets.some(p => p.id === petId)) {
        alert("Этот питомец уже служит вам!");
        return;
    }

    if (gameState.gold >= petDef.cost) {
        gameState.gold -= petDef.cost;
        gameState.pets.push({ id: petId, name: petDef.name });
        gameState.autoDps += petDef.dps;
        playSound('upgrade');
        alert(`🐾 Вы приручили: ${petDef.name}! (+${petDef.dps} DPS)`);
        saveGame();
        updateAllUI();
        updateForgeUI();
    } else {
        alert("Не хватает золота!");
    }
}

function onUpgradeSuccess() {
    playSound('upgrade');
    saveGame();
    updateAllUI();
    updateForgeUI();
    if (navigator.vibrate) navigator.vibrate(50);
}

// --- ОБНОВЛЕНИЕ UI КУЗНИЦЫ (ИСПРАВЛЕНО) ---
function updateForgeUI() {
    const list = document.getElementById('upgradesList');
    if (!list) return;
    list.innerHTML = '';

    const coinIcon = '<img src="images/coin.png" style="width:14px; vertical-align:middle;">';

    // 1. Улучшения игрока
    const upgrades = [
        { id: 'dmg', name: 'Острота клинка', desc: `Урон +1 (Сейчас: ${gameState.clickPower})`, cost: gameState.costDamage, action: buyDamage },
        { id: 'chance', name: 'Меткий глаз', desc: `Крит. шанс +2% (Сейчас: ${Math.round(gameState.critChance * 100)}%)`, cost: gameState.costChance, maxed: gameState.critChance >= 0.50, action: buyCritChance },
        { id: 'power', name: 'Сокрушение', desc: `Сила крита +0.5x (Сейчас: x${gameState.critMultiplier})`, cost: gameState.costCritPower, action: buyCritPower }
    ];

    upgrades.forEach(upg => {
        const div = document.createElement('div');
        div.className = 'upgrade-item';
        let btnText = upg.maxed ? "МАКС" : `${upg.cost} ${coinIcon}`;
        let isDisabled = upg.maxed || gameState.gold < upg.cost;

        div.innerHTML = `
            <div class="upgrade-info"><h4>${upg.name}</h4><p>${upg.desc}</p></div>
            <button class="upgrade-btn" ${isDisabled ? 'disabled' : ''}>${btnText}</button>
        `;
        div.querySelector('button').onclick = () => { if (!isDisabled) upg.action(); };
        list.appendChild(div);
    });

    // 2. Питомцы
    if (typeof petsBase !== 'undefined' && petsBase.length > 0) {
        const petHeader = document.createElement('h3');
        petHeader.style.textAlign = 'center';
        petHeader.style.color = '#aaddff';
        petHeader.style.marginTop = '20px';
        petHeader.innerText = 'Зверинец 🐾';
        list.appendChild(petHeader);

        petsBase.forEach(pet => {
            const isOwned = gameState.pets.some(p => p.id === pet.id);
            const div = document.createElement('div');
            div.className = 'upgrade-item';
            if (isOwned) {
                div.style.borderColor = '#0088ff';
                div.style.background = 'linear-gradient(90deg, #001a33, #003366)';
            }
            let btnText = isOwned ? "КУПЛЕНО" : `${pet.cost} ${coinIcon}`;
            let isDisabled = isOwned || gameState.gold < pet.cost;

            div.innerHTML = `
                <div class="upgrade-info">
                    <h4 style="${isOwned ? 'color:#00ccff' : ''}">${pet.name}</h4>
                    <p style="color:#ccc">Авто-урон: ${pet.dps} DPS</p>
                    <p style="font-size:10px; color:#777">${pet.desc}</p>
                </div>
                <button class="upgrade-btn" ${isDisabled ? 'disabled' : ''} 
                    style="${isOwned ? 'background:transparent; border:1px solid #00ccff; color:#00ccff' : ''}">
                    ${btnText}
                </button>
            `;
            if (!isOwned) {
                div.querySelector('button').onclick = () => buyPet(pet.id);
            }
            list.appendChild(div);
        });
    }
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

function sellAllLoot() {
    let totalEarned = 0;
    let somethingSold = false;
    rarities.forEach(r => {
        const count = gameState.inventory[r.id];
        if (count > 0) {
            totalEarned += count * r.price;
            gameState.inventory[r.id] = 0;
            somethingSold = true;
        }
    });

    if (somethingSold) {
        gameState.gold += totalEarned;
        playSound('coin');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        saveGame();
        updateAllUI();
        alert(`💰 Вы продали всё и заработали ${totalEarned} монет!`);
    } else {
        alert("В инвентаре пусто!");
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

function performRitual() {
    if (gameState.unlockedCollectibles.length < 5) {
        alert("Соберите полную коллекцию (5 предметов)!");
        return;
    }
    const availableArtifacts = artifacts.filter(art => !gameState.artifacts.includes(art.id));
    if (availableArtifacts.length === 0) {
        alert("Вы уже собрали все Древние Артефакты!");
        return;
    }
    if (!confirm("Пожертвовать коллекцией ради Артефакта?")) return;

    gameState.unlockedCollectibles = [];
    const newArtifact = availableArtifacts[Math.floor(Math.random() * availableArtifacts.length)];
    gameState.artifacts.push(newArtifact.id);

    playSound('drop');
    alert(`⚡ РИТУАЛ ЗАВЕРШЕН! Получен: ${newArtifact.name}!`);
    saveGame();
    updateAllUI();
}

// --- UI ОБНОВЛЕНИЕ ---
function updateAllUI() {
    document.getElementById('goldCount').innerText = gameState.gold;
    updateGameUI();
    updateShopUI();
    updateCollectionUI();
}

function updateGameUI() {
    const percent = (currentSlime.currentHp / currentSlime.maxHp) * 100;
    document.getElementById('hpFill').style.width = `${percent}%`;
    document.getElementById('currentHp').innerText = Math.ceil(currentSlime.currentHp);
    document.getElementById('maxHp').innerText = currentSlime.maxHp;
    document.getElementById('killCount').innerText = gameState.kills;

    const list = document.getElementById('inventoryList');
    if (list) {
        list.innerHTML = '';
        rarities.forEach(r => {
            const count = gameState.inventory[r.id] || 0;
            const div = document.createElement('div');
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.marginBottom = "5px";
            div.className = r.class;
            const opacityStyle = count === 0 ? 'opacity: 0.5;' : '';
            div.innerHTML = `<span style="${opacityStyle}">${r.name}</span> <span style="${opacityStyle}">x${count}</span>`;
            list.appendChild(div);
        });
    }
}

function updateShopUI() {
    const list = document.getElementById('sellList');
    if (!list) return;
    list.innerHTML = '';
    rarities.forEach(r => {
        const count = gameState.inventory[r.id] || 0;
        const div = document.createElement('div');
        div.className = 'sell-row';
        const coinImg = '<img src="images/coin.png" style="width:18px; vertical-align:middle;">';
        const isDisabled = count === 0;
        div.innerHTML = `
            <span class="${r.class}" style="font-weight:bold; ${isDisabled ? 'opacity:0.6' : ''}">
                ${r.name} (x${count})
            </span>
            <button class="btn-sell" onclick="sellEgg('${r.id}')" ${isDisabled ? 'disabled' : ''} 
                    style="${isDisabled ? 'background:#555; cursor:not-allowed;' : ''}">
                +${r.price} ${coinImg}
            </button>
        `;
        list.appendChild(div);
    });
}

function updateCollectionUI() {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // Секция коллекции
    const collectionSection = document.createElement('div');
    collectionSection.style.textAlign = 'center'; collectionSection.style.width = '100%';
    collectionSection.innerHTML = `<h3 style="color: #aaddff">Коллекция Слаймов</h3>`;

    const standardContainer = document.createElement('div');
    standardContainer.className = 'collection-grid'; // Используем grid класс из CSS
    standardContainer.style.justifyContent = 'center';

    collectionItems.forEach(item => {
        const isUnlocked = gameState.unlockedCollectibles.includes(item.id);
        const div = document.createElement('div');
        div.className = `collection-item ${isUnlocked ? 'unlocked' : ''}`;

        div.style.border = isUnlocked ? "2px solid #00ffcc" : "2px solid #333";
        div.style.background = isUnlocked ? "rgba(0, 255, 204, 0.1)" : "rgba(0,0,0,0.3)";
        div.style.width = "80px";

        const iconHtml = isUnlocked ? `<img src="${item.image}" style="width: 50px; height: 50px; object-fit: contain;">` : '<span style="font-size: 30px; opacity: 0.3;">🔒</span>';
        div.innerHTML = `<div style="height: 50px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">${iconHtml}</div><div style="font-size: 10px; text-align: center; color: ${isUnlocked ? '#fff' : '#777'}">${item.name}</div>`;
        standardContainer.appendChild(div);
    });
    collectionSection.appendChild(standardContainer);
    grid.appendChild(collectionSection);

    // Кнопка ритуала
    const ritualSection = document.createElement('div');
    ritualSection.style.margin = "20px 0"; ritualSection.style.textAlign = "center";
    const canRitual = gameState.unlockedCollectibles.length >= 5;
    ritualSection.innerHTML = `<button onclick="performRitual()" style="background: linear-gradient(45deg, #ff0055, #ff00cc); border: 3px solid #fff; color: white; padding: 15px 40px; border-radius: 50px; font-weight: bold; cursor: pointer; opacity: ${canRitual ? '1' : '0.5'}; filter: ${canRitual ? 'none' : 'grayscale(1)'};">🔮 Провести Ритуал 🔮</button>`;
    grid.appendChild(ritualSection);

    // Артефакты
    const artifactSection = document.createElement('div');
    artifactSection.style.textAlign = 'center'; artifactSection.style.width = '100%';
    artifactSection.innerHTML = `<h3 style="color: #ffcc00">Древние Артефакты</h3>`;

    const artContainer = document.createElement('div');
    artContainer.className = 'collection-grid';
    artContainer.style.justifyContent = 'center';

    artifacts.forEach(art => {
        const hasArt = gameState.artifacts.includes(art.id);
        const artDiv = document.createElement('div');
        artDiv.className = `collection-item ${hasArt ? 'unlocked' : ''}`;
        artDiv.style.border = hasArt ? "2px solid #ffcc00" : "2px dashed #664400";
        artDiv.style.background = hasArt ? "rgba(255, 204, 0, 0.15)" : "rgba(0,0,0,0.2)";

        const artIcon = hasArt ? `<img src="${art.image}" style="width: 60px; height: 60px; object-fit: contain;">` : '<span style="font-size: 40px; opacity: 0.2;">❓</span>';
        artDiv.innerHTML = `<div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">${artIcon}</div><div style="font-size: 10px; color: ${hasArt ? '#ffcc00' : '#665544'}; font-weight: bold;">${art.name}</div><div style="font-size: 9px; color: #00ff00; margin-top: 2px;">${hasArt ? art.buff : ''}</div>`;
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
    if (logPanel.children.length > 5) logPanel.removeChild(logPanel.lastChild);
}

function spawnDamageNumber(x, y, amount, isCrit, isAuto = false) {
    const el = document.createElement('div');
    el.className = isCrit ? 'crit-number' : 'damage-number';

    if (isAuto) {
        el.innerText = `⚔️${amount}`;
        el.style.color = "#aaaaff";
        el.style.fontSize = "22px";
        el.style.zIndex = "50";
    } else {
        el.innerText = isCrit ? `💥-${amount}!` : `-${amount}`;
    }

    const randomX = (Math.random() - 0.5) * 40;
    el.style.left = `${x + randomX}px`;
    el.style.top = `${y - 50}px`;

    if (!isCrit && !isAuto && amount > gameState.clickPower) {
        el.style.color = "#ff3300";
        el.style.fontSize = "30px";
        el.style.fontWeight = "bold";
    }

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function changeSlimeSkin() {
    // 1. Определяем локацию по количеству убийств
    // Идем с конца, чтобы найти самую сложную открытую локацию
    let newIndex = 0;
    for (let i = locations.length - 1; i >= 0; i--) {
        if (gameState.kills >= locations[i].minKills) {
            newIndex = i;
            break;
        }
    }

    // 2. Если локация сменилась — меняем фон и пишем об этом
    if (newIndex !== currentLocationIndex) {
        currentLocationIndex = newIndex;
        updateBackground();
        // Можно добавить уведомление, если хочешь
        // alert(`Вы перешли в локацию: ${locations[newIndex].name}`); 
    }

    // 3. Берем случайный скин ИЗ ТЕКУЩЕЙ локации
    const loc = locations[currentLocationIndex];
    const randomSkin = loc.slimes[Math.floor(Math.random() * loc.slimes.length)];

    const slimeImg = document.querySelector('.slime-img');
    if (slimeImg) slimeImg.src = randomSkin;
}

// --- ЛОГИКА РАЗРАБОТЧИКА ---
let devClickCount = 0;
let devTimer = null;

function onDevSecretClick() {
    devClickCount++;
    clearTimeout(devTimer);
    devTimer = setTimeout(() => { devClickCount = 0; }, 1000);
    if (devClickCount >= 5) {
        toggleDevPanel();
        devClickCount = 0;
    }
}

function toggleDevPanel() {
    const panel = document.getElementById('devPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'flex';
    } else {
        panel.style.display = 'none';
    }
}

function devAddGold() {
    gameState.gold += 5000;
    updateAllUI();
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
}

function devAddLoot() {
    rarities.forEach(r => {
        gameState.inventory[r.id] += 10;
    });
    updateAllUI();
    alert("Лут добавлен! Иди продавай.");
}

function devReset() {
    if (confirm("Точно удалить весь прогресс?")) {
        localStorage.removeItem('slimeHunterMobile_v1');
        location.reload();
    }
}

// Запуск при старте
loadGame();

// --- ВИЗУАЛЬНЫЕ ЭФФЕКТЫ ---
function animateSlime() {
    const slime = document.querySelector('.slime-img');
    if (!slime) return;

    // Сброс анимации (магия CSS, чтобы можно было проигрывать подряд)
    slime.classList.remove('slime-hit-anim');
    void slime.offsetWidth; // Принудительная перерисовка
    slime.classList.add('slime-hit-anim');
}
function updateBackground() {
    const loc = locations[currentLocationIndex];

    // Удаляем старые классы локаций
    document.body.classList.remove('loc-forest', 'loc-fire', 'loc-ice', 'loc-dark');

    // Добавляем новый класс
    document.body.classList.add(loc.cssClass);

    // Обновляем заголовок игры (по желанию)
    const title = document.querySelector('.header h2'); // Если есть заголовок
    // Или просто в лог
    console.log("Локация:", loc.name);
}