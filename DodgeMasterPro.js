javascript:(function () {  

    const CONFIG = {  
        minDist: 3.0,  
        maxDist: 8.0,  
        title: "Dodge-Master PRO",  
        warningTimeMs: 15000,  
        lateTolerance: 5000,
        lsPrefix: "raDodge"
    };  

    /* --- UNIT INFO LOGIK (1:1 VOM PLANNER) --- */
    let unitInfo = JSON.parse(localStorage.getItem(`${CONFIG.lsPrefix}_unit_info`));
    let lastUpdate = localStorage.getItem(`${CONFIG.lsPrefix}_last_updated`) || 0;

    function fetchUnitInfo() {
        jQuery.ajax({ url: '/interface.php?func=get_unit_info' }).done(function (response) {
            let data = {};
            jQuery(response).children().each(function () {
                let $unit = jQuery(this);
                if ($unit.children().length > 0) {
                    let unitType = this.tagName;
                    data[unitType] = { speed: parseFloat($unit.find("speed").text()) };
                }
            });
            unitInfo = data;
            localStorage.setItem(`${CONFIG.lsPrefix}_unit_info`, JSON.stringify(data));
            localStorage.setItem(`${CONFIG.lsPrefix}_last_updated`, Date.now());
            console.log("Unit Speeds aktualisiert:", data);
        });
    }

    // Wenn keine Daten da oder älter als 24h -> Neu laden
    if (!unitInfo || (Date.now() - lastUpdate > 24 * 60 * 60 * 1000)) {
        fetchUnitInfo();
    }

    /* --- SEITEN-CHECK --- */
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
        new Audio("https://www.soundjay.com/misc/sounds/whistle-flute-2.mp3").play();  
    }  

    if (document.getElementById("ra_dodge_popup")) document.getElementById("ra_dodge_popup").remove();  
    const box = document.createElement("div");  
    box.id = "ra_dodge_popup";  
    box.style = "position:fixed; top:50px; left:50px; width:360px; background:#f4e4bc; border:2px solid #603000; z-index:10000; font-family: Verdana; border-radius: 4px; box-shadow: 5px 5px 15px rgba(0,0,0,0.4);";  
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
    fetch("/map/village.txt").then(r => r.text()).then(d => {  
        d.trim().split("\n").forEach(l => {  
            const v = l.split(",");  
            if (v[4] === "0") allBBs.push({id: v[0], x: parseInt(v[2]), y: parseInt(v[3])});  
        });  
        findAttacksByAnyMeans();  
    });  

    function findAttacksByAnyMeans() {  
        const list = document.getElementById("ra_list");  
        list.innerHTML = "";  
        const headers = Array.from(document.querySelectorAll("#incomings_table th")); 
        const arrivalIdx = headers.findIndex(th => th.innerText.includes("Arrival") || th.innerText.includes("Ankunft")); 
        const rows = document.querySelectorAll("#incomings_table tr.nowrap");  
        
        rows.forEach(row => {  
            const cells = row.querySelectorAll("td"); 
            if (!cells[arrivalIdx]) return; 

            const arrivalText = cells[arrivalIdx].innerText; 
            const timeMatch = arrivalText.match(/(\d{1,2}):(\d{2}):(\d{2}):?(\d{3})?/);  
            if (timeMatch && !/Unterstützung|Support/i.test(row.innerText)) {  
                const link = row.querySelector("a[href*='screen=overview']");  
                const coordMatch = link ? link.innerText.match(/\((\d+)\|(\d+)\)/) : null;

                if (link && coordMatch) {  
                    const vId = link.href.match(/village=(\d+)/)[1];  
                    const vX = parseInt(coordMatch[1]);
                    const vY = parseInt(coordMatch[2]);

                    let localBBs = allBBs.map(bb => {
                        const d = Math.sqrt(Math.pow(vX - bb.x, 2) + Math.pow(vY - bb.y, 2));
                        return { ...bb, dist: d };
                    }).filter(bb => bb.dist >= CONFIG.minDist && bb.dist <= CONFIG.maxDist)
                      .sort((a,b) => a.dist - b.dist);

                    const targetBB = localBBs[0] || null;
                    const sNow = getCurrentServerTime(); 
                    let targetDate = new Date(new Date(sNow).getFullYear(), new Date(sNow).getMonth(), new Date(sNow).getDate(), parseInt(timeMatch[1]), parseInt(timeMatch[2]), parseInt(timeMatch[3]), timeMatch[4] ? parseInt(timeMatch[4]) : 0);  
                    if (targetDate.getTime() < sNow) targetDate.setDate(targetDate.getDate() + 1);  

                    /* BackTime-Logik: 23 Stunden (Standard für Dodge) */
                    const finalLaunchTime = targetDate.getTime() - (23 * 60 * 60 * 1000);

                    createTimerRow({  
                        id: vId,  
                        name: link.innerText.trim(),  
                        launchTime: finalLaunchTime,  
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
        const row = document.createElement("div");  

        row.style = "background:white; border:1px solid #bd9c5a; padding:8px; font-size:11px; border-radius:3px; display:flex; flex-direction:column; gap:5px;";  
        row.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;">  
                            <b>${atk.name}</b>  
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