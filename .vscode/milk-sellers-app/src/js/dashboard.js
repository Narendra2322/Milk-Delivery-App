const users = JSON.parse(localStorage.getItem('users')) || [];

function renderSellers() {
  const feed = document.getElementById('feed');
  feed.innerHTML = '';

  if (!users || users.length === 0) {
    const noData = document.createElement('div');
    noData.className = 'no-data';
    noData.textContent = 'No sellers available.';
    feed.appendChild(noData);
    return;
  }

  users.forEach((seller) => {
    const card = document.createElement('div');
    card.className = 'seller-card';
    card.tabIndex = 0;

    const photo = seller.photo || 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
    const name = (seller.fname || '') + (seller.lname ? ' ' + seller.lname : '');
    const milkTypeText = seller.milkType ? (seller.milkType === 'cow' ? 'Cow Milk' : 'Buffalo Milk') : '';
    const costText = seller.milkCost ? ('₹' + seller.milkCost + ' / liter') : '';

    card.innerHTML = `
      <img class="seller-img" src="${photo}" alt="seller">
      <div class="seller-name">${name}</div>
      <div class="milk-type">${milkTypeText}</div>
      <div class="milk-cost">${costText}</div>
    `;

    card.addEventListener('click', () => showSellerDetails(seller));
    card.addEventListener('keypress', (e) => { if (e.key === 'Enter') showSellerDetails(seller); });
    feed.appendChild(card);
  });
}

function showSellerDetails(seller) {
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalBody = document.getElementById('modalBody');

  const name = (seller.fname || '') + (seller.lname ? ' ' + seller.lname : '');
  const milkTypeText = seller.milkType ? (seller.milkType === 'cow' ? 'Cow Milk' : 'Buffalo Milk') : 'N/A';
  const costText = seller.milkCost ? ('₹' + seller.milkCost + ' / liter') : 'N/A';

  modalBody.innerHTML = `
    <div style="display:flex; gap:12px; align-items:center;">
      <img src="${seller.photo || 'https://cdn-icons-png.flaticon.com/512/616/616408.png'}" alt="photo" style="width:84px;height:84px;border-radius:10px;object-fit:cover;background:#eee">
      <div>
        <div style="font-weight:800;color:#2b652e">${name}</div>
        <div style="color:#666;margin-top:6px">${seller.email || 'N/A'}</div>
        <div style="color:#4CAF50;font-weight:800;margin-top:6px">${milkTypeText}</div>
      </div>
    </div>

    <div class="detail-row"><div class="detail-label">Account Type</div><div class="detail-value">${seller.role || 'seller'}</div></div>
    <div class="detail-row"><div class="detail-label">Price / Liter</div><div class="detail-value">${costText}</div></div>
    <div class="detail-row"><div class="detail-label">Email</div><div class="detail-value">${seller.email || 'N/A'}</div></div>
    <div class="detail-row"><div class="detail-label">Full Name</div><div class="detail-value">${name}</div></div>
    ${seller.phone ? `<div class="detail-row"><div class="detail-label">Phone</div><div class="detail-value">${seller.phone}</div></div>` : ''}
    ${seller.address ? `<div class="detail-row"><div class="detail-label">Address</div><div class="detail-value">${seller.address}</div></div>` : ''}
    
    <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:14px;">
      <button id="contactSellerBtn" style="background:#2b652e;color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer">Contact</button>
      <button id="closeBtn" style="background:#eee;border:none;padding:8px 12px;border-radius:8px;cursor:pointer">Close</button>
    </div>
  `;

  modalBackdrop.style.display = 'flex';

  document.getElementById('closeBtn').addEventListener('click', () => {
    modalBackdrop.style.display = 'none';
    modalBody.innerHTML = '';
  });

  document.getElementById('contactSellerBtn').addEventListener('click', () => {
    if (seller.email) window.location.href = `mailto:${seller.email}?subject=Inquiry about milk`;
    else alert('No contact email available.');
  });
}

// Initial render
renderSellers();