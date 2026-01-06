import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { User, Truck, Shield } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { useAuth, UserRole } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';

const roles = [
  {
    role_id: 'PASSENGER' as UserRole,
    role_name: 'Passenger',
    icon: User,
    description: 'I travel by bus',
    next_screen: '/auth/ui-preference',
  },
  {
    role_id: 'DRIVER' as UserRole,
    role_name: 'Bus Driver',
    icon: Truck,
    description: 'I drive a bus',
    next_screen: '/auth/route-selection',
  },
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const { updateUser, user } = useAuth();

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role to continue');
      return;
    }

    proceedWithRole(selectedRole);
  };

  const proceedWithRole = async (role: UserRole) => {
    setLoading(true);
    try {
      await updateUser({ role });
      
      const selectedRoleData = roles.find(r => r.role_id === role);
      if (selectedRoleData) {
        router.replace(selectedRoleData.next_screen);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select how you'll be using TransLink
          </Text>
        </View>

        <View style={styles.roleCards}>
          {roles.map((role) => {
            const IconComponent = role.icon;
            const isSelected = selectedRole === role.role_id;
            
            return (
              <TouchableOpacity
                key={role.role_id}
                style={[
                  styles.roleCard,
                  isSelected && styles.selectedRoleCard
                ]}
                onPress={() => setSelectedRole(role.role_id)}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.selectedIconContainer
                ]}>
                  <IconComponent 
                    size={32} 
                    color={isSelected ? Colors.white : Colors.primary} 
                  />
                </View>
                
                <Text style={[
                  styles.roleName,
                  isSelected && styles.selectedRoleName
                ]}>
                  {role.role_name}
                </Text>
                
                <Text style={[
                  styles.roleDescription,
                  isSelected && styles.selectedRoleDescription
                ]}>
                  {role.description}
                </Text>

                {role.note && (
                  <Text style={styles.roleNote}>
                    {role.note}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          loading={loading}
          disabled={!selectedRole}
          style={styles.continueButton}
        />
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
    paddingTop: 40,
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
    textAlign: 'center',
  },
  roleCards: {
    gap: 16,
    marginBottom: 40,
  },
  roleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedRoleCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  roleName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  selectedRoleName: {
    color: Colors.white,
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  selectedRoleDescription: {
    color: Colors.white,
    opacity: 0.9,
  },
  roleNote: {
    fontSize: 12,
    color: Colors.warning,
    fontStyle: 'italic',
    marginTop: 8,
  },
  continueButton: {
    marginTop: 'auto',
    marginBottom: 20,
  },
});