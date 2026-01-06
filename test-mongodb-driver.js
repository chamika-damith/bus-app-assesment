#!/usr/bin/env node

/**
 * Test script to check MongoDB driver directly
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://chamikachamara2001:Chamika2001@cluster0.bcz4z.mongodb.net/bus-tracking?retryWrites=true&w=majority';

async function testMongoDBDriver() {
  try {
    console.log('🔍 Testing MongoDB Driver Direct Access\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Define Driver schema (same as in the model)
    const driverSchema = new mongoose.Schema({
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, trim: true, lowercase: true },
      password: { type: String, required: true, minlength: 6 },
      route: { type: String, required: true, trim: true },
      nic: { type: String, required: true, unique: true, trim: true },
      telephone: { type: String, required: true, trim: true },
      vehicleNumber: { type: String, required: true, trim: true }
    }, { timestamps: true });

    // Hash password before saving
    driverSchema.pre('save', async function(next) {
      if (!this.isModified('password')) {
        return next();
      }
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    });

    // Method to compare password
    driverSchema.methods.comparePassword = async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };

    const Driver = mongoose.model('Driver', driverSchema);
    
    // Find the test driver
    console.log('🔍 Looking for driver with email: testlogin555@example.com');
    const driver = await Driver.findOne({ email: 'testlogin555@example.com' });
    
    if (driver) {
      console.log('✅ Driver found in MongoDB:');
      console.log('  Name:', driver.name);
      console.log('  Email:', driver.email);
      console.log('  Phone:', driver.telephone);
      console.log('  Password Hash:', driver.password.substring(0, 20) + '...');
      
      // Test password comparison
      console.log('\n🔐 Testing password comparison...');
      const passwordMatch = await driver.comparePassword('mypassword123');
      console.log('Password match result:', passwordMatch ? '✅ MATCH' : '❌ NO MATCH');
      
      // Test with wrong password
      const wrongPasswordMatch = await driver.comparePassword('wrongpassword');
      console.log('Wrong password result:', wrongPasswordMatch ? '❌ MATCH (ERROR!)' : '✅ NO MATCH (CORRECT)');
      
    } else {
      console.log('❌ Driver not found in MongoDB');
      
      // List all drivers
      const allDrivers = await Driver.find({}).select('name email telephone');
      console.log('\n📋 All drivers in MongoDB:');
      allDrivers.forEach(d => {
        console.log(`  - ${d.name} (${d.email}) - ${d.telephone}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testMongoDBDriver();