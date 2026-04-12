/*
 * Script Name: Single Village Planner
 * Version: v2.1.2
 * Last Updated: 2025-08-15
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: t14559753
 * Approved Date: 2021-02-11
 * Mod: JawJaw
 */

/* Copyright (c) RedAlert
By uploading a user-generated mod (script) for use with Tribal Wars, you grant InnoGames a perpetual, irrevocable, worldwide, royalty-free, non-exclusive license to use, reproduce, distribute, publicly display, modify, and create derivative works of the mod. This license permits InnoGames to incorporate the mod into any aspect of the game and its related services, including promotional and commercial endeavors, without any requirement for compensation or attribution to you. InnoGames is entitled but not obligated to name you when exercising its rights. You represent and warrant that you have the legal right to grant this license and that the mod does not infringe upon any third-party rights. You are - with the exception of claims of infringement by third parties â€“ not liable for any usage of the mod by InnoGames. German law applies.
*/

var scriptData = {
    name: 'Single Village Planner',
    version: 'v2.1.1',
    author: 'RedAlert',
    authorUrl: 'https://twscripts.dev/',
    helpLink:
        'https://forum.tribalwars.net/index.php?threads/single-village-planner.286667/',
};

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Constants
var LS_PREFIX = 'raSingleVillagePlanner';
var TIME_INTERVAL = 60 * 60 * 1000 * 24 * 365; // unit info does not change during the whole world duration so we only need to get it once
var GROUP_ID = localStorage.getItem(`${LS_PREFIX}_chosen_group`) ?? 0;
var LAST_UPDATED_TIME = localStorage.getItem(`${LS_PREFIX}_last_updated`) ?? 0;

// Globals
var unitInfo,
    troopCounts = [];

