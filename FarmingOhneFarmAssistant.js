javascript:(function () {
    const DEFAULT = {
        light: 5,
        march: 0,
        spy: 1,
        tabs: 5,
        radius: 20
    };

    if ($("#bb_master_ui").length) $("#bb_master_ui").remove();
    
    const ui = `
        <div id="bb_master_ui" style="position:fixed; top:50px; right:50px; width:420px; background:#e3d5b3; border:2px solid #7d510f; z-index:10000; padding:12px; box-shadow:3px 3px 15px #000; font-family: Verdana, Arial; border-radius: 5px;">
            <h3 style="margin:0 0 10px 0; border-bottom: 1px solid #7d510f; padding-bottom:5px;">BB-Master (DE/EN International)</h3>
            
            <div style="background: #d2c09e; padding: 8px; border-radius: 3px; margin-bottom: 10px; font-size: 11px;">
                <div style="display: flex; gap: 8px; margin-bottom: 5px;">
                    Lkav: <input type="number" id="cfg_light" value="${DEFAULT.light}" style="width: 35px;">
                    Skav: <input type="number" id="cfg_march" value="${DEFAULT.march}" style="width: 35px;">
                    Späher: <input type="number" id="cfg_spy" value="${DEFAULT.spy}" style="width: 35px;">
                </div>
                <div style="display: flex; gap: 15px;">
                    Tabs: <input type="number" id="cfg_tabs" value="${DEFAULT.tabs}" style="width: 35px;">
                    Radius: <input type="number" id="cfg_radius" value="${DEFAULT.radius}" style="width: 40px;">
                </div>
            </div>

            <div id="bb_status" style="margin-bottom:5px; font-size: 0.85em; font-weight:bold;">Suche BBs (DE/EN)...</div>
            
            <div id="bb_list_container" style="max-height:300px; overflow-y:auto; border:1px solid #7d510f; background:#fff5da;">
                <table class="vis" width="100%">
                    <thead><tr style="background:#d2c09e;"><th>Dorf</th><th>Name</th><th>Dist.</th><th>Aktion</th></tr></thead>
                    <tbody id="bb_table_body"></tbody>
                </table>
            </div>

            <div style="margin-top:10px; padding-top:10px; border-top: 1px solid #7d510f;">
                <button id="btn_open_all" class="btn" style="width:100%; height:35px; background:#21881e; color:white; font-weight:bold; cursor:pointer;">
                    Tabs öffnen
                </button>
                <div style="display:flex; justify-content: flex-end; margin-top:5px;">
                    <button class="btn" onclick="$('#bb_master_ui').remove()" style="font-size:10px; cursor:pointer;">Schließen</button>
                </div>
            </div>
        </div>
    `;
    $('body').append(ui);

    const homeX = game_data.village.x;
    const homeY = game_data.village.y;
    let openedIds = new Set();
    let allTargets = [];

    $.get("/map/village.txt", function(data) {
        const lines = data.trim().split("\n");
        
        // Erweiterter Filter für Deutsch und Englisch
        const isBBName = (name) => {
            let decoded = decodeURIComponent(name.replace(/\+/g, ' ')).toLowerCase();
            return decoded.includes("barbar") || // DE: Barbarendorf, EN: Barbarian Village
                   decoded.includes("bonus") ||  // DE/EN: Bonus
                   decoded.includes("abandoned") || // EN: Abandoned
                   decoded.includes("graue");    // DE: Graues Dorf (selten)
        };

        for (let i = 0; i < lines.length; i++) {
            const v = lines[i].split(",");
            if (v.length < 5) continue;
            
            const player_id = parseInt(v[4]);
            
            // Nur wenn Spieler-ID 0 (Barbar) UND Name passt
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
        allTargets.sort((a, b) => a.dist - b.dist);
        renderList();
    });

    function renderList() {
        const body = $("#bb_table_body").empty();
        const currentRadius = parseInt($("#cfg_radius").val()) || DEFAULT.radius;
        const filtered = allTargets.filter(t => t.dist <= currentRadius);
        
        $("#bb_status").text(`${filtered.length} BBs (DE/EN) gefunden.`);

        filtered.forEach((t) => {
            body.append(`
                <tr id="bb_row_${t.id}" class="farm-row" data-village-id="${t.id}" style="opacity:1;">
                    <td style="font-size:11px;">${t.x}|${t.y}</td>
                    <td style="font-size:10px; max-width:110px; overflow:hidden; white-space:nowrap;">${t.name}</td>
                    <td style="font-size:11px;">${t.dist.toFixed(1)}</td>
                    <td style="text-align:right;">
                        <button class="btn" style="padding:2px 5px;" onclick="openSingle('${t.id}')">Öffnen</button>
                    </td>
                </tr>
            `);
        });
    }

    function getFarmUrl(targetId) {
        const light = $("#cfg_light").val() || 0;
        const march = $("#cfg_march").val() || 0;
        const spy = $("#cfg_spy").val() || 0;
        return `/game.php?village=${game_data.village.id}&screen=place&target=${targetId}&light=${light}&march=${march}&spy=${spy}`;
    }

    window.openSingle = function(id) {
        if (!openedIds.has(id.toString())) {
            window.open(getFarmUrl(id), '_blank');
            markDone(id);
        }
    };

    $("#btn_open_all").on("click", function() {
        let opened = 0;
        const maxTabs = parseInt($("#cfg_tabs").val()) || DEFAULT.tabs;
        const currentRadius = parseInt($("#cfg_radius").val()) || DEFAULT.radius;

        $(".farm-row").each(function() {
            const vId = $(this).data("village-id").toString();
            const rowDist = parseFloat($(this).find("td:eq(2)").text());

            if (opened < maxTabs && !openedIds.has(vId) && rowDist <= currentRadius) {
                window.open(getFarmUrl(vId), '_blank');
                markDone(vId);
                opened++;
            }
        });
        if (opened === 0) UI.InfoMessage("Keine passenden BBs mehr.", 2000);
    });

    $(document).on('change', '#cfg_radius', renderList);

    window.markDone = function(id) {
        openedIds.add(id.toString());
        $(`#bb_row_${id}`).css({"background-color": "#92c200", "opacity": "0.25"});
        $(`#bb_row_${id} button`).addClass("btn-disabled").prop("disabled", true);
    };
})();
