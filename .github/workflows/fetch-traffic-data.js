const fs = require('fs');
const fetch = require('node-fetch');

// Personal Access Token (PAT) by měl být uložen v proměnné prostředí
const token = process.env.GH_PAT;
const headers = {
    'Authorization': `token ${token}`,
    'User-Agent': 'fetch-traffic-data-script'
};

// Názvy repozitářů, pro které chceme získat data
const repositories = [
    { owner: 'JiriMusilCZ', repo: 'EvidencePojistenych', output: 'evidence_traffic_data.json' },
    { owner: 'JiriMusilCZ', repo: 'invoice-client-starter', output: 'invoice_client_traffic_data.json' },
    { owner: 'JiriMusilCZ', repo: 'invoice-server-starter', output: 'invoice_server_traffic_data.json' }
];

// Funkce pro získání dat o návštěvnosti
async function fetchTrafficData(owner, repo) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/traffic/views`, { headers });
    if (!response.ok) {
        throw new Error(`Chyba při načítání dat pro ${owner}/${repo}: ${response.statusText}`);
    }
    return response.json();
}

// Funkce pro získání dat o stahování vydání
async function fetchDownloadData(owner, repo) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, { headers });
    if (!response.ok) {
        throw new Error(`Chyba při načítání dat o stahování pro ${owner}/${repo}: ${response.statusText}`);
    }

    const releases = await response.json();
    let downloadCount = 0;

    releases.forEach(release => {
        release.assets.forEach(asset => {
            downloadCount += asset.download_count;
        });
    });

    return downloadCount;
}

// Funkce pro uložení dat do JSON souboru
function saveDataToFile(filename, data) {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Data uložena do ${filename}`);
}

// Hlavní funkce pro zpracování dat
(async function () {
    try {
        for (const { owner, repo, output } of repositories) {
            const trafficData = await fetchTrafficData(owner, repo);
            const downloadCount = await fetchDownloadData(owner, repo);

            const data = {
                count: trafficData.count,
                uniques: trafficData.uniques,
                download_count: downloadCount
            };

            saveDataToFile(output, data);
        }
    } catch (error) {
        console.error('Došlo k chybě:', error);
        process.exit(1);
    }
})();
