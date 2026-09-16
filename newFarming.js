(function () {
    const DEFAULT = {
        spear: 0,
        light: 0,
        march: 0,
        spy: 10,
        radius: 20
    };

    if ($("#bb_master_ui").length) $("#bb_master_ui").remove();

    const ui = `
        <div id="bb_master_ui" style="position:fixed; top:40px; right:40px; width:450px; background:#e3d5b3; border:2px solid #7d510f; z-index:10000; padding:10px; box-shadow:3px 3px 15px rgba(0,0,0,0.5); font-family:Verdana,Arial; border-radius:5px;">
            <div id="bb_header" style="cursor:move; background:#7d510f; color:#fff; padding:6px; margin:-10px -10px 8px -10px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                <span>BB-Farm Master (Single-Screen)</span>
                <span onclick="$('#bb_master_ui').remove()" style="cursor:pointer; font-weight:bold; padding:0 4px;">[X]</span>
            </div>

            <div id="bb_load_progress_wrap" style="margin-bottom:8px;">
                <div style="background:#c2b18c; border:1px solid #7d510f; height:18px; border-radius:3px; overflow:hidden; position:relative;">
                    <div id="bb_load_progress_bar" style="background:#28a745; width:0%; height:100%; transition:width 0.25s ease;"></div>
                    <span id="bb_load_progress_text" style="position:absolute; top:1px; left:0; width:100%; text-align:center; font-size:10px; font-weight:bold; color:#000;">Starte Suche...</span>
                </div>
            </div>

            <div id="bb_attack_progress_wrap" style="margin-bottom:8px; display:none;">
                <div style="background:#c2b18c; border:1px solid #7d510f; height:20px; border-radius:3px; overflow:hidden; position:relative;">
                    <div id="bb_attack_progress_bar" style="background:#28a745; width:0%; height:100%; transition:width 0.25s ease;"></div>
                    <span id="bb_attack_progress_text" style="position:absolute; top:2px; left:0; width:100%; text-align:center; font-size:11px; font-weight:bold; color:#000;">0 / 0 Angriffe gesendet</span>
                </div>
            </div>

            <div style="background:#d2c09e; padding:6px; border-radius:3px; margin-bottom:8px; font-size:11px;">
                <div style="display:flex; gap:10px; align-items:center; margin-bottom:5px;">
                    <span>Speer: <input type="number" id="cfg_spear" value="${DEFAULT.spear}" style="width:40px;"></span>
                    <span>Lkav: <input type="number" id="cfg_light" value="${DEFAULT.light}" style="width:40px;"></span>
                    <span>Skav: <input type="number" id="cfg_march" value="${DEFAULT.march}" style="width:40px;"></span>
                    <span>Späher: <input type="number" id="cfg_spy" value="${DEFAULT.spy}" style="width:40px;"></span>
                    <span>Radius: <input type="number" id="cfg_radius" value="${DEFAULT.radius}" style="width:40px;"></span>
                </div>
            </div>

            <div id="bb_status" style="margin-bottom:5px; font-size:11px; font-weight:bold;">Lese Kartendaten ein...</div>

            <button id="bb_start_farm_btn" class="btn" onclick="startFarming()" style="margin-bottom:6px; font-weight:bold; width:100%; padding:4px;">▶ Alle farmen (danach Enter gedrückt halten)</button>

            <div id="bb_list_container" style="max-height:220px; overflow-y:auto; border:1px solid #7d510f; background:#fff5da;">
                <table class="vis" width="100%">
                    <thead>
                        <tr style="background:#d2c09e;">
                            <th>Dorf</th>
                            <th>Name</th>
                            <th>Dist.</th>
                            <th style="text-align:right;">Aktion</th>
                        </tr>
                    </thead>
                    <tbody id="bb_table_body"></tbody>
                </table>
            </div>
        </div>
    `;
    $('body').append(ui);

    let isDragging = false, offset = [0, 0];
    const box = document.getElementById("bb_master_ui");
    document.getElementById("bb_header").onmousedown = (e) => {
        isDragging = true;
        offset = [box.offsetLeft - e.clientX, box.offsetTop - e.clientY];
    };
    document.onmousemove = (e) => {
        if (isDragging) {
            box.style.left = (e.clientX + offset[0]) + "px";
            box.style.top = (e.clientY + offset[1]) + "px";
            box.style.right = "auto";
        }
    };
    document.onmouseup = () => isDragging = false;

    function setLoadProgress(pct, msg) {
        $("#bb_load_progress_bar").css("width", pct + "%");
        $("#bb_load_progress_text").text(msg);
    }

    const homeX = game_data.village.x;
    const homeY = game_data.village.y;
    let openedIds = new Set();
    let allTargets = [];
    let totalToFarm = 0;
    let farmingStarted = false;
    let busy = false;

    function updateAttackProgress() {
        const pct = totalToFarm > 0 ? Math.round((openedIds.size / totalToFarm) * 100) : 0;
        const open = Math.max(totalToFarm - openedIds.size, 0);
        $("#bb_attack_progress_bar").css("width", pct + "%");
        $("#bb_attack_progress_text").text(`${openedIds.size} / ${totalToFarm} Angriffe gesendet (noch ${open} offen)`);
    }

    window.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;

        const active = document.activeElement;
        const isTypingOnMainPage = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA") && active.ownerDocument === document;
        if (isTypingOnMainPage) return;

        e.preventDefault();
        if (busy) return;

        if (!farmingStarted) {
            startFarming();
            return;
        }

        attackNext();
    });

    setLoadProgress(25, "Lade /map/village.txt...");
    $.get("/map/village.txt", function (data) {
        setLoadProgress(60, "Filtere Barbarendörfer...");
        const lines = data.trim().split("\n");

        const isBBName = (name) => {
            let decoded = decodeURIComponent(name.replace(/\+/g, ' ')).toLowerCase();
            return decoded.includes("barbar") ||
                   decoded.includes("bonus") ||
                   decoded.includes("abandoned") ||
                   decoded.includes("graue");
        };

        for (let i = 0; i < lines.length; i++) {
            const v = lines[i].split(",");
            if (v.length < 5) continue;
            const player_id = parseInt(v[4]);

            if (player_id === 0 && isBBName(v[1])) {
                const x = parseInt(v[2]);
                const y = parseInt(v[3]);
                const dist = Math.sqrt(Math.pow(homeX - x, 2) + Math.pow(homeY - y, 2));
                allTargets.push({
                    id: v[0],
                    name: decodeURIComponent(v[1].replace(/\+/g, ' ')),
                    x: x,
                    y: y,
                    dist: dist
                });
            }
        }

        setLoadProgress(90, "Sortiere nach Distanz...");
        allTargets.sort((a, b) => a.dist - b.dist);
        renderList();

        setLoadProgress(100, "Bereit!");
        setTimeout(() => $("#bb_load_progress_wrap").slideUp(300), 800);
    }).fail(() => {
        setLoadProgress(100, "Fehler beim Laden");
        $("#bb_status").text("Konnte Kartendaten nicht abrufen.");
    });

    function renderList() {
        const body = $("#bb_table_body").empty();
        const currentRadius = parseInt($("#cfg_radius").val()) || DEFAULT.radius;
        const filtered = allTargets.filter(t => t.dist <= currentRadius);

        $("#bb_status").text(`${filtered.length} BBs in Reichweite (${currentRadius} Felder).`);

        filtered.forEach((t) => {
            const done = openedIds.has(t.id.toString());
            body.append(`
                <tr id="bb_row_${t.id}" class="farm-row" data-village-id="${t.id}" style="${done ? 'background-color:#92c200; opacity:0.4;' : ''}">
                    <td style="font-size:11px;">${t.x}|${t.y}</td>
                    <td style="font-size:10px; max-width:110px; overflow:hidden; white-space:nowrap;">${t.name}</td>
                    <td style="font-size:11px;">${t.dist.toFixed(1)}</td>
                    <td style="text-align:right;">
                        <button id="btn_farm_${t.id}" class="btn" style="padding:2px 6px; font-weight:bold;" onclick="attackTarget('${t.id}', '${t.x}|${t.y}')" ${done ? 'disabled' : ''}>${done ? 'Erledigt' : 'Farmen'}</button>
                    </td>
                </tr>
            `);
        });

        if (!farmingStarted) {
            totalToFarm = 0;
            $("#bb_attack_progress_wrap").hide();
        }
    }

    window.startFarming = function () {
        const rows = $(".farm-row").filter(function () {
            return !openedIds.has($(this).data("village-id").toString());
        });

        if (!rows.length) {
            $("#bb_status").text("Keine offenen BBs zum Farmen.");
            return;
        }

        farmingStarted = true;
        totalToFarm = openedIds.size + rows.length;
        $("#bb_attack_progress_wrap").show();
        updateAttackProgress();

        attackNext();
    };

    function attackNext() {
        const nextRow = $(".farm-row").filter(function () {
            return !openedIds.has($(this).data("village-id").toString());
        }).first();

        if (!nextRow.length) {
            $("#bb_status").text("Alle BBs abgearbeitet!");
            return;
        }

        const targetId = nextRow.data("village-id").toString();
        const coords = nextRow.find("td:eq(0)").text();
        attackTarget(targetId, coords);
    }

    window.attackTarget = function (targetId, coords) {
        if (busy) return;
        busy = true;
        $("#bb_status").text(`Greife ${coords} an...`);

        const attackUrl = `/game.php?village=${game_data.village.id}&screen=place`
            + `&target=${targetId}`
            + `&spear=${$("#cfg_spear").val() || 0}`
            + `&light=${$("#cfg_light").val() || 0}`
            + `&march=${$("#cfg_march").val() || 0}`
            + `&spy=${$("#cfg_spy").val() || 0}`;
        const confirmUrl = `/game.php?village=${game_data.village.id}&screen=place&try=confirm`;

        $.get(attackUrl)
            .then(() => $.get(confirmUrl))
            .then(() => {
                markDone(targetId);
                $("#bb_status").text(`${coords} erfolgreich angegriffen.`);
            })
            .fail(() => {
                $("#bb_status").text(`Fehler bei ${coords} - siehe Konsole (F12).`);
            })
            .always(() => {
                busy = false;
            });
    };

    window.markDone = function (id) {
        openedIds.add(id.toString());
        $(`#bb_row_${id}`).css({ "background-color": "#92c200", "opacity": "0.4" });
        $(`#btn_farm_${id}`).text("Erledigt").prop("disabled", true);
        if (openedIds.size > totalToFarm) totalToFarm = openedIds.size;
        updateAttackProgress();
    };

    $(document).on('change', '#cfg_radius', renderList);
})();
