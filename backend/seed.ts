import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './src/models/User';
import Organization from './src/models/Organization';
import Group from './src/models/Group';
import VideoMetaInfo from './src/models/VideoMetaInfo';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/video_sensitivity_app';

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Group.deleteMany({});
    await VideoMetaInfo.deleteMany({});

    // Create Organizations
    console.log('🏢 Creating organizations...');
    const org1 = await Organization.create({
      name: 'TechCorp Inc',
      description: 'Leading technology company',
      orgId: 'TECHCORP',
      email: 'contact@techcorp.com',
      password: 'password123',
      address: '123 Tech Street, Silicon Valley, CA',
      mobile: '+1-555-0100',
    });

    const org2 = await Organization.create({
      name: 'MediaHub Studios',
      description: 'Creative media production company',
      orgId: 'MEDIAHUB',
      email: 'info@mediahub.com',
      password: 'password123',
      address: '456 Media Ave, Los Angeles, CA',
      mobile: '+1-555-0200',
    });

    console.log(`   ✓ Created ${org1.name}`);
    console.log(`   ✓ Created ${org2.name}`);

    // Create Users
    console.log('👥 Creating users...');
    const user1 = await User.create({
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
      mobile_number: '+1-555-1001',
      organization: org1._id,
      groups: [],
    });

    const user2 = await User.create({
      name: 'Jane Smith',
      username: 'janesmith',
      email: 'jane@example.com',
      password: 'password123',
      mobile_number: '+1-555-1002',
      organization: org1._id,
      groups: [],
    });

    const user3 = await User.create({
      name: 'Bob Johnson',
      username: 'bobjohnson',
      email: 'bob@example.com',
      password: 'password123',
      mobile_number: '+1-555-1003',
      organization: org2._id,
      groups: [],
    });

    const user4 = await User.create({
      name: 'Alice Williams',
      username: 'alicew',
      email: 'alice@example.com',
      password: 'password123',
      mobile_number: '+1-555-1004',
      organization: org2._id,
      groups: [],
    });

    const user5 = await User.create({
      name: 'Charlie Brown',
      username: 'charlieb',
      email: 'charlie@example.com',
      password: 'password123',
      mobile_number: '+1-555-1005',
      organization: null, // Independent user
      groups: [],
    });

    console.log(`   ✓ Created ${user1.name} (${user1.email})`);
    console.log(`   ✓ Created ${user2.name} (${user2.email})`);
    console.log(`   ✓ Created ${user3.name} (${user3.email})`);
    console.log(`   ✓ Created ${user4.name} (${user4.email})`);
    console.log(`   ✓ Created ${user5.name} (${user5.email})`);

    // Create Groups
    console.log('👨‍👩‍👧‍👦 Creating groups...');
    const group1 = await Group.create({
      group_name: 'Development Team',
      description: 'Software development and engineering team',
      users: [user1._id, user2._id, user5._id],
      created_by: user1._id,
    });

    const group2 = await Group.create({
      group_name: 'Marketing Team',
      description: 'Marketing and creative content team',
      users: [user3._id, user4._id],
      created_by: user3._id,
    });

    const group3 = await Group.create({
      group_name: 'All Hands',
      description: 'Company-wide team for important announcements',
      users: [user1._id, user2._id, user3._id, user4._id, user5._id],
      created_by: user1._id,
    });

    const group4 = await Group.create({
      group_name: 'Video Editors',
      description: 'Professional video editing team',
      users: [user2._id, user4._id, user5._id],
      created_by: user4._id,
    });

    console.log(`   ✓ Created group: ${group1.group_name} (${group1.users.length} members)`);
    console.log(`   ✓ Created group: ${group2.group_name} (${group2.users.length} members)`);
    console.log(`   ✓ Created group: ${group3.group_name} (${group3.users.length} members)`);
    console.log(`   ✓ Created group: ${group4.group_name} (${group4.users.length} members)`);

    // Update users with their groups
    await User.findByIdAndUpdate(user1._id, { groups: [group1._id, group3._id] });
    await User.findByIdAndUpdate(user2._id, { groups: [group1._id, group3._id, group4._id] });
    await User.findByIdAndUpdate(user3._id, { groups: [group2._id, group3._id] });
    await User.findByIdAndUpdate(user4._id, { groups: [group2._id, group3._id, group4._id] });
    await User.findByIdAndUpdate(user5._id, { groups: [group1._id, group3._id, group4._id] });

    console.log('✅ Database seeded successfully!\n');

    // Print summary
    console.log('📊 Summary:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Organizations: 2`);
    console.log(`  - TechCorp Inc (TECHCORP)`);
    console.log(`  - MediaHub Studios (MEDIAHUB)`);
    console.log('');
    console.log(`Users: 5`);
    console.log(`  - john@example.com (password: password123)`);
    console.log(`  - jane@example.com (password: password123)`);
    console.log(`  - bob@example.com (password: password123)`);
    console.log(`  - alice@example.com (password: password123)`);
    console.log(`  - charlie@example.com (password: password123)`);
    console.log('');
    console.log(`Groups: 4`);
    console.log(`  - Development Team (3 members)`);
    console.log(`  - Marketing Team (2 members)`);
    console.log(`  - All Hands (5 members)`);
    console.log(`  - Video Editors (3 members)`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n🚀 You can now start using the application!');
    console.log('   Login with any user email and password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run seed function
seedDatabase();
