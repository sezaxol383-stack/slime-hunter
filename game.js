

let isResetting = false; // Флаг для сброса
let gameState = {
    kills: 0,
    gold: 0,
    inventory: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
    materials: {},
    unlockedCollectibles: [],
    artifacts: [],
    bossTrophies: [],
    activeQuests: [],
    questOptions: [], // Три задания на выбор в Гильдии
    activeQuest: null, // Одно выбранное задание
    selectedLocation: null,


    // Проверка
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

// === ДОБАВИТЬ ВОТ ЭТОТ БЛОК (Переменные, которых не хватает) ===
let ritualCharges = 0;
let ritualChargeProgress = 0;
const RITUAL_CHARGE_MAX = 100;     // Сколько нужно накопить для одной руны
const PASSIVE_CHARGE_SPEED = 0.2;  // Скорость зарядки сама по себе
const CLICK_CHARGE_BONUS = 5;      // Скорость зарядки от клика

// Переменные для скилла
let petSkillTimer = null;
let currentSlime = { maxHp: 10, currentHp: 10, isBoss: false };
let currentLocationIndex = 0;
// Переменные для Ритуала
let currentCombo = []; // Массив для хранения нажатий (напр. ['red', 'blue', 'green'])
let isRitualReady = false; // Флаг, можно ли нажимать руны

// ==========================================
// === МИНИ-ИГРА: РИТУАЛ (СФЕРЫ 1-2-3) ===
// ==========================================

let ritualState = {
    active: false,
    currentStep: 1,
    timer: null,
    playerHp: 3
};



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
    // 1. Сброс состояния
    clearTimeout(ritualState.timer);
    ritualState.active = false;

    // 2. Визуальный эффект (Красный текст + вспышка)
    spawnDamageNumber(window.innerWidth / 2, window.innerHeight / 2, reason, false);

    const area = document.querySelector('.main-area');
    if (area) {
        area.style.background = 'rgba(255,0,0,0.3)'; // Красная вспышка
        setTimeout(() => area.style.background = 'transparent', 300);
    }

    // 3. Очистка старых сфер (если они были)
    setTimeout(() => {
        const layer = document.getElementById('ritualLayer');
        if (layer) layer.innerHTML = '';
    }, 500);

    // 4. Вибрация для фидбека
    if (navigator.vibrate) navigator.vibrate(200);

    // === УДАЛЕНО: Логика смерти и отнимания сердечек ===
    // Игрок больше не умирает, просто получает предупреждение.
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
// --- ЗАПУСК ---
function loadGame() {
    const saved = localStorage.getItem('slimeHunterMobile_v1');
    let enemyLoadedFromSave = false;

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = { ...gameState, ...parsed };

            if (parsed.inventory) gameState.inventory = { ...gameState.inventory, ...parsed.inventory };
            if (parsed.materials) gameState.materials = { ...gameState.materials, ...parsed.materials };

            // === 1. ГЛАВНЫЙ САНИТАР (Лечим базовые статы) ===
            // Сначала чиним убийства и золото, чтобы формулы ниже работали
            if (typeof gameState.kills !== 'number' || isNaN(gameState.kills) || gameState.kills < 0) {
                console.warn("🐛 Fix: Kills corrupted, resetting to 0");
                gameState.kills = 0;
            }
            if (typeof gameState.gold !== 'number' || isNaN(gameState.gold)) {
                gameState.gold = 0;
            }
            if (typeof gameState.clickPower !== 'number' || isNaN(gameState.clickPower) || gameState.clickPower < 1) {
                gameState.clickPower = 1;
            }
            // ===============================================

            // Пробуем загрузить врага
            if (parsed.savedEnemy) {
                currentSlime.currentHp = parsed.savedEnemy.currentHp;
                currentSlime.maxHp = parsed.savedEnemy.maxHp;
                currentSlime.isBoss = parsed.savedEnemy.isBoss;
                currentLocationIndex = parsed.savedEnemy.locationIndex || 0;
                currentSlime.skin = parsed.savedEnemy.skin || null;
                currentSlime.name = parsed.savedEnemy.name || null;

                // Если выбор локации был сохранен
                if (gameState.selectedLocation !== null) {
                    currentLocationIndex = gameState.selectedLocation;
                }

                // === 2. ПРОВЕРКА ЗДОРОВЬЯ ===
                // Если здоровье сломано (NaN, 0, null) — помечаем как "не загружен"
                if (!currentSlime.maxHp || isNaN(currentSlime.maxHp) || currentSlime.maxHp <= 0) {
                    console.warn("🐛 Fix: Enemy HP corrupted, spawning new one");
                    enemyLoadedFromSave = false;
                } else if (isNaN(currentSlime.currentHp)) {
                    // Если макс норм, а текущее NaN — лечим текущее
                    currentSlime.currentHp = currentSlime.maxHp;
                    enemyLoadedFromSave = true;
                } else {
                    enemyLoadedFromSave = true;
                }
            }
        } catch (e) {
            console.error("Save file corrupted, starting fresh", e);
            localStorage.removeItem('slimeHunterMobile_v1');
        }
    }

    // 2. Если врага не было или он был битым — создаем нового
    if (!enemyLoadedFromSave) {
        const isBossStage = (gameState.kills + 1) % 10 === 0;
        currentSlime.isBoss = isBossStage;

        // Теперь gameState.kills точно число, формула сработает
        let baseHp = Math.floor(10 * Math.pow(1.05, gameState.kills));
        // Защита от бесконечности
        if (!isFinite(baseHp) || isNaN(baseHp)) baseHp = 10;

        currentSlime.maxHp = isBossStage ? baseHp * 10 : baseHp;
        currentSlime.currentHp = currentSlime.maxHp;

        currentSlime.skin = null;
        currentSlime.name = null;

        if (!gameState.materials) gameState.materials = {};
    }

    // 3. Инициализация массивов (защита от null)
    if (!gameState.equippedPet) gameState.equippedPet = null;
    if (!gameState.pets) gameState.pets = [];
    if (!gameState.bossTrophies) gameState.bossTrophies = [];

    // 4. Обновление Визуала
    updatePetUI();
    updateBackground();
    changeSlimeSkin();
    respawnSlime();

    // 5. Запуск систем
    initTutorial();
    updateAllUI();
    updateSoundButton();
    bgMusic.src = musicTracks[currentLocationIndex];
    manageMusic();

    // 6. Сворачиваем панели на телефоне при старте
    if (window.innerWidth < 768) {
        const qPanel = document.getElementById('activeQuestPanel');
        const tPanel = document.getElementById('tutorialPanel');
        if (qPanel) qPanel.classList.add('collapsed');
        if (tPanel) tPanel.classList.add('collapsed');
    }

    // 7. Таймеры
    if (window.gameInterval) clearInterval(window.gameInterval);
    if (window.saveInterval) clearInterval(window.saveInterval);

    window.gameInterval = setInterval(gameLoop, 1000);
    window.saveInterval = setInterval(saveGame, 10000);
}
function saveGame() {
    if (isResetting) return; // Если идет сброс, НЕ СОХРАНЯЕМ!
    // Сохраняем всё о текущем враге: ХП, Босс ли он, КАРТИНКУ и ИМЯ
    gameState.savedEnemy = {
        currentHp: currentSlime.currentHp,
        maxHp: currentSlime.maxHp,
        isBoss: currentSlime.isBoss,
        locationIndex: currentLocationIndex,
        // === НОВОЕ ===
        skin: currentSlime.skin,
        name: currentSlime.name
    };

    localStorage.setItem('slimeHunterMobile_v1', JSON.stringify(gameState));
}



