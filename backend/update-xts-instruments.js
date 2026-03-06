const axios = require('axios');

async function updateXtsInstruments() {
    console.log('🔄 Updating XTS Instruments data...\n');

    try {
        const response = await axios.post('http://localhost:5000/api/xts-instruments/update-all');
        
        console.log('✅ XTS Instruments updated successfully!');
        console.log('Response:', response.data);
        
    } catch (error) {
        console.error('❌ Error updating XTS instruments:', error.message);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        }
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the backend server is running on port 5000');
            console.log('Run: npm run dev (in backend directory)');
        }
    }
}

updateXtsInstruments();

