// Usar fetch global (Node 18+)
const api = 'http://localhost:4000';

async function run(){
  try{
    console.log('1) GET /servicios');
    let r = await fetch(`${api}/servicios`);
    const servicios = await r.json();
    console.log('servicios count:', servicios.length);

    console.log('\n2) POST /login');
    r = await fetch(`${api}/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email: 'david123@david.com', password: '123456' })
    });
    let data = await r.json();
    if(!r.ok) return console.error('login failed', data);
    const token = data.token;
    console.log('login token:', token.slice(0,8),'...');

    console.log('\n3) PUT /cart');
    const items = [{ id: 1, nombre: servicios[0].nombre, precio: servicios[0].precio, quantity: 2 }];
    r = await fetch(`${api}/cart`, { method: 'PUT', headers: { 'Content-Type':'application/json','Authorization': 'Bearer '+token }, body: JSON.stringify({ items }) });
    data = await r.json();
    console.log('put cart response:', data);

    console.log('\n4) GET /cart');
    r = await fetch(`${api}/cart`, { headers: { 'Authorization': 'Bearer '+token } });
    data = await r.json();
    console.log('cart items:', data);

    console.log('\n5) POST /purchase');
    r = await fetch(`${api}/purchase`, { method: 'POST', headers: { 'Content-Type':'application/json','Authorization': 'Bearer '+token }, body: JSON.stringify({ items: data.map(i=>({ id: i.id, quantity: i.quantity })) }) });
    data = await r.json();
    console.log('purchase result:', data);

    console.log('\n6) GET /my-purchases');
    r = await fetch(`${api}/my-purchases`, { headers: { 'Authorization': 'Bearer '+token } });
    data = await r.json();
    console.log('my purchases:', data.map(p=>({ id: p.id, total: p.total })) );

    console.log('\nSmoke test completed.');
  }catch(err){
    console.error('Error in smoke test', err);
  }
}

run();
