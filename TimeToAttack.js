javascript:(function () {

    const titleText = "Time To Attack Pro";
    const LATE_TOLERANCE = 20000; 

    const getCurrentServerTime = () => { 
        try { return timing.getTimingObject().getTime(); } 
        catch (e) { return Date.now() + (window.Timing ? window.Timing.offset || 0 : 0); } 
    }; 

    function getVillageName(coords) {
        /* Versuche Name aus game_data (eigene Dörfer) */
        if (window.game_data && window.game_data.villages) {
            const v = Object.values(window.game_data.villages).find(v => `${v.x}|${v.y}` === coords);
            if (v) return decodeURIComponent(v.name).replace(/\+/g, ' ');
        }
        /* Versuche Name aus TWMap (geladene Kartendaten) */
        if (window.TWMap && window.TWMap.villages) {
            const [x, y] = coords.split('|');
            const mv = window.TWMap.villages[x * 1000 + parseInt(y)];
            if (mv && mv.name) return mv.name;
        }
        return coords; /* Fallback auf Koordinaten */
    }

    function createUI() {
        if (document.getElementById("bbcodePlanner")) return;
        const box = document.createElement("div");
        box.id = "bbcodePlanner";
        box.style = `position:fixed; bottom:20px; right:20px; width:450px; background:#f4e4bc; border:2px solid #603000; padding:10px; z-index:99999; font-size:12px; font-family: Verdana, Arial; box-shadow: 0 0 15px rgba(0,0,0,0.4);`;
        box.innerHTML = `
            <div id="plannerHeader" style="display:flex; justify-content:flex-end; align-items:center; margin-bottom:5px; border-bottom: 1px solid #603000; padding-bottom: 5px;">
                <b id="toolTitle" style="margin-right: auto;">${titleText}</b>
                <button id="closePlanner" style="background:red; color:white; border:none; cursor:pointer; padding:2px 5px; font-weight:bold;">X</button>
            </div>
            <div id="setupContainer">
                <textarea id="bbcodeInput" style="width:100%;height:100px;box-sizing:border-box;" placeholder="BBCode hier rein..."></textarea>
                <div style="margin: 8px 0; display:flex; justify-content:space-between; align-items:center;">
                    <span>Warnung (Sekunden):</span>
                    <input type="number" id="warningSeconds" value="30" style="width:50px; border:1px solid #603000;">
                </div>
                <div style="margin: 8px 0; display:flex; align-items:center; gap:5px;">
                    <input type="checkbox" id="speedMode" style="cursor:pointer;">
                    <label for="speedMode" style="cursor:pointer; font-weight:bold;">Speed Tribal Wars (23h Dodge)</label>
                </div>
                <button id="startTimers" style="width:100%; padding:8px; cursor:pointer; background:#21881e; color:white; border:none; font-weight:bold;">Timer starten</button>
            </div>
            <div id="timerList" style="max-height:350px;overflow-y:auto; overflow-x:hidden;"></div>
        `;
        document.body.appendChild(box);
        document.getElementById("closePlanner").onclick = () => box.remove();
    }

    function parseBBCode(bbcode, isSpeed) {
        let result = [];
        const blocks = bbcode.split(/Plan for:?\s*/gi);
        
        blocks.forEach(block => {
            if (!block.trim()) return;
            
            const targetMatch = block.match(/(\d{1,3}\|\d{1,3})/);
            const targetCoord = targetMatch ? targetMatch[1] : "???";
            const targetName = getVillageName(targetCoord);

            const landingMatch = block.match(/Landing Time:.*?(\d{2}:\d{2}:\d{2})/i);
            const landingTimeStr = landingMatch ? landingMatch[1] : "--:--:--";

            const regex = /\[\*\]\[unit\](.*?)\[\/unit\]\[\|\]\s*(\d{1,3}\|\d{1,3}).*?\[\|\]\s*.*?\[\|\]\d+\/\d+\/\d+\s+(\d+):(\d+):(\d+).*?\[url=(.*?)\]/g;
            let match;

            while ((match = regex.exec(block)) !== null) {
                /* Nutzt die lokale Zeit des PCs für das Datum */
                let launchTimeDate = new Date(); 
                launchTimeDate.setHours(parseInt(match[3]), parseInt(match[4]), parseInt(match[5]), 0);

                /* Prüft gegen die aktuelle Serverzeit, ob der Termin heute schon durch ist */
                const sNow = getCurrentServerTime();
                if (launchTimeDate.getTime() < sNow) {
                    launchTimeDate.setDate(launchTimeDate.getDate() + 1);
                }

                let launchTimeMs = launchTimeDate.getTime();
                
                /* Speedwelt Logik: Zieht 23h ab, wenn Checkbox aktiv */
                if (isSpeed) { 
                    launchTimeMs -= (23 * 60 * 60 * 1000); 
                }

                result.push({
                    unit: match[1],
                    fromCoord: match[2],
                    fromName: getVillageName(match[2]),
                    targetCoord: targetCoord,
                    targetName: targetName,
                    landingTime: landingTimeStr,
                    launchTime: launchTimeMs,
                    url: match[6],
                    warned: false,
                    clicked: false,
                    id: Math.random().toString(36).substr(2, 9)
                });
            }
        });
        return result.sort((a, b) => a.launchTime - b.launchTime);
    }

    function playSound() {
        new Audio("https://www.soundjay.com/misc_c2026/sounds/hohner-melodica-1.mp3").play();
    }

    function getUnitIcon(unit) { 
        return `/graphic/unit/unit_${unit}.webp`; 
    }

    function createTimer(plan, warningTimeMs) {
        const list = document.getElementById("timerList");
        const row = document.createElement("div");
        row.style = "margin-bottom:5px;padding:8px;border-bottom:1px solid #603000; background:rgba(255,255,255,0.2);";
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
                <span style="font-size:10px; line-height: 1.2; width: 150px; flex-shrink: 0;">
                    <img src="${getUnitIcon(plan.unit)}" style="vertical-align:middle;width:20px;margin-right:5px;">
                    <b>Von:</b> ${plan.fromName} (${plan.fromCoord})<br>
                    <b>Nach:</b> ${plan.targetName} (${plan.targetCoord})
                </span>

                <span style="flex-grow: 1; text-align: center; color: red; font-weight: bold; font-size: 16px; white-space: nowrap;">
                    Einschlag: ${plan.landingTime}
                </span>

                <span id="display_${plan.id}" style="font-weight:bold; font-family:monospace; width: 80px; text-align:right; font-size: 16px;">
                    Lade...
                </span>
            </div>
            <button id="btn_${plan.id}" style="cursor:pointer; width:100%; padding:3px; font-weight:bold;" disabled>Senden</button>
        `;
        list.appendChild(row);

        const display = row.querySelector(`#display_${plan.id}`);
        const btn = row.querySelector(`#btn_${plan.id}`);

        let interval = setInterval(() => {
            const now = getCurrentServerTime();
            const diff = plan.launchTime - now;

            if (diff <= warningTimeMs && !plan.warned) {
                playSound();
                plan.warned = true;
                row.style.background = "#ffd700";
                btn.disabled = false;
                btn.style.background = "green";
                btn.style.color = "white";
                btn.textContent = "JETZT SENDEN";
            }

            if (diff <= 0) {
                if (!plan.clicked) {
                    display.innerHTML = "<span style='color:green;'>JETZT!</span>";
                    if (diff < -LATE_TOLERANCE) {
                        display.innerHTML = "<span style='color:red;'>Verpasst</span>";
                        btn.remove();
                        row.style.background = "rgba(255, 0, 0, 0.05)";
                        clearInterval(interval);
                    }
                } else { clearInterval(interval); }
                return;
            }

            const total = Math.floor(diff / 1000);
            const h = Math.floor(total / 3600);
            const m = Math.floor((total % 3600) / 60);
            const s = total % 60;
            
            if (h > 0) {
                display.textContent = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            } else {
                display.textContent = `${m}:${s.toString().padStart(2, '0')}`;
            }
        }, 100);

        btn.onclick = () => {
            plan.clicked = true;
            clearInterval(interval);
            window.open(plan.url, "_blank");
            display.innerHTML = "<span style='color:green;'>OK</span>";
            btn.remove();
            row.style.background = "rgba(0, 255, 0, 0.1)";
        };
    }

    function init() {
        createUI();
        document.getElementById("startTimers").onclick = () => {
            const input = document.getElementById("bbcodeInput").value;
            /* Hier wird der Wert aus dem Feld genommen, Standard ist 30 */
            const warningSec = parseInt(document.getElementById("warningSeconds").value) || 30;
            const isSpeed = document.getElementById("speedMode").checked;
            const plans = parseBBCode(input, isSpeed);
            if (!plans.length) { alert("Kein gültiger BBCode!"); return; }
            document.getElementById("setupContainer").style.display = "none";
            plans.forEach(p => createTimer(p, warningSec * 1000));
        };
    }
    init();
})();