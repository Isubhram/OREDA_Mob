import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Project } from '../services/projectService';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const ProjectDetailsScreen = ({ route, navigation }: any) => {
	const project: Project | undefined = route?.params?.project;

	const formatCurrency = (amount: number | undefined) => {
		if (!amount) return '₹0';
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return '-';
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

	const sanctionOrdersCount = project?.SanctionOrders?.length || 0;
	const totalSanctioned = project?.SanctionOrders?.reduce((acc, curr) => acc + (curr.SanctionAmount || 0), 0) || 0;
	const totalSanctionedCr = totalSanctioned > 0 ? (totalSanctioned / 10000000).toFixed(2) : '0';

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Premium Header with Gradient */}
				<LinearGradient
					colors={['#8b1a1a', '#c52525', '#e23f3f']}
					style={styles.headerGradient}
				>
					<SafeAreaView edges={['top', 'left', 'right']}>
						<View style={styles.headerContent}>
							<TouchableOpacity 
								style={styles.backButton} 
								onPress={() => navigation.goBack()}
								activeOpacity={0.7}
							>
								<Feather name='arrow-left' size={24} color='#fff' />
							</TouchableOpacity>
							<View style={styles.headerTitleContainer}>
								<Text style={styles.headerTitle} numberOfLines={2}>{project?.Name || 'Project Details'}</Text>
								<View style={styles.headerBadge}>
									<MaterialCommunityIcons name='folder-outline' size={14} color='#fff' opacity={0.8} />
									<Text style={styles.headerBadgeText}>
										{project?.TypeOfFundingText || 'Solar Project'}
									</Text>
								</View>
							</View>
						</View>
					</SafeAreaView>
				</LinearGradient>

				<View style={styles.contentContainer}>
					{/* Top Statistics Cards */}
					<View style={styles.statsRow}>
						<View style={[styles.statItem, { backgroundColor: '#fdf2f2' }]}>
							<View style={[styles.statIconBox, { backgroundColor: '#fee2e2' }]}>
								<Feather name='file-text' size={20} color='#dc2626' />
							</View>
							<View>
								<Text style={styles.statLabel}>Orders</Text>
								<Text style={styles.statValue}>{sanctionOrdersCount}</Text>
							</View>
						</View>

						<View style={[styles.statItem, { backgroundColor: '#fff7ed' }]}>
							<View style={[styles.statIconBox, { backgroundColor: '#ffedd5' }]}>
								<MaterialIcons name='currency-rupee' size={20} color='#ea580c' />
							</View>
							<View>
								<Text style={styles.statLabel}>Sanctioned</Text>
								<Text style={styles.statValue}>{totalSanctionedCr} Cr</Text>
							</View>
						</View>

						<View style={[styles.statItem, { backgroundColor: '#f0fdf4' }]}>
							<View style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
								<Feather name='calendar' size={20} color='#16a34a' />
							</View>
							<View>
								<Text style={styles.statLabel}>FY</Text>
								<Text style={styles.statValue}>{project?.FinancialYearName || '-'}</Text>
							</View>
						</View>
					</View>

					{/* Project Information */}
					<View style={styles.infoSection}>
						<Text style={styles.sectionTitle}>General Information</Text>
						<View style={styles.infoCard}>
							<View style={styles.infoRow}>
								<View style={styles.infoCell}>
									<Text style={styles.infoLabel}>Funding Type</Text>
									<Text style={styles.infoText}>{project?.TypeOfFundingText || '-'}</Text>
								</View>
								<View style={styles.infoCell}>
									<Text style={styles.infoLabel}>Start Year</Text>
									<Text style={styles.infoText}>{formatDate(project?.StartYear)}</Text>
								</View>
							</View>
							<View style={styles.divider} />
							<View style={styles.infoRow}>
								<View style={styles.infoCell}>
									<Text style={styles.infoLabel}>Authorised Department</Text>
									<Text style={styles.infoText}>{project?.AuthorisedDepartmentName || '-'}</Text>
								</View>
							</View>
							<View style={styles.divider} />
							<View style={styles.infoRow}>
								<View style={styles.infoCell}>
									<Text style={styles.infoLabel}>Created On</Text>
									<Text style={styles.infoText}>{formatDate(project?.CreatedOn)}</Text>
								</View>
								<View style={styles.infoCell}>
									<Text style={styles.infoLabel}>Status</Text>
									<View style={[styles.statusTag, { backgroundColor: project?.IsActive !== false ? '#dcfce7' : '#fee2e2' }]}>
										<Text style={[styles.statusTagText, { color: project?.IsActive !== false ? '#15803d' : '#b91c1c' }]}>
											{project?.IsActive !== false ? 'Active' : 'Inactive'}
										</Text>
									</View>
								</View>
							</View>
						</View>
					</View>

					{/* Budget Highlight */}
					<LinearGradient
						colors={['#c1272d', '#8b1a1a']}
						style={styles.budgetCard}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
					>
						<View>
							<Text style={styles.budgetLabel}>Total Allocated Budget</Text>
							<Text style={styles.budgetValue}>{formatCurrency(project?.TotalBudget)}</Text>
						</View>
						<View style={styles.budgetIconCircle}>
							<MaterialIcons name='account-balance-wallet' size={24} color='#fff' />
						</View>
					</LinearGradient>

					{/* Sanction Orders Section */}
					<View style={styles.orderSection}>
						<View style={styles.sectionHeaderRow}>
							<Text style={styles.sectionTitle}>Sanction Orders</Text>
							<View style={styles.countBadge}>
								<Text style={styles.countBadgeText}>{sanctionOrdersCount}</Text>
							</View>
						</View>

						{sanctionOrdersCount === 0 ? (
							<View style={styles.emptyState}>
								<MaterialCommunityIcons name='file-search-outline' size={48} color='#cbd5e1' />
								<Text style={styles.emptyStateText}>No sanction orders available</Text>
							</View>
						) : (
							project?.SanctionOrders?.map((order, index) => (
								<TouchableOpacity key={index} style={styles.orderCard} activeOpacity={0.7}>
									<View style={styles.orderHeader}>
										<Text style={styles.orderNumber}>{order.SanctionOrderNumber || `Order #${index + 1}`}</Text>
										<Text style={styles.orderDate}>{formatDate(order.SanctionDate)}</Text>
									</View>
									<Text style={styles.orderAmount}>{formatCurrency(order.SanctionAmount)}</Text>
								</TouchableOpacity>
							))
						)}
					</View>
				</View>
				<View style={{ height: 40 }} />
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8fafc',
	},
	headerGradient: {
		paddingBottom: 24,
		borderBottomLeftRadius: 32,
		borderBottomRightRadius: 32,
	},
	headerContent: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: isMobile ? 12 : 20,
	},
	backButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	headerTitleContainer: {
		flex: 1,
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: 6,
	},
	headerBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
		alignSelf: 'flex-start',
	},
	headerBadgeText: {
		fontSize: 12,
		color: '#fff',
		marginLeft: 6,
		fontWeight: '500',
	},
	contentContainer: {
		paddingHorizontal: 20,
		marginTop: -20,
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 24,
	},
	statItem: {
		flex: 1,
		padding: 10,
		borderRadius: 16,
		marginHorizontal: 3,
		flexDirection: 'row',
		alignItems: 'center',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
	},
	statIconBox: {
		width: 30,
		height: 30,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	statLabel: {
		fontSize: 9,
		color: '#64748b',
		textTransform: 'uppercase',
		fontWeight: '600',
	},
	statValue: {
		fontSize: 12,
		fontWeight: 'bold',
		color: '#1e293b',
	},
	infoSection: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#1e293b',
		marginBottom: 12,
		marginLeft: 4,
	},
	infoCard: {
		backgroundColor: '#fff',
		borderRadius: 24,
		padding: 20,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginVertical: 10,
	},
	infoCell: {
		flex: 1,
	},
	infoLabel: {
		fontSize: 12,
		color: '#94a3b8',
		marginBottom: 4,
	},
	infoText: {
		fontSize: 15,
		color: '#334155',
		fontWeight: '500',
	},
	divider: {
		height: 1,
		backgroundColor: '#f1f5f9',
		marginVertical: 4,
	},
	statusTag: {
		alignSelf: 'flex-start',
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 8,
		marginTop: 2,
	},
	statusTagText: {
		fontSize: 12,
		fontWeight: 'bold',
		textTransform: 'uppercase',
	},
	budgetCard: {
		borderRadius: 24,
		padding: 24,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 32,
		elevation: 5,
		shadowColor: '#c1272d',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.2,
		shadowRadius: 12,
	},
	budgetLabel: {
		fontSize: 13,
		color: 'rgba(255, 255, 255, 0.8)',
		marginBottom: 4,
		fontWeight: '600',
	},
	budgetValue: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#fff',
	},
	budgetIconCircle: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	orderSection: {
		marginBottom: 20,
	},
	sectionHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
		marginLeft: 4,
	},
	countBadge: {
		backgroundColor: '#e2e8f0',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
		marginLeft: 10,
	},
	countBadgeText: {
		fontSize: 12,
		fontWeight: 'bold',
		color: '#475569',
	},
	orderCard: {
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		borderLeftWidth: 4,
		borderLeftColor: '#ef4444',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.04,
		shadowRadius: 4,
	},
	orderHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	orderNumber: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#1e293b',
	},
	orderDate: {
		fontSize: 12,
		color: '#94a3b8',
	},
	orderAmount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#dc2626',
	},
	emptyState: {
		backgroundColor: '#f8fafc',
		borderRadius: 24,
		padding: 40,
		alignItems: 'center',
		borderWidth: 2,
		borderColor: '#f1f5f9',
		borderStyle: 'dashed',
	},
	emptyStateText: {
		marginTop: 12,
		fontSize: 14,
		color: '#94a3b8',
		textAlign: 'center',
	},
});

export default ProjectDetailsScreen;