// Translations
var translations = {
    en_DK: {
        'Single Village Planner': 'Single Village Planner',
        Help: 'Help',
        'This script can only be run on a single village screen!':
            'This script can only be run on a single village screen!',
        Village: 'Village',
        'Calculate Launch Times': 'Calculate Launch Times',
        Reset: 'Reset',
        'Launch times are being calculated ...':
            'Launch times are being calculated ...',
        'Missing user input!': 'Missing user input!',
        'Landing Time': 'Landing Time',
        'This village has no unit selected!':
            'This village has no unit selected!',
        'Prio.': 'Prio.',
        'No possible combinations found!': 'No possible combinations found!',
        'Export Plan as BB Code': 'Export Plan as BB Code',
        'Plan for:': 'Plan for:',
        'Landing Time:': 'Landing Time:',
        Unit: 'Unit',
        'Launch Time': 'Launch Time',
        Command: 'Command',
        Status: 'Status',
        Send: 'Send',
        From: 'From',
        Priority: 'Priority',
        'Early send': 'Early send',
        'Landing time was updated!': 'Landing time was updated!',
        'Error fetching village groups!': 'Error fetching village groups!',
        'Dist.': 'Dist.',
        'Villages list could not be fetched!':
            'Villages list could not be fetched!',
        Group: 'Group',
        'Export Plan without tables': 'Export Plan without tables',
        'Chosen group was reset!': 'Chosen group was reset!',
        'Reset Chosen Group': 'Reset Chosen Group',
        'Script configuration was reset!': 'Script configuration was reset!',
    },
    sk_SK: {
        'Single Village Planner': 'PlÃ¡novaÄ pre jednu dedinu',
        Help: 'Pomoc',
        'This script can only be run on a single village screen!':
            'Tento skript sa dÃ¡ spustiÅ¥ iba v nÃ¡hÄ¾ade dediny z mapy',
        Village: 'Dedina',
        'Calculate Launch Times': 'VÃ½poÄet Äasov odoslania',
        Reset: 'Reset',
        'Launch times are being calculated ...':
            'ÄŒasy odoslania sa vypoÄÃ­tavajÃº ...',
        'Missing user input!': 'ChÃ½ba oznaÄenie jednotiek!',
        'Landing Time': 'ÄŒas dopadu',
        'This village has no unit selected!':
            'TÃ¡to dedina nemÃ¡ oznaÄenÃº jednotku!',
        'Prio.': 'Prio.',
        'No possible combinations found!':
            'Å½iadne moÅ¾nÃ© kombinÃ¡cie sa nenaÅ¡li!',
        'Export Plan as BB Code': 'ExportovaÅ¥ PlÃ¡n ako BB KÃ³dy',
        'Plan for:': 'PlÃ¡n pre:',
        'Landing Time:': 'ÄŒas dopadu:',
        Unit: 'Jednotka',
        'Launch Time': 'ÄŒas odoslania:',
        Command: 'PrÃ­kaz',
        Status: 'Stav',
        Send: 'OdoslaÅ¥',
        From: 'Z',
        Priority: 'Priorita',
        'Early send': 'SkorÃ© odoslanie',
        'Landing time was updated!': 'ÄŒas dopadu aktualizovanÃ½!',
        'Error fetching village groups!': 'Chyba pri naÄÃ­tanÃ­ skupiny dedÃ­n',
        'Dist.': 'VzdialenosÅ¥',
        'Villages list could not be fetched!':
            'Villages list could not be fetched!',
        Group: 'Group',
        'Export Plan without tables': 'Export Plan without tables',
        'Chosen group was reset!': 'Chosen group was reset!',
        'Reset Chosen Group': 'Reset Chosen Group',
        'Script configuration was reset!': 'Script configuration was reset!',
    },
    nl_NL: {
        'Single Village Planner': 'Enkel Dorp Planner',
        Help: 'Help',
        'This script can only be run on a single village screen!':
            'Het script kan enkel worden uitgevoerd op het dorpsoverzicht via de kaart!',
        Village: 'Dorp',
        'Calculate Launch Times': 'Bereken verzendtijden',
        Reset: 'Reset',
        'Launch times are being calculated ...':
            'Verzendtijden worden berekend ...',
        'Missing user input!': 'Mis spelersinvoer!',
        'Landing Time': 'Landingstijd',
        'This village has no unit selected!':
            'Dit dorp heeft geen troepen geselecteerd!',
        'Prio.': 'Prioriteit.',
        'No possible combinations found!': 'Geen mogelijkheden gevonden!',
        'Export Plan as BB Code': 'Exporteer plan als BB Code',
        'Plan for:': 'Plan voor:',
        'Landing Time:': 'Landingstijd:',
        Unit: 'Eenheid',
        'Launch Time': 'Verzendtijd',
        Command: 'Bevel',
        Status: 'Status',
        Send: 'Zend',
        From: 'Van',
        Priority: 'Prioriteit',
        'Early send': 'Vroeg verzenden',
        'Landing time was updated!': 'Aankomsttijd is geupdate!',
        'Error fetching village groups!':
            'Fout met ophalen van dorpen uit groep!',
        'Dist.': 'Afstand',
        'Villages list could not be fetched!':
            'Villages list could not be fetched!',
        Group: 'Group',
        'Export Plan without tables': 'Export Plan without tables',
        'Chosen group was reset!': 'Chosen group was reset!',
        'Reset Chosen Group': 'Reset Chosen Group',
        'Script configuration was reset!': 'Script configuration was reset!',
    },
    el_GR: {
        'Single Village Planner': 'Î‘Ï„Î¿Î¼Î¹ÎºÏŒ Î Î»Î¬Î½Î¿ Î§Ï‰ÏÎ¹Î¿Ï',
        Help: 'Î’Î¿Î®Î¸ÎµÎ¹Î±',
        'This script can only be run on a single village screen!':
            'Î‘Ï…Ï„Î¿ Ï„Î¿ Script Ï„ÏÎ­Ï‡ÎµÎ¹ Î±Ï€Î¿ Î Î»Î·ÏÎ¿Ï†Î¿ÏÎ¯ÎµÏ‚ Î§Ï‰ÏÎ¹Î¿Ï!',
        Village: 'Î§Ï‰ÏÎ¹ÏŒ',
        'Calculate Launch Times': 'Î¥Ï€Î¿Î»ÏŒÎ³Î¹ÏƒÎµ ÎÏÎ± Î•ÎºÎºÎ¯Î½Î·ÏƒÎ·Ï‚',
        Reset: 'Î•Ï€Î±Î½Î±Ï†Î¿ÏÎ¬',
        'Launch times are being calculated ...':
            'ÎŸÎ¹ Ï‡ÏÏŒÎ½Î¿Î¹ ÎµÎºÎºÎ¯Î½Î·ÏƒÎ·Ï‚ Ï…Ï€Î¿Î»Î¿Î³Î¯Î¶Î¿Î½Ï„Î±Î¹ ...',
        'Missing user input!': 'Î›ÎµÎ¯Ï€Î¿Ï…Î½ Ï„Î± Î´ÎµÎ´Î¿Î¼Î­Î½Î±!',
        'Landing Time': 'ÎÏÎ± Î¬Ï†Î¹Î¾Î·Ï‚',
        'This village has no unit selected!':
            'Î¤Î¿ Ï‡Ï‰ÏÎ¹ÏŒ Î´ÎµÎ½ Î­Ï‡ÎµÎ¹ ÎµÏ€Î¹Î»ÎµÎ³Î¼Î­Î½ÎµÏ‚ Î¼Î¿Î½Î¬Î´ÎµÏ‚!',
        'Prio.': 'Î ÏÎ¿Ï„.',
        'No possible combinations found!': 'No possible combinations found!',
        'Export Plan as BB Code': 'Î•Î¾Î±Î³Ï‰Î³Î® Ï€Î»Î¬Î½Î¿Ï… ÏƒÎµ BB Code',
        'Plan for:': 'Î Î»Î¬Î½Î¿ Î³Î¹Î±:',
        'Landing Time:': 'ÎÏÎ± Î¬Ï†Î¹Î¾Î·Ï‚:',
        Unit: 'ÎœÎ¿Î½Î¬Î´Î±',
        'Launch Time': 'ÎÏÎ± ÎµÎºÎºÎ¯Î½Î·ÏƒÎ·Ï‚',
        Command: 'Î•Î½Ï„Î¿Î»Î®',
        Status: 'ÎšÎ±Ï„Î¬ÏƒÏ„Î±ÏƒÎ·',
        Send: 'Î£Ï„ÎµÎ¯Î»Îµ',
        From: 'Î‘Ï€ÏŒ',
        Priority: 'Î ÏÎ¿Ï„ÎµÏÎ±Î¹ÏŒÏ„Î·Ï„Î±',
        'Early send': 'Î£Ï„Î¬Î»Î¸Î·ÎºÎ±Î½ Î½Ï‰ÏÎ¯Ï„ÎµÏÎ±',
        'Landing time was updated!': 'Î— ÏŽÏÎ± Î¬Ï†Î¹Î¾Î·Ï‚ Î±Î½Î±Î½ÎµÏŽÎ¸Î·ÎºÎµ!',
        'Error fetching village groups!':
            'Î£Ï†Î¬Î»Î¼Î± ÎºÎ±Ï„Î¬ Ï„Î·Î½ Î±Î½Î¬ÎºÏ„Î·ÏƒÎ· Î¿Î¼Î¬Î´Ï‰Î½ Ï‡Ï‰ÏÎ¹ÏŽÎ½!',
        'Dist.': 'Î‘Ï€ÏŒÏƒÏ„Î±ÏƒÎ·',
        'Villages list could not be fetched!':
            'Villages list could not be fetched!',
        Group: 'Group',
        'Export Plan without tables': 'Export Plan without tables',
        'Chosen group was reset!': 'Chosen group was reset!',
        'Reset Chosen Group': 'Reset Chosen Group',
        'Script configuration was reset!': 'Script configuration was reset!',
    },
    it_IT: {
        'Single Village Planner': 'Planner Singolo Villo',
        Help: 'Aiuto',
        'This script can only be run on a single village screen!':
            'Questo script puÃ² essere lanciato solo dalla panoramica del villaggio!',
        Village: 'Villaggio',
        Coords: 'Coordinate',
        Continent: 'Continente',
        'Calculate Launch Times': 'Calcola tempi di lancio',
        Reset: 'Reset',
        'Launch times are being calculated ...':
            'I tempi di lancio sono stati calcolati ...',
        'Missing user input!': 'Manca selezione truppe!',
        'Landing Time': 'Tempo di arrivo',
        'This village has no unit selected!':
            'Questo villaggio non ha le unitÃ  selezionate!',
        'Prio.': 'Prio.',
        'No possible combinations found!': 'Nessuna combinazione possibile!',
        'Export Plan as BB Code': 'Esporta il plan in BB code',
        'Plan for:': 'Plan per:',
        'Landing Time:': 'Tempo di arrivo:',
        Unit: 'UnitÃ ',
        'Launch Time': 'Tempo di lancio',
        Command: 'Comando',
        Status: 'Status',
        Send: 'Invia',
        From: 'Da',
        Priority: 'PrioritÃ ',
        'Early send': 'Anticipa invio',
        'Landing time was updated!': 'Il tempo di arrivo Ã¨ stato aggiornato!',
        'Error fetching village groups!': 'Errore nel recupero gruppo!',
        Group: 'Gruppo',
        'Export Plan without tables': 'Export Plan without tables',
        'Chosen group was reset!': 'Chosen group was reset!',
        'Reset Chosen Group': 'Reset Chosen Group',
        'Script configuration was reset!': 'Script configuration was reset!',
    },
    tr_TR: {
        'Single Village Planner': 'Tek KÃ¶y PlanlayÄ±cÄ±sÄ±',
        Help: 'YardÄ±m',
        'This script can only be run on a single village screen!':
            'Bu komut dosyasÄ± yalnÄ±zca tek bir kÃ¶y ekranÄ±nda Ã§alÄ±ÅŸtÄ±rÄ±labilir',
        Village: 'KÃ¶y',
        Coords: 'Koordinat',
        Continent: 'KÄ±ta',
        'Calculate Launch Times': 'BaÅŸlatma SÃ¼relerini HesaplayÄ±n',
        Reset: 'Reset',
        'Launch times are being calculated ...':
            'BaÅŸlatma sÃ¼releri hesaplanÄ±yor ...',
        'Missing user input!': 'Eksik kullanÄ±cÄ± giriÅŸi!',
        'Landing Time': 'iniÅŸ zamanÄ±',
        'This village has no unit selected!': 'Bu kÃ¶yde seÃ§ili birim yok!',
        'Prio.': 'Prio.',
        'No possible combinations found!': 'OlasÄ± kombinasyon bulunamadÄ±!',
        'Export Plan as BB Code': 'PlanÄ± BB Kodu Olarak DÄ±ÅŸa Aktar',
        'Plan for:': 'Plan iÃ§in:',
        'Landing Time:': 'Ä°niÅŸ zamanÄ±:',
        Unit: 'Birim',
        'Launch Time': 'BaÅŸlatma ZamanÄ±:',
        Command: 'Komut',
        Status: 'Durum',
        Send: 'GÃ¶nder',
        From: 'Z',
        Priority: 'Ã–ncelik',
        'Early send': 'erken gÃ¶nder',
        'Landing time was updated!': 'Ä°niÅŸ zamanÄ± gÃ¼ncellendi!',
        'Error fetching village groups!':
            'KÃ¶y gruplarÄ± getirilirken hata oluÅŸtu',
        'Dist.': 'Dist.',
        'Villages list could not be fetched!':
            'Villages list could not be fetched!',
        Group: 'Group',
        'Export Plan without tables': 'Export Plan without tables',
        'Chosen group was reset!': 'Chosen group was reset!',
        'Reset Chosen Group': 'Reset Chosen Group',
        'Script configuration was reset!': 'Script configuration was reset!',
    },
    pt_BR: {
        'Single Village Planner': 'Planeador para ataques em uma sÃ³ aldeia',
        Help: 'Ajuda',
        'This script can only be run on a single village screen!':
            'Este script sÃ³ pode ser usado na pÃ¡gina de uma sÃ³ aldeia!',
        Village: 'Aldeia',
        Coords: 'Coords',
        Continent: 'Continente',
        'Calculate Launch Times': 'Calcular tempos de envio',
        Reset: 'Reset',
        'Launch times are being calculated ...':
            'Os tempos de envio estÃ£o a ser calculados ...',
        'Missing user input!': 'Falta o input do utilizador!',
        'Landing Time': 'Tempo de chegada',
        'This village has no unit selected!':
            'Esta aldeia nÃ£o tem unidades selecionadas!',
        'Prio.': 'Prioridade',
        'No possible combinations found!':
            'NÃ£o foram encontradas combinaÃ§Ãµes possÃ­veis!',
        'Export Plan as BB Code': 'Exportar plano em cÃ³digo BB',
        'Plan for:': 'Plano para:',
        'Landing Time:': 'Tempo de chegada:',
        Unit: 'Unidade',
        'Launch Time': 'Tempo de envio',
        Command: 'Comando',
        Status: 'Estado',
        Send: 'Send',
        From: 'From',
        Priority: 'Prioridade',
        'Early send': 'Enviar cedo',
        'Landing time was updated!': 'O tempo de chegada foi atualizado!',
        'Error fetching village groups!':
            'Erro a ir buscar os grupos de aldeias!',
        'Dist.': 'Dist.',
        'Villages list could not be fetched!':
            'Villages list could not be fetched!',
        Group: 'Group',
        'Export Plan without tables': 'Export Plan without tables',
        'Chosen group was reset!': 'Chosen group was reset!',
        'Reset Chosen Group': 'Reset Chosen Group',
        'Script configuration was reset!': 'Script configuration was reset!',
    },
    fr_FR: {
        'Single Village Planner': "Planificateur d'attaque village unique",
        Help: 'Aide',
        'This script can only be run on a single village screen!':
            "Ce script doit Ãªtre lancÃ© depuis la vu d'un village!",
        Village: 'Village',
        'Calculate Launch Times': "Calcul heure d'envoi",
        Reset: 'RÃ©initialiser',
        'Launch times are being calculated ...':
            "Heures d'envoi en cours de calcul ...",
        'Missing user input!': 'Aucun joueur renseignÃ©!',
        'Landing Time': "Heure d'arrivÃ©",
        'This village has no unit selected!':
            "Ce village n'a aucune unitÃ© sÃ©lectionnÃ©e!",
        'Prio.': 'Prio.',
        'No possible combinations found!': 'Aucune combinaison possible!',
        'Export Plan as BB Code': "Exporter le plan d'attaque en bb-code",
        'Plan for:': 'Plan pour:',
        'Landing Time:': "Heure d'arrivÃ©:",
        Unit: 'UnitÃ©',
        'Launch Time': "Heure d'envoi",
        Command: 'Ordre',
        Status: 'Status',
        Send: 'Envoyer',
        From: 'Origine',
        Priority: 'PrioritÃ©',
        'Early send': 'Envoi tÃ´t',
        'Landing time was updated!': "Heure d'arrivÃ© mis Ã  jour!",
        'Error fetching village groups!':
            'Erreur lors de la rÃ©cupÃ©ration des groupes de villages!',
        'Dist.': 'Dist.',
        'Villages list could not be fetched!':
            'Impossible de rÃ©cupÃ©rer la liste des villages!',
        Group: 'Groupe',
        'Export Plan without tables': 'Exporter le plan sans tableau',
        'Chosen group was reset!': 'Groupe sÃ©lectionnÃ© rÃ©initialisÃ©!',
        'Reset Chosen Group': 'RÃ©initialiser groupe(s) sÃ©lectionnÃ©e(s)',
        'Script configuration was reset!': 'Configuration rÃ©initialisÃ©e!',
    },
};

