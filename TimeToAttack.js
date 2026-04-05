javascript:(function () {

    const WARNING_TIME = 10000;

    function createUI() {
        if (document.getElementById("bbcodePlanner")) return;

        const box = document.createElement("div");
        box.id = "bbcodePlanner";
        box.style = `
            position:fixed;
            bottom:20px;
            right:20px;
            width:340px;
            background:#f4e4bc;
            border:2px solid #603000;
            padding:10px;
            z-index:99999;
            font-size:12px;
        `;

        box.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <b>BBCode Timer Tool</b>
                <button id="closePlanner" style="background:red;color:white;border:none;">X</button>
            </div>
            <br>

            <textarea id="bbcodeInput" style="width:100%;height:100px;"></textarea><br><br>

            <button id="startTimers" style="width:100%">Timer starten</button>

            <div id="timerList" style="margin-top:10px;max-height:250px;overflow:auto;"></div>
        `;

        document.body.appendChild(box);

        document.getElementById("closePlanner").onclick = () => {
            box.remove();
        };
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
                warned: false
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

    function createTimer(plan) {
        const list = document.getElementById("timerList");

        const row = document.createElement("div");
        row.style = "margin-bottom:8px;padding:5px;border-bottom:1px solid #999;";

        const label = document.createElement("div");
        label.innerHTML = `
            <img src="${getUnitIcon(plan.unit)}" style="vertical-align:middle;margin-right:5px;">
            <b>${plan.coords}</b> (${plan.unit})
        `;

        const countdown = document.createElement("div");
        countdown.textContent = "Lade...";

        const btn = document.createElement("button");
        btn.textContent = "Senden";
        btn.disabled = true;
        btn.style.width = "100%";

        btn.onclick = () => {
            window.open(plan.url, "_blank");
        };

        row.appendChild(label);
        row.appendChild(countdown);
        row.appendChild(btn);

        list.appendChild(row);

        const sendTime = plan.launchTime.getTime();

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = sendTime - now;

            if (diff <= 0) {
                countdown.innerHTML = "<span style='color:green;font-weight:bold;'>JETZT!</span>";
                btn.disabled = false;
                btn.style.background = "green";
                clearInterval(interval);
                return;
            }

            if (diff <= WARNING_TIME && !plan.warned) {
                playSound();
                plan.warned = true;
            }

            countdown.textContent = formatTime(diff);

        }, 100);
    }

    function formatTime(ms) {
        const total = Math.floor(ms / 1000);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function init() {
        createUI();

        document.getElementById("startTimers").onclick = () => {
            const input = document.getElementById("bbcodeInput").value;
            const plans = parseBBCode(input);

            document.getElementById("timerList").innerHTML = "";

            if (!plans.length) {
                alert("Kein gültiger BBCode!");
                return;
            }

            // 🔥 Import-Feld ausblenden nach Start
            document.getElementById("bbcodeInput").style.display = "none";
            document.getElementById("startTimers").style.display = "none";

            plans.forEach(p => createTimer(p));
        };
    }

    init();

})();
