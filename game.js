
let gameState = {
    kills: 0,
    gold: 0,
    inventory: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
    unlockedCollectibles: [],
    artifacts: [],
    bossTrophies: [],
    activeQuests: [],
    questOptions: [], // Три задания на выбор в Гильдии
    activeQuest: null, // Одно выбранное задание

    // --- ПИТОМЦЫ ---
    pets: [],
    equippedPet: null,
    petCooldowns: { 1: 0, 2: 0, 3: 0 }, // Храним время окончания отката
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

// Переменные для скилла
let petSkillTimer = null;

let currentSlime = { maxHp: 10, currentHp: 10, isBoss: false };
let currentLocationIndex = 0;

// ==========================================
// === МИНИ-ИГРА: РИТУАЛ (СФЕРЫ 1-2-3) ===
// ==========================================

let ritualState = {
    active: false,
    currentStep: 1,
    timer: null,
    playerHp: 3
};

function updatePlayerHpUI() {
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((h, index) => {
        if (index < ritualState.playerHp) {
            h.classList.remove('lost');
        } else {
            h.classList.add('lost');
        }
    });
}

function startRitual() {
    if (!currentSlime.isBoss || currentSlime.currentHp <= 0 || ritualState.active) return;

    ritualState.active = true;
    ritualState.currentStep = 1;

    const layer = document.getElementById('ritualLayer');
    layer.innerHTML = '';

    const positions = [
        { x: -80, y: -80 },
        { x: 80, y: -80 },
        { x: 0, y: 100 }
    ];
    positions.sort(() => Math.random() - 0.5);

    for (let i = 1; i <= 3; i++) {
        const orb = document.createElement('div');
        orb.className = 'ritual-orb';
        orb.innerText = i;
        orb.dataset.num = i;

        orb.style.left = `calc(50% + ${positions[i - 1].x}px - 25px)`;
        orb.style.top = `calc(50% + ${positions[i - 1].y}px - 25px)`;

        orb.onclick = (e) => {
            e.stopPropagation();
            checkOrbClick(i, orb);
        };

        layer.appendChild(orb);
    }

    ritualState.timer = setTimeout(() => {
        failRitual("⏰ Время вышло!");
    }, 2500);
}

function checkOrbClick(num, orbElement) {
    if (!ritualState.active) return;

    if (num === ritualState.currentStep) {
        playSound('hit');
        orbElement.classList.add('orb-popped');
        ritualState.currentStep++;

        if (ritualState.currentStep > 3) {
            successRitual();
        }
    } else {
        orbElement.classList.add('orb-error');
        failRitual("❌ Ошибка порядка!");
    }
}

function successRitual() {
    clearTimeout(ritualState.timer);
    ritualState.active = false;
    setTimeout(() => {
        const layer = document.getElementById('ritualLayer');
        if (layer) layer.innerHTML = '';
    }, 300);

    playSound('coin');
    spawnDamageNumber(window.innerWidth / 2, window.innerHeight / 2, "COMBO!", true);
    triggerShake();

    let damage = gameState.clickPower * 10;
    if (gameState.artifacts.includes('a3')) damage *= 2;

    currentSlime.currentHp -= damage;
    if (currentSlime.currentHp < 0) currentSlime.currentHp = 0;

    updateGameUI();
    if (currentSlime.currentHp <= 0) onSlimeDeath();
}

function failRitual(reason) {
    clearTimeout(ritualState.timer);
    ritualState.active = false;

    spawnDamageNumber(window.innerWidth / 2, window.innerHeight / 2, reason, false);

    const area = document.querySelector('.main-area');
    if (area) {
        area.style.background = 'rgba(255,0,0,0.3)';
        setTimeout(() => area.style.background = 'transparent', 300);
    }

    setTimeout(() => {
        const layer = document.getElementById('ritualLayer');
        if (layer) layer.innerHTML = '';
    }, 500);

    ritualState.playerHp--;
    updatePlayerHpUI();

    if (navigator.vibrate) navigator.vibrate(200);

    if (ritualState.playerHp <= 0) {
        setTimeout(() => {
            alert("☠️ ВАС УБИЛИ! Босс восстановился.");
            currentSlime.currentHp = currentSlime.maxHp;
            ritualState.playerHp = 3;
            updatePlayerHpUI();
            updateGameUI();
        }, 100);
    }
}

function clearRitual() {
    clearTimeout(ritualState.timer);
    ritualState.active = false;
    const layer = document.getElementById('ritualLayer');
    if (layer) layer.innerHTML = '';
}

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

const musicTracks = [
    'sounds/music_forest.mp3',
    'sounds/music_fire.mp3',
    'sounds/music_ice.mp3',
    'sounds/music_dark.mp3'
];

let bgMusic = new Audio(musicTracks[0]);
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

// Игровой цикл
function gameLoop() {
    if (gameState.artifacts.includes('a1')) {
        gameState.gold += 5;
        gameState.autoDps = 0; // Сбрасываем в ноль
        if (gameState.equippedPet) {
            const pet = petsBase.find(p => p.id === gameState.equippedPet);
            if (pet) {
                gameState.autoDps = pet.dps;
            }
        }
        updateAllUI();
    }

    if (gameState.autoDps > 0) {
        currentSlime.currentHp -= gameState.autoDps;
        if (currentSlime.currentHp < 0) currentSlime.currentHp = 0;
        const slime = document.querySelector('.slime-img');
        const rect = slime ? slime.getBoundingClientRect() : { left: 100, top: 200 };
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

    if (!gameState.equippedPet) gameState.equippedPet = null;
    updatePetUI(); // Показать питомца при загрузке

    rarities.forEach(r => {
        if (typeof gameState.inventory[r.id] === 'undefined') {
            gameState.inventory[r.id] = 0;
        }
    });
    if (!gameState.pets) gameState.pets = [];
    if (!gameState.autoDps) gameState.autoDps = 0;
    if (!gameState.bossTrophies) gameState.bossTrophies = [];

    const isBossStage = (gameState.kills + 1) % 10 === 0;
    currentSlime.isBoss = isBossStage;

    let baseHp = Math.floor(10 * Math.pow(1.05, gameState.kills));
    if (isBossStage) {
        currentSlime.maxHp = baseHp * 10;
    } else {
        currentSlime.maxHp = baseHp;
    }
    currentSlime.currentHp = currentSlime.maxHp;

    let startIndex = 0;
    for (let i = locations.length - 1; i >= 0; i--) {
        if (gameState.kills >= locations[i].minKills) {
            startIndex = i;
            break;
        }
    }
    currentLocationIndex = startIndex;

    updateBackground();

    const loc = locations[currentLocationIndex];
    const randomSkin = loc.slimes[Math.floor(Math.random() * loc.slimes.length)];
    const slimeImg = document.querySelector('.slime-img');
    if (slimeImg) {
        slimeImg.src = randomSkin;
        const container = document.querySelector('.slime-container');
        if (container) {
            if (currentSlime.isBoss) {
                container.style.transform = 'translate(-50%, -50%)';
                container.style.left = '50%';
                container.style.top = '50%';
            } else {
                container.style.transform = 'none';
            }
        }
    }
    initTutorial();
    updateAllUI();
    updateSoundButton();
    bgMusic.src = musicTracks[currentLocationIndex];
    manageMusic();

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

    const container = document.querySelector('.game-container');
    const sidebar = document.querySelector('.sidebar');
    const backpackBtn = document.getElementById('btnBackpack');

    if (tabName === 'shop') {
        container.classList.add('shop-mode');
        sidebar.classList.remove('active');
        if (backpackBtn) backpackBtn.style.display = 'none';
    } else {
        container.classList.remove('shop-mode');
        if (backpackBtn) backpackBtn.style.display = 'flex';
        sidebar.classList.remove('active');
        if (backpackBtn) backpackBtn.innerText = '🎒';
    }
   
    if (tabName === 'forge') updateForgeUI();
    checkTutorialProgress('tab', tabName);
}

// --- БОЙ ---
function clickSlime(event) {
    playSound('hit');
    animateSlime();
    spawnParticles(event.clientX, event.clientY);
    let damage = gameState.clickPower;
    if (gameState.artifacts.includes('a3')) {
        damage *= 2;
    }

    let isCrit = false;
    if (Math.random() < gameState.critChance) {
        damage *= gameState.critMultiplier;
        damage = Math.floor(damage);
        isCrit = true;
        triggerShake();
    }

    currentSlime.currentHp -= damage;
    if (currentSlime.currentHp < 0) currentSlime.currentHp = 0;

    spawnDamageNumber(event.clientX, event.clientY, damage, isCrit);
    updateGameUI();

    if (currentSlime.currentHp <= 0) onSlimeDeath();

    checkTutorialProgress('click', 1);
}

function onSlimeDeath() {
    checkTutorialProgress('kill', 1);
    checkQuestProgress('kill', 1);
    if (window.bossAttackInterval) clearInterval(window.bossAttackInterval);

    clearRitual();
    if (typeof ritualState !== 'undefined') ritualState.active = false;

    if (currentSlime.isBoss) {
        checkQuestProgress('boss', 1);
        playSound('coin');

        let eggCount = 3;
        let lootMessage = "Лут: 3 яйца";

        if (currentLocationIndex < bossDrops.length) {
            const drop = bossDrops[currentLocationIndex];
            if (!gameState.bossTrophies.includes(drop.id)) {
                gameState.bossTrophies.push(drop.id);
                alert(`👑 ПОБЕДА НАД БОССОМ! Получен трофей: ${drop.name}!`);
                lootMessage = "Лут: Трофей + 3 яйца";
            } else {
                eggCount = 5;
                spawnDamageNumber(window.innerWidth / 2, window.innerHeight / 2, "БОНУС: 5 ЯИЦ!", true);
                lootMessage = "Лут: 5 яиц (Бонус за повтор)";
            }
        }

        for (let i = 0; i < eggCount; i++) {
            let rand = Math.random();
            let eggType = 'common';
            if (rand > 0.6) eggType = 'rare';
            if (rand > 0.9) eggType = 'epic';
            gameState.inventory[eggType]++;
        }

        logEvent(`Босс повержен! ${lootMessage}`, 'rarity-legendary');

        const bonusGold = 50 + (gameState.kills * 2);
        gameState.gold += bonusGold;
        flyCoins(window.innerWidth / 2, window.innerHeight / 2, bonusGold);
    }

    gameState.kills++;
    if (!currentSlime.isBoss) {
        rollLoot();
    }

    const isNextBoss = (gameState.kills + 1) % 10 === 0;
    currentSlime.isBoss = isNextBoss;

    let baseHp = Math.floor(10 * Math.pow(1.05, gameState.kills));
    currentSlime.maxHp = isNextBoss ? baseHp * 10 : baseHp;
    currentSlime.currentHp = currentSlime.maxHp;

    saveGame();
    updateAllUI();

    changeSlimeSkin();
    respawnSlime();
    if (navigator.vibrate) navigator.vibrate(50);
}

function rollLoot() {
    if (tutorialState.isActive && tutorialState.step === 2) {
        gameState.inventory['common']++;
        logEvent("Обучение: Найдено яйцо!", 'rarity-common');
        playSound('drop');
        updateAllUI();
        // Засчитываем прогресс обучения (будто убили 100 слаймов сразу, чтобы завершить шаг)
        tutorialState.progress = 100;
        advanceTutorial();
        return;
    }
    let chanceMultiplier = 1;
    if (gameState.artifacts.includes('a2')) chanceMultiplier = 2;

    for (let item of rarities) {
        if (Math.random() < (item.chance * chanceMultiplier)) {
            gameState.inventory[item.id]++;
            checkQuestProgress('collect', item.id);
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
    checkTutorialProgress('upgrade_dmg', 1);
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

        // УДАЛИ ИЛИ ЗАКОММЕНТИРУЙ ЭТУ СТРОКУ:
        // gameState.autoDps += petDef.dps; <--- ВОТ ЭТО БЫЛА ОШИБКА

        playSound('upgrade');
        alert(`🐾 Вы приручили: ${petDef.name}! (Наденьте его в Кузнице)`); // Чуть поменял текст
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

function updateForgeUI() {
    const list = document.getElementById('upgradesList');
    if (!list) return;
    list.innerHTML = '';

    const coinIcon = '<img src="images/ui/coin.png" style="width:14px; vertical-align:middle;">';

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

    if (typeof petsBase !== 'undefined' && petsBase.length > 0) {
        const petHeader = document.createElement('h3');
        petHeader.style.textAlign = 'center';
        petHeader.style.color = '#aaddff';
        petHeader.style.marginTop = '20px';
        petHeader.innerText = 'Зверинец 🐾';
        list.appendChild(petHeader);

        // ... внутри updateForgeUI ...
        petsBase.forEach(pet => {
            // Ищем питомца в сохранениях игрока
            const ownedData = gameState.pets.find(p => p.id === pet.id);
            const isOwned = !!ownedData;
            const isEquipped = gameState.equippedPet === pet.id;

            // Определяем текущее имя и картинку (если эволюционировал)
            let displayImg = pet.image;
            let displayName = pet.name;
            let displayDps = pet.dps;

            // Если куплен и эволюционировал — подменяем данные для отображения
            if (ownedData && ownedData.evolutionId) {
                const evo = pet.evolutions.find(e => e.id === ownedData.evolutionId);
                if (evo) {
                    displayImg = evo.image;
                    displayName = evo.name;
                    displayDps = evo.dps;
                }
            }

            const div = document.createElement('div');
            div.className = 'upgrade-item';

            // Стили рамок
            if (isEquipped) {
                div.style.border = '2px solid #ffd700';
                div.style.background = 'linear-gradient(90deg, #332200, #664400)';
            } else if (isOwned) {
                div.style.borderColor = '#0088ff';
                div.style.background = 'linear-gradient(90deg, #001a33, #003366)';
            }

            // Текст кнопки
            let btnText = `${pet.cost} ${coinIcon}`;
            let mainAction = () => buyPet(pet.id);

            if (isOwned) {
                btnText = isEquipped ? "СНЯТЬ" : "НАДЕТЬ";
                mainAction = () => equipPet(pet.id);
            }

            let isDisabled = !isOwned && gameState.gold < pet.cost;

            // === ЛОГИКА КНОПКИ ЭВОЛЮЦИИ ===
            let evoHtml = '';
            // Показываем кнопку только если: Куплен + НЕ надет + Есть доступные эволюции
            if (isOwned && !isEquipped && pet.evolutions && pet.evolutions.length > 0) {
                if (ownedData.evolutionId) {
                    // Если уже эволюционировал - кнопка Сброса
                    evoHtml = `<button class="btn-reset-evo" onclick="resetEvolution('${pet.id}')">↺ Сброс (5000)</button>`;
                } else {
                    // Если нет - кнопка Эволюции
                    evoHtml = `<button onclick="openEvoModal('${pet.id}')" style="background:#ff00cc; border:none; color:white; border-radius:4px; padding:5px; margin-top:5px; cursor:pointer; font-size:12px;">🧬 Эволюция</button>`;
                }
            } else if (isOwned && isEquipped && pet.evolutions && pet.evolutions.length > 0) {
                evoHtml = `<span style="font-size:10px; color:#777;">Снимите для эволюции</span>`;
            }

            div.innerHTML = `
            <div class="upgrade-info" style="display:flex; align-items:center; gap:10px;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <img src="${displayImg}" style="width:40px; height:40px; object-fit:contain;">
                </div>
                <div>
                    <h4 style="${isOwned ? 'color:#00ccff' : ''}">${displayName}</h4>
                    <p style="color:#ccc; font-size:11px;">DPS: ${displayDps}</p>
                    ${evoHtml}
                </div>
            </div>
            <button class="upgrade-btn" ${isDisabled ? 'disabled' : ''} 
                style="${isEquipped ? 'background:#ffd700; color:#000' : (isOwned ? 'background:#0088ff; color:#fff' : '')}">
                ${btnText}
            </button>
        `;

            // Вешаем клик на главную кнопку
            div.querySelector('.upgrade-btn').onclick = mainAction;
            list.appendChild(div);
        });
    }
}

// === ЛОГИКА ПИТОМЦЕВ ===

// Надевание питомца
function equipPet(petId) {
    if (gameState.equippedPet === petId) {
        gameState.equippedPet = null;
        gameState.autoDps = 0;
    } else {
        gameState.equippedPet = petId;
        // ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ
        const stats = getCurrentPetStats(petId);
        if (stats) {
            gameState.autoDps = stats.dps;
        }
    }
    saveGame();
    updatePetUI();
    updateForgeUI();
}
// Получает актуальные данные питомца (с учетом эволюции)
function getCurrentPetStats(petId) {
    const baseDef = petsBase.find(p => p.id === petId);
    if (!baseDef) return null;

    // Ищем купленного питомца в инвентаре игрока
    const ownedPet = gameState.pets.find(p => p.id === petId);

    // Если есть эволюция - ищем её статы
    if (ownedPet && ownedPet.evolutionId) {
        const evoDef = baseDef.evolutions.find(e => e.id === ownedPet.evolutionId);
        if (evoDef) return { ...evoDef, baseId: baseDef.id }; // Возвращаем статы эволюции
    }

    // Если нет эволюции - возвращаем базу
    return baseDef;
}

// 1. Обновление интерфейса (Панель слева)
function updatePetUI() {
    const panel = document.getElementById('petPanel');
    const img = document.getElementById('sidebarPetImg');
    const title = document.getElementById('petNameTitle');

    if (!gameState.equippedPet) {
        if (panel) panel.style.display = 'none';
        return;
    }

    // ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ
    const stats = getCurrentPetStats(gameState.equippedPet);

    if (stats && panel) {
        panel.style.display = 'block';
        img.src = stats.image;
        title.innerText = stats.name;
    }
}


// === ЛОГИКА СКИЛЛОВ ПИТОМЦА (v2.0) ===

function activatePetSkill(slot) {
    if (!gameState.equippedPet) return;
    const now = Date.now();
    if (gameState.petCooldowns[slot] > now) return;

    // ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ
    const stats = getCurrentPetStats(gameState.equippedPet);
    if (!stats) return;

    let dmg = 0;
    let cd = 0;

    // Теперь берем статы из stats (которые могут быть эволюционировавшими)
    if (slot === 1) {
        dmg = stats.s1_dmg;
        cd = stats.s1_cd;
    } else if (slot === 2) {
        dmg = stats.s2_dmg;
        cd = stats.s2_cd;
    } else if (slot === 3) {
        dmg = stats.s3_dmg;
        cd = stats.s3_cd;
    }

    if (!dmg) return;

    let finalDmg = dmg * gameState.clickPower;
    currentSlime.currentHp -= finalDmg;
    if (currentSlime.currentHp < 0) currentSlime.currentHp = 0;

    playSound('hit');
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2);

    // Пишем, какой скилл сработал (название тоже берем из stats)
    const skillName = slot === 1 ? stats.s1_name : (slot === 2 ? stats.s2_name : stats.s3_name);
    spawnDamageNumber(window.innerWidth / 2, window.innerHeight / 2 - 80, `${skillName}: ${Math.floor(finalDmg)}!`, true);

    updateGameUI();
    if (currentSlime.currentHp <= 0) onSlimeDeath();

    startSkillCooldown(slot, cd);
}

function startSkillCooldown(slot, duration) {
    const now = Date.now();
    gameState.petCooldowns[slot] = now + duration;

    const overlay = document.getElementById(`skillCd${slot}`);
    const timerText = document.getElementById(`skillTimer${slot}`);
    const btn = document.getElementById(`skillSlot${slot}`);

    if (!overlay || !timerText) return;

    overlay.style.display = 'block';
    timerText.style.display = 'block';
    if (btn) btn.style.cursor = 'not-allowed';

    // Анимация "Часов" через requestAnimationFrame
    const updateFrame = () => {
        const timeLeft = gameState.petCooldowns[slot] - Date.now();

        if (timeLeft <= 0) {
            // Готово!
            overlay.style.display = 'none';
            timerText.style.display = 'none';
            if (btn) btn.style.cursor = 'pointer';

            // Вспышка готовности
            if (btn) {
                btn.style.filter = 'brightness(1.5)';
                setTimeout(() => btn.style.filter = 'none', 200);
            }
            return;
        }

        // Считаем процент (от 100% до 0%)
        const percent = (timeLeft / duration) * 100;

        // Обновляем "пирог" (conic-gradient)
        // Прозрачное идет от 0% до X%, а темное занимает остальное
        overlay.style.background = `conic-gradient(transparent ${100 - percent}%, rgba(0,0,0,0.8) 0)`;

        // Обновляем цифру (округляем до десятых, если меньше 1 сек, иначе целые)
        const seconds = (timeLeft / 1000);
        timerText.innerText = seconds > 1 ? Math.ceil(seconds) : seconds.toFixed(1);

        requestAnimationFrame(updateFrame);
    };

    requestAnimationFrame(updateFrame);
}

function animatePetIcon() {
    const sidebarImg = document.getElementById('sidebarPetImg');
    if (sidebarImg) {
        sidebarImg.classList.remove('pet-attack-sidebar');
        void sidebarImg.offsetWidth;
        sidebarImg.classList.add('pet-attack-sidebar');
    }
}


function sellEgg(rarityId) {
    if (gameState.inventory[rarityId] > 0) {
        // Логика кнопки для анимации вылета
        const btn = event.currentTarget; // Получаем кнопку, на которую нажали
        const rect = btn.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        // 1. Сразу списываем яйцо и обновляем интерфейс
        gameState.inventory[rarityId]--;
        const price = rarities.find(r => r.id === rarityId).price;
        gameState.gold += price;

        // МГНОВЕННОЕ ОБНОВЛЕНИЕ:
        saveGame();
        updateAllUI();
        checkTutorialProgress('sell_egg', 1);

        // 2. Запускаем анимацию и звук параллельно (для красоты)
        playSound('coin');
        flyCoins(startX, startY, price);
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
        const btn = document.querySelector('.btn-sell-all');
        const rect = btn ? btn.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };

        gameState.gold += totalEarned;

        // МГНОВЕННОЕ ОБНОВЛЕНИЕ:
        logEvent(`Продано всё на ${totalEarned} монет!`, 'rarity-legendary');
        saveGame();
        updateAllUI();

        // Анимация летит следом
        playSound('coin');
        flyCoins(rect.left + rect.width / 2, rect.top, totalEarned);
    } else {
        if (navigator.vibrate) navigator.vibrate(50);
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
    checkTutorialProgress('buy_lootbox', 1);
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
    checkTutorialProgress('perform_ritual', 1);
}

// --- UI ОБНОВЛЕНИЕ ---
function updateAllUI() {
    document.getElementById('goldCount').innerText = gameState.gold;
    updateGameUI();
    updateShopUI();
    updateCollectionUI();
    updateQuestUI();
    updateSidebarQuestUI();
}

function updateGameUI() {
    const percent = (currentSlime.currentHp / currentSlime.maxHp) * 100;
    document.getElementById('hpFill').style.width = `${percent}%`;
    document.getElementById('currentHp').innerText = Math.ceil(currentSlime.currentHp);
    document.getElementById('maxHp').innerText = currentSlime.maxHp;
    document.getElementById('killCount').innerText = gameState.kills;

    // --- ОБНОВЛЕНИЕ ИНВЕНТАРЯ В ШАПКЕ ---
    const headerInv = document.getElementById('headerInventory');
    if (headerInv) {
        headerInv.innerHTML = '';

        // Разворачиваем, чтобы Common был первым
        const reversedRarities = [...rarities].reverse();

        reversedRarities.forEach(r => {
            const count = gameState.inventory[r.id] || 0;

            const div = document.createElement('div');
            // Если 0, добавляем класс empty (скроет на телефоне)
            div.className = `egg-counter ${count === 0 ? 'empty' : ''}`;

            // ВСТАВЛЯЕМ КАРТИНКУ
            // Если картинки нет, сработает onerror и покажет 🥚
            div.innerHTML = `
                <img src="${r.image}" class="egg-icon-img" onerror="this.style.display='none'; this.parentNode.insertAdjacentHTML('afterbegin', '🥚')">
                <span class="header-count">${count}</span>
            `;

            headerInv.appendChild(div);
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
        const coinImg = '<img src="images/ui/coin.png" style="width:18px; vertical-align:middle;">';
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

    const bossSection = document.createElement('div');
    bossSection.style.textAlign = 'center';
    bossSection.style.width = '100%';
    bossSection.innerHTML = `<h3 style="color: #ff3333; text-transform: uppercase;">💀 Трофеи Боссов 💀</h3>`;

    const bossContainer = document.createElement('div');
    bossContainer.className = 'collection-grid';
    bossContainer.style.justifyContent = 'center';

    bossDrops.forEach(item => {
        const isUnlocked = gameState.bossTrophies && gameState.bossTrophies.includes(item.id);
        const div = document.createElement('div');
        div.className = `collection-item ${isUnlocked ? 'unlocked' : ''}`;
        div.style.borderColor = isUnlocked ? "#ff3333" : "#333";
        div.style.background = isUnlocked ? "rgba(255, 50, 50, 0.15)" : "rgba(0,0,0,0.3)";

        const iconHtml = isUnlocked ?
            `<img src="${item.image}" style="width: 50px; height: 50px; object-fit: contain;">` :
            '<span style="font-size: 30px; opacity: 0.3;">👹</span>';

        div.innerHTML = `
            <div style="height: 50px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">${iconHtml}</div>
            <div style="font-size: 10px; text-align: center; color: ${isUnlocked ? '#fff' : '#777'}">${item.name}</div>
        `;
        bossContainer.appendChild(div);
    });
    bossSection.appendChild(bossContainer);
    grid.appendChild(bossSection);

    const collectionSection = document.createElement('div');
    collectionSection.style.textAlign = 'center'; collectionSection.style.width = '100%';
    collectionSection.innerHTML = `<h3 style="color: #aaddff">Коллекция Слаймов</h3>`;

    const standardContainer = document.createElement('div');
    standardContainer.className = 'collection-grid';
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

    const ritualSection = document.createElement('div');
    ritualSection.style.margin = "20px 0"; ritualSection.style.textAlign = "center";
    const canRitual = gameState.unlockedCollectibles.length >= 5;
    ritualSection.innerHTML = `<button onclick="performRitual()" style="background: linear-gradient(45deg, #ff0055, #ff00cc); border: 3px solid #fff; color: white; padding: 15px 40px; border-radius: 50px; font-weight: bold; cursor: pointer; opacity: ${canRitual ? '1' : '0.5'}; filter: ${canRitual ? 'none' : 'grayscale(1)'};">🔮 Провести Ритуал 🔮</button>`;
    grid.appendChild(ritualSection);

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
        // ДОБАВЛЯЕМ ONCLICK:
        if (hasArt) {
            artDiv.onclick = () => showArtifactLore(art.id);
            artDiv.style.cursor = "pointer";
        }
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
    let newIndex = 0;
    for (let i = locations.length - 1; i >= 0; i--) {
        if (gameState.kills >= locations[i].minKills) {
            newIndex = i;
            break;
        }
    }

    if (newIndex !== currentLocationIndex) {
        let videoPath = 'video/transition.mp4';
        if (newIndex === 1) videoPath = 'video/trans_fire.mp4';
        if (newIndex === 2) videoPath = 'video/trans_ice.mp4';
        if (newIndex === 3) videoPath = 'video/trans_dark.mp4';

        playTransition(videoPath, () => {
            currentLocationIndex = newIndex;
            updateBackground();
            changeMusic(newIndex);

            const newLoc = locations[newIndex];
            const firstSlimeOfNewRegion = newLoc.slimes[0];

            const slimeImg = document.querySelector('.slime-img');
            if (slimeImg) {
                slimeImg.src = firstSlimeOfNewRegion;
                const container = document.querySelector('.slime-container');
                if (container) {
                    container.style.transform = 'translate(-50%, -50%)';
                    container.style.left = '50%';
                    container.style.top = '50%';
                }
            }
        });

    } else {
        const loc = locations[currentLocationIndex];
        const randomSkin = loc.slimes[Math.floor(Math.random() * loc.slimes.length)];
        const slimeImg = document.querySelector('.slime-img');
        if (slimeImg) slimeImg.src = randomSkin;
    }

    const slimeImg = document.querySelector('.slime-img');
    const bossLabel = document.getElementById('bossLabel');
    const hpBar = document.getElementById('hpFill');
    const hpContainer = document.getElementById('playerHpContainer');

    if (currentSlime.isBoss) {
        if (slimeImg) slimeImg.classList.add('boss');
        if (bossLabel) bossLabel.style.display = 'block';
        if (hpBar) hpBar.classList.add('boss-hp');

        if (hpContainer) hpContainer.style.display = 'block';

        ritualState.playerHp = 3;
        updatePlayerHpUI();

        if (window.bossAttackInterval) clearInterval(window.bossAttackInterval);
        window.bossAttackInterval = setInterval(() => {
            startRitual();
        }, 4000);

    } else {
        if (slimeImg) slimeImg.classList.remove('boss');
        if (bossLabel) bossLabel.style.display = 'none';
        if (hpBar) hpBar.classList.remove('boss-hp');

        if (hpContainer) hpContainer.style.display = 'none';
        if (window.bossAttackInterval) clearInterval(window.bossAttackInterval);

        clearRitual();
        ritualState.active = false;
    }
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
    gameState.gold += 500000;
    updateAllUI();
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
}

function devUnlockCollections() {
    // Принудительно прописываем все 5 ID предметов
    gameState.unlockedCollectibles = ['c1', 'c2', 'c3', 'c4', 'c5'];

    alert("✨ Вся коллекция добавлена! Можно проводить Ритуал.");
    saveGame();
    updateAllUI();
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

// --- ВИЗУАЛЬНЫЕ ЭФФЕКТЫ ---
function animateSlime() {
    const slime = document.querySelector('.slime-img');
    if (!slime) return;
    slime.classList.remove('slime-hit-anim');
    slime.classList.remove('boss-hit-anim');
    void slime.offsetWidth;

    if (currentSlime.isBoss) {
        slime.classList.add('boss-hit-anim');
    } else {
        slime.classList.add('slime-hit-anim');
    }
}

function updateBackground() {
    const loc = locations[currentLocationIndex];
    document.body.classList.remove('loc-forest', 'loc-fire', 'loc-ice', 'loc-dark');
    document.body.classList.add(loc.cssClass);
}

function toggleBackpack() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
    const btn = document.getElementById('btnBackpack');
    if (sidebar.classList.contains('active')) {
        btn.innerText = '❌';
    } else {
        btn.innerText = '🎒';
    }
}

function toggleMenu() {
    const menu = document.getElementById('dropdownMenu');
    menu.classList.toggle('show');
}

function selectMobileTab(tabName) {
    switchTab(tabName);
    toggleMenu();
}

document.addEventListener('click', function (event) {
    const menu = document.getElementById('dropdownMenu');
    const btn = document.querySelector('.menu-btn');
    if (!menu.contains(event.target) && !btn.contains(event.target) && menu.classList.contains('show')) {
        menu.classList.remove('show');
    }
});

function respawnSlime() {
    const container = document.querySelector('.slime-container');
    const area = document.querySelector('.main-area');

    if (!container || !area) return;

    // Сбрасываем стили перед расчетом
    container.style.transform = 'none';

    // Если босс - всегда центр
    if (currentSlime.isBoss) {
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        return;
    }

    // Получаем размеры зоны боя
    const areaRect = area.getBoundingClientRect();

    // Размеры самого слайма (примерно 150-180px, но лучше брать с запасом для телефона)
    // На телефоне слаймы должны быть чуть меньше
    const isMobile = window.innerWidth < 768;
    const slimeSize = isMobile ? 120 : 180;

    // Отступы, чтобы не прилипал к краям
    const padding = 20;
    // Верхний отступ (чтобы не залез на HP бар и шапку)
    const topOffset = isMobile ? 150 : 100;
    // Нижний отступ (чтобы не залез на скиллы питомца)
    const bottomOffset = isMobile ? 160 : 50;

    // Расчет безопасной зоны
    const safeWidth = areaRect.width - slimeSize - (padding * 2);
    const safeHeight = areaRect.height - slimeSize - topOffset - bottomOffset;

    // Защита от отрицательных значений (если экран слишком маленький)
    const maxX = Math.max(0, safeWidth);
    const maxY = Math.max(0, safeHeight);

    const randomX = Math.random() * maxX + padding;
    const randomY = Math.random() * maxY + topOffset;

    container.style.left = `${randomX}px`;
    container.style.top = `${randomY}px`;
}

function devModKills(amount) {
    gameState.kills += amount;
    if (gameState.kills < 0) gameState.kills = 0;

    const isNextBoss = (gameState.kills + 1) % 10 === 0;
    currentSlime.isBoss = isNextBoss;

    let baseHp = Math.floor(10 * Math.pow(1.05, gameState.kills));
    if (isNextBoss) {
        currentSlime.maxHp = baseHp * 10;
    } else {
        currentSlime.maxHp = baseHp;
    }
    currentSlime.currentHp = currentSlime.maxHp;

    changeSlimeSkin();
    respawnSlime();
    saveGame();
    updateAllUI();

    if (navigator.vibrate) navigator.vibrate(50);
}

function changeMusic(locationIndex) {
    if (audioSettings.isMuted) {
        bgMusic.src = musicTracks[locationIndex];
        return;
    }
    let fadeOut = setInterval(() => {
        if (bgMusic.volume > 0.05) {
            bgMusic.volume -= 0.05;
        } else {
            clearInterval(fadeOut);
            bgMusic.pause();
            bgMusic.src = musicTracks[locationIndex];
            bgMusic.play().catch(() => { });
            bgMusic.volume = audioSettings.musicVolume;
        }
    }, 100);
}

// ==========================================
// === СИСТЕМА ПЕРЕХОДОВ И ВИДЕО ===
// ==========================================

let transitionTimer = null;
let transitionCallback = null;

function playTransition(videoFile, callback) {
    const layer = document.getElementById('transitionLayer');
    const video = document.getElementById('transVideo');

    if (!layer || !video) {
        if (callback) callback();
        return;
    }

    video.src = videoFile;
    transitionCallback = callback;
    layer.classList.add('active');
    video.load();
    video.play().catch(e => console.log("Video error:", e));

    transitionTimer = setTimeout(() => {
        if (transitionCallback) {
            transitionCallback();
            transitionCallback = null;
        }
    }, 1500);

    video.onended = () => {
        closeTransition();
    };
}

function skipTransition() {
    if (transitionCallback) {
        transitionCallback();
        transitionCallback = null;
    }
    closeTransition();
}

function closeTransition() {
    const layer = document.getElementById('transitionLayer');
    const video = document.getElementById('transVideo');

    if (transitionTimer) clearTimeout(transitionTimer);
    if (video) video.pause();
    if (layer) layer.classList.remove('active');
}

// ==========================================
// === GAME JUICE ФУНКЦИИ ===
// ==========================================

function triggerShake() {
    const area = document.querySelector('.main-area');
    if (area) {
        area.classList.remove('shake-effect');
        void area.offsetWidth;
        area.classList.add('shake-effect');
        if (navigator.vibrate) navigator.vibrate(50);
    }
}

function spawnParticles(x, y) {
    let particleImage = 'images/fx/part_forest.png';
    if (currentLocationIndex === 1) particleImage = 'images/fx/part_fire.png';
    if (currentLocationIndex === 2) particleImage = 'images/fx/part_ice.png';
    if (currentLocationIndex === 3) particleImage = 'images/fx/part_dark.png';

    const particleCount = 8 + Math.random() * 5;

    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'slime-particle';
        p.style.backgroundImage = `url('${particleImage}')`;
        p.style.backgroundSize = 'contain';
        p.style.backgroundRepeat = 'no-repeat';
        p.style.backgroundPosition = 'center';
        p.style.backgroundColor = 'transparent';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        const size = 15 + Math.random() * 20;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        document.body.appendChild(p);

        const velocityX = (Math.random() - 0.5) * 400;
        const velocityY = (Math.random() - 1.2) * 250;
        const rotation = (Math.random() - 0.5) * 360;

        const anim = p.animate([
            { transform: 'translate(0, 0) rotate(0deg) scale(0.5)', opacity: 1 },
            { transform: `translate(${velocityX * 0.5}px, ${velocityY * 0.5}px) rotate(${rotation * 0.5}deg) scale(1.2)`, opacity: 1, offset: 0.4 },
            { transform: `translate(${velocityX}px, ${velocityY + 150}px) rotate(${rotation}deg) scale(0)`, opacity: 0 }
        ], {
            duration: 700 + Math.random() * 400,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            fill: 'forwards'
        });

        anim.onfinish = () => p.remove();
    }
}

function flyCoins(startX, startY, amount, callback) {
    const target = document.querySelector('.gold-display');
    if (!target) {
        if (callback) callback();
        return;
    }

    const targetRect = target.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    const coinsCount = Math.min(5, Math.max(1, Math.floor(amount / 10)));

    for (let i = 0; i < coinsCount; i++) {
        setTimeout(() => {
            const coin = document.createElement('img');
            coin.src = 'images/ui/coin.png';
            coin.className = 'flying-coin';
            coin.style.left = startX + 'px';
            coin.style.top = startY + 'px';
            const randomOffsetX = (Math.random() - 0.5) * 30;
            const randomOffsetY = (Math.random() - 0.5) * 30;
            coin.style.transform = `translate(${randomOffsetX}px, ${randomOffsetY}px)`;
            document.body.appendChild(coin);

            requestAnimationFrame(() => {
                const deltaX = targetX - (startX + randomOffsetX);
                const deltaY = targetY - (startY + randomOffsetY);
                coin.style.transition = `all 0.6s ease-in`;
                coin.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.5)`;
                coin.style.opacity = 0;
            });

            setTimeout(() => {
                coin.remove();
                if (i === coinsCount - 1 && callback) callback();
            }, 600);

        }, i * 100);
    }
}
function spawnScratchEffect() {
    // Временная заглушка или твоя анимация царапины
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2);
}
// === СИСТЕМА ЭВОЛЮЦИИ ===

function openEvoModal(petId) {
    const pet = petsBase.find(p => p.id === petId);
    if (!pet) return;

    const modal = document.getElementById('evoModal');
    const container = document.getElementById('evoChoicesContainer');
    container.innerHTML = ''; // Очистка

    pet.evolutions.forEach((evo, index) => {
        // Проверка цены
        let costStr = '';
        let canAfford = true;

        if (evo.costEggs.common > 0) {
            costStr += `🥚 Обычные: ${evo.costEggs.common}<br>`;
            if (gameState.inventory.common < evo.costEggs.common) canAfford = false;
        }
        if (evo.costEggs.rare > 0) {
            costStr += `🥚 Редкие: ${evo.costEggs.rare}<br>`;
            if (gameState.inventory.rare < evo.costEggs.rare) canAfford = false;
        }
        if (evo.costEggs.epic > 0) {
            costStr += `🥚 Эпик: ${evo.costEggs.epic}<br>`;
            if (gameState.inventory.epic < evo.costEggs.epic) canAfford = false;
        }

        const card = document.createElement('div');
        card.className = 'evo-card';
        card.innerHTML = `
            <h3 style="color:#ffd700">${evo.name}</h3>
            <img src="${evo.image}" class="evo-img" onerror="this.src='images/pets/pet_blob.png'">
            <p style="font-size:12px; color:#aaa; height:30px;">${evo.desc}</p>
            <div style="font-size:12px; color:#fff; text-align:left; width:100%; margin:5px 0;">
                ⚔️ DPS: ${evo.dps}<br>
                🔥 Skill 1: ${evo.s1_dmg} dmg<br>
                🔥 Skill 3: ${evo.s3_dmg} dmg
            </div>
            <div class="evo-cost-box">
                <div style="font-size:12px; color:#ffaa00; margin-bottom:5px;">Цена:</div>
                <div style="font-size:11px;">${costStr}</div>
            </div>
            <button class="btn-evolve" onclick="performEvolution('${petId}', '${evo.id}')" ${canAfford ? '' : 'disabled'}>
                ${canAfford ? 'ВЫБРАТЬ' : 'НЕТ ЯИЦ'}
            </button>
        `;
        container.appendChild(card);
    });

    modal.style.display = 'flex';
}

function closeEvoModal() {
    document.getElementById('evoModal').style.display = 'none';
}

function performEvolution(petId, evoId) {
    const petDef = petsBase.find(p => p.id === petId);
    const evoDef = petDef.evolutions.find(e => e.id === evoId);

    // Списание яиц
    gameState.inventory.common -= (evoDef.costEggs.common || 0);
    gameState.inventory.rare -= (evoDef.costEggs.rare || 0);
    gameState.inventory.epic -= (evoDef.costEggs.epic || 0);

    // Сохранение эволюции
    const ownedPet = gameState.pets.find(p => p.id === petId);
    ownedPet.evolutionId = evoId; // Записываем ID эволюции

    playSound('upgrade');
    alert(`🎉 Питомец эволюционировал в: ${evoDef.name}!`);

    closeEvoModal();
    saveGame();
    updateForgeUI();
    updateAllUI();
}

function resetEvolution(petId) {
    const cost = 5000;
    if (gameState.gold < cost) {
        alert("Нужно 5000 золота для сброса!");
        return;
    }

    if (confirm(`Сбросить эволюцию за ${cost} золота? Яйца НЕ вернутся.`)) {
        gameState.gold -= cost;
        const ownedPet = gameState.pets.find(p => p.id === petId);
        ownedPet.evolutionId = null; // Стираем эволюцию

        saveGame();
        updateForgeUI();
        updateAllUI();
    }
}
// ==========================================
// === СИСТЕМА ОБУЧЕНИЯ (TUTORIAL) ===
// ==========================================

// Массив заданий
// Массив заданий
const tutorialSteps = [
    {
        id: 0,
        title: "Начало Пути",
        text: "Привет! Слаймы захватили этот мир. Нажми на слайма 5 раз, чтобы атаковать!",
        type: "click",
        target: 5,
        reward: 10
    },
    {
        id: 1,
        title: "Первая кровь",
        text: "Отлично! Теперь добей этого слайма до 0 HP.",
        type: "kill",
        target: 1
    },
    {
        id: 2,
        title: "Сбор лута",
        text: "С монстров падают яйца. Убей ещё 2 слаймов, вдруг повезет?",
        type: "kill",
        target: 2
    },
    {
        id: 3,
        title: "Торговля",
        text: "Яйца можно продать. Перейди в ГИЛЬДИЮ (вкладка).",
        type: "tab",
        target: "shop"
    },
    {
        id: 4,
        title: "Первые деньги",
        text: "Нажми кнопку продажи рядом с яйцом, чтобы получить золото.",
        type: "sell_egg",
        target: 1
    },
    {
        id: 5,
        title: "Кузница",
        text: "Теперь станем сильнее. Перейди в КУЗНИЦУ.",
        type: "tab",
        target: "forge"
    },
    {
        id: 6,
        title: "Прокачка",
        text: "Купи улучшение 'Острота клинка', чтобы бить сильнее.",
        type: "upgrade_dmg",
        target: 1
    },
    // === НОВЫЕ ШАГИ (ID 7 - 10) ===
    {
        id: 7,
        title: "Азарт",
        text: "В ГИЛЬДИИ есть 'Загадочная лавка'. Купи 1 Мистический Сундук (Лутбокс).",
        type: "buy_lootbox",
        target: 1
    },
    {
        id: 8,
        title: "Коллекционер",
        text: "В сундуках лежат предметы. Перейди в КОЛЛЕКЦИЮ.",
        type: "tab",
        target: "collection"
    },
    {
        id: 9,
        title: "Ритуал",
        text: "Собери 5 разных предметов и нажми 'Провести Ритуал', чтобы получить Артефакт.",
        type: "perform_ritual",
        target: 1
    },
    {
        id: 10,
        title: "Тайные знания",
        text: "Нажми на полученный Артефакт в коллекции, чтобы прочитать его историю.",
        type: "click_artifact",
        target: 1
    },
    // === ФИНАЛ (ID 11) ===
    {
        id: 11,
        title: "Мастер",
        text: "Ты знаешь всё! Собирай артефакты, эволюционируй питомцев и убивай Боссов! Удачи!",
        type: "finish",
        target: 0
    }
];

// Переменные состояния (добавь их в gameState при сохранении, если хочешь)
let tutorialState = {
    step: 0,
    progress: 0,
    isActive: true
};

// Функция инициализации (вызывать в loadGame)
function initTutorial() {
    // Если в gameState уже есть данные об обучении — берем их
    if (typeof gameState.tutorialStep !== 'undefined') {
        tutorialState.step = gameState.tutorialStep;
    }

    // Если обучение закончено (-1), скрываем панель
    if (tutorialState.step === -1 || tutorialState.step >= tutorialSteps.length) {
        const box = document.getElementById('tutorialPanel');
        if (box) box.style.display = 'none';
        tutorialState.isActive = false;
        return;
    }

    updateTutorialUI();
}

// Обновление интерфейса плашки
function updateTutorialUI() {
    const box = document.getElementById('tutorialPanel');
    if (!box) return;

    const titleHeader = document.getElementById('tutTitleHeader');
    const title = document.getElementById('tutTitle');
    const text = document.getElementById('tutText');
    const bar = document.getElementById('tutBar');
    const counter = document.getElementById('tutCounter');
    const barContainer = document.querySelector('.tut-progress'); // Получаем контейнер полоски

    if (tutorialState.step >= tutorialSteps.length) {
        completeTutorial();
        return;
    }

    const currentTask = tutorialSteps[tutorialState.step];

    box.style.display = 'block';
    titleHeader.innerText = `ЗАДАНИЕ: ${currentTask.title}`;
    title.innerText = currentTask.title;
    text.innerText = currentTask.text;

    // === ИСПРАВЛЕНИЕ: КНОПКА ЗАВЕРШЕНИЯ ===
    if (currentTask.type === 'finish') {
        // Если это последний шаг - прячем прогресс бар и показываем кнопку
        if (barContainer) barContainer.style.display = 'none';

        counter.innerHTML = `
            <button onclick="completeTutorial()" 
                style="background: linear-gradient(90deg, #00ffcc, #00aa99); 
                       border: none; border-radius: 4px; padding: 6px 12px; 
                       cursor: pointer; font-weight: bold; color: #000; 
                       margin-top: 5px; width: 100%; box-shadow: 0 0 5px #00ffcc;">
                ✅ ЗАБРАТЬ НАГРАДУ
            </button>
        `;
    } else {
        // Для обычных шагов
        if (barContainer) barContainer.style.display = 'block';

        let pct = 0;
        if (currentTask.target > 0) {
            pct = (tutorialState.progress / currentTask.target) * 100;
            if (pct > 100) pct = 100;
            counter.innerText = `${tutorialState.progress} / ${currentTask.target}`;
        } else {
            counter.innerText = "";
        }
        bar.style.width = `${pct}%`;
    }
}

// Главная функция: Сообщить о событии
function checkTutorialProgress(eventType, payload) {
    if (!tutorialState.isActive) return;

    const currentTask = tutorialSteps[tutorialState.step];
    if (!currentTask) return;

    // Проверяем, совпадает ли событие с текущей задачей
    let isMatch = false;

    if (currentTask.type === eventType) {
        // Спец. проверки
        if (eventType === 'tab') {
            if (payload === currentTask.target) isMatch = true;
        } else {
            // Для кликов, убийств и покупок просто увеличиваем счетчик
            isMatch = true;
        }
    }

    if (isMatch) {
        tutorialState.progress++;

        // Особая логика: если задание "Перейти на вкладку", то сразу выполнено
        if (eventType === 'tab') tutorialState.progress = currentTask.target;

        // Визуально обновляем бар
        updateTutorialUI();

        // Проверка завершения шага
        if (tutorialState.progress >= currentTask.target && typeof currentTask.target === 'number') {
            advanceTutorial();
        } else if (eventType === 'tab') {
            // Для вкладок сразу переходим
            advanceTutorial();
        }
    }
}

function advanceTutorial() {
    // ИСПРАВЛЕНО: ищем tutorialPanel вместо tutorialOverlay
    const box = document.getElementById('tutorialPanel');

    if (box) {
        // Эффект успеха
        box.classList.add('tutorial-complete');
    }

    playSound('coin'); // Звук успеха

    setTimeout(() => {
        if (box) box.classList.remove('tutorial-complete');

        tutorialState.step++;
        tutorialState.progress = 0;

        // Сохраняем прогресс в gameState
        gameState.tutorialStep = tutorialState.step;
        saveGame();

        initTutorial();
    }, 600);
}

function completeTutorial() {
    const box = document.getElementById('tutorialPanel');

    // Если обучение еще активно, выдаем награду
    if (tutorialState.isActive) {
        const reward = 100;
        gameState.gold += reward;

        playSound('coin');
        logEvent(`Обучение завершено! Награда: ${reward} золота`, 'rarity-legendary');

        // Визуальный эффект (монетки летят)
        // Берем координаты панели обучения или центра экрана
        const rect = box ? box.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
        flyCoins(rect.left + 50, rect.top, reward);

        alert(`🎉 ПОЗДРАВЛЯЕМ! Вы прошли обучение и получили ${reward} золота!`);
    }

    if (box) box.style.display = 'none'; // Убираем из сайдбара навсегда

    tutorialState.isActive = false;
    gameState.tutorialStep = -1; // Флаг полного завершения
    generateGuildQuests();
    saveGame();
    updateAllUI(); // Обновляем счетчик золота
}

function toggleTutorial() {
    const panel = document.getElementById('tutorialPanel');
    if (panel) {
        panel.classList.toggle('collapsed');
    }
}

// === ЛОР АРТЕФАКТОВ ===
function showArtifactLore(artId) {
    const art = artifacts.find(a => a.id === artId);
    if (!art) return;

    // Проверяем, открыт ли артефакт
    if (!gameState.artifacts.includes(artId)) {
        alert("Сначала найдите этот артефакт через Ритуал!");
        return;
    }

    document.getElementById('loreTitle').innerText = art.name;
    document.getElementById('loreImg').src = art.image;
    document.getElementById('loreFlavor').innerText = art.lore;
    document.getElementById('loreBuff').innerText = art.buff;
    document.getElementById('loreModal').style.display = 'flex';
    checkTutorialProgress('click_artifact', 1);
}

function closeLoreModal() {
    document.getElementById('loreModal').style.display = 'none';
}

// ==========================================
// === СИСТЕМА КВЕСТОВ ГИЛЬДИИ ===
// ==========================================

function generateGuildQuests() {
    // Генерируем 3 квеста, если их нет
    if (!gameState.activeQuests) gameState.activeQuests = [];

    // Если квестов меньше 3, добиваем до 3
    while (gameState.activeQuests.length < 3) {
        const template = questTemplates[Math.floor(Math.random() * questTemplates.length)];
        const count = Math.floor(Math.random() * (template.max - template.min + 1)) + template.min;

        // Расчет награды (немного рандома)
        const reward = template.rewardBase * count + Math.floor(Math.random() * 10);

        const newQuest = {
            id: Date.now() + Math.random(), // Уникальный ID
            type: template.type,
            subtype: template.subtype || null,
            target: count,
            current: 0,
            desc: template.text.replace('{n}', count),
            reward: reward,
            isClaimed: false
        };
        gameState.activeQuests.push(newQuest);
    }
    saveGame();
    updateQuestUI();
}

function checkQuestProgress(type, payload) {
    // Если обучения нет или нет активного квеста - выходим
    if (gameState.tutorialStep !== -1 || !gameState.activeQuest) return;

    const q = gameState.activeQuest;
    if (q.current >= q.target) return; // Уже выполнено

    let isMatch = false;

    if (q.type === 'kill' && type === 'kill') isMatch = true;
    if (q.type === 'boss' && type === 'boss') isMatch = true;
    if (q.type === 'collect' && type === 'collect' && q.subtype === payload) isMatch = true;

    if (isMatch) {
        q.current++;
        saveGame();
        updateSidebarQuestUI(); // Обновляем сайдбар в реальном времени

        if (q.current >= q.target) {
            playSound('upgrade');
            // Можно добавить визуальный эффект или уведомление
            logEvent(`ЗАДАНИЕ ВЫПОЛНЕНО!`, 'rarity-legendary');
        }
    }
}

function claimQuest(questId) {
    const qIndex = gameState.activeQuests.findIndex(q => q.id == questId);
    if (qIndex === -1) return;

    const q = gameState.activeQuests[qIndex];

    // Выдача награды
    gameState.gold += q.reward;
    playSound('coin');

    // Анимация монет от карточки квеста
    const card = document.getElementById(`quest-card-${questId}`);
    const rect = card ? card.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
    flyCoins(rect.left + rect.width / 2, rect.top, q.reward);

    // Удаляем квест из списка
    gameState.activeQuests.splice(qIndex, 1);

    // Генерируем новый на его место (или оставляем пустым, если хочешь дейлики раз в день)
    // Я сделаю бесконечные задания для динамики:
    generateGuildQuests();

    saveGame();
    updateAllUI(); // Обновит золото и квесты
}

// Отрисовка доски в ГИЛЬДИИ (Выбор задания)
// Отрисовка доски в ГИЛЬДИИ (Выбор задания)
function updateQuestUI() {
    const board = document.getElementById('guildBoard'); // <--- Берем контейнер доски
    const list = document.getElementById('questList');

    // Если еще идет обучение - скрываем всю доску
    if (gameState.tutorialStep !== -1) {
        if (board) board.style.display = 'none';
        return;
    }

    // Если обучение пройдено - ПОКАЗЫВАЕМ доску
    if (board) board.style.display = 'block'; // <--- ВОТ ЭТОЙ СТРОКИ НЕ ХВАТАЛО

    // Если у нас уже есть активный квест - показываем сообщение вместо списка
    if (gameState.activeQuest) {
        list.innerHTML = `<div style="text-align:center; color:#aaa; padding:20px;">
            У вас уже есть активное задание.<br>Выполните его, чтобы взять новое!
        </div>`;
        return;
    }

    // Если опций нет, генерируем
    if (!gameState.questOptions || gameState.questOptions.length === 0) {
        generateQuestOptions();
    }

    list.innerHTML = '';
    gameState.questOptions.forEach(q => {
        const div = document.createElement('div');
        div.className = 'quest-card';
        // Кнопка ВЫБРАТЬ
        div.innerHTML = `
            <div>
                <div class="quest-title" style="font-size:14px; color:#ffd700;">${q.icon} ${q.desc}</div>
                <div class="quest-desc" style="color:#fff;">Награда: ${q.reward} 💰</div>
            </div>
            <button onclick="takeQuest('${q.id}')" 
                style="background:#28a745; border:none; color:white; padding:5px 10px; border-radius:5px; cursor:pointer; font-weight:bold;">
                ВЫБРАТЬ
            </button>
        `;
        list.appendChild(div);
    });
}

// Отрисовка панели в САЙДБАРЕ (Текущий прогресс)
function updateSidebarQuestUI() {
    const panel = document.getElementById('activeQuestPanel');
    const tutPanel = document.getElementById('tutorialPanel');

    // Показываем только если обучение закончено
    if (gameState.tutorialStep !== -1) {
        panel.style.display = 'none';
        if (tutPanel) tutPanel.style.display = 'block';
        return;
    } else {
        if (tutPanel) tutPanel.style.display = 'none'; // Скрываем туториал навсегда
        panel.style.display = 'block';
    }

    const title = document.getElementById('actQuestTitle');
    const desc = document.getElementById('actQuestDesc');
    const counter = document.getElementById('actQuestCounter');
    const bar = document.getElementById('actQuestBar');
    const btn = document.getElementById('btnClaimSidebar');

    if (!gameState.activeQuest) {
        // Если квеста нет
        title.innerText = "Нет контракта";
        desc.innerText = "Зайдите в Гильдию и выберите задание!";
        counter.innerText = "";
        bar.style.width = "0%";
        btn.style.display = 'none';
    } else {
        // Если квест есть
        const q = gameState.activeQuest;
        title.innerText = "В ПРОЦЕССЕ";
        desc.innerText = q.desc;

        const pct = Math.min(100, (q.current / q.target) * 100);
        bar.style.width = `${pct}%`;
        counter.innerText = `${q.current} / ${q.target}`;

        // Если выполнен
        if (q.current >= q.target) {
            title.innerText = "✅ ВЫПОЛНЕНО!";
            title.style.color = "#00ff00";
            btn.style.display = 'block'; // Показываем кнопку "Забрать"
        } else {
            title.style.color = "#ffd700";
            btn.style.display = 'none';
        }
    }
}

// 2. Генерация трех конкретных типов заданий
function generateQuestOptions() {
    const options = [];

    // Тип 1: Убить слаймов (3-12)
    const killCount = Math.floor(Math.random() * (12 - 3 + 1)) + 3;
    options.push({
        id: Date.now() + 'k',
        type: 'kill',
        target: killCount,
        current: 0,
        desc: `Убить ${killCount} слаймов`,
        reward: 20 * killCount, // Награда зависит от сложности
        icon: '⚔️'
    });

    // Тип 2: Сбор яиц (Обычные, Редкие или Эпик)
    // Рандомно выбираем подтип
    const rand = Math.random();
    let eggTask = {};

    if (rand < 0.6) {
        // 5 обычных (60% шанс)
        eggTask = { subtype: 'common', count: 5, name: 'обычных', mult: 10 };
    } else if (rand < 0.9) {
        // 3 редких (30% шанс)
        eggTask = { subtype: 'rare', count: 3, name: 'редких', mult: 50 };
    } else {
        // 1 эпик (10% шанс)
        eggTask = { subtype: 'epic', count: 1, name: 'эпических', mult: 150 };
    }

    options.push({
        id: Date.now() + 'c',
        type: 'collect',
        subtype: eggTask.subtype,
        target: eggTask.count,
        current: 0,
        desc: `Найти ${eggTask.count} ${eggTask.name} яиц`,
        reward: eggTask.count * eggTask.mult,
        icon: '🥚'
    });

    // Тип 3: Убить Босса
    options.push({
        id: Date.now() + 'b',
        type: 'boss',
        target: 1,
        current: 0,
        desc: `Победить Босса`,
        reward: 150,
        icon: '💀'
    });

    gameState.questOptions = options;
    saveGame();
}
function takeQuest(questId) {
    // Если уже есть активное задание - нельзя брать новое
    if (gameState.activeQuest) {
        alert("Сначала завершите текущее задание!");
        return;
    }

    const quest = gameState.questOptions.find(q => q.id === questId);
    if (quest) {
        gameState.activeQuest = quest;
        gameState.questOptions = []; // Очищаем выбор, чтобы не мозолил глаза

        playSound('upgrade');
        alert(`📜 Контракт подписан: ${quest.desc}`);

        saveGame();
        updateAllUI(); // Обновит и Гильдию, и Сайдбар

        // Автоматически переключаем на главный экран
        switchTab('game');
    }
}
function claimActiveQuest() {
    if (!gameState.activeQuest || gameState.activeQuest.current < gameState.activeQuest.target) return;

    const reward = gameState.activeQuest.reward;
    gameState.gold += reward;

    // Анимация монет
    flyCoins(window.innerWidth / 2, window.innerHeight / 2, reward);
    playSound('coin');
    alert(`Награда получена: ${reward} золота!`);

    // Сбрасываем квест
    gameState.activeQuest = null;

    // Генерируем новые опции для следующего раза
    generateQuestOptions();

    saveGame();
    updateAllUI();
}

// === АДАПТИВНЫЙ ЛЕЙАУТ (Питомец прыгает между панелями) ===
function checkLayout() {
    const panel = document.getElementById('petPanel');
    const sidebar = document.querySelector('.sidebar'); // Боковая панель
    const mainArea = document.querySelector('.main-area'); // Игровая зона

    if (!panel || !sidebar || !mainArea) return;

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // На телефоне переносим в игровую зону (чтобы было поверх игры)
        if (panel.parentElement !== mainArea) {
            mainArea.appendChild(panel);
        }
    } else {
        // На ПК переносим обратно в сайдбар (в начало)
        if (panel.parentElement !== sidebar) {
            // Вставляем перед логом событий или в начало сайдбара
            sidebar.insertBefore(panel, sidebar.firstChild);
        }
    }
}

// Слушаем изменение размера окна
window.addEventListener('resize', checkLayout);
// Вызываем один раз при старте
setTimeout(checkLayout, 100);

// Запуск при старте (ПЕРЕНЕСЛИ В САМЫЙ КОНЕЦ)
loadGame();