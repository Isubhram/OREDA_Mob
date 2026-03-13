import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
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
		<SafeAreaView style={styles.container}>
			<ScrollView style={styles.mainScrollView}>
				{/* Header Section */}
				<View style={styles.headerCard}>
					<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
						<Feather name='arrow-left' size={18} color='#4b5563' />
					</TouchableOpacity>
					<View style={styles.headerIconBox}>
						<MaterialCommunityIcons name='folder-text' size={24} color='#fff' />
					</View>
					<View>
						<Text style={styles.headerTitle}>{project?.Name || 'Project Name'}</Text>
						<View style={styles.headerSubtitleRow}>
							<Feather name='file-text' size={14} color='#6b7280' />
							<Text style={styles.headerSubtitle}> Project Details</Text>
						</View>
					</View>
				</View>

				{/* Top Statistics Cards */}
				<View style={[styles.statsRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
					<View style={[styles.statCard, { borderBottomColor: '#fecaca', borderBottomWidth: 3 }]}>
						<View style={styles.statIconRow}>
							<View style={[styles.statIconBox, { backgroundColor: '#fee2e2' }]}>
								<Feather name='file-text' size={20} color='#dc2626' />
							</View>
							<View style={styles.statValueBox}>
								<Text style={styles.statValueDark}>{sanctionOrdersCount}</Text>
							</View>
						</View>
						<Text style={styles.statTitle}>Sanction Orders</Text>
						<Text style={styles.statSubtitle}>Total orders assigned</Text>
					</View>

					<View style={[styles.statCard, { borderBottomColor: '#fed7aa', borderBottomWidth: 3 }]}>
						<View style={styles.statIconRow}>
							<View style={[styles.statIconBox, { backgroundColor: '#ffedd5' }]}>
								<MaterialIcons name='currency-rupee' size={20} color='#ea580c' />
							</View>
							<View style={styles.statValueBoxRow}>
								<Text style={styles.statValueDark}>{totalSanctionedCr}</Text>
								<Text style={styles.statUnit}>Cr</Text>
							</View>
						</View>
						<Text style={styles.statTitle}>Total Sanctioned</Text>
						<Text style={styles.statSubtitle}>Combined amount</Text>
					</View>

					<View style={[styles.statCard, { borderBottomColor: '#bbf7d0', borderBottomWidth: 3 }]}>
						<View style={styles.statIconRow}>
							<View style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
								<Feather name='calendar' size={20} color='#16a34a' />
							</View>
							<View style={styles.statValueBox}>
								<Text style={[styles.statValueGreen]}>
									{project?.FinancialYearName ? project?.FinancialYearName : '-'}
								</Text>
							</View>
						</View>
						<Text style={styles.statTitle}>Financial Year</Text>
						<Text style={styles.statSubtitle}>Current fiscal period</Text>
					</View>
				</View>

				{/* Content Section */}
				<View style={[styles.contentRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
					{/* Left Column */}
					<View style={styles.leftColumn}>
						{/* Project Information */}
						<View style={styles.sectionCard}>
							<View style={styles.sectionHeader}>
								<View style={[styles.sectionIconBox, { backgroundColor: '#dc2626' }]}>
									<Feather name='file-text' size={16} color='#fff' />
								</View>
								<View>
									<Text style={styles.sectionTitle}>Project Information</Text>
									<Text style={styles.sectionSubtitle}>Complete project details and timeline</Text>
								</View>
							</View>

							<View style={styles.infoGrid}>
								<View style={styles.infoItem}>
									<View style={styles.infoIconWrapper}>
										<Text style={styles.hashIcon}>#</Text>
									</View>
									<View>
										<Text style={styles.infoLabel}>Project Name</Text>
										<Text style={styles.infoValue}>{project?.Name || '-'}</Text>
									</View>
								</View>
								<View style={styles.infoItem}>
									<View style={styles.infoIconWrapper}>
										<MaterialCommunityIcons name='lock-outline' size={16} color='#6b7280' />
									</View>
									<View>
										<Text style={styles.infoLabel}>Type of Funding</Text>
										<Text style={styles.infoValue}>{project?.TypeOfFundingText || '-'}</Text>
									</View>
								</View>
								<View style={styles.infoItem}>
									<View style={styles.infoIconWrapper}>
										<Feather name='calendar' size={14} color='#6b7280' />
									</View>
									<View>
										<Text style={styles.infoLabel}>Start Year</Text>
										<Text style={styles.infoValue}>{formatDate(project?.StartYear)}</Text>
									</View>
								</View>
								<View style={styles.infoItem}>
									<View style={styles.infoIconWrapper}>
										<Feather name='calendar' size={14} color='#6b7280' />
									</View>
									<View>
										<Text style={styles.infoLabel}>Financial Year</Text>
										<Text style={styles.infoValue}>{project?.FinancialYearName || '-'}</Text>
									</View>
								</View>
								<View style={styles.infoItem}>
									<View style={styles.infoIconWrapper}>
										<MaterialCommunityIcons
											name='office-building-outline'
											size={16}
											color='#6b7280'
										/>
									</View>
									<View>
										<Text style={styles.infoLabel}>Authorised Department</Text>
										<Text style={styles.infoValue}>{project?.AuthorisedDepartmentName || '-'}</Text>
									</View>
								</View>
								<View style={styles.infoItem}>
									<View style={styles.infoIconWrapper}>
										<Feather name='clock' size={14} color='#6b7280' />
									</View>
									<View>
										<Text style={styles.infoLabel}>Created On</Text>
										<Text style={styles.infoValue}>{formatDate(project?.CreatedOn)}</Text>
									</View>
								</View>
							</View>
						</View>

						{/* Sanction Orders */}
						<View style={styles.sectionCard}>
							<View style={styles.sectionHeader}>
								<View style={[styles.sectionIconBox, { backgroundColor: '#f97316' }]}>
									<Feather name='file-text' size={16} color='#fff' />
								</View>
								<View>
									<Text style={styles.sectionTitle}>Sanction Orders</Text>
									<Text style={styles.sectionSubtitle}>Order details and documents</Text>
								</View>
							</View>

							{sanctionOrdersCount === 0 ? (
								<View style={styles.emptyStateBox}>
									<View style={styles.emptyStateIconWrapper}>
										<Feather name='file-text' size={28} color='#9ca3af' />
										<View style={styles.checkBadge}>
											<Feather name='check' size={10} color='#fff' />
										</View>
									</View>
									<Text style={styles.emptyStateTitle}>No sanction orders</Text>
									<Text style={styles.emptyStateSubtitle}>
										Sanction orders will appear here once added
									</Text>
								</View>
							) : (
								<View style={{ padding: 20 }}>
									<Text style={{ color: '#6b7280' }}>Sanction orders exist but UI is pending.</Text>
								</View>
							)}
						</View>
					</View>

					{/* Right Column */}
					<View style={styles.rightColumn}>
						{/* Quick Info */}
						<View style={styles.sectionCard}>
							<View style={styles.sectionHeader}>
								<View style={[styles.sectionIconBox, { backgroundColor: '#f97316' }]}>
									<Feather name='briefcase' size={16} color='#fff' />
								</View>
								<View>
									<Text style={styles.sectionTitle}>Quick Info</Text>
									<Text style={styles.sectionSubtitle}>Project summary</Text>
								</View>
							</View>

							<View style={styles.quickInfoList}>
								<View style={styles.quickInfoItem}>
									<Text style={styles.quickInfoLabel}>Project Type</Text>
									<Text style={styles.quickInfoValue}>N/A</Text>
								</View>
								<View style={styles.quickInfoItem}>
									<Text style={styles.quickInfoLabel}>Start Date</Text>
									<Text style={styles.quickInfoValue}>N/A</Text>
								</View>
								<View style={[styles.quickInfoItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
									<Text style={styles.quickInfoLabel}>Total Orders</Text>
									<Text style={styles.quickInfoValue}>{sanctionOrdersCount}</Text>
								</View>
							</View>
						</View>

						{/* Status / Budget Widget */}
						<View style={styles.statusWidget}>
							<View style={styles.statusRow}>
								<View style={styles.statusIconBox}>
									<Feather name='activity' size={18} color='#fff' />
								</View>
								<View style={{ marginLeft: 12 }}>
									<Text style={styles.statusLabelText}>STATUS</Text>
									<Text style={styles.statusValueText}>
										{project?.IsActive !== false ? 'Active' : 'Inactive'}
									</Text>
								</View>
							</View>
							<View style={styles.divider} />
							<View style={styles.budgetRow}>
								<Text style={styles.budgetLabel}>TOTAL BUDGET</Text>
								<Text style={styles.budgetValue}>{formatCurrency(project?.TotalBudget)}</Text>
							</View>
						</View>
					</View>
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
	headerCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	backButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
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
		fontSize: 18,
		fontWeight: 'bold',
		color: '#111827',
		marginBottom: 4,
	},
	headerSubtitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	headerSubtitle: {
		fontSize: 12,
		color: '#6b7280',
		marginLeft: 4,
	},
	statsRow: {
		gap: 20,
		marginBottom: 20,
	},
	statCard: {
		flex: 1,
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	statIconRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 16,
	},
	statIconBox: {
		width: 40,
		height: 40,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
	statValueBox: {
		alignItems: 'flex-end',
	},
	statValueBoxRow: {
		flexDirection: 'column',
		alignItems: 'flex-end',
	},
	statValueDark: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#b91c1c',
	},
	statValueGreen: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#16a34a',
	},
	statUnit: {
		fontSize: 12,
		color: '#9ca3af',
		marginTop: -4,
	},
	statTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
		marginBottom: 4,
	},
	statSubtitle: {
		fontSize: 12,
		color: '#9ca3af',
	},
	contentRow: {
		gap: 20,
		marginBottom: 40,
	},
	leftColumn: {
		flex: 2.2,
		gap: 20,
	},
	rightColumn: {
		flex: 1,
		gap: 20,
	},
	sectionCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	sectionIconBox: {
		width: 36,
		height: 36,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: 'bold',
		color: '#111827',
	},
	sectionSubtitle: {
		fontSize: 12,
		color: '#6b7280',
		marginTop: 2,
	},
	infoGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginHorizontal: -10,
	},
	infoItem: {
		width: isMobile ? '100%' : '50%',
		paddingHorizontal: 10,
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 24,
	},
	infoIconWrapper: {
		width: 28,
		height: 28,
		backgroundColor: '#f3f4f6',
		borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
		marginTop: 2,
	},
	hashIcon: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#6b7280',
	},
	infoLabel: {
		fontSize: 12,
		color: '#6b7280',
		marginBottom: 4,
	},
	infoValue: {
		fontSize: 14,
		color: '#111827',
		fontWeight: '500',
	},
	emptyStateBox: {
		paddingVertical: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyStateIconWrapper: {
		width: 60,
		height: 60,
		backgroundColor: '#f3f4f6',
		borderRadius: 30,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
		position: 'relative',
	},
	checkBadge: {
		position: 'absolute',
		bottom: 12,
		right: 12,
		backgroundColor: '#9ca3af',
		width: 16,
		height: 16,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: '#f3f4f6',
	},
	emptyStateTitle: {
		fontSize: 15,
		fontWeight: 'bold',
		color: '#374151',
		marginBottom: 4,
	},
	emptyStateSubtitle: {
		fontSize: 13,
		color: '#9ca3af',
		textAlign: 'center',
	},
	quickInfoList: {
		borderWidth: 1,
		borderColor: '#f3f4f6',
		borderRadius: 8,
		padding: 16,
	},
	quickInfoItem: {
		flexDirection: 'column',
		borderBottomWidth: 1,
		borderBottomColor: '#f3f4f6',
		paddingVertical: 12,
		paddingHorizontal: 4,
	},
	quickInfoLabel: {
		fontSize: 12,
		color: '#6b7280',
		marginBottom: 4,
	},
	quickInfoValue: {
		fontSize: 14,
		fontWeight: '600',
		color: '#111827',
	},
	statusWidget: {
		backgroundColor: '#dc2626', // Red baseline
		borderRadius: 12,
		padding: 20,
		shadowColor: '#dc2626',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	statusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	statusIconBox: {
		width: 40,
		height: 40,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	statusLabelText: {
		fontSize: 11,
		fontWeight: 'bold',
		color: 'rgba(255, 255, 255, 0.8)',
		letterSpacing: 0.5,
	},
	statusValueText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff',
		marginTop: 2,
	},
	divider: {
		height: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		marginBottom: 16,
	},
	budgetRow: {
		flexDirection: 'column',
	},
	budgetLabel: {
		fontSize: 11,
		fontWeight: 'bold',
		color: 'rgba(255, 255, 255, 0.8)',
		letterSpacing: 0.5,
		marginBottom: 4,
	},
	budgetValue: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#ffffff',
	},
});

export default ProjectDetailsScreen;