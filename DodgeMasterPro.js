javascript:(function () {  

    const DEBUG = true; // Debug-Modus für Konsole

    const CONFIG = {  
        minDist: 3.0,  
        maxDist: 8.0,  
        title: "Dodge-Master PRO + BackTime",  
        warningTimeMs: 15000,  
        lateTolerance: 5000  
    };  

    /* Einheiten-Geschwindigkeiten für BackTime */
    const UNIT_SPEEDS = {
        "spy": 9, "scout": 9, "light": 10, "marcher": 10, "heavy": 11,
        "spear": 18, "axe": 18, "archer": 18, "sword": 22,
        "ram": 30, "catapult": 30, "cata": 30, "snob": 35, "ag": 35, "noble": 35,
        "knight": 10, "paladin": 10
    };

    /* Debug-Logger */
    const log = (msg, obj = "") => {
        if (DEBUG) console.debug(`[Dodge-Debug] ${msg}`, obj);
    };

    const isPlace = window.location.hash === "#dodge_go" && game_data.screen === "place";
    const isIncomings = game_data.screen === "overview_villages" && window.location.href.includes("mode=incomings");

    if (!isIncomings && !isPlace) {
        UI.InfoMessage("Leite zur Übersicht 'Ankommend' weiter...", 1000);
        setTimeout(() => {
            window.location.assign(window.location.origin + "/game.php?screen=overview_villages&mode=incomings");
        }, 500);
        return;
    }

    const getCurrentServerTime = () => { 
        try { return timing.getTimingObject().getTime(); } 
        catch (e) { return Date.now() + (window.Timing ? window.Timing.offset || 0 : 0); } 
    }; 

    function playSound() {  
        new Audio("https://www.soundjay.com/misc_c2026/sounds/whistle-flute-2.mp3").play();  
    }  

    /* Welt-Einstellungen für präzise BackTime */
    const worldSpeed = parseFloat(window.game_data.get_settings.speed);
    const unitSpeed = parseFloat(window.game_data.get_settings.unit_speed);
    log(`Welt-Speed: ${worldSpeed}, Unit-Speed: ${unitSpeed}`);

    function calculateTravelTime(dist, unit) {
        const baseSpeed = UNIT_SPEEDS[unit.toLowerCase()];
        if (!baseSpeed) return null;
        const totalMinutes = (dist * baseSpeed) / (worldSpeed * unitSpeed);
        return Math.round(totalMinutes * 60 * 1000);
    }

    function getBackTime(arrivalMs, dist, attackName) {
        let detectedUnit = null;
        Object.keys(UNIT_SPEEDS).forEach(u => {
            if (attackName.toLowerCase().includes(u)) detectedUnit = u;
        });
        if (!detectedUnit) return null;
        const travelTimeMs = calculateTravelTime(dist, detectedUnit);
        return new Date(arrivalMs + travelTimeMs);
    }

    if (document.getElementById("ra_dodge_popup")) document.getElementById("ra_dodge_popup").remove();  
    const box = document.createElement("div");  
    box.id = "ra_dodge_popup";  
    box.style = "position:fixed; top:50px; left:50px; width:380px; background:#f4e4bc; border:2px solid #603000; z-index:10000; font-family: Verdana; border-radius: 4px; box-shadow: 5px 5px 15px rgba(0,0,0,0.4);";  
    box.innerHTML = `<div id="ra_h" style="background:#603000; color:white; padding:8px; cursor:move; font-weight:bold; display:flex; justify-content:space-between;">  
                        <span>${CONFIG.title}</span>  
                        <span onclick="this.parentElement.parentElement.remove()" style="cursor:pointer;">X</span>  
                     </div>  
                     <div id="ra_list" style="padding:10px; max-height:400px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">Scanning...</div>`;  
    document.body.appendChild(box);  

    let isDragging = false, offset = [0,0];  
    document.getElementById("ra_h").onmousedown = (e) => { isDragging = true; offset = [box.offsetLeft - e.clientX, box.offsetTop - e.clientY]; };  
    document.onmousemove = (e) => { if (isDragging) { box.style.left = (e.clientX + offset[0]) + "px"; box.style.top = (e.clientY + offset[1]) + "px"; } };  
    document.onmouseup = () => isDragging = false;  

    let allBBs = [];  
    log("Lade Kartendaten...");
    fetch("/map/village.txt").then(r => r.text()).then(d => {  
        d.trim().split("\n").forEach(l => {  
            const v = l.split(",");  
            if (v[4] === "0") allBBs.push({id: v[0], x: parseInt(v[2]), y: parseInt(v[3])});  
        });  
        log(`${allBBs.length} Barbarendörfer gefunden.`);
        findAttacksByAnyMeans();  
    });  

    function findAttacksByAnyMeans() {  
        const list = document.getElementById("ra_list");  
        list.innerHTML = "";  
        const headers = Array.from(document.querySelectorAll("#incomings_table th")); 
        const arrivalIdx = headers.findIndex(th => th.innerText.includes("Arrival") || th.innerText.includes("Ankunft")); 
        const originIdx = headers.findIndex(th => th.innerText.includes("Herkunft") || th.innerText.includes("Origin")); 
        const rows = document.querySelectorAll("#incomings_table tr.nowrap");  
        
        rows.forEach((row, idx) => {  
            const cells = row.querySelectorAll("td"); 
            if (!cells[arrivalIdx]) return; 

            const arrivalText = cells[arrivalIdx].innerText; 
            const timeMatch = arrivalText.match(/(\d{1,2}):(\d{2}):(\d{2}):?(\d{3})?/);  
            if (timeMatch && !/Unterstützung|Support/i.test(row.innerText)) {  
                const link = row.querySelector("a[href*='screen=overview']");  
                const originLink = cells[originIdx] ? cells[originIdx].querySelector("a") : null;
                const coordMatch = link ? link.innerText.match(/\((\d+)\|(\d+)\)/) : null;
                const originMatch = originLink ? originLink.innerText.match(/\((\d+)\|(\d+)\)/) : null;

                if (link && coordMatch) {  
                    const vId = link.href.match(/village=(\d+)/)[1];  
                    const vX = parseInt(coordMatch[1]);
                    const vY = parseInt(coordMatch[2]);
                    const attackName = link.innerText.trim();

                    /* BackTime Distanz zum Angreifer */
                    let atkDist = 0;
                    if (originMatch) {
                        atkDist = Math.sqrt(Math.pow(vX - parseInt(originMatch[1]), 2) + Math.pow(vY - parseInt(originMatch[2]), 2));
                    }

                    log(`Angriff erkannt: ${attackName} (Ziel: ${vX}|${vY}, Herkunft-Dist: ${atkDist.toFixed(2)})`);

                    let localBBs = allBBs.map(bb => {
                        const d = Math.sqrt(Math.pow(vX - bb.x, 2) + Math.pow(vY - bb.y, 2));
                        return { ...bb, dist: d };
                    }).filter(bb => bb.dist >= CONFIG.minDist && bb.dist <= CONFIG.maxDist)
                      .sort((a,b) => a.dist - b.dist);

                    const targetBB = localBBs[0] || null;
                    const sNow = getCurrentServerTime(); 
                    let targetDate = new Date(new Date(sNow).getFullYear(), new Date(sNow).getMonth(), new Date(sNow).getDate(), parseInt(timeMatch[1]), parseInt(timeMatch[2]), parseInt(timeMatch[3]), timeMatch[4] ? parseInt(timeMatch[4]) : 0);  
                    if (targetDate.getTime() < sNow) targetDate.setDate(targetDate.getDate() + 1);  

                    const backTimeDate = getBackTime(targetDate.getTime(), atkDist, attackName);
                    const finalLaunchTime = targetDate.getTime() - (23 * 60 * 60 * 1000);

                    createTimerRow({  
                        id: vId,  
                        name: attackName,  
                        launchTime: finalLaunchTime,  
                        backTime: backTimeDate,
                        bb: targetBB,
                        warned: false,  
                        clicked: false  
                    }, list);  
                }  
            }  
        });  

        if (list.children.length === 0) {  
            list.innerHTML = "<div style='color:red; font-size:11px; text-align:center;'>Keine Angriffe erkannt.</div>";  
        }  
    }  

    function createTimerRow(atk, parent) {  
        const bb = atk.bb;  
        const backTimeStr = atk.backTime ? atk.backTime.toLocaleTimeString('de-DE') : "???";
        const row = document.createElement("div");  

        row.style = "background:white; border:1px solid #bd9c5a; padding:8px; font-size:11px; border-radius:3px; display:flex; flex-direction:column; gap:5px;";  
        row.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;">  
                            <div><b>${atk.name}</b><br><span style="color:#666;">Back: ${backTimeStr}</span></div>  
                            <span id="display_${atk.id}" style="font-weight:bold; font-family:monospace; color:red; font-size:26px;">Lade...</span>  
                         </div>  
                         <button id="btn_${atk.id}" style="width:100%; background:${bb?'#666':'#333'}; color:white; border:none; padding:6px; cursor:pointer; font-weight:bold; border-radius:3px;">  
                            DODGE TO ${bb ? bb.x+'|'+bb.y+' ('+bb.dist.toFixed(1)+' F)' : 'NO BB IN RANGE'}  
                         </button>`;  
        
        parent.appendChild(row);  
        const display = row.querySelector(`#display_${atk.id}`);  
        const btn = row.querySelector(`#btn_${atk.id}`);  
        const url = `/game.php?village=${atk.id}&screen=place&target=${bb?bb.id:''}#dodge_go`;  

        btn.onclick = () => {  
            if(!bb) return;
            atk.clicked = true;  
            window.open(url, "_blank");  
            display.innerHTML = "<span style='color:green;'>Truppen laufen</span>";  
            btn.style.background = "#21881e";  
        };  

        const interval = setInterval(() => {  
            const now = getCurrentServerTime();  
            const diff = atk.launchTime - now;  

            if (diff <= CONFIG.warningTimeMs && !atk.warned) {  
                playSound();  
                atk.warned = true;  
                row.style.background = "#ffd700";  
                btn.style.background = "#21881e";  
            }  

            if (diff <= 0) {  
                if (!atk.clicked) {  
                    display.innerHTML = "<span style='color:green;'>JETZT!</span>";  
                    if (diff < -CONFIG.lateTolerance) {  
                        display.innerHTML = "<span style='color:grey;'>Vorbei</span>";  
                        row.style.background = "rgba(0,0,0,0.05)";  
                        btn.style.background = "#666";  
                        clearInterval(interval);  
                    }  
                } else {  
                    clearInterval(interval);  
                }  
                return;  
            }  

            const total = Math.floor(diff / 1000);  
            const m = Math.floor(total / 60);  
            const s = total % 60;  
            display.textContent = m.toString().padStart(2, '0') + ":" + s.toString().padStart(2, '0');  
        }, 200);  
    }  

    if (window.location.hash === "#dodge_go" && game_data.screen === "place") {  
        log("Auto-Truppen-Eintragen aktiv...");
        setTimeout(() => {  
            const units = ["spear", "sword", "axe", "archer", "light", "marcher", "heavy", "ram", "catapult", "knight", "snob"];  
            units.forEach(u => {  
                const input = document.getElementById("unit_input_"+u);  
                if (input && input.nextElementSibling && input.nextElementSibling.tagName === 'A') {  
                    input.nextElementSibling.click();  
                }  
            });  
            document.getElementById("target_attack").focus();  
        }, 250);  
    }  
})();