const platesData = [
    { id: 'red', name: '紅碟', price: 12 }, { id: 'silver', name: '銀碟', price: 17 },
    { id: 'gold', name: '金碟', price: 22 }, { id: 'black', name: '黑碟', price: 27 }
];
const categories = ['其他', '握壽司', '軍艦・卷物', '麵類・湯類', '副餐類', '甜品・飲料', '嚴選二貫', '外賣自取'];

const plateContainer = document.getElementById('plate-grid');
const customGrid = document.getElementById('custom-grid');
const modal = document.getElementById('disclaimer-modal');
const toast = document.getElementById('toast');

// Init Standard Plates
platesData.forEach(plate => {
    const div = document.createElement('div');
    div.className = `plate-card plate-${plate.id}`;
    // Click card to add
    div.onclick = function(e) { changePlateQty(plate.id, 1); };

    div.innerHTML = `
        <div class="plate-top">
            <div class="plate-icon"></div>
            <div class="plate-info">
                <div class="plate-name">${plate.name}</div>
                <div class="plate-price">$${plate.price}</div>
            </div>
        </div>
        <div class="qty-control">
            <button class="qty-btn" onclick="event.stopPropagation(); changePlateQty('${plate.id}', -1)">-</button>
            <input type="number" id="qty-${plate.id}" class="qty-input" value="0" min="0" oninput="calculateTotal()" onclick="event.stopPropagation()">
            <button class="qty-btn" onclick="event.stopPropagation(); changePlateQty('${plate.id}', 1)">+</button>
        </div>
    `;
    plateContainer.appendChild(div);
});

// Disclaimer
function openDisclaimer() { modal.classList.add('show'); }
function closeDisclaimer(e, force) { if (force || e.target === modal) modal.classList.remove('show'); }

// Toast
function showToast(message) {
    toast.textContent = message;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

// --- RESET LOGIC ---
let resetTimer;
function handleReset() {
    const btn = document.querySelector('.reset-btn-float');
    const icon = document.getElementById('reset-icon');
    const text = document.getElementById('reset-text');

    if (btn.classList.contains('confirm')) {
        platesData.forEach(p => document.getElementById(`qty-${p.id}`).value = 0);
        document.getElementById('custom-grid').innerHTML = '';
        document.getElementById('people').value = 1;
        calculateTotal();
        showToast("已重設所有資料 🗑️");
        
        btn.classList.remove('confirm');
        icon.textContent = '🔄';
        text.style.display = 'none';
        clearTimeout(resetTimer);
    } else {
        btn.classList.add('confirm');
        icon.textContent = '🗑️';
        text.style.display = 'inline';
        resetTimer = setTimeout(() => {
            btn.classList.remove('confirm');
            icon.textContent = '🔄';
            text.style.display = 'none';
        }, 3000);
    }
}

// --- TIMER LOGIC ---
let timerInterval;
let timerSeconds = 3600; // 60 mins
let timerState = 'idle'; // idle, confirm_start, running, confirm_stop
let timerTimeout;

function handleTimer() {
    const btn = document.querySelector('.timer-btn-float');
    const icon = document.getElementById('timer-icon');
    const text = document.getElementById('timer-text');

    if (timerState === 'idle') {
        // State: Idle -> Confirm Start
        timerState = 'confirm_start';
        btn.classList.add('confirm');
        icon.textContent = '▶️';
        text.textContent = '確定計時?';
        text.style.display = 'inline';

        timerTimeout = setTimeout(() => {
            if(timerState === 'confirm_start') resetTimerUI();
        }, 3000);

    } else if (timerState === 'confirm_start') {
        // State: Confirm Start -> Running
        clearTimeout(timerTimeout);
        timerState = 'running';
        btn.classList.remove('confirm');
        btn.classList.add('running');
        icon.style.display = 'none';
        text.style.marginLeft = '0';
        startCountdown();

    } else if (timerState === 'running') {
        // State: Running -> Confirm Stop
        timerState = 'confirm_stop';
        btn.classList.remove('running');
        btn.classList.add('pause-confirm');
        icon.style.display = 'inline';
        icon.textContent = '⏸️';
        text.style.marginLeft = '5px';
        text.textContent = '確定停止?';

        timerTimeout = setTimeout(() => {
            if(timerState === 'confirm_stop') {
                timerState = 'running';
                btn.classList.remove('pause-confirm');
                btn.classList.add('running');
                icon.style.display = 'none';
                text.style.marginLeft = '0';
                updateTimerText(); 
            }
        }, 3000);

    } else if (timerState === 'confirm_stop') {
        // State: Confirm Stop -> Idle (Actually Stop)
        clearTimeout(timerTimeout);
        clearInterval(timerInterval);
        resetTimerUI();
        showToast("已停止計時 ⏹️");
    }
}

function resetTimerUI() {
    const btn = document.querySelector('.timer-btn-float');
    const icon = document.getElementById('timer-icon');
    const text = document.getElementById('timer-text');
    
    timerState = 'idle';
    btn.classList.remove('confirm', 'running', 'pause-confirm');
    icon.style.display = 'inline';
    icon.textContent = '⏱️';
    text.style.display = 'none';
    text.style.marginLeft = '5px';
    text.textContent = '';
}

function startCountdown() {
    timerSeconds = 60 * 60; // 60 mins
    updateTimerText();
    
    timerInterval = setInterval(() => {
        timerSeconds--;
        if (timerState === 'running') {
            updateTimerText();
        }
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            showToast("用餐時間到！⏰");
            resetTimerUI();
        }
    }, 1000);
}