// Init Debug
initDebug();

// Fetch unit config only when needed
if (LAST_UPDATED_TIME !== null) {
    if (Date.parse(new Date()) >= LAST_UPDATED_TIME + TIME_INTERVAL) {
        fetchUnitInfo();
    } else {
        unitInfo = JSON.parse(localStorage.getItem(`${LS_PREFIX}_unit_info`));
    }
} else {
    fetchUnitInfo();
}

async function initAttackPlanner(groupId) {
    const groups = await fetchVillageGroups();
    troopCounts = await fetchTroopsForCurrentGroup(groupId);
    let villages = await fetchAllPlayerVillagesByGroup(groupId);

    // Wir suchen nicht mehr in einer speziellen Tabellenzelle.
    // Wir nehmen den gesamten Text der Seite.
    const fullPageText = jQuery('#content_value').text();

    // Wir suchen nach dem Muster XXX|YYY irgendwo im Text
    const destinationMatch = fullPageText.match(/\d{1,3}\|\d{1,3}/);
    
    // Falls er nichts findet (Sicherheitsnetz), versuchen wir es im Seitentitel
    const finalMatch = destinationMatch ? destinationMatch[0] : jQuery('#serverTime').closest('h2').text().match(/\d{1,3}\|\d{1,3}/);

    if (!finalMatch) {
        alert("Konnte absolut keine Koordinaten auf dieser Seite finden!");
        return;
    }

    const destinationVillage = Array.isArray(finalMatch) ? finalMatch[0] : finalMatch;
    console.log("Erfolgreich Ziel extrahiert:", destinationVillage);

    villages = villages.map((item) => {
        const distance = calculateDistance(item.coords, destinationVillage);
        return {
            ...item,
            distance: parseFloat(distance.toFixed(2)),
        };
    });

    villages.sort((a, b) => a.distance - b.distance);

    // ... Rest des Codes
    

    const content = prepareContent(villages, groups);
    renderUI(content);

    // after script has been loaded events
    setTimeout(function () {
        // set a default landing time
        const today = new Date().toLocaleString('en-GB').replace(',', '');
        jQuery('#raLandingTime').val(today);

        // handle non-archer worlds
        if (!game_data.units.includes('archer')) {
            jQuery('.archer-world').hide();
        }

        // handle non-paladin worlds
        if (!game_data.units.includes('knight')) {
            jQuery('.paladin-world').hide();
        }
    }, 100);

    // scroll to element to focus user's attention
    jQuery('html,body').animate(
        { scrollTop: jQuery('#raSingleVillagePlanner').offset().top - 8 },
        'slow'
    );

    // action handlers
    choseUnit();
    changeVillagePriority();
    calculateLaunchTimes();
    resetAll();
    fillLandingTimeFromCommand();
    filterVillagesByChosenGroup();
    setAllUnits();
    resetGroup();
}

