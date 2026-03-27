import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    Dimensions, 
    Alert, 
    StatusBar, 
    TextInput,
    Modal
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { maintenanceService, MaintenanceDetailResponse } from '../services/maintenanceService';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const MaintenanceDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { ticketId } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<MaintenanceDetailResponse['Data'] | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Actions State
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [remarks, setRemarks] = useState('');

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const response = await maintenanceService.getTicketDetails(ticketId);
            setData(response.Data);
        } catch (error) {
            console.error('Error fetching ticket details:', error);
            Alert.alert('Error', 'Failed to load ticket details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ticketId) fetchDetails();
    }, [ticketId]);

    const handleResolve = () => {
        Alert.alert(
            'Resolve Ticket',
            'Are you sure you want to resolve this maintenance ticket?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Resolve', 
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            await maintenanceService.resolveTicket(ticketId, { remarks: remarks || 'Resolved' });
                            Alert.alert('Success', 'Ticket resolved successfully');
                            fetchDetails();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to resolve ticket');
                        } finally {
                            setActionLoading(false);
                        }
                    } 
                }
            ]
        );
    };

    const handleRejectSubmit = async () => {
        if (!remarks.trim()) {
            Alert.alert('Required', 'Remarks are mandatory for rejection');
            return;
        }

        try {
            setActionLoading(true);
            await maintenanceService.rejectTicket(ticketId, remarks);
            setRejectModalVisible(false);
            setRemarks('');
            Alert.alert('Success', 'Ticket rejected successfully');
            fetchDetails();
        } catch (error) {
            Alert.alert('Error', 'Failed to reject ticket');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('approve') || s.includes('resolved')) return '#10b981';
        if (s.includes('reject')) return '#ef4444';
        if (s.includes('inprogress') || s.includes('created')) return '#3b82f6';
        return '#64748b';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#c1272d" />
                <Text style={styles.loadingText}>Fetching details...</Text>
            </View>
        );
    }

    if (!data) return null;

    const { Ticket, Schedule, Maintenance, ApplicableProtocols } = data;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <LinearGradient colors={['#8b1a1a', '#c1272d']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ticket Detail</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.headerContent}>
                    <View style={styles.ticketBadge}>
                        <Text style={styles.ticketNumber}>{Ticket.TicketNumber}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(Ticket.Status) + '20', borderColor: getStatusColor(Ticket.Status) }]}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(Ticket.Status) }]} />
                            <Text style={[styles.statusText, { color: getStatusColor(Ticket.Status) }]}>{Ticket.Status.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* Information Cards Row */}
                <View style={[styles.section, { marginTop: -30, elevation: 5, shadowOpacity: 0.1 }]}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>MAINTENANCE DATE</Text>
                            <View style={styles.infoValueRow}>
                                <Feather name="calendar" size={14} color="#64748b" />
                                <Text style={styles.infoValue}>{formatDate(Ticket.ScheduledMaintenanceDate)}</Text>
                            </View>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>STATUS</Text>
                            <Text style={[styles.infoValue, { color: getStatusColor(Ticket.Status) }]}>{Ticket.Status}</Text>
                        </View>
                    </View>
                </View>

                {/* Maintenance Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="tools" size={18} color="#c1272d" />
                        <Text style={styles.sectionTitle}>Maintenance Info</Text>
                    </View>
                    <Text style={styles.maintenanceTitle}>{Maintenance.Title}</Text>
                    
                    <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Asset ID</Text>
                            <Text style={styles.detailValue}>#{Maintenance.AssetId}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Period</Text>
                            <Text style={styles.detailValue}>{Maintenance.Period || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Schedule Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Feather name="clock" size={18} color="#c1272d" />
                        <Text style={styles.sectionTitle}>Schedule Schedule</Text>
                    </View>
                    <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Start Date</Text>
                            <Text style={styles.detailValue}>{formatDate(Schedule.MaintenanceStartDate)}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>End Date</Text>
                            <Text style={styles.detailValue}>{formatDate(Schedule.MaintenanceEndDate)}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Next Due</Text>
                            <Text style={[styles.detailValue, { color: '#ef4444' }]}>{formatDate(Schedule.NextDueDate)}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Window</Text>
                            <Text style={styles.detailValue}>{Schedule.DueDateWindowFromDays} - {Schedule.DueDateWindowToDays} days</Text>
                        </View>
                    </View>
                </View>

                {/* Protocols Section */}
                {ApplicableProtocols && ApplicableProtocols.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Feather name="list" size={18} color="#c1272d" />
                            <Text style={styles.sectionTitle}>Applicable Protocols</Text>
                        </View>
                        {ApplicableProtocols.map((protocol, index) => (
                            <View key={protocol.Id} style={[styles.protocolItem, index === ApplicableProtocols.length - 1 && { borderBottomWidth: 0 }]}>
                                <View style={styles.protocolMain}>
                                    <Text style={styles.protocolSl}>#{protocol.SlNo}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.protocolName}>{protocol.TaskName}</Text>
                                        <Text style={styles.protocolCategory}>{protocol.ComponentCategoryName}</Text>
                                    </View>
                                </View>
                                <View style={styles.protocolTypes}>
                                    {protocol.Quarterly && <View style={styles.typeBadge}><Text style={styles.typeText}>Q</Text></View>}
                                    {protocol.HalfYearly && <View style={styles.typeBadge}><Text style={styles.typeText}>HY</Text></View>}
                                    {protocol.Annually && <View style={styles.typeBadge}><Text style={styles.typeText}>A</Text></View>}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Floating Action Buttons or Finalised State */}
            {Ticket.Status.toLowerCase() === 'resolved' ? (
                <View style={[styles.footer, styles.finalisedFooter]}>
                    <View style={styles.finalisedBadge}>
                        <MaterialCommunityIcons name="check-decagram" size={24} color="#10b981" />
                        <View>
                            <Text style={styles.finalisedTitle}>Action Finalised</Text>
                            <Text style={styles.finalisedSubtitle}>This maintenance ticket has been resolved.</Text>
                        </View>
                    </View>
                </View>
            ) : Ticket.Status.toLowerCase() !== 'rejected' && (
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.rejectBtn]} 
                        onPress={() => setRejectModalVisible(true)}
                        disabled={actionLoading}
                    >
                        <Feather name="x-circle" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>REJECT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.resolveBtn]} 
                        onPress={handleResolve}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Feather name="check-circle" size={18} color="#fff" />
                                <Text style={styles.actionBtnText}>RESOLVE</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Rejection Modal */}
            <Modal
                transparent
                visible={rejectModalVisible}
                animationType="fade"
                onRequestClose={() => setRejectModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Reject Ticket</Text>
                            <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Reason for Rejection <Text style={{ color: '#ef4444' }}>*</Text></Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Enter rejection remarks..."
                                multiline
                                numberOfLines={4}
                                value={remarks}
                                onChangeText={setRemarks}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRejectModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.modalSubmitBtn} 
                                onPress={handleRejectSubmit}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitText}>Confirm Reject</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
    header: { paddingBottom: 60, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    headerContent: { alignItems: 'center', marginTop: 30 },
    ticketBadge: { alignItems: 'center', gap: 10 },
    ticketNumber: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 1 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    content: { flex: 1, paddingHorizontal: 20 },
    section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 4 },
    infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoValue: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    maintenanceTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 15 },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    detailItem: { width: '50%', marginBottom: 15 },
    detailLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
    detailValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
    protocolItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    protocolMain: { flexDirection: 'row', flex: 1, gap: 12 },
    protocolSl: { fontSize: 12, fontWeight: 'bold', color: '#c1272d' },
    protocolName: { fontSize: 13, fontWeight: '600', color: '#334155' },
    protocolCategory: { fontSize: 11, color: '#94a3b8' },
    protocolTypes: { flexDirection: 'row', gap: 4 },
    typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#eff6ff' },
    typeText: { fontSize: 9, fontWeight: 'bold', color: '#3b82f6' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: '#e2e8f0', elevation: 10 },
    actionBtn: { flex: 1, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    resolveBtn: { backgroundColor: '#10b981' },
    rejectBtn: { backgroundColor: '#ef4444' },
    actionBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    finalisedFooter: {
        backgroundColor: '#f0fdf4',
        borderTopColor: '#bbf7d0',
    },
    finalisedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        flex: 1,
        borderWidth: 1,
        borderColor: '#10b981',
    },
    finalisedTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    finalisedSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, width: '100%', overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    modalBody: { padding: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 10 },
    textArea: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, height: 120, fontSize: 14, color: '#1e293b' },
    modalFooter: { flexDirection: 'row', padding: 20, gap: 12 },
    modalCancelBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
    modalCancelText: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
    modalSubmitBtn: { flex: 2, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ef4444' },
    modalSubmitText: { fontSize: 14, fontWeight: 'bold', color: '#fff' }
});

export default MaintenanceDetailScreen;
