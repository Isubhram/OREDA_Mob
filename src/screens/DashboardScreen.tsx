import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/authService';
import { fetchProjects } from '../services/projectService';
import { tenderService } from '../services/tenderService';
import { workOrderService } from '../services/workOrderService';
import { incidentService } from '../services/incidentService';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const MAINTENANCE_DATA = [
	{
		id: '1',
		project: 'Solar Cold Storage - Puri',
		type: 'Routine Checkup',
		date: '15 Mar 2026',
		status: 'Scheduled',
		vendor: 'Ranjita Nayak',
	},
	{
		id: '2',
		project: 'Bhubaneswar Smart Light',
		type: 'Repair & Replacement',
		date: '18 Mar 2026',
		status: 'Pending',
		vendor: 'Tech Solutions Ltd',
	},
];

const DashboardScreen = () => {
	const navigation = useNavigation<any>();
	const [isLoading, setIsLoading] = useState(true);
	const [userData, setUserData] = useState<any>(null);
	const [stats, setStats] = useState({
		projects: 0,
		tenders: 0,
		workOrders: 0,
		incidents: 0,
	});

	useEffect(() => {
		const loadDashboardData = async () => {
			try {
				const auth = await authService.getAuthData();
				setUserData(auth?.UserData);

				const [pRes, tRes, wRes, iRes] = await Promise.all([
					fetchProjects(1, 1).catch(() => ({ TotalRecords: 0 })),
					tenderService.getTenders(1, 1).catch(() => ({ TotalRecords: 0 })),
					workOrderService.getWorkOrders(1, 1).catch(() => ({ TotalRecords: 0 })),
					incidentService.getIncidentTickets(1, 1).catch(() => ({ TotalRecords: 0 })),
				]);

				setStats({
					projects: pRes.TotalRecords || 0,
					tenders: tRes.TotalRecords || 0,
					workOrders: wRes.TotalRecords || 0,
					incidents: iRes.TotalRecords || 0,
				});
			} catch (error) {
				console.error('Error loading dashboard data:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadDashboardData();
	}, []);

	// Compact horizontal stat card: icon | value + label
	const QuickStat = ({ label, value, icon, color, onPress }: any) => (
		<TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={onPress}>
			<View style={[styles.statIconBox, { backgroundColor: color + '18' }]}>
				<MaterialCommunityIcons name={icon} size={20} color={color} />
			</View>
			<View style={styles.statContent}>
				<Text style={[styles.statValue, { color }]}>{value}</Text>
				<Text style={styles.statLabel}>{label}</Text>
			</View>
			<View style={[styles.statDecorator, { backgroundColor: color + '08' }]} />
		</TouchableOpacity>
	);

	const MaintenanceCard = ({ item }: { item: (typeof MAINTENANCE_DATA)[0] }) => (
		<TouchableOpacity style={styles.maintenanceCard} activeOpacity={0.7}>
			<View style={styles.mCardHeader}>
				<Text style={styles.mProject} numberOfLines={1}>
					{item.project}
				</Text>
				<View
					style={[
						styles.mStatusTag,
						{ backgroundColor: item.status === 'Scheduled' ? '#dcfce7' : '#fef9c3' },
					]}
				>
					<Text style={[styles.mStatusText, { color: item.status === 'Scheduled' ? '#166534' : '#854d0e' }]}>
						{item.status}
					</Text>
				</View>
			</View>
			<View style={styles.mCardFooter}>
				<Feather name='tool' size={11} color='#94a3b8' />
				<Text style={styles.mType}>{item.type}</Text>
				<Feather name='calendar' size={11} color='#94a3b8' style={{ marginLeft: 8 }} />
				<Text style={styles.mDate}>{item.date}</Text>
			</View>
		</TouchableOpacity>
	);

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle='light-content' backgroundColor='#8b1a1a' />
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				{/* ── Header Banner ── */}
				<LinearGradient
					colors={['#8b1a1a', '#c1272d', '#610b0b']}
					style={styles.welcomeBanner}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1.5 }}
				>
					<View style={styles.decorativeCircle1} />
					<View style={styles.decorativeCircle2} />
					<View style={styles.headerRow}>
						<View>
							<View style={styles.greetingRow}>
								<Text style={styles.greetingText}>Hello, </Text>
								<Text style={styles.userNameText}>{userData?.Name || 'User'}</Text>
							</View>
							<View style={styles.roleBadge}>
								<Feather name='shield' size={9} color='#fff' style={{ marginRight: 4 }} />
								<Text style={styles.roleBadgeText}>{userData?.RoleName || 'Operator'}</Text>
							</View>
						</View>
						<View style={styles.livePill}>
							<View style={styles.liveDot} />
							<Text style={styles.liveText}>LIVE</Text>
						</View>
					</View>
				</LinearGradient>

				<View style={styles.content}>
					{/* ── Overview Stats (2×2 compact grid) ── */}
					<Text style={styles.sectionHeader}>Overview</Text>
					<View style={styles.statsGrid}>
						<QuickStat
							label='Projects'
							value={stats.projects}
							icon='briefcase-variant'
							color='#3b82f6'
							onPress={() => navigation.navigate('Project')}
						/>
						<QuickStat
							label='Tenders'
							value={stats.tenders}
							icon='file-document-edit'
							color='#f59e0b'
							onPress={() => navigation.navigate('Tender')}
						/>
						<QuickStat
							label='Work Orders'
							value={stats.workOrders}
							icon='clipboard-check'
							color='#10b981'
							onPress={() => navigation.navigate('WorkOrder')}
						/>
						<QuickStat
							label='Incidents'
							value={stats.incidents}
							icon='alert-octagon'
							color='#ef4444'
							onPress={() => navigation.navigate('IncidentTicket')}
						/>
					</View>

					{/* ── Maintenance Schedule ── */}
					<Text style={styles.sectionHeader}>Maintenance Schedule</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.maintenanceList}
					>
						{MAINTENANCE_DATA.map((item) => (
							<MaintenanceCard key={item.id} item={item} />
						))}
					</ScrollView>

					{/* ── Quick Actions (horizontal row) ── */}
					<Text style={styles.sectionHeader}>Quick Actions</Text>
					<View style={styles.actionGrid}>
						<TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('WorkOrder')}>
							<View style={[styles.actionIconBox, { backgroundColor: '#eff6ff' }]}>
								<Feather name='plus-circle' size={20} color='#3b82f6' />
							</View>
							<Text style={styles.actionTitle}>Add Site</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Tender')}>
							<View style={[styles.actionIconBox, { backgroundColor: '#fff7ed' }]}>
								<MaterialCommunityIcons name='file-search' size={20} color='#f59e0b' />
							</View>
							<Text style={styles.actionTitle}>Track Tender</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.actionCard}
							onPress={() => navigation.navigate('IncidentTicket')}
						>
							<View style={[styles.actionIconBox, { backgroundColor: '#fef2f2' }]}>
								<Feather name='life-buoy' size={20} color='#ef4444' />
							</View>
							<Text style={styles.actionTitle}>Get Support</Text>
						</TouchableOpacity>
					</View>

					{/* ── Notice Board ── */}
					<Text style={styles.sectionHeader}>Notice Board</Text>
					<View style={styles.announcementCard}>
						<View style={styles.announcementIcon}>
							<Feather name='bell' size={16} color='#c1272d' />
						</View>
						<View style={styles.announcementContent}>
							<Text style={styles.announcementTitle}>Policy Update</Text>
							<Text style={styles.announcementText}>
								New guidelines for rooftop solar projects have been uploaded to the portal center.
							</Text>
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
		backgroundColor: '#f8fafc',
	},
	scrollContent: {
		paddingBottom: 24,
	},

	/* ── Header ── */
	welcomeBanner: {
		paddingHorizontal: 18,
		paddingTop: 32,
		paddingBottom: 18,
		borderBottomLeftRadius: 28,
		borderBottomRightRadius: 28,
		elevation: 8,
		shadowColor: '#c1272d',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 10,
		overflow: 'hidden',
	},
	decorativeCircle1: {
		position: 'absolute',
		top: -30,
		right: -20,
		width: 110,
		height: 110,
		borderRadius: 55,
		backgroundColor: 'rgba(255,255,255,0.06)',
	},
	decorativeCircle2: {
		position: 'absolute',
		bottom: -40,
		right: 50,
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: 'rgba(255,255,255,0.04)',
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	greetingRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
	},
	greetingText: {
		fontSize: 15,
		color: 'rgba(255,255,255,0.8)',
		fontWeight: '600',
	},
	userNameText: {
		fontSize: 18,
		fontWeight: '900',
		color: '#fff',
	},
	roleBadge: {
		backgroundColor: 'rgba(255,255,255,0.15)',
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 12,
		alignSelf: 'flex-start',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.25)',
		marginTop: 4,
		flexDirection: 'row',
		alignItems: 'center',
	},
	roleBadgeText: {
		color: '#fff',
		fontSize: 10,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	livePill: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255,255,255,0.15)',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.25)',
		gap: 5,
	},
	liveDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#4ade80',
	},
	liveText: {
		color: '#fff',
		fontSize: 10,
		fontWeight: '900',
		letterSpacing: 1,
	},

	/* ── Content ── */
	content: {
		paddingHorizontal: 14,
		paddingTop: 14,
	},
	sectionHeader: {
		fontSize: 14,
		fontWeight: '800',
		color: '#374151',
		letterSpacing: 0.3,
		marginBottom: 8,
		marginTop: 4,
		textTransform: 'uppercase',
	},

	/* ── Stat Cards ── */
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 14,
	},
	statCard: {
		backgroundColor: '#fff',
		width: (width - 28 - 8) / 2, // 2 per row, accounting for gap + padding
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#f1f5f9',
		overflow: 'hidden',
		position: 'relative',
		elevation: 1,
		gap: 10,
	},
	statIconBox: {
		width: 38,
		height: 38,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},
	statContent: {
		flex: 1,
		zIndex: 1,
	},
	statValue: {
		fontSize: 22,
		fontWeight: '900',
		lineHeight: 26,
	},
	statLabel: {
		fontSize: 11,
		color: '#64748b',
		fontWeight: '600',
		marginTop: 1,
	},
	statDecorator: {
		position: 'absolute',
		top: -8,
		right: -8,
		width: 44,
		height: 44,
		borderRadius: 22,
		zIndex: 0,
	},

	/* ── Maintenance Cards ── */
	maintenanceList: {
		paddingRight: 14,
		marginBottom: 14,
	},
	maintenanceCard: {
		backgroundColor: '#fff',
		width: width * 0.68,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 14,
		marginRight: 10,
		borderWidth: 1,
		borderColor: '#f1f5f9',
		elevation: 1,
	},
	mCardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 6,
		gap: 6,
	},
	mProject: {
		flex: 1,
		fontSize: 13,
		fontWeight: 'bold',
		color: '#0f172a',
	},
	mStatusTag: {
		paddingHorizontal: 7,
		paddingVertical: 2,
		borderRadius: 6,
		flexShrink: 0,
	},
	mStatusText: {
		fontSize: 9,
		fontWeight: 'bold',
		textTransform: 'uppercase',
	},
	mCardFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		borderTopWidth: 1,
		borderTopColor: '#f1f5f9',
		paddingTop: 6,
	},
	mType: {
		fontSize: 11,
		color: '#64748b',
	},
	mDate: {
		fontSize: 11,
		color: '#64748b',
	},

	/* ── Quick Actions ── */
	actionGrid: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 14,
	},
	actionCard: {
		flex: 1,
		backgroundColor: '#fff',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#f1f5f9',
		alignItems: 'center',
		paddingVertical: 12,
		elevation: 1,
		gap: 6,
	},
	actionIconBox: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	actionTitle: {
		fontSize: 10,
		fontWeight: '700',
		color: '#334155',
		textAlign: 'center',
	},

	/* ── Notice Board ── */
	announcementCard: {
		flexDirection: 'row',
		backgroundColor: '#fff',
		padding: 12,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#f1f5f9',
		gap: 12,
		alignItems: 'center',
		elevation: 1,
	},
	announcementIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#fff1f2',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},
	announcementContent: {
		flex: 1,
	},
	announcementTitle: {
		fontSize: 13,
		fontWeight: 'bold',
		color: '#0f172a',
	},
	announcementText: {
		fontSize: 11,
		color: '#64748b',
		marginTop: 2,
		lineHeight: 16,
	},
});

export default DashboardScreen;