// Helper: Prepare UI
function prepareContent(villages, groups) {
    const villagesTable = renderVillagesTable(villages);
    const groupsFilter = renderGroupsFilter(groups);

    return `
		<div class="ra-mb15">
			<div class="ra-grid">
				<div>
					<label for="raLandingTime">
						${tt('Landing Time')} (dd/mm/yyyy HH:mm:ss)
					</label>
					<input id="raLandingTime" type="text" value="" />
				</div>
				<div>
					<label>${tt('Group')}</label>
					${groupsFilter}
				</div>
			</div>
		</div>
		<div class="ra-mb15">
			${villagesTable}
		</div>
		<div class="ra-mb15">
			<a href="javascript:void(0);" id="calculateLaunchTimes" class="btn btn-confirm-yes">
				${tt('Calculate Launch Times')}
			</a>
			<a href="javascript:void(0);" id="resetAll" class="btn btn-confirm-no">
				${tt('Reset')}
			</a>
			<a href="javascript:void(0);" id="resetGroupBtn" class="btn">
				${tt('Reset Chosen Group')}
			</a>
		</div>
		<div style="display:none;" class="ra-mb-15" id="raVillagePlanner">
			<div class="ra-mb15">
				<label for="raExportPlanBBCode">${tt('Export Plan as BB Code')}</label>
				<textarea id="raExportPlanBBCode" readonly></textarea>
			</div>
			<div>
				<label for="raExportPlanCode">${tt('Export Plan without tables')}</label>
				<textarea id="raExportPlanCode" readonly></textarea>
			</div>
		</div>
	`;
}

// Render UI
function renderUI(body) {
    const content = `
        <div class="ra-single-village-planner" id="raSingleVillagePlanner">
            <h2>${tt(scriptData.name)}</h2>
            <div class="ra-single-village-planner-data">
                ${body}
            </div>
            <br>
            <small>
                <strong>
                    ${tt(scriptData.name)} ${scriptData.version}
                </strong> -
                <a href="${
                    scriptData.authorUrl
                }" target="_blank" rel="noreferrer noopener">
                    ${scriptData.author}
                </a> -
                <a href="${
                    scriptData.helpLink
                }" target="_blank" rel="noreferrer noopener">
                    ${tt('Help')}
                </a>
            </small>
        </div>
        <style>
            .ra-single-village-planner { position: relative; display: block; width: auto; height: auto; clear: both; margin: 0 auto 15px; padding: 10px; border: 1px solid #603000; box-sizing: border-box; background: #f4e4bc; }
			.ra-single-village-planner * { box-sizing: border-box; }
			.ra-single-village-planner input[type="text"] { width: 100%; padding: 5px 10px; border: 1px solid #000; font-size: 16px; line-height: 1; }
			.ra-single-village-planner label { font-weight: 600 !important; margin-bottom: 5px; display: block; }
			.ra-single-village-planner select { width: 100%; padding: 5px 10px; border: 1px solid #000; font-size: 16px; line-height: 1; }
			.ra-single-village-planner textarea { width: 100%; height: 100px; resize: none; padding: 5px 10px; }
			.ra-single-village-planner .ra-grid { display: grid; grid-template-columns: 1fr 150px; grid-gap: 0 20px; }
			.ra-table { border-collapse: separate !important; border-spacing: 2px !important; }
			.ra-table tbody tr:hover td { background-color: #ffdd30 !important; }
			.ra-table tbody tr.ra-selected-village td { background-color: #ffe563 !important; }
			.ra-table th { font-size: 14px; }
			.ra-table th,
            .ra-table td { padding: 4px; text-align: center; }
            .ra-table td a { word-break: break-all; }
			.ra-table tr:nth-of-type(2n+1) td { background-color: #fff5da; }
			.ra-table td img { padding: 2px; border: 2px solid transparent; cursor: pointer; }
			.ra-table td img.ra-selected-unit { border: 2px solid #ff0000; }
			.ra-table a:focus { color: blue; }
			.ra-table th .icon { transform: scale(1.05); margin: 0; }
			.ra-table th img { cursor: pointer; }
			.ra-table th.ra-unit-toggle:hover { background-color: rgba(97, 48, 0, 0.6) !important; background-image: none !important; cursor: pointer !important; }
			.ra-table td .icon { filter: grayscale(100%); transform: scale(1.05); margin: 0; cursor: pointer; }
			.ra-table td .icon.ra-priority-village { filter: none !important; }
			.ra-table td span { transform: translateY(-6px); position: relative; display: inline-block; }
			.ra-chosen-command td { background-color: #ffe563; }
			.ra-groups-filter { display: inline-block; margin: 0; padding: 0; text-align: center; }
			.ra-groups-filter li { display: inline-block; list-style-type: none; margin: 0 10px; }
			.ra-groups-filter li:first-child { margin-left: 0; }
			.ra-groups-filter li:last-child { margin-right: 0; }
			.ra-selected-group { color: #21881e; }

			.ra-single-village-planner .btn { padding: 3px 4px; }

			/* Helper Classes */
			.ra-fw600 { font-weight: 600; }
			.ra-mb15 { margin-bottom: 15px; }
			.ra-dblock { display: block; }
			.ra-dflex { display: flex; }
			.ra-text-left { text-align: left !important; }
        </style>
    `;

    if (jQuery('.ra-single-village-planner').length < 1) {
        jQuery('#contentContainer').prepend(content);
    } else {
        jQuery('.ra-single-village-planner-data').html(body);
    }
}

