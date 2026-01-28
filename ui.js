// --- UI ОБНОВЛЕНИЕ --- Группа 1: Обновление интерфейса
function updateAllUI() {
    document.getElementById('goldCount').innerText = gameState.gold;
    updateGameUI();
    updateShopUI();
    updateCollectionUI();
    updateQuestUI();
    updateSidebarQuestUI();
    updateMagicUI();
}
function updateGameUI() {
    const percent = (currentSlime.currentHp / currentSlime.maxHp) * 100;
    document.getElementById('hpFill').style.width = `${percent}%`;
    document.getElementById('currentHp').innerText = Math.ceil(currentSlime.currentHp);
    document.getElementById('maxHp').innerText = currentSlime.maxHp;
    document.getElementById('killCount').innerText = gameState.kills;

    // Внутри функции updateGameUI()...

    // --- ОБНОВЛЕНИЕ ИНВЕНТАРЯ ---

    // 1. Считаем общую сумму яиц
    let totalEggs = 0;
    rarities.forEach(r => {
        totalEggs += (gameState.inventory[r.id] || 0);
    });

    // Обновляем цифру в мобильной шапке
    const totalEl = document.getElementById('totalEggCountHtml');
    if (totalEl) totalEl.innerText = totalEggs;

    // 2. Обновляем ленту в шапке (для ПК)
    const headerInv = document.getElementById('headerInventory');
    if (headerInv) {
        headerInv.innerHTML = '';
        // На ПК показываем как раньше (развернуто)
        [...rarities].reverse().forEach(r => {
            const count = gameState.inventory[r.id] || 0;
            const div = document.createElement('div');
            div.className = `egg-counter`;
            div.innerHTML = `
                <img src="${r.image}" class="egg-icon-img" onerror="this.style.display='none'">
                <span class="header-count">${count}</span>
            `;
            headerInv.appendChild(div);
        });
    }

    // 3. Обновляем РЮКЗАК В САЙДБАРЕ (Детальный список)
    const sidebarList = document.getElementById('sidebarInventoryList');
    if (sidebarList) {
        sidebarList.innerHTML = '';
        rarities.forEach(r => {
            const count = gameState.inventory[r.id] || 0;
            // Показываем, даже если 0, чтобы игрок видел, чего нет
            const row = document.createElement('div');
            row.className = 'sidebar-inv-row';
            // Добавляем цвет названия в зависимости от редкости
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${r.image}" style="width:24px; height:24px; object-fit:contain;">
                    <span class="${r.class}">${r.name}</span>
                </div>
                <span style="font-weight:bold; color:#fff;">x${count}</span>
            `;
            sidebarList.appendChild(row);
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
    bossSection.innerHTML = `<h3 style="color: #ff3333; text-transform: uppercase;">Трофеи</h3>`;

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
    collectionSection.innerHTML = `<h3 style="color: #aaddff">Коллекция</h3>`;

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
    ritualSection.innerHTML = `<button onclick="performRitual()" style="background: linear-gradient(45deg, #ff0055, #ff00cc); border: 3px solid #fff; color: white; padding: 15px 40px; border-radius: 50px; font-weight: bold; cursor: pointer; opacity: ${canRitual ? '1' : '0.5'}; filter: ${canRitual ? 'none' : 'grayscale(1)'};">Ритуал </button>`;
    grid.appendChild(ritualSection);

    const artifactSection = document.createElement('div');
    artifactSection.style.textAlign = 'center'; artifactSection.style.width = '100%';
    artifactSection.innerHTML = `<h3 style="color: #ffcc00">Артефакты</h3>`;
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
function updateMapUI() {
    const grid = document.getElementById('mapGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // Определяем максимальную открытую локацию по убийствам
    let maxIndex = 0;
    for (let i = locations.length - 1; i >= 0; i--) {
        if (gameState.kills >= locations[i].minKills) {
            maxIndex = i;
            break;
        }
    }

    locations.forEach((loc, index) => {
        const isLocked = index > maxIndex;
        const isActive = currentLocationIndex === index;

        const card = document.createElement('div');
        // Добавляем классы: locked если закрыто, active-loc если мы там
        card.className = `location-card ${isLocked ? 'locked' : ''} ${isActive ? 'active-loc' : ''}`;

        // Иконки для красоты (можешь поменять на свои эмодзи)
        const icons = ['🌲', '🌋', '❄️', '🏰'];
        const icon = icons[index] || '❓';

        card.innerHTML = `
            <div class="loc-icon">${icon}</div>
            <div class="loc-info">
                <h4>${loc.name}</h4>
                <p>${isLocked ? `Нужно убить ${loc.minKills} монстров` : 'Открыто'}</p>
            </div>
            ${isActive ? '<div class="current-badge">ВЫ ЗДЕСЬ</div>' : ''}
        `;

        // Клик работает только если локация открыта
        if (!isLocked) {
            card.onclick = () => travelToLocation(index);
        }

        grid.appendChild(card);
    });
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
// Группа 2: Визуальные эффекты
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
function triggerShake() {
    const area = document.querySelector('.main-area');
    if (area) {
        area.classList.remove('shake-effect');
        void area.offsetWidth;
        area.classList.add('shake-effect');
        if (navigator.vibrate) navigator.vibrate(50);
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
function animatePetIcon() {
    const sidebarImg = document.getElementById('sidebarPetImg');
    if (sidebarImg) {
        sidebarImg.classList.remove('pet-attack-sidebar');
        void sidebarImg.offsetWidth;
        sidebarImg.classList.add('pet-attack-sidebar');
    }
}
//Группа 3: Навигация и окна
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
    if (tabName === 'magic') updateMagicUI();
    if (tabName === 'forge') updateForgeUI();
    if (tabName === 'map') updateMapUI();
    checkTutorialProgress('tab', tabName);
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
function toggleDevPanel() {
    const panel = document.getElementById('devPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'flex';
    } else {
        panel.style.display = 'none';
    }
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
// === ИНТЕРФЕЙС МАГИИ ===
function updateMagicUI() {
    const grid = document.getElementById('materialsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    // Перебираем все возможные материалы из data.js
    craftingMaterials.forEach(mat => {
        // Проверяем, сколько их у игрока (если нет записи, то 0)
        const count = gameState.materials[mat.id] || 0;

        const card = document.createElement('div');
        card.className = `material-card ${count === 0 ? 'empty' : ''}`;

        // Подсказка при наведении (Title)
        card.title = `${mat.name}\nШанс дропа: ${Math.round(mat.chance * 100)}%`;

        card.innerHTML = `
            <img src="${mat.image}" onerror="this.src='images/items/egg_common.png'">
            <div class="material-count">x${count}</div>
            <div style="font-size: 9px; color: #aaa; margin-top: 3px; text-align: center;">${mat.name}</div>
        `;

        grid.appendChild(card);
    });
    // === ОТРИСОВКА РЕЦЕПТОВ ===
    const recipesGrid = document.getElementById('recipesGrid');
    if (recipesGrid) {
        recipesGrid.innerHTML = '';

        recipes.forEach(rcp => {
            const div = document.createElement('div');
            // Проверяем, создан ли уже предмет
            const isCrafted = (rcp.type === 'artifact' && gameState.artifacts.includes(rcp.resultId));

            div.className = `recipe-card ${isCrafted ? 'recipe-done' : ''}`;

            // Формируем текст стоимости (Слизь: 5/10)
            let costHtml = '';
            let canCraft = true;

            for (let matId in rcp.cost) {
                const req = rcp.cost[matId];
                const own = gameState.materials[matId] || 0;

                // Находим имя материала по ID
                const matName = craftingMaterials.find(m => m.id === matId)?.name || matId;

                // Цвет: зеленый если хватает, красный если нет
                const color = own >= req ? '#00ff00' : '#ff5555';
                if (own < req) canCraft = false;

                costHtml += `<div style="color:${color}">${matName}: ${own} / ${req}</div>`;
            }

            // Кнопка
            let btnText = "СОЗДАТЬ";
            let btnDisabled = !canCraft;

            if (isCrafted) {
                btnText = "ГОТОВО";
                btnDisabled = true;
            }

            div.innerHTML = `
                <div class="recipe-info">
                    <h4>${rcp.name}</h4>
                    <p>${rcp.desc}</p>
                    <div class="recipe-cost">${costHtml}</div>
                </div>
                <button class="recipe-btn" onclick="craftItem('${rcp.id}')" ${btnDisabled ? 'disabled' : ''}>
                    ${btnText}
                </button>
            `;

            recipesGrid.appendChild(div);
        });
    }
}