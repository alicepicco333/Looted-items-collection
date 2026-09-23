// Home page: the five eras of appropriation (when the objects were taken) as tabs,
// each with its text and images.

const eras = [
    {
        title: "Spoils of Europe's wars (1204 - 1815)",
        description: "Looting did not begin with overseas empires. In 1204 the Fourth Crusade sacked Constantinople, and Venice carried off the four gilded Horses of Saint Mark. In 1648, in the last months of the Thirty Years' War, Swedish troops emptied Prague Castle and took the Codex Gigas to Stockholm. The French Revolution turned confiscation into policy: in 1794 the central panels of the Ghent Altarpiece went to Paris, and in 1797 Napoleon removed the horses from Venice. After his defeat in 1815 the Allies sent much of this art back, one of the first large returns in history, though Venice kept what it had taken from Constantinople.",
        images: [
            "images/obj27-saint-mark-horses-1.jpg",
            "images/obj30-codex-gigas-2.jpg",
            "images/obj28-ghent-1.jpg",
            "images/obj27-saint-mark-horses-2.jpg"
        ]
    },
    {
        title: "Conquest and voyages (1519 - 1801)",
        description: "The Spanish conquest of the Aztec Empire (1519–1521) sent featherwork and gold to the Habsburg courts, where Moctezuma's headdress was recorded in 1596. Two centuries later, British voyages of exploration reached the Pacific: at Kamay in 1770 James Cook's crew took a shield and spears from the Gweagal, and in 1779 the Hawaiian chief Kalaniʻōpuʻu gave Cook his feather cloak and helmet. In 1799 British troops looted Tipu Sultan's palace at Srirangapatna, and in 1801 the Rosetta Stone passed from the defeated French army in Egypt to the British.",
        images: [
            "images/obj25-penacho-2.jpg",
            "images/obj23-gweagal-1.jpg",
            "images/obj24-kalaniopuu-1.jpg",
            "images/obj16-rosetta-1.jpg"
        ]
    },
    {
        title: "The imperial century (1801 - 1880)",
        description: "As European empires expanded, objects flowed to their capitals. Lord Elgin's agents removed the Parthenon sculptures in 1801–1812, and the Dendera Zodiac was cut from its temple ceiling in 1820. In 1849 the Koh-i-Noor was surrendered to the British after the Anglo-Sikh wars, and in 1860 British and French troops looted and burned the Old Summer Palace in Beijing. French forces took the royal Uigwe from Ganghwa Island in Korea in 1866, the Moai Hoa Hakananai'a was removed from Rapa Nui in 1868, and Heinrich Schliemann smuggled Priam's Treasure out of the Ottoman Empire in 1873.",
        images: [
            "images/cropped-parthenon1.jpg",
            "images/obj17-dendera-1.jpg",
            "images/cropped-summerpalace1.jpg",
            "images/obj21-uigwe-1.jpg"
        ]
    },
    {
        title: "Scramble for the world (1880 - 1914)",
        description: "At the height of imperialism, conquest and archaeology went hand in hand. French troops took the throne of King Glele from Abomey in 1892, and British forces sacked Benin City in 1897, carrying off the Benin Bronzes and the ivory mask of Queen Idia. After the Boxer War of 1900, French and German soldiers removed the instruments of the Beijing Observatory. German officers took Ngonnso' from the Nso' kingdom in Cameroon in 1902, German archaeologists excavated the Ishtar Gate at Babylon and the bust of Nefertiti at Amarna, and in 1907 Aurel Stein bought the Diamond Sutra at Dunhuang. Yale's expeditions shipped finds from Machu Picchu from 1912.",
        images: [
            "images/cropped-benin1.jpg",
            "images/obj06-observatory-1.jpg",
            "images/cropped-nefertiti1.jpg",
            "images/obj22-ishtar-1.jpg"
        ]
    },
    {
        title: "World wars and returns (1914 - today)",
        description: "The world wars moved heritage again. The Treaty of Versailles made Germany return the observatory instruments to China and the Ghent Altarpiece's wings to Belgium. The Nazis hid looted art, including the altarpiece, in the Altaussee salt mine, and in 1945 the Red Army took Priam's Treasure from Berlin to Moscow. Illegal trade continued, from the Paracas textiles smuggled to Sweden in the 1930s to the Nok terracottas looted in Nigeria. Since then some objects have gone home: the Machu Picchu finds in 2011–2012, the Uigwe in 2011, Kalaniʻōpuʻu's regalia in 2016, the Paracas textiles by 2021 and the throne of Glele in 2021. Most are still waiting.",
        images: [
            "images/obj28-ghent-2.jpg",
            "images/obj29-priam-1.jpg",
            "images/obj18-paracas-1.jpg",
            "images/cropped-nok1.jpg"
        ]
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const tabList = document.getElementById('era-tabs');
    const title = document.getElementById('era-title');
    const text = document.getElementById('era-text');
    const images = document.getElementById('era-images');
    if (!tabList) return;

    // "Spoils of Europe's wars (1204 - 1815)" -> name "Spoils of Europe's wars", range "1204 - 1815"
    const split = (t) => {
        const m = t.match(/^(.*?)\s*\((.*)\)$/);
        return m ? { name: m[1], range: m[2] } : { name: t, range: '' };
    };

    function show(index, focus) {
        const era = eras[index];
        tabList.querySelectorAll('.tab').forEach((tab, i) => {
            tab.setAttribute('aria-selected', String(i === index));
            tab.tabIndex = i === index ? 0 : -1;
        });
        if (focus) tabList.children[index].focus();
        const { name, range } = split(era.title);
        title.innerHTML = `${name}<span class="mono">${range}</span>`;
        text.textContent = era.description;
        images.innerHTML = '';
        era.images.slice(0, 4).forEach((src) => {
            const figure = document.createElement('figure');
            figure.className = 'duotone';
            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            img.loading = 'lazy';
            figure.appendChild(img);
            images.appendChild(figure);
        });
    }

    eras.forEach((era, i) => {
        const { name, range } = split(era.title);
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'tab';
        tab.id = `era-tab-${i}`;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', 'era-panel');
        tab.innerHTML = `${name}<small>${range}</small>`;
        tab.addEventListener('click', () => show(i));
        // arrow keys move between tabs
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') show((i + 1) % eras.length, true);
            if (e.key === 'ArrowLeft') show((i - 1 + eras.length) % eras.length, true);
        });
        tabList.appendChild(tab);
    });

    show(0);
});
