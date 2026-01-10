// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Test Google Video Intelligence API connection
import googleVideoIntService from './services/google-video-intelligence.service';

console.log('\n🔍 Testing Google Video Intelligence API connection...\n');
console.log(`📁 Credentials path: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'NOT SET'}\n`);

if (googleVideoIntService.isEnabled()) {
  console.log('✅ Google Video Intelligence API is ENABLED');
  console.log('📹 Service will analyze videos using Google Cloud');
} else {
  console.log('⚠️  Google Video Intelligence API is DISABLED');
  console.log('🎭 Using mock implementation for testing');
}

console.log('\n💡 Upload a video to trigger actual API analysis\n');
