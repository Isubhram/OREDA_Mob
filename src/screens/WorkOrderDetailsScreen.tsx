import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Modal, Alert, StatusBar } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { workOrderService } from '../services/workOrderService';
import { WorkOrder } from '../services/tenderService';
import { LinearGradient } from 'expo-linear-gradient';
import { projectAssetService } from '../services/projectAssetService';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const WorkOrderDetailsScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { workOrderId } = route.params || {};

    const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [installDetailsData, setInstallDetailsData] = useState<any>(null);
    const [installDetailsLoading, setInstallDetailsLoading] = useState(false);

    const handleOpenEyeModal = async (instId: number | null) => {
        if (!instId) {
            Alert.alert('Notice', 'Installation details ID is not available for this record yet.');
            return;
        }
        setIsModalVisible(true);
        setInstallDetailsLoading(true);
        setInstallDetailsData(null);
        try {
            const res = await projectAssetService.getFullProjectAsset(instId);
            if (res.Data) {
                setInstallDetailsData(res.Data);
            } else {
                Alert.alert('Notice', 'No extended details found for this installation.');
            }
        } catch (err) {
            console.error('Error fetching full asset details:', err);
            Alert.alert('Error', 'Could not load installation details.');
        } finally {
            setInstallDetailsLoading(false);
        }
    };

    useEffect(() => {
        if (!workOrderId) {
            setError('No Work Order ID provided.');
            setLoading(false);
            return;
        }
        const fetchWorkOrderDetails = async () => {
            try {
                setLoading(true);
                const response = await workOrderService.getWorkOrderById(workOrderId);
                if (response.Data) {
                    setWorkOrder(response.Data);
                } else {
                    setError(response.DisplayMessage || 'Failed to load Work Order details.');
                }
            } catch (err) {
                console.error('Error loading Work Order Details:', err);
                setError('An error occurred while fetching details.');
            } finally {
                setLoading(false);
            }
        };
        fetchWorkOrderDetails();
    }, [workOrderId]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const day = date.getDate().toString().padStart(2, '0');
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear().toString().slice(-2);
            return `${day} ${month} ${year}`;
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#c1272d" />
                    <Text style={{ marginTop: 10, color: '#6b7280' }}>Loading Details...</Text>
                </View>
            </View>
        );
    }

    if (error || !workOrder) {
        return (
            <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error || 'Work Order not found.'}</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const uploadedBgAmount = workOrder.BankGuarantees?.reduce((sum: number, bg: any) => sum + (bg.Amount || 0), 0) || 0;
    const bgTargetAmount = (workOrder.WOValue || 0) * ((workOrder.BGValuePercentage || 0) / 100);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

                {/* Premium Gradient Header */}
                <LinearGradient
                    colors={['#8b1a1a', '#c52525', '#e23f3f']}
                    style={styles.headerGradient}
                >
                    <SafeAreaView edges={['top', 'left', 'right']}>
                        <View style={styles.headerContent}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                                activeOpacity={0.7}
                            >
                                <Feather name="arrow-left" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.headerTitle} numberOfLines={2}>
                                    {workOrder.WONumber}
                                </Text>
                                <View style={styles.headerBadge}>
                                    <Feather name="folder" size={13} color="#fff" />
                                    <Text style={styles.headerBadgeText}>
                                        {workOrder.ProjectName || 'Work Order Details'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* Content */}
                <View style={styles.scrollContent}>

                    {/* Stats Row */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScrollWrapper}>
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <View style={styles.statTop}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#eff6ff' }]}>
                                        <MaterialCommunityIcons name="currency-rupee" size={16} color="#3b82f6" />
                                    </View>
                                    <Text style={[styles.statValue, { color: '#3b82f6' }]}>₹{workOrder.WOValue?.toLocaleString()}</Text>
                                </View>
                                <Text style={styles.statLabel}>WO VALUE</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.statTop}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#fee2e2' }]}>
                                        <Feather name="percent" size={16} color="#ef4444" />
                                    </View>
                                    <Text style={[styles.statValue, { color: '#ef4444' }]}>{workOrder.BGValuePercentage}%</Text>
                                </View>
                                <Text style={styles.statLabel}>BG TARGET %</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.statTop}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#eff6ff' }]}>
                                        <MaterialCommunityIcons name="currency-rupee" size={16} color="#3b82f6" />
                                    </View>
                                    <Text style={[styles.statValue, { color: '#3b82f6' }]}>₹{bgTargetAmount.toLocaleString()}</Text>
                                </View>
                                <Text style={styles.statLabel}>BG TARGET AMT</Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                                <View style={styles.statTop}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
                                        <Feather name="cloud" size={16} color="#22c55e" />
                                    </View>
                                    <Text style={[styles.statValue, { color: '#22c55e' }]}>₹{uploadedBgAmount.toLocaleString()}</Text>
                                </View>
                                <Text style={styles.statLabel}>UPLOADED BG</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.statTop}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
                                        <Feather name="clock" size={16} color="#22c55e" />
                                    </View>
                                    <Text style={[styles.statValue, { color: '#22c55e' }]}>{formatDate(workOrder.WODate)}</Text>
                                </View>
                                <Text style={styles.statLabel}>ISSUE DATE</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.statTop}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#f3e8ff' }]}>
                                        <Feather name="calendar" size={16} color="#a855f7" />
                                    </View>
                                    <Text style={[styles.statValue, { color: '#a855f7' }]}>{formatDate(workOrder.CompletionDueDate)}</Text>
                                </View>
                                <Text style={styles.statLabel}>DUE DATE</Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* General Info Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoCol}>
                            <View style={styles.infoIconBoxGray}>
                                <Text style={styles.infoHash}>#</Text>
                            </View>
                            <View>
                                <Text style={styles.infoSubText}>TENDER</Text>
                                <Text style={styles.infoMainText}>{workOrder.TenderNumber || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoCol}>
                            <View style={styles.infoIconBoxGray}>
                                <Feather name="user" size={16} color="#9ca3af" />
                            </View>
                            <View>
                                <Text style={styles.infoSubText}>VENDOR</Text>
                                <Text style={styles.infoMainText}>{workOrder.VendorName || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* ASSETS Section */}
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="cube-outline" size={18} color="#ea580c" />
                        <Text style={styles.sectionTitle}>ASSETS ({workOrder.Assets?.length || 0})</Text>
                    </View>

                    {workOrder.Assets?.map((asset: any, index: number) => {
                        const installations = workOrder.WorkOrderInstalledAssets?.filter((ia: any) => ia.AssetId === asset.AssetId);
                        return (
                            <View key={`asset-${index}`} style={styles.assetCardOuter}>
                                <View style={styles.assetHeaderRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                                        <Text style={styles.assetTitle}>{asset.AssetName}</Text>
                                        <View style={styles.assetTypePill}>
                                            <Text style={styles.assetTypeLight}>Type: </Text>
                                            <Text style={styles.assetTypeBold}>{asset.AssetType?.[0]?.Name || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.assetTypePill}>
                                            <Text style={styles.assetTypeLight}>Subtype: </Text>
                                            <Text style={styles.assetTypeBold}>{asset.AssetType?.[0]?.AssetSubType?.[0]?.Name || 'N/A'}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.addInstOutlineBtn}>
                                        <Feather name="plus" size={14} color="#ea580c" />
                                        <Text style={styles.addInstOutlineText}>ADD INSTALLATION</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.assetInnerBox}>
                                    {/* Workflow Banner */}
                                    <View style={styles.workflowBanner}>
                                        <View style={styles.workflowBannerHeader}>
                                            <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
                                            <View style={{ marginLeft: 8 }}>
                                                <Text style={styles.workflowBannerTitle}>WORKFLOW INSTRUCTIONS</Text>
                                                <Text style={styles.workflowBannerSubtitle}>Follow these steps carefully to complete the installation cycle.</Text>
                                            </View>
                                        </View>
                                        <View style={styles.workflowRow}>
                                            <View style={styles.workflowCol}>
                                                <View style={styles.workflowColHeader}>
                                                    <Feather name="users" size={14} color="#3b82f6" />
                                                    <Text style={styles.workflowColTitle}>FOR VENDORS / BENEFICIARIES</Text>
                                                </View>
                                                <Text style={styles.workflowColText}>
                                                    Click <Text style={{ fontWeight: 'bold', color: '#ea580c' }}>"Add"</Text> to create a record.
                                                    Use <Text style={{ fontWeight: 'bold', color: '#ea580c' }}>"Modify"</Text> to upload Proof of Material.
                                                    Once verified by OREDA staff, records become locked.
                                                </Text>
                                            </View>
                                            <View style={styles.workflowDivider} />
                                            <View style={styles.workflowCol}>
                                                <View style={styles.workflowColHeader}>
                                                    <Feather name="shield" size={14} color="#8b5cf6" />
                                                    <Text style={styles.workflowColTitle}>FOR OREDA VERIFICATION STAFF</Text>
                                                </View>
                                                <Text style={styles.workflowColText}>
                                                    Review uploaded documents using the <Text style={{ fontWeight: 'bold', color: '#ea580c' }}>"Modify"</Text> button.
                                                    Use <Text style={{ fontWeight: 'bold', color: '#22c55e' }}>"Approve"</Text> or <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>"Reject"</Text> to finalize.
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* List of Installations */}
                                    {installations && installations.length > 0 ? (
                                        <View style={styles.installationsTimeline}>
                                            {installations.map((inst: any, idx: number) => (
                                                <View key={`inst-${idx}`} style={styles.instRow}>
                                                    <View style={styles.timelineDot} />
                                                    <View style={styles.instContent}>
                                                        <View style={styles.instTopRow}>
                                                            <View style={{ flex: 1 }}>
                                                                <View style={styles.instUserRow}>
                                                                    <Feather name="user" size={12} color="#9ca3af" />
                                                                    <Text style={styles.instLabel}>Vendor: </Text>
                                                                    <Text style={styles.instValue}>{inst.VendorName || 'N/A'}</Text>
                                                                </View>
                                                            </View>
                                                            <View style={{ flex: 1 }}>
                                                                <View style={styles.instUserRow}>
                                                                    <Feather name="user" size={12} color="#9ca3af" />
                                                                    <Text style={styles.instLabel}>Beneficiary: </Text>
                                                                    <Text style={styles.instValue}>{inst.BeneficiaryName?.trim() || 'N/A'}</Text>
                                                                </View>
                                                                {inst.BeneficiaryName?.trim() ? (
                                                                    <View style={styles.instContactRow}>
                                                                        <Feather name="phone-call" size={10} color="#9ca3af" />
                                                                        <Text style={styles.instContactText}>{inst.BeneficiaryPhone || 'N/A'}</Text>
                                                                        <Feather name="mail" size={10} color="#9ca3af" style={{ marginLeft: 12 }} />
                                                                        <Text style={styles.instContactText}>{inst.BeneficiaryEmail || 'N/A'}</Text>
                                                                    </View>
                                                                ) : null}
                                                            </View>
                                                        </View>

                                                        <View style={styles.instBottomRow}>
                                                            <View style={styles.instBadgesRow}>
                                                                <View style={[styles.badge, inst.MaterialVerificationStatus === 'Approved' ? styles.badgeGreen : styles.badgeOrange]}>
                                                                    <Text style={[styles.badgeText, inst.MaterialVerificationStatus === 'Approved' ? styles.badgeTextGreen : styles.badgeTextOrange]}>
                                                                        MV: {inst.MaterialVerificationStatus?.toUpperCase() || 'PENDING'}
                                                                    </Text>
                                                                </View>
                                                                {inst.InstallationStatus === 'Installed' && (
                                                                    <View style={[styles.badge, styles.badgeBlue]}>
                                                                        <Text style={[styles.badgeText, styles.badgeTextBlue]}>STATUS: {inst.InstallationStatus.toUpperCase()}</Text>
                                                                    </View>
                                                                )}
                                                            </View>

                                                            <View style={styles.instActionsRow}>
                                                                {inst.MaterialVerificationStatus === 'Approved' ? (
                                                                    <>
                                                                        <TouchableOpacity
                                                                            style={styles.iconBtnOutline}
                                                                            onPress={() => handleOpenEyeModal(inst.WorkOrderInstalledAssetDetailsId)}
                                                                        >
                                                                            <Feather name="eye" size={14} color="#3b82f6" />
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity style={styles.iconBtnOutlineOrange}>
                                                                            <Ionicons name="location-outline" size={14} color="#ea580c" />
                                                                        </TouchableOpacity>
                                                                        <View style={styles.verifiedStamp}>
                                                                            <Ionicons name="checkmark-circle-outline" size={14} color="#10b981" />
                                                                            <Text style={styles.verifiedStampText}>VERIFIED BY OREDA</Text>
                                                                        </View>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <TouchableOpacity style={styles.modUploadBtn}>
                                                                            <Feather name="edit" size={12} color="#ea580c" />
                                                                            <Text style={styles.modUploadText}>MODIFY / UPLOAD</Text>
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity style={styles.fillFormBtn}>
                                                                            <Ionicons name="cube-outline" size={14} color="#3b82f6" />
                                                                            <Text style={styles.fillFormText}>FILL FORM</Text>
                                                                        </TouchableOpacity>
                                                                    </>
                                                                )}
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={{ textAlign: 'center', marginVertical: 20, color: '#9ca3af' }}>No installations found.</Text>
                                    )}

                                    <TouchableOpacity style={styles.addAnotherInstBtn}>
                                        <Feather name="plus" size={14} color="#ea580c" />
                                        <Text style={styles.addAnotherInstText}>ADD ANOTHER INSTALLATION</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}

                    {/* BANK GUARANTEES Section */}
                    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                        <MaterialCommunityIcons name="bank-outline" size={18} color="#ea580c" />
                        <Text style={styles.sectionTitle}>BANK GUARANTEES ({workOrder.BankGuarantees?.length || 0})</Text>
                    </View>

                    {workOrder.BankGuarantees && workOrder.BankGuarantees.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bgScrollWrapper} contentContainerStyle={{ paddingRight: 16 }}>
                            {workOrder.BankGuarantees.map((bg: any, index: number) => (
                                <View key={`bg-${index}`} style={styles.bgCardOuter}>
                                    <View style={styles.bgCardInner}>
                                        <Text style={styles.bgLabel}>BANK NAME</Text>
                                        <Text style={styles.bgBankName}>{bg.BankName}</Text>
                                        <View style={styles.bgMetricRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.bgLabel}>BG NUMBER</Text>
                                                <Text style={styles.bgValue}>{bg.BGNumber}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.bgLabel}>AMOUNT</Text>
                                                <Text style={styles.bgValueGreen}>₹{bg.Amount?.toLocaleString()}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.bgMetricRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.bgLabel}>ISSUE DATE</Text>
                                                <Text style={styles.bgValue}>{formatDate(bg.IssueDate)}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.bgLabel}>EXPIRY DATE</Text>
                                                <Text style={styles.bgValue}>{formatDate(bg.ExpiryDate)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.viewBgBtn}>
                                        <Feather name="cloud" size={14} color="#6b7280" />
                                        <Text style={styles.viewBgText}>VIEW BG DOCUMENT</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <Text style={{ marginVertical: 20, color: '#9ca3af', paddingHorizontal: 4 }}>No Bank Guarantees uploaded.</Text>
                    )}

                </View>
            </ScrollView>

            {/* FULL DETAILS MODAL */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalHeaderTitle}>Installation Data Overview</Text>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.modalCloseBtn}>
                            <Feather name="x" size={24} color="#4b5563" />
                        </TouchableOpacity>
                    </View>

                    {installDetailsLoading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#ea580c" />
                            <Text style={{ marginTop: 12, color: '#6b7280' }}>Fetching Full Details...</Text>
                        </View>
                    ) : installDetailsData ? (
                        <ScrollView contentContainerStyle={styles.modalScroll}>

                            {/* 1. Project Asset */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Project Asset</Text>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Project Name:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.ProjectName || '-'}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Asset Name:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.AssetName || '-'}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Vendor Name:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.VendorName || '-'}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Beneficiary:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.BeneficiaryName || '-'}</Text>
                                </View>
                            </View>

                            {/* 2. Installation Location */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Installation Location</Text>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>State:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.StateName || '-'}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>District:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.DistrictName || '-'}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Block:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.BlockName || '-'}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Gram Panchayat:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.GramPanchayatName || '-'}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Village:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.VillageName || '-'}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Pin Code:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.PinCode || '-'}</Text>
                                </View>
                            </View>

                            {/* 3. Installation Details */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Installation Details</Text>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Status:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.InstallationStatus || '-'}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Date of Installation:</Text>
                                    <Text style={styles.modalFieldValue}>{formatDate(installDetailsData.ProjectAsset?.DateOfInstallation)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Date of Commissioning:</Text>
                                    <Text style={styles.modalFieldValue}>{formatDate(installDetailsData.ProjectAsset?.DateOfCommissioning)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>CMC Period (Years):</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.CmcPeriodInYears || '-'}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Verification Status:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.VerificationStatus || '-'}</Text>
                                </View>
                            </View>

                            {/* 4. Beneficiary */}
                            {installDetailsData.Beneficiary && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Beneficiary Details</Text>
                                    <View style={styles.modalFieldRow}>
                                        <Text style={styles.modalFieldLabel}>Full Name:</Text>
                                        <Text style={styles.modalFieldValue}>{installDetailsData.Beneficiary?.FullName || '-'}</Text>
                                    </View>
                                    <View style={styles.modalFieldRow}>
                                        <Text style={styles.modalFieldLabel}>Father/Spouse:</Text>
                                        <Text style={styles.modalFieldValue}>{installDetailsData.Beneficiary?.FatherOrSpouseName || '-'}</Text>
                                    </View>
                                    <View style={styles.modalFieldRow}>
                                        <Text style={styles.modalFieldLabel}>Phone Number:</Text>
                                        <Text style={styles.modalFieldValue}>{installDetailsData.Beneficiary?.PhoneNumber || '-'}</Text>
                                    </View>
                                    <View style={styles.modalFieldRow}>
                                        <Text style={styles.modalFieldLabel}>Email:</Text>
                                        <Text style={styles.modalFieldValue}>{installDetailsData.Beneficiary?.Email || '-'}</Text>
                                    </View>
                                </View>
                            )}

                            {/* 5. Tender & Work Order */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Tender & Work Order</Text>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Tender Number:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.Tender?.TenderNumber || '-'}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Work Order No:</Text>
                                    <Text style={styles.modalFieldValue}>{installDetailsData.ProjectAsset?.WorkOrderNumber || '-'}</Text>
                                </View>
                            </View>

                            {/* 6. Asset Components */}
                            {installDetailsData.AssetComponents?.Categories?.map((cat: any, cIdx: number) => (
                                <View key={`cat-${cIdx}`} style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>{cat.CategoryName || 'Asset Component'}</Text>
                                    {cat.Headers?.map((header: any, hIdx: number) => (
                                        <View key={`head-${hIdx}`} style={styles.modalFieldRow}>
                                            <Text style={styles.modalFieldLabel}>{header.HeaderName}:</Text>
                                            <Text style={styles.modalFieldValueDark}>{header.DisplayValue || '-'}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}

                            {/* 7. Documents */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Documents</Text>
                                <View style={styles.modalFieldRowDoc}>
                                    <Text style={styles.modalFieldLabel}>Installation Photo:</Text>
                                    <TouchableOpacity style={styles.docActionBtn}>
                                        <Feather name="image" size={14} color="#ea580c" />
                                        <Text style={styles.docActionText}>
                                            {installDetailsData.ProjectAsset?.InstallationPhotoUrl ? 'View Photo' : 'No Document'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.modalFieldRowDoc}>
                                    <Text style={styles.modalFieldLabel}>JCC Document:</Text>
                                    <TouchableOpacity style={styles.docActionBtn}>
                                        <Feather name="file-text" size={14} color="#ea580c" />
                                        <Text style={styles.docActionText}>
                                            {installDetailsData.ProjectAsset?.JccDocumentUrl ? 'View JCC' : 'No Document'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </ScrollView>
                    ) : null}
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: '#dc2626', marginBottom: 20 },
    backBtn: { backgroundColor: '#c1272d', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    backBtnText: { color: '#fff', fontWeight: 'bold' },

    // Gradient Header (matching ProjectDetails)
    headerGradient: { paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: isMobile ? 12 : 20 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    headerTitleContainer: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
    headerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    headerBadgeText: { fontSize: 12, color: '#fff', marginLeft: 6, fontWeight: '500' },

    scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, marginTop: -20 },

    // Stats Grid
    statsScrollWrapper: { marginBottom: 16, marginHorizontal: -16, paddingHorizontal: 16 },
    statsRow: { flexDirection: 'row', gap: 12, paddingRight: 32 },
    statCard: { backgroundColor: '#fff', width: 140, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center' },
    statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    statIconBox: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 14, fontWeight: 'bold' },
    statLabel: { fontSize: 10, color: '#9ca3af', fontWeight: 'bold' },

    // General Info Card
    infoCard: { flexDirection: isMobile ? 'column' : 'row', backgroundColor: '#fff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 24, gap: isMobile ? 12 : 24 },
    infoCol: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoIconBoxGray: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
    infoHash: { color: '#9ca3af', fontSize: 16, fontWeight: 'bold' },
    infoSubText: { fontSize: 9, color: '#9ca3af', fontWeight: 'bold' },
    infoMainText: { fontSize: 13, color: '#111827', fontWeight: '600' },
    infoDivider: { width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 8 },

    // Sections
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#4b5563', letterSpacing: 0.5 },

    // Asset Cards
    assetCardOuter: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16, overflow: 'hidden' },
    assetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    assetTitle: { fontSize: 15, fontWeight: 'bold', color: '#1f2937', marginRight: 12 },
    assetTypePill: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
    assetTypeLight: { fontSize: 11, color: '#9ca3af' },
    assetTypeBold: { fontSize: 11, color: '#4b5563', fontWeight: '600' },
    addInstOutlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb' },
    addInstOutlineText: { fontSize: 10, fontWeight: 'bold', color: '#6b7280' },
    assetInnerBox: { padding: 16 },

    // Workflow Banner
    workflowBanner: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 16 },
    workflowBannerHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    workflowBannerTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
    workflowBannerSubtitle: { fontSize: 11, color: '#3b82f6', marginTop: 2, fontStyle: 'italic' },
    workflowRow: { flexDirection: isMobile ? 'column' : 'row', backgroundColor: '#fff', borderRadius: 6, padding: 12, gap: 12 },
    workflowCol: { flex: 1 },
    workflowColHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    workflowColTitle: { fontSize: 10, fontWeight: 'bold', color: '#4b5563' },
    workflowColText: { fontSize: 10, color: '#6b7280', lineHeight: 16 },
    workflowDivider: { width: isMobile ? ('100%' as any) : 1, height: isMobile ? 1 : ('100%' as any), backgroundColor: '#e5e7eb' },

    // Timeline
    installationsTimeline: { paddingLeft: 4, borderLeftWidth: 2, borderLeftColor: '#e5e7eb', marginLeft: 6, marginBottom: 16 },
    instRow: { flexDirection: 'row', marginBottom: 16 },
    timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9ca3af', position: 'absolute', left: -9, top: 20 },
    instContent: { flex: 1, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#f3f4f6', marginLeft: 16, padding: 14 },
    instTopRow: { flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 16 },
    instUserRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    instLabel: { fontSize: 11, color: '#6b7280' },
    instValue: { fontSize: 12, color: '#111827', fontWeight: '600' },
    instContactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 18 },
    instContactText: { fontSize: 10, color: '#9ca3af' },
    instBottomRow: { flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#f9fafb', paddingTop: 12 },
    instBadgesRow: { flexDirection: 'row', gap: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    badgeGreen: { backgroundColor: '#dcfce7' },
    badgeTextGreen: { color: '#16a34a' },
    badgeOrange: { backgroundColor: '#ffedd5' },
    badgeTextOrange: { color: '#ea580c' },
    badgeBlue: { backgroundColor: '#eff6ff' },
    badgeTextBlue: { color: '#3b82f6' },
    instActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtnOutline: { width: 28, height: 28, borderRadius: 4, borderWidth: 1, borderColor: '#bfdbfe', justifyContent: 'center', alignItems: 'center' },
    iconBtnOutlineOrange: { width: 28, height: 28, borderRadius: 4, borderWidth: 1, borderColor: '#fed7aa', justifyContent: 'center', alignItems: 'center' },
    verifiedStamp: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
    verifiedStampText: { fontSize: 10, fontWeight: 'bold', color: '#10b981' },
    modUploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#fed7aa' },
    modUploadText: { fontSize: 10, fontWeight: 'bold', color: '#ea580c' },
    fillFormBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
    fillFormText: { fontSize: 10, fontWeight: 'bold', color: '#3b82f6' },
    addAnotherInstBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
    addAnotherInstText: { fontSize: 11, fontWeight: 'bold', color: '#dc2626' },

    // BG Cards
    bgScrollWrapper: { marginHorizontal: -16, paddingHorizontal: 16, paddingBottom: 16 },
    bgCardOuter: { width: 260, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#fdba74', marginRight: 16, borderLeftWidth: 4, borderLeftColor: '#f97316' },
    bgCardInner: { padding: 14 },
    bgLabel: { fontSize: 9, color: '#9ca3af', fontWeight: 'bold', marginBottom: 2 },
    bgBankName: { fontSize: 13, color: '#111827', fontWeight: 'bold', marginBottom: 12 },
    bgMetricRow: { flexDirection: 'row', marginBottom: 10 },
    bgValue: { fontSize: 12, color: '#4b5563', fontWeight: '600' },
    bgValueGreen: { fontSize: 12, color: '#10b981', fontWeight: 'bold' },
    viewBgBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#f9fafb', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
    viewBgText: { fontSize: 10, fontWeight: 'bold', color: '#4b5563' },

    // Modal Styles
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    modalCloseBtn: { padding: 4 },
    modalScroll: { padding: 16, paddingBottom: 40 },
    modalSection: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    modalSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#ea580c', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8 },
    modalFieldRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    modalFieldRowDoc: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalFieldLabel: { fontSize: 12, color: '#6b7280', flex: 1 },
    modalFieldValue: { fontSize: 12, color: '#1f2937', fontWeight: '500', flex: 1.5, textAlign: 'right' },
    modalFieldValueDark: { fontSize: 12, color: '#111827', fontWeight: 'bold', flex: 1.5, textAlign: 'right' },
    docActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' },
    docActionText: { fontSize: 11, fontWeight: 'bold', color: '#ea580c' },
});

export default WorkOrderDetailsScreen;
