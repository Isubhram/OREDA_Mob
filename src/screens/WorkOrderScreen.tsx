import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Dimensions } from 'react-native';
import { workOrderService } from '../services/workOrderService';
import { WorkOrder } from '../services/tenderService';
import { authService } from '../services/authService';
import SkeletonLoader from '../components/SkeletonLoader';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const WorkOrderScreen = ({ navigation }: any) => {
	const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [totalRecords, setTotalRecords] = useState(0);

	const loadWorkOrders = async () => {
		try {
			setError(null);
			const authData = await authService.getAuthData();
			let userDistrictId: number | undefined;
			const accessLevel = authData?.UserData?.AccessLevelLabel || authData?.UserData?.AccessLevel;
			if (accessLevel !== 'All' && authData?.UserData?.Locations && authData.UserData.Locations.length > 0) {
				const primaryLoc =
					authData.UserData.Locations.find((l: any) => l.IsPrimary) || authData.UserData.Locations[0];
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
			return `${date.getDate().toString().padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
		} catch {
			return dateString;
		}
	};

	const formatCurrency = (val?: number) => {
		if (!val) return '₹0';
		if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
		if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
		return `₹${val.toLocaleString('en-IN')}`;
	};

	const isOverdue = (completionDate: string) => {
		if (!completionDate) return false;
		try {
			return new Date(completionDate) < new Date();
		} catch {
			return false;
		}
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<SkeletonLoader variant='card' count={4} />
				</View>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.errorContainer}>
					<MaterialCommunityIcons name='alert-circle-outline' size={48} color='#dc2626' />
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity style={styles.retryButton} onPress={loadWorkOrders}>
						<Text style={styles.retryButtonText}>Retry</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	const overdueCount = workOrders.filter((w) => isOverdue(w.CompletionDueDate)).length;
	const onTimeCount = workOrders.length - overdueCount;

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
							<MaterialIcons name='work' size={20} color='#fff' />
						</View>
						<View>
							<Text style={styles.headerTitle}>Work Orders</Text>
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
						<Text style={styles.statChipText}>{onTimeCount} On Time</Text>
					</View>
					<View style={styles.statChip}>
						<View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
						<Text style={styles.statChipText}>{overdueCount} Overdue</Text>
					</View>
					<View style={styles.statChip}>
						<View style={[styles.statDot, { backgroundColor: '#3b82f6' }]} />
						<Text style={styles.statChipText}>{workOrders.length} Shown</Text>
					</View>
				</View>

				{/* Card List */}
				{workOrders.length === 0 ? (
					<View style={styles.emptyContainer}>
						<MaterialCommunityIcons name='clipboard-text-outline' size={52} color='#cbd5e1' />
						<Text style={styles.emptyText}>No work orders found</Text>
					</View>
				) : (
					workOrders.map((wo, index) => {
						const overdue = isOverdue(wo.CompletionDueDate);
						return (
							<TouchableOpacity
								key={`${wo.Id}-${index}`}
								style={styles.card}
								activeOpacity={0.85}
								onPress={() => navigation?.navigate('WorkOrderDetails', { workOrderId: wo.Id })}
							>
								<View
									style={[styles.cardAccent, { backgroundColor: overdue ? '#ef4444' : '#10b981' }]}
								/>
								<View style={styles.cardBody}>
									{/* Top row */}
									<View style={styles.cardTopRow}>
										<View style={styles.woNumberWrap}>
											<Text style={styles.cardIndex}>#{index + 1}</Text>
											<MaterialCommunityIcons name='clipboard-text' size={13} color='#3b82f6' />
											<Text style={styles.woNumber}>{wo.WONumber}</Text>
										</View>
										<View
											style={[
												styles.statusBadge,
												{ backgroundColor: overdue ? '#fee2e2' : '#dcfce7' },
											]}
										>
											<Text
												style={[
													styles.statusBadgeText,
													{ color: overdue ? '#b91c1c' : '#15803d' },
												]}
											>
												{overdue ? 'Overdue' : 'Active'}
											</Text>
										</View>
									</View>

									{/* Project name */}
									<Text style={styles.cardProjectName} numberOfLines={2}>
										{wo.ProjectName}
									</Text>

									{/* Dates row */}
									<View style={styles.cardMetaRow}>
										<View style={styles.cardMeta}>
											<Feather name='calendar' size={11} color='#3b82f6' />
											<Text style={styles.cardMetaLabel}>WO Date</Text>
											<Text style={styles.cardMetaValue}>{formatDate(wo.WODate)}</Text>
										</View>
										<View style={styles.metaDivider} />
										<View style={styles.cardMeta}>
											<Feather name='clock' size={11} color={overdue ? '#ef4444' : '#10b981'} />
											<Text style={styles.cardMetaLabel}>Due</Text>
											<Text style={[styles.cardMetaValue, overdue && { color: '#ef4444' }]}>
												{formatDate(wo.CompletionDueDate)}
											</Text>
										</View>
									</View>

									{/* Footer */}
									<View style={styles.cardFooter}>
										<View style={styles.valueChip}>
											<MaterialIcons name='currency-rupee' size={12} color='#f59e0b' />
											<Text style={styles.valueChipText}>{formatCurrency(wo.WOValue)}</Text>
										</View>
										<Feather
											name='chevron-right'
											size={16}
											color='#cbd5e1'
											style={{ marginLeft: 'auto' }}
										/>
									</View>
								</View>
							</TouchableOpacity>
						);
					})
				)}

				{workOrders.length > 0 && (
					<Text style={styles.footerText}>
						Showing {workOrders.length} of {totalRecords} work orders
					</Text>
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
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
		marginTop: 4,
	},
	headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	headerIconBox: {
		backgroundColor: '#10b981',
		width: 36,
		height: 36,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
	headerSubtitle: { fontSize: 11, color: '#64748b' },

	// Stats strip
	statsStrip: { flexDirection: 'row', gap: 8, marginBottom: 14 },
	statChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		backgroundColor: '#fff',
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#e2e8f0',
	},
	statDot: { width: 7, height: 7, borderRadius: 4 },
	statChipText: { fontSize: 11, color: '#374151', fontWeight: '600' },
	btnSearch: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#fed7aa',
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	btnSearchText: { color: '#ea580c', fontWeight: '700', fontSize: 12 },
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
	cardAccent: { width: 4 },
	cardBody: { flex: 1, padding: 12 },
	cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
	woNumberWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
	cardIndex: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
	woNumber: { fontSize: 13, fontWeight: '800', color: '#1e40af' },
	statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
	statusBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
	cardProjectName: { fontSize: 13, color: '#1e293b', fontWeight: '600', marginBottom: 8, lineHeight: 18 },
	cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
	cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
	cardMetaLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
	cardMetaValue: { fontSize: 11, color: '#475569', fontWeight: '500' },
	metaDivider: { width: 1, height: 14, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
	cardFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: '#f1f5f9',
		paddingTop: 8,
	},
	valueChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2,
		backgroundColor: '#fefce8',
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
	valueChipText: { fontSize: 12, color: '#92400e', fontWeight: '700' },

	emptyContainer: { paddingVertical: 48, alignItems: 'center', gap: 10 },
	emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
	footerText: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 4 },
});

export default WorkOrderScreen;
