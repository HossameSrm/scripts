(function (window) {
  'use strict';

  window.SRM.Pages?.register('Clients/Index', { layout: 'AppLayout', title: 'Clients', module: 'clients' });

  const SERVICE_LABELS = {
    EAU: 'Factures de consommation Eau Potable Assainissement',
    BT: 'Factures de consommation Electricité Basse Tension',
    MT: 'Factures de consommation Electricité Moyenne Tension'
  };

  class ClientsView {
    constructor() {
      this.clients = [];
      this.selectedId = null;
      this.permissions = {};
      this.handlers = {};
      this.contractSeed = 0;
      this.arrearSeed = 0;
    }

    emptyClient() {
      return {
        id: '', clientNumber: '', type: 'company', name: '', cin: '', phone: '', email: '',
        representedBy: '', address: '', city: 'FES', tourne: '', status: 'active', contracts: []
      };
    }

    bind(handlers) {
      this.handlers = handlers;
      document.getElementById('newClientBtn')?.addEventListener('click', handlers.onCreate);
      document.getElementById('clientSearch')?.addEventListener('input', () => this.applyFilters());
      document.getElementById('clientStatusFilter')?.addEventListener('change', () => this.applyFilters());
      document.getElementById('clientsList')?.addEventListener('click', event => {
        const row = event.target.closest('[data-client-id]');
        if (row) handlers.onSelect(row.dataset.clientId);
      });
      document.getElementById('clientEditor')?.addEventListener('click', event => this.handleEditorClick(event));
      document.getElementById('clientEditor')?.addEventListener('change', event => this.handleEditorChange(event));
      document.getElementById('clientEditor')?.addEventListener('input', event => {
        if (event.target.matches('[data-balance]')) this.refreshTotals();
      });
      document.getElementById('clientEditor')?.addEventListener('submit', event => {
        if (!event.target.matches('#clientForm')) return;
        event.preventDefault();
        const form = event.target;
        if (!form.reportValidity()) return;
        this.handlers.onSave(this.collect()).catch(() => {});
      });
    }

    money(value) {
      return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
    }

    clientTotal(client) {
      return (client.contracts || []).reduce((sum, contract) => sum + Number(contract.balance || (contract.arrears || []).reduce((s, a) => s + Number(a.balance || 0), 0)), 0);
    }

    render(clients, selectedId, permissions) {
      this.clients = clients || [];
      this.selectedId = selectedId;
      this.permissions = permissions || {};
      this.renderList();
      const selected = this.clients.find(item => item.id === this.selectedId);
      this.renderEditor(selected || this.emptyClient(), permissions, !selected);
      document.getElementById('clientsRoot')?.classList.remove('opacity-0');
    }

    renderStats() {
      const contracts = this.clients.reduce((sum, client) => sum + (client.contracts || []).length, 0);
      const arrears = this.clients.reduce((sum, client) => sum + (client.contracts || []).reduce((c, contract) => c + (contract.arrears || []).length, 0), 0);
      const balance = this.clients.reduce((sum, client) => sum + this.clientTotal(client), 0);
      const host = document.getElementById('clientStats');
      if (!host) return;
      host.innerHTML = [
        { label: 'Clients', value: this.clients.length, icon: 'client', tone: 'blue', note: `${this.clients.filter(item => item.status !== 'inactive').length} actifs` },
        { label: 'Contrats', value: contracts, icon: 'contract', tone: 'violet', note: 'EAU, BT et MT' },
        { label: 'Factures impayées', value: arrears, icon: 'invoice', tone: 'amber', note: 'Toutes périodes' },
        { label: 'Solde total', value: `${this.money(balance)} DH`, icon: 'wallet', tone: 'emerald', note: 'Arriérés centralisés' }
      ].map(window.UI.statCard).join('');
    }

    renderList() {
      const host = document.getElementById('clientsList');
      host.innerHTML = this.clients.length ? this.clients.map(client => {
        const contracts = client.contracts || [];
        const services = [...new Set(contracts.map(item => item.serviceCode))];
        return `<button type="button" class="client-list-item ${client.id === this.selectedId ? 'is-selected' : ''}" data-client-id="${client.id}" data-status="${client.status || 'active'}" data-search="${window.UI.esc(`${client.clientNumber} ${client.name} ${client.city} ${client.tourne}`.toLowerCase())}">
          <span class="client-list-avatar">${window.UI.esc(String(client.name || 'C').slice(0, 2).toUpperCase())}</span>
          <span class="min-w-0 flex-1 text-left">
            <span class="client-list-name">${window.UI.esc(client.name)}</span>
            <span class="client-list-meta">N° ${window.UI.esc(client.clientNumber)} · ${window.UI.esc(client.city || '—')}</span>
            <span class="client-list-tags">${services.map(service => `<i>${service}</i>`).join('') || '<i>Aucun contrat</i>'}</span>
          </span>
          <span class="client-list-count"><strong>${contracts.length}</strong><small>contrat(s)</small></span>
        </button>`;
      }).join('') : window.UI.emptyState('Aucun client', 'Créez votre premier client et ajoutez ses contrats.', 'client');
      this.applyFilters();
    }

    applyFilters() {
      const query = String(document.getElementById('clientSearch')?.value || '').trim().toLowerCase();
      const status = document.getElementById('clientStatusFilter')?.value || '';
      document.querySelectorAll('#clientsList [data-client-id]').forEach(item => {
        const visible = (!query || (item.dataset.search || '').includes(query)) && (!status || item.dataset.status === status);
        item.classList.toggle('hidden', !visible);
      });
    }

    markSelected(id) {
      this.selectedId = id;
      document.querySelectorAll('#clientsList [data-client-id]').forEach(item => item.classList.toggle('is-selected', item.dataset.clientId === id));
    }

    renderEditor(client, permissions, isNew = false) {
      const canEdit = isNew ? permissions?.clients?.create : permissions?.clients?.edit;
      const disabled = canEdit ? '' : 'disabled';
      const editor = document.getElementById('clientEditor');
      editor.innerHTML = `
        <form id="clientForm" class="client-workspace" data-client-id="${window.UI.esc(client.id || '')}">
          <header class="client-workspace-header">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="ui-kicker">${isNew ? 'Nouveau dossier client' : 'Dossier client'}</p>
                ${!isNew ? window.UI.badge(client.status === 'inactive' ? 'Inactif' : 'Actif', client.status === 'inactive' ? 'slate' : 'emerald') : ''}
              </div>
              <h2 class="client-workspace-title">${window.UI.esc(client.name || 'Créer un client')}</h2>
              <p class="client-workspace-subtitle">Informations générales, contrats et arriérés dans un seul formulaire.</p>
            </div>
            <div class="client-workspace-actions">
              ${!isNew && permissions?.clients?.create ? `<button type="button" class="ui-btn ui-btn-secondary" data-action="duplicate">${window.UI.icon('copy')} Dupliquer</button>` : ''}
              ${!isNew && permissions?.clients?.delete ? `<button type="button" class="ui-btn ui-btn-danger-soft" data-action="delete-client">${window.UI.icon('trash')} Supprimer</button>` : ''}
              ${canEdit ? `<button type="submit" class="ui-btn ui-btn-primary">${window.UI.icon('check')} ${isNew ? 'Créer le client' : 'Enregistrer'}</button>` : ''}
            </div>
          </header>

          <section id="client-general-section" class="client-section-card">
            <div class="client-section-heading"><span class="client-section-icon">${window.UI.icon('client')}</span><div><h3>Informations générales</h3><p>Références, coordonnées et rattachement commercial du client.</p></div></div>
            <div class="client-form-grid">
              <label><span class="ui-label">Numéro client *</span><input class="ui-input" name="clientNumber" value="${window.UI.esc(client.clientNumber || '')}" required ${disabled}></label>
              <label><span class="ui-label">Statut</span><select class="ui-select" name="status" ${disabled}><option value="active" ${client.status !== 'inactive' ? 'selected' : ''}>Actif</option><option value="inactive" ${client.status === 'inactive' ? 'selected' : ''}>Inactif</option></select></label>
              <label class="md:col-span-2"><span class="ui-label">Nom / Raison sociale *</span><input class="ui-input" name="name" value="${window.UI.esc(client.name || '')}" required ${disabled}></label>
              <label><span class="ui-label">CIN / ICE</span><input class="ui-input" name="cin" value="${window.UI.esc(client.cin || '')}" ${disabled}></label>
              <label><span class="ui-label">Téléphone</span><input class="ui-input" name="phone" value="${window.UI.esc(client.phone || '')}" ${disabled}></label>
              <label><span class="ui-label">E-mail</span><input class="ui-input" type="email" name="email" value="${window.UI.esc(client.email || '')}" ${disabled}></label>
              <label><span class="ui-label">Ville</span><input class="ui-input" name="city" value="${window.UI.esc(client.city || '')}" ${disabled}></label>
              <label><span class="ui-label">Tournée</span><input class="ui-input" name="tourne" value="${window.UI.esc(client.tourne || '')}" ${disabled}></label>
              <label class="md:col-span-2"><span class="ui-label">Adresse</span><textarea class="ui-textarea" name="address" rows="2" ${disabled}>${window.UI.esc(client.address || '')}</textarea></label>
            </div>
          </section>

          <section id="client-contracts-section" class="client-section-card">
            <div class="client-section-heading client-section-heading-actions">
              <div class="flex items-center gap-3"><span class="client-section-icon">${window.UI.icon('contract')}</span><div><h3>Contrats du client</h3><p>Ajoutez autant de contrats EAU, BT ou MT que nécessaire.</p></div></div>
              ${canEdit ? `<button type="button" class="ui-btn ui-btn-secondary" data-action="add-contract">${window.UI.icon('plus')} Ajouter un contrat</button>` : ''}
            </div>
            <div id="contractsEditor" class="contracts-editor">${(client.contracts || []).map((contract, index) => this.contractTemplate(contract, index, canEdit)).join('')}</div>
            <div id="contractsEmpty" class="${(client.contracts || []).length ? 'hidden' : ''}">${window.UI.emptyState('Aucun contrat', 'Ajoutez le premier contrat de ce client.', 'contract')}</div>
          </section>

          <section class="client-summary-strip">
            <div><span>Contrats</span><strong id="editorContractsCount">${(client.contracts || []).length}</strong></div>
            <div><span>Factures impayées</span><strong id="editorArrearsCount">0</strong></div>
            <div><span>Solde total</span><strong id="editorTotalBalance">0,00 DH</strong></div>
          </section>
        </form>`;
      this.refreshTotals();
    }

    contractTemplate(contract = {}, index = 0, canEdit = true) {
      const localKey = contract.id || `new-contract-${++this.contractSeed}`;
      const disabled = canEdit ? '' : 'disabled';
      const arrears = contract.arrears || [];
      return `<article class="contract-editor-card" data-contract-key="${window.UI.esc(localKey)}" data-contract-id="${window.UI.esc(contract.id || '')}">
        <header class="contract-editor-head">
          <div class="contract-number-badge">${String(index + 1).padStart(2, '0')}</div>
          <div class="min-w-0 flex-1"><h4>Contrat <span data-contract-title>${window.UI.esc(contract.number || 'sans numéro')}</span></h4><p>Service, adresse et factures impayées.</p></div>
          <div class="contract-editor-total"><span>Solde</span><strong data-contract-total>0,00 DH</strong></div>
          ${canEdit ? `<button type="button" class="ui-icon-button ui-icon-danger" data-action="remove-contract" title="Supprimer le contrat">${window.UI.icon('trash')}</button>` : ''}
        </header>
        <div class="contract-form-grid">
          <input type="hidden" data-field="id" value="${window.UI.esc(contract.id || '')}">
          <label><span class="ui-label">N° contrat *</span><input class="ui-input" data-field="number" value="${window.UI.esc(contract.number || '')}" required ${disabled}></label>
          <label><span class="ui-label">Service *</span><select class="ui-select" data-field="serviceCode" ${disabled}>${['EAU','BT','MT'].map(code => `<option value="${code}" ${contract.serviceCode === code ? 'selected' : ''}>${code}</option>`).join('')}</select></label>
          <label class="md:col-span-2"><span class="ui-label">Libellé du service</span><input class="ui-input" data-field="serviceLabel" value="${window.UI.esc(contract.serviceLabel || SERVICE_LABELS[contract.serviceCode || 'EAU'])}" ${disabled}></label>
          <label class="md:col-span-2"><span class="ui-label">Adresse du contrat</span><input class="ui-input" data-field="address" value="${window.UI.esc(contract.address || '')}" ${disabled}></label>
          <label><span class="ui-label">Statut</span><select class="ui-select" data-field="status" ${disabled}><option value="active" ${contract.status !== 'inactive' ? 'selected' : ''}>Actif</option><option value="inactive" ${contract.status === 'inactive' ? 'selected' : ''}>Inactif</option></select></label>
        </div>
        <div class="arrears-block">
          <div class="arrears-block-head"><div><h5>Arriérés</h5><p>Factures, produits et soldes.</p></div>${canEdit ? `<button type="button" class="ui-btn ui-btn-light" data-action="add-arrear">${window.UI.icon('plus')} Ajouter une facture</button>` : ''}</div>
          <div class="arrears-table-wrap"><table class="arrears-editor-table"><thead><tr><th>Numéro facture</th><th>Produit</th><th>Solde (DH)</th><th>Statut</th><th></th></tr></thead><tbody data-arrears-body>${arrears.map(arrear => this.arrearTemplate(arrear, canEdit)).join('')}</tbody></table></div>
          <div data-arrears-empty class="${arrears.length ? 'hidden' : ''} arrears-empty">Aucune facture impayée pour ce contrat.</div>
        </div>
      </article>`;
    }

    arrearTemplate(arrear = {}, canEdit = true) {
      const disabled = canEdit ? '' : 'disabled';
      return `<tr data-arrear-key="${window.UI.esc(arrear.id || `new-arrear-${++this.arrearSeed}`)}" data-arrear-id="${window.UI.esc(arrear.id || '')}">
        <td><input type="hidden" data-arrear-field="id" value="${window.UI.esc(arrear.id || '')}"><input class="ui-input ui-input-compact" data-arrear-field="invoice" value="${window.UI.esc(arrear.invoice || '')}" placeholder="Ex. 205445025" required ${disabled}></td>
        <td><input class="ui-input ui-input-compact" data-arrear-field="product" value="${window.UI.esc(arrear.product || '')}" placeholder="MM/YYYY" required ${disabled}></td>
        <td><input class="ui-input ui-input-compact" data-arrear-field="balance" data-balance type="number" min="0" step="0.01" value="${Number(arrear.balance || 0)}" required ${disabled}></td>
        <td><select class="ui-select ui-input-compact" data-arrear-field="status" ${disabled}><option value="unpaid" ${arrear.status !== 'paid' && arrear.status !== 'cancelled' ? 'selected' : ''}>Impayée</option><option value="paid" ${arrear.status === 'paid' ? 'selected' : ''}>Payée</option><option value="cancelled" ${arrear.status === 'cancelled' ? 'selected' : ''}>Annulée</option></select></td>
        <td>${canEdit ? `<button type="button" class="ui-icon-button ui-icon-danger" data-action="remove-arrear">${window.UI.icon('trash')}</button>` : ''}</td>
      </tr>`;
    }

    handleEditorClick(event) {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'add-contract') this.addContract();
      if (action === 'remove-contract') this.removeContract(event.target.closest('[data-contract-key]'));
      if (action === 'add-arrear') this.addArrear(event.target.closest('[data-contract-key]'));
      if (action === 'remove-arrear') this.removeArrear(event.target.closest('tr[data-arrear-key]'));
      if (action === 'delete-client') this.handlers.onDelete(document.getElementById('clientForm')?.dataset.clientId);
      if (action === 'duplicate') this.handlers.onDuplicate(document.getElementById('clientForm')?.dataset.clientId);
    }

    handleEditorChange(event) {
      if (event.target.matches('[data-field="serviceCode"]')) {
        const contract = event.target.closest('[data-contract-key]');
        const label = contract.querySelector('[data-field="serviceLabel"]');
        if (label && (!label.value || Object.values(SERVICE_LABELS).includes(label.value))) label.value = SERVICE_LABELS[event.target.value];
      }
      if (event.target.matches('[data-field="number"]')) {
        event.target.closest('[data-contract-key]')?.querySelector('[data-contract-title]')?.replaceChildren(document.createTextNode(event.target.value || 'sans numéro'));
      }
      this.refreshTotals();
    }

    addContract() {
      const host = document.getElementById('contractsEditor');
      const wrapper = document.createElement('div');
      wrapper.innerHTML = this.contractTemplate({ serviceCode: 'EAU', serviceLabel: SERVICE_LABELS.EAU, status: 'active', arrears: [] }, host.children.length, true);
      host.appendChild(wrapper.firstElementChild);
      document.getElementById('contractsEmpty')?.classList.add('hidden');
      this.refreshTotals();
    }

    removeContract(card) {
      card?.remove();
      this.renumberContracts();
      if (!document.querySelector('#contractsEditor [data-contract-key]')) document.getElementById('contractsEmpty')?.classList.remove('hidden');
      this.refreshTotals();
    }

    addArrear(contract) {
      const body = contract?.querySelector('[data-arrears-body]');
      if (!body) return;
      const wrapper = document.createElement('tbody');
      wrapper.innerHTML = this.arrearTemplate({ status: 'unpaid', balance: 0 }, true);
      body.appendChild(wrapper.firstElementChild);
      contract.querySelector('[data-arrears-empty]')?.classList.add('hidden');
      this.refreshTotals();
    }

    removeArrear(row) {
      const contract = row?.closest('[data-contract-key]');
      row?.remove();
      if (contract && !contract.querySelector('[data-arrears-body] tr')) contract.querySelector('[data-arrears-empty]')?.classList.remove('hidden');
      this.refreshTotals();
    }

    renumberContracts() {
      document.querySelectorAll('#contractsEditor [data-contract-key]').forEach((card, index) => {
        const badge = card.querySelector('.contract-number-badge');
        if (badge) badge.textContent = String(index + 1).padStart(2, '0');
      });
    }

    refreshTotals() {
      let total = 0;
      let arrears = 0;
      document.querySelectorAll('#contractsEditor [data-contract-key]').forEach(contract => {
        let contractTotal = 0;
        contract.querySelectorAll('[data-arrear-field="balance"]').forEach(input => {
          const row = input.closest('tr');
          const status = row?.querySelector('[data-arrear-field="status"]')?.value || 'unpaid';
          if (status === 'unpaid') contractTotal += Number(input.value || 0);
          arrears += 1;
        });
        total += contractTotal;
        const target = contract.querySelector('[data-contract-total]');
        if (target) target.textContent = `${this.money(contractTotal)} DH`;
      });
      const contractCount = document.querySelectorAll('#contractsEditor [data-contract-key]').length;
      if (document.getElementById('editorContractsCount')) document.getElementById('editorContractsCount').textContent = contractCount;
      if (document.getElementById('editorArrearsCount')) document.getElementById('editorArrearsCount').textContent = arrears;
      if (document.getElementById('editorTotalBalance')) document.getElementById('editorTotalBalance').textContent = `${this.money(total)} DH`;
    }

    collect() {
      const form = document.getElementById('clientForm');
      const data = new FormData(form);
      const client = {
        id: form.dataset.clientId || '',
        clientNumber: String(data.get('clientNumber') || '').trim(),
        type: 'company',
        name: String(data.get('name') || '').trim(),
        cin: String(data.get('cin') || '').trim(),
        phone: String(data.get('phone') || '').trim(),
        email: String(data.get('email') || '').trim(),
        representedBy: '',
        address: String(data.get('address') || '').trim(),
        city: String(data.get('city') || '').trim(),
        tourne: String(data.get('tourne') || '').trim(),
        status: data.get('status') || 'active',
        contracts: []
      };
      document.querySelectorAll('#contractsEditor [data-contract-key]').forEach(card => {
        const get = name => card.querySelector(`[data-field="${name}"]`)?.value || '';
        const contract = {
          id: get('id'), number: String(get('number')).trim(), serviceCode: get('serviceCode') || 'EAU',
          serviceLabel: String(get('serviceLabel') || SERVICE_LABELS[get('serviceCode') || 'EAU']).trim(),
          address: String(get('address')).trim(), status: get('status') || 'active', arrears: []
        };
        card.querySelectorAll('[data-arrears-body] tr').forEach(row => {
          const value = name => row.querySelector(`[data-arrear-field="${name}"]`)?.value || '';
          contract.arrears.push({
            id: value('id'), invoice: String(value('invoice')).trim(), product: String(value('product')).trim(),
            balance: Number(value('balance') || 0), status: value('status') || 'unpaid'
          });
        });
        contract.balance = contract.arrears.filter(item => item.status === 'unpaid').reduce((sum, item) => sum + Number(item.balance || 0), 0);
        client.contracts.push(contract);
      });
      return client;
    }

    renderError(message) {
      document.getElementById('clientsList').innerHTML = window.UI.emptyState('Erreur de chargement', message, 'warning');
      document.getElementById('clientEditor').innerHTML = '';
      document.getElementById('clientsRoot')?.classList.remove('opacity-0');
    }
  }

  window.SRM.Views.ClientsView = ClientsView;
})(window);