// Action Handler: Here is the logic to collect units
function choseUnit() {
    jQuery('.ra-table td img').on('click', function () {
        // toggle state of chosen unit
        jQuery(this)
            .parent()
            .parent()
            .find('img')
            .not(this)
            .removeClass('ra-selected-unit');
        jQuery(this).toggleClass('ra-selected-unit');

        // toggle state of chosen village
        jQuery('#raAttackPlannerTable tbody tr').each(function () {
            const isAnyUnitSelected = jQuery(this).find(
                'img.ra-selected-unit'
            )[0];
            if (isAnyUnitSelected) {
                jQuery(this).addClass('ra-selected-village');
            } else {
                jQuery(this)
                    .find('td .icon')
                    .removeClass('ra-priority-village');
                jQuery(this).removeClass('ra-selected-village');
            }
        });
    });
}

// Action Handler: Change the village send priority
function changeVillagePriority() {
    jQuery('#raAttackPlannerTable tbody td .icon').on('click', function () {
        const isUnitSelectedForVillage = jQuery(this)
            .parent()
            .parent()
            .find('.ra-selected-unit')[0];
        if (isUnitSelectedForVillage) {
            jQuery(this).toggleClass('ra-priority-village');
        } else {
            UI.ErrorMessage(tt('This village has no unit selected!'));
        }
    });
}

// Action Handler: Grab the "chosen" villages and calculate their launch times based on the unit type
function calculateLaunchTimes() {
    jQuery('#calculateLaunchTimes').on('click', function (e) {
        e.preventDefault();

        const landingTimeString = jQuery('#raLandingTime').val().trim();
        const destinationVillage = jQuery(
            '#content_value table table td:eq(2)'
        ).text();

        let villagesUnitsToSend = [];

        // collect user input
        jQuery('#raAttackPlannerTable .ra-selected-unit').each(function () {
            const id = parseInt(jQuery(this).attr('data-village-id'));
            const unit = jQuery(this).attr('data-unit-type');
            const coords = jQuery(this).attr('data-village-coords');
            const isPrioVillage = jQuery(this)
                .parent()
                .parent()
                .find('td .ra-priority-village')[0]
                ? true
                : false;

            const distance = calculateDistance(coords, destinationVillage);

            villagesUnitsToSend.push({
                id: id,
                unit: unit,
                coords: coords,
                highPrio: isPrioVillage,
                distance: distance,
            });
        });

        if (villagesUnitsToSend.length > 0 && landingTimeString !== '') {
            UI.SuccessMessage(tt('Launch times are being calculated ...'));
            const landingTime = getLandingTime(landingTimeString);
            const plans = getPlans(
                landingTime,
                destinationVillage,
                villagesUnitsToSend
            );

            if (plans.length > 0) {
                const planBBCode = getBBCodePlans(plans, destinationVillage);
                const plansCode = getCodePlans(plans, destinationVillage);
                jQuery('#raVillagePlanner').show();
                jQuery('#raExportPlanBBCode').val(planBBCode);
                jQuery('#raExportPlanCode').val(plansCode);
            } else {
                UI.ErrorMessage(tt('No possible combinations found!'));
                jQuery('#raVillagePlanner').hide();
                jQuery('#raExportPlanBBCode').val('');
                jQuery('#raExportPlanCode').val('');
            }
        } else {
            UI.ErrorMessage(tt('Missing user input!'));
        }
    });
}

// Action Handler: Reset all user input
function resetAll() {
    jQuery('#resetAll').on('click', function (e) {
        e.preventDefault();
        initAttackPlanner(GROUP_ID);
    });
}

// Action Handler: When a command is clicked fill landing time with the landing time of the command
function fillLandingTimeFromCommand() {
    jQuery(
        '#commands_outgoings table tbody tr.command-row, #commands_incomings table tbody tr.command-row'
    ).on('click', function () {
        jQuery('#commands_outgoings table tbody tr.command-row').removeClass(
            'ra-chosen-command'
        );
        jQuery(this).addClass('ra-chosen-command');

        const commandLandingTime =
            parseInt(jQuery(this).find('td:eq(2) span').attr('data-endtime')) *
            1000;

        const landingTimeDateTime = new Date(commandLandingTime);
        const serverDateTime = getServerTime();
        const localDateTime = new Date();

        const diffTime = Math.abs(localDateTime - serverDateTime);
        const newLandingTime = Math.ceil(
            Math.abs(landingTimeDateTime - diffTime)
        );
        const newLandingTimeObj = new Date(newLandingTime);
        const formattedNewLandingTime = formatDateTime(newLandingTimeObj);

        jQuery('#raLandingTime').val(formattedNewLandingTime);
        UI.SuccessMessage(tt('Landing time was updated!'));
    });
}

// Action Handler: Filter villages shown by selected group
function filterVillagesByChosenGroup() {
    jQuery('#raGroupsFilter').on('change', function (e) {
        e.preventDefault();
        initAttackPlanner(e.target.value);
        localStorage.setItem(`${LS_PREFIX}_chosen_group`, e.target.value);
    });
}

// Action Handler: Reset chosen group
function resetGroup() {
    jQuery('#resetGroupBtn').on('click', function (e) {
        e.preventDefault();
        localStorage.removeItem(`${LS_PREFIX}_chosen_group`);
        UI.SuccessMessage(tt('Chosen group was reset!'));
        initAttackPlanner(0);
    });
}

