//=== عناصر صفحه
const itemsTbody   = document.querySelector('#items tbody'),
      totalEl      = document.getElementById('totalAmount'),
      savedList    = document.getElementById('invoicesList'),
      btnAdd       = document.getElementById('addItem'),
      btnGenPDF    = document.getElementById('genPDF'),
      btnClearAll  = document.getElementById('clearAll'),
      inpCustomer  = document.getElementById('customerName');

//=== توابع کمکی
function recalc(){
  let total = 0;
  itemsTbody.querySelectorAll('tr').forEach(r=>{
    const q = +r.querySelector('.qty').value || 0;
    const p = +r.querySelector('.price').value || 0;
    const s = q * p;
    r.querySelector('.sum').textContent = s;
    total += s;
  });
  totalEl.textContent = total;
}

function createRow(item={}){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="desc" placeholder="شرح" value="${item.desc||''}" /></td>
    <td><input class="qty" type="number" value="${item.qty||1}" /></td>
    <td><input class="price" type="number" value="${item.price||0}" /></td>
    <td class="sum">0</td>
    <td><button class="del">×</button></td>`;
  itemsTbody.append(tr);
  tr.querySelectorAll('input').forEach(i=> i.addEventListener('input', recalc));
  tr.querySelector('.del').addEventListener('click', ()=> {
    tr.remove(); recalc();
  });
  recalc();
}

// ذخیره/لود توی localStorage
function saveInvoice(){
  const inv = {
    id: Date.now(),
    customer: inpCustomer.value,
    items: Array.from(itemsTbody.querySelectorAll('tr')).map(r=>({
      desc: r.querySelector('.desc').value,
      qty: +r.querySelector('.qty').value,
      price: +r.querySelector('.price').value
    }))
  };
  const arr = JSON.parse(localStorage.getItem('faktorito')||'[]');
  arr.unshift(inv);
  localStorage.setItem('faktorito', JSON.stringify(arr));
  loadList();
}

function loadList(){
  savedList.innerHTML = '';
  const arr = JSON.parse(localStorage.getItem('faktorito')||'[]');
  arr.forEach(inv=>{
    const li = document.createElement('li');
    li.textContent = `${new Date(inv.id).toLocaleString()} — ${inv.customer}`;
    li.addEventListener('click', ()=> loadInvoice(inv));
    savedList.append(li);
  });
}

function loadInvoice(inv){
  inpCustomer.value = inv.customer;
  itemsTbody.innerHTML = '';
  inv.items.forEach(i=> createRow(i));
  recalc();
}

// ساخت PDF
async function generatePDF(){
  saveInvoice();
  const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
  const doc = new jsPDF({ unit: 'pt' });
  doc.setFontSize(14).text('Faktorito', 40, 40);
  doc.setFontSize(11).text(`مشتری: ${inpCustomer.value}`, 40, 60);
  let y = 80;
  doc.setFontSize(10).text('شرح',40,y).text('تعداد',200,y).text('قیمت',300,y).text('جمع',420,y);
  y += 20;
  itemsTbody.querySelectorAll('tr').forEach(r=>{
    const vals = {
      desc: r.querySelector('.desc').value,
      qty: r.querySelector('.qty').value,
      price: r.querySelector('.price').value,
      sum: r.querySelector('.sum').textContent
    };
    doc.text(vals.desc,40,y);
    doc.text(vals.qty+'',200,y);
    doc.text(vals.price+'',300,y);
    doc.text(vals.sum+'',420,y);
    y += 20;
  });
  y += 20;
  doc.setFontSize(12).text(`جمع کل: ${totalEl.textContent}`, 40, y);
  doc.save(`Invoice-${Date.now()}.pdf`);
}

// پاک‌سازی
function clearAll(){
  if(confirm('همه اطلاعات پاک شود؟')) {
    inpCustomer.value = '';
    itemsTbody.innerHTML = '';
    recalc();
  }
}

// event binding
btnAdd.addEventListener('click', ()=> createRow());
btnGenPDF.addEventListener('click', generatePDF);
btnClearAll.addEventListener('click', clearAll);

// init
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
loadList();
