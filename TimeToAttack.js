javascript:(function () {

    const titleText = "Time To Attack";
    const LATE_TOLERANCE = 20000; // 20 Sekunden Zeitpuffer

    function createUI() {
        if (document.getElementById("bbcodePlanner")) return;

        const box = document.createElement("div");
        box.id = "bbcodePlanner";
        box.style = `
            position:fixed; bottom:20px; right:20px; width:300px;
            background:#f4e4bc; border:2px solid #603000; padding:10px;
            z-index:99999; font-size:12px; font-family: Verdana, Arial;
        `;

        box.innerHTML = `
            <div id="plannerHeader" style="display:flex; justify-content:flex-end; align-items:center; margin-bottom:5px;">
                <b id="toolTitle" style="margin-right: auto;">${titleText}</b>
                <button id="closePlanner" style="background:red; color:white; border:none; cursor:pointer; padding:2px 5px; font-weight:bold;">X</button>
            </div>

            <div id="setupContainer">
                <textarea id="bbcodeInput" style="width:100%;height:80px;box-sizing:border-box;" placeholder="BBCode hier rein..."></textarea>
                <div style="margin: 8px 0; display:flex; justify-content:space-between; align-items:center;">
                    <span>Warnung (Sekunden):</span>
                    <input type="number" id="warningSeconds" value="10" style="width:50px; border:1px solid #603000;">
                </div>
                <button id="startTimers" style="width:100%; padding:5px; cursor:pointer; background:#21881e; color:white; border:none; font-weight:bold;">Timer starten</button>
            </div>

            <div id="timerList" style="max-height:250px;overflow:auto;"></div>
        `;

        document.body.appendChild(box);
        document.getElementById("closePlanner").onclick = () => box.remove();
    }

    function parseBBCode(bbcode) {
        const regex = /\[\*\]\[unit\](.*?)\[\/unit\]\[\|\]\s*(\d+\|\d+).*?\[\|\](\d+\/\d+\/\d+\s+\d+:\d+:\d+).*?\[url=(.*?)\]/g;
        let result = [];
        let match;

        while ((match = regex.exec(bbcode)) !== null) {
            result.push({
                unit: match[1],
                coords: match[2],
                launchTime: new Date(match[3].replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$2-$1")),
                url: match[4],
                warned: false,
                clicked: false
            });
        }
        return result;
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
        row.style = "margin-bottom:5px;padding:5px;border-bottom:1px solid #603000; display:flex; justify-content:space-between; align-items:center;";

        row.innerHTML = `
            <span><img src="${getUnitIcon(plan.unit)}" style="vertical-align:middle;width:16px;margin-right:5px;"><b>${plan.coords}</b></span>
            <span id="display_${plan.coords.replace('|','_')}" style="font-weight:bold; font-family:monospace; flex-grow:1; text-align:center;">Lade...</span>
            <button id="btn_${plan.coords.replace('|','_')}" style="cursor:pointer; min-width:70px;" disabled>Senden</button>
        `;

        list.appendChild(row);

        const display = row.querySelector(`#display_${plan.coords.replace('|','_')}`);
        const btn = row.querySelector(`#btn_${plan.coords.replace('|','_')}`);

        btn.onclick = () => {
            plan.clicked = true;
            window.open(plan.url, "_blank");
            
            // Status im Display anzeigen
            display.innerHTML = "<span style='color:green;'>Abgeschickt</span>";
            
            // Button komplett entfernen
            btn.remove();
            row.style.background = "rgba(0, 255, 0, 0.05)";
        };

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = plan.launchTime.getTime() - now;

            if (diff <= 0) {
                if (!plan.clicked) {
                    display.innerHTML = "<span style='color:green;'>JETZT!</span>";
                    btn.disabled = false;
                    btn.style.background = "green";
                    btn.style.color = "white";

                    // Check ob Zeit abgelaufen (20 Sek Puffer)
                    if (diff < -LATE_TOLERANCE) {
                        display.innerHTML = "<span style='color:red;'>Verpasst</span>";
                        // Button komplett entfernen
                        btn.remove();
                        row.style.background = "rgba(255, 0, 0, 0.05)";
                        clearInterval(interval);
                    }
                } else {
                    // Bereits geklickt, Timer stoppen
                    clearInterval(interval);
                }
                return;
            }

            if (diff <= warningTimeMs && !plan.warned) {
                playSound();
                plan.warned = true;
                row.style.background = "#ffd700";
            }

            const total = Math.floor(diff / 1000);
            const m = Math.floor(total / 60);
            const s = total % 60;
            display.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        }, 100);
    }

    function init() {
        createUI();

        document.getElementById("startTimers").onclick = () => {
            const input = document.getElementById("bbcodeInput").value;
            const warningSec = parseInt(document.getElementById("warningSeconds").value) || 10;
            const plans = parseBBCode(input);

            if (!plans.length) {
                alert("Kein gültiger BBCode!");
                return;
            }

            document.getElementById("setupContainer").remove();
            document.getElementById("plannerHeader").style.marginBottom = "5px";

            plans.forEach(p => createTimer(p, warningSec * 1000));
        };
    }

    init();

})();