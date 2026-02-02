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
    // === 1. ОБНОВЛЕНИЕ HP БАРА ===
    const hpFill = document.getElementById('hpFill');
    const hpText = document.getElementById('hpText');

    if (hpFill && hpText) {
        // Защита от отрицательных чисел и деления на ноль
        const current = Math.max(0, currentSlime.currentHp);
        const max = Math.max(1, currentSlime.maxHp);

        // Считаем процент
        let percent = (current / max) * 100;

        // Обновляем ширину (Inline-стиль перебьет CSS)
        hpFill.style.width = `${percent.toFixed(2)}%`;

        // Обновляем текст
        hpText.innerText = `${Math.ceil(current)} / ${Math.ceil(max)}`;
    }

    // === 2. СЧЕТЧИК УБИЙСТВ ===
    const killCount = document.getElementById('killCount');
    if (killCount) killCount.innerText = gameState.kills;

    // === 3. ИНВЕНТАРЬ (Яйца) ===
    // Считаем сумму
    let totalEggs = 0;
    rarities.forEach(r => {
        totalEggs += (gameState.inventory[r.id] || 0);
    });

    // Обновляем мобильный счетчик
    const totalEl = document.getElementById('totalEggCountHtml');
    if (totalEl) totalEl.innerText = totalEggs;

    // Обновляем ПК ленту в шапке
    const headerInv = document.getElementById('headerInventory');
    if (headerInv) {
        headerInv.innerHTML = '';
        [...rarities].reverse().forEach(r => {
            const count = gameState.inventory[r.id] || 0;
            const div = document.createElement('div');
            div.className = 'egg-counter';
            div.innerHTML = `
                <img src="${r.image}" class="egg-icon-img" onerror="this.style.display='none'">
                <span class="header-count">${count}</span>
            `;
            headerInv.appendChild(div);
        });
    }

    // ... (начало функции updateGameUI с HP и золотом остается без изменений) ...

    // ... внутри updateGameUI ...

    // === ОБНОВЛЕНИЕ РЮКЗАКА ===
    const sidebarList = document.getElementById('sidebarInventoryList');
    if (sidebarList) {
        sidebarList.innerHTML = '';

        // 1. ЯЙЦА
        [...rarities].reverse().forEach(r => {
            const count = gameState.inventory[r.id] || 0;
            if (count > 0) {
                let slotClass = '';
                if (r.id === 'mythic') slotClass = 'slot-mythic';
                if (r.id === 'legendary') slotClass = 'slot-legendary';

                const slot = document.createElement('div');
                slot.className = `inv-slot ${slotClass}`;

                // === ВОТ ЭТО НОВОЕ: КЛИК ПО ЯЙЦУ ===
                // Мы передаем данные прямо в функцию открытия
                slot.onclick = () => openItemInfo(r.name, r.image, "Это яйцо содержит питомца. Открой его в инкубаторе!", count, r.id);
                // ====================================

                slot.innerHTML = `<img src="${r.image}" class="inv-icon"><span class="inv-count">${count}</span>`;
                sidebarList.appendChild(slot);
            }
        });

        // 2. МАТЕРИАЛЫ
        if (gameState.materials) {
            for (let [matId, count] of Object.entries(gameState.materials)) {
                if (count > 0) {
                    const matDef = craftingMaterials.find(m => m.id === matId);
                    const imgSrc = matDef ? matDef.image : 'images/items/egg_common.png';
                    const matName = matDef ? matDef.name : 'Ресурс';

                    // Генерируем описание, если его нет
                    const matDesc = matDef ? (matDef.desc || "Используется для создания магических предметов.") : "Неизвестный материал.";

                    const slot = document.createElement('div');
                    slot.className = 'inv-slot';

                    // === ВОТ ЭТО НОВОЕ: КЛИК ПО РЕСУРСУ ===
                    slot.onclick = () => openItemInfo(matName, imgSrc, matDesc, count, matId);
                    // ======================================

                    slot.innerHTML = `<img src="${imgSrc}" class="inv-icon"><span class="inv-count">${count}</span>`;
                    sidebarList.appendChild(slot);
                }
            }
        }

        if (sidebarList.children.length === 0) {
            sidebarList.innerHTML = '<div style="color:#777; font-size:12px; text-align:center; width:100%;">Пусто...</div>';
        }
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

// === ОБНОВЛЕННАЯ КОЛЛЕКЦИЯ (ВКЛАДКИ) ===

// 1. Функция навигации: Открыть категорию
function openSubCollection(category) {
    // Скрываем хаб
    document.getElementById('collectionHub').style.display = 'none';

    // Показываем кнопку назад
    document.getElementById('btnColBack').style.display = 'block';

    // Скрываем все под-экраны
    document.getElementById('viewTrophies').style.display = 'none';
    document.getElementById('viewItems').style.display = 'none';
    document.getElementById('viewArtifacts').style.display = 'none';

    // Меняем заголовок и показываем нужный экран
    const title = document.getElementById('colScreenTitle');

    if (category === 'trophies') {
        document.getElementById('viewTrophies').style.display = 'flex';
        title.innerText = '👹 Трофеи';
    } else if (category === 'items') {
        document.getElementById('viewItems').style.display = 'flex';
        title.innerText = '🏺 Реликвии';
    } else if (category === 'artifacts') {
        document.getElementById('viewArtifacts').style.display = 'flex';
        title.innerText = '⚡ Артефакты';
    }
}

// 2. Функция навигации: Вернуться в меню
function backToCollectionHub() {
    document.getElementById('collectionHub').style.display = 'flex'; // Показываем меню
    document.getElementById('btnColBack').style.display = 'none'; // Скрываем кнопку назад
    document.getElementById('colScreenTitle').innerText = '💎 Сокровищница';

    // Скрываем все под-экраны
    document.getElementById('viewTrophies').style.display = 'none';
    document.getElementById('viewItems').style.display = 'none';
    document.getElementById('viewArtifacts').style.display = 'none';
}

// 3. Обновление данных (Отрисовка иконок)
function updateCollectionUI() {
    // --- ТРОФЕИ ---
    const trophyGrid = document.getElementById('trophiesGrid');
    if (trophyGrid) {
        trophyGrid.innerHTML = '';
        bossDrops.forEach(item => {
            const isUnlocked = gameState.bossTrophies && gameState.bossTrophies.includes(item.id);
            const div = document.createElement('div');
            div.className = `collection-item ${isUnlocked ? 'unlocked' : ''}`;
            div.style.borderColor = isUnlocked ? "#ff3333" : "#333";
            div.style.background = isUnlocked ? "rgba(255, 50, 50, 0.15)" : "rgba(0,0,0,0.3)";

            const iconHtml = isUnlocked ?
                `<img src="${item.image}" style="width: 50px; height: 50px; object-fit: contain;">` :
                '<span style="font-size: 30px; opacity: 0.3;">🔒</span>';

            div.innerHTML = `
                <div style="height: 50px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">${iconHtml}</div>
                <div style="font-size: 10px; text-align: center; color: ${isUnlocked ? '#fff' : '#777'}">${item.name}</div>
            `;
            trophyGrid.appendChild(div);
        });
    }

    // --- ОБЫЧНЫЕ ПРЕДМЕТЫ (РЕЛИКВИИ) ---
    const itemsGrid = document.getElementById('itemsGrid');
    if (itemsGrid) {
        itemsGrid.innerHTML = '';
        collectionItems.forEach(item => {
            const isUnlocked = gameState.unlockedCollectibles.includes(item.id);
            const div = document.createElement('div');
            div.className = `collection-item ${isUnlocked ? 'unlocked' : ''}`;
            div.style.border = isUnlocked ? "2px solid #00ffcc" : "2px solid #333";
            div.style.background = isUnlocked ? "rgba(0, 255, 204, 0.1)" : "rgba(0,0,0,0.3)";

            const iconHtml = isUnlocked ?
                `<img src="${item.image}" style="width: 50px; height: 50px; object-fit: contain;">` :
                '<span style="font-size: 30px; opacity: 0.3;">🔒</span>';

            div.innerHTML = `<div style="height: 50px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">${iconHtml}</div><div style="font-size: 10px; text-align: center; color: ${isUnlocked ? '#fff' : '#777'}">${item.name}</div>`;
            itemsGrid.appendChild(div);
        });

        // Кнопка ритуала теперь живет здесь
        const ritualContainer = document.getElementById('ritualContainer');
        if (ritualContainer) {
            const canRitual = gameState.unlockedCollectibles.length >= 5;
            ritualContainer.innerHTML = `<button onclick="performRitual()" style="background: linear-gradient(45deg, #ff0055, #ff00cc); border: 2px solid #fff; color: white; padding: 10px 30px; border-radius: 20px; font-weight: bold; cursor: pointer; opacity: ${canRitual ? '1' : '0.5'}; filter: ${canRitual ? 'none' : 'grayscale(1)'}; box-shadow: 0 0 15px #ff00cc;">🔮 ПРОВЕСТИ РИТУАЛ</button>`;
        }
    }

    // --- АРТЕФАКТЫ ---
    const artGrid = document.getElementById('artifactsGrid');
    if (artGrid) {
        artGrid.innerHTML = '';
        artifacts.forEach(art => {
            const hasArt = gameState.artifacts.includes(art.id);
            const artDiv = document.createElement('div');
            artDiv.className = `collection-item ${hasArt ? 'unlocked' : ''}`;
            artDiv.style.border = hasArt ? "2px solid #ffcc00" : "2px dashed #664400";
            artDiv.style.background = hasArt ? "rgba(255, 204, 0, 0.15)" : "rgba(0,0,0,0.2)";

            if (hasArt) {
                artDiv.onclick = () => showArtifactLore(art.id);
                artDiv.style.cursor = "pointer";
            }

            const artIcon = hasArt ?
                `<img src="${art.image}" style="width: 60px; height: 60px; object-fit: contain;">` :
                '<span style="font-size: 40px; opacity: 0.2;">❓</span>';

            artDiv.innerHTML = `<div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">${artIcon}</div><div style="font-size: 10px; color: ${hasArt ? '#ffcc00' : '#665544'}; font-weight: bold;">${art.name}</div><div style="font-size: 9px; color: #00ff00; margin-top: 2px;">${hasArt ? art.buff : ''}</div>`;
            artGrid.appendChild(artDiv);
        });
    }
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
// Отрисовка панели в САЙДБАРЕ (Текущий прогресс квеста Гильдии)
function updateSidebarQuestUI() {
    const panel = document.getElementById('activeQuestPanel');
    const tutPanel = document.getElementById('tutorialPanel');

    // Находим заголовок (чтобы не было ошибки)
    const titleHeader = document.getElementById('actQuestTitleHeader');

    // Показываем только если обучение закончено
    if (gameState.tutorialStep !== -1) {
        if (panel) panel.style.display = 'none';
        if (tutPanel) tutPanel.style.display = 'block';
        return;
    } else {
        if (tutPanel) tutPanel.style.display = 'none'; // Скрываем туториал навсегда
        if (panel) panel.style.display = 'block';
    }

    const title = document.getElementById('actQuestTitle');
    const desc = document.getElementById('actQuestDesc');
    const counter = document.getElementById('actQuestCounter');
    const bar = document.getElementById('actQuestBar');
    const btn = document.getElementById('btnClaimSidebar');

    if (!gameState.activeQuest) {
        // Если квеста нет
        if (title) title.innerText = "Нет контракта";
        if (desc) desc.innerText = "Зайдите в Гильдию и выберите задание!";
        if (counter) counter.innerText = "";
        if (bar) bar.style.width = "0%";
        if (btn) btn.style.display = 'none';
        if (titleHeader) titleHeader.innerText = "📜 Взять квест";

        // Добавляем кнопку "В ГИЛЬДИЮ", если квеста нет
        if (counter) {
            counter.innerHTML = `<button class="quest-nav-btn" onclick="selectMobileTab('shop'); event.stopPropagation();">Гильдия</button>`;
        }

    } else {
        // Если квест ЕСТЬ
        const q = gameState.activeQuest;
        if (title) title.innerText = "Выполняется";
        if (desc) desc.innerText = q.desc;

        const pct = Math.min(100, (q.current / q.target) * 100);
        if (bar) bar.style.width = `${pct}%`;

        // === ЛОГИКА УМНОЙ КНОПКИ ===
        let navBtn = "";

        // Если квест "Собрать", а мы не в коллекции - кнопка "В КОЛЛЕКЦИЮ" (там видно ресурсы)
        // Если квест "Купить/Продать" (тип определяется по смыслу, но у тебя простые типы)
        // В твоем генераторе квестов типы: 'kill', 'collect', 'boss'.

        const currentScreen = document.querySelector('.screen.active');

        // Если надо собрать яйца/ресурсы, предлагаем пойти в Магию или Инвентарь
        if (q.type === 'collect' && currentScreen.id !== 'magicScreen') {
            // Можно отправить в Магию, чтобы видеть ресурсы, или просто оставить без кнопки (фарм идет в бою)
        }

        // Если квест выполнен -> кнопка "ЗАБРАТЬ" (уже есть ниже)
        // Если квест "Убить босса", а мы не на боссе -> можно добавить кнопку, но это сложнее.

        if (counter) counter.innerHTML = `${q.current} / ${q.target} ${navBtn}`;

        // Если выполнен
        if (q.current >= q.target) {
            if (title) {
                title.innerText = "✅ ВЫПОЛНЕНО!";
                title.style.color = "#00ff00";
            }
            if (btn) btn.style.display = 'block'; // Показываем кнопку "Забрать"
        } else {
            if (title) title.style.color = "#ffd700";
            if (btn) btn.style.display = 'none';
        }

        // ОБНОВЛЕНИЕ ЗАГОЛОВКА (ДЛЯ СВЕРНУТОЙ КНОПКИ)
        if (titleHeader) {
            if (window.innerWidth < 768) {
                let icon = q.type === 'kill' ? '💀' : (q.type === 'collect' ? '🥚' : '👹');
                titleHeader.innerText = `${icon} ${q.current}/${q.target}`;
                if (q.current >= q.target) titleHeader.innerText = "✅ ЗАБРАТЬ!";
            } else {
                titleHeader.innerText = "📜 ТЕКУЩАЯ ЦЕЛЬ";
            }
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
// === ОБНОВЛЕНИЕ ПЛАШКИ ЗАДАНИЯ (НОВАЯ ВЕРСИЯ) ===
function updateTutorialUI() {
    // 1. Проверяем, идет ли обучение
    if (!tutorialState.isActive || tutorialState.step >= tutorialSteps.length) {
        // Если нет — скрываем плашку
        const pill = document.getElementById('questPill');
        if (pill) pill.style.display = 'none';
        return;
    }

    // 2. Показываем плашку
    const pill = document.getElementById('questPill');
    if (pill) pill.style.display = 'flex';

    // 3. Формируем текст (Название шага + Прогресс)
    const currentTask = tutorialSteps[tutorialState.step];

    // Убираем слово "Задание", если оно там есть, для компактности
    let titleText = currentTask.title.replace("Задание: ", "");

    // Если есть цель (цифры)
    if (currentTask.target > 0) {
        titleText += ` ${tutorialState.progress}/${currentTask.target}`;

        // Обновляем полоску прогресса
        const pct = Math.min(100, (tutorialState.progress / currentTask.target) * 100);
        const bar = document.getElementById('questPillProgress');
        if (bar) bar.style.width = `${pct}%`;
    } else {
        // Если цели нет (просто "Нажми туда"), полоска полная
        const bar = document.getElementById('questPillProgress');
        if (bar) bar.style.width = `100%`;
    }

    // Вставляем текст в плашку
    const pillText = document.getElementById('questPillText');
    if (pillText) pillText.innerText = titleText;

    // 4. Подсветка выполнения
    // Если прогресс >= цели, делаем текст зеленым и добавляем свечение
    if (currentTask.target > 0 && tutorialState.progress >= currentTask.target) {
        pill.classList.add('complete'); // Класс для зеленой рамки (в CSS)
        if (pillText) pillText.style.color = '#00ff00';
        if (pillText) pillText.innerText = "✅ ЗАБРАТЬ НАГРАДУ";
    } else if (currentTask.type === 'finish') {
        // Финальный шаг
        pill.classList.add('complete');
        if (pillText) pillText.style.color = '#00ff00';
        if (pillText) pillText.innerText = "✅ ЗАВЕРШИТЬ";
    } else {
        pill.classList.remove('complete');
        if (pillText) pillText.style.color = '#fff';
    }
}

// === УПРАВЛЕНИЕ МОДАЛКОЙ ЗАДАНИЯ (НОВЫЕ ФУНКЦИИ) ===
function openQuestModal() {
    if (!tutorialState.isActive || tutorialState.step >= tutorialSteps.length) return;

    const currentTask = tutorialSteps[tutorialState.step];

    // Заполняем тексты
    document.getElementById('modalQuestTitle').innerText = currentTask.title;
    document.getElementById('modalQuestDesc').innerText = currentTask.text;

    // Прогресс в модалке
    if (currentTask.target > 0) {
        document.getElementById('modalQuestCounter').innerText = `${tutorialState.progress} / ${currentTask.target}`;
        const pct = Math.min(100, (tutorialState.progress / currentTask.target) * 100);
        document.getElementById('modalQuestBar').style.width = `${pct}%`;
    } else {
        document.getElementById('modalQuestCounter').innerText = "";
        document.getElementById('modalQuestBar').style.width = "100%";
    }

    // Если задание выполнено — кнопка "Забрать награду"
    const isDone = (currentTask.target > 0 && tutorialState.progress >= currentTask.target) || currentTask.type === 'finish';

    // Для удобства используем ту же кнопку закрытия, но если готово — она завершает шаг
    const btn = document.querySelector('#questModal .evo-close-btn');
    if (isDone) {
        btn.innerText = "ЗАБРАТЬ НАГРАДУ";
        btn.onclick = () => {
            completeTutorial(); // Функция из game.js
            closeQuestModal();
        };
        btn.style.background = "linear-gradient(90deg, #00ff00, #00aa00)";
    } else {
        btn.innerText = "Закрыть";
        btn.onclick = closeQuestModal;
        btn.style.background = ""; // Сброс
    }

    document.getElementById('questModal').style.display = 'flex';
}

function closeQuestModal() {
    document.getElementById('questModal').style.display = 'none';
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

    // === НОВАЯ ЛОГИКА ДЛЯ КНОПКИ "В БОЙ" ===
    const homeBtn = document.getElementById('btnHome');
    if (homeBtn) {
        if (tabName === 'game') {
            // Если мы в игре — убираем свечение
            homeBtn.classList.remove('home-btn-glow');
        } else {
            // Если мы НЕ в игре — включаем тревогу!
            homeBtn.classList.add('home-btn-glow');
        }
    }
    // ========================================

    if (tabName === 'shop') {
        container.classList.add('shop-mode');
        sidebar.classList.remove('active');
        if (backpackBtn) backpackBtn.style.display = 'none';
    } else {
        container.classList.remove('shop-mode');
        if (backpackBtn) backpackBtn.style.display = 'flex';
        sidebar.classList.remove('active');
        
    }
    if (tabName === 'magic') updateMagicUI();
    if (tabName === 'forge') updateForgeUI();
    if (tabName === 'map') updateMapUI();
    checkTutorialProgress('tab', tabName);
}


function toggleBackpack() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');

    // УДАЛИЛИ СТРОКИ ТИПА:
    // const btn = document.getElementById('btnBackpack');
    // if (sidebar.classList.contains('active')) btn.innerText = '❌';
    // else btn.innerText = '🎒';

    // Звук открытия
    playSound('click');
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


function playTransition(callback) {
    const layer = document.getElementById('transitionLayer');
    const img = document.getElementById('transImg');
    const text = document.getElementById('transText');

    if (!layer || !img) {
        if (callback) callback();
        return;
    }

    // 1. ПОКАЗЫВАЕМ ЭКРАН И ПЕРВУЮ КАРТИНКУ (БЕГ)
    // Убедись, что файлы называются так же, или поменяй пути!
    img.src = 'images/bg/trans_run.png'; // <-- Твоя картинка бега
    if (text) text.innerText = "В ПУТЬ!";

    layer.classList.add('active');

    // 2. ЧЕРЕЗ 1.5 СЕКУНДЫ МЕНЯЕМ НА ВТОРУЮ (ПОРТАЛ/ВХОД)
    setTimeout(() => {
        img.src = 'images/bg/trans_portal.png'; // <-- Твоя картинка портала
        if (text) {
            text.innerText = "ПОЧТИ ПРИШЛИ...";
            // Перезапуск анимации текста (маленький хак)
            text.style.animation = 'none';
            text.offsetHeight; /* trigger reflow */
            text.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }

        // === В ЭТОТ МОМЕНТ МЕНЯЕМ ЛОКАЦИЮ В ИГРЕ ===
        // Пока игрок смотрит на картинку портала, игра обновляется
        if (callback) callback();

        // 3. ЕЩЕ ЧЕРЕЗ 1.5 СЕКУНДЫ УБИРАЕМ ЭКРАН
        setTimeout(() => {
            layer.classList.remove('active');
        }, 1500);

    }, 1500);
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

function spawnSpellEffect(type) {
    const container = document.querySelector('.main-area'); // Ищем игровую зону

    // Создаем элемент эффекта
    const effect = document.createElement('div');
    effect.className = `spell-vfx vfx-${type}`; // Классы: spell-vfx + vfx-fire (например)

    // Добавляем в центр экрана
    // (Позиционирование настроим в CSS)
    container.appendChild(effect);

    // Удаляем через 1 секунду (когда анимация пройдет)
    setTimeout(() => {
        effect.remove();
    }, 1000);

    // Звуки (если хочешь)
    if (type === 'fire') playSound('hit'); // Или звук взрыва
}

// === ФУНКЦИИ ИНФОРМАЦИИ О ПРЕДМЕТЕ ===

function openItemInfo(name, image, desc, count, id) {
    // Заполняем данные
    document.getElementById('infoTitle').innerText = name;
    document.getElementById('infoImg').src = image;
    document.getElementById('infoDesc').innerText = desc;
    document.getElementById('infoCount').innerText = `В наличии: ${count} шт.`;

    // Красим заголовок в зависимости от редкости (простая логика)
    const title = document.getElementById('infoTitle');
    if (id === 'mythic') title.style.color = '#f7768e';
    else if (id === 'legendary') title.style.color = '#ff9e64';
    else if (id === 'epic') title.style.color = '#bb9af7';
    else title.style.color = '#ffd700';

    // Показываем окно
    document.getElementById('itemInfoModal').style.display = 'flex';
}

function closeItemInfo() {
    document.getElementById('itemInfoModal').style.display = 'none';
}