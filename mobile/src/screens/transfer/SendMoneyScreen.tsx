import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { offlineTransactionService, OfflineTransactionRequest } from '../../services/offline/offlineTransactionService';
import { useOffline } from '../../hooks/useOffline';
import { OfflineIndicator } from '../../components/OfflineIndicator';

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const SendMoneyScreen = () => {
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ZAR');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecipientList, setShowRecipientList] = useState(false);

  const navigation = useNavigation();

  // Mock recipients data
  const recipients: Recipient[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+27 123 456 789' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+27 987 654 321' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', phone: '+27 555 123 456' },
  ];

  const currencies = [
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
  ];

  const handleRecipientSelect = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setShowRecipientList(false);
  };

  const handleSendMoney = async () => {
    if (!selectedRecipient) {
      Alert.alert('Error', 'Please select a recipient');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Success',
        `Successfully sent ${currency} ${amount} to ${selectedRecipient.name}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setAmount('');
              setSelectedRecipient(null);
              navigation.navigate('Home' as never);
            },
          },
        ]
      );
    }, 2000);
  };

  const calculateFee = () => {
    const amountNum = parseFloat(amount) || 0;
    return Math.max(amountNum * 0.03, 0.30); // 3% fee with minimum of 0.30
  };

  const calculateTotal = () => {
    const amountNum = parseFloat(amount) || 0;
    return amountNum + calculateFee();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Send Money</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Recipient Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recipient</Text>
              <TouchableOpacity
                style={styles.recipientSelector}
                onPress={() => setShowRecipientList(!showRecipientList)}
              >
                {selectedRecipient ? (
                  <View style={styles.selectedRecipient}>
                    <View style={styles.recipientAvatar}>
                      <Text style={styles.recipientInitial}>
                        {selectedRecipient.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.recipientInfo}>
                      <Text style={styles.recipientName}>{selectedRecipient.name}</Text>
                      <Text style={styles.recipientEmail}>{selectedRecipient.email}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.placeholderRecipient}>
                    <Ionicons name="person-add-outline" size={24} color="#6B7280" />
                    <Text style={styles.placeholderText}>Select recipient</Text>
                  </View>
                )}
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>

              {showRecipientList && (
                <View style={styles.recipientList}>
                  {recipients.map((recipient) => (
                    <TouchableOpacity
                      key={recipient.id}
                      style={styles.recipientItem}
                      onPress={() => handleRecipientSelect(recipient)}
                    >
                      <View style={styles.recipientAvatar}>
                        <Text style={styles.recipientInitial}>
                          {recipient.name.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.recipientInfo}>
                        <Text style={styles.recipientName}>{recipient.name}</Text>
                        <Text style={styles.recipientEmail}>{recipient.email}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amount</Text>
              <View style={styles.amountContainer}>
                <View style={styles.currencySelector}>
                  <TouchableOpacity style={styles.currencyButton}>
                    <Text style={styles.currencyCode}>{currency}</Text>
                    <Ionicons name="chevron-down" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  fontSize={24}
                />
              </View>
            </View>

            {/* Fee Calculator */}
            {amount && parseFloat(amount) > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fee Breakdown</Text>
                <View style={styles.feeBreakdown}>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Transfer Amount</Text>
                    <Text style={styles.feeValue}>
                      {currency} {parseFloat(amount).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Transfer Fee</Text>
                    <Text style={styles.feeValue}>
                      {currency} {calculateFee().toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.feeRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>
                      {currency} {calculateTotal().toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!selectedRecipient || !amount || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMoney}
              disabled={!selectedRecipient || !amount || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="white" />
                  <Text style={styles.sendButtonText}>Send Money</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="person-add" size={20} color="#3B82F6" />
                <Text style={styles.quickActionText}>Add New Recipient</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="time" size={20} color="#3B82F6" />
                <Text style={styles.quickActionText}>Schedule Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    minHeight: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  recipientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  selectedRecipient: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeholderRecipient: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeholderText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  recipientInfo: {
    marginLeft: 12,
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  recipientEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  recipientList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  recipientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  currencySelector: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  feeBreakdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  quickActionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

export default SendMoneyScreen; 