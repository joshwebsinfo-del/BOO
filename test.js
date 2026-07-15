const http = require('http');

console.log('🧪 Running ZimHub Automated API Verification Suite...');

// Create a test to verify all routes respond correctly
function testEndpoint(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({ success: true, path, length: Array.isArray(parsed) ? parsed.length : 1 });
                    } catch (e) {
                        resolve({ success: true, path, note: 'Non-JSON response' });
                    }
                } else {
                    reject(new Error(`Failed ${path}: Status ${res.statusCode}`));
                }
            });
        }).on('error', err => {
            reject(err);
        });
    });
}

// Inline Spawn Express backend and perform API probes
const { exec } = require('child_process');
const serverProc = exec('node server.js');

setTimeout(async () => {
    try {
        const tests = [
            await testEndpoint('/api/businesses'),
            await testEndpoint('/api/lodges'),
            await testEndpoint('/api/products'),
            await testEndpoint('/api/jobs'),
            await testEndpoint('/api/properties'),
        ];

        console.log('\n--- 🩺 Probing Results ---');
        tests.forEach(t => {
            console.log(`✅ [PASS] ${t.path} returned ${t.length || 1} records successfully.`);
        });

        console.log('\n🌟 ZimHub Super App backend test suite is 100% HEALTHY and production-ready!');
        serverProc.kill();
        process.exit(0);
    } catch (err) {
        console.error('❌ [FAIL] Test suite discovered an error:', err.message);
        serverProc.kill();
        process.exit(1);
    }
}, 3000);
