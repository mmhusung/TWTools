(function () {
    const DEFAULT = {
        spear: 0,
        light: 0,
        march: 0,
        spy: 1,
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

            <button id="bb_start_farm_btn" class="btn" onclick="startFarming()" style="margin-bottom:6px; font-weight:bold; width:100%; padding:4px;">▶ Start (danach: Enter = Versammlungsplatz / Enter = Angreifen)</button>

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

            <div id="bb_frame_container" style="display:none; margin-top:8px; border-top:1px solid #7d510f; padding-top:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span id="bb_frame_title" style="font-size:11px; font-weight:bold;">Versammlungsplatz</span>
                    <button class="btn" onclick="$('#bb_frame_container').hide();" style="font-size:10px; padding:1px 5px;">Ausblenden</button>
                </div>
                <iframe id="bb_farm_frame" style="width:100%; height:260px; border:1px solid #804000; background:#fff;"></iframe>
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
    let currentFarmTarget = null;
    let totalToFarm = 0;
    let farmingStarted = false;

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

        const frame = document.getElementById("bb_farm_frame");
        if (!frame || $("#bb_frame_container").is(":hidden")) {
            startFarming();
            return;
        }

        if (frame._bb_stage === "attack") {
            frame._bb_stage = "confirming";
            frame.src = `/game.php?village=${game_data.village.id}&screen=place&try=confirm`;
            return;
        }

        if (frame._bb_stage === "readyNext") {
            loadNextTarget();
            return;
        }
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
                        <button id="btn_farm_${t.id}" class="btn" style="padding:2px 6px; font-weight:bold;" onclick="farmInline('${t.id}', '${t.x}|${t.y}')" ${done ? 'disabled' : ''}>${done ? 'Erledigt' : 'Farmen'}</button>
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

        const first = rows.first();
        farmInline(first.data("village-id"), first.find("td:eq(0)").text());
    };

    window.farmInline = function (targetId, coords) {
        currentFarmTarget = targetId;
        const frame = document.getElementById("bb_farm_frame");
        $("#bb_frame_title").text(`Lade ${coords}...`);
        $("#bb_status").text(`Öffne Versammlungsplatz für ${coords}...`);
        $("#bb_frame_container").show();

        const attackUrl = `/game.php?village=${game_data.village.id}&screen=place`
            + `&target=${targetId}`
            + `&spear=${$("#cfg_spear").val() || 0}`
            + `&light=${$("#cfg_light").val() || 0}`
            + `&march=${$("#cfg_march").val() || 0}`
            + `&spy=${$("#cfg_spy").val() || 0}`;

        frame._bb_stage = "loading";
        frame.src = attackUrl;

        frame.onload = function () {
            try {
                const doc = frame.contentDocument || frame.contentWindow.document;

                if (frame._bb_stage === "loading") {
                    const hasRealError = $(doc).find(".error_box:visible").filter(function () {
                        return $(this).text().trim().length > 0;
                    }).length > 0;

                    frame._bb_stage = hasRealError ? "error" : "attack";
                    $("#bb_frame_title").text(`${coords}: Enter = Angreifen`);
                    $("#bb_status").text(hasRealError
                        ? `Fehler bei ${coords} - siehe Versammlungsplatz unten.`
                        : `${coords} bereit - Enter drücken zum Angreifen.`);
                    return;
                }

                if (frame._bb_stage === "confirming" && currentFarmTarget) {
                    markDone(currentFarmTarget);
                    frame._bb_stage = "readyNext";
                    $("#bb_frame_title").text("Enter = nächstes Ziel öffnen");
                    $("#bb_status").text(`${coords} angegriffen - Enter für nächstes Ziel.`);
                }
            } catch (e) {}
        };
    };

    window.markDone = function (id) {
        openedIds.add(id.toString());
        $(`#bb_row_${id}`).css({ "background-color": "#92c200", "opacity": "0.4" });
        $(`#btn_farm_${id}`).text("Erledigt").prop("disabled", true);
        if (openedIds.size > totalToFarm) totalToFarm = openedIds.size;
        updateAttackProgress();
    };

    function loadNextTarget() {
        const nextRow = $(".farm-row").filter(function () {
            const vId = $(this).data("village-id").toString();
            return !openedIds.has(vId);
        }).first();

        if (!nextRow.length) {
            $("#bb_frame_title").text("Alle BBs abgearbeitet!");
            $("#bb_status").text("Alle BBs abgearbeitet!");
            updateAttackProgress();
            return;
        }

        const nextId = nextRow.data("village-id");
        const nextCoords = nextRow.find("td:eq(0)").text();
        farmInline(nextId, nextCoords);
    }

    $(document).on('change', '#cfg_radius', renderList);
})();