// Action Handler: Set all villages to unit
function setAllUnits() {
    jQuery('#raAttackPlannerTable thead tr th.ra-unit-toggle').on(
        'click',
        function () {
            const chosenUnit = jQuery(this).find('img').attr('data-set-unit');
            jQuery('#raAttackPlannerTable tbody tr').each(function () {
                jQuery(this)
                    .find(`img[data-unit-type="${chosenUnit}"`)
                    .trigger('click');
            });
        }
    );
}

// Prepare plans based on user input
function getPlans(landingTime, destinationVillage, villagesUnitsToSend) {
    let plans = [];

    // Prepare plans list
    villagesUnitsToSend.forEach((item) => {
        const launchTime = getLaunchTime(item.unit, landingTime, item.distance);
        const plan = {
            destination: destinationVillage,
            landingTime: landingTime,
            distance: item.distance,
            unit: item.unit,
            highPrio: item.highPrio,
            villageId: item.id,
            launchTime: launchTime,
            coords: item.coords,
            launchTimeFormatted: formatDateTime(launchTime),
        };
        plans.push(plan);
    });

    // Sort times array by nearest launch time
    plans.sort((a, b) => {
        return a.launchTime - b.launchTime;
    });

    console.debug('plans', plans);

    // Filter only valid launch times
    const filteredPlans = plans.filter((item) => {
        return item.launchTime >= getServerTime().getTime();
    });

    console.debug('filteredPlans', filteredPlans);

    return filteredPlans;
}

// Export plan as BB Code
function getBBCodePlans(plans, destinationVillage) {
    const landingTime = jQuery('#raLandingTime').val().trim();

    let bbCode = `[size=12][b]${tt(
        'Plan for:'
    )}[/b] ${destinationVillage}\n[b]${tt(
        'Landing Time:'
    )}[/b] ${landingTime}[/size]\n\n`;
    bbCode += `[table][**]${tt('Unit')}[||]${tt('From')}[||]${tt(
        'Priority'
    )}[||]${tt('Launch Time')}[||]${tt('Command')}[||]${tt('Status')}[/**]\n`;

    plans.forEach((plan) => {
        const { unit, highPrio, coords, villageId, launchTimeFormatted } = plan;

        const [toX, toY] = destinationVillage.split('|');

        const priority = highPrio ? tt('Early send') : '';

        let rallyPointData =
            game_data.market !== 'uk' ? `&x=${toX}&y=${toY}` : '';
        let sitterData =
            game_data.player.sitter > 0 ? `t=${game_data.player.id}` : '';

        let commandUrl = `/game.php?${sitterData}&village=${villageId}&screen=place${rallyPointData}`;

        bbCode += `[*][unit]${unit}[/unit][|] ${coords} [|][b][color=#ff0000]${priority}[/color][/b][|]${launchTimeFormatted}[|][url=${
            window.location.origin
        }${commandUrl}]${tt('Send')}[/url][|]\n`;
    });

    bbCode += `[/table]`;
    return bbCode;
}

// Export plans without table
function getCodePlans(plans, destinationVillage) {
    const landingTime = jQuery('#raLandingTime').val().trim();

    let planCode = `[size=12][b]${tt(
        'Plan for:'
    )}[/b] ${destinationVillage}\n[b]${tt(
        'Landing Time:'
    )}[/b] ${landingTime}[/size]\n\n`;

    plans.forEach((plan) => {
        const { unit, highPrio, coords, villageId, launchTimeFormatted } = plan;

        const [toX, toY] = destinationVillage.split('|');

        const priority = highPrio ? tt('Early send') : '';

        let rallyPointData =
            game_data.market !== 'uk' ? `&x=${toX}&y=${toY}` : '';
        let sitterData =
            game_data.player.sitter > 0 ? `t=${game_data.player.id}` : '';

        let commandUrl = `/game.php?${sitterData}&village=${villageId}&screen=place${rallyPointData}`;

        planCode += `[unit]${unit}[/unit] ${coords} [b][color=#ff0000]${priority}[/color][/b]${launchTimeFormatted}[url=${
            window.location.origin
        }${commandUrl}]${tt('Send')}[/url]\n`;
    });

    return planCode;
}

