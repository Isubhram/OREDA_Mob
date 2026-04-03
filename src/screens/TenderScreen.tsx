import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, RefreshControl, Dimensions, SafeAreaView
} from 'react-native';
import { tenderService, Tender } from '../services/tenderService';
import SkeletonLoader from '../components/SkeletonLoader';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const TenderScreen = ({ navigation }: any) => {
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalRecords, setTotalRecords] = useState(0);

    const loadTenders = async () => {
        try {
            setError(null);
            const response = await tenderService.getTenders(1, 25);
            setTenders(response.Data || []);
            setTotalRecords(response.TotalRecords || 0);
        } catch (err: any) {
            console.error('Error loading tenders:', err);
            if (err?.statusCode === 401) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    {
                        text: 'OK',
                        onPress: () => {
                            const { authService } = require('../services/authService');
                            authService.clearAuthData();
                            navigation?.replace('Login');
                        },
                    },
                ]);
                return;
            }
            setError('Failed to load tenders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadTenders(); }, []);
    const onRefresh = () => { setRefreshing(true); loadTenders(); };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return `${date.getDate().toString().padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        } catch { return dateString; }
    };

    const isExpired = (endDate: string) => {
        try { return new Date(endDate) < new Date(); } catch { return false; }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <SkeletonLoader variant="card" count={4} />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#dc2626" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadTenders}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.headerWrapper}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerIconBox}>
                            <MaterialIcons name='description' size={20} color='#fff' />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Tenders</Text>
                            <Text style={styles.headerSubtitle}>{totalRecords} total records</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.btnSearch}>
                        <Feather name='search' size={14} color='#f97316' />
                        <Text style={styles.btnSearchText}>Search</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Strip */}
                <View style={styles.statsStrip}>
                    <View style={styles.statChip}>
                        <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
                        <Text style={styles.statChipText}>{tenders.filter(t => !isExpired(t.TenderEndDate)).length} Active</Text>
                    </View>
                    <View style={styles.statChip}>
                        <View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
                        <Text style={styles.statChipText}>{tenders.filter(t => isExpired(t.TenderEndDate)).length} Expired</Text>
                    </View>
                    <View style={styles.statChip}>
                        <View style={[styles.statDot, { backgroundColor: '#3b82f6' }]} />
                        <Text style={styles.statChipText}>{tenders.length} Shown</Text>
                    </View>
                </View>

                {/* Card List */}
                {tenders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="file-search-outline" size={52} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No tenders found</Text>
                    </View>
                ) : (
                    tenders.map((tender, index) => {
                        const expired = isExpired(tender.TenderEndDate);
                        return (
                            <TouchableOpacity
                                key={tender.Id}
                                style={styles.card}
                                activeOpacity={0.85}
                                onPress={() => navigation?.navigate('TenderDetails', { tenderId: tender.Id })}
                            >
                                {/* Card accent bar */}
                                <View style={[styles.cardAccent, { backgroundColor: expired ? '#ef4444' : '#10b981' }]} />

                                <View style={styles.cardBody}>
                                    {/* Top row */}
                                    <View style={styles.cardTopRow}>
                                        <View style={styles.cardNumberWrap}>
                                            <Text style={styles.cardIndex}>#{index + 1}</Text>
                                            <Text style={styles.cardNumber}>{tender.TenderNumber}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: expired ? '#fee2e2' : '#dcfce7' }]}>
                                            <Text style={[styles.statusBadgeText, { color: expired ? '#b91c1c' : '#15803d' }]}>
                                                {expired ? 'Expired' : 'Active'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Project name */}
                                    <Text style={styles.cardProjectName} numberOfLines={2}>{tender.ProjectName}</Text>

                                    {/* Date row */}
                                    <View style={styles.cardMetaRow}>
                                        <View style={styles.cardMeta}>
                                            <Feather name="play-circle" size={11} color="#10b981" />
                                            <Text style={styles.cardMetaLabel}>Start</Text>
                                            <Text style={styles.cardMetaValue}>{formatDate(tender.TenderStartDate)}</Text>
                                        </View>
                                        <View style={styles.metaDivider} />
                                        <View style={styles.cardMeta}>
                                            <Feather name="stop-circle" size={11} color="#ef4444" />
                                            <Text style={styles.cardMetaLabel}>End</Text>
                                            <Text style={styles.cardMetaValue}>{formatDate(tender.TenderEndDate)}</Text>
                                        </View>
                                        <View style={styles.cardArrow}>
                                            <Feather name="chevron-right" size={18} color="#94a3b8" />
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}

                {tenders.length > 0 && (
                    <Text style={styles.footerText}>Showing {tenders.length} of {totalRecords} tenders</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 14, paddingBottom: 24, paddingTop: 8 },
    loadingContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 14 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
    errorText: { fontSize: 14, color: '#dc2626', textAlign: 'center' },
    retryButton: { backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    // Header
    headerWrapper: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12, marginTop: 4,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIconBox: {
        backgroundColor: '#dc2626', width: 36, height: 36,
        borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
    headerSubtitle: { fontSize: 11, color: '#64748b' },
    btnSearch: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#fed7aa',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    },
    btnSearchText: { color: '#ea580c', fontWeight: '700', fontSize: 12 },

    // Stats strip
    statsStrip: {
        flexDirection: 'row', gap: 8, marginBottom: 14,
    },
    statChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0',
    },
    statDot: { width: 7, height: 7, borderRadius: 4 },
    statChipText: { fontSize: 11, color: '#374151', fontWeight: '600' },

    // Cards
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 10,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    cardAccent: { width: 4, borderRadius: 0 },
    cardBody: { flex: 1, padding: 12 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardNumberWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    cardIndex: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
    cardNumber: { fontSize: 13, fontWeight: '800', color: '#1e40af' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    statusBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    cardProjectName: { fontSize: 13, color: '#1e293b', fontWeight: '600', marginBottom: 8, lineHeight: 18 },
    cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardMetaLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
    cardMetaValue: { fontSize: 11, color: '#475569', fontWeight: '500' },
    metaDivider: { width: 1, height: 14, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
    cardArrow: { marginLeft: 'auto' },

    emptyContainer: { paddingVertical: 48, alignItems: 'center', gap: 10 },
    emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
    footerText: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 4 },
});

export default TenderScreen;
