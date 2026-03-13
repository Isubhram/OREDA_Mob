import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/DrawerNavigator';
import SkeletonLoader from '../components/SkeletonLoader';
import { MaterialCommunityIcons, Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

const MAINTENANCE_DATA = [
    {
        id: '1',
        project: 'Solar Cold Storage - Puri',
        type: 'Routine Checkup',
        date: '15 Mar 2026',
        status: 'Scheduled',
        vendor: 'Ranjita Nayak'
    },
    {
        id: '2',
        project: 'Bhubaneswar Smart Light',
        type: 'Repair & Replacement',
        date: '18 Mar 2026',
        status: 'Pending',
        vendor: 'Tech Solutions Ltd'
    },
    {
        id: '3',
        project: 'Ganjam Solar Pump',
        type: 'Panel Cleaning',
        date: '20 Mar 2026',
        status: 'Scheduled',
        vendor: 'Green Energy Corp'
    }
];

const DashboardScreen = () => {
    const navigation = useNavigation<any>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const QuickStat = ({ label, value, icon, color, subtitle }: any) => (
        <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={24} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
                {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
            </View>
        </View>
    );

    const MaintenanceCard = ({ item }: { item: typeof MAINTENANCE_DATA[0] }) => (
        <TouchableOpacity style={styles.maintenanceCard} activeOpacity={0.7}>
            <View style={styles.mCardHeader}>
                <View style={[styles.mStatusTag, { backgroundColor: item.status === 'Scheduled' ? '#dcfce7' : '#fef9c3' }]}>
                    <Text style={[styles.mStatusText, { color: item.status === 'Scheduled' ? '#166534' : '#854d0e' }]}>{item.status}</Text>
                </View>
                <Text style={styles.mDate}>{item.date}</Text>
            </View>
            <Text style={styles.mProject} numberOfLines={1}>{item.project}</Text>
            <Text style={styles.mType}>{item.type}</Text>
            <View style={styles.mFooter}>
                <Feather name="user" size={12} color="#94a3b8" />
                <Text style={styles.mVendor}>{item.vendor}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['#c1272d', '#8b1a1a']}
                    style={styles.welcomeBanner}
                >
                    <View>
                        <Text style={styles.welcomeTitle}>Welcome Back!</Text>
                        <Text style={styles.welcomeSubtitle}>Here's what's happening today.</Text>
                    </View>
                    <View style={styles.headerIconWrapper}>
                        <MaterialCommunityIcons name="view-dashboard-variant" size={40} color="rgba(255,255,255,0.2)" />
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    <Text style={styles.sectionHeader}>Operational Overview</Text>
                    
                    <View style={styles.statsGrid}>
                        <QuickStat 
                            label="Total Projects" 
                            value="42" 
                            icon="briefcase-outline" 
                            color="#3b82f6" 
                            subtitle="+3 this month"
                        />
                        <QuickStat 
                            label="Incident Tickets" 
                            value="12" 
                            icon="ticket-outline" 
                            color="#ef4444" 
                            subtitle="4 pending review"
                        />
                        <QuickStat 
                            label="Active Tenders" 
                            value="08" 
                            icon="file-document-outline" 
                            color="#f59e0b" 
                            subtitle="2 ending soon"
                        />
                        <QuickStat 
                            label="Vendors" 
                            value="156" 
                            icon="account-group-outline" 
                            color="#10b981" 
                            subtitle="Across 12 districts"
                        />
                    </View>

                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeader}>Maintenance Schedule</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.maintenanceList}
                        decelerationRate="fast"
                        snapToInterval={CARD_WIDTH + 16}
                    >
                        {MAINTENANCE_DATA.map(item => (
                            <MaintenanceCard key={item.id} item={item} />
                        ))}
                    </ScrollView>

                    <Text style={styles.sectionHeader}>Quick Actions</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('IncidentTicket')}
                        >
                            <LinearGradient colors={['#fff', '#f8fafc']} style={styles.actionGradient}>
                                <MaterialIcons name="report-problem" size={24} color="#ef4444" />
                                <Text style={styles.actionText}>View Tickets</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('Tender')}
                        >
                            <LinearGradient colors={['#fff', '#f8fafc']} style={styles.actionGradient}>
                                <MaterialCommunityIcons name="file-search" size={24} color="#f59e0b" />
                                <Text style={styles.actionText}>Tender Watch</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.announcementCard}>
                        <View style={styles.announcementIcon}>
                            <Feather name="bell" size={20} color="#c1272d" />
                        </View>
                        <View style={styles.announcementContent}>
                            <Text style={styles.announcementTitle}>System Maintenance</Text>
                            <Text style={styles.announcementText}>The portal will be offline for maintenance on Sunday from 2 AM to 4 AM.</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    welcomeBanner: {
        padding: 24,
        paddingTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    headerIconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
        marginTop: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    statCard: {
        backgroundColor: '#fff',
        width: (width - 56) / 2,
        padding: 16,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    statIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statContent: {},
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 2,
    },
    statSubtitle: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 4,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionCard: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    actionGradient: {
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    announcementCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#c1272d',
        gap: 12,
        alignItems: 'center',
    },
    announcementIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    announcementContent: {
        flex: 1,
    },
    announcementTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    announcementText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    viewAllText: {
        fontSize: 13,
        color: '#c1272d',
        fontWeight: '600',
    },
    maintenanceList: {
        paddingBottom: 8,
        paddingRight: 20,
    },
    maintenanceCard: {
        backgroundColor: '#fff',
        width: CARD_WIDTH,
        padding: 16,
        borderRadius: 20,
        marginRight: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    mCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    mStatusTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    mStatusText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    mDate: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
    },
    mProject: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    mType: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
    },
    mFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    mVendor: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    }
});

export default DashboardScreen;
