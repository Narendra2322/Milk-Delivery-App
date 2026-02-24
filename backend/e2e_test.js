(async ()=>{
  const base = 'http://localhost:4000/api';
  const fetch = global.fetch || (await import('node-fetch')).default;
  try{
    console.log('Registering seller...');
    let res = await fetch(base + '/register', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ role:'seller', fname:'Seller', lname:'One', phone:'7000000001', email:'seller1@example.com', password:'pass123', milkType:'cow', milkCost:45, address:'Farm 1' }) });
    let j = await res.json(); console.log('Seller register:', j);

    console.log('Registering client...');
    res = await fetch(base + '/register', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ role:'client', fname:'Buyer', lname:'One', phone:'7000000002', email:'buyer1@example.com', password:'pass123' }) });
    j = await res.json(); console.log('Client register:', j);

    console.log('Client login...');
    res = await fetch(base + '/login', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ phone:'7000000002', password:'pass123' }) });
    j = await res.json(); console.log('Client login:', j);
    const clientToken = j.token;

    // fetch sellers list to get sellerId
    res = await fetch(base + '/sellers'); j = await res.json(); console.log('Sellers list:', j);
    const sellerId = j[0]._id;

    console.log('Client placing order (2 liters)...');
    res = await fetch(base + '/orders', { method:'POST', headers:{'content-type':'application/json','authorization':'Bearer '+clientToken}, body: JSON.stringify({ items:[{ sellerId, liters:2, milkCost:45 }] }) });
    j = await res.json(); console.log('Place order result:', j);
    const orderId = (j.orders && j.orders[0] && (j.orders[0].id || j.orders[0]._id)) || null;

    console.log('Seller login to fetch messages...');
    res = await fetch(base + '/login', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ phone:'7000000001', password:'pass123' }) });
    j = await res.json(); console.log('Seller login:', j);
    const sellerToken = j.token;

    console.log('Fetch seller messages...');
    res = await fetch(base + '/messages', { headers:{ 'authorization':'Bearer '+sellerToken } });
    j = await res.json(); console.log('Messages:', j);

    if(orderId){
      const hasMsg = Array.isArray(j) && j.some(m => m.orderId === orderId);
      console.log('Message for order found:', hasMsg);
    }

    console.log('E2E test completed.');
  }catch(err){ console.error('E2E error:', err); process.exit(1); }
})();
