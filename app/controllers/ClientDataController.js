(function (window) {
  'use strict';
  class ClientDataController {
    constructor(eventBus) { this.eventBus = eventBus; }
    setValue(id, value, eventType = 'input') { const field = document.getElementById(id); if (!field) return; if (field.type === 'checkbox') field.checked = Boolean(value); else field.value = value ?? ''; field.dispatchEvent(new Event(eventType, { bubbles:true })); }
    allArrears(client) { return (client.contracts || []).flatMap(contract => (contract.arrears || []).map(item => ({ service:contract.serviceCode, contract:contract.number, address:contract.address, invoice:item.invoice, product:item.product, balance:Number(item.balance)||0 }))); }
    fillNotice(client) {
      if (!document.getElementById('recipientName')) return false;
      this.setValue('recipientName', client.name); this.setValue('recipientAddress', client.address); this.setValue('city', client.city);
      const container = document.getElementById('arrearsRows'); if (container && typeof window.addRow === 'function') { container.innerHTML=''; this.allArrears(client).forEach(item=>window.addRow(item)); if(!container.children.length)window.addRow(); }
      if(typeof window.generate==='function')window.generate(); return true;
    }
    fillOrder(client) {
      if (!document.getElementById('clientName')) return false;
      this.setValue('clientName',client.name); this.setValue('tourne',client.tourne);
      const contracts=document.getElementById('contractsList'); if(contracts&&typeof window.addContract==='function'){contracts.innerHTML='';(client.contracts||[]).forEach(contract=>window.addContract({selected:true,number:contract.number,address:contract.address}));}
      const arrears=this.allArrears(client); this.setValue('includeArrears',arrears.length>0,'change'); const rows=document.getElementById('arrearsRows'); if(rows&&typeof window.addArrear==='function'){rows.innerHTML='';arrears.forEach(item=>window.addArrear(item));if(!rows.children.length&&document.getElementById('includeArrears')?.checked)window.addArrear();}
      if(typeof window.updateSelectedContractsText==='function')window.updateSelectedContractsText(); if(typeof window.generate==='function')window.generate(); return true;
    }
    fillSchedule(client) {
      if (!document.getElementById('clientsContainer')) return false;
      this.setValue('holderType',client.type==='company'?'company':'person','change'); this.setValue('personName',client.name); this.setValue('personCin',client.cin); this.setValue('personPhone',client.phone); this.setValue('representedBy',client.representedBy);
      const container=document.getElementById('clientsContainer'); if(container&&typeof window.addClient==='function'){container.innerHTML='';window.addClient({clientNumber:client.clientNumber,contracts:(client.contracts||[]).map(contract=>({contractNumber:contract.number,service:contract.serviceLabel,amount:Number(contract.balance)||0}))},false);}
      if(typeof window.scheduleAutoCalculate==='function')window.scheduleAutoCalculate(); else if(typeof window.calculate==='function')window.calculate(); return true;
    }
    fill(client) { this.fillSchedule(client) || this.fillOrder(client) || this.fillNotice(client); }
    init() { this.eventBus.on('app:client-selected', event => this.fill(event.detail)); }
  }
  window.SRM.Controllers.ClientDataController = ClientDataController;
})(window);