// Helper: Calculate distance between 2 villages
function calculateDistance(villageA, villageB) {
    // Diese interne Funktion zieht NUR die Zahlen-Koordinaten aus JEDEM Text
    const getOnlyCoords = (input) => {
        const string = String(input);
        const match = string.match(/\d{1,3}\|\d{1,3}/);
        return match ? match[0] : null;
    };

    const cleanA = getOnlyCoords(villageA);
    const cleanB = getOnlyCoords(villageB);

    // Wenn er keine Koordinate findet, gibt er 0 zurück, um den Fehler zu verhindern
    if (!cleanA || !cleanB) return 0;

    const [x1, y1] = cleanA.split('|').map(num => parseInt(num, 10));
    const [x2, y2] = cleanB.split('|').map(num => parseInt(num, 10));

    const deltaX = x1 - x2;
    const deltaY = y1 - y2;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

// Helper: Get launch time of command
function getLaunchTime(unit, landingTime, distance) {
    const msPerSec = 1000;
    const secsPerMin = 60;
    const msPerMin = msPerSec * secsPerMin;

    const unitSpeed = unitInfo.config[unit].speed;
    const unitTime = distance * unitSpeed * msPerMin;

    const launchTime = new Date();
    launchTime.setTime(
        Math.round((landingTime - unitTime) / msPerSec) * msPerSec
    );

    return launchTime.getTime();
}

// Helper: Get server time
function getServerTime() {
    const serverTime = jQuery('#serverTime').text();
    const serverDate = jQuery('#serverDate').text();

    const [day, month, year] = serverDate.split('/');
    const serverTimeFormatted =
        year + '-' + month + '-' + day + ' ' + serverTime;
    const serverTimeObject = new Date(serverTimeFormatted);

    return serverTimeObject;
}

// Helper: Format date
function formatDateTime(date) {
    let currentDateTime = new Date(date);

    var currentYear = currentDateTime.getFullYear();
    var currentMonth = currentDateTime.getMonth();
    var currentDate = currentDateTime.getDate();
    var currentHours = '' + currentDateTime.getHours();
    var currentMinutes = '' + currentDateTime.getMinutes();
    var currentSeconds = '' + currentDateTime.getSeconds();

    currentMonth = currentMonth + 1;
    currentMonth = '' + currentMonth;
    currentMonth = currentMonth.padStart(2, '0');

    currentHours = currentHours.padStart(2, '0');
    currentMinutes = currentMinutes.padStart(2, '0');
    currentSeconds = currentSeconds.padStart(2, '0');

    let formatted_date =
        currentDate +
        '/' +
        currentMonth +
        '/' +
        currentYear +
        ' ' +
        currentHours +
        ':' +
        currentMinutes +
        ':' +
        currentSeconds;

    return formatted_date;
}

// Helper: Get landing time date object
function getLandingTime(landingTime) {
    const [landingDay, landingHour] = landingTime.split(' ');
    const [day, month, year] = landingDay.split('/');
    const landingTimeFormatted =
        year + '-' + month + '-' + day + ' ' + landingHour;
    const landingTimeObject = new Date(landingTimeFormatted);
    return landingTimeObject;
}

// Helper: Render own villages table
function renderVillagesTable(villages) {
    if (villages.length) {
        const destinationVillage = jQuery(
            '#content_value table table td:eq(2)'
        ).text();

        let villagesTable = `
		<table id="raAttackPlannerTable" class="ra-table" width="100%">
			<thead>
				<tr>
					<th class="ra-text-left" width="25%">
						${tt('Village')} (${villages.length})
					</th>
					<th class="5%">
						${tt('Dist.')}
					</th>
					<th width="5%">
						${tt('Prio.')}
					</th>
					<th class="ra-unit-toggle">
						<img src="/graphic/unit/unit_spear.webp" data-set-unit="spear">
					</th>
					<th class="ra-unit-toggle">
						<img src="/graphic/unit/unit_sword.webp" data-set-unit="sword">
					</th>
					<th class="ra-unit-toggle">
						<img src="/graphic/unit/unit_axe.webp" data-set-unit="axe">
					</th>
					<th class="archer-world ra-unit-toggle">
						<img src="/graphic/unit/unit_archer.webp" data-set-unit="archer">
					</th>
					<th class="ra-unit-toggle">
						<img src="/graphic/unit/unit_spy.webp" data-set-unit="spy">
					</th>
					<th class="ra-unit-toggle">
						<img src="/graphic/unit/unit_light.webp" data-set-unit="light">
					</th>
					<th class="archer-world ra-unit-toggle">
						<img src="/graphic/unit/unit_marcher.webp" data-set-unit="marcher">
					</th>
					<th class="ra-unit-toggle">
						<img src="/graphic/unit/unit_heavy.webp" data-set-unit="heavy">
					</th>
					<th class="ra-unit-toggle">
						<img src="/graphic/unit/unit_ram.webp" data-set-unit="ram">
					</th>
					<th class="ra-unit-toggle">
						<img src="/graphic/unit/unit_catapult.webp" data-set-unit="catapult">
					</th>
					<th class="paladin-world ra-unit-toggle">
						<img src="/graphic/unit/unit_knight.webp" data-set-unit="knight">
					</th>
					<th class="ra-unit-toggle">
						<img src="/graphic/unit/unit_snob.webp" data-set-unit="snob">
					</th>
				</tr>
			</thead>
			<tbody>
	`;

        const villageCombinations = [];
        villages.forEach((village) => {
            troopCounts.forEach((villageTroops) => {
                if (villageTroops.villageId === village.id) {
                    villageCombinations.push({
                        ...village,
                        ...villageTroops,
                    });
                }
            });
        });

        villageCombinations.forEach((village) => {
            const {
                name,
                coords,
                id,
                spear,
                sword,
                axe,
                archer,
                spy,
                light,
                marcher,
                heavy,
                ram,
                catapult,
                knight,
                snob,
                distance,
            } = village;

            const continent = getContinentByCoord(coords);
            const link = game_data.link_base_pure + `info_village&id=${id}`;

            villagesTable += `
			<tr>
				<td class="ra-text-left" width="25%">
					<a href="${link}" target="_blank" rel="noopener noreferrer">
						${name} (${coords}) K${continent}
					</a>
				</td>
				<td width="5%">
					${distance}
				</td>
				<td width="5%">
					<span class="icon header favorite_add"></span>
				</td>
				<td>
					<img data-unit-type="spear" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_spear.webp">
					<span>${formatAsNumber(spear)}</span>
				</td>
				<td>
					<img data-unit-type="sword" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_sword.webp">
					<span>${formatAsNumber(sword)}</span>
				</td>
				<td>
					<img data-unit-type="axe" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_axe.webp">
					<span>${formatAsNumber(axe)}</span>
				</td>
				<td class="archer-world">
					<img data-unit-type="archer" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_archer.webp">
					<span>${formatAsNumber(archer)}</span>
				</td>
				<td>
					<img data-unit-type="spy" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_spy.webp">
					<span>${formatAsNumber(spy)}</span>
				</td>
				<td>
					<img data-unit-type="light" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_light.webp">
					<span>${formatAsNumber(light)}</span>
				</td>
				<td class="archer-world">
					<img data-unit-type="marcher" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_marcher.webp">
					<span>${formatAsNumber(marcher)}</span>
				</td>
				<td>
					<img data-unit-type="heavy" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_heavy.webp">
					<span>${formatAsNumber(heavy)}</span>
				</td>
				<td>
					<img data-unit-type="ram" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_ram.webp">
					<span>${formatAsNumber(ram)}</span>
				</td>
				<td>
					<img data-unit-type="catapult" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_catapult.webp">
					<span>${formatAsNumber(catapult)}</span>
				</td>
				<td class="paladin-world">
					<img data-unit-type="knight" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_knight.webp">
					<span>${formatAsNumber(knight)}</span>
				</td>
				<td>
					<img data-unit-type="snob" data-village-id="${id}" data-village-coords="${coords}" src="/graphic/unit/unit_snob.webp">
					<span>${formatAsNumber(snob)}</span>
				</td>
			</tr>
		`;
        });

        villagesTable += `
			</tbody>
		</table>
	`;

        return villagesTable;
    } else {
        return `<p><b>${tt('Villages list could not be fetched!')}</b><br></p>`;
    }
}

// Helper: Render groups filter
function renderGroupsFilter(groups) {
    const groupId = localStorage.getItem(`${LS_PREFIX}_chosen_group`) || 0;
    let groupsFilter = `
		<select name="ra_groups_filter" id="raGroupsFilter">
	`;

    for (const [_, group] of Object.entries(groups.result)) {
        const { group_id, name } = group;
        const isSelected =
            parseInt(group_id) === parseInt(groupId) ? 'selected' : '';
        if (name !== undefined) {
            groupsFilter += `
				<option value="${group_id}" ${isSelected}>
					${name}
				</option>
			`;
        }
    }

    groupsFilter += `
		</select>
	`;

    return groupsFilter;
}

// Helper: Process coordinate and extract coordinate continent
function getContinentByCoord(coord) {
    if (!coord) return '';
    const coordParts = coord.split('|');
    return coordParts[1].charAt(0) + coordParts[0].charAt(0);
}

// Helper: Fetch player villages by group
async function fetchAllPlayerVillagesByGroup(groupId) {
    let villagesByGroup = [];

    try {
        const url =
            game_data.link_base_pure + 'groups&ajax=load_villages_from_group';
        villagesByGroup = await jQuery
            .post({
                url: url,
                data: { group_id: groupId },
            })
            .then((response) => {
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(
                    response.html,
                    'text/html'
                );
                const tableRows = jQuery(htmlDoc)
                    .find('#group_table > tbody > tr')
                    .not(':eq(0)');

                let villagesList = [];

                tableRows.each(function () {
                    const villageId =
                        jQuery(this)
                            .find('td:eq(0) a')
                            .attr('data-village-id') ??
                        jQuery(this)
                            .find('td:eq(0) a')
                            .attr('href')
                            .match(/\d+/)[0];
                    const villageName = jQuery(this)
                        .find('td:eq(0)')
                        .text()
                        .trim();
                    const villageCoords = jQuery(this)
                        .find('td:eq(1)')
                        .text()
                        .trim();

                    villagesList.push({
                        id: parseInt(villageId),
                        name: villageName,
                        coords: villageCoords,
                    });
                });

                return villagesList;
            })
            .catch((error) => {
                UI.ErrorMessage(tt('Villages list could not be fetched!'));
                return [];
            });
    } catch (error) {
        console.error(`${scriptInfo()} Error:`, error);
        UI.ErrorMessage(tt('Villages list could not be fetched!'));
        return [];
    }

    return villagesByGroup;
}

// Helper: Fetch village groups
async function fetchVillageGroups() {
    const villageGroups = await jQuery
        .get(
            game_data.link_base_pure +
                'groups&mode=overview&ajax=load_group_menu'
        )
        .then((response) => response)
        .catch((error) => {
            UI.ErrorMessage('Error fetching village groups!');
            console.error(`${scriptInfo()} Error:`, error);
        });

    return villageGroups;
}

// Helper: Fetch World Unit Info
function fetchUnitInfo() {
    jQuery
        .ajax({
            url: '/interface.php?func=get_unit_info',
        })
        .done(function (response) {
            unitInfo = xml2json($(response));
            localStorage.setItem(
                `${LS_PREFIX}_unit_info`,
                JSON.stringify(unitInfo)
            );
            localStorage.setItem(
                `${LS_PREFIX}_last_updated`,
                Date.parse(new Date())
            );
        });
}

// Helper: Fetch home troop counts for current group
async function fetchTroopsForCurrentGroup() {
    const groupId = jQuery('.ra-group-filter.btn-confirm-yes').attr(
        'data-group-id'
    );
    const troopsForGroup = await jQuery
        .get(
            game_data.link_base_pure +
                `overview_villages&mode=combined&group=${groupId}&`
        )
        .then((response) => {
            const htmlDoc = jQuery.parseHTML(response);
            const combinedTableRows = jQuery(htmlDoc).find(
                '#combined_table tr.nowrap'
            );
            const combinedTableHead = jQuery(htmlDoc).find(
                '#combined_table tr:eq(0) th'
            );

            const homeTroops = [];
            const combinedTableHeader = [];

            // collect possible buildings and troop types
            jQuery(combinedTableHead).each(function () {
                const thImage = jQuery(this).find('img').attr('src');
                if (thImage) {
                    let thImageFilename = thImage.split('/').pop();
                    thImageFilename = thImageFilename.replace('.webp', '');
                    combinedTableHeader.push(thImageFilename);
                } else {
                    combinedTableHeader.push(null);
                }
            });

            // collect possible troop types
            combinedTableRows.each(function () {
                let rowTroops = {};

                combinedTableHeader.forEach((tableHeader, index) => {
                    if (tableHeader) {
                        if (tableHeader.includes('unit_')) {
                            const villageId = jQuery(this)
                                .find('td:eq(1) span.quickedit-vn')
                                .attr('data-id');
                            const unitType = tableHeader.replace('unit_', '');
                            rowTroops = {
                                ...rowTroops,
                                villageId: parseInt(villageId),
                                [unitType]: parseInt(
                                    jQuery(this).find(`td:eq(${index})`).text()
                                ),
                            };
                        }
                    }
                });

                homeTroops.push(rowTroops);
            });

            return homeTroops;
        })
        .catch((error) => {
            UI.ErrorMessage(
                tt('An error occured while fetching troop counts!')
            );
            console.error(`${scriptInfo()} Error:`, error);
        });

    return troopsForGroup;
}

// Helper: XML to JSON converter
var xml2json = function ($xml) {
    var data = {};
    $.each($xml.children(), function (i) {
        var $this = $(this);
        if ($this.children().length > 0) {
            data[$this.prop('tagName')] = xml2json($this);
        } else {
            data[$this.prop('tagName')] = $.trim($this.text());
        }
    });
    return data;
};

// Helper: Clear script configuration
function resetScriptConfig() {
    localStorage.removeItem(`${LS_PREFIX}_unit_info`);
    localStorage.removeItem(`${LS_PREFIX}_chosen_group`);
    localStorage.removeItem(`${LS_PREFIX}_last_updated`);
    UI.SuccessMessage(tt('Script configuration was reset!'));
}

// Helper: Format as number
function formatAsNumber(number) {
    return parseInt(number).toLocaleString('de');
}

// Helper: Get parameter by name
function getParameterByName(name, url = window.location.href) {
    return new URL(url).searchParams.get(name);
}

// Helper: Generates script info
function scriptInfo() {
    return `[${scriptData.name} ${scriptData.version}]`;
}

// Helper: Prints universal debug information
function initDebug() {
    console.debug(`${scriptInfo()} It works ðŸš€!`);
    console.debug(`${scriptInfo()} HELP:`, scriptData.helpLink);
    if (DEBUG) {
        console.debug(`${scriptInfo()} Market:`, game_data.market);
        console.debug(`${scriptInfo()} World:`, game_data.world);
        console.debug(`${scriptInfo()} Screen:`, game_data.screen);
        console.debug(`${scriptInfo()} Game Version:`, game_data.majorVersion);
        console.debug(`${scriptInfo()} Game Build:`, game_data.version);
        console.debug(`${scriptInfo()} Locale:`, game_data.locale);
        console.debug(
            `${scriptInfo()} Premium:`,
            game_data.features.Premium.active
        );
    }
}

// Helper: Text Translator
function tt(string) {
    var gameLocale = game_data.locale;

    if (translations[gameLocale] !== undefined) {
        return translations[gameLocale][string];
    } else {
        return translations['en_DK'][string];
    }
}

// Initialize Script
(async function () {
    const gameScreen = getParameterByName('screen');
    if (gameScreen === 'info_village') {
        initAttackPlanner(GROUP_ID);
    } else {
        UI.ErrorMessage(
            tt('This script can only be run on a single village screen!')
        );
    }
})();
