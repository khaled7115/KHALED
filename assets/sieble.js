/* Virtual Siebel – navigation + interaction layer.
   The saved pages are static (scripts were stripped), so this file re-creates
   navigation, search and drop-down lists. No server is needed. */
(function () {
  'use strict';

  var P = {
    home: 'index.html',
    accountHome: 'account-home.html',
    serviceAccountList: 'all-sa-list.html',
    serviceAccountDetail: 'all-sa-detail.html',
    customerAccount: 'service-accounts.html',
    serviceRequests: 'sa-service-requests.html',
    charging: 'charging-details.html',
    billing: 'billing-details.html'
  };

  /* ---------- demo data (all fictional) ---------- */
  var MAIN_CONTRACT = '100200301';
  var MAIN_CUSTOMER = '1.100200301';
  var RECORDS = [
    { 'MSISDN': '0125930480', 'Contract ID': '100200301', 'Parent Customer Code': '1.100200301', 'Status': 'Active',
      'Parent Account Type': 'Prepaid', 'Customer Value': 'I', 'Rate Plan': 'Pre Paid_RP', 'Parent Company/Full Name': 'سامى عادل منصور حسن', 'Activation Date': '4/8/2014' },
    { 'MSISDN': '0125930480', 'Contract ID': '100200302', 'Parent Customer Code': '1.100200302', 'Status': 'Deactivated',
      'Parent Account Type': 'Prepaid', 'Customer Value': '', 'Rate Plan': 'Pre Paid_RP', 'Parent Company/Full Name': 'PREPAID_1_1', 'Activation Date': '4/28/2008' },
    { 'MSISDN': '0125930480', 'Contract ID': '100200303', 'Parent Customer Code': '1.100200303', 'Status': 'Deactivated',
      'Parent Account Type': 'Prepaid', 'Customer Value': 'F', 'Rate Plan': 'Pre Paid_RP', 'Parent Company/Full Name': 'كريم فؤاد مصطفى ابراهيم', 'Activation Date': '4/22/2009' }
  ];
  var FIND_FIELDS = ['MSISDN', 'Contract ID', 'Parent Customer Code', 'Activation Date', 'Status',
    'Parent Company/Full Name', 'Parent Account Type', 'Customer Value', 'Rate Plan'];

  var LOV = {
    'Status': ['Active', 'Deactivated', 'Suspended', 'Pending'],
    'Account Class': ['Service', 'Customer'],
    'Account Type': ['Prepaid', 'Postpaid', 'Hybrid'],
    'Account Status Reason': ['activation', 'deactivation', 'suspension', 'reactivation'],
    'First Class': ['Yes', 'No'],
    'Customer Value': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
    'Corporate Sub Category': ['Government', 'Banking', 'Telecom', 'Retail'],
    'Service Type': ['Voice', 'Data', 'Voice & Data'],
    'Migration Codes': ['None', 'MIG01', 'MIG02'],
    'MSISDN Class': ['Standard', 'Silver', 'Gold', 'Platinum'],
    'ID Type': ['National ID', 'Passport', 'Driving License'],
    'Governorate': ['القاهره', 'الجيزه', 'الاسكندريه', 'الشرقيه', 'الدقهليه'],
    'Country': ['Egypt', 'Saudi Arabia', 'United Arab Emirates'],
    'Area': ['مدينة نصر', 'المعادي', 'الدقي', 'التجمع الخامس'],
    'Subscriber Level': ['Subscriber', 'Dealer', 'Reseller'],
    'ADSL Corporate Type': ['Private', 'Public'],
    'ADSL Corporate Employer Type': ['Private', 'Public'],
    'Source Channel': ['Call Center', 'Retail Shop', 'Online', 'Dealer'],
    'Billing Market': ['Cairo', 'Alexandria', 'Delta', 'Upper Egypt'],
    'Category': ['Gold', 'Silver', 'Bronze'],
    'Group': ['Consumer', 'Corporate', 'VIP'],
    'Rate Plan': ['Pre Paid_RP', 'FREEmax 37', 'Orange Life', 'Postpaid_RP']
  };

  /* ---------- helpers ---------- */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'sieble-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
  }
  function unavailable(what) { toast((what ? '"' + what + '" – ' : '') + 'not available in this demo.'); }
  function here() { return location.pathname.split('/').pop() || 'index.html'; }
  function go(page) { if (here() !== page) { location.href = page; } }
  function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function fieldLabel(input) { return input ? (input.getAttribute('aria-label') || input.title || input.name || '') : ''; }
  function setValue(input, v) {
    input.value = v;
    ['input', 'change'].forEach(function (n) { input.dispatchEvent(new Event(n, { bubbles: true })); });
  }

  /* ---------- view-bar navigation (levels 1-4) ---------- */
  function navigate(level, label) {
    var map = {
      'First Level View Bar': { 'Home': P.home, 'Accounts': P.accountHome },
      'Second Level View Bar': {
        'Accounts Home': P.accountHome,
        'Customer Accounts List': P.customerAccount,
        'Service Account List': P.serviceAccountList
      },
      'Third Level View Bar': {
        'Service Requests': P.serviceRequests,
        'Billing Details': P.billing,
        'Charging Details': P.charging,
        'Service Accounts': P.customerAccount
      },
      'Fourth Level View Bar': { 'Account Information': P.charging, 'Supplementary Services': P.billing }
    };
    var target = map[level] && map[level][label];
    if (target) { go(target); } else { unavailable(label); }
  }

  /* ---------- search ---------- */
  function norm(field, v) {
    v = String(v || '').trim().toLowerCase();
    if (field === 'MSISDN') { v = v.replace(/\s+/g, '').replace(/^0+/, ''); }
    return v;
  }
  function matches(rec, field, value) {
    if (!(field in rec)) { return false; }
    var want = norm(field, value), have = norm(field, rec[field]);
    if (want.indexOf('*') !== -1) {
      var re = new RegExp('^' + want.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*'));
      return re.test(have);
    }
    return have.indexOf(want) === 0;   // "Starting with"
  }
  function criteria() {
    var list = [];
    var find = document.querySelector('input[aria-label="Find"]');
    var val = document.querySelector('input[aria-label="Starting with"]');
    if (find && val && val.value.trim()) { list.push([find.value.trim() || 'MSISDN', val.value]); }
    if (!list.length) {      // query-mode form fields
      var inputs = document.querySelectorAll('input[type=text]');
      for (var i = 0; i < inputs.length; i++) {
        var f = fieldLabel(inputs[i]);
        if (inputs[i].value.trim() && inputs[i].offsetParent && f !== 'Find' && f !== 'Starting with' && f !== 'Query' && !inputs[i].closest('#s_tb')) {
          list.push([f, inputs[i].value]);
        }
      }
    }
    return list;
  }
  function runQuery() {
    var c = criteria();
    if (!c.length) { toast('Enter a value to search (try MSISDN 0125930480).'); return; }
    var ok = RECORDS.some(function (r) {
      return c.every(function (x) { return matches(r, x[0], x[1]); });
    });
    if (ok) { go(P.serviceAccountDetail); }
    else { toast('No records found. Try MSISDN 0125930480.'); }
  }

  /* ---------- pop-up lists (the little arrows) ---------- */
  var menu;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function openMenu(icon, input, items, current) {
    closeMenu();
    menu = document.createElement('ul');
    menu.className = 'sieble-menu';
    items.forEach(function (it) {
      var li = document.createElement('li');
      li.textContent = it;
      if (it === current) { li.className = 'sel'; }
      li.addEventListener('mousedown', function (ev) {
        ev.preventDefault();
        if (input) { setValue(input, it); }
        closeMenu();
      });
      menu.appendChild(li);
    });
    document.body.appendChild(menu);
    var r = (input || icon).getBoundingClientRect(), ir = icon.getBoundingClientRect();
    var left = Math.min(r.left, window.innerWidth - 220);
    menu.style.left = Math.max(4, left) + 'px';
    menu.style.minWidth = Math.max(140, ir.right - r.left) + 'px';
    var top = ir.bottom + 2;
    if (top + menu.offsetHeight > window.innerHeight - 8) { top = Math.max(4, r.top - menu.offsetHeight - 2); }
    menu.style.top = top + 'px';
  }
  function handleIcon(icon) {
    var input = icon.previousElementSibling;
    if (!input || input.tagName !== 'INPUT') { return false; }
    var f = fieldLabel(input);
    if (icon.className.indexOf('siebui-icon-date') !== -1) { pickDate(input); return true; }
    if (f === 'Find') { openMenu(icon, input, FIND_FIELDS, input.value); return true; }
    if (LOV[f]) { openMenu(icon, input, LOV[f], input.value); return true; }
    if (icon.className.indexOf('siebui-icon-pick') !== -1 || icon.className.indexOf('siebui-icon-dropdown') !== -1) {
      unavailable(f || 'List of values'); return true;
    }
    return false;
  }
  function pickDate(input) {
    var d = document.createElement('input');
    d.type = 'date';
    d.style.cssText = 'position:fixed;opacity:0;pointer-events:none;left:' + input.getBoundingClientRect().left + 'px;top:' + input.getBoundingClientRect().bottom + 'px';
    document.body.appendChild(d);
    d.addEventListener('change', function () {
      if (d.value) { var p = d.value.split('-'); setValue(input, (+p[1]) + '/' + (+p[2]) + '/' + p[0]); }
      d.remove();
    });
    d.addEventListener('blur', function () { setTimeout(function () { d.remove(); }, 200); });
    if (d.showPicker) { try { d.showPicker(); return; } catch (e) { /* fall through */ } }
    d.remove(); unavailable('Calendar');
  }

  /* ---------- clicks ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof Element)) { return; }
    if (menu && !t.closest('.sieble-menu') && !t.closest('[class*="siebui-icon-dropdown"]')) { closeMenu(); }

    if (t.closest('.siebui-logo')) { e.preventDefault(); go(P.home); return; }

    var tab = t.closest('.siebui-nav-tabs a.ui-tabs-anchor');
    if (tab) { e.preventDefault(); navigate(tab.closest('.siebui-nav-tabs').getAttribute('title'), txt(tab)); return; }

    var icon = t.closest('span[class*="siebui-icon-dropdown"], span[class*="siebui-icon-pick"], span[class*="siebui-icon-date"]');
    if (icon && handleIcon(icon)) { e.preventDefault(); e.stopPropagation(); return; }

    var goBtn = t.closest('button[data-display="Go"]');
    if (goBtn) { e.preventDefault(); runQuery(); return; }

    var dd = t.closest('a.drilldown');
    if (dd) {
      e.preventDefault();
      var name = dd.getAttribute('name') || '', v = txt(dd);
      if (name === 'BOW1 Integration Id' && v === MAIN_CONTRACT) { go(P.serviceRequests); }
      else if (name === 'BOW1 Parent Account Number' && v === MAIN_CUSTOMER) { go(P.customerAccount); }
      else { toast('No data was captured for this record.'); }
      return;
    }

    if (document.title.indexOf('Account Home') === 0) {
      var link = t.closest('a');
      if (link) {
        var l = txt(link);
        if (l === 'All Service Account List' || l === 'Service Accounts') { e.preventDefault(); go(P.serviceAccountList); return; }
        if (l === 'All Customer Accounts') { e.preventDefault(); go(P.customerAccount); return; }
        if (l) { e.preventDefault(); unavailable(l); return; }
      }
    }

    var btn = t.closest('button, input[type=button], input[type=submit]');
    if (btn) {
      e.preventDefault();
      unavailable(btn.getAttribute('data-display') || txt(btn) || btn.getAttribute('title') || '');
      return;
    }

    var a = t.closest('a');
    if (a && !a.classList.contains('next-item-applet')) {
      e.preventDefault();
      var label = txt(a);
      if (label && a.offsetParent !== null) { unavailable(label); }
    }
  }, true);

  /* ---------- overflow view lists (<select>) ---------- */
  document.addEventListener('change', function (e) {
    var sel = e.target;
    if (!(sel instanceof HTMLSelectElement) || !sel.classList.contains('siebui-nav-viewlist') && !sel.classList.contains('siebui-nav-screenlist')) { return; }
    var opt = sel.options[sel.selectedIndex];
    var bar = sel.closest('.siebui-nav-tabs');
    if (opt && opt.text.trim() && bar) { navigate(bar.getAttribute('title'), opt.text.trim()); }
    sel.selectedIndex = 0;
  });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenu(); return; }
    if (e.key !== 'Enter') { return; }
    var t = e.target;
    if (!(t instanceof HTMLInputElement) || t.type !== 'text') { return; }
    if (here() === P.serviceAccountList || here() === P.serviceAccountDetail) { e.preventDefault(); runQuery(); }
  }, true);

  window.addEventListener('scroll', closeMenu, true);
  document.addEventListener('submit', function (e) { e.preventDefault(); }, true);
})();
