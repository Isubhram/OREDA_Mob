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
            
            {/* Header */}
            <LinearGradient colors={['#1e293b', '#334155']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Incident Detail</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.headerContent}>
                    <View style={styles.ticketBadge}>
                        <Text style={styles.ticketNumber}>{ticket.TicketNumber}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.Status) + '20', borderColor: getStatusColor(ticket.Status) }]}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(ticket.Status) }]} />
                            <Text style={[styles.statusText, { color: getStatusColor(ticket.Status) }]}>{ticket.Status.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* Information Row */}
                <View style={[styles.section, { marginTop: -30, elevation: 5 }]}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>CREATED ON</Text>
                            <View style={styles.infoValueRow}>
                                <Feather name="clock" size={14} color="#64748b" />
                                <Text style={styles.infoValue}>{formatDate(ticket.CreatedOn)}</Text>
                            </View>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>REASON CATEGORY</Text>
                            <Text style={styles.infoValue}>{ticket.ReasonCategory || 'General'}</Text>
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
    ticketSubject: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
    ticketDescription: { fontSize: 14, color: '#475569', lineHeight: 20 },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    detailItem: { width: '100%', marginBottom: 12 },
    detailLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
    detailValue: { fontSize: 14, fontWeight: '600', color: '#334155' },
    beneficiaryBadge: { alignSelf: 'flex-start', backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#fdba74', marginTop: 4 },
    beneficiaryBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#ea580c' },
    remarksBox: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, marginTop: 10 },
    remarksLabel: { fontSize: 12, fontWeight: 'bold', color: '#166534', marginBottom: 4 },
    remarksText: { fontSize: 13, color: '#166534' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', elevation: 10 },
    actionBtn: { height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    resolveBtn: { backgroundColor: '#10b981' },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    finalisedFooter: { backgroundColor: '#f0fdf4', borderTopColor: '#bbf7d0' },
    finalisedBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 12, borderRadius: 12, flex: 1, borderWidth: 1, borderColor: '#10b981' },
    finalisedTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    finalisedSubtitle: { fontSize: 12, color: '#64748b' },
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
    modalSubmitBtn: { flex: 2, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10b981' },
    modalSubmitText: { fontSize: 14, fontWeight: 'bold', color: '#fff' }
});

export default IncidentDetailScreen;
