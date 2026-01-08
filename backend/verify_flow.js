// Automated flow verification script for Shift White Gold
// Registers unique seller & client, logs in client, places order, verifies seller messages & orders
(async () => {
  const base = 'http://localhost:4000/api';
  const fetchFn = global.fetch || (await import('node-fetch')).default;
  const stamp = Date.now();
  const sellerPhone = '9' + (''+stamp).slice(-9); // ensure 10 digits
  const clientPhone = '8' + (''+stamp).slice(-9);
  const password = 'pass123';
  function log(step, data){ console.log('\n['+step+']'); if(data!==undefined) console.log(typeof data==='string'?data:JSON.stringify(data,null,2)); }
  async function post(path, body, token){
    const res = await fetchFn(base+path, { method:'POST', headers:{ 'content-type':'application/json', ...(token?{authorization:'Bearer '+token}:{}) }, body: JSON.stringify(body||{}) });
    const j = await res.json();
    if(!res.ok) throw new Error(path+' failed: '+JSON.stringify(j));
    return j;
  }
  async function get(path, token){
    const res = await fetchFn(base+path, { headers: token?{authorization:'Bearer '+token}:{}});
    const j = await res.json();
    if(!res.ok) throw new Error(path+' failed: '+JSON.stringify(j));
    return j;
  }
  try {
    log('Register seller');
    const sellerReg = await post('/register', { role:'seller', fname:'Flow', lname:'Seller', phone:sellerPhone, email:`flow_seller_${stamp}@example.com`, password, milkType:'cow', milkCost:55, address:'Flow Farm' });
    const sellerId = sellerReg.user._id;

    log('Register client');
    const clientReg = await post('/register', { role:'client', fname:'Flow', lname:'Buyer', phone:clientPhone, email:`flow_client_${stamp}@example.com`, password });

    log('Client login');
    const clientLogin = await post('/login', { phone: clientPhone, password });
    const clientToken = clientLogin.token;

    log('List sellers (should include new seller)');
    const sellers = await get('/sellers');
    const foundSeller = sellers.find(s => s._id === sellerId);

    log('Place order 3L for new seller');
    const orderResp = await post('/orders', { items:[{ sellerId, liters:3, milkCost:55 }] }, clientToken);
    const orderId = orderResp.orders[0].id;

    log('Seller login');
    const sellerLogin = await post('/login', { phone: sellerPhone, password });
    const sellerToken = sellerLogin.token;

    log('Fetch seller messages');
    const messages = await get('/messages', sellerToken);
    const msgForOrder = messages.find(m => m.orderId === orderId);

    log('Fetch seller orders');
    const sellerOrders = await get('/orders', sellerToken);
    const orderFound = sellerOrders.find(o => o.id === orderId);

    console.log('\nSUMMARY');
    console.log(JSON.stringify({ sellerRegistered: !!sellerReg.user, clientRegistered: !!clientReg.user, sellersCount: sellers.length, sellerListed: !!foundSeller, orderPlaced: !!orderFound, messageCreated: !!msgForOrder }, null, 2));
    console.log('\nFlow verification complete.');
  } catch (err) {
    console.error('Flow verification failed:', err);
    process.exit(1);
  }
})();
