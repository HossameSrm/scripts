(function () {
  'use strict';

  function setValue(id, value, eventType = 'input') {
    const field = document.getElementById(id);
    if (!field) return;
    if (field.type === 'checkbox') field.checked = Boolean(value);
    else field.value = value ?? '';
    field.dispatchEvent(new Event(eventType, { bubbles: true }));
  }

  function allArrears(client) {
    return client.contracts.flatMap(contract => (contract.arrears || []).map(item => ({
      service: contract.serviceCode,
      contract: contract.number,
      address: contract.address,
      invoice: item.invoice,
      product: item.product,
      balance: item.balance
    })));
  }

  function fillNotice(client) {
    if (!document.getElementById('recipientName')) return false;
    setValue('recipientName', client.name);
    setValue('recipientAddress', client.address);
    setValue('city', client.city);
    const container = document.getElementById('arrearsRows');
    if (container && typeof window.addRow === 'function') {
      container.innerHTML = '';
      allArrears(client).forEach(item => window.addRow(item));
      if (!container.children.length) window.addRow();
    }
    if (typeof window.generate === 'function') window.generate();
    return true;
  }

  function fillOrder(client) {
    if (!document.getElementById('clientName')) return false;
    setValue('clientName', client.name);
    setValue('tourne', client.tourne);
    const contracts = document.getElementById('contractsList');
    if (contracts && typeof window.addContract === 'function') {
      contracts.innerHTML = '';
      client.contracts.forEach(contract => window.addContract({ selected: true, number: contract.number, address: contract.address }));
    }
    const arrears = allArrears(client);
    setValue('includeArrears', arrears.length > 0, 'change');
    const rows = document.getElementById('arrearsRows');
    if (rows && typeof window.addArrear === 'function') {
      rows.innerHTML = '';
      arrears.forEach(item => window.addArrear(item));
      if (!rows.children.length && document.getElementById('includeArrears')?.checked) window.addArrear();
    }
    if (typeof window.updateSelectedContractsText === 'function') window.updateSelectedContractsText();
    if (typeof window.generate === 'function') window.generate();
    return true;
  }

  function fillSchedule(client) {
    if (!document.getElementById('clientsContainer')) return false;
    setValue('holderType', client.type === 'company' ? 'company' : 'person', 'change');
    setValue('personName', client.name);
    setValue('personCin', client.cin);
    setValue('personPhone', client.phone);
    setValue('representedBy', client.representedBy);
    const clientsContainer = document.getElementById('clientsContainer');
    if (clientsContainer && typeof window.addClient === 'function') {
      clientsContainer.innerHTML = '';
      window.addClient({
        clientNumber: client.clientNumber,
        contracts: client.contracts.map(contract => ({ contractNumber: contract.number, service: contract.serviceLabel, amount: contract.balance }))
      }, false);
    }
    if (typeof window.scheduleAutoCalculate === 'function') window.scheduleAutoCalculate();
    else if (typeof window.calculate === 'function') window.calculate();
    return true;
  }

  function fill(client) {
    fillSchedule(client) || fillOrder(client) || fillNotice(client);
  }

  window.addEventListener('app:client-selected', event => fill(event.detail));
})();
