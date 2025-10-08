const apiBase = 'http://localhost:4000';

function $(id){ return document.getElementById(id); }

// Alternar formularios
document.addEventListener('DOMContentLoaded', () => {
  const showRegister = $('show-register');
  const showLogin = $('show-login');
  if (showRegister) showRegister.addEventListener('click', e => {
    e.preventDefault();
    $('login-form').style.display = 'none';
    $('register-form').style.display = 'block';
  });
  if (showLogin) showLogin.addEventListener('click', e => {
    e.preventDefault();
    $('login-form').style.display = 'block';
    $('register-form').style.display = 'none';
  });

  // Registro
  const btnRegister = $('btn-register');
  if (btnRegister) btnRegister.addEventListener('click', async () => {
    const email = $('reg-email').value.trim();
    const password = $('reg-password').value.trim();
    if (!email || !password) return alert('Email y password requeridos');
    try {
      const res = await fetch(`${apiBase}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Error al registrar');
      localStorage.setItem('authToken', data.token);
  alert('Registrado correctamente');
  window.location.href = 'servicios.html';
    } catch (err) {
      console.error(err);
      alert('Error de red');
    }
  });

  // Inicio de sesión
  const btnLogin = $('btn-login');
  if (btnLogin) btnLogin.addEventListener('click', async () => {
    const email = $('login-email').value.trim();
    const password = $('login-password').value.trim();
    if (!email || !password) return alert('Email y password requeridos');
    try {
      const res = await fetch(`${apiBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Credenciales inválidas');
      localStorage.setItem('authToken', data.token);
  alert('Login correcto');
  window.location.href = 'servicios.html';
    } catch (err) {
      console.error(err);
      alert('Error de red');
    }
  });

});
