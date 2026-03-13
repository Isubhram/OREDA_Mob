import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { tenderService, Tender, WorkOrder } from '../services/tenderService';
import { projectAssetService, DropdownItem } from '../services/projectAssetService';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Modal, TextInput } from 'react-native';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const TenderDetailsScreen = ({ route, navigation }: any) => {
    const { tenderId } = route.params;
    const [tender, setTender] = useState<Tender | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isCapturingLocation, setIsCapturingLocation] = useState(false);
    const [expandedWOIds, setExpandedWOIds] = useState<number[]>([]);

    // Selection Modal State
    const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);
    const [selectionData, setSelectionData] = useState<DropdownItem[]>([]);
    const [selectionTitle, setSelectionTitle] = useState('');
    const [selectionKey, setSelectionKey] = useState('');

    // Raw Material Upload State
    const [isMaterialModalVisible, setIsMaterialModalVisible] = useState(false);
    const [materialFiles, setMaterialFiles] = useState<any[]>([]);
    const [materialAssetId, setMaterialAssetId] = useState<number | null>(null);
    const [materialAssetTypeId, setMaterialAssetTypeId] = useState<number | null>(null);
    const [materialAssetSubTypeId, setMaterialAssetSubTypeId] = useState<number | null>(null);
    const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);

    // Dropdown Data
    const [districts, setDistricts] = useState<DropdownItem[]>([]);
    const [blocks, setBlocks] = useState<DropdownItem[]>([]);
    const [gps, setGps] = useState<DropdownItem[]>([]);
    const [villages, setVillages] = useState<DropdownItem[]>([]);

    // Form Data State
    const [formData, setFormData] = useState({
        // Step 0: Initial
        assetId: '',
        // Step 1: Beneficiary (A)
        fullName: '',
        fatherName: '',
        phoneNumber: '',
        altPhoneNumber: '',
        email: '',
        gender: '',
        ses: '',
        caste: '',
        beneficiaryPhoto: null as any,
        // Step 2 & 4: Location (B & 4)
        stateId: 1,
        districtId: null as number | null,
        blockId: null as number | null,
        gpId: null as number | null,
        villageId: null as number | null,
        habitation: '',
        pinCode: '',
        houseNo: '',
        areaLocality: '',
        streetLandmark: '',
        latitude: '',
        longitude: '',
        // Step 3: Technical (3)
        capacity: '',
        cmcPeriod: '',
        installationClass: '',
        dateOfInstallation: '',
        dateOfCommissioning: '',
        // Step 5: Documents Upload
        installationPhoto: null as any,
        installationCertificate: null as any,
        jccDocument: null as any,
        // Step 6: Component Asset Details
        componentValues: [] as any[],
    });

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await tenderService.getTenderById(tenderId);
                setTender(response.Data);
            } catch (error) {
                console.error('Error fetching tender details:', error);
                Alert.alert('Error', 'Failed to fetch tender details');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [tenderId]);

    // Fetch Dropdowns
    useEffect(() => {
        const fetchDistricts = async () => {
            const res = await projectAssetService.getDistricts(1);
            setDistricts(res.Data);
        };
        if (isFormModalVisible) fetchDistricts();
    }, [isFormModalVisible]);

    useEffect(() => {
        const fetchBlocks = async () => {
            if (formData.districtId) {
                const res = await projectAssetService.getBlocks(formData.districtId);
                setBlocks(res.Data);
            }
        };
        fetchBlocks();
    }, [formData.districtId]);

    useEffect(() => {
        const fetchGps = async () => {
            if (formData.blockId) {
                const res = await projectAssetService.getGramPanchayats(formData.blockId);
                setGps(res.Data);
            }
        };
        fetchGps();
    }, [formData.blockId]);

    useEffect(() => {
        const fetchVillages = async () => {
            if (formData.gpId) {
                const res = await projectAssetService.getVillages(formData.gpId);
                setVillages(res.Data);
            }
        };
        fetchVillages();
    }, [formData.gpId]);


    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera access is required to take photos.');
            return false;
        }
        return true;
    };

    const handleTakePhoto = async (onFileSelected: (asset: any) => void) => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                onFileSelected({
                    uri: asset.uri,
                    name: asset.fileName || `photo_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                    mimeType: 'image/jpeg',
                });
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to capture photo');
        }
    };

    const handlePickFromGallery = async (onFileSelected: (asset: any) => void) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                onFileSelected({
                    uri: asset.uri,
                    name: asset.fileName || `image_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                    mimeType: 'image/jpeg',
                });
            }
        } catch (error) {
            console.error('Error picking from gallery:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleAddFileChoice = (onFileSelected: (asset: any) => void, allowDocuments = false) => {
        const options = [
            { text: 'Take Photo', onPress: () => handleTakePhoto(onFileSelected) },
            { text: 'Choose from Gallery', onPress: () => handlePickFromGallery(onFileSelected) },
        ];

        if (allowDocuments) {
            options.push({
                text: 'Select Document',
                onPress: async () => {
                    try {
                        const result = await DocumentPicker.getDocumentAsync({
                            type: ['application/pdf', 'image/*'],
                            copyToCacheDirectory: true,
                        });
                        if (!result.canceled) {
                            onFileSelected(result.assets[0]);
                        }
                    } catch (err) {
                        console.error('Error picking document:', err);
                        Alert.alert('Error', 'Failed to pick document');
                    }
                }
            });
        }

        options.push({ text: 'Cancel', style: 'cancel' } as any);

        Alert.alert(
            'Select Source',
            'Choose how you want to add the file',
            options as any
        );
    };

    const handleUploadBG = async (wo: WorkOrder) => {
        handleAddFileChoice((asset) => {
            Alert.alert('Success', `File ${asset.name} selected for WO: ${wo.WONumber}`);
            // In a real app, you might trigger an upload here or save to state
        }, true);
    };

    const pickMaterialFiles = async () => {
        handleAddFileChoice((asset) => {
            setMaterialFiles(prev => [...prev, asset]);
        }, true);
    };

    const removeMaterialFile = (index: number) => {
        setMaterialFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleMaterialUpload = async () => {
        if (!selectedWorkOrder) return;

        // Use 0 or null as fallback for optional IDs if they are null
        const assetId = materialAssetId || 0;
        const assetTypeId = materialAssetTypeId || 0;
        const assetSubTypeId = (materialAssetSubTypeId === 0 || !materialAssetSubTypeId) ? null : materialAssetSubTypeId;

        if (materialFiles.length === 0) {
            Alert.alert('Error', 'Please select at least one file');
            return;
        }

        setIsUploadingMaterial(true);
        try {
            await tenderService.uploadRawMaterial(selectedWorkOrder.Id, {
                AssetId: assetId,
                AssetTypeId: assetTypeId,
                AssetSubTypeId: assetSubTypeId,
                Files: materialFiles,
            });

            Alert.alert('Success', 'Raw material uploaded successfully');
            setIsMaterialModalVisible(false);
            setMaterialFiles([]);
            setMaterialAssetId(null);
            setMaterialAssetTypeId(null);
            setMaterialAssetSubTypeId(null);
        } catch (error) {
            console.error('Error uploading material:', error);
            Alert.alert('Error', 'An error occurred while uploading material');
        } finally {
            setIsUploadingMaterial(false);
        }
    };

    const toggleWorkOrder = (id: number) => {
        setExpandedWOIds(prev =>
            prev.includes(id) ? prev.filter(woId => woId !== id) : [...prev, id]
        );
    };

    const handleFillForm = (wo: WorkOrder) => {
        setSelectedWorkOrder(wo);
        setCurrentStep(0);
        setIsFormModalVisible(true);
    };

    const handleNextStep = async () => {
        if (!tender) return;

        try {
            // Save draft at each step
            const draftData: any = {
                Id: 0,
                ProjectId: tender.Id,
                WorkOrderId: selectedWorkOrder?.Id,
                AssetId: formData.assetId,
                CurrentStep: currentStep + 1,
            };

            // Map form data to steps based on API structure
            if (currentStep === 0) {
                draftData.Step1 = {
                    ProjectId: tender.Id,
                    WorkOrderId: selectedWorkOrder?.Id,
                    AssetId: formData.assetId,
                };
            } else if (currentStep === 3) {
                draftData.Step3 = {
                    DateOfInstallation: formData.dateOfInstallation,
                    DateOfCommissioning: formData.dateOfCommissioning,
                    CmcPeriodInYears: parseInt(formData.cmcPeriod) || 0,
                    InstallationClass: formData.installationClass,
                    Capacity: parseFloat(formData.capacity) || 0
                };
            } else if (currentStep === 4) {
                draftData.Step4 = {
                    StateId: formData.stateId,
                    DistrictId: formData.districtId,
                    BlockId: formData.blockId,
                    GramPanchayatId: formData.gpId,
                    VillageId: formData.villageId,
                    PinCode: formData.pinCode,
                    Latitude: parseFloat(formData.latitude) || 0,
                    Longitude: parseFloat(formData.longitude) || 0,
                    IsPrimary: true
                };
            } else if (currentStep === 5) {
                draftData.Step5 = {
                    InstallationPhoto: formData.installationPhoto,
                    InstallationCertificate: formData.installationCertificate,
                    JccDocument: formData.jccDocument,
                };
            } else if (currentStep === 6) {
                draftData.Step6 = {
                    ComponentValues: formData.componentValues,
                };
            }

            // await projectAssetService.saveDraft(draftData);

            if (currentStep < 6) {
                setCurrentStep(currentStep + 1);
            } else {
                Alert.alert('Success', 'Project Asset Initiation Complete');
                setIsFormModalVisible(false);
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            Alert.alert('Error', 'Failed to save progress');
        }
    };

    const handleGetCurrentLocation = async () => {
        setIsCapturingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied');
                setIsCapturingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const lat = location.coords.latitude.toString();
            const lon = location.coords.longitude.toString();

            updateFormData('latitude', lat);
            updateFormData('longitude', lon);

            Alert.alert(
                'Location Captured',
                `Latitude: ${lat}\nLongitude: ${lon}`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Failed to capture location');
        } finally {
            setIsCapturingLocation(false);
        }
    };

    const updateFormData = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const renderFormField = (label: string, key: string, icon: any, placeholder: string = '', required: boolean = false) => (
        <View style={styles.formField}>
            <Text style={styles.formLabel}>{label}{required && <Text style={{ color: '#dc2626' }}> *</Text>}</Text>
            <View style={styles.inputWrapper}>
                {icon && <View style={styles.inputIcon}>{icon}</View>}
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    value={(formData as any)[key]}
                    onChangeText={(text) => updateFormData(key, text)}
                />
            </View>
        </View>
    );

    const renderDropdownField = (label: string, key: string, data: DropdownItem[], icon: any, required: boolean = false) => {
        const selectedItem = data.find(item => item.Id === (formData as any)[key]);

        const openSelection = () => {
            if (data.length === 0) {
                Alert.alert('Info', `No ${label} available`);
                return;
            }
            setSelectionData(data);
            setSelectionTitle(`Select ${label}`);
            setSelectionKey(key);
            setIsSelectionModalVisible(true);
        };

        return (
            <View style={styles.formField}>
                <Text style={styles.formLabel}>{label}{required && <Text style={{ color: '#dc2626' }}> *</Text>}</Text>
                <TouchableOpacity style={styles.dropdownTrigger} onPress={openSelection}>
                    <Text style={styles.dropdownValue}>{selectedItem?.Name || `Select ${label}`}</Text>
                    <MaterialCommunityIcons name="unfold-more-horizontal" size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>
        );
    };

    const getModalHeader = () => {
        const titles = [
            { title: 'Initiate Project Asset', subtitle: 'Set up initial details' },
            { title: 'Initiate Project Asset', subtitle: 'Beneficiary & Location' },
            { title: 'Initiate Project Asset', subtitle: 'Beneficiary & Location' },
            { title: 'Initiate Project Asset', subtitle: 'Technical Details' },
            { title: 'Initiate Project Asset', subtitle: 'Inst. Location' },
            { title: 'Initiate Project Asset', subtitle: 'Documents Upload' },
            { title: 'Initiate Project Asset', subtitle: 'Component Asset Details' },
        ];
        return titles[currentStep] || titles[0];
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#dc2626" />
                </View>
            </SafeAreaView>
        );
    }

    if (!tender) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <Text>Tender not found</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                        <Text style={{ color: '#dc2626' }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const totalWOValue = tender.WorkOrders?.reduce((sum, wo) => sum + (wo.WOValue || 0), 0) || 0;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
            >
                {/* Header Section */}
                <View style={styles.headerCard}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Feather name='arrow-left' size={18} color='#4b5563' />
                    </TouchableOpacity>
                    <View style={styles.headerIconBox}>
                        <MaterialCommunityIcons name='file-document' size={24} color='#fff' />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>{tender.TenderNumber}</Text>
                        <View style={styles.headerSubtitleRow}>
                            <Feather name='folder' size={14} color='#6b7280' />
                            <Text style={styles.headerSubtitle}> {tender.ProjectName}</Text>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.btnOutlineOrange}>
                            <Text style={styles.btnOutlineTextOrange}>Assign Work Order</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnSolidRed}>
                            <Text style={styles.btnSolidText}>Assign LOI</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Statistics Cards - 2 per row */}
                <View style={styles.statsContainer}>
                    {/* Row 1: LOI and Work Orders */}
                    <View style={styles.statsRowWrapper}>
                        <View style={[styles.statCard, { borderLeftColor: '#fecaca', borderLeftWidth: 4 }]}>
                            <View style={styles.statIconBoxRed}>
                                <MaterialIcons name="description" size={20} color="#dc2626" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.statLabel}>Letters of Intent</Text>
                                <Text style={styles.statSubLabel}>Total LOIs assigned</Text>
                            </View>
                            <Text style={styles.statValue}>{tender.LOIs?.length || 0}</Text>
                        </View>

                        <View style={[styles.statCard, { borderLeftColor: '#fed7aa', borderLeftWidth: 4 }]}>
                            <View style={styles.statIconBoxOrange}>
                                <MaterialIcons name="work" size={20} color="#f97316" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.statLabel}>Work Orders</Text>
                                <Text style={styles.statSubLabel}>Active work orders</Text>
                            </View>
                            <Text style={styles.statValue}>{tender.WorkOrders?.length || 0}</Text>
                        </View>
                    </View>

                    {/* Row 2: Total Value and Bank Guarantee */}
                    <View style={styles.statsRowWrapper}>
                        <View style={[styles.statCard, { borderLeftColor: '#bbf7d0', borderLeftWidth: 4 }]}>
                            <View style={styles.statIconBoxGreen}>
                                <MaterialIcons name="currency-rupee" size={20} color="#16a34a" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.statLabel}>Total Value</Text>
                                <Text style={styles.statSubLabel}>Combined WO value</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.statValue, { color: '#16a34a' }]}>{totalWOValue}</Text>
                                <Text style={styles.statUnit}>Cr</Text>
                            </View>
                        </View>

                        <View style={[styles.statCard, { borderLeftColor: '#bfdbfe', borderLeftWidth: 4 }]}>
                            <View style={styles.statIconBoxBlue}>
                                <MaterialIcons name="account-balance" size={20} color="#3b82f6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.statLabel}>Bank Guarantees</Text>
                                <Text style={styles.statSubLabel}>Total BG amount</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.statValue, { color: '#3b82f6' }]}>0</Text>
                                <Text style={styles.statUnit}>Cr</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Info & Sidebar Container */}
                <View style={styles.contentGrid}>
                    {/* Main Content Column */}
                    <View style={styles.mainColumn}>
                        {/* Tender Information */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxRed}>
                                    <Feather name="info" size={16} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Tender Information</Text>
                                    <Text style={styles.sectionSubtitle}>Complete tender details and timeline</Text>
                                </View>
                            </View>
                            <View style={styles.infoGrid}>
                                <InfoItem label="Tender Number" value={tender.TenderNumber} icon="#" />
                                <InfoItem label="Project Name" value={tender.ProjectName} icon={<Feather name="folder" size={14} color="#6b7280" />} />
                                <InfoItem label="Start Date" value={formatDate(tender.TenderStartDate)} icon={<Feather name="calendar" size={14} color="#6b7280" />} />
                                <InfoItem label="End Date" value={formatDate(tender.TenderEndDate)} icon={<Feather name="calendar" size={14} color="#6b7280" />} />
                                <InfoItem label="Validity Date" value={formatDate(tender.TenderValidityDate)} icon={<Feather name="clock" size={14} color="#6b7280" />} />
                                <InfoItem label="Created On" value={formatDate(tender.CreatedOn)} icon={<Feather name="calendar" size={14} color="#6b7280" />} />
                            </View>
                        </View>

                        {/* Documents Section */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxRed}>
                                    <MaterialIcons name="description" size={16} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Documents</Text>
                                    <Text style={styles.sectionSubtitle}>Tender documents and attachments</Text>
                                </View>
                            </View>
                            {tender.Documents && tender.Documents.length > 0 ? (
                                tender.Documents.map((doc, index) => (
                                    <View key={index} style={styles.documentItem}>
                                        <View style={styles.docIconBox}>
                                            <MaterialIcons name="insert-drive-file" size={20} color="#dc2626" />
                                        </View>
                                        <Text style={styles.docName} numberOfLines={1}>{doc.FileName}</Text>
                                        <View style={styles.docActions}>
                                            <TouchableOpacity style={styles.docActionBtn}>
                                                <Feather name="eye" size={14} color="#3b82f6" />
                                                <Text style={[styles.docActionText, { color: '#3b82f6' }]}> View</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.docDownloadBtn}>
                                                <Feather name="download" size={14} color="#16a34a" />
                                                <Text style={[styles.docActionText, { color: '#16a34a' }]}> Download</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No documents found</Text>
                            )}
                        </View>

                        {/* Letters of Intent */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxRed}>
                                    <MaterialIcons name="assignment" size={16} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Letters of Intent</Text>
                                    <Text style={styles.sectionSubtitle}>LOI assignments</Text>
                                </View>
                            </View>
                            <View style={styles.emptyPlaceholderCard}>
                                <View style={styles.emptyPlaceholderIconBox}>
                                    <MaterialIcons name="assignment" size={20} color="#dc2626" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.placeholderTitle}>No LOIs assigned</Text>
                                    <Text style={styles.placeholderSubtitle}>Assign the first LOI to continue</Text>
                                </View>
                                <TouchableOpacity style={styles.btnSolidRedSm}>
                                    <Text style={styles.btnSolidTextSm}>Assign LOI</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Work Orders */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxOrange}>
                                    <MaterialIcons name="work" size={16} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Work Orders</Text>
                                    <Text style={styles.sectionSubtitle}>Work order details & BG</Text>
                                </View>
                            </View>
                            {tender.WorkOrders && tender.WorkOrders.length > 0 ? (
                                tender.WorkOrders.map((wo, index) => {
                                    const isExpanded = expandedWOIds.includes(wo.Id);
                                    return (
                                        <View key={wo.Id} style={styles.woCard}>
                                            <View style={styles.woCardHeader}>
                                                <View style={styles.woIndexBadge}>
                                                    <Text style={styles.woIndexText}>{index + 1}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.woCardTitle}># {wo.WONumber}</Text>
                                                    <View style={styles.woDateRow}>
                                                        <Feather name="calendar" size={14} color="#9ca3af" />
                                                        <Text style={styles.woDateText}> {formatDate(wo.WODate)}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.woValueBoxNew}>
                                                    <Text style={styles.woValueLabelNew}>Value</Text>
                                                    <Text style={styles.woValueAmountNew}>₹{wo.WOValue}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.woExpandBtn}
                                                    onPress={() => toggleWorkOrder(wo.Id)}
                                                >
                                                    <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9ca3af" />
                                                </TouchableOpacity>
                                            </View>

                                            {isExpanded && (
                                                <>
                                                    <View style={styles.woDivider} />

                                                    <View style={styles.woDetailsRow}>
                                                        <View style={styles.woInfoBit}>
                                                            <Text style={styles.woInfoLabel}>Completion Due</Text>
                                                            <Text style={styles.woInfoValue}>{formatDate(wo.CompletionDueDate)}</Text>
                                                        </View>
                                                        <View style={styles.woInfoBit}>
                                                            <Text style={styles.woInfoLabel}>BG %</Text>
                                                            <Text style={styles.woInfoValue}>{wo.BGValuePercentage}%</Text>
                                                        </View>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={styles.btnUploadMaterial}
                                                        onPress={() => {
                                                            setSelectedWorkOrder(wo);
                                                            // Auto-select first asset if available
                                                            if (wo.Assets && wo.Assets.length > 0) {
                                                                const asset = wo.Assets[0];
                                                                // Always prioritize AssetId, then Id as fallback
                                                                setMaterialAssetId(asset.AssetId || asset.Id || 0);

                                                                if (asset.AssetType && asset.AssetType.length > 0) {
                                                                    const assetType = asset.AssetType[0];
                                                                    setMaterialAssetTypeId(assetType.Id || 0);
                                                                    if (assetType.AssetSubType && assetType.AssetSubType.length > 0) {
                                                                        setMaterialAssetSubTypeId(assetType.AssetSubType[0].Id || 0);
                                                                    } else {
                                                                        setMaterialAssetSubTypeId(0);
                                                                    }
                                                                } else {
                                                                    setMaterialAssetTypeId(0);
                                                                    setMaterialAssetSubTypeId(0);
                                                                }
                                                            } else {
                                                                setMaterialAssetId(0);
                                                                setMaterialAssetTypeId(0);
                                                                setMaterialAssetSubTypeId(0);
                                                            }
                                                            setIsMaterialModalVisible(true);
                                                        }}
                                                    >
                                                        <Feather name="package" size={16} color="#059669" />
                                                        <Text style={styles.btnUploadMaterialText}> Upload Raw material</Text>
                                                    </TouchableOpacity>
                                                    <View style={styles.woActionsContainer}>
                                                        <TouchableOpacity
                                                            style={styles.btnFillForm}
                                                            onPress={() => handleFillForm(wo)}
                                                        >
                                                            <MaterialCommunityIcons name="file-document-edit-outline" size={18} color="#fff" />
                                                            <Text style={styles.btnFillFormText}> Fill the Form</Text>
                                                        </TouchableOpacity>


                                                    </View>

                                                    <TouchableOpacity
                                                        style={styles.btnUploadBG}
                                                        onPress={() => handleUploadBG(wo)}
                                                    >
                                                        <Feather name="upload-cloud" size={16} color="#f97316" />
                                                        <Text style={styles.btnUploadBGText}> Upload BG</Text>
                                                    </TouchableOpacity>

                                                </>
                                            )}
                                        </View>
                                    );
                                })
                            ) : (
                                <Text style={styles.emptyText}>No work orders found</Text>
                            )}
                        </View>
                    </View>

                    {/* Sidebar Column */}
                    <View style={styles.sidebarColumn}>
                        {/* Vendors List */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxRed}>
                                    <Feather name="users" size={16} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>Vendors</Text>
                                </View>
                                <View style={styles.countBadge}><Text style={styles.countText}>{tender.Vendors?.length || 0}</Text></View>
                            </View>
                            {tender.Vendors?.map((vendor, index) => (
                                <View key={index} style={styles.vendorItem}>
                                    <View style={styles.vendorAvatar}>
                                        <Feather name="user" size={14} color="#dc2626" />
                                    </View>
                                    <View>
                                        <Text style={styles.vendorName}>{vendor.VendorName || 'N/A'}</Text>
                                        <Text style={styles.vendorEmail}>{vendor.VendorEmail}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Assets List */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxOrange}>
                                    <Feather name="box" size={16} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>Assets</Text>
                                </View>
                                <View style={styles.countBadge}><Text style={styles.countText}>{tender.Assets?.length || 0}</Text></View>
                            </View>
                            {tender.Assets?.map((asset, index) => (
                                <View key={index} style={styles.assetItem}>
                                    <View style={styles.assetIconBox}>
                                        <Feather name="package" size={14} color="#f97316" />
                                    </View>
                                    <Text style={styles.assetName}>{asset.AssetName}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <Modal
                visible={isFormModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsFormModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderIcon}>
                                <MaterialCommunityIcons name="view-grid-outline" size={24} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>{getModalHeader().title}</Text>
                                <Text style={styles.modalSubtitle}>{getModalHeader().subtitle}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsFormModalVisible(false)}>
                                <Feather name="x" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {currentStep === 0 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
                                    <View style={styles.fieldContainer}>
                                        <View style={styles.fieldLabelRow}>
                                            <MaterialCommunityIcons name="file-document-outline" size={14} color="#6b7280" />
                                            <Text style={styles.fieldLabel}> PROJECT</Text>
                                        </View>
                                        <View style={styles.fieldValueBox}>
                                            <View style={styles.fieldIconBox}>
                                                <Feather name="briefcase" size={16} color="#4b5563" />
                                            </View>
                                            <Text style={styles.fieldValueText}>{tender.ProjectName}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.fieldContainer}>
                                        <View style={styles.fieldLabelRow}>
                                            <MaterialCommunityIcons name="file-document-outline" size={14} color="#6b7280" />
                                            <Text style={styles.fieldLabel}> WORK ORDER</Text>
                                        </View>
                                        <View style={styles.fieldValueBox}>
                                            <View style={styles.fieldIconBox}>
                                                <Feather name="briefcase" size={16} color="#4b5563" />
                                            </View>
                                            <Text style={styles.fieldValueText}>{selectedWorkOrder?.WONumber}</Text>
                                        </View>
                                    </View>

                                    {renderDropdownField('ASSET', 'assetId', tender.Assets?.map(a => ({ Id: a.Id, Name: a.AssetName })) || [], <Feather name="box" size={14} />, true)}
                                </ScrollView>
                            )}

                            {currentStep === 1 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>A</Text></View>
                                        <Text style={styles.sectionLabel}>Beneficiary Information</Text>
                                    </View>
                                    <View style={styles.formGrid}>
                                        {renderFormField('Full Name', 'fullName', <Feather name="user" size={14} />, 'Tatwaswe Dev', true)}
                                        {renderFormField('Father/Spouse Name', 'fatherName', <Feather name="user" size={14} />, 'Tatwaswe Dev')}
                                        {renderFormField('Phone Number', 'phoneNumber', <Feather name="phone" size={14} />, '6787877777', true)}
                                        {renderFormField('Alt. Phone Number', 'altPhoneNumber', <Feather name="phone" size={14} />, 'Alt. Phone Number')}
                                        {renderFormField('Email', 'email', <Feather name="mail" size={14} />, 'dessv.tatwatech@gmail.com')}
                                        {renderDropdownField('Gender', 'gender', [{ Id: 1, Name: 'Male' }, { Id: 2, Name: 'Female' }], null)}
                                        {renderDropdownField('SES', 'ses', [{ Id: 1, Name: 'APL' }, { Id: 2, Name: 'BPL' }], null)}
                                        {renderDropdownField('Caste', 'caste', [{ Id: 1, Name: 'General' }, { Id: 2, Name: 'OBC' }], null)}
                                    </View>

                                    <View style={styles.photoUploadContainer}>
                                        <Text style={styles.formLabel}><Feather name="camera" size={14} /> Beneficiary Photo</Text>
                                        <TouchableOpacity
                                            style={styles.photoUploadBox}
                                            onPress={() => handleAddFileChoice((asset) => updateFormData('beneficiaryPhoto', asset.uri))}
                                        >
                                            <View style={styles.photoUploadIcon}>
                                                <Feather name="camera" size={24} color="#9ca3af" />
                                            </View>
                                            <Text style={styles.photoUploadText}>
                                                {formData.beneficiaryPhoto ? 'Photo Captured' : 'Click to upload'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            )}

                            {currentStep === 2 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={[styles.sectionBadge, { backgroundColor: '#ffedd5' }]}><Text style={[styles.sectionBadgeText, { color: '#f97316' }]}>B</Text></View>
                                        <Text style={[styles.sectionLabel, { color: '#f97316' }]}>Location Information</Text>
                                    </View>
                                    <View style={styles.formGrid}>
                                        {renderDropdownField('State', 'stateId', [{ Id: 1, Name: 'Odisha' }], null, true)}
                                        {renderDropdownField('District', 'districtId', districts, null, true)}
                                        {renderDropdownField('Block', 'blockId', blocks, null, true)}
                                        {renderDropdownField('Gram Panchayat', 'gpId', gps, null)}
                                        {renderDropdownField('Village', 'villageId', villages, null)}
                                        {renderFormField('Pin Code', 'pinCode', null, '787878')}
                                        {renderFormField('House No', 'houseNo', null, 'House Number')}
                                        {renderFormField('Area/Locality', 'areaLocality', null, 'Area or Locality')}
                                        {renderFormField('Street/Landmark', 'streetLandmark', null, 'Street or Landmark')}
                                    </View>
                                </ScrollView>
                            )}

                            {currentStep === 3 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={[styles.sectionBadge, { backgroundColor: '#f3e8ff' }]}><Text style={[styles.sectionBadgeText, { color: '#9333ea' }]}>3</Text></View>
                                        <Text style={[styles.sectionLabel, { color: '#9333ea' }]}>Asset Technical Details</Text>
                                    </View>
                                    <View style={styles.formGrid}>
                                        {renderFormField('Capacity', 'capacity', <Feather name="zap" size={14} />, '56')}
                                        {renderDropdownField('CMC Period (Years)', 'cmcPeriod', [{ Id: 1, Name: '1 Year' }, { Id: 4, Name: '4 Years' }], null)}
                                        {renderFormField('Installation Class', 'installationClass', <Feather name="box" size={14} />, 'Ground Mounted Solar...')}
                                        {renderFormField('Date of Installation', 'dateOfInstallation', <Feather name="calendar" size={14} />, '03/11/2026', true)}
                                        {renderFormField('Date of Commissioning', 'dateOfCommissioning', <Feather name="calendar" size={14} />, '03/17/2026', true)}
                                    </View>
                                </ScrollView>
                            )}

                            {currentStep === 4 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={[styles.sectionBadge, { backgroundColor: '#dbeafe' }]}><Text style={[styles.sectionBadgeText, { color: '#3b82f6' }]}>4</Text></View>
                                        <Text style={[styles.sectionLabel, { color: '#3b82f6' }]}>Installation Location</Text>
                                    </View>
                                    <View style={styles.formGrid}>
                                        {renderDropdownField('State', 'stateId', [{ Id: 1, Name: 'Odisha' }], null, true)}
                                        {renderDropdownField('District', 'districtId', districts, null, true)}
                                        {renderDropdownField('Block', 'blockId', blocks, null, true)}
                                        {renderDropdownField('Gram Panchayat', 'gpId', gps, null)}
                                        {renderDropdownField('Village', 'villageId', villages, null)}
                                        {renderDropdownField('Habitation', 'habitation', [], null)}
                                        {renderFormField('Pin Code', 'pinCode', null, '787878')}
                                        {renderFormField('House No', 'houseNo', null, 'House Number')}
                                        {renderFormField('Area/Locality', 'areaLocality', null, 'Area or Locality')}
                                        {renderFormField('Street/Landmark', 'streetLandmark', null, 'Street or Landmark')}

                                        <View style={[styles.formField, { width: '100%' }]}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.btnUploadBG,
                                                    { borderColor: '#3b82f6', backgroundColor: '#eff6ff', width: '100%', justifyContent: 'center' },
                                                    isCapturingLocation && { opacity: 0.7 }
                                                ]}
                                                onPress={handleGetCurrentLocation}
                                                disabled={isCapturingLocation}
                                            >
                                                {isCapturingLocation ? (
                                                    <ActivityIndicator size="small" color="#3b82f6" />
                                                ) : (
                                                    <Feather name="map-pin" size={16} color="#3b82f6" />
                                                )}
                                                <Text style={[styles.btnUploadBGText, { color: '#3b82f6' }]}>
                                                    {isCapturingLocation ? ' Capturing...' : ' Capture Current Location'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {renderFormField('Latitude', 'latitude', <Feather name="map-pin" size={14} />, '40.6892')}
                                        {renderFormField('Longitude', 'longitude', <Feather name="map-pin" size={14} />, '40.6892')}
                                    </View>
                                </ScrollView>
                            )}

                            {currentStep === 5 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={[styles.sectionBadge, { backgroundColor: '#fef3c7' }]}><Text style={[styles.sectionBadgeText, { color: '#d97706' }]}>5</Text></View>
                                        <Text style={[styles.sectionLabel, { color: '#d97706' }]}>Documents Upload</Text>
                                    </View>
                                    <View style={styles.formGrid}>
                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>Installation Photo</Text>
                                            {formData.installationPhoto ? (
                                                <Image source={{ uri: formData.installationPhoto }} style={{ width: 100, height: 100, borderRadius: 8, marginBottom: 8 }} />
                                            ) : (
                                                <View style={[styles.photoUploadBox, { marginTop: 0 }]}>
                                                    <Feather name="image" size={24} color="#9ca3af" />
                                                </View>
                                            )}
                                            <TouchableOpacity
                                                style={[styles.btnUploadBG, { marginTop: 8 }]}
                                                onPress={() => handleAddFileChoice((asset) => updateFormData('installationPhoto', asset.uri))}
                                            >
                                                <Feather name="upload-cloud" size={16} color="#f97316" />
                                                <Text style={styles.btnUploadBGText}> {formData.installationPhoto ? 'Photo Selected' : 'Upload Photo'}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>Installation Certificate</Text>
                                            <TouchableOpacity
                                                style={styles.btnUploadBG}
                                                onPress={() => handleAddFileChoice((asset) => updateFormData('installationCertificate', asset.uri), true)}
                                            >
                                                <Feather name="upload-cloud" size={16} color="#f97316" />
                                                <Text style={styles.btnUploadBGText}> {formData.installationCertificate ? 'File Selected' : 'Upload CC'}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>JCC Document</Text>
                                            <TouchableOpacity
                                                style={styles.btnUploadBG}
                                                onPress={() => handleAddFileChoice((asset) => updateFormData('jccDocument', asset.uri), true)}
                                            >
                                                <Feather name="upload-cloud" size={16} color="#f97316" />
                                                <Text style={styles.btnUploadBGText}> {formData.jccDocument ? 'File Selected' : 'Upload JCC'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </ScrollView>
                            )}

                            {currentStep === 6 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={[styles.sectionBadge, { backgroundColor: '#f3e8ff' }]}><Text style={[styles.sectionBadgeText, { color: '#9333ea' }]}>6</Text></View>
                                        <Text style={[styles.sectionLabel, { color: '#9333ea' }]}>Component Asset Details</Text>
                                    </View>
                                    <View style={{ paddingBottom: 20 }}>
                                        <Text style={[styles.placeholderSubtitle, { marginBottom: 16 }]}>Add technical specifications for each component category</Text>

                                        {formData.componentValues.length > 0 ? (
                                            formData.componentValues.map((comp, idx) => (
                                                <View key={idx} style={styles.fieldValueBox}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>Category ID: {comp.CategoryId}</Text>
                                                        <Text style={{ fontSize: 12, color: '#666' }}>Header ID: {comp.HeaderId} | Row: {comp.RowIndex}</Text>
                                                        <Text style={{ fontSize: 13, marginTop: 4 }}>Value: {comp.ValueText}</Text>
                                                    </View>
                                                </View>
                                            ))
                                        ) : (
                                            <View style={styles.emptyPlaceholderCard}>
                                                <MaterialIcons name="list-alt" size={24} color="#9ca3af" />
                                                <Text style={styles.placeholderSubtitle}>No component details added yet.</Text>
                                            </View>
                                        )}
                                    </View>
                                </ScrollView>
                            )}
                        </View>

                        <View style={styles.modalFooter}>
                            {currentStep > 0 && (
                                <TouchableOpacity
                                    style={styles.btnCancel}
                                    onPress={() => setCurrentStep(currentStep - 1)}
                                >
                                    <Text style={styles.btnCancelText}>Previous</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.btnCancel}
                                onPress={() => setIsFormModalVisible(false)}
                            >
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.btnSaveNext}
                                onPress={handleNextStep}
                            >
                                <Text style={styles.btnSaveNextText}>{currentStep === 6 ? 'Submit ' : 'Save & Next '}</Text>
                                <Feather name={currentStep === 6 ? 'check' : 'arrow-right'} size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Raw Material Upload Modal */}
            <Modal
                visible={isMaterialModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsMaterialModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleRow}>
                                <View style={styles.modalIconBoxGreen}>
                                    <Feather name="package" size={20} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.modalTitle}>Upload Raw Material</Text>
                                    <Text style={styles.modalSubtitle}>WO: {selectedWorkOrder?.WONumber || 'N/A'}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setIsMaterialModalVisible(false)}>
                                <Feather name="x" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.materialForm}>
                                {/* Asset Selection (Visual representation for now) */}
                                {selectedWorkOrder?.Assets && selectedWorkOrder.Assets.length > 0 && (
                                    <View style={{ gap: 12 }}>
                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>Select Asset</Text>
                                            <TouchableOpacity
                                                style={styles.dropdownTrigger}
                                                onPress={() => {
                                                    if (!selectedWorkOrder?.Assets) return;
                                                    const data = selectedWorkOrder.Assets.map(a => ({ Id: a.AssetId, Name: a.AssetName }));
                                                    setSelectionData(data);
                                                    setSelectionTitle('Select Asset');
                                                    setSelectionKey('materialAssetId');
                                                    // Custom handler needed for this specific state
                                                    Alert.alert(
                                                        'Select Asset',
                                                        'Choose an asset:',
                                                        [
                                                            ...data.map(item => ({
                                                                text: item.Name,
                                                                onPress: () => {
                                                                    setMaterialAssetId(item.Id);
                                                                    if (!selectedWorkOrder) return;
                                                                    const asset = selectedWorkOrder.Assets.find(a => a.AssetId === item.Id);
                                                                    if (asset?.AssetType?.[0]) {
                                                                        setMaterialAssetTypeId(asset.AssetType[0].Id);
                                                                        if (asset.AssetType[0].AssetSubType?.[0]) {
                                                                            setMaterialAssetSubTypeId(asset.AssetType[0].AssetSubType[0].Id);
                                                                        }
                                                                    }
                                                                }
                                                            })),
                                                            { text: 'Cancel', style: 'cancel' }
                                                        ]
                                                    );
                                                }}
                                            >
                                                <Text style={styles.dropdownValue}>
                                                    {selectedWorkOrder?.Assets?.find(a => a.AssetId === materialAssetId)?.AssetName || 'Select Asset'}
                                                </Text>
                                                <MaterialCommunityIcons name="unfold-more-horizontal" size={20} color="#9ca3af" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* File Selection */}
                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>Material Files</Text>
                                            <TouchableOpacity
                                                style={styles.btnPickFiles}
                                                onPress={pickMaterialFiles}
                                            >
                                                <Feather name="plus-circle" size={20} color="#6b7280" />
                                                <Text style={styles.btnPickFilesText}>Add Files</Text>
                                            </TouchableOpacity>

                                            <View style={styles.fileList}>
                                                {materialFiles.map((file, index) => (
                                                    <View key={index} style={styles.fileItem}>
                                                        <Feather name="file" size={16} color="#4b5563" />
                                                        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                                                        <TouchableOpacity onPress={() => removeMaterialFile(index)}>
                                                            <Feather name="trash-2" size={16} color="#dc2626" />
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.btnCancel}
                                onPress={() => setIsMaterialModalVisible(false)}
                            >
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btnSaveNext, { backgroundColor: '#10b981' }]}
                                onPress={handleMaterialUpload}
                                disabled={isUploadingMaterial}
                            >
                                {isUploadingMaterial ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.btnSaveNextText}>Upload Material</Text>
                                        <Feather name="upload" size={16} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Selection Modal for Dropdowns */}
            <Modal
                visible={isSelectionModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsSelectionModalVisible(false)}
            >
                <View style={styles.selectionOverlay}>
                    <View style={styles.selectionContent}>
                        <View style={styles.selectionHeader}>
                            <Text style={styles.selectionTitle}>{selectionTitle}</Text>
                            <TouchableOpacity onPress={() => setIsSelectionModalVisible(false)}>
                                <Feather name="x" size={20} color="#4b5563" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.selectionScroll} showsVerticalScrollIndicator={false}>
                            {selectionData.map((item) => (
                                <TouchableOpacity
                                    key={item.Id}
                                    style={styles.selectionItem}
                                    onPress={() => {
                                        updateFormData(selectionKey, item.Id);
                                        setIsSelectionModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.selectionText,
                                        (formData as any)[selectionKey] === item.Id && styles.selectionTextSelected
                                    ]}>
                                        {item.Name}
                                    </Text>
                                    {(formData as any)[selectionKey] === item.Id && (
                                        <Feather name="check" size={16} color="#c1272d" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const InfoItem = ({ label, value, icon }: any) => (
    <View style={styles.infoItem}>
        <View style={styles.infoIconWrapper}>
            {typeof icon === 'string' ? <Text style={styles.hashIcon}>{icon}</Text> : icon}
        </View>
        <View>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || '-'}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eef1f5' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backLink: { marginTop: 10 },
    scrollView: { flex: 1 },
    scrollContent: { padding: isMobile ? 8 : 16, paddingBottom: 40 },
    headerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, gap: 12 },
    backButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginRight: 4 },
    headerIconBox: { backgroundColor: '#dc2626', width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', flexShrink: 1 },
    headerSubtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, flexShrink: 1 },
    headerSubtitle: { fontSize: 11, color: '#6b7280', flexShrink: 1 },
    headerActions: { flexDirection: 'row', gap: 8, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end', marginTop: isMobile ? 8 : 0 },
    btnOutlineOrange: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#f97316', backgroundColor: '#fff7ed', flex: isMobile ? 1 : 0, alignItems: 'center' },
    btnOutlineTextOrange: { color: '#f97316', fontSize: 11, fontWeight: 'bold' },
    btnSolidRed: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#dc2626', flex: isMobile ? 1 : 0, alignItems: 'center' },
    btnSolidText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    statsContainer: { marginBottom: 16, gap: 12 },
    statsRowWrapper: { flexDirection: 'row', gap: 12 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 2 },
    statIconBoxRed: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
    statIconBoxOrange: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#ffedd5', justifyContent: 'center', alignItems: 'center' },
    statIconBoxGreen: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
    statIconBoxBlue: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
    statLabel: { fontSize: 12, fontWeight: 'bold', color: '#374151' },
    statSubLabel: { fontSize: 10, color: '#9ca3af' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#b91c1c', marginLeft: 'auto' },
    statUnit: { fontSize: 10, color: '#9ca3af' },
    contentGrid: { flexDirection: isMobile ? 'column' : 'row', gap: 16 },
    mainColumn: { flex: 2, gap: 16 },
    sidebarColumn: { flex: 1, gap: 16 },
    sectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    sectionIconBoxRed: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    sectionIconBoxOrange: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
    sectionSubtitle: { fontSize: 11, color: '#6b7280', marginTop: 1 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
    infoItem: { width: isMobile ? '100%' : '50%', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    infoIconWrapper: { width: 26, height: 26, backgroundColor: '#f3f4f6', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 },
    hashIcon: { fontSize: 13, fontWeight: 'bold', color: '#6b7280' },
    infoLabel: { fontSize: 10, color: '#6b7280', marginBottom: 1 },
    infoValue: { fontSize: 12, color: '#111827', fontWeight: '500' },
    documentItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#fee2e2', borderRadius: 10, marginBottom: 8, backgroundColor: '#fffcfc' },
    docIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    docName: { flex: 1, fontSize: 13, fontWeight: '500', color: '#1f2937' },
    docActions: { flexDirection: 'row', gap: 8 },
    docActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
    docDownloadBtn: { flexDirection: 'row', alignItems: 'center', padding: 6, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 6, backgroundColor: '#f0fdf4' },
    docActionText: { fontSize: 11, fontWeight: '600' },
    emptyPlaceholderCard: { flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', padding: 12, borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, backgroundColor: '#fef2f2', gap: 10 },
    emptyPlaceholderIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#fecaca' },
    placeholderTitle: { fontSize: 13, fontWeight: 'bold', color: '#374151' },
    placeholderSubtitle: { fontSize: 11, color: '#9ca3af' },
    btnSolidRedSm: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#dc2626', alignSelf: isMobile ? 'flex-end' : 'auto' },
    btnSolidTextSm: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    woItem: { padding: 12, borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 10, marginBottom: 8 },
    woHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    woNumber: { fontSize: 12, fontWeight: 'bold', color: '#374151', flex: 1 },
    woValueBox: { alignItems: 'flex-end' },
    woValueLabel: { fontSize: 9, color: '#9ca3af' },
    woValueAmount: { fontSize: 12, fontWeight: 'bold', color: '#1f2937' },
    vendorItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    vendorAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
    vendorName: { fontSize: 12, fontWeight: 'bold', color: '#374151' },
    vendorEmail: { fontSize: 10, color: '#6b7280' },
    assetItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    assetIconBox: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#ffedd5', justifyContent: 'center', alignItems: 'center' },
    assetName: { fontSize: 12, color: '#374151', fontWeight: '500' },
    countBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
    countText: { fontSize: 10, color: '#6b7280', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#9ca3af', padding: 16, fontSize: 12 },

    // New Work Order Card Styles
    woCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    woCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    woIndexBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    woIndexText: {
        fontSize: 10,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    woCardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
    },
    woDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    woDateText: {
        fontSize: 12,
        color: '#6b7280',
    },
    woValueBoxNew: {
        alignItems: 'flex-end',
        marginRight: 8,
    },
    woValueLabelNew: {
        fontSize: 10,
        color: '#9ca3af',
    },
    woValueAmountNew: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f97316',
    },
    woExpandBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f9fafb',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    woDivider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: 12,
    },
    woDetailsRow: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 16,
    },
    woInfoBit: {
        flex: 1,
    },
    woInfoLabel: {
        fontSize: 11,
        color: '#9ca3af',
        marginBottom: 4,
    },
    woInfoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    woActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 12,
        gap: 12,
        flexWrap: 'wrap',
    },
    btnFillForm: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    btnFillFormText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    btnUploadBG: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f97316',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    btnUploadBGText: {
        color: '#f97316',
        fontSize: 12,
        fontWeight: '600',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
        overflow: 'hidden',
        flexShrink: 1,
    },
    modalHeader: {
        backgroundColor: '#c1272d',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    modalHeaderIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalIconBoxGreen: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        flexShrink: 1,
    },
    fieldContainer: {
        gap: 8,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fieldLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    fieldValueBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        gap: 12,
    },
    fieldIconBox: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    fieldValueText: {
        fontSize: 13,
        color: '#4b5563',
        flex: 1,
    },
    dropdownBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        justifyContent: 'space-between',
    },
    dropdownText: {
        fontSize: 13,
        color: '#4b5563',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 16,
    },
    btnCancel: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    btnCancelText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '600',
    },
    btnSaveNext: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#c1272d',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    btnSaveNextText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },

    // Form Field Styles
    formGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    formField: {
        width: isMobile ? '100%' : '50%',
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4b5563',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    dropdownValue: {
        fontSize: 14,
        color: '#111827',
    },
    sectionDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3b82f6',
    },

    // Photo Upload Styles
    photoUploadContainer: {
        marginTop: 16,
        paddingHorizontal: 8,
    },
    photoUploadBox: {
        width: 120,
        height: 120,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        marginTop: 8,
    },
    photoUploadIcon: {
        marginBottom: 8,
    },
    photoUploadText: {
        fontSize: 10,
        color: '#9ca3af',
    },
    coordinateContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 12,
        gap: 4,
    },
    coordinateLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    coordinateInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 2,
    },
    btnUploadMaterial: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#ecfdf5',
        borderWidth: 1,
        borderColor: '#10b981',
        justifyContent: 'center',
    },
    btnUploadMaterialText: {
        color: '#059669',
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    materialForm: {
        padding: 16,
        gap: 16,
    },
    fileList: {
        marginTop: 12,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    fileName: {
        flex: 1,
        fontSize: 12,
        color: '#4b5563',
        marginLeft: 8,
    },
    btnPickFiles: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderStyle: 'dashed',
        backgroundColor: '#f9fafb',
    },
    btnPickFilesText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
        marginLeft: 8,
    },
    // Selection Modal Styles
    selectionOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    selectionContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
    },
    selectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    selectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    selectionScroll: {
        padding: 10,
    },
    selectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 8,
    },
    selectionText: {
        fontSize: 14,
        color: '#4b5563',
    },
    selectionTextSelected: {
        color: '#c1272d',
        fontWeight: 'bold',
    },
});

export default TenderDetailsScreen;
