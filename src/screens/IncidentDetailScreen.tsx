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
import { maintenanceService, IncidentTicket } from '../services/maintenanceService';

const { width } = Dimensions.get('window');

const IncidentDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { ticketId } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState<IncidentTicket | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Resolution State
    const [resolveModalVisible, setResolveModalVisible] = useState(false);
    const [remarks, setRemarks] = useState('');

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const response = await maintenanceService.getIncidentTicketDetails(ticketId);
            setTicket(response.Data);
        } catch (error) {
            console.error('Error fetching incident details:', error);
            Alert.alert('Error', 'Failed to load incident details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ticketId) fetchDetails();
    }, [ticketId]);

    const handleResolveSubmit = async () => {
        if (!remarks.trim()) {
            Alert.alert('Required', 'Remarks are mandatory for resolution');
            return;
        }

        try {
            setActionLoading(true);
            await maintenanceService.resolveIncidentTicket(ticketId, remarks);
            setResolveModalVisible(false);
            setRemarks('');
            Alert.alert('Success', 'Incident ticket resolved (closed) successfully');
            fetchDetails();
        } catch (error) {
            Alert.alert('Error', 'Failed to resolve incident ticket');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('closed') || s.includes('resolve')) return '#10b981';
        if (s.includes('open')) return '#ef4444';
        if (s.includes('inprogress')) return '#f59e0b';
        return '#64748b';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#c1272d" />
                <Text style={styles.loadingText}>Fetching incident details...</Text>
            </View>
        );
    }

    if (!ticket) return null;

    const isClosed = ticket.Status.toLowerCase() === 'closed';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            
            {/* Compact Header */}
            <LinearGradient colors={['#8b1a1a', '#c1272d']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={20} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerLabel}>Incident</Text>
                        <Text style={styles.ticketNumber}>{ticket.TicketNumber}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.Status) + '25', borderColor: getStatusColor(ticket.Status) }]}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(ticket.Status) }]} />
                        <Text style={[styles.statusText, { color: '#fff' }]}>{ticket.Status.toUpperCase()}</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* Quick Info Strip */}
                <View style={styles.infoStrip}>
                    <View style={styles.infoChip}>
                        <Feather name="clock" size={12} color="#64748b" />
                        <View>
                            <Text style={styles.infoChipLabel}>Created</Text>
                            <Text style={styles.infoChipValue}>{formatDate(ticket.CreatedOn)}</Text>
                        </View>
                    </View>
                    <View style={styles.infoChipDivider} />
                    <View style={styles.infoChip}>
                        <Feather name="tag" size={12} color="#64748b" />
                        <View>
                            <Text style={styles.infoChipLabel}>Category</Text>
                            <Text style={styles.infoChipValue}>{ticket.ReasonCategory || 'General'}</Text>
                        </View>
                    </View>
                </View>

                {/* Subject & Description */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ef4444" />
                        <Text style={styles.sectionTitle}>Incident Information</Text>
                    </View>
                    <Text style={styles.ticketSubject}>{ticket.Subject}</Text>
                    {ticket.Description ? (
                        <Text style={styles.ticketDescription}>{ticket.Description}</Text>
                    ) : (
                        <Text style={[styles.ticketDescription, { fontStyle: 'italic', color: '#94a3b8' }]}>No description provided.</Text>
                    )}
                </View>

                {/* Project & Asset */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Feather name="briefcase" size={18} color="#3b82f6" />
                        <Text style={styles.sectionTitle}>Project & Asset Details</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Project Name</Text>
                        <Text style={styles.detailValue}>{ticket.ProjectName}</Text>
                    </View>
                    <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Asset Name</Text>
                            <Text style={styles.detailValue}>{ticket.AssetName}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Asset Type</Text>
                            <Text style={styles.detailValue}>{ticket.AssetTypeName}</Text>
                        </View>
                    </View>
                </View>

                {/* Complainer Info */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Feather name="user" size={18} color="#f59e0b" />
                        <Text style={styles.sectionTitle}>Complainer Information</Text>
                    </View>
                    <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Name</Text>
                            <Text style={styles.detailValue}>{ticket.ComplainerName}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Mobile</Text>
                            <Text style={styles.detailValue}>{ticket.ComplainerMobileNumber || 'N/A'}</Text>
                        </View>
                    </View>
                    {ticket.IsComplainerBeneficiary && (
                        <View style={styles.beneficiaryBadge}>
                            <Text style={styles.beneficiaryBadgeText}>Beneficiary</Text>
                        </View>
                    )}
                </View>

                {/* Closure Info (if closed) */}
                {isClosed && (
                    <View style={[styles.section, { borderColor: '#10b981', borderWidth: 1 }]}>
                        <View style={styles.sectionHeader}>
                            <Feather name="check-circle" size={18} color="#10b981" />
                            <Text style={styles.sectionTitle}>Closure Details</Text>
                        </View>
                        <View style={styles.detailGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Closed On</Text>
                                <Text style={styles.detailValue}>{formatDate(ticket.ClosedOn || '')}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Closed By</Text>
                                <Text style={styles.detailValue}>{ticket.ClosedByName || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.remarksBox}>
                            <Text style={styles.remarksLabel}>Remarks:</Text>
                            <Text style={styles.remarksText}>{ticket.ClosureRemarks || 'Resolved'}</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Footer Action */}
            {!isClosed && (
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.resolveBtn]} 
                        onPress={() => setResolveModalVisible(true)}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Feather name="check-circle" size={20} color="#fff" />
                                <Text style={styles.actionBtnText}>RESOLVE INCIDENT</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Action Finalised (if closed) */}
            {isClosed && (
                <View style={[styles.footer, styles.finalisedFooter]}>
                    <View style={styles.finalisedBadge}>
                        <MaterialCommunityIcons name="check-decagram" size={24} color="#10b981" />
                        <View>
                            <Text style={styles.finalisedTitle}>Incident Finalised</Text>
                            <Text style={styles.finalisedSubtitle}>This ticket has been closed successfully.</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Resolution Modal */}
            <Modal
                transparent
                visible={resolveModalVisible}
                animationType="fade"
                onRequestClose={() => setResolveModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Resolve Incident</Text>
                            <TouchableOpacity onPress={() => setResolveModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Resolution Remarks <Text style={{ color: '#ef4444' }}>*</Text></Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Describe how the issue was resolved..."
                                multiline
                                numberOfLines={4}
                                value={remarks}
                                onChangeText={setRemarks}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setResolveModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.modalSubmitBtn} 
                                onPress={handleResolveSubmit}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitText}>Submit Resolution</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 8, color: '#64748b', fontSize: 12 },

    // Compact header
    header: {
        paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14,
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    backBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerCenter: { flex: 1 },
    headerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    ticketNumber: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '800' },

    // Info strip
    infoStrip: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
        padding: 10, marginBottom: 12, marginTop: 12,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3, alignItems: 'center',
    },
    infoChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoChipLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' },
    infoChipValue: { fontSize: 11, fontWeight: '700', color: '#1e293b' },
    infoChipDivider: { width: 1, height: 24, backgroundColor: '#e2e8f0' },

    content: { flex: 1, paddingHorizontal: 14 },
    section: {
        backgroundColor: '#fff', borderRadius: 14, padding: 12,
        marginBottom: 10, elevation: 1, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
    ticketSubject: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
    ticketDescription: { fontSize: 12, color: '#475569', lineHeight: 18 },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    detailItem: { width: '50%', marginBottom: 8 },
    detailLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600', marginBottom: 1 },
    detailValue: { fontSize: 12, fontWeight: '600', color: '#334155' },
    beneficiaryBadge: { alignSelf: 'flex-start', backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#fdba74', marginTop: 2 },
    beneficiaryBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#ea580c' },
    remarksBox: { backgroundColor: '#f0fdf4', padding: 8, borderRadius: 8, marginTop: 6 },
    remarksLabel: { fontSize: 10, fontWeight: 'bold', color: '#166534', marginBottom: 2 },
    remarksText: { fontSize: 11, color: '#166534' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', elevation: 10 },
    actionBtn: { height: 42, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    resolveBtn: { backgroundColor: '#10b981' },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    finalisedFooter: { backgroundColor: '#f0fdf4', borderTopColor: '#bbf7d0' },
    finalisedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', padding: 8, borderRadius: 12, flex: 1, borderWidth: 1, borderColor: '#10b981' },
    finalisedTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
    finalisedSubtitle: { fontSize: 10, color: '#64748b' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 14 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, width: '100%', overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    modalBody: { padding: 14 },
    inputLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 6 },
    textArea: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 10, height: 100, fontSize: 12, color: '#1e293b' },
    modalFooter: { flexDirection: 'row', padding: 14, gap: 8 },
    modalCancelBtn: { flex: 1, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
    modalCancelText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
    modalSubmitBtn: { flex: 2, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10b981' },
    modalSubmitText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
});

export default IncidentDetailScreen;
