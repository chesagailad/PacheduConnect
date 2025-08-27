import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  currency: string;
  recipient: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

const HomeScreen = () => {
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // In a real app, this would fetch from API
    setBalance(1250.50);
    setRecentTransactions([
      {
        id: '1',
        type: 'send',
        amount: 100,
        currency: 'USD',
        recipient: 'John Doe',
        status: 'completed',
        date: '2024-01-15',
      },
      {
        id: '2',
        type: 'receive',
        amount: 250,
        currency: 'ZAR',
        recipient: 'Jane Smith',
        status: 'completed',
        date: '2024-01-14',
      },
    ]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleSendMoney = () => {
    navigation.navigate('Send Money' as never);
  };

  const handleViewTransactions = () => {
    navigation.navigate('Transactions' as never);
  };

  const handleKYC = () => {
    if (user?.kycStatus === 'pending') {
      navigation.navigate('KYC' as never);
    } else {
      Alert.alert('KYC Status', `Your KYC status is: ${user?.kycStatus}`);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}!</Text>
                <Text style={styles.subtitle}>Welcome back to PacheduConnect</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Ionicons name="log-out-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(balance, 'ZAR')}
            </Text>
            <View style={styles.balanceActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSendMoney}>
                <Ionicons name="send" size={20} color="#3B82F6" />
                <Text style={styles.actionButtonText}>Send Money</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleViewTransactions}>
                <Ionicons name="list" size={20} color="#3B82F6" />
                <Text style={styles.actionButtonText}>View All</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.quickActionButton} onPress={handleSendMoney}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="send" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.quickActionText}>Send Money</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionButton} onPress={handleKYC}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="person-check" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.quickActionText}>KYC Status</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionButton}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="card" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.quickActionText}>Cards</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionButton}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="help-circle" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.quickActionText}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.recentTransactions}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={handleViewTransactions}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Ionicons
                      name={transaction.type === 'send' ? 'arrow-up' : 'arrow-down'}
                      size={20}
                      color={transaction.type === 'send' ? '#EF4444' : '#10B981'}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionRecipient}>
                      {transaction.type === 'send' ? 'To: ' : 'From: '}
                      {transaction.recipient}
                    </Text>
                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[
                      styles.transactionAmountText,
                      { color: transaction.type === 'send' ? '#EF4444' : '#10B981' }
                    ]}>
                      {transaction.type === 'send' ? '-' : '+'}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(transaction.status) }
                    ]}>
                      <Text style={styles.statusText}>{transaction.status}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No transactions yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Your recent transactions will appear here
                </Text>
              </View>
            )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    padding: 8,
  },
  balanceCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  quickActions: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  recentTransactions: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionRecipient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default HomeScreen; 