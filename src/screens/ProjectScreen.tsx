import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchProjects, Project, deleteProject } from '../services/projectService';
import SkeletonLoader from '../components/SkeletonLoader';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ProjectScreen = ({ navigation }: any) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadProjects = async () => {
        try {
            setError(null);
            const response = await fetchProjects(1, 25);
            setProjects(response.Data || []);
        } catch (err: any) {
            console.error('Error loading projects:', err);
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
            setError('Failed to load projects');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadProjects(); }, []);
    const onRefresh = () => { setRefreshing(true); loadProjects(); };

    const handleDeleteProject = (projectId: number, projectName: string) => {
        Alert.alert('Delete Project', `Are you sure you want to delete "${projectName}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteProject(projectId);
                        setProjects(projects.filter((p) => p.Id !== projectId));
                        Alert.alert('Success', 'Project deleted successfully');
                    } catch (error: any) {
                        if (error?.statusCode === 401) {
                            Alert.alert('Session Expired', 'Your session has expired.', [
                                { text: 'OK', onPress: () => { const { authService } = require('../services/authService'); authService.clearAuthData(); navigation?.replace('Login'); } },
                            ]);
                            return;
                        }
                        Alert.alert('Error', 'Failed to delete project');
                    }
                },
            },
        ]);
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return `${date.getDate().toString().padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        } catch { return dateString; }
    };

    const getFundingColors = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('depository')) return { bg: '#f4ebff', text: '#8b5cf6', accent: '#8b5cf6' };
        if (t.includes('financialassistance')) return { bg: '#fce8e8', text: '#ef4444', accent: '#ef4444' };
        if (t.includes('budgetary')) return { bg: '#e0fbf0', text: '#10b981', accent: '#10b981' };
        if (t.includes('self')) return { bg: '#e0f2fe', text: '#3b82f6', accent: '#3b82f6' };
        return { bg: '#f3f4f6', text: '#4b5563', accent: '#6b7280' };
    };

    const totalBudget = projects.reduce((sum, p) => sum + (p.TotalBudget || 0), 0);

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
                    <TouchableOpacity style={styles.retryButton} onPress={loadProjects}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.headerWrapper}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerIconBox}>
                            <MaterialIcons name='assessment' size={20} color='#fff' />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Projects</Text>
                            <Text style={styles.headerSubtitle}>{projects.length} projects loaded</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.btnSearch}>
                        <Feather name='search' size={14} color='#f97316' />
                        <Text style={styles.btnSearchText}>Search</Text>
                    </TouchableOpacity>
                </View>

                {/* Summary strip */}
                <View style={styles.summaryStrip}>
                    <View style={styles.summaryItem}>
                        <MaterialIcons name='folder' size={14} color='#dc2626' />
                        <Text style={styles.summaryValue}>{projects.length}</Text>
                        <Text style={styles.summaryLabel}>Total</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <MaterialIcons name='currency-rupee' size={14} color='#f97316' />
                        <Text style={styles.summaryValue}>{formatCurrency(totalBudget)}</Text>
                        <Text style={styles.summaryLabel}>Budget</Text>
                    </View>
                </View>

                {/* Project Cards */}
                {projects.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="folder-open-outline" size={52} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No projects found</Text>
                    </View>
                ) : (
                    projects.map((project, index) => {
                        const colors = getFundingColors(project.TypeOfFundingText);
                        return (
                            <TouchableOpacity
                                key={project.Id}
                                style={styles.card}
                                activeOpacity={0.85}
                                onPress={() => navigation?.navigate('ProjectDetails', { project })}
                            >
                                <View style={[styles.cardAccent, { backgroundColor: colors.accent }]} />
                                <View style={styles.cardBody}>
                                    {/* Top row */}
                                    <View style={styles.cardTopRow}>
                                        <Text style={styles.cardIndex}>#{index + 1}</Text>
                                        <View style={[styles.fundingBadge, { backgroundColor: colors.bg }]}>
                                            <Text style={[styles.fundingBadgeText, { color: colors.text }]} numberOfLines={1}>
                                                {project.TypeOfFundingText || 'General'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Project name */}
                                    <Text style={styles.cardName} numberOfLines={2}>{project.Name}</Text>

                                    {/* Meta row */}
                                    <View style={styles.cardMetaRow}>
                                        <View style={styles.cardMeta}>
                                            <Feather name="calendar" size={11} color="#94a3b8" />
                                            <Text style={styles.cardMetaText}>{formatDate(project.StartYear)}</Text>
                                        </View>
                                        <View style={styles.metaDivider} />
                                        <View style={styles.cardMeta}>
                                            <Feather name="briefcase" size={11} color="#94a3b8" />
                                            <Text style={styles.cardMetaText} numberOfLines={1}>{project.FinancialYearName}</Text>
                                        </View>
                                    </View>

                                    {/* Footer */}
                                    <View style={styles.cardFooter}>
                                        <View style={styles.cardBudget}>
                                            <Text style={styles.cardBudgetLabel}>Budget</Text>
                                            <Text style={styles.cardBudgetValue}>{formatCurrency(project.TotalBudget)}</Text>
                                        </View>
                                        <View style={styles.cardDeptWrap}>
                                            <Text style={styles.cardDept} numberOfLines={1}>{project.AuthorisedDepartmentName}</Text>
                                        </View>
                                        <Feather name="chevron-right" size={16} color="#cbd5e1" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}

                {projects.length > 0 && (
                    <Text style={styles.footerText}>Showing {projects.length} projects</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    scrollContent: { paddingHorizontal: 14, paddingBottom: 24, paddingTop: 8 },
    loadingContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 14 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
    errorText: { fontSize: 14, color: '#dc2626', textAlign: 'center' },
    retryButton: { backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    // Header
    headerWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIconBox: { backgroundColor: '#dc2626', width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
    headerSubtitle: { fontSize: 11, color: '#64748b' },
    btnSearch: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#fed7aa',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    },
    btnSearchText: { color: '#ea580c', fontWeight: '700', fontSize: 12 },

    // Summary strip
    summaryStrip: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 14,
        elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 3, gap: 0,
    },
    summaryItem: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    summaryValue: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
    summaryLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
    summaryDivider: { width: 1, height: 24, backgroundColor: '#e2e8f0' },

    // Cards
    card: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 10,
        flexDirection: 'row', overflow: 'hidden',
        elevation: 2, shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
    },
    cardAccent: { width: 4 },
    cardBody: { flex: 1, padding: 12 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    cardIndex: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
    fundingBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, maxWidth: width * 0.55 },
    fundingBadgeText: { fontSize: 10, fontWeight: '700' },
    cardName: { fontSize: 14, color: '#0f172a', fontWeight: '700', marginBottom: 8, lineHeight: 19 },
    cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardMetaText: { fontSize: 11, color: '#64748b' },
    metaDivider: { width: 1, height: 12, backgroundColor: '#e2e8f0' },
    cardFooter: {
        flexDirection: 'row', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8, gap: 8,
    },
    cardBudget: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardBudgetLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
    cardBudgetValue: { fontSize: 12, color: '#dc2626', fontWeight: '800' },
    cardDeptWrap: { flex: 1 },
    cardDept: { fontSize: 10, color: '#64748b', textAlign: 'right' },

    emptyContainer: { paddingVertical: 48, alignItems: 'center', gap: 10 },
    emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
    footerText: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 4 },
});

export default ProjectScreen;