import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tenderService, Tender } from '../services/tenderService';
import SkeletonLoader from '../components/SkeletonLoader';
import { MaterialIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

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

    useEffect(() => {
        loadTenders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadTenders();
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const day = date.getDate().toString().padStart(2, '0');
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            return `${day} ${month} ${year}`;
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <SkeletonLoader />
                    <SkeletonLoader />
                    <SkeletonLoader />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
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
            >
                {/* Header Actions */}
                <View style={styles.headerWrapper}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerIconBox}>
                            <MaterialIcons name='description' size={24} color='#fff' />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Tenders Management</Text>
                            <Text style={styles.headerSubtitle}>Manage and monitor tenders</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.btnSearch}>
                            <Feather name='search' size={16} color='#f97316' />
                            <Text style={styles.btnSearchText}>Search Tenders</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* List Section */}
                <View style={styles.listSection}>
                    <View style={styles.listHeader}>
                        <View style={styles.listHeaderLeft}>
                            <MaterialIcons name='assignment' size={24} color='#cc1a1f' style={styles.listTitleIcon} />
                            <Text style={styles.listTitle}>Tenders List</Text>
                            <Text style={styles.listSubtitle}>
                                ({tenders.length} of {totalRecords} tenders)
                            </Text>
                        </View>
                        <View style={styles.viewToggleGroup}>
                            <TouchableOpacity style={styles.toggleBtnActive}>
                                <MaterialIcons name='format-list-bulleted' size={18} color='#fff' />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toggleBtnInactive}>
                                <MaterialIcons name='grid-view' size={18} color='#6b7280' />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {tenders.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No tenders found</Text>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator>
                            <View style={styles.tableWrapper}>
                                {/* Table Header */}
                                <View style={styles.tableHeaderRow}>
                                    <View style={[styles.col, { width: 60 }]}>
                                        <Text style={styles.tableHeaderText}>Sl.No</Text>
                                    </View>
                                    <View style={[styles.col, { width: 160 }]}>
                                        <Text style={styles.tableHeaderText}>Tender Number</Text>
                                    </View>
                                    <View style={[styles.col, { width: 250 }]}>
                                        <Text style={styles.tableHeaderText}>Project Name</Text>
                                    </View>
                                    <View style={[styles.col, { width: 150 }]}>
                                        <Text style={styles.tableHeaderText}>Start Date</Text>
                                    </View>
                                    <View style={[styles.col, { width: 150 }]}>
                                        <Text style={styles.tableHeaderText}>End Date</Text>
                                    </View>
                                    <View style={[styles.col, { width: 120 }]}>
                                        <Text style={styles.tableHeaderText}>Action</Text>
                                    </View>
                                </View>

                                {/* Table Rows */}
                                {tenders.map((tender, index) => (
                                    <View key={tender.Id} style={styles.tableRow}>
                                        <View style={[styles.col, { width: 60 }]}>
                                            <Text style={styles.cellTextDark}>{index + 1}</Text>
                                        </View>
                                        <View style={[styles.col, { width: 160 }]}>
                                            <Text style={styles.cellTextDark}>{tender.TenderNumber}</Text>
                                        </View>
                                        <View style={[styles.col, { width: 250 }]}>
                                            <Text style={styles.cellTextDark} numberOfLines={2}>
                                                {tender.ProjectName}
                                            </Text>
                                        </View>
                                        <View style={[styles.col, { width: 150 }]}>
                                            <Text style={styles.cellTextGray}>{formatDate(tender.TenderStartDate)}</Text>
                                        </View>
                                        <View style={[styles.col, { width: 150 }]}>
                                            <Text style={styles.cellTextGray}>{formatDate(tender.TenderEndDate)}</Text>
                                        </View>
                                        <View style={[styles.col, { width: 120, flexDirection: 'row', gap: 8 }]}>
                                            <TouchableOpacity
                                                style={styles.actionBtnView}
                                                onPress={() => navigation?.navigate('TenderDetails', { tenderId: tender.Id })}
                                            >
                                                <Feather name='eye' size={14} color='#dc2626' />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )}

                    {/* Pagination - Simplified for now */}
                    {tenders.length > 0 && (
                        <View style={styles.paginationWrapper}>
                            <Text style={styles.paginationText}>
                                1-{tenders.length} of {totalRecords}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eef1f5' },
    scrollView: { flex: 1 },
    scrollContent: { padding: isMobile ? 8 : 16, paddingBottom: 24 },
    loadingContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    errorText: { fontSize: 16, color: '#dc2626', textAlign: 'center', marginBottom: 20 },
    retryButton: { backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4 },
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerWrapper: { flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 20, gap: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
    headerIconBox: { backgroundColor: '#dc2626', width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#6b7280' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: isMobile ? 'stretch' : 'auto' },
    btnSearch: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8, minWidth: 120 },
    btnSearchText: { color: '#ea580c', marginLeft: 6, fontWeight: '600', fontSize: 12 },
    btnAdd: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#fecaca', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8, minWidth: 120 },
    btnAddText: { color: '#dc2626', marginLeft: 6, fontWeight: '600', fontSize: 12 },
    listSection: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, marginBottom: 20 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
    listHeaderLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
    listTitleIcon: { marginRight: 8 },
    listTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
    listSubtitle: { fontSize: 12, color: '#6b7280', marginLeft: 6 },
    viewToggleGroup: { flexDirection: 'row', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden' },
    toggleBtnActive: { backgroundColor: '#dc2626', padding: 4 },
    toggleBtnInactive: { backgroundColor: '#fff', padding: 4 },
    tableWrapper: { minWidth: 900 },
    tableHeaderRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fafafa' },
    tableHeaderText: { color: '#dc2626', fontSize: 11, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
    col: { paddingRight: 8 },
    cellTextDark: { color: '#1f2937', fontSize: 12, fontWeight: '500' },
    cellTextGray: { color: '#6b7280', fontSize: 12 },
    actionBtnView: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#fca5a5', justifyContent: 'center', alignItems: 'center' },
    actionBtnEdit: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#fed7aa', justifyContent: 'center', alignItems: 'center' },
    actionBtnDelete: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#fecaca', justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 14, color: '#9ca3af' },
    paginationWrapper: { paddingHorizontal: 16, paddingTop: 16, alignItems: 'flex-end' },
    paginationText: { fontSize: 12, color: '#6b7280' },
});

export default TenderScreen;