function updateTimerText() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    const text = document.getElementById('timer-text');
    text.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// --- CALCULATOR LOGIC ---
let customId = 0;

function addCustomItem(price = null) {
    if (price !== null) {
        const priceInputs = Array.from(document.querySelectorAll('.custom-price-input'));
        const existingInput = priceInputs.find(input => parseFloat(input.value) === price);
        if (existingInput) {
            const card = existingInput.closest('.custom-card');
            const qtyInput = card.querySelector('.qty-input');
            qtyInput.value = (parseInt(qtyInput.value) || 0) + 1;
            card.classList.remove('highlight');
            void card.offsetWidth; 
            card.classList.add('highlight');
            setTimeout(() => card.classList.remove('highlight'), 300);
            calculateTotal();
            return;
        }
    }

    customId++;
    const div = document.createElement('div');
    div.className = 'custom-card';
    div.id = `custom-card-${customId}`;
    
    let optionsHtml = '';
    categories.forEach(cat => { optionsHtml += `<option value="${cat}">${cat}</option>`; });
    const priceVal = price ? price : '';

    div.innerHTML = `
        <div class="custom-header">
            <select class="category-select">${optionsHtml}</select>
            <span class="delete-x" onclick="removeCustom(${customId})">×</span>
        </div>
        <input type="number" class="custom-price-input" placeholder="單價 $" value="${priceVal}" oninput="calculateTotal()" id="price-${customId}">
        <div class="qty-control">
            <button class="qty-btn" onclick="changeCustomQty(${customId}, -1)">-</button>
            <input type="number" class="qty-input" value="1" min="1" id="qty-c-${customId}" oninput="calculateTotal()">
            <button class="qty-btn" onclick="changeCustomQty(${customId}, 1)">+</button>
        </div>
    `;
    customGrid.appendChild(div);
    
    if (!price) {
        setTimeout(() => document.getElementById(`price-${customId}`).focus(), 100);
    } else {
        calculateTotal();
    }
}

function removeCustom(id) { document.getElementById(`custom-card-${id}`).remove(); calculateTotal(); }
function getVal(id) { return parseInt(document.getElementById(id).value) || 0; }

function changePlateQty(id, delta) {
    const el = document.getElementById(`qty-${id}`);
    el.value = Math.max(0, getVal(`qty-${id}`) + delta);
    calculateTotal();
}
function changeCustomQty(id, delta) {
    const el = document.getElementById(`qty-c-${id}`);
    el.value = Math.max(1, getVal(`qty-c-${id}`) + delta);
    calculateTotal();
}
function changePeople(delta) {
    const el = document.getElementById('people');
    el.value = Math.max(1, getVal('people') + delta);
    calculateTotal();
}

function calculateTotal() {
    let subtotal = 0;
    let totalItems = 0;

    platesData.forEach(p => {
        const qty = getVal(`qty-${p.id}`);
        subtotal += qty * p.price;
        totalItems += qty;
    });

    document.querySelectorAll('.custom-card').forEach(card => {
        const price = parseFloat(card.querySelector('.custom-price-input').value) || 0;
        const qty = parseInt(card.querySelector('.qty-input').value) || 0;
        subtotal += price * qty;
        totalItems += qty;
    });

    const hasService = document.getElementById('service-charge').checked;
    const service = (hasService && subtotal > 0) ? subtotal * 0.1 : 0;
    const total = subtotal + service;
    const people = Math.max(1, getVal('people'));
    const avgItems = totalItems / people;

    document.getElementById('subtotal-txt').textContent = `$${subtotal.toFixed(0)}`;
    document.getElementById('service-txt').textContent = `服務費: $${service.toFixed(1)}`;
    document.getElementById('total-txt').textContent = `HK$ ${total.toFixed(1)}`;
    document.getElementById('aa-txt').textContent = `$${(total/people).toFixed(1)}`;
    
    document.getElementById('total-count').textContent = totalItems;
    document.getElementById('avg-count').textContent = isNaN(avgItems) ? '0' : avgItems.toFixed(1);

    document.getElementById('service-txt').style.opacity = service > 0 ? 1 : 0.5;
    document.getElementById('service-txt').style.textDecoration = service > 0 ? 'none' : 'line-through';
}

function sendWhatsApp() {
    const people = Math.max(1, getVal('people'));
    const totalText = document.getElementById('total-txt').textContent;
    const aaVal = parseFloat(document.getElementById('aa-txt').textContent.replace('$',''));
    const aaCeil = Math.ceil(aaVal);
    const totalItems = document.getElementById('total-count').textContent;

    if (aaVal <= 0) { 
        showToast("請先點餐！🍣");
        return; 
    }

    const d = new Date();
    const dateStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
    const msg = `${dateStr} 壽司郎 ${people}位🍣\n共 ${totalItems} 碟\n總數：*${totalText}*\n每人：👉 *HK$ ${aaCeil}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

window.onload = calculateTotal;
