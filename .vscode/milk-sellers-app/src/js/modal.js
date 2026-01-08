// This file manages the modal functionality for displaying seller details when a seller card is clicked.

const modalBackdrop = document.getElementById('modalBackdrop');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

function showSellerDetails(seller) {
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

  document.getElementById('closeBtn').addEventListener('click', hideModal);
  document.getElementById('contactSellerBtn').addEventListener('click', () => {
    if (seller.email) window.location.href = `mailto:${seller.email}?subject=Inquiry about milk`;
    else alert('No contact email available.');
  });
}

function hideModal() {
  modalBackdrop.style.display = 'none';
  modalBody.innerHTML = '';
}

modalClose.addEventListener('click', hideModal);
modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) hideModal(); });