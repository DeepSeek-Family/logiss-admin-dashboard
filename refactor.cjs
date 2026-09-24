const fs = require('fs');

const files = [
  'src/pages/AdminDashboard.jsx',
  'src/pages/Bookings.jsx',
  'src/pages/LiveTrips.jsx',
  'src/pages/Operations.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Import useNavigate if not present
  if (!content.includes('react-router-dom')) {
    content = content.replace(/import React[^;]*;/, "$&\nimport { useNavigate } from 'react-router-dom';");
  }

  // 2. Remove setPage from props and add navigate
  content = content.replace(/const (\w+) = \(\{\s*setPage\s*\}\) => \{/, 'const $1 = () => {\n  const navigate = useNavigate();');
  content = content.replace(/const (\w+) = \(\{\s*role,\s*setPage\s*\}\) => \{/, 'const $1 = ({ role }) => {\n  const navigate = useNavigate();');
  content = content.replace(/const (\w+) = \(\{\s*setPage,\s*role\s*\}\) => \{/, 'const $1 = ({ role }) => {\n  const navigate = useNavigate();');

  // 3. Replace setPage('...') with navigate('/...')
  content = content.replace(/setPage\('([^']+)'\)/g, "navigate('/$1')");
  
  // Special case for dynamic setPage calls like: setPage(trip.status === 'pending_review' ? 'bookings' : 'live')
  content = content.replace(/setPage\(([^)]+)\)/g, (match, p1) => {
     if(p1.includes('?') && !p1.includes("'")) return match; 
     if(p1.includes('?')) {
       return `navigate(${p1.replace(/'([^']+)'/g, "'/$1'")})`;
     }
     return match;
  });

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
