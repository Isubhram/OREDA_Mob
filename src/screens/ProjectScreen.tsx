import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { fetchProjects, Project, deleteProject } from '../services/projectService';
import SkeletonLoader from '../components/SkeletonLoader';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

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

    useEffect(() => {
        loadProjects();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadProjects();
    };

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
                        Alert.alert('Error', 'Failed to delete project');
                    }
                },
            },
        ]);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
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

    const getFundingBadgeStyle = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('depository')) return { bg: '#f4ebff', text: '#8b5cf6' };
        if (t.includes('financialassistance')) return { bg: '#fce8e8', text: '#ef4444' };
        if (t.includes('budgetary')) return { bg: '#e0fbf0', text: '#10b981' };
        if (t.includes('self')) return { bg: '#e0f2fe', text: '#3b82f6' };
        return { bg: '#f3f4f6', text: '#4b5563' };
    };

    const totalBudget = projects.reduce((sum, p) => sum + (p.TotalBudget || 0), 0);

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
                    <TouchableOpacity style={styles.retryButton} onPress={loadProjects}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.mainScrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header Actions */}
                <View style={styles.headerWrapper}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerIconBox}>
                            <MaterialIcons name="assessment" size={24} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Projects Management</Text>
                            <Text style={styles.headerSubtitle}>Manage and monitor all your projects efficiently</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.btnSearch}>
                            <Feather name="search" size={16} color="#f97316" />
                            <Text style={styles.btnSearchText}>Search Projects</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnAdd}>
                            <Feather name="plus" size={16} color="#ef4444" />
                            <Text style={styles.btnAddText}>Add New Project</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryCardsRow}>
                    <View style={styles.card}>
                        <View style={styles.cardIconBoxRow}>
                            <View style={styles.cardIconBoxRed}>
                                <MaterialIcons name="folder" size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.cardTitle}>Total Projects</Text>
                                <Text style={styles.cardSubtitle}>All projects across departments</Text>
                            </View>
                        </View>
                        <View style={styles.cardBadgeRed}>
                            <Text style={styles.cardBadgeRedText}>{projects.length || 0}</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardIconBoxRow}>
                            <View style={styles.cardIconBoxOrange}>
                                <MaterialIcons name="currency-rupee" size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.cardTitle}>Total Budget</Text>
                                <Text style={styles.cardSubtitle}>Allocated across active projects</Text>
                            </View>
                        </View>
                        <View style={styles.cardBadgeOrange}>
                            <Text style={styles.cardBadgeOrangeText}>{formatCurrency(totalBudget)}</Text>
                        </View>
                    </View>
                </View>

                {/* List Section */}
                <View style={styles.listSection}>
                    <View style={styles.listHeader}>
                        <View style={styles.listHeaderLeft}>
                            <MaterialIcons name="list-alt" size={24} color="#cc1a1f" style={styles.listTitleIcon} />
                            <Text style={styles.listTitle}>Projects List</Text>
                            <Text style={styles.listSubtitle}>({projects.length} of {projects.length} projects)</Text>
                        </View>
                        <View style={styles.viewToggleGroup}>
                            <TouchableOpacity style={styles.toggleBtnActive}>
                                <MaterialIcons name="format-list-bulleted" size={18} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toggleBtnInactive}>
                                <MaterialIcons name="grid-view" size={18} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {projects.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No projects found</Text>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator>
                            <View style={styles.tableWrapper}>
                                {/* Table Header */}
                                <View style={styles.tableHeaderRow}>
                                    <View style={styles.colSlNo}><Text style={styles.tableHeaderText}>Sl.No</Text></View>
                                    <View style={styles.colName}><Text style={styles.tableHeaderText}>Name</Text></View>
                                    <View style={styles.colFunding}><Text style={styles.tableHeaderText}>Type Of Funding</Text></View>
                                    <View style={styles.colYear}><Text style={styles.tableHeaderText}>Start Year</Text></View>
                                    <View style={styles.colFinYear}><Text style={styles.tableHeaderText}>Financial Year</Text></View>
                                    <View style={styles.colDept}><Text style={styles.tableHeaderText}>Authorised Department</Text></View>
                                    <View style={styles.colBudget}><Text style={styles.tableHeaderText}>Total Budget</Text></View>
                                    <View style={styles.colAction}><Text style={styles.tableHeaderText}>Action</Text></View>
                                </View>

                                {/* Table Rows */}
                                {projects.map((project, index) => {
                                    const badgeStyle = getFundingBadgeStyle(project.TypeOfFundingText);
                                    return (
                                        <View key={project.Id} style={styles.tableRow}>
                                            <View style={styles.colSlNo}>
                                                <Text style={styles.cellTextDark}>{index + 1}</Text>
                                            </View>
                                            <View style={styles.colName}>
                                                <Text style={styles.cellTextDark} numberOfLines={2}>{project.Name}</Text>
                                            </View>
                                            <View style={styles.colFunding}>
                                                <View style={[styles.badgeWrapper, { backgroundColor: badgeStyle.bg }]}>
                                                    <Text style={[styles.badgeText, { color: badgeStyle.text }]} numberOfLines={1}>
                                                        {project.TypeOfFundingText}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.colYear}>
                                                <Text style={styles.cellTextGray}>{formatDate(project.StartYear)}</Text>
                                            </View>
                                            <View style={styles.colFinYear}>
                                                <Text style={styles.cellTextGray}>{project.FinancialYearName}</Text>
                                            </View>
                                            <View style={styles.colDept}>
                                                <Text style={styles.cellTextGray} numberOfLines={2}>
                                                    {project.AuthorisedDepartmentName}
                                                </Text>
                                            </View>
                                            <View style={styles.colBudget}>
                                                <Text style={styles.cellTextDark}>
                                                    {formatCurrency(project.TotalBudget)}
                                                </Text>
                                            </View>
                                            <View style={styles.colAction}>
                                                <TouchableOpacity
                                                    style={styles.actionBtnView}
                                                    onPress={() => navigation?.navigate('ProjectDetails', { project })}
                                                >
                                                    <Feather name="eye" size={14} color="#3b82f6" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.actionBtnEdit}
                                                >
                                                    <Feather name="edit-2" size={14} color="#f97316" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.actionBtnDelete}
                                                    onPress={() => handleDeleteProject(project.Id, project.Name)}
                                                >
                                                    <Feather name="trash-2" size={14} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    )}

                    {/* Pagination */}
                    {projects.length > 0 && (
                        <View style={styles.paginationWrapper}>
                            <View style={styles.paginationControls}>
                                <Text style={styles.paginationText}>Rows per page:</Text>
                                <View style={styles.paginationDropdown}>
                                    <Text style={{ fontSize: 13, marginRight: 4, color: '#374151' }}>25</Text>
                                    <MaterialIcons name="keyboard-arrow-down" size={16} color="#6b7280" />
                                </View>
                                <Text style={styles.paginationText}>
                                    1-{projects.length} of {projects.length}
                                </Text>
                                <MaterialIcons name="keyboard-double-arrow-left" size={20} color="#d1d5db" />
                                <MaterialIcons name="keyboard-arrow-left" size={20} color="#d1d5db" />
                                <View style={styles.pageButtonBox}>
                                    <Text style={{ fontSize: 13, color: '#374151', fontWeight: '500' }}>1</Text>
                                </View>
                                <MaterialIcons name="keyboard-arrow-right" size={20} color="#d1d5db" />
                                <MaterialIcons name="keyboard-double-arrow-right" size={20} color="#d1d5db" />
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eef1f5',
    },
    mainScrollView: {
        flex: 1,
        padding: isMobile ? 12 : 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#dc2626',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        paddingVertical: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
    },
    // Header
    headerWrapper: {
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: 24,
        gap: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconBox: {
        backgroundColor: '#dc2626',
        width: 44,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#6b7280',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    btnSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#fed7aa',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    btnSearchText: {
        color: '#ea580c',
        marginLeft: 6,
        fontWeight: '600',
        fontSize: 13,
    },
    btnAdd: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    btnAddText: {
        color: '#dc2626',
        marginLeft: 6,
        fontWeight: '600',
        fontSize: 13,
    },
    // Summary Cards
    summaryCardsRow: {
        flexDirection: isMobile ? 'column' : 'row',
        marginBottom: 24,
        gap: 24,
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    cardIconBoxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        zIndex: 10,
    },
    cardIconBoxRed: {
        backgroundColor: '#dc2626',
        width: 48,
        height: 48,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardIconBoxOrange: {
        backgroundColor: '#f97316',
        width: 48,
        height: 48,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#9ca3af',
    },
    cardBadgeRed: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#fee2e2',
        borderBottomLeftRadius: 48,
        paddingTop: 12,
        paddingRight: 16,
        paddingBottom: 24,
        paddingLeft: 32,
    },
    cardBadgeRedText: {
        color: '#b91c1c',
        fontWeight: 'bold',
        fontSize: 18,
    },
    cardBadgeOrange: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#ffedd5',
        borderBottomLeftRadius: 48,
        paddingTop: 12,
        paddingRight: 16,
        paddingBottom: 24,
        paddingLeft: 32,
    },
    cardBadgeOrangeText: {
        color: '#c2410c',
        fontWeight: 'bold',
        fontSize: 18,
    },
    // List Section
    listSection: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 24,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    listHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listTitleIcon: {
        marginRight: 8,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    listSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginLeft: 8,
    },
    viewToggleGroup: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        overflow: 'hidden',
    },
    toggleBtnActive: {
        backgroundColor: '#dc2626',
        padding: 6,
    },
    toggleBtnInactive: {
        backgroundColor: '#fff',
        padding: 6,
    },
    // Table
    tableWrapper: {
        minWidth: 1050,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tableHeaderText: {
        color: '#dc2626',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        alignItems: 'center',
    },
    colSlNo: { width: 60 },
    colName: { width: 150 },
    colFunding: { width: 220 },
    colYear: { width: 120 },
    colFinYear: { width: 120 },
    colDept: { width: 180 },
    colBudget: { width: 100 },
    colAction: { flex: 1, flexDirection: 'row', gap: 8 },
    cellTextDark: {
        color: '#1f2937',
        fontSize: 13,
        fontWeight: '500',
    },
    cellTextGray: {
        color: '#6b7280',
        fontSize: 13,
    },
    badgeWrapper: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    actionBtnView: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnEdit: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#fed7aa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnDelete: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#fecaca',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Pagination
    paginationWrapper: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    paginationControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paginationText: {
        fontSize: 13,
        color: '#6b7280',
        marginHorizontal: 12,
    },
    paginationDropdown: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pageButtonBox: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 4,
        marginHorizontal: 8,
    },
});

export default ProjectScreen;