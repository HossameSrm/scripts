/**
 * MVC Controller: PaymentScheduleController
 * Contrôle le formulaire, les calculs, le rendu document et les exports.
 */
window.SRM.Controllers.PaymentScheduleController = { module: 'PaymentScheduleController' };
const $ = (id) => document.getElementById(id);

        const clientsContainer = $('clientsContainer');
        const clientTemplate = $('clientTemplate');
        const contractTemplate = $('contractTemplate');

        const holderType = $('holderType');
        const personName = $('personName');
        const personCin = $('personCin');
        const personPhone = $('personPhone');
        const representedBy = $('representedBy');
        const representedWrapper = $('representedWrapper');
        const nameLabel = $('nameLabel');

        const advanceMode = $('advanceMode');
        const advancePercentage = $('advancePercentage');
        const advanceFixedAmount = $('advanceFixedAmount');
        const advancePercentageWrapper = $('advancePercentageWrapper');
        const advanceAmountWrapper = $('advanceAmountWrapper');
        const advanceModeHelp = $('advanceModeHelp');

        const installmentsCount = $('installmentsCount');
        const advanceDate = $('advanceDate');
        const intervalMode = $('intervalMode');
        const intervalDays = $('intervalDays');
        const fixedIntervalWrapper = $('fixedIntervalWrapper');
        const customIntervalsWrapper = $('customIntervalsWrapper');
        const customIntervalsContainer = $('customIntervalsContainer');
        const roundingMode = $('roundingMode');

        const marginTop = $('marginTop');
        const marginRight = $('marginRight');
        const marginBottom = $('marginBottom');
        const marginLeft = $('marginLeft');
        const resetMarginsBtn = $('resetMarginsBtn');

        const newRecordBtn = $('newRecordBtn');
        const saveHistoryBtn = $('saveHistoryBtn');
        const historySearch = $('historySearch');
        const historyCount = $('historyCount');
        const historyEmpty = $('historyEmpty');
        const historyList = $('historyList');

        const HISTORY_STORAGE_KEY = 'engagement-echeancier-history-v1';
        const HISTORY_MAX_ITEMS = 250;

        let currentData = null;
        let editingHistoryId = null;

        const infoLabels = {
            clients: 'N° de client',
            name: 'Nom / Raison sociale',
            cin: 'CIN',
            represented: 'Représentée par',
            phone: 'Téléphone',
        };

        let infoOrder = ['clients', 'name', 'cin', 'represented', 'phone'];

        function localIso(date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        function addDays(date, days) {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        }

        function money(value, currency = true) {
            const text = new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(Number(value) || 0);

            return currency ? `${text} MAD` : text;
        }

        function dateFr(value) {
            return new Intl.DateTimeFormat('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(new Date(`${value}T12:00:00`));
        }

        function esc(value) {
            return String(value ?? '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }

        function clampNumber(value, min, max, fallback) {
            const parsed = Number(value);
            if (!Number.isFinite(parsed)) return fallback;
            return Math.min(max, Math.max(min, parsed));
        }

        function parseMoneyValue(value) {
            let normalized = String(value ?? '')
                .trim()
                .replace(/[\s\u00A0\u202F]/g, '');

            if (!normalized) return NaN;

            const hasComma = normalized.includes(',');
            const hasDot = normalized.includes('.');

            if (hasComma && hasDot) {
                if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
                    normalized = normalized.replaceAll('.', '').replace(',', '.');
                } else {
                    normalized = normalized.replaceAll(',', '');
                }
            } else if (hasComma) {
                normalized = normalized.replace(',', '.');
            }

            const parsed = Number(normalized);
            return Number.isFinite(parsed) ? parsed : NaN;
        }

        function formatPercentage(value) {
            return new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
            }).format(Number(value) || 0);
        }

        function getPageMargins() {
            return {
                top: clampNumber(marginTop.value, 0, 50, 14),
                right: clampNumber(marginRight.value, 0, 50, 11),
                bottom: clampNumber(marginBottom.value, 0, 50, 12),
                left: clampNumber(marginLeft.value, 0, 50, 11),
            };
        }

        function applyMarginsToElement(element, margins) {
            element.style.setProperty('--page-margin-top', `${margins.top}mm`);
            element.style.setProperty('--page-margin-right', `${margins.right}mm`);
            element.style.setProperty('--page-margin-bottom', `${margins.bottom}mm`);
            element.style.setProperty('--page-margin-left', `${margins.left}mm`);
        }

        function millimetersToTwips(value) {
            return Math.round(Number(value) * 56.6929133858);
        }

        function millimetersToPoints(value) {
            return (Number(value) * 72 / 25.4).toFixed(2);
        }

        function removeAllIds(element) {
            element.removeAttribute('id');
            element.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        }

        async function ensureJsZipLoaded() {
            if (window.JSZip && typeof window.JSZip === 'function') {
                return true;
            }

            const sources = [
                'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
            ];

            for (const source of sources) {
                try {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = source;
                        script.async = true;
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });

                    if (window.JSZip && typeof window.JSZip === 'function') {
                        return true;
                    }
                } catch (error) {
                    console.warn('Échec du chargement du moteur DOCX natif :', source, error);
                }
            }

            return false;
        }

        function addContract(card, values = {}, triggerCalculation = true) {
            const fragment = contractTemplate.content.cloneNode(true);
            const row = fragment.querySelector('.contract-row');

            row.querySelector('.contract-number').value = values.contractNumber ?? '';
            row.querySelector('.contract-service').value = values.service
                ?? 'Factures de consommation Eau Potable Assainissement';
            row.querySelector('.contract-amount').value = values.amount ?? '';

            row.querySelector('.remove-contract').addEventListener('click', () => {
                row.remove();
                if (!card.querySelector('.contract-row')) addContract(card);
                scheduleAutoCalculate();
            });

            card.querySelector('.contracts-container').appendChild(fragment);
            if (triggerCalculation) scheduleAutoCalculate();
            return row;
        }

        function addClient(values = {}, triggerCalculation = true) {
            const fragment = clientTemplate.content.cloneNode(true);
            const card = fragment.querySelector('.client-card');

            card.querySelector('.client-number').value = values.clientNumber ?? '';
            card.querySelector('.add-contract').addEventListener('click', () => addContract(card));
            card.querySelector('.remove-client').addEventListener('click', () => {
                card.remove();
                if (!clientsContainer.querySelector('.client-card')) addClient();
                scheduleAutoCalculate();
            });

            clientsContainer.appendChild(card);

            const contracts = Array.isArray(values.contracts) && values.contracts.length
                ? values.contracts
                : [{}];
            contracts.forEach(contract => addContract(card, contract, false));

            if (triggerCalculation) scheduleAutoCalculate();
            return card;
        }

        function splitRemainingAmount(remainingCents, count, mode) {
            if (mode === 'last' || mode === 'advance') {
                const base = Math.floor(remainingCents / count / 100) * 100;
                const installments = Array(count).fill(base);
                installments[count - 1] = remainingCents - base * (count - 1);
                return installments;
            }

            const base = Math.floor(remainingCents / count);
            const remainder = remainingCents - base * count;
            const installments = Array(count).fill(base);

            for (let i = 0; i < remainder; i += 1) {
                installments[i % count] += 1;
            }

            return installments;
        }

        function createPaymentPlan(totalCents, advanceValueCents, count, mode, preserveExactAdvance = false) {
            const theoreticalAdvance = Math.min(totalCents, Math.max(0, Math.round(advanceValueCents)));

            if (preserveExactAdvance) {
                const advance = theoreticalAdvance;
                const remaining = totalCents - advance;

                return {
                    advance,
                    installments: splitRemainingAmount(remaining, count, mode),
                };
            }

            if (mode === 'advance') {
                const theoreticalRemaining = totalCents - theoreticalAdvance;
                const installment = Math.floor(theoreticalRemaining / count / 100) * 100;
                const installmentsTotal = installment * count;
                const advance = totalCents - installmentsTotal;

                return {
                    advance,
                    installments: Array(count).fill(installment),
                };
            }

            if (mode === 'installments') {
                const advance = Math.floor(theoreticalAdvance / 100) * 100;
                const remaining = totalCents - advance;

                return {
                    advance,
                    installments: splitRemainingAmount(remaining, count, 'installments'),
                };
            }

            if (mode === 'last') {
                const advance = Math.floor(theoreticalAdvance / 100) * 100;
                const remaining = totalCents - advance;

                return {
                    advance,
                    installments: splitRemainingAmount(remaining, count, 'last'),
                };
            }

            const advance = theoreticalAdvance;
            const remaining = totalCents - advance;

            return {
                advance,
                installments: splitRemainingAmount(remaining, count, 'all'),
            };
        }

        function readCustomIntervalValues() {
            return Array.from(customIntervalsContainer.querySelectorAll('.custom-interval-days'))
                .map(input => Math.min(365, Math.max(1, Math.round(Number(input.value || 15)))));
        }

        function updateCustomIntervalDates() {
            const startDate = advanceDate.value;
            const rows = customIntervalsContainer.querySelectorAll('.custom-interval-row');

            if (!startDate) {
                rows.forEach(row => {
                    row.querySelector('.custom-interval-date').textContent = 'Date à calculer';
                });
                return;
            }

            let currentDate = new Date(`${startDate}T12:00:00`);

            rows.forEach(row => {
                const input = row.querySelector('.custom-interval-days');
                const days = Math.min(365, Math.max(1, Math.round(Number(input.value || 15))));
                currentDate = addDays(currentDate, days);
                row.querySelector('.custom-interval-date').textContent = dateFr(localIso(currentDate));
            });
        }

        function renderCustomIntervals(preferredValues = null) {
            const count = Math.min(24, Math.max(1, Math.round(Number(installmentsCount.value || 2))));
            const oldValues = Array.isArray(preferredValues)
                ? preferredValues
                : readCustomIntervalValues();
            const defaultDays = Math.min(365, Math.max(1, Math.round(Number(intervalDays.value || 15))));

            customIntervalsContainer.innerHTML = '';

            for (let index = 0; index < count; index += 1) {
                const value = oldValues[index] ?? oldValues[oldValues.length - 1] ?? defaultDays;
                const row = document.createElement('div');
                row.className = 'custom-interval-row grid gap-3 rounded-xl border border-blue-100 bg-white p-3 sm:grid-cols-[1fr_140px_130px] sm:items-center';
                row.innerHTML = `
                    <div>
                        <p class="text-sm font-black text-slate-800">Avant l'échéance ${index + 1}</p>
                        <p class="text-xs text-slate-500">Depuis le paiement précédent</p>
                    </div>
                    <div class="relative">
                        <input type="number" min="1" max="365" value="${value}"
                            class="custom-interval-days w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-14 text-center font-black outline-none">
                        <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">jours</span>
                    </div>
                    <div class="custom-interval-date rounded-xl bg-slate-100 px-3 py-2.5 text-center text-xs font-black text-slate-600">
                        Date à calculer
                    </div>
                `;

                row.querySelector('.custom-interval-days').addEventListener('input', () => {
                    updateCustomIntervalDates();
                    scheduleAutoCalculate();
                });
                customIntervalsContainer.appendChild(row);
            }

            updateCustomIntervalDates();
        }

        function updateAdvanceModeUi() {
            const isExactAmount = advanceMode.value === 'amount';
            advancePercentageWrapper.classList.toggle('hidden', isExactAmount);
            advanceAmountWrapper.classList.toggle('hidden', !isExactAmount);
            advanceModeHelp.textContent = isExactAmount
                ? "L'avance restera exactement égale au montant saisi. Le solde sera réparti entre les échéances."
                : "Le montant de l'avance sera calculé selon le pourcentage saisi.";

            const advanceRoundingOption = roundingMode.querySelector('option[value="advance"]');
            if (advanceRoundingOption) {
                advanceRoundingOption.disabled = isExactAmount;
            }

            if (isExactAmount && roundingMode.value === 'advance') {
                roundingMode.value = 'last';
            }
        }

        function updateIntervalModeUi(preferredIntervals = null) {
            const isCustom = intervalMode.value === 'custom';
            fixedIntervalWrapper.classList.toggle('hidden', isCustom);
            customIntervalsWrapper.classList.toggle('hidden', !isCustom);

            if (isCustom) renderCustomIntervals(preferredIntervals);
        }

        function updateHolderTypeUi(clearRepresented = false) {
            const isPerson = holderType.value === 'person';
            nameLabel.textContent = isPerson ? 'Nom complet' : 'Raison sociale';
            representedWrapper.classList.toggle('hidden', !isPerson);
            if (!isPerson && clearRepresented) representedBy.value = '';
        }

        function readHistory() {
            try {
                const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.error('Lecture historique impossible :', error);
                return [];
            }
        }

        function writeHistory(records) {
            try {
                localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records.slice(0, HISTORY_MAX_ITEMS)));
                return true;
            } catch (error) {
                console.error('Enregistrement historique impossible :', error);
                alert("L'historique n'a pas pu être enregistré. Le stockage local du navigateur est peut-être plein ou désactivé.");
                return false;
            }
        }

        function createHistoryId() {
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                return window.crypto.randomUUID();
            }
            return `history-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }

        function serializeFormState() {
            return {
                holderType: holderType.value,
                personName: personName.value,
                personCin: personCin.value,
                personPhone: personPhone.value,
                representedBy: representedBy.value,
                advanceMode: advanceMode.value,
                advancePercentage: advancePercentage.value,
                advanceFixedAmount: advanceFixedAmount.value,
                installmentsCount: installmentsCount.value,
                advanceDate: advanceDate.value,
                intervalMode: intervalMode.value,
                intervalDays: intervalDays.value,
                customIntervals: readCustomIntervalValues(),
                roundingMode: roundingMode.value,
                margins: getPageMargins(),
                infoOrder: [...infoOrder],
                clients: Array.from(clientsContainer.querySelectorAll('.client-card')).map(card => ({
                    clientNumber: card.querySelector('.client-number').value,
                    contracts: Array.from(card.querySelectorAll('.contract-row')).map(row => ({
                        contractNumber: row.querySelector('.contract-number').value,
                        service: row.querySelector('.contract-service').value,
                        amount: row.querySelector('.contract-amount').value,
                    })),
                })),
            };
        }

        function restoreFormState(state = {}) {
            holderType.value = state.holderType === 'company' ? 'company' : 'person';
            personName.value = state.personName ?? '';
            personCin.value = state.personCin ?? '';
            personPhone.value = state.personPhone ?? '';
            representedBy.value = state.representedBy ?? '';

            advanceMode.value = state.advanceMode === 'amount' ? 'amount' : 'percentage';
            advancePercentage.value = state.advancePercentage ?? 50;
            advanceFixedAmount.value = state.advanceFixedAmount ?? '';
            installmentsCount.value = state.installmentsCount ?? 2;
            advanceDate.value = state.advanceDate || localIso(new Date());
            intervalMode.value = state.intervalMode === 'custom' ? 'custom' : 'fixed';
            intervalDays.value = state.intervalDays ?? 15;
            roundingMode.value = state.roundingMode ?? 'advance';

            const margins = state.margins || {};
            marginTop.value = margins.top ?? 38;
            marginRight.value = margins.right ?? 11;
            marginBottom.value = margins.bottom ?? 12;
            marginLeft.value = margins.left ?? 11;

            const allowedOrder = Object.keys(infoLabels);
            infoOrder = Array.isArray(state.infoOrder)
                ? state.infoOrder.filter(key => allowedOrder.includes(key))
                : [...allowedOrder];
            allowedOrder.forEach(key => {
                if (!infoOrder.includes(key)) infoOrder.push(key);
            });

            clientsContainer.innerHTML = '';
            const clients = Array.isArray(state.clients) && state.clients.length ? state.clients : [{}];
            clients.forEach(client => addClient(client, false));

            updateHolderTypeUi(false);
            updateAdvanceModeUi();
            updateIntervalModeUi(state.customIntervals);
            renderOrder();
            scheduleAutoCalculate();
        }

        function updateHistoryEditingUi() {
            if (editingHistoryId) {
                saveHistoryBtn.textContent = 'Mettre à jour';
                saveHistoryBtn.className = 'rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white hover:bg-amber-600';
            } else {
                saveHistoryBtn.textContent = 'Enregistrer';
                saveHistoryBtn.className = 'rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700';
            }
        }

        function historyDisplayDate(value) {
            if (!value) return '-';
            return new Intl.DateTimeFormat('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            }).format(new Date(value));
        }

        function renderHistory() {
            const query = historySearch.value.trim().toLowerCase();
            const allRecords = readHistory().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            const records = allRecords.filter(record => {
                if (!query) return true;
                const summary = record.summary || {};
                const state = record.state || {};
                const contractNumbers = (state.clients || [])
                    .flatMap(client => (client.contracts || []).map(contract => contract.contractNumber))
                    .join(' ');
                const haystack = [summary.name, summary.clients, contractNumbers, summary.total, summary.startDate]
                    .join(' ')
                    .toLowerCase();
                return haystack.includes(query);
            });

            historyCount.textContent = `${allRecords.length} enregistrement${allRecords.length > 1 ? 's' : ''}`;
            historyEmpty.classList.toggle('hidden', records.length > 0);
            historyList.classList.toggle('hidden', records.length === 0);

            historyList.innerHTML = records.map(record => {
                const summary = record.summary || {};
                const isEditing = record.id === editingHistoryId;
                return `
                    <article class="rounded-[24px] border ${isEditing ? 'border-amber-300 bg-amber-50/70' : 'border-white/80 bg-white/75'} p-5 shadow-sm" data-history-id="${esc(record.id)}">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <p class="truncate text-lg font-black text-slate-900">${esc(summary.name || 'Sans nom')}</p>
                                <p class="mt-1 text-xs font-semibold text-slate-500">Modifié le ${esc(historyDisplayDate(record.updatedAt))}</p>
                            </div>
                            ${isEditing ? '<span class="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700">En modification</span>' : ''}
                        </div>
                        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div class="rounded-xl bg-slate-50 p-3">
                                <p class="text-[11px] font-bold uppercase text-slate-400">Total</p>
                                <p class="mt-1 font-black text-slate-800">${esc(money(summary.total || 0))}</p>
                            </div>
                            <div class="rounded-xl bg-emerald-50 p-3">
                                <p class="text-[11px] font-bold uppercase text-emerald-600">Avance</p>
                                <p class="mt-1 font-black text-emerald-700">${esc(money(summary.advance || 0))}</p>
                            </div>
                        </div>
                        <div class="mt-3 space-y-1 text-xs font-semibold text-slate-500">
                            <p>Client(s) : <span class="text-slate-700">${esc(summary.clients || '-')}</span></p>
                            <p>Date d'avance : <span class="text-slate-700">${summary.startDate ? esc(dateFr(summary.startDate)) : '-'}</span></p>
                            <p>${Number(summary.contractCount || 0)} contrat(s) - ${Number(summary.installmentCount || 0)} échéance(s)</p>
                        </div>
                        <div class="mt-5 flex gap-2">
                            <button class="history-edit flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-black text-white hover:bg-slate-800" data-id="${esc(record.id)}" type="button">Ouvrir / modifier</button>
                            <button class="history-delete rounded-xl bg-red-50 px-3 py-2.5 text-sm font-black text-red-600 hover:bg-red-100" data-id="${esc(record.id)}" type="button">Supprimer</button>
                        </div>
                    </article>
                `;
            }).join('');
        }

        function saveCurrentToHistory() {
            const data = calculate();
            if (!data) return;

            const now = new Date().toISOString();
            const records = readHistory();
            const existingIndex = editingHistoryId
                ? records.findIndex(record => record.id === editingHistoryId)
                : -1;

            const previous = existingIndex >= 0 ? records[existingIndex] : null;
            const record = {
                id: previous?.id || createHistoryId(),
                createdAt: previous?.createdAt || now,
                updatedAt: now,
                state: serializeFormState(),
                summary: {
                    name: data.name,
                    clients: data.clients.map(client => client.clientNumber).join(', '),
                    contractCount: data.contracts.length,
                    installmentCount: data.count,
                    total: data.total,
                    advance: data.advance,
                    remaining: data.remaining,
                    startDate: data.startDate,
                },
            };

            if (existingIndex >= 0) {
                records.splice(existingIndex, 1);
            }
            records.unshift(record);

            if (!writeHistory(records)) return;

            editingHistoryId = record.id;
            updateHistoryEditingUi();
            renderHistory();
            $('statusBadge').textContent = existingIndex >= 0 ? 'Historique mis à jour' : 'Enregistré dans l’historique';
            $('statusBadge').className = 'rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700';
        }

        function openHistoryRecord(id) {
            const record = readHistory().find(item => item.id === id);
            if (!record) {
                alert("Cet enregistrement n'existe plus dans l'historique.");
                renderHistory();
                return;
            }

            editingHistoryId = record.id;
            restoreFormState(record.state || {});
            updateHistoryEditingUi();
            renderHistory();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function deleteHistoryRecord(id) {
            const record = readHistory().find(item => item.id === id);
            if (!record) return;

            const label = record.summary?.name || 'cet enregistrement';
            if (!window.confirm(`Supprimer définitivement l'historique de « ${label} » ?`)) return;

            const records = readHistory().filter(item => item.id !== id);
            if (!writeHistory(records)) return;

            if (editingHistoryId === id) {
                startNewRecord(false);
            }
            renderHistory();
        }

        function startNewRecord(shouldScroll = true) {
            editingHistoryId = null;
            restoreFormState({
                holderType: 'person',
                advanceMode: 'percentage',
                advancePercentage: 50,
                installmentsCount: 2,
                advanceDate: localIso(new Date()),
                intervalMode: 'fixed',
                intervalDays: 15,
                roundingMode: 'advance',
                margins: { top: 38, right: 11, bottom: 12, left: 11 },
                infoOrder: ['clients', 'name', 'cin', 'represented', 'phone'],
                clients: [{}],
            });
            updateHistoryEditingUi();
            renderHistory();
            if (shouldScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function collectData() {
            const name = personName.value.trim();
            const cin = personCin.value.trim().toUpperCase();
            const phone = personPhone.value.trim();
            const represented = representedBy.value.trim();
            const startDate = advanceDate.value;

            const selectedAdvanceMode = advanceMode.value;
            const percentage = Math.min(100, Math.max(0, Number(advancePercentage.value || 50)));
            const count = Math.min(24, Math.max(1, Math.round(Number(installmentsCount.value || 2))));
            const interval = Math.min(365, Math.max(1, Math.round(Number(intervalDays.value || 15))));

            const clients = [];
            const contracts = [];

            clientsContainer.querySelectorAll('.client-card').forEach((card) => {
                const clientNumber = card.querySelector('.client-number').value.trim();
                const clientContracts = [];

                card.querySelectorAll('.contract-row').forEach((row) => {
                    const contractNumber = row.querySelector('.contract-number').value.trim();
                    const service = row.querySelector('.contract-service').value;
                    const amount = Number(row.querySelector('.contract-amount').value || 0);

                    if (contractNumber && amount > 0) {
                        const contract = {
                            clientNumber,
                            contractNumber,
                            service,
                            amount: Math.round(amount * 100) / 100,
                        };
                        clientContracts.push(contract);
                        contracts.push(contract);
                    }
                });

                if (clientNumber && clientContracts.length) {
                    clients.push({ clientNumber, contracts: clientContracts });
                }
            });

            if (!name || !startDate || !contracts.length) return null;

            const totalCents = contracts.reduce((sum, item) => sum + Math.round(item.amount * 100), 0);
            const exactAdvanceAmount = parseMoneyValue(advanceFixedAmount.value);

            if (selectedAdvanceMode === 'amount') {
                if (!Number.isFinite(exactAdvanceAmount) || exactAdvanceAmount < 0) {
                    throw new Error("Saisissez un montant d'avance exact valide.");
                }

                if (Math.round(exactAdvanceAmount * 100) > totalCents) {
                    throw new Error("Le montant exact de l'avance ne peut pas dépasser le total des factures.");
                }
            }

            const requestedAdvanceCents = selectedAdvanceMode === 'amount'
                ? Math.round(exactAdvanceAmount * 100)
                : Math.round(totalCents * percentage / 100);

            const plan = createPaymentPlan(
                totalCents,
                requestedAdvanceCents,
                count,
                roundingMode.value,
                selectedAdvanceMode === 'amount'
            );

            const customIntervals = intervalMode.value === 'custom'
                ? readCustomIntervalValues()
                : Array(count).fill(interval);

            const schedule = [{
                number: '',
                type: 'Avance',
                date: startDate,
                amount: plan.advance / 100,
            }];

            let previousPaymentDate = new Date(`${startDate}T12:00:00`);

            plan.installments.forEach((amount, index) => {
                previousPaymentDate = addDays(previousPaymentDate, customIntervals[index]);

                schedule.push({
                    number: index + 1,
                    type: `Échéance ${index + 1}`,
                    date: localIso(previousPaymentDate),
                    intervalDays: customIntervals[index],
                    amount: amount / 100,
                });
            });

            const calculatedTotal = plan.advance + plan.installments.reduce((a, b) => a + b, 0);
            if (calculatedTotal !== totalCents) {
                throw new Error('Erreur interne de répartition des centimes.');
            }

            return {
                holderType: holderType.value,
                name,
                cin,
                phone,
                represented,
                clients,
                contracts,
                advanceMode: selectedAdvanceMode,
                percentage: totalCents > 0 ? (plan.advance / totalCents) * 100 : 0,
                requestedPercentage: percentage,
                count,
                intervalMode: intervalMode.value,
                interval,
                intervals: customIntervals,
                startDate,
                total: totalCents / 100,
                advance: plan.advance / 100,
                remaining: (totalCents - plan.advance) / 100,
                margins: getPageMargins(),
                schedule,
            };
        }

        function buildDocument(data) {
            applyMarginsToElement($('pdfDocument'), data.margins || getPageMargins());

            const infoValues = {
                clients: data.clients.length
                    ? `N° de client : ${data.clients.map(c => c.clientNumber).join(', ')}`
                    : '',
                name: data.name,
                cin: data.cin ? `CIN : ${data.cin}` : '',
                represented: data.represented ? `Représentée par : ${data.represented}` : '',
                phone: data.phone,
            };

            $('pdfClientBox').innerHTML = infoOrder
                .filter(key => infoValues[key])
                .map(key => `<div>${esc(infoValues[key])}</div>`)
                .join('');

            $('pdfContractsBody').innerHTML =
                data.contracts.map(item => `
                    <tr>
                        <td>${esc(item.contractNumber)}</td>
                        <td>${esc(item.service)}</td>
                        <td style="text-align:right;font-weight:700">${money(item.amount, false)}</td>
                    </tr>
                `).join('') +
                `
                    <tr class="pdf-total-row">
                        <td></td>
                        <td style="font-weight:800;">Total</td>
                        <td style="text-align:right;font-weight:800;">${money(data.total, false)}</td>
                    </tr>
                `;

            $('pdfScheduleBody').innerHTML =
                data.schedule.map(item => `
                    <tr>
                        <td style="text-align:center">${item.type === 'Avance' ? '-' : item.number}</td>
                        <td style="text-align:center">
                            ${item.type === 'Avance' ? `Avance<br>${dateFr(item.date)}` : dateFr(item.date)}
                        </td>
                        <td style="text-align:right;font-weight:700">${money(item.amount, false)}</td>
                    </tr>
                `).join('') +
                `
                    <tr class="pdf-total-row">
                        <td></td>
                        <td style="text-align:center;font-weight:800;">Total</td>
                        <td style="text-align:right;font-weight:800;">${money(data.total, false)}</td>
                    </tr>
                `;
        }

        function renderSummary(data) {
            $('totalInvoices').textContent = money(data.total);
            $('advanceAmount').textContent = money(data.advance);
            $('remainingAmount').textContent = money(data.remaining);

            advanceModeHelp.textContent = data.advanceMode === 'amount'
                ? `Avance exacte conservée : ${money(data.advance)} — équivalent à ${formatPercentage(data.percentage)} % du total.`
                : `Avance calculée : ${money(data.advance)} — taux effectif ${formatPercentage(data.percentage)} % après répartition.`;

            $('contractsPreviewBody').innerHTML = data.contracts.map(item => `
                <tr class="border-t border-slate-100">
                    <td class="px-4 py-3 text-sm font-bold">${esc(item.clientNumber)}</td>
                    <td class="px-4 py-3 text-sm font-bold">${esc(item.contractNumber)}</td>
                    <td class="px-4 py-3 text-sm">${esc(item.service)}</td>
                    <td class="px-4 py-3 text-right text-sm font-black">${money(item.amount)}</td>
                </tr>
            `).join('');

            $('schedulePreviewBody').innerHTML = data.schedule.map(item => `
                <tr class="border-t border-slate-100">
                    <td class="px-4 py-3 text-sm font-bold">${item.number}</td>
                    <td class="px-4 py-3 text-sm">${dateFr(item.date)}</td>
                    <td class="px-4 py-3 text-sm font-semibold">${esc(item.type)}</td>
                    <td class="px-4 py-3 text-right text-sm font-black">${money(item.amount)}</td>
                </tr>
            `).join('');

            $('statusBadge').textContent = 'Calcul terminé';
            $('statusBadge').className = 'rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600';
        }

        function renderPaper(data) {
            buildDocument(data);

            const source = $('pdfDocument');
            const clone = source.cloneNode(true);

            removeAllIds(clone);
            clone.classList.remove('hidden');
            applyMarginsToElement(clone, data.margins || getPageMargins());

            $('paperPreviewHost').innerHTML = '';
            $('paperPreviewHost').appendChild(clone);
        }

        function resetAutomaticPreview(message = 'En attente') {
            currentData = null;
            $('totalInvoices').textContent = money(0);
            $('advanceAmount').textContent = money(0);
            $('remainingAmount').textContent = money(0);
            $('contractsPreviewBody').innerHTML = `
                <tr><td colspan="4" class="px-4 py-10 text-center text-sm text-slate-400">Complétez les informations du contrat.</td></tr>
            `;
            $('schedulePreviewBody').innerHTML = `
                <tr><td colspan="4" class="px-4 py-10 text-center text-sm text-slate-400">L'échéancier apparaîtra automatiquement.</td></tr>
            `;
            $('paperPreviewHost').innerHTML = `
                <div class="flex min-h-[420px] min-w-[320px] items-center justify-center rounded-2xl bg-white px-6 text-center text-sm font-semibold text-slate-400">
                    Complétez le nom, la date, le client, le contrat et le montant pour afficher le document.
                </div>
            `;
            $('statusBadge').textContent = message;
            $('statusBadge').className = 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500';
        }

        function calculate(options = {}) {
            const { silent = false } = options;

            try {
                const data = collectData();

                if (!data) {
                    if (silent) {
                        resetAutomaticPreview();
                    } else {
                        alert('Renseignez au minimum le nom, la date, un client et un contrat valide.');
                    }
                    return null;
                }

                currentData = data;
                renderSummary(data);
                renderPaper(data);

                const preview = $('paperPreviewHost');
                preview.classList.remove('auto-refresh-pulse');
                void preview.offsetWidth;
                preview.classList.add('auto-refresh-pulse');

                return data;
            } catch (error) {
                console.error(error);
                if (silent) {
                    resetAutomaticPreview('Données à vérifier');
                } else {
                    alert(error.message || 'Erreur de calcul.');
                }
                return null;
            }
        }

        let autoCalculateTimer = null;

        function scheduleAutoCalculate() {
            window.clearTimeout(autoCalculateTimer);
            autoCalculateTimer = window.setTimeout(() => {
                calculate({ silent: true });
            }, 220);
        }

        function renderOrder() {
            $('infoOrderList').innerHTML = '';

            infoOrder.forEach((key, index) => {
                const item = document.createElement('div');
                item.className = 'order-item';
                item.innerHTML = `
                    <span class="text-sm font-bold">${index + 1}. ${infoLabels[key]}</span>
                    <div class="flex gap-2">
                        <button type="button" class="order-btn" data-key="${key}" data-dir="up" ${index === 0 ? 'disabled' : ''}>↑</button>
                        <button type="button" class="order-btn" data-key="${key}" data-dir="down" ${index === infoOrder.length - 1 ? 'disabled' : ''}>↓</button>
                    </div>
                `;
                $('infoOrderList').appendChild(item);
            });

            $('infoOrderList').querySelectorAll('button').forEach(button => {
                button.addEventListener('click', () => {
                    const index = infoOrder.indexOf(button.dataset.key);
                    const target = button.dataset.dir === 'up' ? index - 1 : index + 1;
                    if (target < 0 || target >= infoOrder.length) return;

                    [infoOrder[index], infoOrder[target]] = [infoOrder[target], infoOrder[index]];
                    renderOrder();
                    if (currentData) renderPaper(currentData);
                });
            });
        }

        function safeFilename(data, extension) {
            const base = data.name
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .toLowerCase() || 'client';

            return `engagement-echeancier-${base}.${extension}`;
        }

        async function exportPdf() {
            const data = calculate();
            if (!data) return;

            buildDocument(data);
            const element = $('pdfDocument');
            element.classList.remove('hidden');

            try {
                await html2pdf().set({
                    margin: 0,
                    filename: safeFilename(data, 'pdf'),
                    image: { type: 'jpeg', quality: .98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        scrollX: 0,
                        scrollY: 0,
                    },
                    jsPDF: {
                        unit: 'mm',
                        format: 'a4',
                        orientation: 'portrait',
                    },
                    pagebreak: { mode: ['css', 'legacy'] },
                }).from(element).save();
            } finally {
                element.classList.add('hidden');
            }
        }

        function wordXmlEscape(value) {
            return String(value ?? '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&apos;');
        }

        function wordRun(text, options = {}) {
            const {
                bold = false,
                size = 19,
                rtl = false,
                font = 'Arial',
                lang = rtl ? 'ar-MA' : 'fr-FR',
            } = options;

            return `
                <w:r>
                    <w:rPr>
                        <w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:eastAsia="${font}" w:cs="${font}"/>
                        ${bold ? '<w:b/>' : ''}
                        ${rtl ? '<w:rtl/>' : ''}
                        <w:sz w:val="${size}"/>
                        <w:szCs w:val="${size}"/>
                        <w:lang w:val="${lang}" w:bidi="${rtl ? lang : 'ar-MA'}"/>
                    </w:rPr>
                    <w:t xml:space="preserve">${wordXmlEscape(text)}</w:t>
                </w:r>
            `;
        }

        function wordParagraph(text = '', options = {}) {
            const {
                align = 'left',
                bold = false,
                size = 19,
                rtl = false,
                font = 'Arial',
                before = 0,
                after = 0,
                line = 240,
                lineRule = 'auto',
                keepNext = false,
            } = options;

            return `
                <w:p>
                    <w:pPr>
                        <w:jc w:val="${align}"/>
                        ${rtl ? '<w:bidi/>' : ''}
                        ${keepNext ? '<w:keepNext/>' : ''}
                        <w:spacing w:before="${before}" w:after="${after}" w:line="${line}" w:lineRule="${lineRule}"/>
                    </w:pPr>
                    ${wordRun(text || ' ', { bold, size, rtl, font })}
                </w:p>
            `;
        }

        function wordSpacer(heightTwips) {
            return wordParagraph(' ', {
                size: 2,
                line: Math.max(1, Math.round(heightTwips)),
                lineRule: 'exact',
            });
        }

        function wordCell(content, width, options = {}) {
            const {
                shade = '',
                borders = true,
                vertical = 'center',
                margins = { top: 70, right: 70, bottom: 70, left: 70 },
            } = options;

            const borderXml = borders
                ? `
                    <w:tcBorders>
                        <w:top w:val="single" w:sz="4" w:color="555555"/>
                        <w:left w:val="single" w:sz="4" w:color="555555"/>
                        <w:bottom w:val="single" w:sz="4" w:color="555555"/>
                        <w:right w:val="single" w:sz="4" w:color="555555"/>
                    </w:tcBorders>
                `
                : `
                    <w:tcBorders>
                        <w:top w:val="nil"/>
                        <w:left w:val="nil"/>
                        <w:bottom w:val="nil"/>
                        <w:right w:val="nil"/>
                    </w:tcBorders>
                `;

            return `
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="${Math.round(width)}" w:type="dxa"/>
                        ${borderXml}
                        ${shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>` : ''}
                        <w:vAlign w:val="${vertical}"/>
                        <w:tcMar>
                            <w:top w:w="${margins.top}" w:type="dxa"/>
                            <w:left w:w="${margins.left}" w:type="dxa"/>
                            <w:bottom w:w="${margins.bottom}" w:type="dxa"/>
                            <w:right w:w="${margins.right}" w:type="dxa"/>
                        </w:tcMar>
                    </w:tcPr>
                    ${content}
                </w:tc>
            `;
        }

        function wordRow(cells, height = 0, exact = false) {
            return `
                <w:tr>
                    <w:trPr>
                        <w:cantSplit/>
                        ${height ? `<w:trHeight w:val="${height}" w:hRule="${exact ? 'exact' : 'atLeast'}"/>` : ''}
                    </w:trPr>
                    ${cells.join('')}
                </w:tr>
            `;
        }

        function wordTable(rows, widths, options = {}) {
            const {
                width = widths.reduce((sum, value) => sum + value, 0),
                borders = false,
                align = 'left',
                cellSpacing = 0,
            } = options;

            const tableBorders = borders
                ? `
                    <w:tblBorders>
                        <w:top w:val="single" w:sz="4" w:color="555555"/>
                        <w:left w:val="single" w:sz="4" w:color="555555"/>
                        <w:bottom w:val="single" w:sz="4" w:color="555555"/>
                        <w:right w:val="single" w:sz="4" w:color="555555"/>
                        <w:insideH w:val="single" w:sz="4" w:color="555555"/>
                        <w:insideV w:val="single" w:sz="4" w:color="555555"/>
                    </w:tblBorders>
                `
                : '';

            return `
                <w:tbl>
                    <w:tblPr>
                        <w:tblW w:w="${Math.round(width)}" w:type="dxa"/>
                        <w:jc w:val="${align}"/>
                        <w:tblLayout w:type="fixed"/>
                        ${cellSpacing ? `<w:tblCellSpacing w:w="${cellSpacing}" w:type="dxa"/>` : ''}
                        ${tableBorders}
                        <w:tblCellMar>
                            <w:top w:w="0" w:type="dxa"/>
                            <w:left w:w="0" w:type="dxa"/>
                            <w:bottom w:w="0" w:type="dxa"/>
                            <w:right w:w="0" w:type="dxa"/>
                        </w:tblCellMar>
                    </w:tblPr>
                    <w:tblGrid>
                        ${widths.map(value => `<w:gridCol w:w="${Math.round(value)}"/>`).join('')}
                    </w:tblGrid>
                    ${rows.join('')}
                </w:tbl>
            `;
        }

        function wordDataParagraph(text, options = {}) {
            return wordParagraph(text, {
                size: options.size ?? 15,
                bold: options.bold ?? false,
                align: options.align ?? 'left',
                line: options.line ?? 190,
                before: 0,
                after: 0,
            });
        }

        function buildNativeWordDocumentXml(data) {
            const pageWidth = 11906;
            const pageHeight = 16838;
            const margins = data.margins || getPageMargins();
            const marginTopTwips = millimetersToTwips(margins.top);
            const marginRightTwips = millimetersToTwips(margins.right);
            const marginBottomTwips = millimetersToTwips(margins.bottom);
            const marginLeftTwips = millimetersToTwips(margins.left);
            const contentWidth = pageWidth - marginLeftTwips - marginRightTwips;

            const infoValues = {
                clients: data.clients.length
                    ? `N° de client : ${data.clients.map(client => client.clientNumber).join(', ')}`
                    : '',
                name: data.name,
                cin: data.cin ? `CIN : ${data.cin}` : '',
                represented: data.represented ? `Représentée par : ${data.represented}` : '',
                phone: data.phone,
            };

            const titleArabic = 'التزام بأداء دين بالتقسيط';
            const titleFrench = 'ENGAGEMENT SUR ÉCHÉANCIER DE PAIEMENT';
            const arabicParagraphs = [
                'أنا الموقّع أسفله، أصرّح بأنني مدين للشركة الجهوية متعددة الخدمات فاس-مكناس بالمبلغ المبيّن أسفله، وألتزم بأدائه بشبابيك الشركة وفق جدول التقسيط أدناه.',
                'في حالة التأخر عن أداء أي قسط، تصبح جميع الأقساط المتبقية مستحقة الأداء فورًا، مع احتفاظ الشركة بحق تعليق التزويد بالماء والكهرباء دون إشعار مسبق في جميع المحلات موضوع عقود الاشتراك المسجلة باسمي.',
                'كما ألتزم بأداء جميع الفواتير الجديدة داخل الآجال المعمول بها.',
            ];
            const frenchParagraphs = [
                'Je soussigné(e), déclare être redevable envers la SRM-FM de la somme indiquée ci-dessous, que je m’engage à régler aux guichets de la SRM-FM conformément à l’échéancier ci-dessous.',
                'En cas de retard dans le paiement de l’une des échéances, toutes les échéances restantes deviennent immédiatement exigibles. La SRM-FM se réserve également le droit de suspendre, sans autre préavis, la fourniture d’eau et d’électricité dans tous les locaux faisant l’objet de contrats d’abonnement enregistrés en mon nom.',
                'En outre, je m’engage à régler toutes les nouvelles factures dans les délais en vigueur.',
            ];

            const infoWidth = Math.round(contentWidth * 0.48);
            const infoBlankWidth = contentWidth - infoWidth;
            const infoContent = infoOrder
                .filter(key => infoValues[key])
                .map(key => wordParagraph(infoValues[key], {
                    bold: true,
                    size: 17,
                    align: 'left',
                    line: 250,
                    before: 0,
                    after: 0,
                }))
                .join('');

            const clientTable = wordTable([
                wordRow([
                    wordCell(wordParagraph(' ', { size: 2 }), infoBlankWidth, {
                        borders: false,
                        margins: { top: 0, right: 0, bottom: 0, left: 0 },
                        vertical: 'top',
                    }),
                    wordCell(infoContent, infoWidth, {
                        borders: false,
                        margins: { top: 0, right: 0, bottom: 0, left: 0 },
                        vertical: 'top',
                    }),
                ]),
            ], [infoBlankWidth, infoWidth], { width: contentWidth, borders: false });

            const commitmentContent = [
                ...arabicParagraphs.map((text, index) => wordParagraph(text, {
                    rtl: true,
                    font: 'Arial',
                    bold: true,
                    size: 17,
                    align: 'right',
                    line: 280,
                    before: index ? 20 : 0,
                    after: 0,
                })),
                wordSpacer(70),
                ...frenchParagraphs.map((text, index) => wordParagraph(text, {
                    bold: false,
                    size: 16,
                    align: 'left',
                    line: 230,
                    before: index ? 20 : 0,
                    after: 0,
                })),
            ].join('');

            const commitmentTable = wordTable([
                wordRow([
                    wordCell(commitmentContent, contentWidth, {
                        borders: true,
                        vertical: 'top',
                        margins: { top: 120, right: 140, bottom: 120, left: 140 },
                    }),
                ]),
            ], [contentWidth], { width: contentWidth, borders: true });

            const leftWidth = Math.round(contentWidth * 0.61);
            const gapWidth = Math.max(80, Math.round(contentWidth * 0.01));
            const rightWidth = contentWidth - leftWidth - gapWidth;

            const contractColumns = [
                Math.round(leftWidth * 0.18),
                Math.round(leftWidth * 0.57),
                leftWidth - Math.round(leftWidth * 0.18) - Math.round(leftWidth * 0.57),
            ];

            const contractRows = [
                wordRow([
                    wordCell(wordDataParagraph('N° contrat', { bold: true, align: 'center' }), contractColumns[0], { shade: 'D9D9D9' }),
                    wordCell(wordDataParagraph('Nature / Service', { bold: true, align: 'center' }), contractColumns[1], { shade: 'D9D9D9' }),
                    wordCell(wordDataParagraph('Montant facture', { bold: true, align: 'center' }), contractColumns[2], { shade: 'D9D9D9' }),
                ], 360, true),
                ...data.contracts.map(item => wordRow([
                    wordCell(wordDataParagraph(item.contractNumber), contractColumns[0]),
                    wordCell(wordDataParagraph(item.service), contractColumns[1]),
                    wordCell(wordDataParagraph(money(item.amount, false), { bold: true, align: 'right' }), contractColumns[2]),
                ], 430, false)),
                wordRow([
                    wordCell(wordDataParagraph(' '), contractColumns[0]),
                    wordCell(wordDataParagraph('Total', { bold: true }), contractColumns[1]),
                    wordCell(wordDataParagraph(money(data.total, false), { bold: true, align: 'right' }), contractColumns[2]),
                ], 360, true),
            ];
            const contractTable = wordTable(contractRows, contractColumns, {
                width: leftWidth,
                borders: true,
            });

            const scheduleColumns = [
                Math.round(rightWidth * 0.15),
                Math.round(rightWidth * 0.43),
                rightWidth - Math.round(rightWidth * 0.15) - Math.round(rightWidth * 0.43),
            ];

            const scheduleRows = [
                wordRow([
                    wordCell(wordDataParagraph('N°', { bold: true, align: 'center' }), scheduleColumns[0], { shade: 'D9D9D9' }),
                    wordCell(wordDataParagraph('Date échéance', { bold: true, align: 'center' }), scheduleColumns[1], { shade: 'D9D9D9' }),
                    wordCell(wordDataParagraph('Montant échéance', { bold: true, align: 'center' }), scheduleColumns[2], { shade: 'D9D9D9' }),
                ], 360, true),
                ...data.schedule.map(item => {
                    const dateContent = item.type === 'Avance'
                        ? wordDataParagraph('Avance', { align: 'center' })
                            + wordDataParagraph(dateFr(item.date), { align: 'center' })
                        : wordDataParagraph(dateFr(item.date), { align: 'center' });

                    return wordRow([
                        wordCell(wordDataParagraph(item.type === 'Avance' ? '-' : item.number, { align: 'center' }), scheduleColumns[0]),
                        wordCell(dateContent, scheduleColumns[1]),
                        wordCell(wordDataParagraph(money(item.amount, false), { bold: true, align: 'right' }), scheduleColumns[2]),
                    ], item.type === 'Avance' ? 520 : 410, false);
                }),
                wordRow([
                    wordCell(wordDataParagraph(' '), scheduleColumns[0]),
                    wordCell(wordDataParagraph('Total', { bold: true, align: 'center' }), scheduleColumns[1]),
                    wordCell(wordDataParagraph(money(data.total, false), { bold: true, align: 'right' }), scheduleColumns[2]),
                ], 360, true),
            ];
            const scheduleTable = wordTable(scheduleRows, scheduleColumns, {
                width: rightWidth,
                borders: true,
            });

            const tablesLayout = wordTable([
                wordRow([
                    wordCell(contractTable + wordParagraph(' ', { size: 2 }), leftWidth, {
                        borders: false,
                        vertical: 'top',
                        margins: { top: 0, right: 0, bottom: 0, left: 0 },
                    }),
                    wordCell(wordParagraph(' ', { size: 2 }), gapWidth, {
                        borders: false,
                        vertical: 'top',
                        margins: { top: 0, right: 0, bottom: 0, left: 0 },
                    }),
                    wordCell(scheduleTable + wordParagraph(' ', { size: 2 }), rightWidth, {
                        borders: false,
                        vertical: 'top',
                        margins: { top: 0, right: 0, bottom: 0, left: 0 },
                    }),
                ]),
            ], [leftWidth, gapWidth, rightWidth], {
                width: contentWidth,
                borders: false,
            });

            const signatureLeftWidth = Math.round(contentWidth / 2);
            const signatureRightWidth = contentWidth - signatureLeftWidth;
            const signatureTable = wordTable([
                wordRow([
                    wordCell(wordParagraph('Signature SRM-FM', {
                        bold: true,
                        size: 17,
                        align: 'left',
                        line: 240,
                    }), signatureLeftWidth, {
                        borders: true,
                        vertical: 'top',
                        margins: { top: 160, right: 200, bottom: 120, left: 200 },
                    }),
                    wordCell(wordParagraph('Signature du client', {
                        bold: true,
                        size: 17,
                        align: 'center',
                        line: 240,
                    }), signatureRightWidth, {
                        borders: true,
                        vertical: 'top',
                        margins: { top: 160, right: 200, bottom: 120, left: 200 },
                    }),
                ], millimetersToTwips(45), true),
            ], [signatureLeftWidth, signatureRightWidth], {
                width: contentWidth,
                borders: true,
            });

            const bodyContent = [
                wordParagraph(titleArabic, {
                    rtl: true,
                    font: 'Arial',
                    bold: true,
                    size: 28,
                    align: 'center',
                    line: 360,
                    after: 40,
                    keepNext: true,
                }),
                wordParagraph(titleFrench, {
                    bold: true,
                    size: 26,
                    align: 'center',
                    line: 320,
                    keepNext: true,
                }),
                wordSpacer(millimetersToTwips(15)),
                clientTable,
                wordSpacer(millimetersToTwips(20)),
                commitmentTable,
                wordSpacer(millimetersToTwips(6)),
                tablesLayout,
                wordSpacer(220),
                signatureTable,
            ].join('');

            return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                            xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
                            mc:Ignorable="w14">
                    <w:body>
                        ${bodyContent}
                        <w:sectPr>
                            <w:pgSz w:w="${pageWidth}" w:h="${pageHeight}" w:orient="portrait"/>
                            <w:pgMar w:top="${marginTopTwips}" w:right="${marginRightTwips}" w:bottom="${marginBottomTwips}" w:left="${marginLeftTwips}" w:header="0" w:footer="0" w:gutter="0"/>
                            <w:cols w:space="708"/>
                            <w:docGrid w:linePitch="360"/>
                        </w:sectPr>
                    </w:body>
                </w:document>`;
        }

        function nativeWordStylesXml() {
            return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:docDefaults>
                        <w:rPrDefault>
                            <w:rPr>
                                <w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>
                                <w:sz w:val="19"/>
                                <w:szCs w:val="19"/>
                                <w:lang w:val="fr-FR" w:bidi="ar-MA"/>
                            </w:rPr>
                        </w:rPrDefault>
                        <w:pPrDefault>
                            <w:pPr>
                                <w:spacing w:after="0" w:line="240" w:lineRule="auto"/>
                            </w:pPr>
                        </w:pPrDefault>
                    </w:docDefaults>
                    <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
                        <w:name w:val="Normal"/>
                        <w:qFormat/>
                    </w:style>
                    <w:style w:type="table" w:default="1" w:styleId="TableNormal">
                        <w:name w:val="Table Normal"/>
                        <w:tblPr>
                            <w:tblCellMar>
                                <w:top w:w="0" w:type="dxa"/>
                                <w:left w:w="0" w:type="dxa"/>
                                <w:bottom w:w="0" w:type="dxa"/>
                                <w:right w:w="0" w:type="dxa"/>
                            </w:tblCellMar>
                        </w:tblPr>
                    </w:style>
                </w:styles>`;
        }

        function nativeWordSettingsXml() {
            return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:zoom w:percent="100"/>
                    <w:defaultTabStop w:val="720"/>
                    <w:characterSpacingControl w:val="doNotCompress"/>
                    <w:themeFontLang w:val="fr-FR" w:eastAsia="fr-FR" w:bidi="ar-MA"/>
                    <w:compat>
                        <w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
                    </w:compat>
                </w:settings>`;
        }

        async function createNativeWordBlob(data) {
            const zip = new window.JSZip();
            const now = new Date().toISOString();

            zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                    <Default Extension="xml" ContentType="application/xml"/>
                    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
                    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
                    <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
                    <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
                    <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
                </Types>`);

            zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
                    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
                    <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
                </Relationships>`);

            zip.folder('word').file('document.xml', buildNativeWordDocumentXml(data));
            zip.folder('word').file('styles.xml', nativeWordStylesXml());
            zip.folder('word').file('settings.xml', nativeWordSettingsXml());
            zip.folder('word').folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
                    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
                </Relationships>`);

            zip.folder('docProps').file('core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                                   xmlns:dcterms="http://purl.org/dc/terms/"
                                   xmlns:dcmitype="http://purl.org/dc/dcmitype/"
                                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                    <dc:title>Engagement sur échéancier de paiement</dc:title>
                    <dc:creator>Hossame El Bezzari</dc:creator>
                    <cp:lastModifiedBy>Hossame El Bezzari</cp:lastModifiedBy>
                    <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
                    <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
                </cp:coreProperties>`);

            zip.folder('docProps').file('app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
                            xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
                    <Application>Microsoft Office Word</Application>
                    <DocSecurity>0</DocSecurity>
                    <ScaleCrop>false</ScaleCrop>
                    <Company>SRM-FM</Company>
                    <LinksUpToDate>false</LinksUpToDate>
                    <SharedDoc>false</SharedDoc>
                    <HyperlinksChanged>false</HyperlinksChanged>
                    <AppVersion>16.0000</AppVersion>
                </Properties>`);

            return zip.generateAsync({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 },
            });
        }

        async function exportDocx() {
            const data = calculate();
            if (!data) return;

            const docxReady = await ensureJsZipLoaded();
            if (!docxReady) {
                alert("Le moteur DOCX natif n’a pas pu être chargé. Vérifiez la connexion Internet puis rechargez la page.");
                return;
            }

            try {
                const blob = await createNativeWordBlob(data);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = safeFilename(data, 'docx');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 1500);
            } catch (error) {
                console.error('Erreur export DOCX natif :', error);
                alert("Une erreur est survenue pendant la génération du document Word.");
            }
        }

        holderType.addEventListener('change', () => {
            updateHolderTypeUi(true);
            scheduleAutoCalculate();
        });

        advanceMode.addEventListener('change', () => {
            if (advanceMode.value === 'amount' && !advanceFixedAmount.value.trim() && currentData) {
                advanceFixedAmount.value = money(currentData.advance, false);
            }
            updateAdvanceModeUi();
            scheduleAutoCalculate();
        });

        intervalMode.addEventListener('change', () => {
            updateIntervalModeUi();
            scheduleAutoCalculate();
        });
        installmentsCount.addEventListener('input', () => {
            if (intervalMode.value === 'custom') renderCustomIntervals();
            scheduleAutoCalculate();
        });
        intervalDays.addEventListener('input', () => {
            if (intervalMode.value === 'custom' && !customIntervalsContainer.children.length) {
                renderCustomIntervals();
            }
            scheduleAutoCalculate();
        });
        advanceDate.addEventListener('change', () => {
            updateCustomIntervalDates();
            scheduleAutoCalculate();
        });

        [marginTop, marginRight, marginBottom, marginLeft].forEach(input => {
            input.addEventListener('input', scheduleAutoCalculate);
        });

        resetMarginsBtn.addEventListener('click', () => {
            marginTop.value = 38;
            marginRight.value = 11;
            marginBottom.value = 12;
            marginLeft.value = 11;

            scheduleAutoCalculate();
        });

        $('addClientBtn').addEventListener('click', () => addClient());
        newRecordBtn.addEventListener('click', () => startNewRecord(true));
        saveHistoryBtn.addEventListener('click', saveCurrentToHistory);
        $('exportPdfBtn').addEventListener('click', exportPdf);
        $('exportDocxBtn').addEventListener('click', exportDocx);

        historySearch.addEventListener('input', renderHistory);
        historyList.addEventListener('click', (event) => {
            const editButton = event.target.closest('.history-edit');
            const deleteButton = event.target.closest('.history-delete');

            if (editButton) openHistoryRecord(editButton.dataset.id);
            if (deleteButton) deleteHistoryRecord(deleteButton.dataset.id);
        });

        // Toute saisie dans les formulaires actualise automatiquement le résumé et le document.
        document.addEventListener('input', (event) => {
            if (event.target.matches('input, textarea')) {
                scheduleAutoCalculate();
            }
        });

        document.addEventListener('change', (event) => {
            if (event.target.matches('select, input[type="date"], input[type="checkbox"], input[type="radio"]')) {
                scheduleAutoCalculate();
            }
        });

        advanceDate.value = localIso(new Date());
        updateHolderTypeUi(false);
        updateAdvanceModeUi();
        updateIntervalModeUi();
        renderOrder();
        addClient({}, false);
        updateHistoryEditingUi();
        renderHistory();
        resetAutomaticPreview();
        scheduleAutoCalculate();