// --- БОЙ ---
function clickSlime(event) {
    playSound('hit');
    animateSlime();
    spawnParticles(event.clientX, event.clientY);

     // Если бьем босса - ускоряем ритуал
    if (currentSlime.isBoss && ritualCharges < 3) {
        ritualChargeProgress += CLICK_CHARGE_BONUS;

        // Моментальная проверка (чтобы не ждать тика таймера)
        if (ritualChargeProgress >= RITUAL_CHARGE_MAX) {
            ritualChargeProgress = 0;
            addRitualCharge();
        }
    }

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

    currentSlime.skin = null;
    currentSlime.name = null;

    changeSlimeSkin();
    respawnSlime();

    saveGame();
    updateAllUI();

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
    // 1. Дроп Яиц (Старая логика)
    let chanceMultiplier = 1;
    if (gameState.artifacts && gameState.artifacts.includes('a2')) chanceMultiplier = 2;

    for (let item of rarities) {
        if (Math.random() < (item.chance * chanceMultiplier)) {
            gameState.inventory[item.id]++;
            checkQuestProgress('collect', item.id);
            playSound('drop');
            logEvent(`Выпало: ${item.name}!`, item.class);
            // Вибрацию и обновление UI делаем в конце
            break; // Если выпало яйцо, прерываем цикл яиц (но не функцию!)
        }
    }

    // 2. Дроп Материалов (НОВАЯ ЛОГИКА) 🧪
    // Определяем ID текущей локации (forest, fire, ice, dark)
    const currentLocId = locations[currentLocationIndex].id;

    // Фильтруем предметы, которые могут упасть ИМЕННО ЗДЕСЬ
    const possibleDrops = craftingMaterials.filter(m => m.location === currentLocId);

    possibleDrops.forEach(mat => {
        // Кидаем кубик для каждого возможного предмета
        if (Math.random() < mat.chance) {
            // Если ресурса еще нет в инвентаре, создаем запись
            if (!gameState.materials[mat.id]) gameState.materials[mat.id] = 0;

            gameState.materials[mat.id]++;

            // Пишем в лог (желтым цветом)
            logEvent(`Лут: ${mat.name} (+1)`, 'rarity-legendary');
            playSound('drop');
        }
    });

    // Обновляем всё в конце
    if (navigator.vibrate) navigator.vibrate(50);
    updateAllUI();
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












// Возвращает индекс локации, которая должна быть сейчас
function getTargetLocationIndex() {
    // 1. Считаем, какая локация МАКСИМАЛЬНО доступна по убийствам
    let maxIndex = 0;
    for (let i = locations.length - 1; i >= 0; i--) {
        if (gameState.kills >= locations[i].minKills) {
            maxIndex = i;
            break;
        }
    }

    // 2. Если игрок (или разработчик) выбрал локацию вручную, ИСПОЛЬЗУЕМ ЕЁ.
    // УБРАЛИ проверку (<= maxIndex), чтобы Dev Mode и сохранения работали корректно.
    if (gameState.selectedLocation !== null) {
        return gameState.selectedLocation;
    }

    // 3. Иначе возвращаем максимальную доступную (авто-режим)
    return maxIndex;
}


function changeSlimeSkin() {
    let newIndex = getTargetLocationIndex();

    // 1. Смена локации (если перешли в другой мир)
    if (newIndex !== currentLocationIndex) {
        
        playTransition(() => {
            currentLocationIndex = newIndex;
            updateBackground();
            changeMusic(newIndex);
            // При смене локации точно генерируем нового моба
            currentSlime.skin = null;
            currentSlime.name = null;
            changeSlimeSkin(); // Рекурсивный вызов уже с новой локацией
            respawnSlime();
        });
        return; // Прерываем, ждем конца видео
    }

    // === 2. ВЫБОР СКИНА И ИМЕНИ ===
    const loc = locations[currentLocationIndex];

    // Если у нас еще нет сохраненного скина (новый моб)
    if (!currentSlime.skin) {
        if (currentSlime.isBoss) {
            // --- ГЕНЕРАЦИЯ БОССА ---
            const possibleBosses = bossEnemies.filter(b => b.location === loc.id);
            if (possibleBosses.length > 0) {
                const randomBoss = possibleBosses[Math.floor(Math.random() * possibleBosses.length)];
                currentSlime.skin = randomBoss.image;
                currentSlime.name = randomBoss.name;
            } else {
                // Заглушка, если боссов нет
                currentSlime.skin = loc.slimes[0];
                currentSlime.name = "БОСС";
            }
        } else {
            // --- ГЕНЕРАЦИЯ ОБЫЧНОГО МОБА ---
            const randomSkin = loc.slimes[Math.floor(Math.random() * loc.slimes.length)];
            currentSlime.skin = randomSkin;
            currentSlime.name = `${loc.name} Слайм`;
        }
    }

    // === 3. ПРИМЕНЕНИЕ К UI ===
    const slimeImg = document.querySelector('.slime-img');
    const nameLabel = document.getElementById('enemyName');
    const hpContainer = document.getElementById('enemyHpContainer');
    const hpFill = document.getElementById('hpFill');
    const hpFrame = document.getElementById('hpFrame');

    // Ставим картинку
    if (slimeImg) slimeImg.src = currentSlime.skin;

    // Ставим имя (используем сохраненное имя, если это босс)
    if (nameLabel) {
        if (currentSlime.isBoss) {
            nameLabel.innerText = `☠️ ${currentSlime.name} ☠️`;
            nameLabel.classList.add('name-boss');
        } else {
            nameLabel.innerText = currentSlime.name;
            nameLabel.classList.remove('name-boss');
        }
    }

    // Стилизация HP бара
    if (currentSlime.isBoss) {
        slimeImg.classList.add('boss');
        if (hpContainer) hpContainer.classList.add('boss-style');
        if (hpFill) hpFill.classList.add('boss-fill');
        if (hpFrame) hpFrame.classList.add('active');
    } else {
        slimeImg.classList.remove('boss');
        if (hpContainer) hpContainer.classList.remove('boss-style');
        if (hpFill) hpFill.classList.remove('boss-fill');
        if (hpFrame) hpFrame.classList.remove('active');

        // Очистка ритуала для обычных мобов
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
    if (confirm("🧨 УНИЧТОЖИТЬ ВЕСЬ ПРОГРЕСС? Это нельзя отменить.")) {
        isResetting = true; // Включаем защиту от авто-сохранения

        // Очищаем интервалы
        if (window.gameInterval) clearInterval(window.gameInterval);
        if (window.saveInterval) clearInterval(window.saveInterval);

        // Полная очистка
        localStorage.removeItem('slimeHunterMobile_v1');

        // Перезагрузка
        location.reload();
    }
}

function devKillCurrent() {
    currentSlime.currentHp = 0;
    updateGameUI();
    onSlimeDeath(); // Вызываем стандартную логику смерти
    toggleDevPanel();
}







function updateBackground() {
    const loc = locations[currentLocationIndex];
    document.body.classList.remove('loc-forest', 'loc-fire', 'loc-ice', 'loc-dark');
    document.body.classList.add(loc.cssClass);
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
    if (!container) return;

    const isMobile = window.innerWidth < 768;

    // === СБРОС КООРДИНАТ ===
    // Обязательно очищаем top, чтобы он не конфликтовал с bottom
    container.style.top = 'auto';
    container.style.margin = '0';
    container.style.position = 'absolute';

    // === 1. БОСС (Всегда по центру, прижат к низу) ===
    if (currentSlime.isBoss) {
        container.style.left = '50%';

        // Меняем transform! Теперь мы центрируем только по X. 
        // По Y мы не сдвигаем, пусть он "растет" вверх от точки bottom.
        container.style.transform = 'translate(-50%, 0)';

        // На ПК ставим на 15% от низа экрана. На мобилке — 25% (над меню)
        container.style.bottom = isMobile ? '25%' : '15%';

        console.log("Boss Spawn: Anchored to Bottom");
        return;
    }

    // === 2. ОБЫЧНЫЕ МОБЫ (Рандом по низу) ===
    let minX, maxX, minBottom, maxBottom;

    if (isMobile) {
        // МОБИЛКА
        minX = 15; maxX = 85;
        // Спавним на высоте от 25% до 45% от пола (над меню)
        minBottom = 25; maxBottom = 45;
    } else {
        // ПК
        // Держим ближе к центру (40-60%)
        minX = 40; maxX = 60;
        // Прижимаем к полу: от 10% до 25% снизу
        minBottom = 10; maxBottom = 25;
    }

    // Генерация
    const randomX = Math.floor(minX + Math.random() * (maxX - minX));
    const randomBottom = Math.floor(minBottom + Math.random() * (maxBottom - minBottom));

    // Применение
    container.style.left = `${randomX}%`;
    container.style.bottom = `${randomBottom}%`;

    // Центрируем только по горизонтали!
    container.style.transform = 'translate(-50%, 0)';

    console.log(`Mob Spawn: Bottom ${randomBottom}%`);
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






function spawnScratchEffect() {
    // Временная заглушка или твоя анимация царапины
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2);
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


// ==========================================
// === СИСТЕМА КАРТЫ (ПОРТАЛ) ===
// ==========================================



function travelToLocation(index) {
    if (currentLocationIndex === index) return; // Мы уже здесь, ничего не делаем

    // Запоминаем выбор игрока в сохранении
    gameState.selectedLocation = index;

    // Принудительно запускаем смену скина и музыки
    changeSlimeSkin();

    // Закрываем карту и возвращаемся в игру
    switchTab('game');

    // Показываем сообщение
    const locName = locations[index].name;
    // alert(`✈️ Вы отправились в: ${locName}`); // Можешь раскомментировать, если хочешь
    saveGame();
}

function craftItem(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // 1. Проверка: уже есть такой артефакт?
    if (recipe.type === 'artifact' && gameState.artifacts.includes(recipe.resultId)) {
        alert("У вас уже есть этот артефакт!");
        return;
    }

    // 2. Проверка: хватает ли ресурсов?
    for (let matId in recipe.cost) {
        const required = recipe.cost[matId];
        const owned = gameState.materials[matId] || 0;
        if (owned < required) {
            alert("Не хватает ресурсов!");
            return;
        }
    }

    // 3. Списываем ресурсы
    for (let matId in recipe.cost) {
        gameState.materials[matId] -= recipe.cost[matId];
    }

    // 4. Выдаем награду
    if (recipe.type === 'artifact') {
        gameState.artifacts.push(recipe.resultId);
        alert(`✨ УСПЕХ! Вы создали: ${recipe.name}`);
    }

    // 5. Сохраняем и обновляем
    playSound('upgrade'); // Или звук магии, если есть
    saveGame();
    updateAllUI(); // Обновит и ресурсы, и кнопки рецептов
}
// === НОВАЯ ЛОГИКА РИТУАЛА ===

function updateRitual() {
    // Если уже готовы к бою, таймер не нужен
    if (isRitualReady) return;

    // Пассивное накопление
    ritualChargeProgress += PASSIVE_CHARGE_SPEED;

    // Если накопили на одну руну
    if (ritualChargeProgress >= RITUAL_CHARGE_MAX) {
        ritualChargeProgress = 0;
        addRitualCharge();
    }
}

function addRitualCharge() {
    if (ritualCharges >= 3) return;

    ritualCharges++;

    // Включаем черную руну
    const runeEl = document.getElementById(`runeSlot${ritualCharges}`);
    if (runeEl) {
        runeEl.style.display = 'flex';
        runeEl.className = 'rune-orbit-slot rune-charging'; // Черный стиль

        // Позиционируем в зависимости от номера (классы slot-left и т.д. уже в HTML)
        if (ritualCharges === 1) runeEl.classList.add('slot-left');
        if (ritualCharges === 2) runeEl.classList.add('slot-right');
        if (ritualCharges === 3) runeEl.classList.add('slot-bottom');

        playSound('drop'); // Звук появления
    }

    // Если собрали все 3 — АКТИВАЦИЯ ЦВЕТОВ
    if (ritualCharges === 3) {
        activateRitualReadyState();
    }
}

function activateRitualReadyState() {
    isRitualReady = true;
    currentCombo = []; // Очищаем прошлый ввод

    // Превращаем черные руны в цветные
    // Слот 1 = Красный, Слот 2 = Зеленый, Слот 3 = Синий
    const r1 = document.getElementById('runeSlot1');
    const r2 = document.getElementById('runeSlot2');
    const r3 = document.getElementById('runeSlot3');

    r1.className = 'rune-orbit-slot slot-left rune-ready rune-red';
    r2.className = 'rune-orbit-slot slot-right rune-ready rune-green';
    r3.className = 'rune-orbit-slot slot-bottom rune-ready rune-blue';

    playSound('upgrade');
}

// Обработка клика по руне
function clickRune(slotId, color) {
    // Нажимать можно только когда все 3 заряжены
    if (!isRitualReady) return;

    const runeEl = document.getElementById(`runeSlot${slotId}`);

    // Если эта руна уже нажата (в этом комбо), не даем нажать второй раз
    if (runeEl.classList.contains('rune-active')) return;

    // Визуально "нажимаем"
    runeEl.classList.add('rune-active');
    playSound('hit');

    // Добавляем в комбо
    currentCombo.push(color);

    // Обновляем текст на экране
    updateComboText();

    // Если нажали 3 руны — БАБАХ!
    if (currentCombo.length === 3) {
        castComboAbility();
    }
}

function updateComboText() {

}

function castComboAbility() {
    const comboString = currentCombo.join('-');
    let damage = 0;
    let effectType = ""; // Тип эффекта (fire, ice, nature, magic)

    // Базовый урон от комбо
    switch (comboString) {
        case 'red-green-blue':
        case 'red-blue-green':
            // 🔥 МЕТЕОРИТ
            damage = Math.floor(currentSlime.maxHp * 0.25);
            effectType = "fire";
            break;

        case 'green-red-blue':
        case 'green-blue-red':
            // 🌿 ГНЕВ ЛЕСА
            damage = Math.floor(currentSlime.maxHp * 0.2);
            gameState.gold += 50;
            effectType = "nature";
            break;

        case 'blue-red-green':
        case 'blue-green-red':
            // ❄️ АБСОЛЮТНЫЙ НОЛЬ
            damage = Math.floor(currentSlime.maxHp * 0.15);
            effectType = "ice";
            break;

        default:
            // ✨ МАГИЧЕСКИЙ ВЫБРОС
            damage = Math.floor(currentSlime.maxHp * 0.1);
            effectType = "magic";
    }

    if (damage < 1) damage = 1;

    currentSlime.currentHp -= damage;

    if (currentSlime.currentHp <= 0) {
        currentSlime.currentHp = 0;
        onSlimeDeath();
    } else {
        updateGameUI();
    }

    // === ЗАПУСКАЕМ АНИМАЦИЮ ===
    spawnSpellEffect(effectType);
    // ===========================

    // Цифры урона (можно оставить, чтобы видеть сколько сняло)
    spawnDamageNumber(window.innerWidth / 2, window.innerHeight / 2, `-${damage}`, true);
    triggerShake();

    setTimeout(resetRitual, 1000);
}


function resetRitual() {
    ritualCharges = 0;
    ritualChargeProgress = 0;
    isRitualReady = false;
    currentCombo = [];

    document.getElementById('comboDisplay').innerText = "";

    // Скрываем все руны и сбрасываем классы
    for (let i = 1; i <= 3; i++) {
        const rune = document.getElementById(`runeSlot${i}`);
        rune.style.display = 'none';
        rune.className = 'rune-orbit-slot'; // Сброс цветов
        // Возвращаем позиционные классы, так как мы их затерли
        if (i === 1) rune.classList.add('slot-left');
        if (i === 2) rune.classList.add('slot-right');
        if (i === 3) rune.classList.add('slot-bottom');
    }
}

// === ЗАПУСК ТАЙМЕРА РИТУАЛА ===
setInterval(() => {
    // Ритуал работает только на боссах (чтобы на обычных мобах не отвлекал)
    if (currentSlime.isBoss) {
        updateRitual();
    } else {
        // (Опционально) Сбрасываем руны, если это не босс
        if (ritualCharges > 0) resetRitual();
    }
}, 1000 / 60);

function devSpawnBoss(locIndex) {
    // 1. Фиксируем выбор локации, чтобы getTargetLocationIndex не выкинул нас обратно
    gameState.selectedLocation = locIndex;
    currentLocationIndex = locIndex;

    // 2. Включаем режим босса
    currentSlime.isBoss = true;

    // 3. Задаем HP
    let hp = 5000 * (locIndex + 1);
    currentSlime.maxHp = hp;
    currentSlime.currentHp = hp;

    // 4. Сбрасываем старый скин
    currentSlime.skin = null;
    currentSlime.name = null;

    // 5. Обновляем всё
    updateBackground();
    changeMusic(locIndex);
    changeSlimeSkin();
    respawnSlime();
    updateAllUI();

    toggleDevPanel();
    alert(`👹 ПРИЗВАН БОСС ЛОКАЦИИ ${locIndex + 1}!`);

    // 6. Сохраняем, чтобы F5 не сбросил прогресс
    saveGame();
}





// Сохранять игру автоматически перед закрытием вкладки
window.addEventListener('beforeunload', () => {
    saveGame();
});


// Слушаем изменение размера окна
window.addEventListener('resize', checkLayout);
// Вызываем один раз при старте
setTimeout(checkLayout, 100);

// Запуск при старте (ПЕРЕНЕСЛИ В САМЫЙ КОНЕЦ)
loadGame();

