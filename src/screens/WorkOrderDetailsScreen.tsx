import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Modal, Alert, StatusBar, TextInput, Platform, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { workOrderService } from '../services/workOrderService';
import { WorkOrder } from '../services/tenderService';
import { LinearGradient } from 'expo-linear-gradient';
import { projectAssetService, DropdownItem } from '../services/projectAssetService';
import { apiClient } from '../services/apiClient';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { authService } from '../services/authService';
import { Linking } from 'react-native';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const WorkOrderDetailsScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { workOrderId } = route.params || {};

    const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRoleId, setUserRoleId] = useState<string>('2'); // Default to 2 (Vendor) as fallback

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [installDetailsData, setInstallDetailsData] = useState<any>(null);
    const [installDetailsLoading, setInstallDetailsLoading] = useState(false);

    // FILL FORM MODAL STATE
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isCapturingLocation, setIsCapturingLocation] = useState(false);
    const [installedAssetId, setInstalledAssetId] = useState<number | null>(null);
    const [draftId, setDraftId] = useState<number | null>(null);
    const [loadingDraft, setLoadingDraft] = useState(false);
    
    // RAW MATERIAL MODAL STATE
    const [isRmModalVisible, setIsRmModalVisible] = useState(false);
    const [selectedInstRM, setSelectedInstRM] = useState<{ inst: any, asset: any } | null>(null);
    const [rmPhotos, setRmPhotos] = useState<any[]>([]);
    const [isSavingRM, setIsSavingRM] = useState(false);

    // Selection Modal State
    const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);
    const [selectionData, setSelectionData] = useState<DropdownItem[]>([]);
    const [selectionTitle, setSelectionTitle] = useState('');
    const [selectionKey, setSelectionKey] = useState('');

    // Dropdown Data
    const [districts, setDistricts] = useState<DropdownItem[]>([]);
    const [blocks, setBlocks] = useState<DropdownItem[]>([]);
    const [gps, setGps] = useState<DropdownItem[]>([]);
    const [villages, setVillages] = useState<DropdownItem[]>([]);

    // Form Data State
    const [formData, setFormData] = useState({
        assetId: '', fullName: '', fatherName: '', phoneNumber: '', altPhoneNumber: '', email: '', gender: '', ses: '', caste: '', beneficiaryPhoto: null as any,
        stateId: 1, districtId: null as number | null, blockId: null as number | null, gpId: null as number | null, villageId: null as number | null, habitation: '', pinCode: '', houseNo: '', areaLocality: '', streetLandmark: '', latitude: '', longitude: '',
        capacity: '', cmcPeriod: '', installationClass: '', dateOfInstallation: '', dateOfCommissioning: '',
        installationPhoto: null as any, installationCertificate: null as any, jccDocument: null as any, componentValues: [] as any[],
        // Step mapping data
        projectId: null as number | null,
        workOrderId: null as number | null,
        assetTypeId: null as number | null,
        assetSubTypeId: null as number | null,
    });

    // File Picker Modal State
    const [isFileSourceVisible, setIsFileSourceVisible] = useState(false);
    const [onFileSourceSelected, setOnFileSourceSelected] = useState<(asset: any) => void>(() => () => { });
    const [allowSourceDocuments, setAllowSourceDocuments] = useState(false);

    // BG Upload Modal
    const [bgModalVisible, setBgModalVisible] = useState(false);
    const [bgSubmitting, setBgSubmitting] = useState(false);
    const [bgForm, setBgForm] = useState({
        BankName: '',
        BGNumber: '',
        IssueDate: new Date(),
        ExpiryDate: new Date(),
        Amount: '',
        Document: null as any,
    });
    const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

    const pickBGDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setBgForm(prev => ({ ...prev, Document: result.assets[0] }));
            }
        } catch {
            Alert.alert('Error', 'Failed to pick document.');
        }
    };

    const handleSubmitBG = async () => {
        if (!bgForm.BankName.trim() || !bgForm.BGNumber.trim() || !bgForm.Amount.trim()) {
            Alert.alert('Validation', 'Bank Name, BG Number, and Amount are required.');
            return;
        }
        if (!workOrder?.Id) return;
        setBgSubmitting(true);
        try {
            const response = await workOrderService.uploadBankGuarantee(workOrder.Id, {
                BankName: bgForm.BankName,
                BGNumber: bgForm.BGNumber,
                IssueDate: bgForm.IssueDate.toISOString(),
                ExpiryDate: bgForm.ExpiryDate.toISOString(),
                Amount: parseFloat(bgForm.Amount),
                Document: bgForm.Document,
            });
            if (response.Data !== undefined || (response as any).DeveloperMessage) {
                Alert.alert('Success', 'Bank Guarantee uploaded successfully!');
                setBgModalVisible(false);
                setBgForm({ BankName: '', BGNumber: '', IssueDate: new Date(), ExpiryDate: new Date(), Amount: '', Document: null });
                // Refresh work order data
                const refreshed = await workOrderService.getWorkOrderById(workOrder.Id);
                if (refreshed.Data) setWorkOrder(refreshed.Data);
            } else {
                Alert.alert('Error', (response as any).DisplayMessage || 'Upload failed.');
            }
        } catch (err) {
            console.error('BG upload error:', err);
            Alert.alert('Error', 'Failed to upload Bank Guarantee.');
        } finally {
            setBgSubmitting(false);
        }
    };

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
                // Defensive check if API returns an array instead of an object
                const details = Array.isArray(res.Data) ? res.Data[0] : res.Data;
                setInstallDetailsData(details);
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

    const safeVal = (val: any) => {
        if (val === null || val === undefined) return '-';
        if (typeof val === 'object') return 'N/A'; // Prevent crash by not rendering objects
        return String(val);
    };

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const authData = await authService.getAuthData();
                const roleId = authData?.UserData?.RoleId || authData?.UserData?.roleId || authData?.UserData?.UserTypeId;
                setUserRoleId(roleId ? String(roleId) : '2');
            } catch (err) {
                console.error('Error fetching user role:', err);
            }
        };
        fetchUserRole();
    }, []);

    const fetchWorkOrderDetails = async () => {
        if (!workOrderId) return;
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

    useEffect(() => {
        if (!workOrderId) {
            setError('No Work Order ID provided.');
            setLoading(false);
            return;
        }
        fetchWorkOrderDetails();
    }, [workOrderId]);

    const formatDate = (dateString?: any) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return typeof dateString === 'string' ? dateString : 'N/A';
            const day = date.getDate().toString().padStart(2, '0');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[date.getMonth()];
            const year = date.getFullYear().toString().slice(-2);
            return `${day} ${month} ${year}`;
        } catch {
            return typeof dateString === 'string' ? dateString : 'N/A';
        }
    };

    // FORM HELPER METHODS
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

    const handleFillForm = async (instId: number | null, assetIdValue: number | null, existingDraftId?: number | null) => {
        if (!workOrder) return;
        setInstalledAssetId(instId);
        setDraftId(existingDraftId || null);

        if (existingDraftId) {
            setLoadingDraft(true);
            try {
                const res = await projectAssetService.getDraftById(existingDraftId);
                if (res.Data) {
                    const draft = res.Data;
                    const step1 = draft.Step1 || {};
                    const step2 = draft.Step2 || {};
                    const step3 = draft.Step3 || {};
                    const step4 = draft.Step4 || {};
                    const step5 = draft.Step5 || {};
                    const step6 = draft.Step6 || {};

                    setFormData(prev => ({
                        ...prev,
                        assetId: assetIdValue?.toString() || step1.AssetId?.toString() || '',
                        projectId: step1.ProjectId || workOrder.ProjectId || null,
                        workOrderId: step1.WorkOrderId || workOrder.Id || null,
                        assetTypeId: step1.AssetTypeId || null,
                        assetSubTypeId: step1.AssetSubTypeId || null,
                        // Step 2 mapping
                        fullName: step2.FullName || '',
                        fatherName: step2.FatherName || '',
                        phoneNumber: step2.PhoneNumber || '',
                        email: step2.Email || '',
                        gender: step2.Gender || '',
                        caste: step2.Caste || '',
                        // Step 3 mapping
                        districtId: step3.DistrictId || null,
                        blockId: step3.BlockId || null,
                        gpId: step3.GpId || null,
                        villageId: step3.VillageId || null,
                        pinCode: step3.PinCode || '',
                        areaLocality: step3.AreaLocality || '',
                        // Step 4 mapping
                        capacity: step4.Capacity || '',
                        cmcPeriod: step4.CmcPeriod || '',
                        // Step 5 mapping
                        latitude: step5.Latitude?.toString() || '',
                        longitude: step5.Longitude?.toString() || '',
                        // Add more as needed
                    }));
                    setCurrentStep(draft.CurrentStep ? draft.CurrentStep - 1 : 0);
                }
            } catch (e) {
                console.error('Error fetching draft:', e);
                Alert.alert('Error', 'Failed to load existing draft.');
            } finally {
                setLoadingDraft(false);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                assetId: assetIdValue?.toString() || '',
                projectId: workOrder.ProjectId || null,
                workOrderId: workOrder.Id || null,
                assetTypeId: workOrder.Assets?.find(a => a.AssetId === assetIdValue)?.AssetType?.[0]?.Id || null,
                assetSubTypeId: workOrder.Assets?.find(a => a.AssetId === assetIdValue)?.AssetType?.[0]?.AssetSubType?.[0]?.Id || null,
            }));
            setCurrentStep(0);
        }
        setIsFormModalVisible(true);
    };

    const handleNextStep = async () => {
        if (!workOrder) return;
        try {
            // Prepare draft payload
            const payload: any = {
                Id: draftId || 0,
                ProjectId: formData.projectId,
                WorkOrderId: formData.workOrderId,
                WorkOrderInstalledAssetId: installedAssetId,
                CurrentStep: currentStep + 1,
            };

            // Add step-specific data
            if (currentStep === 0) {
                payload.Step1 = {
                    ProjectId: formData.projectId,
                    WorkOrderId: formData.workOrderId,
                    WorkOrderInstalledAssetId: installedAssetId,
                    AssetId: parseInt(formData.assetId),
                    AssetTypeId: formData.assetTypeId,
                    AssetSubTypeId: formData.assetSubTypeId,
                };
            } else if (currentStep === 1) {
                payload.Step2 = {
                    FullName: formData.fullName,
                    FatherName: formData.fatherName,
                    PhoneNumber: formData.phoneNumber,
                    Email: formData.email,
                    Gender: formData.gender,
                    Caste: formData.caste,
                };
            } else if (currentStep === 2) {
                payload.Step3 = {
                    DistrictId: formData.districtId,
                    BlockId: formData.blockId,
                    GpId: formData.gpId,
                    VillageId: formData.villageId,
                    PinCode: formData.pinCode,
                    AreaLocality: formData.areaLocality,
                };
            } else if (currentStep === 3) {
              payload.Step4 = {
                  Capacity: formData.capacity,
                  CmcPeriod: formData.cmcPeriod,
              };
            } else if (currentStep === 4) {
              payload.Step5 = {
                  Latitude: parseFloat(formData.latitude),
                  Longitude: parseFloat(formData.longitude),
              };
            }

            // Save draft
            const res = await projectAssetService.saveDraft(payload);
            if (res.Data && res.Data.Data && res.Data.Data.Id) {
                setDraftId(res.Data.Data.Id);
            }

            if (currentStep < 6) {
                setCurrentStep(currentStep + 1);
            } else {
                Alert.alert(
                    'Success', 
                    'Installation details have been captured successfully.',
                    [{ text: 'OK', onPress: () => setIsFormModalVisible(false) }]
                );
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            Alert.alert('Error', 'Failed to save progress. Please try again.');
        }
    };

    const updateFormData = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleViewPhotos = (installedAsset: any) => {
        const photos = [];
        if (installedAsset.InstallationPhoto) photos.push(installedAsset.InstallationPhoto);
        if (installedAsset.BeneficiaryPhoto) photos.push(installedAsset.BeneficiaryPhoto);
        
        // If there are documents, we could show them as well if they are images
        if (installedAsset.MaterialVerificationDocuments) {
            installedAsset.MaterialVerificationDocuments.forEach((doc: any) => {
                const url = doc.FileUrl || doc.DocumentUrl;
                if (url && (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.png') || url.toLowerCase().endsWith('.jpeg'))) {
                    photos.push(url);
                }
            });
        }

        if (photos.length === 0) {
            Alert.alert('Info', 'No photos available for this installation.');
            return;
        }

        const formattedPhotos = photos.map(url => {
            if (url && !url.startsWith('http')) {
                return apiClient.getBaseHost() + (url.startsWith('/') ? url.slice(1) : url);
            }
            return url;
        });

        setSelectedImages(formattedPhotos);
        setIsImageModalVisible(true);
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
            const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 });
            if (!result.canceled) onFileSelected({ uri: result.assets[0].uri, name: result.assets[0].fileName || `photo_${Date.now()}.jpg`, type: 'image/jpeg', mimeType: 'image/jpeg' });
        } catch (error) { Alert.alert('Error', 'Failed to capture photo'); }
    };

    const handlePickFromGallery = async (onFileSelected: (asset: any) => void) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 });
            if (!result.canceled) onFileSelected({ uri: result.assets[0].uri, name: result.assets[0].fileName || `photo_${Date.now()}.jpg`, type: 'image/jpeg', mimeType: 'image/jpeg' });
        } catch (error) { Alert.alert('Error', 'Failed to pick from gallery'); }
    };

    const handleAddFileChoice = (callback: (asset: any) => void, allowDocs = false) => {
        setOnFileSourceSelected(() => callback);
        setAllowSourceDocuments(allowDocs);
        setIsFileSourceVisible(true);
    };

    const handleOpenRMModal = (inst: any, asset: any) => {
        setSelectedInstRM({ inst, asset });
        const existingPhotos = inst.MaterialVerificationDocuments?.map((doc: any) => {
            let url = doc.FileUrl || doc.DocumentUrl;
            if (url && !url.startsWith('http')) {
                url = apiClient.getBaseHost() + (url.startsWith('/') ? url.slice(1) : url);
            }
            return {
                uri: url,
                isExisting: true,
                id: doc.Id
            };
        }) || [];
        setRmPhotos(existingPhotos);
        setIsRmModalVisible(true);
    };

    const handleSaveRM = async () => {
        if (!selectedInstRM) return;
        setIsSavingRM(true);
        try {
            const formData = new FormData();
            formData.append('WorkOrderInstalledAssetDetailsId', selectedInstRM.inst.WorkOrderInstalledAssetDetailsId || selectedInstRM.inst.Id);
            
            // Only upload new photos
            const newPhotos = rmPhotos.filter(p => !p.isExisting);
            newPhotos.forEach((photo, index) => {
                formData.append('Files', {
                    uri: photo.uri,
                    name: photo.name || `rm_photo_${index}.jpg`,
                    type: photo.type || 'image/jpeg'
                } as any);
            });

            if (newPhotos.length === 0) {
                Alert.alert('Info', 'No new photos to upload.');
                setIsRmModalVisible(false);
                return;
            }

            const res = await projectAssetService.uploadMaterialVerification(formData);
            if (res.Success) {
                Alert.alert('Success', 'Raw material photos uploaded successfully.');
                setIsRmModalVisible(false);
                // Refresh work order data
                fetchWorkOrderDetails();
            }
        } catch (error: any) {
            console.error('Error saving RM:', error);
            const errorMsg = error.DisplayMessage || error.message || 'Network error. Please check your internet connection.';
            Alert.alert('Error', errorMsg);
        } finally {
            setIsSavingRM(false);
        }
    };

    const handleAddRMPhoto = (asset: any) => {
        setRmPhotos(prev => [...prev, { ...asset, isExisting: false }]);
    };

    const handleRemoveRMPhoto = (index: number) => {
        setRmPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleGetCurrentLocation = async () => {
        setIsCapturingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return Alert.alert('Denied', 'Permission to access location was denied');
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            updateFormData('latitude', loc.coords.latitude.toString());
            updateFormData('longitude', loc.coords.longitude.toString());
            Alert.alert('Captured', `Lat: ${loc.coords.latitude}\nLon: ${loc.coords.longitude}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to capture location');
        } finally {
            setIsCapturingLocation(false);
        }
    };

    const renderFormField = (label: string, key: string, icon: any, placeholder: string = '', required: boolean = false) => (
        <View style={styles.formFieldRow}>
            <Text style={styles.formFieldLabel}>{label}{required && <Text style={{ color: '#dc2626' }}> *</Text>}</Text>
            <View style={styles.inputWrapper}>
                {icon && <View style={styles.inputIcon}>{icon}</View>}
                <TextInput style={styles.input} placeholder={placeholder} value={(formData as any)[key]} onChangeText={(text) => updateFormData(key, text)} />
            </View>
        </View>
    );

    const renderDropdownField = (label: string, key: string, data: DropdownItem[], icon: any, required: boolean = false, disabled: boolean = false) => {
        const selectedItem = data.find(item => item.Id === (formData as any)[key]);
        const openSelection = () => {
            if (disabled) return;
            if (data.length === 0) return Alert.alert('Info', `No ${label} available`);
            setSelectionData(data);
            setSelectionTitle(`Select ${label}`);
            setSelectionKey(key);
            setIsSelectionModalVisible(true);
        };
        return (
            <View style={styles.formFieldRow}>
                <Text style={styles.formFieldLabel}>{label}{required && <Text style={{ color: '#dc2626' }}> *</Text>}</Text>
                <TouchableOpacity style={[styles.dropdownTrigger, disabled && { backgroundColor: '#f3f4f6' }]} onPress={openSelection} activeOpacity={disabled ? 1 : 0.7}>
                    <Text style={[styles.dropdownValue, disabled && { color: '#9ca3af' }]}>{selectedItem?.Name || `Select ${label}`}</Text>
                    <MaterialCommunityIcons name="unfold-more-horizontal" size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>
        );
    };

    const getModalHeader = () => {
        const titles = [
            { title: 'Asset Information', subtitle: 'Verify device details' },
            { title: 'Beneficiary Details', subtitle: 'Basic information' },
            { title: 'Beneficiary Address', subtitle: 'Installation location' },
            { title: 'Technical Details', subtitle: 'Dynamic parameters' },
            { title: 'GPS Coordinates', subtitle: 'Geofencing setup' },
            { title: 'Documents Upload', subtitle: 'Proof of installation' },
            { title: 'Component Assets', subtitle: 'Dynamic sub-assets' },
        ];
        return titles[currentStep] || titles[0];
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

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Asset Info
                const selectedAsset = workOrder?.Assets?.find(a => a.AssetId.toString() === formData.assetId);
                const assetType = selectedAsset?.AssetType?.[0];
                const assetSubType = assetType?.AssetSubType?.[0];

                return (
                    <View style={styles.modalBodyPadding}>
                        <View style={styles.sectionDivider}>
                            <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>1</Text></View>
                            <Text style={styles.sectionLabel}>Asset Information</Text>
                        </View>
                        
                        <View style={styles.formGrid}>
                            <View style={styles.formFieldRow}>
                                <Text style={styles.formFieldLabel}>Project Name</Text>
                                <View style={styles.fieldValueBox}>
                                    <Text style={styles.fieldValueText}>{workOrder?.ProjectName || 'N/A'}</Text>
                                </View>
                            </View>

                            <View style={styles.formFieldRow}>
                                <Text style={styles.formFieldLabel}>Work Order</Text>
                                <View style={styles.fieldValueBox}>
                                    <Text style={styles.fieldValueText}>{workOrder?.WONumber || 'N/A'}</Text>
                                </View>
                            </View>

                            <View style={styles.formFieldRow}>
                                <Text style={styles.formFieldLabel}>Asset Name</Text>
                                <View style={styles.fieldValueBox}>
                                    <View style={styles.fieldIconBox}>
                                        <MaterialCommunityIcons name="cube-outline" size={18} color="#ea580c" />
                                    </View>
                                    <Text style={styles.fieldValueText}>{selectedAsset?.AssetName || 'N/A'}</Text>
                                </View>
                            </View>

                            <View style={styles.formFieldRow}>
                                <Text style={styles.formFieldLabel}>Asset Type</Text>
                                <View style={styles.fieldValueBox}>
                                    <Text style={styles.fieldValueText}>{assetType?.Name || 'N/A'}</Text>
                                </View>
                            </View>

                            <View style={styles.formFieldRow}>
                                <Text style={styles.formFieldLabel}>Asset Sub Type</Text>
                                <View style={styles.fieldValueBox}>
                                    <Text style={styles.fieldValueText}>{assetSubType?.Name || 'N/A'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                );

            case 1: // Beneficiary Details
                return (
                    <View style={styles.modalBodyPadding}>
                        <View style={styles.sectionDivider}>
                            <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>2</Text></View>
                            <Text style={styles.sectionLabel}>Beneficiary Information</Text>
                        </View>
                        <View style={styles.formGrid}>
                            {renderFormField("Full Name", 'fullName', <Feather name="user" size={16} color="#9ca3af" />, "Enter Full Name", true)}
                            {renderFormField("Father/Spouse Name", 'fatherName', <Feather name="users" size={16} color="#9ca3af" />, "Enter Father/Spouse Name", true)}
                            {renderFormField("Phone Number", 'phoneNumber', <Feather name="phone" size={16} color="#9ca3af" />, "Enter Phone Number", true)}
                            {renderFormField("Email Address", 'email', <Feather name="mail" size={16} color="#9ca3af" />, "Enter Email Address")}
                            {renderFormField("Gender", 'gender', <MaterialCommunityIcons name="gender-male-female" size={16} color="#9ca3af" />, "e.g. Male/Female")}
                            {renderFormField("Caste", 'caste', <Feather name="tag" size={16} color="#9ca3af" />, "Enter Category/Caste")}
                        </View>
                        <Text style={styles.formFieldLabel}>Beneficiary Photo</Text>
                        <TouchableOpacity style={styles.photoUploadBox} onPress={() => handleAddFileChoice((asset) => updateFormData('beneficiaryPhoto', asset))}>
                            {formData.beneficiaryPhoto ? (
                                <Image source={{ uri: formData.beneficiaryPhoto.uri }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                            ) : (
                                <>
                                    <Feather name="camera" size={24} color="#9ca3af" style={styles.photoUploadIcon} />
                                    <Text style={styles.photoUploadText}>Click to Capture</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                );

            case 2: // Address Details
                return (
                    <View style={styles.modalBodyPadding}>
                        <View style={styles.sectionDivider}>
                            <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>3</Text></View>
                            <Text style={styles.sectionLabel}>Beneficiary Address</Text>
                        </View>
                        <View style={styles.formGrid}>
                            {renderDropdownField("District", 'districtId', districts, <Feather name="map-pin" size={16} color="#9ca3af" />, true)}
                            {renderDropdownField("Block", 'blockId', blocks, <Feather name="map" size={16} color="#9ca3af" />, true, !formData.districtId)}
                            {renderDropdownField("Gram Panchayat", 'gpId', gps, <Feather name="home" size={16} color="#9ca3af" />, true, !formData.blockId)}
                            {renderDropdownField("Village", 'villageId', villages, <Feather name="map" size={16} color="#9ca3af" />, true, !formData.gpId)}
                            {renderFormField("PIN Code", 'pinCode', <Feather name="hash" size={16} color="#9ca3af" />, "6-digit PIN", true)}
                            {renderFormField("Area / Locality", 'areaLocality', <Feather name="map" size={16} color="#9ca3af" />, "Enter area/locality")}
                        </View>
                    </View>
                );

            case 3: // Technical Details
                return (
                    <View style={styles.modalBodyPadding}>
                        <View style={styles.sectionDivider}>
                            <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>4</Text></View>
                            <Text style={styles.sectionLabel}>Technical Information</Text>
                        </View>
                        <View style={styles.formGrid}>
                            {renderFormField("Capacity", 'capacity', <Feather name="zap" size={16} color="#9ca3af" />, "e.g. 5kW")}
                            {renderFormField("CMC Period", 'cmcPeriod', <Feather name="shield" size={16} color="#9ca3af" />, "In Years")}
                        </View>
                    </View>
                );

            case 4: // GPS Coordinates
                return (
                    <View style={styles.modalBodyPadding}>
                        <View style={styles.sectionDivider}>
                            <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>5</Text></View>
                            <Text style={styles.sectionLabel}>Geotagging Details</Text>
                        </View>
                        <View style={{ marginTop: 10 }}>
                            <Text style={styles.formFieldLabel}>Current Latitude & Longitude</Text>
                            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
                                <View style={{ flex: 1 }}>{renderFormField("Latitude", 'latitude', <Feather name="navigation" size={16} color="#9ca3af" />, "Lat")}</View>
                                <View style={{ flex: 1 }}>{renderFormField("Longitude", 'longitude', <Feather name="navigation-2" size={16} color="#9ca3af" />, "Long")}</View>
                                <TouchableOpacity 
                                    style={{ height: 44, width: 44, borderRadius: 8, backgroundColor: '#c1272d', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}
                                    onPress={handleGetCurrentLocation}
                                    disabled={isCapturingLocation}
                                >
                                    {isCapturingLocation ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="map-pin" size={18} color="#fff" />}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );

            case 5: // Documents Upload
                return (
                    <View style={styles.modalBodyPadding}>
                        <View style={styles.sectionDivider}>
                            <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>6</Text></View>
                            <Text style={styles.sectionLabel}>Proof of Installation</Text>
                        </View>
                        <View style={styles.formGrid}>
                            <View style={{ width: '100%', marginBottom: 20 }}>
                                <Text style={styles.formFieldLabel}>Installation Photo</Text>
                                <TouchableOpacity style={[styles.photoUploadBox, { width: '100%' }]} onPress={() => handleAddFileChoice((asset) => updateFormData('installationPhoto', asset))}>
                                    {formData.installationPhoto ? (
                                        <Image source={{ uri: formData.installationPhoto.uri }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                                    ) : (
                                        <><Feather name="camera" size={24} color="#9ca3af" /><Text style={styles.photoUploadText}>Capture Site Photo</Text></>
                                    )}
                                </TouchableOpacity>
                            </View>
                            
                            <View style={{ width: '100%', marginBottom: 16 }}>
                                <Text style={styles.formFieldLabel}>Installation Certificate (PDF/Image)</Text>
                                <TouchableOpacity style={styles.docPickerBtn} onPress={() => handleAddFileChoice((asset) => updateFormData('installationCertificate', asset), true)}>
                                    <Feather name="file-text" size={18} color="#ea580c" />
                                    <Text style={styles.docPickerText}>{formData.installationCertificate?.name || 'Pick Certificate'}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ width: '100%', marginBottom: 16 }}>
                                <Text style={styles.formFieldLabel}>JCC Document (PDF/Image)</Text>
                                <TouchableOpacity style={styles.docPickerBtn} onPress={() => handleAddFileChoice((asset) => updateFormData('jccDocument', asset), true)}>
                                    <Feather name="file-text" size={18} color="#ea580c" />
                                    <Text style={styles.docPickerText}>{formData.jccDocument?.name || 'Pick JCC Document'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );

            case 6: // Components
                return (
                    <View style={styles.modalBodyPadding}>
                        <View style={styles.sectionDivider}>
                            <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>7</Text></View>
                            <Text style={styles.sectionLabel}>Component Asset Details</Text>
                        </View>
                        <Text style={{ textAlign: 'center', marginVertical: 40, color: '#9ca3af' }}>No dynamic components required for this asset.</Text>
                    </View>
                );

            default: 
                return (
                    <View style={styles.modalBodyPadding}>
                        <Text>Unknown Step: {currentStep}</Text>
                    </View>
                );
        }
    };

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
                                                                <TouchableOpacity
                                                                    style={styles.iconBtnOutline}
                                                                    onPress={() => handleOpenEyeModal(inst.WorkOrderInstalledAssetDetailsId || inst.Id)}
                                                                >
                                                                    <Feather name="eye" size={14} color="#3b82f6" />
                                                                </TouchableOpacity>

                                                                {inst.MaterialVerificationStatus === 'Approved' || inst.MaterialVerificationStatus === 'Rejected' ? (
                                                                    <>
                                                                        <TouchableOpacity 
                                                                            style={styles.btnViewPhotos}
                                                                            onPress={() => handleViewPhotos(inst)}
                                                                        >
                                                                            <Feather name="image" size={14} color="#fff" />
                                                                            <Text style={styles.btnActionText}>VIEW PHOTOS</Text>
                                                                        </TouchableOpacity>
                                                                        {inst.MaterialVerificationStatus === 'Approved' && (
                                                                            <View style={styles.verifiedStamp}>
                                                                                <Ionicons name="checkmark-circle-outline" size={14} color="#10b981" />
                                                                                <Text style={styles.verifiedStampText}>VERIFIED BY OREDA</Text>
                                                                            </View>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {(userRoleId === '5' || userRoleId === '1') ? (
                                                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                                <TouchableOpacity style={styles.btnApprove} onPress={() => Alert.alert('Approve', `Approving installation #${inst.Id}`)}>
                                                                                    <Feather name="check-circle" size={14} color="#fff" />
                                                                                    <Text style={styles.btnActionText}>APPROVE</Text>
                                                                                </TouchableOpacity>
                                                                                <TouchableOpacity style={styles.btnReject} onPress={() => Alert.alert('Reject', `Rejecting installation #${inst.Id}`)}>
                                                                                    <Feather name="x-circle" size={14} color="#fff" />
                                                                                    <Text style={styles.btnActionText}>REJECT</Text>
                                                                                </TouchableOpacity>
                                                                            </View>
                                                                        ) : (
                                                                            <>
                                                                                <TouchableOpacity 
                                                                                    style={styles.modUploadBtn} 
                                                                                    onPress={() => handleOpenRMModal(inst, asset)}
                                                                                >
                                                                                    <Feather name="edit" size={12} color="#ea580c" />
                                                                                    <Text style={styles.modUploadText}>MODIFY / UPLOAD</Text>
                                                                                </TouchableOpacity>
                                                                                <TouchableOpacity 
                                                                                    style={styles.fillFormBtn}
                                                                                    onPress={() => handleFillForm(inst.WorkOrderInstalledAssetDetailsId || inst.Id || null, asset.AssetId || asset.Id || null, inst.WorkOrderInstalledAssetDraftId)}
                                                                                >
                                                                                    <Ionicons name="cube-outline" size={14} color="#3b82f6" />
                                                                                    <Text style={styles.fillFormText}>FILL FORM</Text>
                                                                                </TouchableOpacity>
                                                                            </>
                                                                        )}
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

                                    <TouchableOpacity 
                                        style={styles.addAnotherInstBtn}
                                        onPress={() => handleFillForm(null, asset.AssetId || asset.Id || null)}
                                    >
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

                    {/* Add Bank Guarantee Button */}
                    <TouchableOpacity style={styles.addBgBtn} onPress={() => setBgModalVisible(true)}>
                        <Feather name="plus-circle" size={16} color="#fff" />
                        <Text style={styles.addBgBtnText}>ADD BANK GUARANTEE</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>

            {/* BANK GUARANTEE UPLOAD MODAL */}
            <Modal
                visible={bgModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setBgModalVisible(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalHeaderTitle}>Upload Bank Guarantee</Text>
                        <TouchableOpacity onPress={() => setBgModalVisible(false)} style={styles.modalCloseBtn}>
                            <Feather name="x" size={24} color="#4b5563" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalScroll}>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Bank Details</Text>

                            <Text style={styles.formLabel}>Bank Name *</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g. State Bank of India"
                                value={bgForm.BankName}
                                onChangeText={v => setBgForm(p => ({ ...p, BankName: v }))}
                            />

                            <Text style={styles.formLabel}>BG Number *</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g. BG/2024/001"
                                value={bgForm.BGNumber}
                                onChangeText={v => setBgForm(p => ({ ...p, BGNumber: v }))}
                            />

                            <Text style={styles.formLabel}>Amount (₹) *</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g. 50000"
                                keyboardType="numeric"
                                value={bgForm.Amount}
                                onChangeText={v => setBgForm(p => ({ ...p, Amount: v }))}
                            />

                            <Text style={styles.formLabel}>Issue Date</Text>
                            <TouchableOpacity style={styles.formInput} onPress={() => setShowIssueDatePicker(true)}>
                                <Text style={{ color: '#374151' }}>{bgForm.IssueDate.toDateString()}</Text>
                            </TouchableOpacity>
                            {showIssueDatePicker && (
                                <DateTimePicker
                                    value={bgForm.IssueDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(_, date) => {
                                        setShowIssueDatePicker(false);
                                        if (date) setBgForm(p => ({ ...p, IssueDate: date }));
                                    }}
                                />
                            )}

                            <Text style={styles.formLabel}>Expiry Date</Text>
                            <TouchableOpacity style={styles.formInput} onPress={() => setShowExpiryDatePicker(true)}>
                                <Text style={{ color: '#374151' }}>{bgForm.ExpiryDate.toDateString()}</Text>
                            </TouchableOpacity>
                            {showExpiryDatePicker && (
                                <DateTimePicker
                                    value={bgForm.ExpiryDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(_, date) => {
                                        setShowExpiryDatePicker(false);
                                        if (date) setBgForm(p => ({ ...p, ExpiryDate: date }));
                                    }}
                                />
                            )}

                            <Text style={styles.formLabel}>Document (PDF / Image)</Text>
                            <TouchableOpacity style={styles.docPickerBtn} onPress={pickBGDocument}>
                                <Feather name="upload" size={18} color="#ea580c" />
                                <Text style={styles.docPickerText}>
                                    {bgForm.Document ? bgForm.Document.name : 'Tap to select document'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, bgSubmitting && { opacity: 0.6 }]}
                            onPress={handleSubmitBG}
                            disabled={bgSubmitting}
                        >
                            {bgSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Feather name="upload-cloud" size={18} color="#fff" />
                                    <Text style={styles.submitBtnText}>SUBMIT BANK GUARANTEE</Text>
                                </>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* FULL DETAILS MODAL */}
            <Modal
                visible={isImageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsImageModalVisible(false)}
            >
                <View style={styles.imageModalOverlay}>
                    <TouchableOpacity style={styles.imageModalClose} onPress={() => setIsImageModalVisible(false)}>
                        <Feather name="x" size={30} color="#fff" />
                    </TouchableOpacity>
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                        {selectedImages.map((uri, index) => (
                            <View key={index} style={styles.imageSlide}>
                                <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={false}
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
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.ProjectName)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Asset Name:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.AssetName)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Vendor Name:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.VendorName)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Beneficiary:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.BeneficiaryName)}</Text>
                                </View>
                            </View>

                            {/* 2. Installation Location */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Installation Location</Text>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>State:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.StateName)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>District:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.DistrictName)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Block:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.BlockName)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Gram Panchayat:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.GramPanchayatName)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Village:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.VillageName)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Pin Code:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.PinCode)}</Text>
                                </View>
                            </View>

                            {/* 3. Installation Details */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Installation Details</Text>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Status:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.InstallationStatus)}</Text>
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
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.CmcPeriodInYears)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Verification Status:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.VerificationStatus)}</Text>
                                </View>
                            </View>

                            {/* 4. Beneficiary */}
                            {installDetailsData.Beneficiary && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Beneficiary Details</Text>
                                    <View style={styles.modalFieldRow}>
                                        <Text style={styles.modalFieldLabel}>Full Name:</Text>
                                        <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.Beneficiary?.FullName)}</Text>
                                    </View>
                                    <View style={styles.modalFieldRow}>
                                        <Text style={styles.modalFieldLabel}>Father/Spouse:</Text>
                                        <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.Beneficiary?.FatherOrSpouseName)}</Text>
                                    </View>
                                    <View style={styles.modalFieldRow}>
                                        <Text style={styles.modalFieldLabel}>Phone Number:</Text>
                                        <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.Beneficiary?.PhoneNumber)}</Text>
                                    </View>
                                    <View style={styles.modalFieldRow}>
                                        <Text style={styles.modalFieldLabel}>Email:</Text>
                                        <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.Beneficiary?.Email)}</Text>
                                    </View>
                                </View>
                            )}

                            {/* 5. Tender & Work Order */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Tender & Work Order</Text>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Tender Number:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.Tender?.TenderNumber)}</Text>
                                </View>
                                <View style={styles.modalFieldRow}>
                                    <Text style={styles.modalFieldLabel}>Work Order No:</Text>
                                    <Text style={styles.modalFieldValue}>{safeVal(installDetailsData.ProjectAsset?.WorkOrderNumber)}</Text>
                                </View>
                            </View>

                            {/* 6. Asset Components */}
                            {Array.isArray(installDetailsData.AssetComponents?.Categories) && installDetailsData.AssetComponents.Categories.map((cat: any, cIdx: number) => (
                                <View key={`cat-${cIdx}`} style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>{safeVal(cat.CategoryName) || 'Asset Component'}</Text>
                                    {Array.isArray(cat.Headers) && cat.Headers.map((header: any, hIdx: number) => (
                                        <View key={`head-${hIdx}`} style={styles.modalFieldRow}>
                                            <Text style={styles.modalFieldLabel}>{safeVal(header.HeaderName)}:</Text>
                                            <Text style={styles.modalFieldValueDark}>{safeVal(header.DisplayValue)}</Text>
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
                    ) : (
                        <View style={styles.centerContainer}>
                            <Feather name="alert-circle" size={40} color="#9ca3af" />
                            <Text style={{ marginTop: 12, color: '#6b7280', fontSize: 16 }}>No Details Found</Text>
                            <Text style={{ marginTop: 4, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 40 }}>
                                We couldn't retrieve the extended details for this record at this time.
                            </Text>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>

            {/* FILL FORM MODAL */}
            <Modal
                visible={isFormModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsFormModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <LinearGradient colors={['#c1272d', '#8b1a1a']} style={styles.modalHeader}>
                            <View style={styles.modalHeaderIcon}>
                                <Feather name="edit-3" size={20} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>{getModalHeader().title}</Text>
                                <Text style={styles.modalSubtitle}>{getModalHeader().subtitle} • Step {currentStep + 1} of 7</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsFormModalVisible(false)}>
                                <Feather name="x" size={24} color="#fff" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView 
                            style={styles.modalBody} 
                            contentContainerStyle={{ flexGrow: 1 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {renderStepContent()}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.btnCancel} 
                                onPress={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setIsFormModalVisible(false)}
                            >
                                <Text style={styles.btnCancelText}>{currentStep === 0 ? 'Cancel' : 'Back'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSaveNext} onPress={handleNextStep}>
                                <Text style={styles.btnSaveNextText}>{currentStep === 6 ? 'Finish & Submit' : 'Save & Next'}</Text>
                                <Feather name="arrow-right" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* SELECTION MODAL */}
            <Modal
                visible={isSelectionModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsSelectionModalVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.selectionOverlay} 
                    activeOpacity={1} 
                    onPress={() => setIsSelectionModalVisible(false)}
                >
                    <View style={styles.selectionContent}>
                        <View style={styles.selectionHeader}>
                            <Text style={styles.selectionTitle}>{selectionTitle}</Text>
                            <TouchableOpacity onPress={() => setIsSelectionModalVisible(false)}>
                                <Feather name="x" size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.selectionScroll}>
                            {selectionData.map((item, idx) => (
                                <TouchableOpacity 
                                    key={idx} 
                                    style={styles.selectionItem}
                                    onPress={() => {
                                        updateFormData(selectionKey, item.Id);
                                        setIsSelectionModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.selectionText, (formData as any)[selectionKey] === item.Id && styles.selectionTextSelected]}>
                                        {item.Name}
                                    </Text>
                                    {(formData as any)[selectionKey] === item.Id && <Feather name="check" size={16} color="#c1272d" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* FILE SOURCE MODAL */}
            <Modal
                visible={isFileSourceVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsFileSourceVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.selectionContentWide}>
                        <View style={styles.selectionHeader}>
                            <Text style={styles.selectionTitle}>Select Resource</Text>
                            <TouchableOpacity onPress={() => setIsFileSourceVisible(false)}>
                                <Feather name="x" size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sourceGrid}>
                            <TouchableOpacity style={styles.sourceItem} onPress={() => { setIsFileSourceVisible(false); handleTakePhoto(onFileSourceSelected); }}>
                                <View style={[styles.sourceIconBox, { backgroundColor: '#fee2e2' }]}>
                                    <Feather name="camera" size={24} color="#dc2626" />
                                </View>
                                <Text style={styles.sourceText}>Camera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.sourceItem} onPress={() => { setIsFileSourceVisible(false); handlePickFromGallery(onFileSourceSelected); }}>
                                <View style={[styles.sourceIconBox, { backgroundColor: '#dcfce7' }]}>
                                    <Feather name="image" size={24} color="#16a34a" />
                                </View>
                                <Text style={styles.sourceText}>Gallery</Text>
                            </TouchableOpacity>
                            {allowSourceDocuments && (
                                <TouchableOpacity style={styles.sourceItem} onPress={() => { setIsFileSourceVisible(false); /* Document picker logic */ }}>
                                    <View style={[styles.sourceIconBox, { backgroundColor: '#dbeafe' }]}>
                                        <Feather name="file" size={24} color="#2563eb" />
                                    </View>
                                    <Text style={styles.sourceText}>Document</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>


            {/* RAW MATERIAL MODAL */}
            <Modal
                visible={isRmModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsRmModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <LinearGradient colors={['#ea580c', '#c2410c']} style={styles.modalHeader}>
                            <View style={styles.modalHeaderIcon}>
                                <Feather name="package" size={20} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>Material Verification</Text>
                                <Text style={styles.modalSubtitle}>Raw Material Photos</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsRmModalVisible(false)}>
                                <Feather name="x" size={24} color="#fff" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView 
                            style={styles.modalBody} 
                            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {selectedInstRM && (
                                <View style={styles.modalBodyPadding}>
                                    {/* Asset Info Summary */}
                                    <View style={[styles.sectionDivider, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}>
                                        <View style={[styles.sectionBadge, { backgroundColor: '#ffedd5' }]}>
                                            <MaterialCommunityIcons name="information" size={14} color="#ea580c" />
                                        </View>
                                        <Text style={[styles.sectionLabel, { color: '#ea580c' }]}>Asset Verification Context</Text>
                                    </View>

                                    <View style={styles.formGrid}>
                                        <View style={{ width: '100%', marginBottom: 16 }}>
                                            <Text style={styles.formFieldLabel}>Work Order / Project</Text>
                                            <View style={styles.fieldValueBox}>
                                                <Text style={styles.fieldValueText}>{workOrder?.WONumber} • {workOrder?.ProjectName}</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={{ width: '100%', marginBottom: 16 }}>
                                            <Text style={styles.formFieldLabel}>Asset Name</Text>
                                            <View style={styles.fieldValueBox}>
                                                <Text style={styles.fieldValueText}>{selectedInstRM.asset?.AssetName}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.formFieldRow}>
                                            <Text style={styles.formFieldLabel}>Asset Type</Text>
                                            <View style={styles.fieldValueBox}>
                                                <Text style={styles.fieldValueText}>{selectedInstRM.asset?.AssetType?.[0]?.Name || 'N/A'}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.formFieldRow}>
                                            <Text style={styles.formFieldLabel}>Asset Sub Type</Text>
                                            <View style={styles.fieldValueBox}>
                                                <Text style={styles.fieldValueText}>{selectedInstRM.asset?.AssetType?.[0]?.AssetSubType?.[0]?.Name || 'N/A'}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Photo Gallery */}
                                    <View style={[styles.sectionDivider, { marginTop: 8 }]}>
                                        <View style={styles.sectionBadge}><Feather name="image" size={12} color="#3b82f6" /></View>
                                        <Text style={styles.sectionLabel}>Uploaded Photos ({rmPhotos.length})</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                                        {rmPhotos.map((photo, pIdx) => (
                                            <View key={`rm-p-${pIdx}`} style={{ position: 'relative' }}>
                                                <Image 
                                                    source={{ uri: photo.uri }} 
                                                    style={{ width: (width - 80) / 3, height: (width - 80) / 3, borderRadius: 8, backgroundColor: '#f3f4f6' }} 
                                                />
                                                {!photo.isExisting && (
                                                    <TouchableOpacity 
                                                        style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#dc2626', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}
                                                        onPress={() => handleRemoveRMPhoto(pIdx)}
                                                    >
                                                        <Feather name="x" size={12} color="#fff" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                        
                                        <TouchableOpacity 
                                            style={[styles.photoUploadBox, { width: (width - 80) / 3, height: (width - 80) / 3, marginTop: 0 }]}
                                            onPress={() => handleAddFileChoice(handleAddRMPhoto)}
                                        >
                                            <Feather name="plus" size={24} color="#9ca3af" />
                                            <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 4 }}>Add Photo</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.btnCancel} 
                                onPress={() => setIsRmModalVisible(false)}
                            >
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.btnSaveNext, { backgroundColor: '#ea580c' }]} 
                                onPress={handleSaveRM}
                                disabled={isSavingRM}
                            >
                                {isSavingRM ? <ActivityIndicator size="small" color="#fff" /> : (
                                    <>
                                        <Text style={styles.btnSaveNextText}>Save Verification</Text>
                                        <Feather name="check" size={16} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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

    // BG Upload Button & Form
    addBgBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#c1272d', paddingVertical: 14, borderRadius: 12, marginTop: 16 },
    addBgBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    formLabel: { fontSize: 12, color: '#374151', fontWeight: '600', marginBottom: 6, marginTop: 12 },
    formInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
    docPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 8, padding: 14, marginTop: 2 },
    docPickerText: { fontSize: 13, color: '#ea580c', flex: 1 },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#c1272d', paddingVertical: 16, borderRadius: 12, marginTop: 8, marginBottom: 20 },
    submitBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

    // Form Field Styles
    formGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
    formFieldRow: { width: isMobile ? '100%' : '50%', paddingHorizontal: 8, marginBottom: 12 },
    formFieldLabel: { fontSize: 11, fontWeight: '500', color: '#4b5563', marginBottom: 6 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#fff', paddingHorizontal: 12 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 8, fontSize: 13, color: '#111827' },
    dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8 },
    dropdownValue: { fontSize: 13, color: '#111827' },
    sectionDivider: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 12, gap: 10, borderWidth: 1, borderColor: '#f1f5f9' },
    sectionBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
    sectionBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#3b82f6' },
    sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#3b82f6' },
    photoUploadBox: { width: 120, height: 120, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', marginTop: 8 },
    photoUploadIcon: { marginBottom: 8 },
    photoUploadText: { fontSize: 10, color: '#9ca3af' },
    btnUploadBG: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f97316' },
    btnUploadBGText: { fontSize: 12, color: '#f97316', fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: isMobile ? '95%' : 600, minHeight: 500, maxHeight: '95%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 5 },
    modalHeaderIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    modalSubtitle: { fontSize: 12, color: '#fff', opacity: 0.8 },
    modalBody: { flex: 1, backgroundColor: '#f8fafc' },
    modalFooter: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff', justifyContent: 'space-between' },
    btnCancel: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    btnCancelText: { color: '#6b7280', fontSize: 14, fontWeight: 'bold' },
    btnSaveNext: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, gap: 8 },
    btnSaveNextText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    selectionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    selectionContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%' },
    selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    selectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    selectionScroll: { padding: 8 },
    selectionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    selectionText: { fontSize: 14, color: '#374151' },
    selectionTextSelected: { fontWeight: 'bold', color: '#c1272d' },
    selectionContentWide: { backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 0, overflow: 'hidden' },
    sourceGrid: { flexDirection: 'row', padding: 20, gap: 20, justifyContent: 'center' },
    sourceItem: { alignItems: 'center', gap: 8 },
    sourceIconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    sourceText: { fontSize: 12, fontWeight: '500', color: '#4b5563' },
    sourceCancelBtn: { padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', alignItems: 'center' },
    sourceCancelText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
    fieldContainer: { marginBottom: 16 },
    fieldLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    fieldLabel: { fontSize: 12, fontWeight: 'bold', color: '#6b7280', marginLeft: 6 },
    fieldValueBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12 },
    fieldIconBox: { width: 32, height: 32, borderRadius: 6, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    fieldValueText: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 },
    imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    imageModalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
    imageSlide: { width, height: '100%', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '90%', height: '80%' },
    btnApprove: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, gap: 4 },
    btnReject: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dc2626', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, gap: 4 },
    btnViewPhotos: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, gap: 4, marginTop: 8 },
    btnActionText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    modalBodyPadding: { padding: 16 },
});

export default WorkOrderDetailsScreen;
