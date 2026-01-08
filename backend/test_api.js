(async ()=>{
  try {
    console.log('Registering seller...');
    let res = await fetch('http://localhost:4000/api/register', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        fname: 'Test',
        lname: 'Seller',
        phone: '9991112223',
        email: 'seller@example.com',
        password: 'pass123',
        role: 'seller',
        milkType: 'cow',
        milkCost: '40',
        address: '123 Farm'
      })
    });
    let j = await res.json();
    console.log('Register response:\n', JSON.stringify(j, null, 2));

    console.log('\nLogging in...');
    res = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({phone: '9991112223', password: 'pass123'})
    });
    j = await res.json();
    console.log('Login response:\n', JSON.stringify(j, null, 2));

    const token = j.token;
    console.log('\nFetching sellers...');
    res = await fetch('http://localhost:4000/api/sellers', {
      headers: token ? {Authorization: 'Bearer ' + token} : {}
    });
    j = await res.json();
    console.log('Sellers:\n', JSON.stringify(j, null, 2));
  } catch (err) {
    console.error('Error in test_api:', err);
  }
})();
