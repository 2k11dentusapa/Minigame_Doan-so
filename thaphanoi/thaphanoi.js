/*

  @  LAST COMMIT: 2026-07-28 11:09:49 by 2k11dentusapa, using VSCode
  @  TUYỆT ĐỐI KHÔNG SAO CHÉP VÀ SỬ DỤNG MÃ NGUỒN KHI CHƯA CÓ SỰ CHO PHÉP CỦA TÁC GIẢ
  
*/

function addStyle(element, properties, values) {
    if (properties.length !== values.length) {
        console.error("");
        return;
    }
    properties.forEach((prop, index) => {
        element.style[prop] = values[index];
    });
}

(() => {

    function DisabledEvent() {
        for (let [event, logic] of arguments) {
            document.addEventListener(event, (e) => {
                let shouldPrevent = typeof logic === "function" ? logic(e) : logic;
                if (shouldPrevent) e.preventDefault();
            })
        }
    }

    const $ = id => document.getElementById(id);
    const diskElements = {};
    let towers = [
        [],
        [],
        []
    ];
    let diskCount = 3;
    let selectedDisk = null;
    let selectedTower = null;
    let moveCount = 0;
    let gameRunning = false;
    let timerInterval = null;

    function createDisk(size){
        const disk = document.createElement("div");
        disk.className = `disk disk-${size}`;
        disk.dataset.size = size;
        disk.textContent = size;
        const MIN_WIDTH = 120;
        const STEP = 35;
        disk.style.width = `${MIN_WIDTH + (size - 1) * STEP}px`;
        disk.style.position = "absolute";
        disk.style.left = "50%";
        disk.style.transform = "translateX(-50%)";
        diskElements[size] = disk;
    
        disk.addEventListener("click", e => {
            e.stopPropagation();
            if(!gameRunning) return;
            selectDisk(disk);
        });
    
        return disk;
    }

    function initDisks(level){
        diskCount = level;
        towers = [
            [],
            [],
            []
        ]; 
        // Xóa đĩa khỏi HTML
        document.querySelectorAll(".disk").forEach(disk => {
                disk.remove();
            });
        // Xóa cache
        Object.keys(diskElements).forEach(key=>{
                delete diskElements[key];
            });
    
        // Tạo lại
        for(let i = level; i >= 1; i--) {
            towers[0].push(i);
            createDisk(i);
        }
    
        renderDisks();
    }

    function renderDisks() {
        const towerElements = document.querySelectorAll(".tower");
    
        towers.forEach((tower, index) => {
            tower.forEach((size, level) => {
                const disk = diskElements[size];
                if (!disk) return;
                const parent = towerElements[index];
                if (disk.parentElement !== parent) {
                    parent.appendChild(disk);
                }
    
                disk.style.bottom =`${28 + level * 30}px`;
                disk.style.left="50%";
                disk.style.transform = "translateX(-50%)";
            });
        });
    }

    function selectDisk(disk) {
        const tower = Number(disk.parentElement.dataset.index);
        const topDisk = towers[tower][ towers[tower].length - 1];
        if (topDisk !== Number(disk.dataset.size)) return;
        clearSelect();
        selectedDisk = disk;
        selectedTower = tower;
        disk.classList.add("selected");
    }

    function clearSelect() {
        if (selectedDisk) {
            selectedDisk.classList.remove("selected");
        }
        selectedDisk=null;
        selectedTower=null;
    }

    function canMove(from,to){
        if (from === to)return false;
        if (towers[from].length === 0) return false;
        if(towers[to].length === 0) return true;
        const moving = towers[from][towers[from].length - 1];
        const target = towers[to][towers[to].length - 1];
        return moving < target;
    }

    function animateDisk(disk, targetTower, newBottom, callback) {
        disk.style.pointerEvents = "none";
        const fromRect = disk.getBoundingClientRect();
        const toTowerRect = targetTower.getBoundingClientRect();
        const targetLeft = toTowerRect.left + toTowerRect.width / 2 - fromRect.width / 2;
        const targetTop = toTowerRect.bottom - newBottom - fromRect.height;
        const dx = targetLeft - fromRect.left;
        const dy = targetTop - fromRect.top;
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.left = '0';
        wrapper.style.top = '0';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.pointerEvents = 'none';
        disk.parentNode.insertBefore(wrapper, disk);
        wrapper.appendChild(disk);
        disk.offsetHeight;
        disk.classList.add('disk-go-up');
        setTimeout(() => {
            wrapper.classList.add('disk-go-across');
            wrapper.style.transform = `translateX(${dx}px)`;
            setTimeout(() => {
                disk.classList.remove('disk-go-up');
                disk.classList.add('disk-go-down');
                disk.style.transform = `translate(-50%, ${dy}px)`;
                setTimeout(() => {
                    disk.classList.remove('disk-go-down');
                    disk.style.transform = "translateX(-50%)";
                    disk.style.bottom = `${newBottom}px`;
                    
                    if (wrapper.parentNode) {
                        wrapper.parentNode.removeChild(wrapper);
                    }
                    disk.style.pointerEvents = "";
                    if (callback) callback();
                }, 350);
            }, 450);
        }, 350);
    }
    
    function moveDisk(from,to) {
        if (!selectedDisk) return false;
        if (!canMove(from,to)) {
            clearSelect();
            return false;
        }
        const disk = selectedDisk;
        const size = towers[from][towers[from].length - 1];
        const targetTower = document.querySelectorAll(".tower")[to];
        const bottom = 28 + towers[to].length * 30;
    
        towers[from].pop();
        towers[to].push(size);
        moveCount++;
        $("moveCount").textContent = moveCount;
    
        animateDisk(disk, targetTower, bottom, ()=>{
            renderDisks();
            checkWin();
            clearSelect();
        });
        return true;
    }

    function checkWin() {
        if (towers[2].length!==diskCount) return;
        gameRunning = false;
        clearInterval(timerInterval);
        timerInterval = null;
        gameOver();
    }
    function gameOver() {
        $("overlay").classList.remove("hidden");
        $("finalMove").textContent=moveCount;
        $("finalTime").textContent = $("timer").textContent;
    }
    function gameStart(level) {
        if (level === undefined) {
            level = Number($("level").value);
        }
        stopTimer();
        gameRunning = true;
        clearSelect();
        resetStats(level);
        $("overlay")?.classList.add("hidden");
        initDisks(level);
        runTimer();
    }

    function initEvents() {
        $("newGame").addEventListener("click", gameStart);
        $("reset").addEventListener("click", gameStart);
        $("playAgain")?.addEventListener("click", gameStart);
        $("level").addEventListener("change",e => {
            gameStart(
                Number(e.target.value)
            );
        });
        document.querySelectorAll(".tower").forEach(tower => {
            tower.addEventListener("click",() => {
                if(selectedDisk === null) return;
                moveDisk( selectedTower, Number(tower.dataset.index));
            });
        });
    }

    function init() {
        console.log("INIT");
        initEvents();
        console.log("EVENT OK");
        gameStart();
        console.log("GAME START OK");
    }
    function runTimer() {
        stopTimer();
        const start = Date.now();
        timerInterval = setInterval(() => {
            if (!gameRunning) return;
            const sec = Math.floor((Date.now() - start)/1000);
            $("timer").textContent = formatTime(sec);
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function formatTime(sec) {
        const m = String(Math.floor(sec / 60)).padStart(2, "0");
        const s=String(sec % 60).padStart(2,"0");
        return `${m}:${s}`;
    }
    function resetStats(level) {
        moveCount = 0;
        $("moveCount").textContent= "0";
        $("timer").textContent= "00:00";
        $("bestMove").textContent = (1 << level) - 1;
    }

    init();

    DisabledEvent(
        ["keydown", e => (e.ctrlKey && (e.key === "c" || e.key === "u")) || e.key==="F12" ],
        ["contextmenu", true]
    );
})();

/*
addStyle
IIFE {
    DisabledEvent
    createDisk
    initDisks
    renderDisks
    selectDisk
    clearSelect
    canMove
    animateDisk
    moveDisk
    checkWin
    gameOver
    gameStart
    initEvents
    init
    runTimer
    stopTimer
    formatTime
    resetStats
}
*/
