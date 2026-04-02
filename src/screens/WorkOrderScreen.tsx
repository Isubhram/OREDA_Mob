import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Dimensions, SafeAreaView } from 'react-native';
import { tenderService, Tender, WorkOrder } from '../services/tenderService';
import { workOrderService } from '../services/workOrderService';
import { authService } from '../services/authService';
import SkeletonLoader from '../components/SkeletonLoader';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const WorkOrderScreen = ({ navigation }: any) => {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalRecords, setTotalRecords] = useState(0);

    const loadWorkOrders = async () => {
        try {
            setError(null);
            
            // Get user's district for filtering
            const authData = await authService.getAuthData();
            let userDistrictId: number | undefined;
            
            // Only apply district filter if AccessLevel is NOT 'All'
            const accessLevel = authData?.UserData?.AccessLevelLabel || authData?.UserData?.AccessLevel;
            
            if (accessLevel !== 'All' && authData?.UserData?.Locations && authData.UserData.Locations.length > 0) {
                // Find primary location or just use the first one
                const primaryLoc = authData.UserData.Locations.find((l: any) => l.IsPrimary) || authData.UserData.Locations[0];
                userDistrictId = primaryLoc.DistrictId;
            }
            
            const response = await workOrderService.getWorkOrders(1, 100, userDistrictId);
            
            if (response.Data) {
                setWorkOrders(response.Data);
                setTotalRecords(response.TotalRecords || response.Data.length);
            } else {
                setWorkOrders([]);
                setTotalRecords(0);
            }
        } catch (err: any) {
            console.error('Error loading work orders:', err);
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
            setError('Failed to load work orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadWorkOrders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadWorkOrders();
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
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
                    <TouchableOpacity style={styles.retryButton} onPress={loadWorkOrders}>
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
                            <MaterialIcons name='work' size={24} color='#fff' />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Work Orders</Text>
                            <Text style={styles.headerSubtitle}>Manage and monitor all work orders</Text>
                        </View>
                    </View>
                </View>

                {/* List Section */}
                <View style={styles.listSection}>
                    <View style={styles.listHeader}>
                        <View style={styles.listHeaderLeft}>
                            <MaterialCommunityIcons name='clipboard-text-outline' size={24} color='#cc1a1f' style={styles.listTitleIcon} />
                            <Text style={styles.listTitle}>All Work Orders</Text>
                            <Text style={styles.listSubtitle}>
                                ({workOrders.length} records)
                            </Text>
                        </View>
                    </View>

                    {workOrders.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No work orders found</Text>
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
                                        <Text style={styles.tableHeaderText}>WO Number</Text>
                                    </View>
                                    <View style={[styles.col, { width: 250 }]}>
                                        <Text style={styles.tableHeaderText}>Project Name</Text>
                                    </View>
                                    <View style={[styles.col, { width: 150 }]}>
                                        <Text style={styles.tableHeaderText}>WO Date</Text>
                                    </View>
                                    <View style={[styles.col, { width: 150 }]}>
                                        <Text style={styles.tableHeaderText}>Completion Due</Text>
                                    </View>
                                    <View style={[styles.col, { width: 120 }]}>
                                        <Text style={styles.tableHeaderText}>Value (₹)</Text>
                                    </View>
                                </View>

                                {/* Table Rows */}
                                {workOrders.map((wo, index) => (
                                    <View key={`${wo.Id}-${index}`} style={styles.tableRow}>
                                        <View style={[styles.col, { width: 60 }]}>
                                            <Text style={styles.cellTextDark}>{index + 1}</Text>
                                        </View>
                                        <View style={[styles.col, { width: 160 }]}>
                                            <TouchableOpacity
                                                onPress={() => navigation?.navigate('WorkOrderDetails', { workOrderId: wo.Id })}
                                            >
                                                <Text style={[styles.cellTextDark, { color: '#dc2626', textDecorationLine: 'underline' }]}>
                                                    {wo.WONumber}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={[styles.col, { width: 250 }]}>
                                            <Text style={styles.cellTextDark} numberOfLines={2}>
                                                {wo.ProjectName}
                                            </Text>
                                        </View>
                                        <View style={[styles.col, { width: 150 }]}>
                                            <Text style={styles.cellTextGray}>{formatDate(wo.WODate)}</Text>
                                        </View>
                                        <View style={[styles.col, { width: 150 }]}>
                                            <Text style={styles.cellTextGray}>{formatDate(wo.CompletionDueDate)}</Text>
                                        </View>
                                        <View style={[styles.col, { width: 120 }]}>
                                            <Text style={styles.cellTextDark}>₹{wo.WOValue?.toLocaleString()}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eef1f5' },
    scrollView: { flex: 1 },
    scrollContent: {
        paddingHorizontal: isMobile ? 12 : 16,
        paddingBottom: 24,
        paddingTop: 8
    },
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
    listSection: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, marginBottom: 20 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
    listHeaderLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
    listTitleIcon: { marginRight: 8 },
    listTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
    listSubtitle: { fontSize: 12, color: '#6b7280', marginLeft: 6 },
    tableWrapper: { minWidth: 890 },
    tableHeaderRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fafafa' },
    tableHeaderText: { color: '#dc2626', fontSize: 11, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
    col: { paddingRight: 8 },
    cellTextDark: { color: '#1f2937', fontSize: 12, fontWeight: '500' },
    cellTextGray: { color: '#6b7280', fontSize: 12 },
    emptyContainer: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 14, color: '#9ca3af' },
});

export default WorkOrderScreen;
