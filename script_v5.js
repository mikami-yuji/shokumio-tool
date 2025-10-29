document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const sanchiFilter = document.getElementById('sanchiFilter');
    const shubetsu1Filter = document.getElementById('shubetsu1Filter');
    const meigaraFilter = document.getElementById('meigaraFilter');
    const kgFilter = document.getElementById('kgFilter');
    const fukaFilter = document.getElementById('fukaFilter');
    const janFilter = document.getElementById('janFilter');
    const resetButton = document.getElementById('resetButton');
    const resultsContainer = document.getElementById('results');
    const resultsCount = document.getElementById('resultsCount');
    const orderSummaryContainer = document.querySelector('.order-summary-container');
    const orderListContainer = document.getElementById('orderList');
    const copyOrderButton = document.getElementById('copyOrderButton');
    const csvExportButton = document.getElementById('csvExportButton');
    const excelExportButton = document.getElementById('excelExportButton');
    const clearOrderButton = document.getElementById('clearOrderButton');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.querySelector('.lightbox-close');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    // Data
    let allData = [];
    let order = new Map(); // Using a Map to maintain insertion order

    // --- Utility Functions ---
    function getDisplayWidth(str) {
        let width = 0;
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            if ((charCode >= 0x00 && charCode < 0x81) || (charCode === 0xf8f0) || (charCode >= 0xff61 && charCode < 0xffa0) || (charCode >= 0xf8f1 && charCode < 0xf8f4)) {
                width += 1;
            } else {
                width += 2;
            }
        }
        return width;
    }

    function padStr(str, len) {
        const strWidth = getDisplayWidth(str);
        const padding = len - strWidth > 0 ? ' '.repeat(len - strWidth) : '';
        return str + padding;
    }

    // --- Core Functions ---
    function processData(csvText) {
        const rows = csvText.split('\n').slice(2);
        const headers = ['ＮＯ','受注','ベース','材質','種別１','種別２','ＪＡＮ','表示','デザイン','すみ分け','付加','付加2','産地','銘柄','ＫＧ','画像','詳細'];
        
        allData = rows.map(row => {
            const values = row.split(',');
            let obj = {};
            headers.forEach((header, i) => {
                obj[header] = values[i] ? values[i].trim() : '';
            });
            return obj;
        }).filter(item => item['受注']);

        populateFilters(allData);
        displayResults(allData);
        updateOrderSummary();
    }

    function populateFilters(data) {
        const sanchiSet = new Set(data.map(item => item['産地']).filter(Boolean));
        const shubetsu1Set = new Set(data.map(item => item['種別１']).filter(Boolean));
        const meigaraSet = new Set(data.map(item => item['銘柄']).filter(Boolean));
        const kgSet = new Set(data.map(item => item['ＫＧ']).filter(Boolean));
        const fukaSet = new Set();
        data.forEach(item => {
            if (item['付加'] && item['付加'] !== '―') fukaSet.add(item['付加']);
            if (item['付加2'] && item['付加2'] !== '―') fukaSet.add(item['付加2']);
        });

        sanchiFilter.innerHTML = '<option value="">産地で絞り込み</option>';
        shubetsu1Filter.innerHTML = '<option value="">種別１で絞り込み</option>';
        meigaraFilter.innerHTML = '<option value="">銘柄で絞り込み</option>';
        kgFilter.innerHTML = '<option value="">KGで絞り込み</option>';
        fukaFilter.innerHTML = '<option value="">付加で絞り込み</option>';

        sanchiSet.forEach(sanchi => sanchiFilter.add(new Option(sanchi, sanchi)));
        shubetsu1Set.forEach(shubetsu1 => shubetsu1Filter.add(new Option(shubetsu1, shubetsu1)));
        meigaraSet.forEach(meigara => meigaraFilter.add(new Option(meigara, meigara)));
        kgSet.forEach(kg => kgFilter.add(new Option(kg, kg)));
        fukaSet.forEach(fuka => fukaFilter.add(new Option(fuka, fuka)));
    }

    function displayResults(dataToDisplay) {
        resultsContainer.innerHTML = '';
        resultsCount.textContent = `該当件数: ${dataToDisplay.length}件`;

        dataToDisplay.forEach(item => {
            const isSelected = order.has(item['受注']);
            const div = document.createElement('div');
            div.className = `result-item ${isSelected ? 'selected' : ''}`;
            div.dataset.juchu = item['受注'];

            const fuka1 = (item['付加'] && item['付加'] !== '―') ? item['付加'] : '';
            const fuka2 = (item['付加2'] && item['付加2'] !== '―') ? item['付加2'] : '';
            const fukaTags = [fuka1, fuka2].filter(Boolean).map(tag => `<span class="tag">${tag}</span>`).join('');
            const imageUrl = item['画像'] ? item['画像'].replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com') : '';

            div.innerHTML = `
                <div class="card-juchu">${item['受注']}</div>
                <div class="card-selection-indicator">✓</div>
                ${imageUrl ? `<div class="card-image-wrapper"><img src="${imageUrl}" alt="商品画像" loading="lazy" class="product-image"></div>` : ''}
                <div class="card-content">
                    <h3 class="card-title">${item['銘柄']}</h3>
                    <div class="card-meta">
                        <span><strong>産地:</strong> ${item['産地']}</span>
                        <span><strong>KG:</strong> ${item['ＫＧ']}</span>
                    </div>
                    ${fukaTags ? `<div class="card-tags">${fukaTags}</div>` : ''}
                </div>
                <input type="checkbox" class="item-select" id="check-${item['受注']}" data-juchu="${item['受注']}" ${isSelected ? 'checked' : ''} style="display: none;">
            `;
            resultsContainer.appendChild(div);
        });
    }

    function updateOrderSummary() {
        if (order.size === 0) {
            orderSummaryContainer.classList.remove('visible');
            document.body.classList.remove('cart-open');
            return;
        }

        orderSummaryContainer.classList.add('visible');
        document.body.classList.add('cart-open');

        let html = '<table><thead><tr><th>受注</th><th>種別１</th><th>KG</th><th>産地</th><th>銘柄</th><th>付加</th><th>数量</th><th></th></tr></thead><tbody>';
        order.forEach((quantity, juchuCode) => {
            const item = allData.find(d => d['受注'] === juchuCode);
            if (item) {
                const fuka1 = (item['付加'] && item['付加'] !== '―') ? item['付加'] : '';
                const fuka2 = (item['付加2'] && item['付加2'] !== '―') ? item['付加2'] : '';
                const fukaText = [fuka1, fuka2].filter(Boolean).join(', ');

                html += `
                    <tr>
                        <td>${item['受注']}</td>
                        <td>${item['種別１']}</td>
                        <td>${item['ＫＧ']}</td>
                        <td>${item['産地']}</td>
                        <td>${item['銘柄']}</td>
                        <td>${fukaText}</td>
                        <td>
                            <div class="quantity-control">
                                <button class="qty-btn qty-minus" data-juchu="${juchuCode}">-</button>
                                <input type="number" class="order-quantity" value="${quantity}" min="0" data-juchu="${juchuCode}">
                                <button class="qty-btn qty-plus" data-juchu="${juchuCode}">+</button>
                            </div>
                        </td>
                        <td><button class="delete-item-btn" data-juchu="${juchuCode}">削除</button></td>
                    </tr>`;
            }
        });
        html += '</tbody></table>';
        orderListContainer.innerHTML = html;
    }

    function filterAndDisplay() {
        const searchText = searchInput.value.toLowerCase();
        const sanchi = sanchiFilter.value;
        const shubetsu1 = shubetsu1Filter.value;
        const meigara = meigaraFilter.value;
        const kg = kgFilter.value;
        const fuka = fukaFilter.value;
        const jan = janFilter.value;

        const filteredData = allData.filter(item => {
            const hasJan = item['ＪＡＮ'] && item['ＪＡＮ'] !== '―';
            const matchesJan = !jan || (jan === 'yes' && hasJan) || (jan === 'no' && !hasJan);

            const matchesFuka = !fuka || item['付加'] === fuka || item['付加2'] === fuka;
            
            return (
                (!sanchi || item['産地'] === sanchi) &&
                (!shubetsu1 || item['種別１'] === shubetsu1) &&
                (!meigara || item['銘柄'] === meigara) &&
                (!kg || item['ＫＧ'] === kg) &&
                matchesFuka &&
                matchesJan &&
                (Object.values(item).some(val => val.toLowerCase().includes(searchText)))
            );
        });

        displayResults(filteredData);
    }

    // --- Event Listeners ---

    // Scroll to top button
    window.onscroll = function() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollTopBtn.style.display = "block";
        } else {
            scrollTopBtn.style.display = "none";
        }
    };
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    });

    resultsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.result-item');
        if (!card) return; // Click was outside a card

        const juchuCode = card.dataset.juchu;
        if (!juchuCode) return;

        // If the image was clicked, open the lightbox and do nothing else
        if (e.target.classList.contains('product-image')) {
            lightbox.style.display = 'block';
            lightboxImg.src = e.target.src;
            return;
        }

        // Otherwise, toggle the selection for the whole card
        const checkbox = card.querySelector('.item-select');
        if (!checkbox) return;

        // Toggle state
        const isSelected = !checkbox.checked;
        
        if (isSelected) {
            order.set(juchuCode, 100); // Default quantity to 100
            card.classList.add('selected');
        } else {
            order.delete(juchuCode);
            card.classList.remove('selected');
        }
        checkbox.checked = isSelected; // Sync checkbox state

        updateOrderSummary();
    });
    
    orderListContainer.addEventListener('click', (e) => {
        const target = e.target;
        const juchuCode = target.dataset.juchu;
        if (!juchuCode) return;

        if (target.classList.contains('delete-item-btn')) {
            order.delete(juchuCode);
            updateOrderSummary();
            filterAndDisplay(); // Re-render main view to update checkboxes
        } else if (target.classList.contains('qty-btn')) {
            const currentQuantity = order.get(juchuCode) || 0;
            let newQuantity;
            if (target.classList.contains('qty-plus')) {
                newQuantity = currentQuantity + 100;
            } else {
                newQuantity = Math.max(0, currentQuantity - 100);
            }
            order.set(juchuCode, newQuantity);
            updateOrderSummary();
        }
    });

    orderListContainer.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('order-quantity')) {
            const juchuCode = target.dataset.juchu;
            const newQuantity = parseInt(target.value, 10);
            if (juchuCode && !isNaN(newQuantity)) {
                order.set(juchuCode, newQuantity >= 0 ? newQuantity : 0);
                // Call updateOrderSummary to ensure consistency if user types and then uses buttons
                updateOrderSummary(); 
            }
        }
    });

    // Close lightbox
    lightboxClose.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) { // Close if clicking on the background
            lightbox.style.display = 'none';
        }
    });

    searchInput.addEventListener('input', filterAndDisplay);
    sanchiFilter.addEventListener('change', filterAndDisplay);
    shubetsu1Filter.addEventListener('change', filterAndDisplay);
    meigaraFilter.addEventListener('change', filterAndDisplay);
    kgFilter.addEventListener('change', filterAndDisplay);
    fukaFilter.addEventListener('change', filterAndDisplay);
    janFilter.addEventListener('change', filterAndDisplay);

    resetButton.addEventListener('click', () => {
        searchInput.value = '';
        sanchiFilter.value = '';
        shubetsu1Filter.value = '';
        meigaraFilter.value = '';
        kgFilter.value = '';
        fukaFilter.value = '';
        janFilter.value = '';
        filterAndDisplay();
    });

    clearOrderButton.addEventListener('click', () => {
        order.clear();
        updateOrderSummary();
        filterAndDisplay();
    });

    copyOrderButton.addEventListener('click', () => {
        if (order.size === 0) {
            alert('発注リストは空です。');
            return;
        }

        const header = {
            juchu: '受注',
            shubetsu1: '種別１',
            kg: 'KG',
            sanchi: '産地',
            meigara: '銘柄',
            fuka: '付加',
            quantity: '数量'
        };

        const lines = [];
        const maxWidths = {
            juchu: getDisplayWidth(header.juchu),
            shubetsu1: getDisplayWidth(header.shubetsu1),
            kg: getDisplayWidth(header.kg),
            sanchi: getDisplayWidth(header.sanchi),
            meigara: getDisplayWidth(header.meigara),
            fuka: getDisplayWidth(header.fuka),
            quantity: getDisplayWidth(header.quantity)
        };

        order.forEach((quantity, juchuCode) => {
            const item = allData.find(d => d['受注'] === juchuCode);
            if (item) {
                const fuka1 = (item['付加'] && item['付加'] !== '―') ? item['付加'] : '';
                const fuka2 = (item['付加2'] && item['付加2'] !== '―') ? item['付加2'] : '';
                const fukaText = [fuka1, fuka2].filter(Boolean).join(', ');
                const quantityText = `${quantity}枚`;

                const line = {
                    juchu: item['受注'],
                    shubetsu1: item['種別１'],
                    kg: item['ＫＧ'],
                    sanchi: item['産地'],
                    meigara: item['銘柄'],
                    fuka: fukaText,
                    quantity: quantityText
                };
                lines.push(line);

                Object.keys(maxWidths).forEach(key => {
                    maxWidths[key] = Math.max(maxWidths[key], getDisplayWidth(line[key]));
                });
            }
        });

        let textToCopy = padStr(header.juchu, maxWidths.juchu) + '  ' +
                           padStr(header.shubetsu1, maxWidths.shubetsu1) + '  ' +
                           padStr(header.kg, maxWidths.kg) + '  ' +
                           padStr(header.sanchi, maxWidths.sanchi) + '  ' +
                           padStr(header.meigara, maxWidths.meigara) + '  ' +
                           padStr(header.fuka, maxWidths.fuka) + '  ' +
                           header.quantity + '\n';

        lines.forEach(line => {
            textToCopy += padStr(line.juchu, maxWidths.juchu) + '  ' +
                          padStr(line.shubetsu1, maxWidths.shubetsu1) + '  ' +
                          padStr(line.kg, maxWidths.kg) + '  ' +
                          padStr(line.sanchi, maxWidths.sanchi) + '  ' +
                          padStr(line.meigara, maxWidths.meigara) + '  ' +
                          padStr(line.fuka, maxWidths.fuka) + '  ' +
                          line.quantity + '\n';
        });

        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('発注リストをクリップボードにコピーしました。');
        }, () => {
            alert('クリップボードへのコピーに失敗しました。');
        });
    });

    // --- Export Functions ---
    function getExportData() {
        if (order.size === 0) {
            alert('発注リストは空です。');
            return null;
        }

        const dataToExport = [];
        const headers = {
            juchu: '受注',
            shubetsu1: '種別１',
            kg: 'KG',
            sanchi: '産地',
            meigara: '銘柄',
            fuka: '付加',
            quantity: '数量',
            imageUrl: '画像URL'
        };

        order.forEach((quantity, juchuCode) => {
            const item = allData.find(d => d['受注'] === juchuCode);
            if (item) {
                const fuka1 = (item['付加'] && item['付加'] !== '―') ? item['付加'] : '';
                const fuka2 = (item['付加2'] && item['付加2'] !== '―') ? item['付加2'] : '';
                const fukaText = [fuka1, fuka2].filter(Boolean).join(', ');
                const imageUrl = item['画像'] ? item['画像'].replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com') : '';

                dataToExport.push({
                    [headers.juchu]: item['受注'],
                    [headers.shubetsu1]: item['種別１'],
                    [headers.kg]: item['ＫＧ'],
                    [headers.sanchi]: item['産地'],
                    [headers.meigara]: item['銘柄'],
                    [headers.fuka]: fukaText,
                    [headers.quantity]: quantity,
                    [headers.imageUrl]: imageUrl
                });
            }
        });

        return dataToExport;
    }

    csvExportButton.addEventListener('click', () => {
        const data = getExportData();
        if (!data) return;

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        data.forEach(row => {
            const values = headers.map(header => {
                const escaped = ('' + row[header]).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
        const blob = new Blob([bom, csvString], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', '発注リスト.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    excelExportButton.addEventListener('click', () => {
        const data = getExportData();
        if (!data) return;

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '発注リスト');

        // Set column widths
        const colWidths = [
            { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, 
            { wch: 20 }, { wch: 10 }, { wch: 50 }
        ];
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, '発注リスト.xlsx');
    });

    // Initial Load
    fetch('https://mikami-yuji.github.io/shokumio-tool/data.csv?v=' + new Date().getTime()) // Fetch from GitHub Pages URL
        .then(response => {
            console.log('Fetch response received:', response);
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            // Use arrayBuffer and TextDecoder for explicit encoding handling
            return response.arrayBuffer().then(buffer => {
                try {
                    const decodedText = new TextDecoder('shift_jis', { fatal: true }).decode(buffer);
                    console.log('CSV text decoded as Shift_JIS. Length:', decodedText.length);
                    console.log('First 200 chars of Shift_JIS CSV:', decodedText.substring(0, 200));
                    return decodedText;
                } catch (e) {
                    console.warn('Shift_JIS decoding failed, trying UTF-8. Error:', e);
                    const decodedText = new TextDecoder('utf-8').decode(buffer);
                    console.log('CSV text decoded as UTF-8. Length:', decodedText.length);
                    console.log('First 200 chars of UTF-8 CSV:', decodedText.substring(0, 200));
                    return decodedText;
                }
            });
        })
        .then(csvText => {
            processData(csvText);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            resultsContainer.innerHTML = `<p style="color: red;">エラー: data.csvの読み込みに失敗しました。ファイルが存在し、start_tool.batから起動しているか確認してください。詳細: ${error.message}</p>`;
        });
});
