fetch('http://localhost:5000/api/devices/fix-uptime', {
  method: 'POST',
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log('Result:', data))
.catch(err => console.error('Error:', err));