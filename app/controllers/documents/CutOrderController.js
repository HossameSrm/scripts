/**
 * MVC Controller: CutOrderController
 * Contrôle le formulaire, les calculs, le rendu document et les exports.
 */
window.SRM.Controllers.CutOrderController = { module: 'CutOrderController' };
const $ = (id) => document.getElementById(id);
    const SERVICES = ['EAU', 'BT', 'MT'];

    const contractTemplate = $('contractTemplate');
    const metaTemplate = $('metaTemplate');
    const arrearTemplate = $('arrearTemplate');

    const contractsList = $('contractsList');
    const metaRows = $('metaRows');
    const arrearsRows = $('arrearsRows');

    let currentData = null;

    function localIso(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function formatDate(value) {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(`${value}T12:00:00`));
    }

    function money(value) {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(value) || 0);
    }

    function pdfMoney(value) {
        const numericValue = Number(value) || 0;
        const [integerPart, decimalPart] = numericValue
            .toFixed(2)
            .split('.');

        const groupedInteger = integerPart.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            ' '
        );

        return `${groupedInteger},${decimalPart}`;
    }

    function esc(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function normalizeProductMonth(value) {
        const rawText = String(value ?? '').trim();

        if (!rawText) return '';

        const text = rawText
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\./g, '')
            .trim();

        if (/^\d{4}-\d{2}$/.test(text)) {
            return text;
        }

        const slashMatch = text.match(/^(\d{1,2})[\/\-](\d{4})$/);

        if (slashMatch) {
            const month = Number(slashMatch[1]);
            const year = Number(slashMatch[2]);

            if (month >= 1 && month <= 12) {
                return `${year}-${String(month).padStart(2, '0')}`;
            }
        }

        const yearFirstMatch = text.match(/^(\d{4})[\/\-](\d{1,2})(?:[\/\-]\d{1,2})?$/);

        if (yearFirstMatch) {
            const year = Number(yearFirstMatch[1]);
            const month = Number(yearFirstMatch[2]);

            if (month >= 1 && month <= 12) {
                return `${year}-${String(month).padStart(2, '0')}`;
            }
        }

        const frenchMonths = {
            jan: 1,
            janv: 1,
            fev: 2,
            fevr: 2,
            feb: 2,
            mar: 3,
            mars: 3,
            avr: 4,
            avril: 4,
            mai: 5,
            jun: 6,
            juin: 6,
            jul: 7,
            juil: 7,
            aou: 8,
            aout: 8,
            sep: 9,
            sept: 9,
            oct: 10,
            nov: 11,
            dec: 12,
        };

        const monthNameMatch = text.match(/^([a-z]+)[\/\- ](\d{2}|\d{4})$/);

        if (monthNameMatch) {
            const month = frenchMonths[monthNameMatch[1]];
            let year = Number(monthNameMatch[2]);

            if (year < 100) {
                year += 2000;
            }

            if (month) {
                return `${year}-${String(month).padStart(2, '0')}`;
            }
        }

        return '';
    }

    function displayProductMonth(value) {
        const normalized = normalizeProductMonth(value);

        if (!normalized) return '';

        const [year, month] = normalized.split('-');
        return `${month}/${year}`;
    }

    function productMonthTimestamp(value) {
        const normalized = normalizeProductMonth(value);

        if (!normalized) return Number.POSITIVE_INFINITY;

        const [year, month] = normalized.split('-').map(Number);
        return new Date(year, month - 1, 1).getTime();
    }

    function formatInvoiceNumber(value) {
        const digits = String(value ?? '').replace(/\D/g, '');

        if (!digits) return '';

        return digits.match(/.{1,3}/g).join(' ');
    }

    function parseBalance(value) {
        let text = String(value ?? '').trim().replace(/\s/g, '');

        if (text.includes(',') && text.includes('.')) {
            if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
                text = text.replaceAll('.', '').replace(',', '.');
            } else {
                text = text.replaceAll(',', '');
            }
        } else if (text.includes(',')) {
            text = text.replace(',', '.');
        }

        const parsed = Number(text);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function getMargins() {
        const clamp = (value, fallback) => {
            const n = Number(value);
            return Number.isFinite(n) ? Math.min(50, Math.max(0, n)) : fallback;
        };

        return {
            top: clamp($('marginTop').value, 14),
            right: clamp($('marginRight').value, 14),
            bottom: clamp($('marginBottom').value, 14),
            left: clamp($('marginLeft').value, 14),
        };
    }

    function applyMargins(element, margins) {
        element.style.setProperty('--margin-top', `${margins.top}mm`);
        element.style.setProperty('--margin-right', `${margins.right}mm`);
        element.style.setProperty('--margin-bottom', `${margins.bottom}mm`);
        element.style.setProperty('--margin-left', `${margins.left}mm`);
    }

    function removeIds(element) {
        element.removeAttribute('id');
        element.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    }

    function getContracts() {
        return [...contractsList.querySelectorAll('.contract-card')]
            .map(card => ({
                selected: card.querySelector('.contract-selected').checked,
                number: card.querySelector('.contract-number').value.trim(),
                address: card.querySelector('.contract-address').value.trim(),
            }))
            .filter(item => item.number || item.address);
    }

    function getSelectedContracts() {
        return getContracts().filter(item => item.selected && item.number);
    }

    function updateSelectedContractsText() {
        const text = getSelectedContracts().map(item => item.number).join(', ');
        $('selectedContractsText').textContent = text || '—';
        refreshArrearContractOptions();
    }

    function refreshArrearContractOptions() {
        const contracts = getContracts().filter(item => item.number);

        arrearsRows.querySelectorAll('.arrear-row').forEach(row => {
            const select = row.querySelector('.arrear-contract-select');
            const oldValue = select.value;

            select.innerHTML = '<option value="">Choisir contrat</option>' +
                contracts.map(item =>
                    `<option value="${esc(item.number)}">${esc(item.number)}</option>`
                ).join('');

            if (contracts.some(item => item.number === oldValue)) {
                select.value = oldValue;
            }
        });
    }

    function addContract(initial = { selected: true, number: '', address: '' }) {
        const fragment = contractTemplate.content.cloneNode(true);
        const card = fragment.querySelector('.contract-card');

        const selected = card.querySelector('.contract-selected');
        const number = card.querySelector('.contract-number');
        const address = card.querySelector('.contract-address');

        selected.checked = initial.selected !== false;
        number.value = initial.number || '';
        address.value = initial.address || '';

        [selected, number, address].forEach(input => {
            input.addEventListener('input', updateSelectedContractsText);
            input.addEventListener('change', updateSelectedContractsText);
        });

        card.querySelector('.remove-contract').addEventListener('click', () => {
            card.remove();

            if (!contractsList.querySelector('.contract-card')) {
                addContract();
            }

            updateSelectedContractsText();
        });

        contractsList.appendChild(fragment);
        updateSelectedContractsText();
    }

    function addMeta(initial = { key: '', value: '' }) {
        const fragment = metaTemplate.content.cloneNode(true);
        const row = fragment.querySelector('.meta-row');

        row.querySelector('.meta-key').value = initial.key || '';
        row.querySelector('.meta-value').value = initial.value || '';

        row.querySelector('.remove-meta').addEventListener('click', () => row.remove());
        metaRows.appendChild(fragment);
    }

    function addArrear(initial = {}) {
        const fragment = arrearTemplate.content.cloneNode(true);
        const row = fragment.querySelector('.arrear-row');

        row.querySelector('.arrear-service').value =
            SERVICES.includes(String(initial.service || '').toUpperCase())
                ? String(initial.service).toUpperCase()
                : 'EAU';

        arrearsRows.appendChild(fragment);
        refreshArrearContractOptions();

        const select = row.querySelector('.arrear-contract-select');
        const address = row.querySelector('.arrear-address');

        if (initial.contract) {
            select.value = initial.contract;
        }

        address.value = initial.address || '';
        const invoiceInput = row.querySelector('.arrear-invoice');
        invoiceInput.value = formatInvoiceNumber(initial.invoice || '');

        invoiceInput.addEventListener('input', () => {
            const cursorAtEnd =
                invoiceInput.selectionStart === invoiceInput.value.length;

            invoiceInput.value = formatInvoiceNumber(invoiceInput.value);

            if (cursorAtEnd) {
                invoiceInput.setSelectionRange(
                    invoiceInput.value.length,
                    invoiceInput.value.length
                );
            }
        });
        row.querySelector('.arrear-product').value =
            normalizeProductMonth(initial.product);
        row.querySelector('.arrear-balance').value = initial.balance ?? '';

        select.addEventListener('change', () => {
            const contract = getContracts().find(item => item.number === select.value);

            if (contract) {
                address.value = contract.address || '';
            }
        });

        row.querySelector('.remove-arrear').addEventListener('click', () => {
            row.remove();

            if (!arrearsRows.querySelector('.arrear-row')) {
                addArrear();
            }
        });
    }

    function setInputMode(mode) {
        const manual = mode === 'manual';

        $('manualPanel').classList.toggle('hidden', !manual);
        $('excelPanel').classList.toggle('hidden', manual);

        $('manualModeBtn').className = manual
            ? 'rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white'
            : 'rounded-xl px-4 py-2 text-sm font-bold text-slate-600';

        $('excelModeBtn').className = !manual
            ? 'rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white'
            : 'rounded-xl px-4 py-2 text-sm font-bold text-slate-600';
    }

    function importExcel() {
        const raw = $('excelPaste').value.trim();

        if (!raw) {
            $('excelStatus').textContent =
                'Collez d’abord les données copiées depuis Excel.';
            return;
        }

        const lines = raw
            .split(/\r?\n/)
            .filter(line => line.trim());

        const imported = [];
        let ignored = 0;

        let lastService = '';
        let lastContract = '';
        let lastAddress = '';

        lines.forEach((line, index) => {
            const columns = line.includes('\t')
                ? line.split('\t')
                : line.split(';');

            while (columns.length < 6) {
                columns.push('');
            }

            const values = columns.map(value => value.trim());

            if (
                index === 0 &&
                /service/i.test(values[0] || '') &&
                /contrat/i.test(values[1] || '')
            ) {
                return;
            }

            const firstCell = String(values[0] || '').trim();
            const invoiceCell = String(values[3] || '').trim();

            // Totals copied from Excel are ignored because the app recalculates them.
            if (
                /^total\s+general$/i.test(firstCell) ||
                /^total\s+(eau|bt|mt)$/i.test(firstCell) ||
                /^total\s+/i.test(invoiceCell)
            ) {
                return;
            }

            const explicitService = String(values[0] || '')
                .trim()
                .toUpperCase();

            if (explicitService) {
                if (!SERVICES.includes(explicitService)) {
                    ignored += 1;
                    return;
                }

                lastService = explicitService;
            }

            // Fill down values from merged Excel cells.
            if (values[1]) lastContract = values[1];
            if (values[2]) lastAddress = values[2];

            const service = lastService;
            const contractNumber = lastContract;
            const address = lastAddress;
            const invoice = formatInvoiceNumber(values[3] || '');
            const product = normalizeProductMonth(values[4] || '');
            const balance = parseBalance(values.slice(5).join(' '));

            if (
                !service ||
                !contractNumber ||
                (!invoice && !product && balance <= 0)
            ) {
                ignored += 1;
                return;
            }

            let contract = getContracts().find(
                item => item.number === contractNumber
            );

            if (!contract) {
                addContract({
                    selected: true,
                    number: contractNumber,
                    address,
                });

                contract = {
                    number: contractNumber,
                    address,
                };
            } else if (!contract.address && address) {
                const contractCard = [...contractsList.querySelectorAll('.contract-card')]
                    .find(card =>
                        card.querySelector('.contract-number').value.trim() === contractNumber
                    );

                if (contractCard) {
                    contractCard.querySelector('.contract-address').value = address;
                }
            }

            imported.push({
                service,
                contract: contractNumber,
                address: address || contract.address || '',
                invoice,
                product,
                balance,
            });
        });

        if (imported.length) {
            arrearsRows.innerHTML = '';
            imported.forEach(addArrear);
            setInputMode('manual');
            updateSelectedContractsText();
        }

        $('excelStatus').textContent =
            `${imported.length} ligne(s) importée(s)` +
            (ignored ? `, ${ignored} ligne(s) ignorée(s).` : '.');
    }

    function collectData() {
        const contracts = getContracts();
        const selectedContracts = contracts.filter(item => item.selected && item.number);

        const data = {
            date: $('documentDate').value,
            title: $('documentTitle').value,
            client: $('clientName').value.trim(),
            tourne: $('tourne').value.trim(),
            reason: $('reason').value.trim(),
            contracts,
            selectedContracts,
            includeArrears: $('includeArrears').checked,
            margins: getMargins(),
            meta: [],
            arrears: [],
        };

        metaRows.querySelectorAll('.meta-row').forEach(row => {
            const key = row.querySelector('.meta-key').value.trim();
            const value = row.querySelector('.meta-value').value.trim();

            if (key || value) {
                data.meta.push({ key, value });
            }
        });

        if (data.includeArrears) {
            arrearsRows.querySelectorAll('.arrear-row').forEach(row => {
                const item = {
                    service: row.querySelector('.arrear-service').value,
                    contract: row.querySelector('.arrear-contract-select').value,
                    address: row.querySelector('.arrear-address').value.trim(),
                    invoice: formatInvoiceNumber(
                        row.querySelector('.arrear-invoice').value
                    ),
                    product: normalizeProductMonth(
                        row.querySelector('.arrear-product').value
                    ),
                    balance: parseBalance(row.querySelector('.arrear-balance').value),
                };

                if (
                    item.contract ||
                    item.address ||
                    item.invoice ||
                    item.product ||
                    item.balance > 0
                ) {
                    data.arrears.push(item);
                }
            });
        }

        if (
            !data.date ||
            !data.client ||
            !data.reason ||
            data.selectedContracts.length === 0
        ) {
            return null;
        }

        return data;
    }

    function buildArrearsRows(data) {
        let html = '';

        SERVICES.forEach(service => {
            const serviceItems = data.arrears.filter(
                item => item.service === service
            );

            if (!serviceItems.length) return;

            const contractGroups = new Map();

            serviceItems.forEach(item => {
                const contractKey = item.contract || 'SANS CONTRAT';

                if (!contractGroups.has(contractKey)) {
                    contractGroups.set(contractKey, []);
                }

                contractGroups.get(contractKey).push(item);
            });

            const orderedContractGroups = [...contractGroups.entries()].sort(
                ([contractA], [contractB]) =>
                    contractA.localeCompare(contractB, 'fr', {
                        numeric: true,
                        sensitivity: 'base',
                    })
            );

            const hasMultipleContracts = orderedContractGroups.length > 1;

            const serviceDataRowCount = orderedContractGroups.reduce(
                (count, [, items]) =>
                    count +
                    items.length +
                    (hasMultipleContracts ? 1 : 0),
                0
            );

            let serviceCellRendered = false;

            orderedContractGroups.forEach(([contractNumber, items]) => {
                const sortedItems = [...items].sort((a, b) => {
                    const productDifference =
                        productMonthTimestamp(a.product) -
                        productMonthTimestamp(b.product);

                    if (productDifference !== 0) {
                        return productDifference;
                    }

                    return String(a.invoice || '').localeCompare(
                        String(b.invoice || ''),
                        'fr',
                        {
                            numeric: true,
                            sensitivity: 'base',
                        }
                    );
                });

                const contractTotal = sortedItems.reduce(
                    (sum, item) => sum + item.balance,
                    0
                );

                const contractRowspan =
                    sortedItems.length +
                    (hasMultipleContracts ? 1 : 0);

                sortedItems.forEach((item, index) => {
                    html += `
                        <tr>
                            ${
                                !serviceCellRendered
                                    ? `<td rowspan="${serviceDataRowCount}" style="font-weight:700">${esc(service)}</td>`
                                    : ''
                            }
                            ${
                                index === 0
                                    ? `<td rowspan="${contractRowspan}" style="font-weight:700">${esc(contractNumber)}</td>`
                                    : ''
                            }
                            ${
                                index === 0
                                    ? `<td rowspan="${contractRowspan}" class="left">${esc(item.address)}</td>`
                                    : ''
                            }
                            <td>${esc(formatInvoiceNumber(item.invoice))}</td>
                            <td>${esc(displayProductMonth(item.product))}</td>
                            <td class="amount">${money(item.balance)}</td>
                        </tr>
                    `;

                    serviceCellRendered = true;
                });

                if (hasMultipleContracts) {
                    html += `
                        <tr class="subtotal-row">
                            <td colspan="2" style="text-align:right">
                                Total ${esc(contractNumber)}
                            </td>
                            <td class="amount">${money(contractTotal)}</td>
                        </tr>
                    `;
                }
            });

            const serviceTotal = serviceItems.reduce(
                (sum, item) => sum + item.balance,
                0
            );

            html += `
                <tr class="subtotal-row">
                    <td colspan="5" style="text-align:right">
                        Total ${esc(service)}
                    </td>
                    <td class="amount">${money(serviceTotal)}</td>
                </tr>
            `;
        });

        const grandTotal = data.arrears.reduce(
            (sum, item) => sum + item.balance,
            0
        );

        html += `
            <tr class="grand-total-row">
                <td colspan="5">TOTAL GENERAL</td>
                <td class="amount">${money(grandTotal)}</td>
            </tr>
        `;

        return html;
    }

    function renderDocument(data) {
        applyMargins($('documentPaper'), data.margins);

        $('docDate').textContent = formatDate(data.date);
        $('docTitle').textContent = data.title;

        const contractsString = data.selectedContracts
            .map(item => item.number)
            .join(', ');

        const summaryRows = [
            ['CLIENT', data.client],
            ['TOURNE', data.tourne],
            ['CONTRATS', contractsString],
            ['MOTIF', data.reason],
            ...data.meta.map(item => [item.key, item.value]),
        ].filter(([, value]) => value);

        $('docSummaryBody').innerHTML = summaryRows
            .map(([key, value]) => `
                <tr>
                    <td>${esc(key)}</td>
                    <td>${esc(value)}</td>
                </tr>
            `)
            .join('');

        if (!data.includeArrears || data.arrears.length === 0) {
            $('docArrearsSection').classList.add('hidden');
            $('docArrearsBody').innerHTML = '';
            return;
        }

        $('docArrearsSection').classList.remove('hidden');
        $('docArrearsBody').innerHTML = buildArrearsRows(data);
    }

    function renderPreview(data) {
        renderDocument(data);

        const clone = $('documentPaper').cloneNode(true);
        removeIds(clone);
        clone.classList.remove('hidden');
        applyMargins(clone, data.margins);

        $('previewHost').innerHTML = '';
        $('previewHost').appendChild(clone);

        const contractsString = data.selectedContracts
            .map(item => item.number)
            .join(', ');

        $('summaryClient').textContent = data.client;
        $('summaryContracts').textContent = contractsString;

        const totals = Object.fromEntries(
            SERVICES.map(service => [
                service,
                data.arrears
                    .filter(item => item.service === service)
                    .reduce((sum, item) => sum + item.balance, 0),
            ])
        );

        const grandTotal = Object.values(totals).reduce((sum, value) => sum + value, 0);

        $('summaryTotal').textContent = `${money(grandTotal)} MAD`;

        $('serviceTotals').innerHTML = SERVICES.map(service => `
            <article class="rounded-2xl bg-white p-4 shadow-sm">
                <p class="text-xs font-bold uppercase text-slate-400">Total ${service}</p>
                <p class="mt-2 font-black">${money(totals[service])} MAD</p>
            </article>
        `).join('');

        $('statusBadge').textContent = 'Document prêt';
        $('statusBadge').className =
            'rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600';
    }

    function generate() {
        const data = collectData();

        if (!data) {
            alert('Renseignez la date, le client, le motif et sélectionnez au moins un contrat.');
            return null;
        }

        currentData = data;
        renderPreview(data);
        return data;
    }

    function safeFilename(data, extension) {
        const base = data.client
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase() || 'client';

        return `ordre-coupure-${base}.${extension}`;
    }

    function getSummaryRows(data) {
        const contractsString = data.selectedContracts
            .map(item => item.number)
            .join(', ');

        return [
            ['CLIENT', data.client],
            ['TOURNE', data.tourne],
            ['CONTRATS', contractsString],
            ['MOTIF', data.reason],
            ...data.meta.map(item => [item.key, item.value]),
        ].filter(([, value]) => value);
    }

    function getGroupedArrears(data) {
        const services = [];

        SERVICES.forEach(service => {
            const serviceItems = data.arrears.filter(
                item => item.service === service
            );

            if (!serviceItems.length) return;

            const contractMap = new Map();

            serviceItems.forEach(item => {
                const key = item.contract || 'SANS CONTRAT';

                if (!contractMap.has(key)) {
                    contractMap.set(key, []);
                }

                contractMap.get(key).push(item);
            });

            const contracts = [...contractMap.entries()]
                .sort(([a], [b]) =>
                    a.localeCompare(b, 'fr', {
                        numeric: true,
                        sensitivity: 'base',
                    })
                )
                .map(([number, items]) => ({
                    number,
                    items: [...items].sort((a, b) => {
                        const dateDiff =
                            productMonthTimestamp(a.product) -
                            productMonthTimestamp(b.product);

                        if (dateDiff !== 0) return dateDiff;

                        return String(a.invoice || '').localeCompare(
                            String(b.invoice || ''),
                            'fr',
                            {
                                numeric: true,
                                sensitivity: 'base',
                            }
                        );
                    }),
                }));

            services.push({
                service,
                contracts,
                total: serviceItems.reduce(
                    (sum, item) => sum + item.balance,
                    0
                ),
            });
        });

        return services;
    }

    function dataUriToUint8Array(dataUri) {
        const base64 = dataUri.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
        }

        return bytes;
    }

    function buildPdfArrearsRows(data) {
        const rows = [];
        const grouped = getGroupedArrears(data);

        grouped.forEach(group => {
            const serviceDataRows = group.contracts.reduce(
                (sum, contract) => sum + contract.items.length,
                0
            );

            let serviceInserted = false;

            group.contracts.forEach(contract => {
                contract.items.forEach((item, index) => {
                    const row = [];

                    if (!serviceInserted) {
                        row.push({
                            content: group.service,
                            rowSpan: serviceDataRows,
                            styles: {
                                halign: 'center',
                                valign: 'middle',
                                fontStyle: 'bold',
                            },
                        });
                        serviceInserted = true;
                    }

                    if (index === 0) {
                        row.push({
                            content: contract.number,
                            rowSpan: contract.items.length,
                            styles: {
                                halign: 'center',
                                valign: 'middle',
                                fontStyle: 'bold',
                            },
                        });

                        row.push({
                            content: item.address || '',
                            rowSpan: contract.items.length,
                            styles: {
                                halign: 'center',
                                valign: 'middle',
                            },
                        });
                    }

                    row.push(formatInvoiceNumber(item.invoice));
                    row.push(displayProductMonth(item.product));
                    row.push({
                        content: pdfMoney(item.balance),
                        styles: {
                            halign: 'right',
                            fontStyle: 'bold',
                        },
                    });

                    rows.push(row);
                });
            });

            rows.push([
                {
                    content: `Total ${group.service}`,
                    colSpan: 5,
                    styles: {
                        halign: 'right',
                        fontStyle: 'bold',
                        fillColor: [243, 243, 243],
                    },
                },
                {
                    content: pdfMoney(group.total),
                    styles: {
                        halign: 'right',
                        fontStyle: 'bold',
                        fillColor: [243, 243, 243],
                    },
                },
            ]);
        });

        const grandTotal = data.arrears.reduce(
            (sum, item) => sum + item.balance,
            0
        );

        rows.push([
            {
                content: 'TOTAL GENERAL',
                colSpan: 5,
                styles: {
                    halign: 'center',
                    fontStyle: 'bold',
                    fillColor: [232, 232, 232],
                },
            },
            {
                content: pdfMoney(grandTotal),
                styles: {
                    halign: 'right',
                    fontStyle: 'bold',
                    fillColor: [232, 232, 232],
                },
            },
        ]);

        return rows;
    }

    async function exportPdf() {
        const data = generate();
        if (!data) return;

        const JsPdf = window.jspdf?.jsPDF;

        if (!JsPdf || !JsPdf.API.autoTable) {
            alert(
                "Les bibliothèques PDF ne sont pas disponibles. Rechargez la page puis réessayez."
            );
            return;
        }

        try {
            const pdf = new JsPdf({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true,
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const left = data.margins.left;
            const right = data.margins.right;
            const contentWidth = pageWidth - left - right;

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(13);
            pdf.text(
                [
                    'SRM-FM',
                    'DIRECTION CLIENTELE',
                    'DEPARTEMENT GRANDS COMPTES',
                ],
                left,
                data.margins.top + 4.5,
                {
                    lineHeightFactor: 1.12,
                }
            );

            pdf.setFont('times', 'bold');
            pdf.setFontSize(10);
            pdf.text(
                formatDate(data.date),
                pageWidth - right,
                data.margins.top + 4.5,
                {
                    align: 'right',
                }
            );

            pdf.setFont('times', 'bold');
            pdf.setFontSize(16);
            pdf.text(
                data.title,
                pageWidth / 2,
                data.margins.top + 55,
                {
                    align: 'center',
                }
            );

            const titleWidth = pdf.getTextWidth(data.title);
            pdf.setLineWidth(0.25);
            pdf.line(
                pageWidth / 2 - titleWidth / 2,
                data.margins.top + 56.5,
                pageWidth / 2 + titleWidth / 2,
                data.margins.top + 56.5
            );

            const summaryRows = getSummaryRows(data);

            pdf.autoTable({
                startY: data.margins.top + 75,
                margin: {
                    left,
                    right,
                },
                tableWidth: contentWidth,
                body: summaryRows,
                theme: 'grid',
                styles: {
                    font: 'times',
                    fontSize: 10,
                    cellPadding: 3.2,
                    lineColor: [136, 136, 136],
                    lineWidth: 0.18,
                    valign: 'middle',
                },
                columnStyles: {
                    0: {
                        cellWidth: contentWidth * 0.5,
                        fontStyle: 'bold',
                    },
                    1: {
                        cellWidth: contentWidth * 0.5,
                    },
                },
                didParseCell(hookData) {
                    if (hookData.row.index % 2 === 1) {
                        hookData.cell.styles.fillColor = [243, 243, 243];
                    }
                },
            });

            if (data.includeArrears && data.arrears.length) {
                let arrearsTitleY = pdf.lastAutoTable.finalY + 10;

                if (arrearsTitleY > 270) {
                    pdf.addPage();
                    arrearsTitleY = data.margins.top;
                }

                pdf.setFont('times', 'bold');
                pdf.setFontSize(11);
                pdf.text(
                    'Situation des arriérés :',
                    left,
                    arrearsTitleY
                );

                const underlineWidth = pdf.getTextWidth(
                    'Situation des arriérés :'
                );
                pdf.line(
                    left,
                    arrearsTitleY + 1,
                    left + underlineWidth,
                    arrearsTitleY + 1
                );

                pdf.autoTable({
                    startY: arrearsTitleY + 4,
                    margin: {
                        left,
                        right,
                        bottom: data.margins.bottom,
                    },
                    tableWidth: contentWidth,
                    head: [[
                        'Service',
                        'Contrat',
                        'Adresse',
                        'Numéro Facture',
                        'Produit',
                        'Solde',
                    ]],
                    body: buildPdfArrearsRows(data),
                    theme: 'grid',
                    styles: {
                        font: 'times',
                        fontSize: 8.5,
                        cellPadding: 2.1,
                        lineColor: [136, 136, 136],
                        lineWidth: 0.18,
                        valign: 'middle',
                        overflow: 'linebreak',
                    },
                    headStyles: {
                        fillColor: [222, 222, 222],
                        textColor: [17, 17, 17],
                        fontStyle: 'bold',
                        halign: 'center',
                    },
                    columnStyles: {
                        0: { cellWidth: contentWidth * 0.12 },
                        1: { cellWidth: contentWidth * 0.12 },
                        2: { cellWidth: contentWidth * 0.34 },
                        3: { cellWidth: contentWidth * 0.16 },
                        4: { cellWidth: contentWidth * 0.12 },
                        5: { cellWidth: contentWidth * 0.14 },
                    },
                    rowPageBreak: 'avoid',
                    showHead: 'everyPage',
                });
            }

            pdf.save(safeFilename(data, 'pdf'));
        } catch (error) {
            console.error(error);
            alert(
                error.message ||
                "Une erreur est survenue pendant l'export PDF."
            );
        }
    }

    function createDocxTextCell(
        text,
        options = {}
    ) {
        const {
            bold = false,
            alignment = 'center',
            shading,
            columnSpan,
            verticalMerge,
            width,
            fontSize = 17,
        } = options;

        const alignmentMap = {
            left: docx.AlignmentType.LEFT,
            center: docx.AlignmentType.CENTER,
            right: docx.AlignmentType.RIGHT,
        };

        return new docx.TableCell({
            children: [
                new docx.Paragraph({
                    alignment: alignmentMap[alignment],
                    children: [
                        new docx.TextRun({
                            text: String(text ?? ''),
                            bold,
                            size: fontSize,
                            font: 'Times New Roman',
                        }),
                    ],
                }),
            ],
            verticalAlign: docx.VerticalAlign.CENTER,
            columnSpan,
            verticalMerge,
            width,
            shading: shading
                ? {
                    fill: shading,
                    type: docx.ShadingType.CLEAR,
                }
                : undefined,
            margins: {
                top: 80,
                bottom: 80,
                left: 90,
                right: 90,
            },
            borders: {
                top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 2,
                    color: '888888',
                },
                bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 2,
                    color: '888888',
                },
                left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 2,
                    color: '888888',
                },
                right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 2,
                    color: '888888',
                },
            },
        });
    }

    function buildDocxArrearsRows(data) {
        const rows = [];
        const grouped = getGroupedArrears(data);

        grouped.forEach(group => {
            const serviceDataRows = group.contracts.reduce(
                (sum, contract) => sum + contract.items.length,
                0
            );

            let serviceRowIndex = 0;

            group.contracts.forEach(contract => {
                contract.items.forEach((item, index) => {
                    const cells = [];

                    cells.push(
                        createDocxTextCell(
                            serviceRowIndex === 0
                                ? group.service
                                : '',
                            {
                                bold: true,
                                verticalMerge:
                                    serviceRowIndex === 0
                                        ? docx.VerticalMergeType.RESTART
                                        : docx.VerticalMergeType.CONTINUE,
                                width: {
                                    size: 12,
                                    type: docx.WidthType.PERCENTAGE,
                                },
                            }
                        )
                    );

                    cells.push(
                        createDocxTextCell(
                            index === 0
                                ? contract.number
                                : '',
                            {
                                bold: true,
                                verticalMerge:
                                    index === 0
                                        ? docx.VerticalMergeType.RESTART
                                        : docx.VerticalMergeType.CONTINUE,
                                width: {
                                    size: 12,
                                    type: docx.WidthType.PERCENTAGE,
                                },
                            }
                        )
                    );

                    cells.push(
                        createDocxTextCell(
                            index === 0
                                ? item.address
                                : '',
                            {
                                alignment: 'center',
                                verticalMerge:
                                    index === 0
                                        ? docx.VerticalMergeType.RESTART
                                        : docx.VerticalMergeType.CONTINUE,
                                width: {
                                    size: 34,
                                    type: docx.WidthType.PERCENTAGE,
                                },
                            }
                        )
                    );

                    cells.push(
                        createDocxTextCell(
                            formatInvoiceNumber(item.invoice),
                            {
                                width: {
                                    size: 16,
                                    type: docx.WidthType.PERCENTAGE,
                                },
                            }
                        )
                    );

                    cells.push(
                        createDocxTextCell(
                            displayProductMonth(item.product),
                            {
                                width: {
                                    size: 12,
                                    type: docx.WidthType.PERCENTAGE,
                                },
                            }
                        )
                    );

                    cells.push(
                        createDocxTextCell(
                            money(item.balance),
                            {
                                bold: true,
                                alignment: 'right',
                                width: {
                                    size: 14,
                                    type: docx.WidthType.PERCENTAGE,
                                },
                            }
                        )
                    );

                    rows.push(
                        new docx.TableRow({
                            children: cells,
                            cantSplit: true,
                        })
                    );

                    serviceRowIndex += 1;
                });
            });

            rows.push(
                new docx.TableRow({
                    children: [
                        createDocxTextCell(
                            `Total ${group.service}`,
                            {
                                bold: true,
                                alignment: 'right',
                                shading: 'F3F3F3',
                                columnSpan: 5,
                            }
                        ),
                        createDocxTextCell(
                            money(group.total),
                            {
                                bold: true,
                                alignment: 'right',
                                shading: 'F3F3F3',
                            }
                        ),
                    ],
                    cantSplit: true,
                })
            );
        });

        const grandTotal = data.arrears.reduce(
            (sum, item) => sum + item.balance,
            0
        );

        rows.push(
            new docx.TableRow({
                children: [
                    createDocxTextCell(
                        'TOTAL GENERAL',
                        {
                            bold: true,
                            shading: 'E8E8E8',
                            columnSpan: 5,
                            fontSize: 19,
                        }
                    ),
                    createDocxTextCell(
                        money(grandTotal),
                        {
                            bold: true,
                            alignment: 'right',
                            shading: 'E8E8E8',
                            fontSize: 19,
                        }
                    ),
                ],
                cantSplit: true,
            })
        );

        return rows;
    }

    async function exportDocx() {
        const data = generate();
        if (!data) return;

        if (!window.docx) {
            alert(
                "La bibliothèque DOCX n'est pas disponible. Rechargez la page puis réessayez."
            );
            return;
        }

        try {
            const summaryRows = getSummaryRows(data);
            const children = [];

            const noBorder = {
                style: docx.BorderStyle.NONE,
                size: 0,
                color: 'FFFFFF',
            };

            const borderless = {
                top: noBorder,
                bottom: noBorder,
                left: noBorder,
                right: noBorder,
                insideHorizontal: noBorder,
                insideVertical: noBorder,
            };

            const headerTable = new docx.Table({
                width: {
                    size: 100,
                    type: docx.WidthType.PERCENTAGE,
                },
                layout: docx.TableLayoutType.FIXED,
                borders: borderless,
                rows: [
                    new docx.TableRow({
                        cantSplit: true,
                        children: [
                            new docx.TableCell({
                                width: {
                                    size: 80,
                                    type: docx.WidthType.PERCENTAGE,
                                },
                                verticalAlign: docx.VerticalAlign.CENTER,
                                borders: borderless,
                                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                                children: [
                                    new docx.Paragraph({
                                        spacing: { before: 0, after: 0, line: 250 },
                                        children: [new docx.TextRun({
                                            text: 'SRM-FM', bold: true, font: 'Arial', size: 26,
                                        })],
                                    }),
                                    new docx.Paragraph({
                                        spacing: { before: 0, after: 0, line: 250 },
                                        children: [new docx.TextRun({
                                            text: 'DIRECTION CLIENTELE', bold: true, font: 'Arial', size: 26,
                                        })],
                                    }),
                                    new docx.Paragraph({
                                        spacing: { before: 0, after: 0, line: 250 },
                                        children: [new docx.TextRun({
                                            text: 'DEPARTEMENT GRANDS COMPTES', bold: true, font: 'Arial', size: 24,
                                        })],
                                    }),
                                ],
                            }),
                            new docx.TableCell({
                                width: {
                                    size: 20,
                                    type: docx.WidthType.PERCENTAGE,
                                },
                                verticalAlign: docx.VerticalAlign.TOP,
                                borders: borderless,
                                margins: { top: 0, bottom: 0, left: 40, right: 0 },
                                children: [
                                    new docx.Paragraph({
                                        alignment: docx.AlignmentType.RIGHT,
                                        spacing: { before: 0, after: 0, line: 240 },
                                        children: [new docx.TextRun({
                                            text: formatDate(data.date),
                                            bold: true,
                                            font: 'Times New Roman',
                                            size: 20,
                                        })],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });

            children.push(headerTable);

            children.push(
                new docx.Paragraph({
                    alignment: docx.AlignmentType.CENTER,
                    spacing: {
                        before: 900,
                        after: 720,
                    },
                    children: [
                        new docx.TextRun({
                            text: data.title,
                            bold: true,
                            underline: {},
                            font: 'Times New Roman',
                            size: 30,
                        }),
                    ],
                })
            );

            children.push(
                new docx.Table({
                    width: {
                        size: 100,
                        type: docx.WidthType.PERCENTAGE,
                    },
                    rows: summaryRows.map(([key, value], index) =>
                        new docx.TableRow({
                            children: [
                                createDocxTextCell(key, {
                                    bold: true,
                                    alignment: 'left',
                                    shading:
                                        index % 2 === 1
                                            ? 'F3F3F3'
                                            : undefined,
                                    width: {
                                        size: 50,
                                        type: docx.WidthType.PERCENTAGE,
                                    },
                                    fontSize: 20,
                                }),
                                createDocxTextCell(value, {
                                    alignment: 'left',
                                    shading:
                                        index % 2 === 1
                                            ? 'F3F3F3'
                                            : undefined,
                                    width: {
                                        size: 50,
                                        type: docx.WidthType.PERCENTAGE,
                                    },
                                    fontSize: 20,
                                }),
                            ],
                            cantSplit: true,
                        })
                    ),
                })
            );

            if (data.includeArrears && data.arrears.length) {
                children.push(
                    new docx.Paragraph({
                        spacing: {
                            before: 360,
                            after: 120,
                        },
                        children: [
                            new docx.TextRun({
                                text: 'Situation des arriérés :',
                                bold: true,
                                underline: {},
                                font: 'Times New Roman',
                                size: 22,
                            }),
                        ],
                    })
                );

                const headerCells = [
                    ['Service', 12],
                    ['Contrat', 12],
                    ['Adresse', 34],
                    ['Numéro Facture', 16],
                    ['Produit', 12],
                    ['Solde', 14],
                ].map(([label, width]) =>
                    createDocxTextCell(label, {
                        bold: true,
                        shading: 'DEDEDE',
                        width: {
                            size: width,
                            type: docx.WidthType.PERCENTAGE,
                        },
                    })
                );

                children.push(
                    new docx.Table({
                        width: {
                            size: 100,
                            type: docx.WidthType.PERCENTAGE,
                        },
                        rows: [
                            new docx.TableRow({
                                children: headerCells,
                                tableHeader: true,
                                cantSplit: true,
                            }),
                            ...buildDocxArrearsRows(data),
                        ],
                    })
                );
            }

            const wordDocument = new docx.Document({
                sections: [
                    {
                        properties: {
                            page: {
                                size: {
                                    width: 11906,
                                    height: 16838,
                                },
                                margin: {
                                    top: Math.round(
                                        data.margins.top * 56.6929
                                    ),
                                    right: Math.round(
                                        data.margins.right * 56.6929
                                    ),
                                    bottom: Math.round(
                                        data.margins.bottom * 56.6929
                                    ),
                                    left: Math.round(
                                        data.margins.left * 56.6929
                                    ),
                                },
                            },
                        },
                        children,
                    },
                ],
            });

            const blob = await docx.Packer.toBlob(wordDocument);
            const url = URL.createObjectURL(blob);
            const link = window.document.createElement('a');

            link.href = url;
            link.download = safeFilename(data, 'docx');
            window.document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(url), 1500);
        } catch (error) {
            console.error(error);
            alert(
                error.message ||
                "Une erreur est survenue pendant l'export DOCX."
            );
        }
    }

    $('addContractBtn').addEventListener('click', () => addContract());
    $('addMetaBtn').addEventListener('click', () => addMeta());
    $('addArrearBtn').addEventListener('click', () => addArrear());

    $('includeArrears').addEventListener('change', () => {
        $('arrearsPanel').classList.toggle('hidden', !$('includeArrears').checked);

        if ($('includeArrears').checked && !arrearsRows.querySelector('.arrear-row')) {
            addArrear();
        }
    });

    $('manualModeBtn').addEventListener('click', () => setInputMode('manual'));
    $('excelModeBtn').addEventListener('click', () => setInputMode('excel'));
    $('importExcelBtn').addEventListener('click', importExcel);

    $('clearExcelBtn').addEventListener('click', () => {
        $('excelPaste').value = '';
        $('excelStatus').textContent = '';
    });

    $('generateBtn').addEventListener('click', generate);
    $('exportPdfBtn').addEventListener('click', exportPdf);
    $('exportDocxBtn').addEventListener('click', exportDocx);

    ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(id => {
        $(id).addEventListener('input', () => {
            if (currentData) {
                currentData.margins = getMargins();
                renderPreview(currentData);
            }
        });
    });

    $('documentDate').value = localIso(new Date());

    addContract();
    setInputMode('manual');
