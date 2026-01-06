import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth, UserRole } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';

const ROLES = [
  { label: 'Passenger', value: 'PASSENGER' as UserRole },
  { label: 'Driver', value: 'DRIVER' as UserRole },
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'PASSENGER' as UserRole,
    deviceId: '',
    // Driver-specific fields
    nic: '',
    route: '',
    vehicleNumber: '',
    // Passenger-specific fields (telephone is same as phone)
  });
  const [loading, setLoading] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    // Common field validation
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Role-specific validation
    if (formData.role === 'DRIVER') {
      if (!formData.phone || !formData.nic || !formData.route || !formData.vehicleNumber) {
        Alert.alert('Error', 'Please fill in all driver fields: Phone, NIC, Route, and Vehicle Number');
        return;
      }
    } else if (formData.role === 'PASSENGER') {
      if (!formData.phone || !formData.nic) {
        Alert.alert('Error', 'Please fill in all passenger fields: Phone and NIC');
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const registrationData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        nic: formData.nic,
        route: formData.role === 'DRIVER' ? formData.route : undefined,
        vehicleNumber: formData.role === 'DRIVER' ? formData.vehicleNumber : undefined,
      };

      // Only add deviceId if user entered one
      if (formData.deviceId && formData.deviceId.trim() !== '') {
        registrationData.deviceId = formData.deviceId.trim();
      }

      await register(registrationData);
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedRole = ROLES.find(role => role.value === formData.role);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join RideShare today</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name *"
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            placeholder="Enter your full name"
            autoComplete="name"
          />

          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            placeholder="Enter your email"
            autoComplete="email"
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Role *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowRolePicker(!showRolePicker)}
            >
              <Text style={styles.pickerText}>{selectedRole?.label}</Text>
              <ChevronDown size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
            
            {showRolePicker && (
              <View style={styles.pickerOptions}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={styles.pickerOption}
                    onPress={() => {
                      updateFormData('role', role.value);
                      setShowRolePicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{role.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Input
            label="Password *"
            type="password"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            placeholder="Enter your password"
            autoComplete="new-password"
          />

          {/* Common Fields */}
          <Input
            label="Phone Number *"
            type="phone"
            value={formData.phone}
            onChangeText={(value) => updateFormData('phone', value)}
            placeholder="Enter your phone number"
            autoComplete="tel"
          />

          <Input
            label="Device ID"
            value={formData.deviceId}
            onChangeText={(value) => updateFormData('deviceId', value)}
            placeholder="Optional: Enter device ID"
          />

          <Input
            label="NIC (National Identity Card) *"
            value={formData.nic}
            onChangeText={(value) => updateFormData('nic', value)}
            placeholder="Enter your NIC number"
          />

          {/* Driver-Specific Fields */}
          {formData.role === 'DRIVER' && (
            <>
              <Input
                label="Route *"
                value={formData.route}
                onChangeText={(value) => updateFormData('route', value)}
                placeholder="e.g., Route 138, Colombo-Kandy"
              />

              <Input
                label="Vehicle Number *"
                value={formData.vehicleNumber}
                onChangeText={(value) => updateFormData('vehicleNumber', value)}
                placeholder="e.g., WP CAB-1234"
              />
            </>
          )}

          <Input
            label="Confirm Password *"
            type="password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text
              style={styles.link}
              onPress={() => router.push('/auth/login')}
            >
              Sign In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  form: {
    marginBottom: 40,
  },
  pickerContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  pickerOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerOptionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },
});