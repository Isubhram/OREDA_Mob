import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/DrawerNavigator';
import SkeletonLoader from '../components/SkeletonLoader';

type DashboardScreenNavigationProp = DrawerNavigationProp<DrawerParamList, 'Dashboard'>;

const DashboardScreen = () => {
    const navigation = useNavigation<DashboardScreenNavigationProp>();
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);

    useEffect(() => {
        // Simulate data fetch
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 2000));
                setDashboardData({
                    stats: [
                        { label: 'Total Projects', value: '24' },
                        { label: 'Active', value: '12' },
                        { label: 'Completed', value: '10' },
                    ],
                });
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>Welcome to Dashboard</Text>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            {/* Show skeleton loaders while loading */}
                            <SkeletonLoader variant="text" width="60%" height={20} style={styles.skeletonSpacing} />
                            <SkeletonLoader variant="card" height={100} style={styles.skeletonSpacing} />
                            <View style={styles.statsRow}>
                                <SkeletonLoader variant="card" height={80} width="30%" />
                                <SkeletonLoader variant="card" height={80} width="30%" />
                                <SkeletonLoader variant="card" height={80} width="30%" />
                            </View>
                            <SkeletonLoader variant="rectangle" height={200} style={styles.skeletonSpacing} />
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.subtitle}>You have successfully logged in.</Text>

                            {/* Display actual data when loaded */}
                            {dashboardData && (
                                <View style={styles.statsContainer}>
                                    <Text style={styles.sectionTitle}>Quick Stats</Text>
                                    <View style={styles.statsRow}>
                                        {dashboardData.stats.map((stat: any, index: number) => (
                                            <View key={index} style={styles.statCard}>
                                                <Text style={styles.statValue}>{stat.value}</Text>
                                                <Text style={styles.statLabel}>{stat.label}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
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
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 80, // Add padding to prevent bottom tab overlap
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    loadingContainer: {
        marginTop: 20,
    },
    skeletonSpacing: {
        marginBottom: 15,
    },
    statsContainer: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
});

export default DashboardScreen;
