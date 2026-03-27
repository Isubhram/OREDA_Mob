import React, { useEffect, useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    RefreshControl, 
    TextInput, 
    Dimensions,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { maintenanceService, IncidentTicket, ScheduleTicket } from '../services/maintenanceService';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import SkeletonLoader from '../components/SkeletonLoader';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding and margin

const STATUS_FILTERS = [
    { id: 'all', label: 'All', color: '#64748b' },
    { id: 'open', label: 'Open', color: '#ef4444' },
    { id: 'inprogress', label: 'In Progress', color: '#f59e0b' },
    { id: 'closed', label: 'Closed', color: '#10b981' },
];

import { useNavigation } from '@react-navigation/native';

const MaintenanceScreen = () => {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<'Incident' | 'Schedule'>('Incident');
    const [incidentTickets, setIncidentTickets] = useState<IncidentTicket[]>([]);
    const [scheduleTickets, setScheduleTickets] = useState<ScheduleTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'Incident') {
                const response = await maintenanceService.getIncidentTickets();
                const data = (response as any).Data || response;
                setIncidentTickets(Array.isArray(data) ? data : []);
            } else {
                const response = await maintenanceService.getScheduleTickets();
                const data = (response as any).Data || response;
                setScheduleTickets(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error(`Error loading ${activeTab} tickets:`, error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setSearchQuery('');
        setActiveFilter('all');
        fetchData();
    }, [activeTab]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const filteredTickets = useMemo(() => {
        const currentTickets = activeTab === 'Incident' ? incidentTickets : (scheduleTickets as any[]);
        
        return currentTickets.filter(ticket => {
            const ticketNumber = ticket.TicketNumber || '';
            const status = ticket.Status || '';
            const searchLower = searchQuery.toLowerCase();

            let matchesSearch = false;
            if (activeTab === 'Incident') {
                const subject = ticket.Subject || '';
                const projectName = ticket.ProjectName || '';
                const reasonCategory = ticket.ReasonCategory || '';
                matchesSearch = 
                    ticketNumber.toLowerCase().includes(searchLower) ||
                    subject.toLowerCase().includes(searchLower) ||
                    projectName.toLowerCase().includes(searchLower) ||
                    reasonCategory.toLowerCase().includes(searchLower);
            } else {
                const assetName = ticket.AssetName || '';
                const vendorName = ticket.VendorCompanyName || '';
                const beneficiaryName = ticket.BeneficiaryName || '';
                const location = ticket.InstallationLocation || '';
                matchesSearch = 
                    ticketNumber.toLowerCase().includes(searchLower) ||
                    assetName.toLowerCase().includes(searchLower) ||
                    vendorName.toLowerCase().includes(searchLower) ||
                    beneficiaryName.toLowerCase().includes(searchLower) ||
                    location.toLowerCase().includes(searchLower);
            }
            
            const matchesFilter = activeFilter === 'all' || 
                status.toLowerCase().replace(/\s/g, '') === activeFilter.toLowerCase();
            
            return matchesSearch && matchesFilter;
        });
    }, [activeTab, incidentTickets, scheduleTickets, searchQuery, activeFilter]);

    const getStatusStyles = (status: string) => {
        const s = (status || '').toLowerCase().replace(/\s/g, '');
        switch (s) {
            case 'open':
            case 'created': return { bg: '#fee2e2', text: '#ef4444' };
            case 'inprogress': return { bg: '#ffedd5', text: '#f59e0b' };
            case 'closed':
            case 'resolved': return { bg: '#d1fae5', text: '#10b981' };
            case 'rejected': return { bg: '#f1f5f9', text: '#64748b' };
            default: return { bg: '#f1f5f9', text: '#64748b' };
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.topHeader}>
                <View>
                    <Text style={styles.title}>Maintenance</Text>
                    <Text style={styles.subtitle}>
                        {activeTab === 'Incident' 
                            ? `${filteredTickets.length} Incident Tickets` 
                            : `${filteredTickets.length} Scheduled Maintenance`}
                    </Text>
                </View>
                <TouchableOpacity style={styles.notificationBtn}>
                    <Feather name="bell" size={20} color="#1e293b" />
                    <View style={styles.dot} />
                </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'Incident' && styles.activeTab]} 
                    onPress={() => setActiveTab('Incident')}
                >
                    <MaterialCommunityIcons 
                        name="alert-octagon-outline" 
                        size={18} 
                        color={activeTab === 'Incident' ? '#fff' : '#64748b'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'Incident' && styles.activeTabText]}>Incidents</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'Schedule' && styles.activeTab]} 
                    onPress={() => setActiveTab('Schedule')}
                >
                    <MaterialCommunityIcons 
                        name="calendar-clock" 
                        size={18} 
                        color={activeTab === 'Schedule' ? '#fff' : '#64748b'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'Schedule' && styles.activeTabText]}>Schedules</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Feather name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={activeTab === 'Incident' ? "Search incidents..." : "Search schedules..."}
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {activeTab === 'Incident' && (
                <View style={styles.filterWrapper}>
                    <FlatList
                        data={STATUS_FILTERS}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.filterList}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[
                                    styles.filterChip,
                                    activeFilter === item.id && { backgroundColor: item.color }
                                ]}
                                onPress={() => setActiveFilter(item.id)}
                            >
                                <Text style={[
                                    styles.filterLabel,
                                    activeFilter === item.id && styles.filterLabelActive
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>
    );

    const renderIncidentCard = (ticket: IncidentTicket) => {
        const { bg, text } = getStatusStyles(ticket.Status);
        
        return (
            <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('IncidentDetail', { ticketId: ticket.Id })}
            >
                <View style={styles.cardTop}>
                    <View style={styles.tagRow}>
                        <View style={[styles.statusTag, { backgroundColor: bg }]}>
                            <Text style={[styles.statusTagText, { color: text }]}>{ticket.Status}</Text>
                        </View>
                        {ticket.ReasonCategory && (
                            <View style={styles.categoryTag}>
                                <Text style={styles.categoryTagText}>{ticket.ReasonCategory}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.dateTag}>{formatDate(ticket.CreatedOn)}</Text>
                </View>

                <Text style={styles.ticketSubject} numberOfLines={2}>
                    {ticket.Subject}
                </Text>

                <View style={styles.projectWrapper}>
                    <Feather name="briefcase" size={12} color="#94a3b8" />
                    <Text style={styles.projectName} numberOfLines={1}>{ticket.ProjectName}</Text>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.ticketId}>#{ticket.TicketNumber.split('-').pop()}</Text>
                    <View style={styles.moreIconBox}>
                        <Feather name="arrow-right" size={14} color="#fff" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderScheduleCard = (ticket: ScheduleTicket) => {
        const { bg, text } = getStatusStyles(ticket.Status);
        
        return (
            <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('MaintenanceDetail', { ticketId: ticket.Id })}
            >
                <View style={styles.cardTop}>
                    <View style={styles.tagRow}>
                        <View style={[styles.statusTag, { backgroundColor: bg }]}>
                            <Text style={[styles.statusTagText, { color: text }]}>{ticket.Status}</Text>
                        </View>
                        <View style={styles.categoryTag}>
                            <Text style={styles.categoryTagText}>{ticket.AssetName}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.scheduleInfo}>
                    <View style={styles.scheduleRow}>
                        <Feather name="calendar" size={12} color="#c1272d" />
                        <Text style={styles.scheduleDate}>{formatDate(ticket.ScheduledMaintenanceDate)}</Text>
                    </View>
                    
                    <View style={styles.vendorRow}>
                        <Feather name="user" size={12} color="#64748b" />
                        <Text style={styles.vendorName} numberOfLines={1}>{ticket.VendorCompanyName || 'No Vendor'}</Text>
                    </View>

                    <Text style={styles.beneficiaryName} numberOfLines={1}>{ticket.BeneficiaryName}</Text>
                    
                    <View style={styles.locationRow}>
                        <Feather name="map-pin" size={12} color="#94a3b8" />
                        <Text style={styles.locationText} numberOfLines={2}>{ticket.InstallationLocation}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.ticketId}>{ticket.TicketNumber}</Text>
                    <View style={[styles.moreIconBox, { backgroundColor: '#3b82f6' }]}>
                        <Feather name="chevron-right" size={14} color="#fff" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="ticket-confirmation-outline" size={40} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()}s found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            <TouchableOpacity 
                style={styles.resetBtn}
                onPress={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                }}
            >
                <Text style={styles.resetBtnText}>Clear Filters</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.loadingWrapper}>
                    {renderHeader()}
                    <View style={styles.skeletonGrid}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <View key={i} style={styles.skeletonCard}>
                                <SkeletonLoader variant="card" height={160} borderRadius={20} />
                            </View>
                        ))}
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
            <FlatList
                data={filteredTickets}
                renderItem={({ item }) => (activeTab === 'Incident' ? renderIncidentCard(item as IncidentTicket) : renderScheduleCard(item as ScheduleTicket))}
                keyExtractor={item => item.Id.toString()}
                numColumns={2}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        colors={['#c1272d']}
                        tintColor="#c1272d"
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8fafc' 
    },
    loadingWrapper: {
        flex: 1,
        paddingHorizontal: 16
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: '#f8fafc',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    title: { 
        fontSize: 28, 
        fontWeight: '800', 
        color: '#0f172a',
        letterSpacing: -0.5
    },
    subtitle: { 
        fontSize: 14, 
        color: '#64748b', 
        marginTop: 2,
        fontWeight: '500'
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    dot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        borderWidth: 2,
        borderColor: '#fff'
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
        gap: 4
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8
    },
    activeTab: {
        backgroundColor: '#c1272d',
        elevation: 2,
        shadowColor: '#c1272d',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b'
    },
    activeTabText: {
        color: '#fff'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 52,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    searchIcon: {
        marginRight: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500'
    },
    filterWrapper: {
        marginHorizontal: -16,
        marginBottom: 8
    },
    filterList: {
        paddingHorizontal: 16,
        paddingBottom: 4
    },
    filterChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: '#fff',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b'
    },
    filterLabelActive: {
        color: '#fff'
    },
    listContent: { 
        paddingBottom: 24 
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 16
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 14,
        width: CARD_WIDTH,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    tagRow: {
        flexDirection: 'column',
        gap: 4,
        flex: 1,
        marginRight: 4
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start'
    },
    categoryTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#f1f5f9',
        alignSelf: 'flex-start'
    },
    categoryTagText: {
        fontSize: 9,
        color: '#64748b',
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    statusTagText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    dateTag: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600'
    },
    ticketSubject: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
        lineHeight: 20,
        height: 40, // Fixed height for 2 lines
        marginBottom: 8
    },
    scheduleInfo: {
        gap: 8,
        marginBottom: 12
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    vendorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2
    },
    vendorName: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600'
    },
    scheduleDate: {
        fontSize: 12,
        fontWeight: '700',
        color: '#c1272d'
    },
    beneficiaryName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b'
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4
    },
    locationText: {
        fontSize: 10,
        color: '#64748b',
        flex: 1,
        lineHeight: 14
    },
    projectWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12
    },
    projectName: {
        fontSize: 12,
        color: '#64748b',
        flex: 1,
        fontWeight: '500'
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9'
    },
    ticketId: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#94a3b8',
        flex: 1,
        marginRight: 4
    },
    moreIconBox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#c1272d',
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyContainer: {
        paddingTop: 60,
        alignItems: 'center',
        paddingHorizontal: 40
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24
    },
    resetBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    resetBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b'
    },
    skeletonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10
    },
    skeletonCard: {
        width: CARD_WIDTH,
        height: 160,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden'
    }
});

export default MaintenanceScreen;
