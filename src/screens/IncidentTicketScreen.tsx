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
import { incidentService, IncidentTicket } from '../services/incidentService';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
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

const IncidentTicketScreen = () => {
    const [tickets, setTickets] = useState<IncidentTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const fetchTickets = async () => {
        try {
            const response = await incidentService.getIncidentTickets();
            // Safeguard to handle both full response and direct Data access if needed
            const data = (response as any).Data || response;
            setTickets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTickets();
    };

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const subject = ticket.Subject || '';
            const ticketNumber = ticket.TicketNumber || '';
            const projectName = ticket.ProjectName || '';
            const reasonCategory = ticket.ReasonCategory || '';
            const status = ticket.Status || '';

            const matchesSearch = 
                ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                reasonCategory.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesFilter = activeFilter === 'all' || 
                status.toLowerCase().replace(/\s/g, '') === activeFilter.toLowerCase();
            
            return matchesSearch && matchesFilter;
        });
    }, [tickets, searchQuery, activeFilter]);

    const getStatusStyles = (status: string) => {
        const s = status.toLowerCase().replace(/\s/g, '');
        switch (s) {
            case 'open': return { bg: '#fee2e2', text: '#ef4444' };
            case 'inprogress': return { bg: '#ffedd5', text: '#f59e0b' };
            case 'closed': return { bg: '#d1fae5', text: '#10b981' };
            default: return { bg: '#f1f5f9', text: '#64748b' };
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short'
        });
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.topHeader}>
                <View>
                    <Text style={styles.title}>Incidents</Text>
                    <Text style={styles.subtitle}>{filteredTickets.length} active issues</Text>
                </View>
                <TouchableOpacity style={styles.notificationBtn}>
                    <Feather name="bell" size={20} color="#1e293b" />
                    <View style={styles.dot} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Feather name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search tickets, subjects..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

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
        </View>
    );

    const renderTicketCard = ({ item: ticket }: { item: IncidentTicket }) => {
        const { bg, text } = getStatusStyles(ticket.Status);
        
        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
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

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="ticket-confirmation-outline" size={40} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No tickets found</Text>
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
                renderItem={renderTicketCard}
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
        marginBottom: 20
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
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8'
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

export default IncidentTicketScreen;
